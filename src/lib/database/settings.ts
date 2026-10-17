import { query, initDatabaseSchema } from "./db";

export interface CommissionSettings {
  free: number;
  plus: number;
  pro: number;
  prime: number;
}

import { 
  PlanFeaturesConfig, 
  PlanConfigItem, 
  DEFAULT_PLANS_CONFIG 
} from "@/lib/subscription-plans";
export * from "@/lib/subscription-plans";

export interface DigiFlazzSettings {
  mode: "production" | string;
  username: string;
  apiKey: string;
  webhookSecret: string;
}

export interface PlatformSettings {
  commissions: CommissionSettings;
  digiflazz: DigiFlazzSettings;
  plans: PlanConfigItem[];
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissions: {
    free: 7.0,
    plus: 5.0,
    pro: 3.5,
    prime: 2.0,
  },
  digiflazz: {
    mode: "production",
    username: process.env.DIGIFLAZZ_USERNAME || "",
    apiKey: process.env.DIGIFLAZZ_API_KEY || "",
    webhookSecret: process.env.DIGIFLAZZ_WEBHOOK_SECRET || "",
  },
  plans: DEFAULT_PLANS_CONFIG,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    await initDatabaseSchema();
    const res = await query("SELECT key_name, setting_value FROM platform_settings");
    
    if (res.rows.length === 0) return DEFAULT_SETTINGS;

    const map: Record<string, string> = {};
    for (const r of res.rows) {
      map[r.key_name] = r.setting_value;
    }

    const commissions: CommissionSettings = {
      free: parseFloat(map.commission_free ?? "7.0") || 7.0,
      plus: parseFloat(map.commission_plus ?? "5.0") || 5.0,
      pro: parseFloat(map.commission_pro ?? "3.5") || 3.5,
      prime: parseFloat(map.commission_prime ?? "2.0") || 2.0,
    };

    let plans: PlanConfigItem[] = DEFAULT_PLANS_CONFIG;
    if (map.plans_config) {
      try {
        plans = JSON.parse(map.plans_config);
      } catch (e) {
        plans = DEFAULT_PLANS_CONFIG;
      }
    }

    // Pastikan nilai baru seperti maxVouchers dan maxFlashSaleProducts terisi default jika belum ada
    plans = plans.map(p => {
      const def = DEFAULT_PLANS_CONFIG.find(d => d.id === p.id);
      return {
        ...def,
        ...p,
        commissionRate: commissions[p.id as keyof CommissionSettings] ?? p.commissionRate,
        maxProducts: p.maxProducts !== undefined ? p.maxProducts : (def?.maxProducts ?? 5),
        maxVouchers: p.maxVouchers !== undefined ? p.maxVouchers : (def?.maxVouchers ?? 0),
        maxFlashSaleProducts: p.maxFlashSaleProducts !== undefined ? p.maxFlashSaleProducts : (def?.maxFlashSaleProducts ?? 0),
        features: {
          ...def?.features,
          ...p.features,
        },
      };
    });

    return {
      commissions,
      digiflazz: {
        mode: map.digiflazz_mode || "production",
        username: map.digiflazz_username || process.env.DIGIFLAZZ_USERNAME || "",
        apiKey: map.digiflazz_api_key || process.env.DIGIFLAZZ_API_KEY || "",
        webhookSecret: map.digiflazz_webhook_secret || process.env.DIGIFLAZZ_WEBHOOK_SECRET || "",
      },
      plans,
    };
  } catch (err) {
    console.warn("[GET PLATFORM SETTINGS WARN]", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updatePlatformSetting(keyName: string, value: string): Promise<boolean> {
  await initDatabaseSchema();
  const sql = `
    INSERT INTO platform_settings (key_name, setting_value, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (key_name) DO UPDATE SET
      setting_value = EXCLUDED.setting_value,
      updated_at = CURRENT_TIMESTAMP
  `;
  const res = await query(sql, [keyName, value]);
  return (res.rowCount || 0) > 0;
}

export async function updateCommissionSettings(commissions: CommissionSettings): Promise<boolean> {
  await updatePlatformSetting("commission_free", String(commissions.free));
  await updatePlatformSetting("commission_plus", String(commissions.plus));
  await updatePlatformSetting("commission_pro", String(commissions.pro));
  await updatePlatformSetting("commission_prime", String(commissions.prime));
  
  // Update juga plans_config jika ada
  try {
    const settings = await getPlatformSettings();
    const updatedPlans = settings.plans.map(p => ({
      ...p,
      commissionRate: commissions[p.id as keyof CommissionSettings] ?? p.commissionRate,
    }));
    await updatePlatformSetting("plans_config", JSON.stringify(updatedPlans));
  } catch {}

  return true;
}

export async function updatePlansConfig(plans: PlanConfigItem[]): Promise<boolean> {
  await updatePlatformSetting("plans_config", JSON.stringify(plans));

  // Sinkronkan juga individual setting komisi
  const freePlan = plans.find(p => p.id === "free");
  const plusPlan = plans.find(p => p.id === "plus");
  const proPlan = plans.find(p => p.id === "pro");
  const primePlan = plans.find(p => p.id === "prime");
  if (freePlan) await updatePlatformSetting("commission_free", String(freePlan.commissionRate));
  if (plusPlan) await updatePlatformSetting("commission_plus", String(plusPlan.commissionRate));
  if (proPlan) await updatePlatformSetting("commission_pro", String(proPlan.commissionRate));
  if (primePlan) await updatePlatformSetting("commission_prime", String(primePlan.commissionRate));

  return true;
}

export async function updateDigiFlazzSettings(digiflazz: DigiFlazzSettings): Promise<boolean> {
  await updatePlatformSetting("digiflazz_mode", digiflazz.mode);
  await updatePlatformSetting("digiflazz_username", digiflazz.username);
  await updatePlatformSetting("digiflazz_api_key", digiflazz.apiKey);
  await updatePlatformSetting("digiflazz_webhook_secret", digiflazz.webhookSecret);
  return true;
}

export interface SmtpSettings {
  mode: "direct_mx" | "custom_smtp";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  heloDomain: string;
}

const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  mode: process.env.SMTP_HOST ? "custom_smtp" : "direct_mx",
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  fromName: process.env.SMTP_FROM_NAME || "MarketPointID Delivery",
  fromEmail: process.env.SMTP_FROM_EMAIL || "delivery@marketpoint.id",
  heloDomain: process.env.MAIL_HELO_DOMAIN || "marketpoint.id",
};

export async function getSmtpSettings(): Promise<SmtpSettings> {
  try {
    await initDatabaseSchema();
    const res = await query(
      "SELECT key_name, setting_value FROM platform_settings WHERE key_name LIKE 'smtp_%' OR key_name = 'mail_helo_domain'"
    );

    if (res.rows.length === 0) return DEFAULT_SMTP_SETTINGS;

    const map: Record<string, string> = {};
    for (const r of res.rows) {
      map[r.key_name] = r.setting_value;
    }

    return {
      mode: (map.smtp_mode as "direct_mx" | "custom_smtp") || DEFAULT_SMTP_SETTINGS.mode,
      host: map.smtp_host ?? DEFAULT_SMTP_SETTINGS.host,
      port: Number(map.smtp_port ?? DEFAULT_SMTP_SETTINGS.port) || 587,
      secure: map.smtp_secure !== undefined ? map.smtp_secure === "true" : DEFAULT_SMTP_SETTINGS.secure,
      user: map.smtp_user ?? DEFAULT_SMTP_SETTINGS.user,
      pass: map.smtp_pass ?? DEFAULT_SMTP_SETTINGS.pass,
      fromName: map.smtp_from_name ?? DEFAULT_SMTP_SETTINGS.fromName,
      fromEmail: map.smtp_from_email ?? DEFAULT_SMTP_SETTINGS.fromEmail,
      heloDomain: map.mail_helo_domain ?? DEFAULT_SMTP_SETTINGS.heloDomain,
    };
  } catch (err) {
    console.warn("[GET SMTP SETTINGS WARN]", err);
    return DEFAULT_SMTP_SETTINGS;
  }
}

export async function updateSmtpSettings(settings: Partial<SmtpSettings>): Promise<boolean> {
  if (settings.mode !== undefined) await updatePlatformSetting("smtp_mode", settings.mode);
  if (settings.host !== undefined) await updatePlatformSetting("smtp_host", settings.host);
  if (settings.port !== undefined) await updatePlatformSetting("smtp_port", String(settings.port));
  if (settings.secure !== undefined) await updatePlatformSetting("smtp_secure", String(settings.secure));
  if (settings.user !== undefined) await updatePlatformSetting("smtp_user", settings.user);
  if (settings.pass !== undefined) await updatePlatformSetting("smtp_pass", settings.pass);
  if (settings.fromName !== undefined) await updatePlatformSetting("smtp_from_name", settings.fromName);
  if (settings.fromEmail !== undefined) await updatePlatformSetting("smtp_from_email", settings.fromEmail);
  if (settings.heloDomain !== undefined) await updatePlatformSetting("mail_helo_domain", settings.heloDomain);
  return true;
}
