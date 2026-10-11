/**
 * Template Generator Email Pengiriman Lisensi Resmi MarketPoint
 * Menghasilkan HTML email yang 100% kompatibel dan responsif untuk Gmail, Apple Mail, Outlook, & Webmail.
 */

export interface DeliveryEmailTemplateParams {
  orderId: string;
  recipientName: string;
  productTitle: string;
  variant?: string | null;
  quantity: number;
  licenseKeys: string[];
  downloadFiles?: Array<{ fileName: string; fileUrl: string; fileSize?: number; version?: string }>;
  demoUrl?: string;
  formattedDate?: string;
}

export function renderDeliveryEmailHtml(params: DeliveryEmailTemplateParams): string {
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

/**
 * Parser untuk mengonversi email delivery teks lama menjadi parameter template resmi
 */
export function parsePlainTextDeliveryEmail(content: string, subject: string): DeliveryEmailTemplateParams | null {
  if (!content.includes("RINCIAN PESANAN") && !content.includes("KODE LISENSI")) {
    return null;
  }

  const orderIdMatch = content.match(/Nomor Pesanan\s*:\s*#?([^\n\r]+)/i) || subject.match(/#([a-zA-Z0-9_-]+)/);
  const productMatch = content.match(/Nama Produk\s*:\s*([^\n\r]+)/i);
  const variantMatch = content.match(/Varian\s*:\s*([^\n\r]+)/i);
  const quantityMatch = content.match(/Jumlah\s*:\s*([0-9]+)/i);
  const greetingMatch = content.match(/Halo\s+([^,\n\r]+)/i);

  // Parse license keys
  const keys: string[] = [];
  const licenseSection = content.split(/KODE LISENSI \/ SERIAL KEY RESMI/i)[1];
  if (licenseSection) {
    const rawKeysBlock = licenseSection.split(/Harap simpan|==|BERKAS UNDUHAN|PANDUAN/i)[0];
    const lines = rawKeysBlock.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("="));
    for (const line of lines) {
      const cleanKey = line.replace(/^\[Unit\s*\d+\]\s*/i, "").trim();
      if (cleanKey && cleanKey.length > 2) {
        keys.push(cleanKey);
      }
    }
  }

  return {
    orderId: orderIdMatch ? orderIdMatch[1].trim() : "Pesanan",
    recipientName: greetingMatch ? greetingMatch[1].trim() : "Pelanggan Setia",
    productTitle: productMatch ? productMatch[1].trim() : "Produk Digital MarketPoint",
    variant: variantMatch ? variantMatch[1].trim() : null,
    quantity: quantityMatch ? parseInt(quantityMatch[1], 10) : 1,
    licenseKeys: keys.length > 0 ? keys : ["Tervalidasi Resmi"],
  };
}
