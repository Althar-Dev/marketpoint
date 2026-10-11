import { query, initDatabaseSchema } from "./db";

export interface MailAccountRow {
  email: string;
  name: string;
  role: string;
  usage: string;
  quota: string;
  status: string;
}

export interface MailMessageRow {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  folder: "inbox" | "sent" | "drafts" | "trash";
  previousFolder?: "inbox" | "sent" | "drafts";
  isUnread: boolean;
  date: string;
  attachment?: {
    name: string;
    size: string;
  };
}

export interface MailDeliveryLogRow {
  id: string;
  orderId: string;
  productTitle: string;
  recipient: string;
  sentAt: string;
  status: "DELIVERED" | "PENDING" | "FAILED";
  serialKeySnippet: string;
  fullSerialKey: string;
  productId?: string;
}

// 0. Bersihkan semua data pesan, log, dan akun mock
export async function clearAllDbMailData() {
  await initDatabaseSchema();
  await query(`TRUNCATE mail_messages, mail_delivery_logs, mail_accounts;`);
}

// 1. Ambil Akun Email
export async function getDbMailAccounts(): Promise<MailAccountRow[]> {
  await initDatabaseSchema();
  const res = await query(`
    SELECT email, name, role, usage, quota, status 
    FROM mail_accounts 
    ORDER BY created_at ASC
  `);
  return res.rows;
}

// 2. Buat Akun Email Baru
export async function createDbMailAccount(account: {
  email: string;
  name: string;
  role: string;
  quota: string;
}): Promise<MailAccountRow> {
  await initDatabaseSchema();
  const res = await query(
    `
    INSERT INTO mail_accounts (email, name, role, usage, quota, status)
    VALUES ($1, $2, $3, '0.0 GB', $4, 'ACTIVE')
    RETURNING email, name, role, usage, quota, status
  `,
    [account.email, account.name, account.role, account.quota]
  );
  return res.rows[0];
}

// 2b. Perbarui Akun Email
export async function updateDbMailAccount(account: {
  originalEmail: string;
  name: string;
  role: string;
  quota: string;
  status?: string;
}): Promise<MailAccountRow> {
  await initDatabaseSchema();
  const res = await query(
    `
    UPDATE mail_accounts 
    SET name = $1, role = $2, quota = $3, status = COALESCE($4, status)
    WHERE email = $5
    RETURNING email, name, role, usage, quota, status
  `,
    [account.name, account.role, account.quota, account.status || 'ACTIVE', account.originalEmail]
  );
  return res.rows[0];
}

// 2c. Hapus Akun Email
export async function deleteDbMailAccount(email: string): Promise<boolean> {
  await initDatabaseSchema();
  await query(`DELETE FROM mail_accounts WHERE email = $1`, [email]);
  return true;
}

// 3. Ambil Daftar Pesan Email
export async function getDbMailMessages(): Promise<MailMessageRow[]> {
  await initDatabaseSchema();
  const res = await query(`
    SELECT 
      id, 
      from_email AS "from", 
      to_email AS "to", 
      subject, 
      preview, 
      content, 
      folder, 
      previous_folder AS "previousFolder",
      is_unread AS "isUnread", 
      attachment_name AS "attachmentName", 
      attachment_size AS "attachmentSize",
      created_at AS "createdAt"
    FROM mail_messages 
    ORDER BY created_at DESC
  `);

  return res.rows.map((row) => ({
    id: row.id,
    from: row.from,
    to: row.to,
    subject: row.subject,
    preview: row.preview || "",
    content: row.content,
    folder: row.folder,
    previousFolder: row.previousFolder || undefined,
    isUnread: row.isUnread,
    date: formatMailDate(row.createdAt),
    attachment: row.attachmentName
      ? {
          name: row.attachmentName,
          size: row.attachmentSize || "1.0 MB",
        }
      : undefined,
  }));
}

// 4. Kirim Email Baru (Simpan ke folder 'sent')
export async function sendDbMailMessage(params: {
  from: string;
  to: string;
  subject: string;
  content: string;
  preview?: string;
}): Promise<MailMessageRow> {
  await initDatabaseSchema();
  const sentId = `mail-${Date.now()}-sent`;
  const inboxId = `mail-${Date.now()}-inbox`;
  
  let preview = params.preview;
  if (!preview) {
    const cleanText = params.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    preview = cleanText.substring(0, 70) + "...";
  }

  // Simpan ke folder 'sent' milik pengirim
  await query(
    `
    INSERT INTO mail_messages (id, from_email, to_email, subject, preview, content, folder, is_unread)
    VALUES ($1, $2, $3, $4, $5, $6, 'sent', false)
  `,
    [sentId, params.from, params.to, params.subject, preview, params.content]
  );

  // Simpan salinan ke folder 'inbox' milik penerima agar terlihat di kotak masuk
  await query(
    `
    INSERT INTO mail_messages (id, from_email, to_email, subject, preview, content, folder, is_unread)
    VALUES ($1, $2, $3, $4, $5, $6, 'inbox', true)
  `,
    [inboxId, params.from, params.to, params.subject, preview, params.content]
  );

  return {
    id: sentId,
    from: params.from,
    to: params.to,
    subject: params.subject,
    preview,
    content: params.content,
    folder: "sent",
    isUnread: false,
    date: "Baru saja",
  };
}

// 5. Pindahkan Folder (Pindah ke 'trash' atau 'inbox')
export async function updateDbMailFolder(
  id: string,
  targetFolder: "inbox" | "sent" | "drafts" | "trash",
  previousFolder?: "inbox" | "sent" | "drafts"
) {
  await initDatabaseSchema();
  await query(
    `
    UPDATE mail_messages 
    SET folder = $1, previous_folder = COALESCE($2, previous_folder)
    WHERE id = $3
  `,
    [targetFolder, previousFolder || null, id]
  );
}

// 6. Tandai Email Sudah Dibaca
export async function markDbMailAsRead(id: string) {
  await initDatabaseSchema();
  await query(`UPDATE mail_messages SET is_unread = FALSE WHERE id = $1`, [id]);
}

// 6b. Tandai Semua Email di Folder Sudah Dibaca
export async function markAllDbMailAsRead(folder: string = "inbox") {
  await initDatabaseSchema();
  await query(`UPDATE mail_messages SET is_unread = FALSE WHERE folder = $1`, [folder]);
}

// 6c. Tandai Beberapa Email Sudah Dibaca (Bulk)
export async function markMultipleDbMailAsRead(ids: string[]) {
  if (!ids || ids.length === 0) return;
  await initDatabaseSchema();
  await query(`UPDATE mail_messages SET is_unread = FALSE WHERE id = ANY($1)`, [ids]);
}

// 6d. Tandai Beberapa Email Belum Dibaca (Bulk)
export async function markMultipleDbMailAsUnread(ids: string[]) {
  if (!ids || ids.length === 0) return;
  await initDatabaseSchema();
  await query(`UPDATE mail_messages SET is_unread = TRUE WHERE id = ANY($1)`, [ids]);
}

// 6e. Pindahkan Beberapa Email ke Folder Tertentu (Bulk)
export async function updateMultipleDbMailFolder(
  ids: string[],
  targetFolder: "inbox" | "sent" | "drafts" | "trash"
) {
  if (!ids || ids.length === 0) return;
  await initDatabaseSchema();
  await query(`UPDATE mail_messages SET folder = $1 WHERE id = ANY($2)`, [targetFolder, ids]);
}

// 7. Hapus Email Permanen
export async function deleteDbMailPermanently(id: string) {
  await initDatabaseSchema();
  await query(`DELETE FROM mail_messages WHERE id = $1`, [id]);
}

// 7b. Hapus Beberapa Email Permanen (Bulk)
export async function deleteMultipleDbMailPermanently(ids: string[]) {
  if (!ids || ids.length === 0) return;
  await initDatabaseSchema();
  await query(`DELETE FROM mail_messages WHERE id = ANY($1)`, [ids]);
}

// 7. Ambil Log Auto-Delivery
export async function getDbDeliveryLogs(): Promise<MailDeliveryLogRow[]> {
  await initDatabaseSchema();
  const res = await query(`
    SELECT id, order_id AS "orderId", product_title AS "productTitle", recipient, status, serial_key AS "serialKey", product_id AS "productId", created_at AS "createdAt"
    FROM mail_delivery_logs
    ORDER BY created_at DESC
  `);

  return res.rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    productTitle: row.productTitle,
    recipient: row.recipient,
    sentAt: formatMailDate(row.createdAt),
    status: row.status as any,
    serialKeySnippet: formatSerialSnippet(row.serialKey),
    fullSerialKey: row.serialKey,
    productId: row.productId || undefined,
  }));
}

// 7b. Ambil Log Auto-Delivery Berdasarkan Order ID (untuk pencegahan duplikasi/idempotency)
export async function getDbDeliveryLogByOrderId(orderId: string): Promise<MailDeliveryLogRow | null> {
  await initDatabaseSchema();
  const res = await query(
    `
    SELECT id, order_id AS "orderId", product_title AS "productTitle", recipient, status, serial_key AS "serialKey", product_id AS "productId", created_at AS "createdAt"
    FROM mail_delivery_logs
    WHERE order_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [orderId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    orderId: row.orderId,
    productTitle: row.productTitle,
    recipient: row.recipient,
    sentAt: formatMailDate(row.createdAt),
    status: row.status as any,
    serialKeySnippet: formatSerialSnippet(row.serialKey),
    fullSerialKey: row.serialKey,
    productId: row.productId || undefined,
  };
}

// 8. Buat Log Auto-Delivery Baru
export async function createDbDeliveryLog(params: {
  orderId: string;
  productTitle: string;
  recipient: string;
  serialKey: string;
  productId?: string;
  status?: "DELIVERED" | "PENDING" | "FAILED";
}) {
  await initDatabaseSchema();
  const id = `del-${Date.now()}`;
  await query(
    `
    INSERT INTO mail_delivery_logs (id, order_id, product_title, recipient, status, serial_key, product_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [
      id,
      params.orderId,
      params.productTitle,
      params.recipient,
      params.status || "DELIVERED",
      params.serialKey,
      params.productId || null,
    ]
  );
  return id;
}

// 8b. Update Penerima Delivery & Sinkronkan ke Transaksi
export async function updateDbDeliveryRecipient(params: {
  orderId: string;
  newRecipient: string;
  updateTransaction?: boolean;
}) {
  await initDatabaseSchema();
  await query(
    `UPDATE mail_delivery_logs SET recipient = $1 WHERE order_id = $2`,
    [params.newRecipient, params.orderId]
  );

  if (params.updateTransaction !== false) {
    try {
      await query(
        `UPDATE transactions SET buyer_email = $1 WHERE invoice_number = $2 OR id = $2`,
        [params.newRecipient, params.orderId]
      );
    } catch (txErr) {
      console.warn("[UPDATE TX BUYER EMAIL WARN]", txErr);
    }
  }
}

// 8c. Bersihkan Semua Log Auto-Delivery
export async function clearDbDeliveryLogs() {
  await initDatabaseSchema();
  await query(`DELETE FROM mail_delivery_logs`);
}

// 8d. Hapus Log Auto-Delivery Tertentu
export async function deleteDbDeliveryLog(id: string) {
  await initDatabaseSchema();
  await query(`DELETE FROM mail_delivery_logs WHERE id = $1`, [id]);
}

// 9. Pastikan Akun delivery@marketpoint.id Tersedia dan Aktif
export async function ensureDeliveryAccountExists() {
  await initDatabaseSchema();
  await query(
    `
    INSERT INTO mail_accounts (email, name, role, usage, quota, status)
    VALUES ('delivery@marketpoint.id', 'MarketPoint Delivery Service', 'Automated Fulfillment', '0.0 GB', '10 GB', 'ACTIVE')
    ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE'
  `
  );
}

// Helper formats
function formatMailDate(date: string | Date | undefined): string {
  if (!date) return "Baru saja";
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  }
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatSerialSnippet(key: string): string {
  if (!key) return "****";
  if (key.length <= 12) return key;
  return key.substring(0, 10) + "-****";
}
