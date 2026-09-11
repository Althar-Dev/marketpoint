import { query, initDatabaseSchema } from "./db";

export interface CommissionSettings {
  free: number;
  plus: number;
  pro: number;
  prime: number;
}

export interface DigiFlazzSettings {
  mode: "development" | "production";
  username: string;
  apiKey: string;
  webhookSecret: string;
}

export interface PlatformSettings {
  commissions: CommissionSettings;
  digiflazz: DigiFlazzSettings;
  // Xendit removed from here, managed in Firestore client-side
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissions: {
    free: 5.0,
    plus: 3.0,
    pro: 1.5,
    prime: 0.0,
  },
  digiflazz: {
    mode: "development",
    username: process.env.DIGIFLAZZ_USERNAME || "",
    apiKey: process.env.DIGIFLAZZ_API_KEY || "",
    webhookSecret: process.env.DIGIFLAZZ_WEBHOOK_SECRET || "",
  },
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

    return {
      commissions: {
        free: parseFloat(map.commission_free ?? "5.0") || 5.0,
        plus: parseFloat(map.commission_plus ?? "3.0") || 3.0,
        pro: parseFloat(map.commission_pro ?? "1.5") || 1.5,
        prime: parseFloat(map.commission_prime ?? "0.0") || 0.0,
      },
      digiflazz: {
        mode: (map.digiflazz_mode as any) || "development",
        username: map.digiflazz_username || process.env.DIGIFLAZZ_USERNAME || "",
        apiKey: map.digiflazz_api_key || process.env.DIGIFLAZZ_API_KEY || "",
        webhookSecret: map.digiflazz_webhook_secret || process.env.DIGIFLAZZ_WEBHOOK_SECRET || "",
      },
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
  return true;
}

export async function updateDigiFlazzSettings(digiflazz: DigiFlazzSettings): Promise<boolean> {
  await updatePlatformSetting("digiflazz_mode", digiflazz.mode);
  await updatePlatformSetting("digiflazz_username", digiflazz.username);
  await updatePlatformSetting("digiflazz_api_key", digiflazz.apiKey);
  await updatePlatformSetting("digiflazz_webhook_secret", digiflazz.webhookSecret);
  return true;
}
