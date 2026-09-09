/**
 * MarketPoint WhatsApp Bot Entry Point
 * Folder: src/wa-bot
 */

export { WA_CONFIG, getBotConfig, saveBotConfig } from "./config";
export type { WABotConfigJSON } from "./config";
export { formatPhoneNumber, generateOTP, verifyOTP } from "./otp-service";
export {
  initWASocket,
  requestBotPairingCode,
  resetBotPairingState,
  getBotStatus,
  disconnectBotSession,
  clearBotSession,
  sendWAMessage,
  sendOTPMessage,
  sendShopAnnouncementMessage,
  sendCommunityInviteMessage,
  checkIsCommunityMember,
  getBotLogs,
  appendBotLog,
  clearBotLogs,
} from "./client";
export type { BotStatus, BotLogEntry } from "./client";
