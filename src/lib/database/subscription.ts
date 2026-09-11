import { query, initDatabaseSchema } from "./db";

export interface ShopSubscription {
  shopId: string;
  planId: "free" | "plus" | "pro" | "prime";
  planName: string;
  billingCycle: "monthly" | "yearly";
  maxProducts: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  subscribedAt?: string;
  expiresAt?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  plus: 50,
  pro: 100,
  prime: -1, // Unlimited
};

const PLAN_NAMES: Record<string, string> = {
  free: "Gratis",
  plus: "Plus",
  pro: "Pro",
  prime: "Prime",
};

export async function getShopSubscription(shopId: string): Promise<ShopSubscription> {
  try {
    await initDatabaseSchema();
    const sql = `
      SELECT 
        shop_id as "shopId", plan_id as "planId", plan_name as "planName",
        billing_cycle as "billingCycle", max_products as "maxProducts",
        status, subscribed_at as "subscribedAt", expires_at as "expiresAt"
      FROM shop_subscriptions
      WHERE shop_id = $1
    `;
    const res = await query(sql, [shopId]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        ...row,
        maxProducts: Number(row.maxProducts),
      };
    }
  } catch (err) {
    console.warn("[GET SUBSCRIPTION DB WARN]", err);
  }

  // Default fallback
  return {
    shopId,
    planId: "free",
    planName: "Gratis",
    billingCycle: "monthly",
    maxProducts: 10,
    status: "ACTIVE",
  };
}

export async function updateShopSubscription(
  shopId: string,
  planId: "plus" | "pro" | "prime",
  billingCycle: "monthly" | "yearly" = "monthly"
): Promise<ShopSubscription> {
  await initDatabaseSchema();

  const planName = PLAN_NAMES[planId] || "Plus";
  const maxProducts = PLAN_LIMITS[planId] ?? 50;

  const now = new Date();
  const expiresAt = new Date();
  if (billingCycle === "yearly") {
    expiresAt.setFullYear(now.getFullYear() + 1);
  } else {
    expiresAt.setMonth(now.getMonth() + 1);
  }

  const sql = `
    INSERT INTO shop_subscriptions (
      shop_id, plan_id, plan_name, billing_cycle, max_products, status, subscribed_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', CURRENT_TIMESTAMP, $6)
    ON CONFLICT (shop_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      plan_name = EXCLUDED.plan_name,
      billing_cycle = EXCLUDED.billing_cycle,
      max_products = EXCLUDED.max_products,
      status = 'ACTIVE',
      subscribed_at = CURRENT_TIMESTAMP,
      expires_at = EXCLUDED.expires_at
    RETURNING 
      shop_id as "shopId", plan_id as "planId", plan_name as "planName",
      billing_cycle as "billingCycle", max_products as "maxProducts",
      status, subscribed_at as "subscribedAt", expires_at as "expiresAt"
  `;

  const res = await query(sql, [shopId, planId, planName, billingCycle, maxProducts, expiresAt.toISOString()]);
  const row = res.rows[0];

  return {
    ...row,
    maxProducts: Number(row.maxProducts),
  };
}
