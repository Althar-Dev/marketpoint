import { query, initDatabaseSchema } from "./db";
import { getPlatformSettings } from "./settings";

export interface ShopSubscription {
  shopId: string;
  planId: "free" | "plus" | "pro" | "prime";
  planName: string;
  billingCycle: "monthly" | "yearly";
  maxProducts: number;
  commissionRate: number;
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
  let settings;
  try {
    settings = await getPlatformSettings();
  } catch {
    settings = null;
  }

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
      const plan = (row.planId || "free") as "free" | "plus" | "pro" | "prime";
      const rate = settings?.commissions?.[plan] ?? (plan === "prime" ? 2.0 : plan === "pro" ? 3.5 : plan === "plus" ? 5.0 : 7.0);
      return {
        ...row,
        maxProducts: Number(row.maxProducts),
        commissionRate: rate,
      };
    }
  } catch (err) {
    console.warn("[GET SUBSCRIPTION DB WARN]", err);
  }

  // Default fallback
  const defaultRate = settings?.commissions?.free ?? 7.0;
  return {
    shopId,
    planId: "free",
    planName: "Gratis",
    billingCycle: "monthly",
    maxProducts: 10,
    commissionRate: defaultRate,
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

  let rate = 7.0;
  try {
    const settings = await getPlatformSettings();
    rate = settings.commissions[planId] ?? (planId === "prime" ? 2.0 : planId === "pro" ? 3.5 : 5.0);
  } catch {
    rate = planId === "prime" ? 2.0 : planId === "pro" ? 3.5 : 5.0;
  }

  return {
    ...row,
    maxProducts: Number(row.maxProducts),
    commissionRate: rate,
  };
}

export async function getAllShopSubscriptions(): Promise<ShopSubscription[]> {
  try {
    await initDatabaseSchema();
    const settings = await getPlatformSettings();
    const sql = `
      SELECT 
        shop_id as "shopId", plan_id as "planId", plan_name as "planName",
        billing_cycle as "billingCycle", max_products as "maxProducts",
        status, subscribed_at as "subscribedAt", expires_at as "expiresAt"
      FROM shop_subscriptions
      ORDER BY subscribed_at DESC
    `;
    const res = await query(sql);
    return res.rows.map(row => {
      const plan = (row.planId || "free") as "free" | "plus" | "pro" | "prime";
      const rate = settings.commissions[plan] ?? (plan === "prime" ? 2.0 : plan === "pro" ? 3.5 : plan === "plus" ? 5.0 : 7.0);
      return {
        ...row,
        maxProducts: Number(row.maxProducts),
        commissionRate: rate,
      };
    });
  } catch (err) {
    console.error("[GET ALL SUBSCRIPTIONS ERROR]", err);
    return [];
  }
}

export async function adminCancelShopSubscription(shopId: string): Promise<boolean> {
  try {
    await initDatabaseSchema();
    const sql = `
      UPDATE shop_subscriptions
      SET status = 'CANCELLED'
      WHERE shop_id = $1
    `;
    const res = await query(sql, [shopId]);
    return (res.rowCount || 0) > 0;
  } catch (err) {
    console.error("[ADMIN CANCEL SUBSCRIPTION ERROR]", err);
    return false;
  }
}
