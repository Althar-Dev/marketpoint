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
      const label = licenseKeys.length > 1 ? `Unit ${idx + 1}` : "Data Produk";
      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);">
          <!-- Header Bar Kartu Lisensi -->
          <div style="background-color: #f8fafc; padding: 9px 16px; border-bottom: 1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">
                  ${label}
                </td>
                <td align="right">
                  <span style="font-size: 9px; font-weight: 700; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block;">
                    Siap Digunakan
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <!-- Box Monospace Kode Lisensi -->
          <div style="padding: 12px 14px; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 6px;">
              <tr>
                <td style="padding: 12px 14px; text-align: left; vertical-align: middle;">
                  <div style="font-family: Consolas, 'Roboto Mono', Monaco, 'Courier New', Courier, monospace; font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-all; letter-spacing: 0.06em;">
                    ${k}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
    })
    .join("");

  const downloadFilesHtml =
    downloadFiles.length > 0
      ? `
        <div style="margin-top: 20px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;">
            Berkas Unduhan Produk
          </div>
          ${downloadFiles
        .map(
          (f, i) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${i + 1}. ${f.fileName} ${f.version ? `(${f.version})` : ""}</div>
                    ${f.fileSize ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${(f.fileSize / (1024 * 1024)).toFixed(2)} MB</div>` : ""}
                  </td>
                  <td align="right" style="vertical-align: middle; white-space: nowrap;">
                    <a href="${f.fileUrl}" style="display: inline-block; background-color: #00AA5B; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 5px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;">Unduh Berkas</a>
                  </td>
                </tr>
              </table>
            `
        )
        .join("")}
        </div>
      `
      : "";

  const demoUrlHtml = demoUrl
    ? `
      <div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Tautan Demo / Dokumentasi: </span>
        <a href="${demoUrl}" style="font-size: 12px; color: #0284c7; text-decoration: underline; font-weight: 600;">${demoUrl}</a>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengiriman Pesanan #${orderId} - MarketPoint</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5;">
  <!-- Wrapper Luar (Padding Ringkas & Rapi) -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 14px 6px; margin: 0;">
    <tr>
      <td align="center">
        <!-- Container Kartu Utama (Tema Terang Sesuai MarketPoint) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          
          <!-- Header Banner (Light Theme dengan Logo Resmi) -->
          <tr>
            <td style="background-color: #ffffff; padding: 18px 24px; border-bottom: 1px solid #f1f5f9; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img 
                            src="https://marketpoint.id/assets/img/logo.png" 
                            alt="MarketPoint" 
                            width="36" 
                            height="36" 
                            style="display: block; width: 36px; height: 36px; border-radius: 8px; object-fit: contain;" 
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">
                            Market<span style="color: #00AA5B;">Point</span>
                          </div>
                          <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">
                            Layanan Pengiriman Digital Resmi
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; display: inline-block;">
                      Lunas &amp; Terkirim
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Isi Email -->
          <tr>
            <td style="padding: 24px;">
              <h1 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Halo, ${recipientName}
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
                Terima kasih atas pesanan Anda di MarketPoint. Pembayaran Anda telah terverifikasi oleh sistem escrow dan lisensi produk digital Anda otomatis diterbitkan di bawah ini.
              </p>

              <!-- Kartu Rincian Pesanan (Modern Structured Receipt) -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 22px;">
                <!-- Header Sub-Bar -->
                <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">
                        Rincian Transaksi
                      </td>
                      <td align="right" style="font-size: 11px; font-weight: 700; color: #00AA5B; font-family: monospace;">
                        #${orderId}
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- Rows Table -->
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px;">
                  <tr>
                    <td style="padding: 10px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 35%;">Produk</td>
                    <td align="right" style="padding: 10px 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${productTitle}</td>
                  </tr>
                  ${variant ? `<tr>
                    <td style="padding: 9px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Varian</td>
                    <td align="right" style="padding: 9px 16px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${variant}</td>
                  </tr>` : ""}
                  ${quantity > 1 ? `<tr>
                    <td style="padding: 9px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Jumlah</td>
                    <td align="right" style="padding: 9px 16px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${quantity} lisensi</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding: 9px 16px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Tanggal Pesanan</td>
                    <td align="right" style="padding: 9px 16px; font-weight: 600; color: #334155; border-bottom: 1px solid #f1f5f9;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 9px 16px; color: #64748b;">Status Pembayaran</td>
                    <td align="right" style="padding: 9px 16px; font-weight: 700; color: #059669;">Lunas (Escrow Terverifikasi)</td>
                  </tr>
                </table>
              </div>

              <!-- Lisensi / Serial Key -->
              <div style="margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">
                  Data Produk
                </div>
                ${licenseListHtml}
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  Simpan Data Produk di atas dengan aman sebagai bukti resmi kepemilikan Anda.
                </div>
              </div>

              <!-- Berkas Unduhan & Demo -->
              ${downloadFilesHtml}
              ${demoUrlHtml}

              <!-- Panduan Aktivasi Singkat -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 6px;">
                  Panduan Aktivasi:
                </div>
                <ol style="margin: 0; padding-left: 18px; font-size: 12px; color: #15803d; line-height: 1.6;">
                  <li>Salin kode serial key / lisensi yang tertera di atas.</li>
                  <li>Unduh berkas produk atau buka platform aplikasi terkait.</li>
                  <li>Masukkan serial key pada formulir aktivasi atau ikuti instruksi pada panduan produk.</li>
                </ol>
              </div>

              <!-- Tombol Cek Detail Transaksi di Web -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://marketpoint.id/transactions/${encodeURIComponent(orderId)}" style="display: inline-block; background-color: #00AA5B; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.02em;">
                  Lihat Detail Transaksi &amp; Faktur
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;">
                Email ini dikirim otomatis oleh MarketPoint Delivery Engine dari <strong>delivery@marketpoint.id</strong>.
              </p>
              <p style="margin: 0;">
                Seluruh transaksi dilindungi sistem escrow MarketPoint. Butuh bantuan? Kunjungi <a href="https://marketpoint.id" style="color: #00AA5B; text-decoration: underline;">marketpoint.id</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
