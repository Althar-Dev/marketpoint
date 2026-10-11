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

/**
 * Mendapatkan konfigurasi DKIM jika ada di environment variable
 */
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

/**
 * Mengirim email langsung ke server mail penerima (Direct MX) atau via SMTP terkonfigurasi.
 * 100% Gratis tanpa biaya pihak ketiga.
 */
export async function sendOutgoingEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {
    from = "MarketPoint Delivery <delivery@marketpoint.id>",
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
  const heloDomain = process.env.MAIL_HELO_DOMAIN || "marketpoint.id";

  // 1. Jika pengguna secara manual mengatur SMTP_HOST di .env, gunakan custom SMTP relay
  if (process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER || "delivery@marketpoint.id",
          pass: process.env.SMTP_PASS || "",
        },
        name: heloDomain,
        tls: {
          rejectUnauthorized: false,
        },
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

  // 2. DIRECT MX SENDING: Mengirim langsung ke MX Server domain penerima (misal: gmail-smtp-in.l.google.com)
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
 * Render template email HTML pengiriman lisensi produk resmi MarketPoint yang responsif dan elegan
 */
export function renderDeliveryEmailHtml(params: {
  orderId: string;
  recipientName: string;
  productTitle: string;
  variant?: string | null;
  quantity: number;
  licenseKeys: string[];
  downloadFiles?: Array<{ fileName: string; fileUrl: string; fileSize?: number; version?: string }>;
  demoUrl?: string;
  formattedDate?: string;
}): string {
  const {
    orderId,
    recipientName,
    productTitle,
    variant,
    quantity,
    licenseKeys,
    downloadFiles = [],
    demoUrl,
    formattedDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  } = params;

  const licenseListHtml = licenseKeys
    .map((k, idx) => {
      const label = licenseKeys.length > 1 ? `Unit ${idx + 1}` : "Serial Key";
      return `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${label}</div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; color: #0f172a; word-break: break-all; letter-spacing: 0.03em;">${k}</div>
        </div>
      `;
    })
    .join("");

  const downloadFilesHtml =
    downloadFiles.length > 0
      ? `
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
            Berkas Unduhan Produk
          </h3>
          ${downloadFiles
            .map(
              (f, i) => `
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${i + 1}. ${f.fileName} ${f.version ? `(${f.version})` : ""}</div>
                  ${f.fileSize ? `<div style="font-size: 11px; color: #64748b;">${(f.fileSize / (1024 * 1024)).toFixed(2)} MB</div>` : ""}
                </div>
                <div style="margin-top: 8px;">
                  <a href="${f.fileUrl}" style="display: inline-block; background-color: #00AA5B; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;">Unduh Berkas</a>
                </div>
              </div>
            `
            )
            .join("")}
        </div>
      `
      : "";

  const demoUrlHtml = demoUrl
    ? `
      <div style="margin-top: 16px;">
        <span style="font-size: 12px; color: #64748b;">Tautan Demo / Dokumentasi: </span>
        <a href="${demoUrl}" style="font-size: 12px; color: #0284c7; text-decoration: underline; font-weight: 600;">${demoUrl}</a>
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengiriman Pesanan #${orderId} - MarketPoint</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Container Utama -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      Market<span style="color: #00AA5B;">Point</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; font-weight: 500;">
                      Official Automated Delivery Service
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(0, 170, 91, 0.2); border: 1px solid #00AA5B; color: #4ade80; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                      Lunas & Terkirim
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Isi Email -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                Halo, ${recipientName}!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569;">
                Terima kasih atas pesanan Anda di <strong>MarketPoint</strong>. Pembayaran Anda telah terverifikasi penuh dan lisensi produk digital Anda otomatis diterbitkan di bawah ini.
              </p>

              <!-- Kartu Rincian Pesanan -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 130px;">Nomor Invoice</td>
                    <td style="padding: 4px 0; font-weight: 700; color: #0f172a; font-family: monospace;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Tanggal Pesanan</td>
                    <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Produk</td>
                    <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${productTitle}</td>
                  </tr>
                  ${variant ? `<tr><td style="padding: 4px 0; color: #64748b;">Varian</td><td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${variant}</td></tr>` : ""}
                  ${quantity > 1 ? `<tr><td style="padding: 4px 0; color: #64748b;">Jumlah</td><td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${quantity} unit</td></tr>` : ""}
                </table>
              </div>

              <!-- Lisensi / Serial Key -->
              <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                    Kunci Lisensi / Akses Resmi
                  </h2>
                </div>
                ${licenseListHtml}
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  *Simpan serial key di atas dengan aman sebagai bukti lisensi resmi kepemilikan Anda.
                </div>
              </div>

              <!-- Berkas Unduhan & Demo -->
              ${downloadFilesHtml}
              ${demoUrlHtml}

              <!-- Panduan Aktivasi Singkat -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-top: 24px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #065f46;">
                  Panduan Aktivasi Cepat:
                </h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #047857; line-height: 1.6;">
                  <li>Salin kode serial key / lisensi yang tertera di atas.</li>
                  <li>Unduh atau buka aplikasi/platform produk yang bersangkutan.</li>
                  <li>Masukkan serial key pada kolom aktivasi lisensi atau ikuti instruksi di berkas panduan.</li>
                </ol>
              </div>

              <!-- Tombol Cek Detail Transaksi di Web -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://marketpoint.id/transactions/${encodeURIComponent(orderId)}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Lihat Detail Transaksi & Unduh Faktur PDF
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">
                Email ini dikirim otomatis oleh sistem pengiriman MarketPoint dari <strong>delivery@marketpoint.id</strong>.
              </p>
              <p style="margin: 0;">
                Semua transaksi dilindungi sistem keamanan escrow MarketPoint. Butuh bantuan? Kunjungi <a href="https://marketpoint.id" style="color: #00AA5B; text-decoration: underline;">marketpoint.id</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
