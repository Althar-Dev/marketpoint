/**
 * WA Bot Configuration for MarketPoint
 * Powered by @starvale-sdk/wa-socket & backed by database/config.json
 */

import path from "path";
import fs from "fs";

export interface WABotConfigJSON {
  botName: string;
  otpExpiryMinutes: number;
  otpCooldownSeconds: number;
  communityLink: string;
  communityJid: string;
  checkCommunity: boolean;
  sessionDir: string;
}

const CONFIG_PATH = path.join(process.cwd(), "database", "config.json");

const DEFAULT_CONFIG: WABotConfigJSON = {
  botName: "MarketPoint",
  otpExpiryMinutes: 5,
  otpCooldownSeconds: 60,
  communityLink: "https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju",
  communityJid: "",
  checkCommunity: true,
  sessionDir: "bot-session",
};

/**
 * Load bot configuration from database/config.json
 */
export function getBotConfig(): WABotConfigJSON {
  try {
    const dbDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      return DEFAULT_CONFIG;
    }

    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    if (!content.trim()) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (error) {
    console.error("[WA CONFIG READ ERROR]", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save updated bot configuration to database/config.json
 */
export function saveBotConfig(newConfig: Partial<WABotConfigJSON>): WABotConfigJSON {
  try {
    const current = getBotConfig();
    const updated = { ...current, ...newConfig };
    const dbDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (error) {
    console.error("[WA CONFIG SAVE ERROR]", error);
    throw error;
  }
}

/**
 * Dynamic WA_CONFIG object mapping to database/config.json
 */
export const WA_CONFIG = {
  get SESSION_DIR() {
    const cfg = getBotConfig();
    return process.env.WA_SESSION_DIR || path.join(process.cwd(), cfg.sessionDir || "bot-session");
  },
  get OTP_EXPIRY_MS() {
    const cfg = getBotConfig();
    return (cfg.otpExpiryMinutes || 5) * 60 * 1000;
  },
  get OTP_COOLDOWN_MS() {
    const cfg = getBotConfig();
    return (cfg.otpCooldownSeconds || 60) * 1000;
  },
  get BOT_NAME() {
    const cfg = getBotConfig();
    return cfg.botName || "MarketPoint";
  },
  get COMMUNITY_LINK() {
    const cfg = getBotConfig();
    return cfg.communityLink || "https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju";
  },
  get COMMUNITY_JID() {
    const cfg = getBotConfig();
    return cfg.communityJid || "";
  },
  get CHECK_COMMUNITY() {
    const cfg = getBotConfig();
    return cfg.checkCommunity !== false;
  },
};
