/**
 * WhatsApp Bot Client Singleton using @starvale-sdk/wa-socket
 * Supports Pairing Code authentication (no QR code)
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto,
} from "@starvale-sdk/wa-socket";
import pino from "pino";
import fs from "fs";
import path from "path";
import { WA_CONFIG, saveBotConfig } from "./config";
import { formatPhoneNumber } from "./otp-service";

export type BotStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "PAIRING_CODE";

export interface BotLogEntry {
  id: string;
  time: string;
  timestamp: number;
  text: string;
  type: "info" | "success" | "warn" | "error";
}

interface BotState {
  status: BotStatus;
  pairingCode?: string;
  phone?: string;
  userJid?: string;
  error?: string;
  hasSession?: boolean;
}

declare global {
  var waSocketInstance: any;
  var waCurrentState: BotState | undefined;
  var waBotLogs: BotLogEntry[] | undefined;
  var waIsExplicitDisconnect: boolean | undefined;
}

let socketInstance: any = globalThis.waSocketInstance || null;
let currentState: BotState = globalThis.waCurrentState || {
  status: "DISCONNECTED",
};
let botLogs: BotLogEntry[] = globalThis.waBotLogs || [];
let isExplicitDisconnect: boolean = globalThis.waIsExplicitDisconnect || false;

export function appendBotLog(text: string, type: "info" | "success" | "warn" | "error" = "info"): BotLogEntry {
  const now = new Date();
  const time = now.toLocaleTimeString("id-ID", { hour12: false });
  const entry: BotLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time,
    timestamp: Date.now(),
    text,
    type,
  };
  const currentLogs = [...(botLogs || [])].sort((a, b) => a.timestamp - b.timestamp);
  botLogs = [...currentLogs.slice(-99), entry];
  globalThis.waBotLogs = botLogs;
  return entry;
}

export function getBotLogs(): BotLogEntry[] {
  if (!botLogs || botLogs.length === 0) {
    appendBotLog("WhatsApp Bot Service initialized", "info");
  }
  return [...botLogs].sort((a, b) => a.timestamp - b.timestamp);
}

export function clearBotLogs() {
  botLogs = [];
  globalThis.waBotLogs = botLogs;
}

const updateState = (newState: Partial<BotState>) => {
  currentState = { ...currentState, ...newState };
  globalThis.waCurrentState = currentState;
};

const setSocketInstance = (inst: any) => {
  socketInstance = inst;
  globalThis.waSocketInstance = inst;
};

const setIsExplicitDisconnect = (val: boolean) => {
  isExplicitDisconnect = val;
  globalThis.waIsExplicitDisconnect = val;
};

// Silent pino logger (no console output to terminal)
const logger = pino({ level: "silent" });

/**
 * Initialize / Connect WhatsApp Socket Bot
 */
export async function initWASocket(): Promise<any> {
  if (isExplicitDisconnect) {
    return null;
  }

  if (socketInstance && currentState.status === "CONNECTED") {
    return socketInstance;
  }

  if (!socketInstance) {
    updateState({ status: "CONNECTING" });
    appendBotLog("Memulai koneksi ke server WhatsApp Socket...", "info");

    try {
      const { state, saveCreds } = await useMultiFileAuthState(WA_CONFIG.SESSION_DIR);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false, // Nonaktifkan QR Code
        browser: ["Ubuntu", "Chrome", "20.0.04"],
      });

      setSocketInstance(sock);

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", (update: any) => {
        if (isExplicitDisconnect) return;

        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
          appendBotLog("Menghubungkan ke WhatsApp Web Socket...", "info");
        } else if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          // Auto-reconnect if not explicitly disconnected and not logged out / unauthorized
          const shouldReconnect =
            !isExplicitDisconnect &&
            statusCode !== DisconnectReason.loggedOut &&
            statusCode !== 401 &&
            statusCode !== 403;

          updateState({
            status: "DISCONNECTED",
            error: lastDisconnect?.error?.message || `Koneksi terputus (Status: ${statusCode})`,
          });

          appendBotLog(`Koneksi terputus. Status Code: ${statusCode}. Reconnect: ${shouldReconnect}`, "warn");

          setSocketInstance(null);

          // If logged out from phone or unauthorized (401), clear invalid session files automatically
          if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
            if (fs.existsSync(WA_CONFIG.SESSION_DIR)) {
              try {
                fs.rmSync(WA_CONFIG.SESSION_DIR, { recursive: true, force: true });
                appendBotLog("Sesi terdeteksi telah logged out, berkas sesi dibersihkan otomatis.", "warn");
              } catch (err) { }
            }
          }

          if (shouldReconnect) {
            setTimeout(() => initWASocket(), 5000);
          }
        } else if (connection === "open") {
          const userJid = sock.user?.id || "";
          updateState({
            status: "CONNECTED",
            userJid,
            pairingCode: undefined,
            error: undefined,
          });
          appendBotLog(`Status: Terhubung sebagai ${userJid}`, "success");
        }
      });

      // Listen to incoming messages for auto-reply / bot commands
      socketInstance.ev.on("messages.upsert", async ({ messages, type }: any) => {
        if (type !== "notify") return;

        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const from = msg.key.remoteJid;
          const senderNum = from?.split("@")[0] || "Unknown";
          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

          if (!text) continue;

          const command = text.trim().toLowerCase();
          appendBotLog(`Pesan masuk dari ${senderNum}: "${text}"`, "info");

          if (command === "!ping") {
            await socketInstance.sendMessage(from, {
              text: "Pong! 🚀 Bot WhatsApp MarketPoint aktif & terhubung.",
            });
            appendBotLog(`Auto-reply !ping terkirim ke ${senderNum}`, "success");
          } else if (command === "!help" || command === "!menu") {
            const menuText =
              `🤖 *MARKETPOINT BOT HELP*\n\n` +
              `• *!ping* - Cek status keaktifan bot\n` +
              `• *!info* - Informasi layanan MarketPoint\n` +
              `• *!otp* - Bantuan verifikasi akun WhatsApp\n\n` +
              `Untuk verifikasi nomor telepon, silakan masukkan nomor Anda di halaman website MarketPoint.`;

            await socketInstance.sendMessage(from, { text: menuText });
            appendBotLog(`Auto-reply !help terkirim ke ${senderNum}`, "success");
          } else if (command === "!info" || command === "!otp") {
            await socketInstance.sendMessage(from, {
              text: `ℹ️ Bot WhatsApp ini digunakan untuk mengirimkan kode verifikasi OTP dan notifikasi transaksi MarketPoint secara otomatis.`,
            });
            appendBotLog(`Auto-reply ${command} terkirim ke ${senderNum}`, "success");
          }
        }
      });

    } catch (err: any) {
      appendBotLog(`Gagal inisialisasi socket: ${err.message}`, "error");
      updateState({
        status: "DISCONNECTED",
        error: err.message,
      });
      setSocketInstance(null);
      throw err;
    }
  }

  return socketInstance;
}

/**
 * Ensure WhatsApp Socket is initialized and fully in CONNECTED state
 */
export async function ensureConnectedSocket(maxWaitMs = 10000): Promise<any> {
  if (isExplicitDisconnect) return null;

  let sock = await initWASocket();
  if (!sock) return null;

  if (currentState.status === "CONNECTED" && socketInstance) {
    return socketInstance;
  }

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (currentState.status === "CONNECTED" && socketInstance) {
      return socketInstance;
    }
    if (isExplicitDisconnect) return null;
    if (currentState.status === "DISCONNECTED") {
      sock = await initWASocket();
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return socketInstance;
}

/**
 * Request Pairing Code for target WhatsApp phone number
 */
export async function requestBotPairingCode(phone: string): Promise<{ success: boolean; pairingCode?: string; message: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return { success: false, message: "Nomor WhatsApp tidak valid." };
    }

    appendBotLog(`Meminta kode pairing untuk nomor ${formattedPhone}...`, "info");
    const sock = await initWASocket();

    if (sock.authState?.creds?.registered) {
      appendBotLog(`Bot WhatsApp sudah terdaftar & terhubung.`, "warn");
      return { success: false, message: "Bot WhatsApp sudah terdaftar & terhubung." };
    }

    // Delay sebentar sebelum meminta pairing code agar socket siap
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pairingCode = await sock.requestPairingCode(formattedPhone, "STARVALE");

    updateState({
      status: "PAIRING_CODE",
      pairingCode,
      phone: formattedPhone,
    });

    appendBotLog(`Kode Pairing Diterima: ${pairingCode} (${formattedPhone})`, "success");

    return {
      success: true,
      pairingCode,
      message: `Kode pairing berhasil didapatkan: ${pairingCode}`,
    };
  } catch (error: any) {
    console.error("[WA PAIRING CODE ERROR]", error);
    appendBotLog(`Gagal meminta kode pairing: ${error.message}`, "error");
    return {
      success: false,
      message: error.message || "Gagal meminta kode pairing WhatsApp.",
    };
  }
}

/**
 * Reset / Cancel active Bot Pairing Code request & Delete Session Files
 */
export async function resetBotPairingState(): Promise<{ success: boolean; message: string }> {
  setIsExplicitDisconnect(true);

  if (socketInstance) {
    try {
      if (socketInstance.ev) {
        socketInstance.ev.removeAllListeners("creds.update");
        socketInstance.ev.removeAllListeners("connection.update");
        socketInstance.ev.removeAllListeners("messages.upsert");
      }
      try {
        await socketInstance.logout();
      } catch (e) { }
      socketInstance.end(undefined);
    } catch (e) { }
    setSocketInstance(null);
  }

  updateState({
    status: "DISCONNECTED",
    userJid: undefined,
    pairingCode: undefined,
    phone: undefined,
    error: undefined,
  });

  // Short delay to ensure file locks are released by OS
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Delete session files so pairing files are completely wiped out
  if (fs.existsSync(WA_CONFIG.SESSION_DIR)) {
    try {
      fs.rmSync(WA_CONFIG.SESSION_DIR, { recursive: true, force: true });
    } catch (err) { }
  }

  setIsExplicitDisconnect(false);

  appendBotLog("Permintaan kode pairing dibatalkan dan berkas sesi dihapus.", "warn");
  return { success: true, message: "Kode pairing berhasil dibatalkan dan sesi dihapus." };
}

/**
 * Get current bot status (including checking if session files exist)
 */
export function getBotStatus(): BotState {
  const credsExist =
    fs.existsSync(WA_CONFIG.SESSION_DIR) &&
    fs.existsSync(path.join(WA_CONFIG.SESSION_DIR, "creds.json"));
  return {
    ...currentState,
    hasSession: credsExist,
  };
}

/**
 * Disconnect WhatsApp Socket & Delete Session Files
 */
export async function disconnectBotSession(): Promise<{ success: boolean; message: string }> {
  try {
    setIsExplicitDisconnect(true);

    if (socketInstance) {
      try {
        if (socketInstance.ev) {
          socketInstance.ev.removeAllListeners("creds.update");
          socketInstance.ev.removeAllListeners("connection.update");
          socketInstance.ev.removeAllListeners("messages.upsert");
        }
        await socketInstance.logout();
      } catch (err) {
        console.log("[WA BOT] Logout error, forcing end:", err);
      }
      try {
        socketInstance.end(undefined);
      } catch (e) { }
      setSocketInstance(null);
    }

    updateState({
      status: "DISCONNECTED",
      userJid: undefined,
      phone: undefined,
      pairingCode: undefined,
      error: undefined,
    });

    // Short delay to ensure file locks are released by OS
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Delete session files
    if (fs.existsSync(WA_CONFIG.SESSION_DIR)) {
      fs.rmSync(WA_CONFIG.SESSION_DIR, { recursive: true, force: true });
      console.log(`[WA BOT] Session directory deleted: ${WA_CONFIG.SESSION_DIR}`);
    }

    setIsExplicitDisconnect(false);

    appendBotLog("WhatsApp Bot Service diputuskan dan berkas sesi dihapus.", "warn");

    return {
      success: true,
      message: "Sesi Bot WhatsApp berhasil diputuskan dan dihapus.",
    };
  } catch (error: any) {
    setIsExplicitDisconnect(false);
    console.error("[WA DISCONNECT ERROR]", error);
    appendBotLog(`Gagal disconnect sesi: ${error.message}`, "error");
    return {
      success: false,
      message: error.message || "Gagal memutuskan sesi WhatsApp.",
    };
  }
}

/**
 * Force clear session files from disk even if bot is currently disconnected
 */
export async function clearBotSession(): Promise<{ success: boolean; message: string }> {
  try {
    setIsExplicitDisconnect(true);

    if (socketInstance) {
      try {
        if (socketInstance.ev) {
          socketInstance.ev.removeAllListeners("creds.update");
          socketInstance.ev.removeAllListeners("connection.update");
          socketInstance.ev.removeAllListeners("messages.upsert");
        }
        await socketInstance.logout().catch(() => { });
      } catch (err) { }
      try {
        socketInstance.end(undefined);
      } catch (e) { }
      setSocketInstance(null);
    }

    updateState({
      status: "DISCONNECTED",
      userJid: undefined,
      phone: undefined,
      pairingCode: undefined,
      error: undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    let deleted = false;
    if (fs.existsSync(WA_CONFIG.SESSION_DIR)) {
      fs.rmSync(WA_CONFIG.SESSION_DIR, { recursive: true, force: true });
      deleted = true;
      console.log(`[WA BOT] Session directory deleted: ${WA_CONFIG.SESSION_DIR}`);
    }

    setIsExplicitDisconnect(false);

    if (deleted) {
      appendBotLog("Berkas sesi WhatsApp bot telah berhasil dihapus secara permanen.", "warn");
      return { success: true, message: "Berkas sesi WhatsApp berhasil dihapus dari server." };
    } else {
      appendBotLog("Tidak ada berkas sesi WhatsApp tersisa yang perlu dihapus.", "info");
      return { success: true, message: "Tidak ada berkas sesi tersimpan yang perlu dihapus." };
    }
  } catch (error: any) {
    setIsExplicitDisconnect(false);
    console.error("[WA CLEAR SESSION ERROR]", error);
    appendBotLog(`Gagal menghapus berkas sesi: ${error.message}`, "error");
    return {
      success: false,
      message: error.message || "Gagal menghapus berkas sesi WhatsApp.",
    };
  }
}

/**
 * Send WhatsApp text message to target phone number
 */
export async function sendWAMessage(phone: string, messageText: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sock = await ensureConnectedSocket();
    if (!sock || currentState.status !== "CONNECTED") {
      return { success: false, error: "Bot WhatsApp belum terhubung." };
    }
    const formattedPhone = formatPhoneNumber(phone);
    const jid = `${formattedPhone}@s.whatsapp.net`;

    const result = await sock.sendMessage(jid, { text: messageText });
    appendBotLog(`Pesan teks terkirim ke ${formattedPhone}`, "success");
    return {
      success: true,
      messageId: result?.key?.id,
    };
  } catch (error: any) {
    console.error("[WA SEND MSG ERROR]", error);
    appendBotLog(`Gagal kirim pesan ke ${phone}: ${error.message}`, "error");
    return {
      success: false,
      error: error.message || "Gagal mengirim pesan WhatsApp",
    };
  }
}

/**
 * Send OTP Verification Message with Native WhatsApp Copy Code Button (cta_copy)
 */
export async function sendOTPMessage(phone: string, otpCode: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    appendBotLog(`Mengirim OTP ke ${formattedPhone}...`, "info");
    const sock = await ensureConnectedSocket();
    if (!sock || currentState.status !== "CONNECTED") {
      return { success: false, error: "Bot WhatsApp belum terhubung." };
    }
    const jid = `${formattedPhone}@s.whatsapp.net`;

    const messageText =
      `🔒 *Kode Verifikasi MarketPoint*\n\n` +
      `Kode OTP Anda adalah:\n` +
      `*${otpCode}*\n\n` +
      `Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.\n`;

    try {
      // 1. Try sending Native Flow cta_copy Interactive Message (Native WA Copy Code Button)
      const nativeCopyMsg = generateWAMessageFromContent(
        jid,
        {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: messageText,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: "© MarketPoint Official",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Salin Kode",
                    id: "copy_code",
                    copy_code: otpCode,
                  }),
                },
              ],
            }),
          }),
        },
        { userJid: sock.user?.id }
      );

      await sock.relayMessage(jid, nativeCopyMsg.message, { messageId: nativeCopyMsg.key.id });
      appendBotLog(`OTP berhasil dikirim ke ${formattedPhone}`, "success");

      return {
        success: true,
        messageId: nativeCopyMsg.key.id,
      };
    } catch (ctaErr: any) {
      console.warn("[WA BOT] Native cta_copy button fallback:", ctaErr);
      // Fallback to standard text message if nativeFlow is not supported by client
      const result = await sock.sendMessage(jid, { text: messageText });
      appendBotLog(`OTP (standard text) terkirim ke ${formattedPhone}`, "success");
      return {
        success: true,
        messageId: result?.key?.id,
      };
    }
  } catch (error: any) {
    console.error("[WA SEND OTP ERROR]", error);
    const formattedPhone = formatPhoneNumber(phone);
    appendBotLog(`Gagal kirim OTP ke ${formattedPhone}: ${error.message}`, "error");
    return {
      success: false,
      error: error.message || "Gagal mengirim pesan OTP WhatsApp",
    };
  }
}

/**
 * Send WhatsApp invitation to join WhatsApp Community with Native CTA button
 */
export async function sendCommunityInviteMessage(
  phone: string,
  communityLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const sock = await ensureConnectedSocket();
    if (!sock || currentState.status !== "CONNECTED") {
      return { success: false, error: "Bot belum terhubung." };
    }
    const jid = `${formattedPhone}@s.whatsapp.net`;
    const messageText =
      `⚠️ *Syarat Verifikasi Seller MarketPoint*\n\n` +
      `Halo! Nomor WhatsApp Anda (*+${formattedPhone}*) belum terdaftar di Komunitas Resmi WhatsApp MarketPoint.\n\n` +
      `Sebelum mendapatkan kode OTP verifikasi dan membuka toko, Anda diwajibkan bergabung ke komunitas resmi seller MarketPoint terlebih dahulu.\n\n` +
      `Silakan klik tombol *Gabung Komunitas WhatsApp* di bawah ini:\n\n` +
      `Setelah bergabung, silakan klik tombol *"Saya Sudah Gabung"* di website MarketPoint. 🚀`;

    try {
      const nativeBtnMsg = generateWAMessageFromContent(
        jid,
        {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: messageText,
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: "© MarketPoint Official",
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Gabung Komunitas",
                    url: communityLink,
                  }),
                },
              ],
            }),
          }),
        },
        { userJid: sock.user?.id }
      );

      await sock.relayMessage(jid, nativeBtnMsg.message, { messageId: nativeBtnMsg.key.id });
      appendBotLog(`Pesan instruksi gabung komunitas terkirim ke +${formattedPhone}`, "info");
      return { success: true, messageId: nativeBtnMsg.key.id };
    } catch (btnErr) {
      console.warn("[WA BOT] Fallback to standard text for community invite:", btnErr);
      const result = await sock.sendMessage(jid, { text: messageText });
      appendBotLog(`Pesan instruksi gabung komunitas (teks) terkirim ke +${formattedPhone}`, "info");
      return { success: true, messageId: result?.key?.id };
    }
  } catch (error: any) {
    console.error("[WA SEND INVITE ERROR]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a phone number is a member of the WhatsApp Community / Groups
 */
export async function checkIsCommunityMember(phone: string): Promise<{ isMember: boolean; groupName?: string; communityLink: string }> {
  const formattedPhone = formatPhoneNumber(phone);
  const communityLink = WA_CONFIG.COMMUNITY_LINK;

  // Helper to normalize phone numbers to 62... format
  const normalizeNum = (jidOrPhone?: string) => {
    if (!jidOrPhone) return "";
    let cleaned = String(jidOrPhone).split("@")[0].split(":")[0].replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    } else if (!cleaned.startsWith("62") && cleaned.length >= 9) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  };

  const targetNum = normalizeNum(formattedPhone);

  if (!targetNum || targetNum.length < 10) {
    appendBotLog(`Nomor telepon tidak valid untuk cek komunitas: ${formattedPhone}`, "warn");
    return { isMember: false, communityLink };
  }

  const checkParticipantMatch = (p: any, target: string): boolean => {
    if (!p) return false;
    const fields = [
      typeof p === "string" ? p : null,
      p?.id,
      p?.jid,
      p?.phoneNumber,
      p?.phone,
      p?.user,
      p?.pn,
    ].filter(Boolean);

    for (const raw of fields) {
      const norm = normalizeNum(raw);
      if (norm && norm.length >= 10 && norm === target) return true;
    }
    return false;
  };

  try {
    const sock = await ensureConnectedSocket();
    if (!sock || currentState.status !== "CONNECTED") {
      appendBotLog(`Gagal cek komunitas: Bot belum terhubung`, "warn");
      throw new Error("Bot WhatsApp MarketPoint belum terhubung. Silakan aktifkan Bot terlebih dahulu di Panel Admin.");
    }

    appendBotLog(`Memeriksa keanggotaan Komunitas MarketPoint untuk +${targetNum}...`, "info");

    let isMember = false;
    let memberGroupName = "";

    try {
      const allGroups = await sock.groupFetchAllParticipating();
      const keys = Object.keys(allGroups || {});

      let communityParentId = WA_CONFIG.COMMUNITY_JID ? (WA_CONFIG.COMMUNITY_JID.includes("@") ? WA_CONFIG.COMMUNITY_JID : `${WA_CONFIG.COMMUNITY_JID}@g.us`) : "";

      // Resolve community parent JID from link if not set
      if (!communityParentId && communityLink) {
        const match = communityLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
        if (match && match[1]) {
          try {
            const inviteInfo = await sock.groupGetInviteInfo(match[1]);
            if (inviteInfo?.id) {
              communityParentId = inviteInfo.id.includes("@") ? inviteInfo.id : `${inviteInfo.id}@g.us`;
            }
          } catch (invErr) { }
        }
      }

      // Filter groups to ONLY those belonging to MarketPoint Community / MarketPoint Groups
      const marketPointGroupKeys = keys.filter((k) => {
        const grp = allGroups[k];
        if (!grp) return false;
        const parent = (grp as any)?.linkedParent || (grp as any)?.parent || "";
        const subject = (grp?.subject || "").toLowerCase();

        return (
          (communityParentId && (k === communityParentId || parent === communityParentId)) ||
          subject.includes("marketpoint") ||
          subject.includes("komunitas marketpoint") ||
          subject.includes("seller marketpoint")
        );
      });

      // Fallback: If no group matched MarketPoint filters, check groups with "pengumuman" or "seller"
      const candidateKeys = marketPointGroupKeys.length > 0 ? marketPointGroupKeys : keys.filter((k) => {
        const grp = allGroups[k];
        const subject = (grp?.subject || "").toLowerCase();
        return subject.includes("pengumuman") || subject.includes("seller") || subject.includes("komunitas");
      });

      const finalKeysToCheck = candidateKeys.length > 0 ? candidateKeys : keys;

      appendBotLog(`Memeriksa keanggotaan pada ${finalKeysToCheck.length} grup MarketPoint: [${finalKeysToCheck.map(k => `"${allGroups[k]?.subject}"`).join(", ")}]`, "info");

      // 1. Direct participant check across filtered MarketPoint groups
      for (const k of finalKeysToCheck) {
        const grp = allGroups[k];
        if (!grp) continue;
        const participants = grp.participants || [];
        const found = participants.some((p: any) => checkParticipantMatch(p, targetNum));

        if (found) {
          isMember = true;
          memberGroupName = grp.subject || "Komunitas MarketPoint";
          appendBotLog(`User +${targetNum} terverifikasi anggota grup MarketPoint "${memberGroupName}" (${participants.length} peserta)`, "success");
          break;
        }
      }

      // 2. Fallback: groupMetadata check on filtered MarketPoint groups
      if (!isMember && finalKeysToCheck.length > 0) {
        for (const k of finalKeysToCheck) {
          try {
            const meta = await sock.groupMetadata(k);
            const participants = meta?.participants || [];
            if (participants.some((p: any) => checkParticipantMatch(p, targetNum))) {
              isMember = true;
              memberGroupName = meta?.subject || "Komunitas MarketPoint";
              appendBotLog(`User +${targetNum} terverifikasi anggota via metadata di grup "${memberGroupName}"`, "success");
              break;
            }
          } catch (mErr) { }
        }
      }
    } catch (gErr: any) {
      appendBotLog(`Gagal mengambil data grup bot: ${gErr?.message}`, "error");
    }

    if (isMember) {
      appendBotLog(`User +${targetNum} TERVERIFIKASI anggota komunitas MarketPoint ("${memberGroupName}")`, "success");
    } else {
      appendBotLog(`User +${targetNum} BELUM terdaftar di Komunitas WhatsApp MarketPoint.`, "warn");
    }

    return {
      isMember,
      groupName: memberGroupName,
      communityLink,
    };
  } catch (error: any) {
    console.error("[WA CHECK COMMUNITY ERROR]", error);
    throw error;
  }
}

/**
 * Send Shop Announcement Message to Community / Groups with Banner & "Kunjungi Toko" Button/Link
 */
export async function sendShopAnnouncementMessage(data: {
  shopName: string;
  slug: string;
  city?: string;
  province?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sock = await ensureConnectedSocket();
    if (!sock || currentState.status !== "CONNECTED") {
      appendBotLog(`Gagal kirim pengumuman toko: Bot belum terhubung`, "warn");
      return { success: false, error: "Bot belum terhubung." };
    }

    const { shopName, slug, city, province, bannerUrl, description } = data;
    const locationText = [city, province].filter(Boolean).join(", ") || "Indonesia";
    const shopUrl = `https://marketpoint.id/${slug}`;
    const descriptionLine = description?.trim() ? `• *Deskripsi Toko:* ${description.trim()}\n` : "";

    const bannerImageUrl = "https://cdn.marketpoint.id/marketpoint.png";

    // Determine target JID (Strictly SINGLE MarketPoint Community Announcement Group)
    let targetJids: string[] = [];
    let communityParentId = WA_CONFIG.COMMUNITY_JID ? (WA_CONFIG.COMMUNITY_JID.includes("@") ? WA_CONFIG.COMMUNITY_JID : `${WA_CONFIG.COMMUNITY_JID}@g.us`) : "";

    try {
      const groups = await sock.groupFetchAllParticipating();
      const keys = Object.keys(groups || {});

      const groupSummaries = keys.map(k => `"${groups[k]?.subject}" (${k})`).join(", ");
      appendBotLog(`Bot berpartisipasi di ${keys.length} grup: [${groupSummaries}]`, "info");

      // 1. Resolve target group/community JID automatically from COMMUNITY_LINK if not set
      if (!communityParentId && WA_CONFIG.COMMUNITY_LINK) {
        const match = WA_CONFIG.COMMUNITY_LINK.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
        if (match && match[1]) {
          try {
            const inviteCode = match[1];
            const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
            if (inviteInfo && inviteInfo.id) {
              communityParentId = inviteInfo.id.includes("@") ? inviteInfo.id : `${inviteInfo.id}@g.us`;
              try {
                saveBotConfig({ communityJid: communityParentId });
                appendBotLog(`Community JID (${communityParentId}) berhasil disimpan otomatis ke config.json`, "success");
              } catch (saveErr) { }
            }
          } catch (invErr: any) {
            appendBotLog(`Gagal resolve link grup pengumuman (${WA_CONFIG.COMMUNITY_LINK}): ${invErr?.message}`, "warn");
          }
        }
      }

      let bestJid = "";

      if (keys.length > 0) {
        // 2a. Look for sub-group inside the community where linkedParent === communityParentId
        if (communityParentId) {
          for (const k of keys) {
            const grp = groups[k];
            const parent = (grp as any)?.linkedParent || (grp as any)?.parent || "";
            const subject = (grp?.subject || "").toLowerCase();
            const isAnnounce = (grp as any)?.isCommunityAnnounce || grp?.announce || subject.includes("pengumuman") || subject.includes("announcement");

            if (parent === communityParentId || k === communityParentId) {
              if (isAnnounce) {
                bestJid = k;
                appendBotLog(`Ditemukan sub-grup pengumuman komunitas: "${grp.subject}" (${k})`, "success");
                break;
              } else if (!bestJid && k !== communityParentId) {
                bestJid = k;
              }
            }
          }
        }

        // 2b. If communityParentId directly matches a group and it is a real chat group
        if (!bestJid && communityParentId && groups[communityParentId]) {
          bestJid = communityParentId;
        }

        // 2c. Keyword matching for MarketPoint / Pengumuman / Seller / Komunitas
        if (!bestJid) {
          for (const k of keys) {
            const grp = groups[k];
            const subject = (grp?.subject || "").toLowerCase();
            if (subject.includes("marketpoint") || subject.includes("pengumuman") || subject.includes("seller") || subject.includes("komunitas")) {
              bestJid = k;
              appendBotLog(`Ditemukan grup berdasarkan nama: "${grp.subject}" (${k})`, "info");
              break;
            }
          }
        }

        // 2d. If bot is only in 1 group, use that single group
        if (!bestJid && keys.length === 1) {
          bestJid = keys[0];
          appendBotLog(`Bot hanya berada di 1 grup: "${groups[bestJid]?.subject}" (${bestJid})`, "info");
        }
      }

      // Fallback: If no group found from participating groups, but communityParentId is configured
      if (!bestJid && communityParentId) {
        bestJid = communityParentId;
      }

      if (bestJid) {
        targetJids.push(bestJid);
      }
    } catch (err: any) {
      appendBotLog(`Gagal mengambil daftar grup bot: ${err?.message}`, "error");
      if (communityParentId) targetJids.push(communityParentId);
    }

    if (targetJids.length === 0) {
      appendBotLog(`Tidak ada grup/komunitas tujuan yang sesuai untuk pengumuman toko baru.`, "warn");
      return { success: false, error: "Bot belum bergabung di grup/komunitas MarketPoint." };
    }

    const captionText =
      `🎉 *Selamat Toko Baru Bergabung!*\n\n` +
      `Mari sambut *${shopName}* yang baru saja resmi bergabung dan membuka toko di MarketPoint!\n\n` +
      `📌 *DETAIL TOKO:* \n` +
      `• *Nama Toko:* ${shopName}\n` +
      `• *Lokasi:* ${locationText}\n` +
      `${descriptionLine}\n\n` +
      `Yuk dukung seller baru kita! Kunjungi toko melalui link berikut:\n` +
      `👉 *${shopUrl}*`;

    for (const targetJid of targetJids) {
      appendBotLog(`Mengirimkan pengumuman toko ${shopName} ke grup/komunitas ${targetJid}...`, "info");

      try {
        if (bannerImageUrl) {
          await sock.sendMessage(targetJid, {
            image: { url: bannerImageUrl },
            caption: captionText,
          });
          appendBotLog(`Pengumuman toko ${shopName} (Gambar Banner + Teks) berhasil terkirim ke ${targetJid}`, "success");
        } else {
          await sock.sendMessage(targetJid, { text: captionText });
          appendBotLog(`Pengumuman toko ${shopName} (Teks) berhasil terkirim ke ${targetJid}`, "success");
        }
      } catch (sendErr: any) {
        console.error(`[ANNOUNCEMENT SEND ERROR ${targetJid}]`, sendErr);
        await sock.sendMessage(targetJid, { text: captionText });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("[SHOP ANNOUNCEMENT ERROR]", error);
    return { success: false, error: error.message };
  }
}
