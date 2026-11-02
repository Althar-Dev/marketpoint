import { query, getClient, initDatabaseSchema } from "./db";
import { firebaseConfig } from "@/firebase/config";

export interface ShopBalance {
  shopId: string;
  activeBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  totalWithdrawn: number;
  bankInfo?: any;
  updatedAt: string;
}

let isShopBalanceInitialized = false;

export async function initShopBalanceTable(): Promise<void> {
  if (isShopBalanceInitialized) return;
  await initDatabaseSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS shop_balances (
      shop_id VARCHAR(128) PRIMARY KEY,
      active_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      pending_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
      bank_info JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  isShopBalanceInitialized = true;
}

/**
 * Get balance for a specific shop.
 */
export async function getShopBalance(shopId: string): Promise<ShopBalance> {
  await initShopBalanceTable();
  // Check existing row in shop_balances
  const res = await query(
    `SELECT * FROM shop_balances WHERE shop_id = $1 LIMIT 1`,
    [shopId]
  );

  // Reconcile with actual completed/settled transactions in PostgreSQL
  let settledSum = 0;
  let pendingSum = 0;
  let totalRev = 0;
  try {
    const txAgg = await query(
      `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN status = 'SETTLED' OR (status IN ('PAID', 'COMPLETED') AND (CURRENT_TIMESTAMP - created_at) >= INTERVAL '3 days') 
          THEN COALESCE(net_amount, items_subtotal - COALESCE(discount, 0) - COALESCE(platform_fee, 0)) 
          ELSE 0 
        END), 0) as settled_sum,
        COALESCE(SUM(CASE 
          WHEN status IN ('PAID', 'COMPLETED') AND (CURRENT_TIMESTAMP - created_at) < INTERVAL '3 days' 
          THEN COALESCE(net_amount, items_subtotal - COALESCE(discount, 0) - COALESCE(platform_fee, 0)) 
          ELSE 0 
        END), 0) as pending_sum,
        COALESCE(SUM(CASE 
          WHEN status IN ('PAID', 'SETTLED', 'COMPLETED') 
          THEN COALESCE(net_amount, items_subtotal - COALESCE(discount, 0) - COALESCE(platform_fee, 0)) 
          ELSE 0 
        END), 0) as total_rev
      FROM transactions 
      WHERE shop_id = $1;
      `,
      [shopId]
    );
    settledSum = Number(txAgg.rows[0]?.settled_sum || 0);
    pendingSum = Number(txAgg.rows[0]?.pending_sum || 0);
    totalRev = Number(txAgg.rows[0]?.total_rev || 0);
  } catch (aggErr) {
    console.warn("[SHOP BALANCE RECONCILE WARN]", aggErr);
  }

  if (res.rows.length > 0) {
    const row = res.rows[0];
    const currentActive = Number(row.active_balance || 0);
    const currentWithdrawn = Number(row.total_withdrawn || 0);
    const expectedActive = Math.max(0, settledSum - currentWithdrawn);

    // If active balance in DB is less than verified settled transactions, reconcile it:
    if (expectedActive > currentActive || totalRev > Number(row.total_revenue || 0)) {
      const updated = await query(
        `
        UPDATE shop_balances
        SET active_balance = GREATEST(active_balance, $2),
            pending_balance = GREATEST(pending_balance, $3),
            total_revenue = GREATEST(total_revenue, $4),
            updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $1
        RETURNING *;
        `,
        [shopId, expectedActive, pendingSum, Math.max(totalRev, Number(row.total_revenue || 0))]
      );
      if (updated.rows.length > 0) {
        const uRow = updated.rows[0];
        return {
          shopId: uRow.shop_id,
          activeBalance: Number(uRow.active_balance || 0),
          pendingBalance: Number(uRow.pending_balance || 0),
          totalRevenue: Number(uRow.total_revenue || 0),
          totalWithdrawn: Number(uRow.total_withdrawn || 0),
          bankInfo: uRow.bank_info,
          updatedAt: uRow.updated_at,
        };
      }
    }

    return {
      shopId: row.shop_id,
      activeBalance: Number(row.active_balance || 0),
      pendingBalance: Number(row.pending_balance || 0),
      totalRevenue: Number(row.total_revenue || 0),
      totalWithdrawn: Number(row.total_withdrawn || 0),
      bankInfo: row.bank_info,
      updatedAt: row.updated_at,
    };
  }

  // Attempt migration from legacy Firestore user wallet if shopId was owner UID
  let legacyPending = 0;
  let legacyRevenue = 0;
  try {
    const projectId = firebaseConfig.projectId || "marketpointid";
    const fsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${shopId}/wallet/info`,
      { cache: "no-store" }
    );
    if (fsRes.ok) {
      const fsData = await fsRes.json();
      legacyPending = Number(
        fsData.fields?.pendingBalance?.integerValue ||
        fsData.fields?.pendingBalance?.doubleValue ||
        0
      );
      legacyRevenue = Number(
        fsData.fields?.totalRevenue?.integerValue ||
        fsData.fields?.totalRevenue?.doubleValue ||
        0
      );
    }
  } catch (_) {}

  const insRes = await query(
    `
    INSERT INTO shop_balances (shop_id, active_balance, pending_balance, total_revenue, total_withdrawn, updated_at)
    VALUES ($1, $2, $3, $4, 0.00, CURRENT_TIMESTAMP)
    ON CONFLICT (shop_id) DO UPDATE SET 
      active_balance = GREATEST(shop_balances.active_balance, EXCLUDED.active_balance),
      pending_balance = GREATEST(shop_balances.pending_balance, EXCLUDED.pending_balance),
      total_revenue = GREATEST(shop_balances.total_revenue, EXCLUDED.total_revenue),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `,
    [
      shopId,
      Math.max(0, settledSum),
      Math.max(0, pendingSum, legacyPending),
      Math.max(0, totalRev, legacyRevenue),
    ]
  );

  const row = insRes.rows[0];
  return {
    shopId: row.shop_id,
    activeBalance: Number(row.active_balance || 0),
    pendingBalance: Number(row.pending_balance || 0),
    totalRevenue: Number(row.total_revenue || 0),
    totalWithdrawn: Number(row.total_withdrawn || 0),
    bankInfo: row.bank_info,
    updatedAt: row.updated_at,
  };
}

/**
 * Credit sales revenue to a shop.
 * Automatically adds to pending_balance and total_revenue.
 */
export async function creditShopSales(
  shopId: string,
  netAmount: number,
  isImmediateActive: boolean = false
): Promise<ShopBalance> {
  await initShopBalanceTable();
  const safeAmount = Math.max(0, netAmount);

  const res = await query(
    `
    INSERT INTO shop_balances (shop_id, active_balance, pending_balance, total_revenue, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (shop_id) DO UPDATE SET
      active_balance = shop_balances.active_balance + $2,
      pending_balance = shop_balances.pending_balance + $3,
      total_revenue = shop_balances.total_revenue + $4,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `,
    [
      shopId,
      isImmediateActive ? safeAmount : 0,
      isImmediateActive ? 0 : safeAmount,
      safeAmount,
    ]
  );

  const row = res.rows[0];
  return {
    shopId: row.shop_id,
    activeBalance: Number(row.active_balance || 0),
    pendingBalance: Number(row.pending_balance || 0),
    totalRevenue: Number(row.total_revenue || 0),
    totalWithdrawn: Number(row.total_withdrawn || 0),
    bankInfo: row.bank_info,
    updatedAt: row.updated_at,
  };
}

/**
 * Settle pending balance into active balance after warranty period passes.
 */
export async function settleShopPendingBalance(
  shopId: string,
  amount: number
): Promise<{ success: boolean; activeBalance: number; pendingBalance: number; message?: string }> {
  await initShopBalanceTable();
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const selRes = await client.query(
      `SELECT active_balance, pending_balance FROM shop_balances WHERE shop_id = $1 FOR UPDATE`,
      [shopId]
    );

    if (selRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, activeBalance: 0, pendingBalance: 0, message: "Toko tidak ditemukan." };
    }

    const currentPending = Number(selRes.rows[0].pending_balance || 0);
    const settleAmount = Math.min(amount, currentPending);

    if (settleAmount <= 0) {
      await client.query("ROLLBACK");
      return { success: true, activeBalance: Number(selRes.rows[0].active_balance || 0), pendingBalance: currentPending };
    }

    const updRes = await client.query(
      `
      UPDATE shop_balances
      SET
        pending_balance = pending_balance - $2,
        active_balance = active_balance + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE shop_id = $1
      RETURNING active_balance, pending_balance;
    `,
      [shopId, settleAmount]
    );

    await client.query("COMMIT");
    return {
      success: true,
      activeBalance: Number(updRes.rows[0].active_balance || 0),
      pendingBalance: Number(updRes.rows[0].pending_balance || 0),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Withdraw active balance from shop revenue to external bank account.
 * Uses atomic Row-Level Locking (FOR UPDATE) to prevent race conditions.
 */
export async function withdrawShopBalance(
  shopId: string,
  amount: number
): Promise<{ success: boolean; activeBalance: number; message?: string }> {
  await initShopBalanceTable();
  if (amount <= 0) {
    return { success: false, activeBalance: 0, message: "Nominal penarikan harus lebih dari 0." };
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const selRes = await client.query(
      `SELECT active_balance FROM shop_balances WHERE shop_id = $1 FOR UPDATE`,
      [shopId]
    );

    if (selRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, activeBalance: 0, message: "Toko tidak ditemukan." };
    }

    const currentActive = Number(selRes.rows[0].active_balance || 0);
    if (currentActive < amount) {
      await client.query("ROLLBACK");
      return {
        success: false,
        activeBalance: currentActive,
        message: `Saldo aktif toko tidak mencukupi. Saldo aktif: Rp ${currentActive.toLocaleString("id-ID")}, Diminta: Rp ${amount.toLocaleString("id-ID")}`,
      };
    }

    const updRes = await client.query(
      `
      UPDATE shop_balances
      SET
        active_balance = active_balance - $2,
        total_withdrawn = total_withdrawn + $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE shop_id = $1
      RETURNING active_balance;
    `,
      [shopId, amount]
    );

    await client.query("COMMIT");
    return {
      success: true,
      activeBalance: Number(updRes.rows[0].active_balance || 0),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
