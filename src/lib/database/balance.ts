import { query, getClient, initDatabaseSchema } from "./db";

let isBalanceTableInitialized = false;

export async function initBalanceTable(): Promise<void> {
  if (isBalanceTableInitialized) return;
  await initDatabaseSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS user_balances (
      user_id VARCHAR(128) PRIMARY KEY,
      balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  isBalanceTableInitialized = true;
}

/**
 * Get available balance for a user in PostgreSQL ledger.
 * Auto-migrates legacy Firestore balance if user row does not exist yet.
 */
export async function getUserBalance(userId: string): Promise<number> {
  await initBalanceTable();
  const res = await query(
    `SELECT balance FROM user_balances WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  if (res.rows.length > 0) {
    return Number(res.rows[0].balance || 0);
  }

  // Attempt migration from legacy Firestore wallet if available
  let legacyBalance = 0;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpointid";
    const fsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/wallet/info`,
      { cache: "no-store" }
    );
    if (fsRes.ok) {
      const fsData = await fsRes.json();
      legacyBalance = Number(
        fsData.fields?.balance?.integerValue ||
        fsData.fields?.balance?.doubleValue ||
        0
      );
    }
  } catch (_) {}

  const finalBalance = Math.max(0, legacyBalance);
  await query(
    `INSERT INTO user_balances (user_id, balance, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (user_id) DO NOTHING`,
    [userId, finalBalance]
  );
  return finalBalance;
}

/**
 * Credit/Deposit balance to a user's account
 */
export async function addUserBalance(userId: string, amount: number): Promise<number> {
  await initBalanceTable();
  const res = await query(
    `
    INSERT INTO user_balances (user_id, balance, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = user_balances.balance + EXCLUDED.balance,
      updated_at = CURRENT_TIMESTAMP
    RETURNING balance;
  `,
    [userId, Math.max(0, amount)]
  );
  return Number(res.rows[0].balance || 0);
}

/**
 * Atomically check and deduct balance using row-level locking (FOR UPDATE)
 * Guarantees zero race conditions / double-spending
 */
export async function deductUserBalance(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number; message?: string }> {
  await initBalanceTable();
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const selRes = await client.query(
      `SELECT balance FROM user_balances WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    const currentBalance = selRes.rows.length > 0 ? Number(selRes.rows[0].balance || 0) : 0;

    if (currentBalance < amount) {
      await client.query("ROLLBACK");
      return {
        success: false,
        balance: currentBalance,
        message: `Saldo tidak mencukupi. Saldo Anda: Rp ${currentBalance.toLocaleString("id-ID")}, Dibutuhkan: Rp ${amount.toLocaleString("id-ID")}`,
      };
    }

    const updRes = await client.query(
      `
      UPDATE user_balances
      SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING balance;
    `,
      [userId, amount]
    );

    await client.query("COMMIT");
    return {
      success: true,
      balance: Number(updRes.rows[0].balance || 0),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
