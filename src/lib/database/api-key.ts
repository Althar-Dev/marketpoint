import crypto from "crypto";
import { query, initDatabaseSchema } from "./db";

export interface UserApiKeyRecord {
  id: string;
  userId: string;
  apiKey: string;
  status: "ACTIVE" | "INACTIVE";
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a cryptographically secure API Key
 * Format: mp_live_<32 hex chars>
 */
export function generateApiKey(): string {
  const randomHex = crypto.randomBytes(16).toString("hex");
  return `mp_live_${randomHex}`;
}

/**
 * Get or automatically provision an active API Key for a user
 */
export async function getOrCreateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  await initDatabaseSchema();

  const findSql = `
    SELECT 
      id,
      user_id AS "userId",
      api_key AS "apiKey",
      status,
      last_used_at AS "lastUsedAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM user_api_keys
    WHERE user_id = $1
    LIMIT 1
  `;

  const existingRes = await query(findSql, [userId]);
  if (existingRes.rows.length > 0) {
    return existingRes.rows[0];
  }

  // Provision new key
  const newKey = generateApiKey();
  const insertSql = `
    INSERT INTO user_api_keys (user_id, api_key, status)
    VALUES ($1, $2, 'ACTIVE')
    ON CONFLICT (user_id) DO UPDATE SET
      updated_at = CURRENT_TIMESTAMP
    RETURNING 
      id,
      user_id AS "userId",
      api_key AS "apiKey",
      status,
      last_used_at AS "lastUsedAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const insertRes = await query(insertSql, [userId, newKey]);
  return insertRes.rows[0];
}

/**
 * Rotate / regenerate a user's API Key
 */
export async function rotateUserApiKey(userId: string): Promise<UserApiKeyRecord> {
  await initDatabaseSchema();

  const newKey = generateApiKey();
  const updateSql = `
    INSERT INTO user_api_keys (user_id, api_key, status, updated_at)
    VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      api_key = EXCLUDED.api_key,
      status = 'ACTIVE',
      updated_at = CURRENT_TIMESTAMP
    RETURNING 
      id,
      user_id AS "userId",
      api_key AS "apiKey",
      status,
      last_used_at AS "lastUsedAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const res = await query(updateSql, [userId, newKey]);
  return res.rows[0];
}

/**
 * Validate an API key for incoming H2H API orders
 * Updates last_used_at timestamp on successful validation
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; userId?: string; status?: string }> {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false };
  }

  const cleanKey = apiKey.trim();
  if (!cleanKey.startsWith("mp_live_") && !cleanKey.startsWith("mp_test_")) {
    return { valid: false };
  }

  await initDatabaseSchema();

  const sql = `
    UPDATE user_api_keys
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE api_key = $1 AND status = 'ACTIVE'
    RETURNING user_id AS "userId", status
  `;

  const res = await query(sql, [cleanKey]);
  if (res.rows.length === 0) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: res.rows[0].userId,
    status: res.rows[0].status,
  };
}
