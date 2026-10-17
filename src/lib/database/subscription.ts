import { query, initDatabaseSchema } from "./db";
import { getPlatformSettings } from "./settings";

export interface ShopSubscription {
  shopId: string;
  planId: "free" | "plus" | "pro" | "prime" | "admin";
  planName: string;
  billingCycle: "monthly" | "yearly";
  maxProducts: number;
  commissionRate: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  subscribedAt?: string;
  expiresAt?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  plus: 15,
  pro: 40,
  prime: -1, // Unlimited
  admin: -1, // Admin Full Unlock Unlimited
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  prime: "Prime",
  admin: "Admin Full Unlock",
};

export async function getShopSubscription(shopId: string): Promise<ShopSubscription> {
  let settings;
  try {
    settings = await getPlatformSettings();
  } catch {
    settings = null;
  }

  const freePlanConfig = settings?.plans?.find((p: any) => p.id === "free");
  const defaultFreeLimit = typeof freePlanConfig?.maxProducts === "number" ? freePlanConfig.maxProducts : 5;
  const defaultRate = settings?.commissions?.free ?? 7.0;

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
      const plan = (row.planId || "free") as "free" | "plus" | "pro" | "prime" | "admin";
      const rate = plan === "admin" ? 0.0 : (settings?.commissions?.[plan] ?? (plan === "prime" ? 2.0 : plan === "pro" ? 3.5 : plan === "plus" ? 5.0 : 7.0));
      const planConfig = settings?.plans?.find((p: any) => p.id === plan);
      const activeMaxProducts = plan === "admin" ? -1 : (typeof planConfig?.maxProducts === "number" ? planConfig.maxProducts : Number(row.maxProducts));
      return {
        ...row,
        maxProducts: activeMaxProducts,
        commissionRate: rate,
      };
    }
  } catch (err) {
    console.warn("[GET SUBSCRIPTION DB WARN]", err);
  }

  // Default fallback
  return {
    shopId,
    planId: "free",
    planName: freePlanConfig?.name || "Free",
    billingCycle: "monthly",
    maxProducts: defaultFreeLimit,
    commissionRate: defaultRate,
    status: "ACTIVE",
  };
}

export async function updateShopSubscription(
  shopId: string,
  planId: "free" | "plus" | "pro" | "prime" | "admin",
  billingCycle: "monthly" | "yearly" = "monthly"
): Promise<ShopSubscription> {
  await initDatabaseSchema();

  let settings;
  try {
    settings = await getPlatformSettings();
  } catch {
    settings = null;
  }

  const matchedPlan = settings?.plans?.find((p: any) => p.id === planId);
  const planName = matchedPlan?.name || PLAN_NAMES[planId] || (planId === "admin" ? "Admin Full Unlock" : "Plus");
  const maxProducts = planId === "admin" ? -1 : (typeof matchedPlan?.maxProducts === "number" ? matchedPlan.maxProducts : (PLAN_LIMITS[planId] ?? 15));

  const now = new Date();
  const expiresAt = new Date();
  if (planId === "admin") {
    expiresAt.setFullYear(now.getFullYear() + 100);
  } else if (billingCycle === "yearly") {
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
  if (planId === "admin") {
    rate = 0.0;
  } else {
    try {
      const settings = await getPlatformSettings();
      rate = settings?.commissions?.[planId] ?? (planId === "prime" ? 2.0 : planId === "pro" ? 3.5 : planId === "plus" ? 5.0 : 7.0);
    } catch {
      rate = planId === "prime" ? 2.0 : planId === "pro" ? 3.5 : planId === "plus" ? 5.0 : 7.0;
    }
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
