import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

export interface SendEmailOptions {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  mode: "direct_mx" | "custom_smtp";
  targetMxHost?: string;
  error?: string;
  response?: string;
}

import { getSmtpSettings, SmtpSettings } from "./database/settings";

function getDkimConfig() {
  const privateKey = process.env.DKIM_PRIVATE_KEY;
  const keySelector = process.env.DKIM_SELECTOR || "default";
  const domainName = process.env.DKIM_DOMAIN || "marketpoint.id";

  if (privateKey) {
    return {
      domainName,
      keySelector,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }
  return undefined;
}

export interface TestConnectionResult {
  success: boolean;
  step: string;
  latencyMs: number;
  mode: "direct_mx" | "custom_smtp";
  hostUsed?: string;
  response?: string;
  error?: string;
}

/**
 * Mengirim email langsung ke server mail penerima (Direct MX) atau via SMTP terkonfigurasi.
 */
export async function sendOutgoingEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const settings = await getSmtpSettings();

  const defaultFrom = settings.fromEmail
    ? `"${settings.fromName || "MarketPointID Delivery"}" <${settings.fromEmail}>`
    : "MarketPointID Delivery <delivery@marketpoint.id>";

  const {
    from = defaultFrom,
    to,
    subject,
    text,
    html,
    attachments,
  } = options;

  if (!to || !subject || (!text && !html)) {
    throw new Error("Penerima (to), subjek (subject), dan isi email wajib diisi.");
  }

  const dkim = getDkimConfig();
  const heloDomain = settings.heloDomain || process.env.MAIL_HELO_DOMAIN || "marketpoint.id";

  // 1. Jika mode CUSTOM SMTP diaktifkan (via DB atau ENV)
  const isCustomSmtp = settings.mode === "custom_smtp" || (!settings.mode && !!process.env.SMTP_HOST);
  const smtpHost = settings.host || process.env.SMTP_HOST;

  if (isCustomSmtp && smtpHost) {
    try {
      const port = Number(settings.port || process.env.SMTP_PORT || 587);
      const secure = settings.secure ?? (process.env.SMTP_SECURE === "true" || port === 465);
      const user = settings.user || process.env.SMTP_USER || "";
      const pass = settings.pass || process.env.SMTP_PASS || "";

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
        name: heloDomain,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        dkim,
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || undefined,
        attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
        mode: "custom_smtp",
        targetMxHost: smtpHost,
        response: info.response,
      };
    } catch (smtpErr: any) {
      console.error("[CUSTOM SMTP ERROR]", smtpErr);
      return {
        success: false,
        mode: "custom_smtp",
        error: smtpErr?.message || "Gagal mengirim via Custom SMTP",
      };
    }
  }

  // 2. DIRECT MX SENDING: Mengirim langsung ke MX Server domain penerima (port 25)
  const recipientDomain = to.split("@")[1]?.trim();
  if (!recipientDomain) {
    throw new Error(`Alamat email tidak valid: ${to}`);
  }

  let mxRecords: Array<{ exchange: string; priority: number }> = [];
  try {
    mxRecords = await resolveMx(recipientDomain);
  } catch (dnsErr: any) {
    console.error(`[DIRECT MX DNS LOOKUP FAILED for ${recipientDomain}]:`, dnsErr);
    // Fallback: coba langsung ke domain penerima
    mxRecords = [{ exchange: recipientDomain, priority: 10 }];
  }

  if (!mxRecords || mxRecords.length === 0) {
    return {
      success: false,
      mode: "direct_mx",
      error: `Tidak ditemukan MX record untuk domain ${recipientDomain}`,
    };
  }

  // Urutkan MX record berdasarkan prioritas terkecil (prioritas tertinggi)
  mxRecords.sort((a, b) => a.priority - b.priority);

  let lastError: any = null;

  for (const mx of mxRecords) {
    const mxHost = mx.exchange;
    try {
      console.log(`[DIRECT MX] Mencoba mengirim ke ${to} via MX server: ${mxHost} (port 25)...`);

      const transporter = nodemailer.createTransport({
        host: mxHost,
        port: 25,
        secure: false, // Port 25 menggunakan STARTTLS opportunistik
        ignoreTLS: false,
        requireTLS: false,
        name: heloDomain,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        dkim,
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || undefined,
        attachments,
      });

      console.log(`[DIRECT MX SUCCESS] Email terkirim ke ${to} via ${mxHost}. Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        mode: "direct_mx",
        targetMxHost: mxHost,
        response: info.response,
      };
    } catch (sendErr: any) {
      console.warn(`[DIRECT MX FAILED via ${mxHost}]:`, sendErr?.message || sendErr);
      lastError = sendErr;
      // Lanjutkan ke MX record berikutnya jika ada
    }
  }

  return {
    success: false,
    mode: "direct_mx",
    error: lastError?.message || "Semua server MX tujuan gagal dihubungi.",
  };
}

/**
 * Melakukan diagnostik live test koneksi mail (Direct MX atau Custom SMTP).
 * Mengukur latency ms, handshake, dan mengirim 1 email tes jika diminta.
 */
export async function testMailConnection(
  targetEmail: string,
  customConfig?: Partial<SmtpSettings>
): Promise<TestConnectionResult> {
  const startTime = Date.now();
  const currentSettings = await getSmtpSettings();
  const settings: SmtpSettings = {
    ...currentSettings,
    ...(customConfig || {}),
  };

  const isCustom = settings.mode === "custom_smtp" || (!settings.mode && !!settings.host);

  if (isCustom) {
    if (!settings.host) {
      return {
        success: false,
        step: "Validasi Pengaturan",
        latencyMs: Date.now() - startTime,
        mode: "custom_smtp",
        error: "SMTP Host belum diisi.",
      };
    }

    try {
      const port = Number(settings.port || 587);
      const secure = settings.secure ?? (port === 465);
      const transporter = nodemailer.createTransport({
        host: settings.host,
        port,
        secure,
        auth: settings.user ? { user: settings.user, pass: settings.pass } : undefined,
        name: settings.heloDomain || "marketpoint.id",
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      // Verifikasi handshake SMTP
      await transporter.verify();

      // Kirim email tes jika targetEmail diisi
      let response = "Handshake SMTP Terverifikasi.";
      if (targetEmail) {
        const info = await transporter.sendMail({
          from: `"${settings.fromName || "MarketPointID Mail Engine"}" <${settings.fromEmail || "delivery@marketpoint.id"}>`,
          to: targetEmail,
          subject: "[Diagnostik] Uji Koneksi SMTP MarketPointID Berhasil",
          text: `Halo!\n\nEmail ini adalah bukti bahwa konfigurasi SMTP (${settings.host}:${port}) di MarketPointID berfungsi dengan baik.\n\nWaktu Tes: ${new Date().toLocaleString("id-ID")}\nMode: Custom SMTP Relay\nLatensi: ${Date.now() - startTime} ms\n\nSalam,\nTim Teknis MarketPointID`,
        });
        response = info.response || `Email tes terkirim. ID: ${info.messageId}`;
      }

      return {
        success: true,
        step: targetEmail ? "Kirim Email Tes Sukses" : "Handshake SMTP Sukses",
        latencyMs: Date.now() - startTime,
        mode: "custom_smtp",
        hostUsed: `${settings.host}:${port}`,
        response,
      };
    } catch (err: any) {
      return {
        success: false,
        step: "Koneksi SMTP Relay Gagal",
        latencyMs: Date.now() - startTime,
        mode: "custom_smtp",
        hostUsed: `${settings.host}:${settings.port}`,
        error: err?.message || "Gagal menghubungi SMTP Server.",
      };
    }
  }

  // DIRECT MX TEST
  const recipientDomain = (targetEmail ? targetEmail.split("@")[1] : "gmail.com")?.trim() || "gmail.com";
  try {
    const mxRecords = await resolveMx(recipientDomain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        success: false,
        step: "Pencarian DNS MX",
        latencyMs: Date.now() - startTime,
        mode: "direct_mx",
        error: `DNS MX record untuk domain ${recipientDomain} tidak ditemukan.`,
      };
    }
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMx = mxRecords[0].exchange;

    const transporter = nodemailer.createTransport({
      host: primaryMx,
      port: 25,
      secure: false,
      ignoreTLS: false,
      requireTLS: false,
      name: settings.heloDomain || "marketpoint.id",
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    if (targetEmail) {
      const info = await transporter.sendMail({
        from: `"${settings.fromName || "MarketPointID Delivery"}" <${settings.fromEmail || "delivery@marketpoint.id"}>`,
        to: targetEmail,
        subject: "[Diagnostik] Uji Direct MX Port 25 Berhasil",
        text: `Halo!\n\nEmail ini adalah tes Direct MX pengiriman langsung port 25 ke ${primaryMx}.\nWaktu Tes: ${new Date().toLocaleString("id-ID")}\nLatensi: ${Date.now() - startTime} ms.`,
      });
      return {
        success: true,
        step: "Direct MX Sukses Terkirim",
        latencyMs: Date.now() - startTime,
        mode: "direct_mx",
        hostUsed: primaryMx,
        response: info.response,
      };
    } else {
      await transporter.verify();
      return {
        success: true,
        step: "Direct MX Port 25 Terhubung",
        latencyMs: Date.now() - startTime,
        mode: "direct_mx",
        hostUsed: primaryMx,
        response: `Berhasil terhubung ke ${primaryMx} port 25.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      step: "Koneksi Direct MX Gagal (Port 25)",
      latencyMs: Date.now() - startTime,
      mode: "direct_mx",
      error: `${err?.message || "Port 25 diblokir atau MX menolak koneksi."} (Tips: ISP atau provider cloud sering memblokir Port 25 keluar. Gunakan Custom SMTP dengan port 587 atau 465 untuk reliabilitas 100%).`,
    };
  }
}

export { renderDeliveryEmailHtml } from "./email-template";
