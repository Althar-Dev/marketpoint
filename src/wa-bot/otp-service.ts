/**
 * OTP Service for WhatsApp Verification
 */

import { WA_CONFIG } from "./config";

interface OTPData {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

declare global {
  var waOtpStore: Map<string, OTPData> | undefined;
}

// In-memory store for active OTPs (Key: formatted phone number, persisted on globalThis)
const otpStore: Map<string, OTPData> = globalThis.waOtpStore || new Map<string, OTPData>();
globalThis.waOtpStore = otpStore;

/**
 * Format phone number to WhatsApp JID format (e.g. 08123456789 -> 628123456789)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62") && cleaned.length >= 9) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Generate a 6-digit OTP for the given phone number
 */
export function generateOTP(phone: string): { success: boolean; code?: string; message?: string; cooldownMs?: number } {
  const formattedPhone = formatPhoneNumber(phone);
  const now = Date.now();
  const existing = otpStore.get(formattedPhone);

  if (existing) {
    const elapsedSinceLastSent = now - existing.lastSentAt;
    if (elapsedSinceLastSent < WA_CONFIG.OTP_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((WA_CONFIG.OTP_COOLDOWN_MS - elapsedSinceLastSent) / 1000);
      return {
        success: false,
        message: `Harap tunggu ${remainingCooldown} detik sebelum meminta OTP baru.`,
        cooldownMs: WA_CONFIG.OTP_COOLDOWN_MS - elapsedSinceLastSent,
      };
    }
  }

  // Generate 6-digit numeric OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(formattedPhone, {
    code,
    expiresAt: now + WA_CONFIG.OTP_EXPIRY_MS,
    lastSentAt: now,
    attempts: 0,
  });

  return { success: true, code };
}

/**
 * Verify input OTP code for given phone number
 */
export function verifyOTP(phone: string, inputCode: string): { success: boolean; message: string } {
  const formattedPhone = formatPhoneNumber(phone);
  const now = Date.now();
  const record = otpStore.get(formattedPhone);

  if (!record) {
    return { success: false, message: "Kode OTP tidak ditemukan. Silakan minta kode baru." };
  }

  if (now > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return { success: false, message: "Kode OTP telah kadaluwarsa (lebih dari 5 menit)." };
  }

  if (record.attempts >= 5) {
    otpStore.delete(formattedPhone);
    return { success: false, message: "Terlalu banyak percobaan salah. Silakan minta kode OTP baru." };
  }

  if (record.code !== inputCode.trim()) {
    record.attempts += 1;
    return { success: false, message: "Kode OTP yang Anda masukkan salah." };
  }

  otpStore.delete(formattedPhone);
  return { success: true, message: "Verifikasi nomor WhatsApp berhasil!" };
}
