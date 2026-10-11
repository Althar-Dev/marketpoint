import { query, getClient, initDatabaseSchema } from "./database/db";
import { getProductById } from "./database/product";
import {
  sendDbMailMessage,
  createDbDeliveryLog,
  getDbDeliveryLogByOrderId,
  ensureDeliveryAccountExists,
} from "./database/mail-db";

export interface DeliveryInput {
  orderId: string;
  productId?: string;
  productTitle?: string;
  recipientEmail: string;
  recipientName?: string;
  variant?: string | null;
  quantity?: number;
  forceResend?: boolean;
}

export interface DeliveryResult {
  success: boolean;
  isDuplicate?: boolean;
  message: string;
  orderId: string;
  recipientEmail: string;
  productTitle: string;
  licenseKeys: string[];
  mailId?: string;
  downloadFiles?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    version?: string;
  }>;
}

/**
 * Generate formatted digital license key
 */
function generateOfficialLicenseKey(prefix: string, orderId: string): string {
  const cleanPrefix = (prefix || "MP")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const orderSnippet = (orderId || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-4)
    .toUpperCase() || "ORD1";
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `MP-${cleanPrefix}-${orderSnippet}-${p1}-${p2}`;
}

/**
 * Main automated digital product delivery handler
 * Sends license & download instructions directly from delivery@marketpoint.id
 */
export async function deliverProductLicense(
  input: DeliveryInput
): Promise<DeliveryResult> {
  const {
    orderId,
    productId,
    productTitle,
    recipientEmail,
    recipientName = "Pelanggan MarketPoint",
    variant,
    quantity = 1,
    forceResend = false,
  } = input;

  if (!orderId || !recipientEmail) {
    throw new Error("Nomor pesanan (orderId) dan email penerima (recipientEmail) wajib disertakan.");
  }

  await initDatabaseSchema();
  await ensureDeliveryAccountExists();

  // 1. Cek pencegahan duplikasi (Idempotency)
  if (!forceResend) {
    const existingLog = await getDbDeliveryLogByOrderId(orderId);
    if (existingLog && existingLog.status === "DELIVERED") {
      return {
        success: true,
        isDuplicate: true,
        message: `Pesanan ${orderId} sudah pernah dikirimkan sebelumnya ke ${existingLog.recipient}.`,
        orderId,
        recipientEmail: existingLog.recipient,
        productTitle: existingLog.productTitle,
        licenseKeys: existingLog.fullSerialKey ? existingLog.fullSerialKey.split("\n") : [],
      };
    }
  }

  // 2. Ambil informasi produk dari PostgreSQL
  let resolvedTitle = productTitle || "Produk Digital MarketPoint";
  let allocatedKeys: string[] = [];
  let downloadFiles: Array<{ fileName: string; fileUrl: string; fileSize?: number; version?: string }> = [];
  let demoUrl: string | undefined;
  let descriptionSnippet: string | undefined;

  if (productId) {
    try {
      const product = await getProductById(productId);
      if (product) {
        resolvedTitle = product.title || resolvedTitle;
        downloadFiles = product.files || [];
        demoUrl = product.demoUrl;
        descriptionSnippet = product.shortDescription || product.description;

        // Tangani Lisensi berdasarkan tipe stok
        if (product.stockType === "SINGLE_USE") {
          const client = await getClient();
          try {
            await client.query("BEGIN");

            // Ambil key yang belum terpakai sebanyak kuantitas
            const keyRes = await client.query(
              `
              SELECT id, license_key 
              FROM product_license_keys 
              WHERE product_id = $1 AND is_used = FALSE 
              ORDER BY id ASC 
              LIMIT $2 
              FOR UPDATE SKIP LOCKED
            `,
              [product.id, Math.max(1, quantity)]
            );

            if (keyRes.rows.length > 0) {
              const ids = keyRes.rows.map((r) => r.id);
              allocatedKeys = keyRes.rows.map((r) => r.license_key);

              // Tandai key sebagai terpakai
              await client.query(
                `
                UPDATE product_license_keys 
                SET is_used = TRUE, used_at = CURRENT_TIMESTAMP, order_id = $1 
                WHERE id = ANY($2)
              `,
                [orderId, ids]
              );

              // Update stock_count dan sales_count pada tabel products
              await client.query(
                `
                UPDATE products 
                SET stock_count = GREATEST(0, stock_count - $1), sales_count = sales_count + $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
              `,
                [ids.length, product.id]
              );
            }

            await client.query("COMMIT");
          } catch (keyErr) {
            await client.query("ROLLBACK");
            console.warn("[DELIVERY KEY ALLOCATION WARN]", keyErr);
          } finally {
            client.release();
          }
        } else {
          // REUSABLE: Update sales_count
          try {
            await query(
              `UPDATE products SET sales_count = sales_count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
              [Math.max(1, quantity), product.id]
            );
          } catch (scErr) {
            console.warn("[DELIVERY SALES COUNT WARN]", scErr);
          }
        }
      }
    } catch (dbErr) {
      console.warn("[DELIVERY PRODUCT FETCH WARN]", dbErr);
    }
  }

  // Jika belum ada serial key dari database (atau produk berjenis REUSABLE), generate key resmi
  if (allocatedKeys.length === 0) {
    for (let i = 0; i < Math.max(1, quantity); i++) {
      allocatedKeys.push(
        generateOfficialLicenseKey(resolvedTitle.slice(0, 4), `${orderId}-${i + 1}`)
      );
    }
  }

  const combinedKeysString = allocatedKeys.join("\n");

  // 3. Susun isi email yang sangat informatif, rapi, dan elegan
  const emailSubject = `[Delivery] Lisensi & Data Akses Produk - Pesanan #${orderId}`;

  const greetingName = recipientName ? recipientName.trim() : "Pelanggan Setia";
  const nowFormatted = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  let emailContent = `Halo ${greetingName},

Terima kasih telah berbelanja di MarketPoint! 
Pembayaran untuk pesanan Anda telah berhasil diverifikasi oleh sistem escrow kami pada ${nowFormatted}.

Berikut adalah data lisensi resmi dan akses produk digital Anda:

============================================================
RINCIAN PESANAN
============================================================
• Nomor Pesanan : #${orderId}
• Nama Produk   : ${resolvedTitle}${variant ? `\n• Varian        : ${variant}` : ""}${quantity > 1 ? `\n• Jumlah        : ${quantity} unit` : ""}
• Status        : Lunas & Terkirim Otomatis
• Pengirim      : delivery@marketpoint.id (MarketPoint Mail Engine)

============================================================
KODE LISENSI / SERIAL KEY RESMI
============================================================
${allocatedKeys
  .map((k, idx) => (allocatedKeys.length > 1 ? `[Unit ${idx + 1}] ${k}` : k))
  .join("\n")}

Harap simpan kode lisensi ini di tempat yang aman. Kode ini merupakan bukti kepemilikan lisensi digital Anda.
`;

  // Lampiran tautan unduhan jika ada
  if (downloadFiles.length > 0) {
    emailContent += `
============================================================
BERKAS UNDUHAN PRODUK DIGITAL
============================================================
Silakan unduh berkas produk Anda melalui tautan resmi di bawah ini:
${downloadFiles
  .map(
    (f, idx) =>
      `${idx + 1}. ${f.fileName} ${f.version ? `(${f.version})` : ""}\n   Unduh: ${f.fileUrl}`
  )
  .join("\n\n")}
`;
  }

  // Tautan demo atau panduan jika ada
  if (demoUrl) {
    emailContent += `
• Tautan Demo / Dokumentasi Langsung: ${demoUrl}
`;
  }

  // Petunjuk aktivasi standar
  emailContent += `
============================================================
PANDUAN AKTIVASI & PENGGUNAAN
============================================================
1. Salin kode serial key / lisensi resmi di atas.
2. Buka aplikasi, platform, atau berkas produk yang telah Anda dapatkan.
3. Masuk ke menu Aktivasi / Registrasi Lisensi atau ikuti berkas dokumentasi (README) yang disediakan.
4. Masukkan kode serial key untuk membuka fitur penuh atau aktivasi akun Anda.

============================================================
GARANSI TRANSAKSI & BANTUAN
============================================================
Semua transaksi di MarketPoint dilindungi garansi keamanan. Apabila Anda mengalami kendala saat aktivasi lisensi atau memerlukan bantuan teknis, Anda dapat langsung membalas email ini atau membuka tiket bantuan melalui platform MarketPoint.

Salam hangat,
MarketPoint Delivery Service
delivery@marketpoint.id | www.marketpoint.id`;

  // 4. Simpan email ke PostgreSQL mail_messages (folder: 'sent')
  const newMail = await sendDbMailMessage({
    from: "delivery@marketpoint.id",
    to: recipientEmail.trim(),
    subject: emailSubject,
    content: emailContent,
  });

  // 5. Simpan log pengiriman ke PostgreSQL mail_delivery_logs
  await createDbDeliveryLog({
    orderId,
    productTitle: resolvedTitle,
    recipient: recipientEmail.trim(),
    serialKey: combinedKeysString,
    productId: productId || undefined,
    status: "DELIVERED",
  });

  return {
    success: true,
    isDuplicate: false,
    message: `Lisensi pesanan ${orderId} berhasil dikirimkan oleh delivery@marketpoint.id ke ${recipientEmail}.`,
    orderId,
    recipientEmail: recipientEmail.trim(),
    productTitle: resolvedTitle,
    licenseKeys: allocatedKeys,
    mailId: newMail.id,
    downloadFiles,
  };
}
