import { query, initDatabaseSchema } from "./db";

export interface TransactionRow {
  id: string;
  invoiceNumber: string;
  userId: string;
  shopId?: string | null;
  productId?: string | null;
  productTitle: string;
  productImage?: string | null;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
  itemsSubtotal: number;
  paymentFee: number;
  discount: number;
  voucherCode?: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodName: string;
  paymentCategory: string;
  channelCode: string;
  paymentCode?: string | null;
  qrString?: string | null;
  prId?: string | null;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED" | "CANCELLED" | "FAILED";
  platformFee?: number;
  platformFeeRate?: number;
  shopTier?: string;
  netAmount?: number;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  paymentInfo?: any;
  deliveredBy?: string | null;
  deliveredAt?: string | null;
  licenseKey?: string | null;
  licenseKeys?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  invoiceNumber: string;
  userId: string;
  shopId?: string | null;
  productId?: string | null;
  productTitle: string;
  productImage?: string | null;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
  itemsSubtotal: number;
  paymentFee: number;
  discount?: number;
  voucherCode?: string | null;
  totalAmount: number;
  platformFee?: number;
  platformFeeRate?: number;
  shopTier?: string;
  netAmount?: number;
  paymentMethod?: string;
  paymentMethodName?: string;
  paymentCategory?: string;
  channelCode?: string;
  paymentCode?: string | null;
  qrString?: string | null;
  prId?: string | null;
  status?: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  paymentInfo?: any;
}

function mapRowToTransaction(row: any): TransactionRow {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    userId: row.user_id,
    shopId: row.shop_id,
    productId: row.product_id,
    productTitle: row.product_title,
    productImage: row.product_image,
    variant: row.variant,
    unitPrice: Number(row.unit_price || 0),
    quantity: Number(row.quantity || 1),
    itemsSubtotal: Number(row.items_subtotal || 0),
    paymentFee: Number(row.payment_fee || 0),
    discount: Number(row.discount || 0),
    voucherCode: row.voucher_code,
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: row.payment_method,
    paymentMethodName: row.payment_method_name,
    paymentCategory: row.payment_category,
    channelCode: row.channel_code,
    paymentCode: row.payment_code,
    qrString: row.qr_string,
    prId: row.pr_id,
    status: row.status,
    platformFee: Number(row.platform_fee || 0),
    platformFeeRate: Number(row.platform_fee_rate || 0),
    shopTier: row.shop_tier || "free",
    netAmount: (() => {
      const parsedNet = Number(row.net_amount);
      if (!isNaN(parsedNet) && parsedNet > 0) return parsedNet;
      const gross = Number(row.total_amount || 0);
      const disc = Number(row.discount || 0);
      const fee = Number(row.platform_fee || 0);
      return Math.max(0, gross - disc - fee);
    })(),
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    notes: row.notes,
    paymentInfo: row.payment_info,
    deliveredBy: row.delivered_by,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 1. Buat Transaksi Baru di PostgreSQL
 */
export async function createDbTransaction(
  input: CreateTransactionInput
): Promise<TransactionRow> {
  await initDatabaseSchema();

  const id = input.invoiceNumber;
  const sql = `
    INSERT INTO transactions (
      id, invoice_number, user_id, shop_id, product_id, product_title, product_image,
      variant, unit_price, quantity, items_subtotal, payment_fee, discount, voucher_code,
      total_amount, platform_fee, platform_fee_rate, shop_tier, net_amount,
      payment_method, payment_method_name, payment_category, channel_code,
      payment_code, qr_string, pr_id, status, buyer_name, buyer_email, buyer_phone,
      notes, payment_info, delivered_by, delivered_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, $23,
      $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34
    )
    ON CONFLICT (invoice_number) DO UPDATE SET
      payment_code = COALESCE(EXCLUDED.payment_code, transactions.payment_code),
      qr_string = COALESCE(EXCLUDED.qr_string, transactions.qr_string),
      pr_id = COALESCE(EXCLUDED.pr_id, transactions.pr_id),
      payment_info = COALESCE(EXCLUDED.payment_info, transactions.payment_info),
      platform_fee = COALESCE(EXCLUDED.platform_fee, transactions.platform_fee),
      platform_fee_rate = COALESCE(EXCLUDED.platform_fee_rate, transactions.platform_fee_rate),
      shop_tier = COALESCE(EXCLUDED.shop_tier, transactions.shop_tier),
      net_amount = COALESCE(EXCLUDED.net_amount, transactions.net_amount),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const params = [
    id,
    input.invoiceNumber,
    input.userId || "guest",
    input.shopId || null,
    input.productId || null,
    input.productTitle,
    input.productImage || null,
    input.variant || null,
    input.unitPrice,
    input.quantity,
    input.itemsSubtotal,
    input.paymentFee,
    input.discount || 0,
    input.voucherCode || null,
    input.totalAmount,
    input.platformFee || 0,
    input.platformFeeRate || 0,
    input.shopTier || "free",
    input.netAmount !== undefined ? input.netAmount : (input.totalAmount - (input.platformFee || 0)),
    input.paymentMethod || "qris",
    input.paymentMethodName || "QRIS",
    input.paymentCategory || "QRIS",
    input.channelCode || "QRIS",
    input.paymentCode || null,
    input.qrString || null,
    input.prId || null,
    input.status || "PENDING",
    input.buyerName || null,
    input.buyerEmail || null,
    input.buyerPhone || null,
    input.notes || null,
    JSON.stringify(input.paymentInfo || {}),
    null, // delivered_by (set later via update)
    null  // delivered_at (set later via update)
  ];

  const res = await query(sql, params);
  return mapRowToTransaction(res.rows[0]);
}

/**
 * 2. Perbarui Status Transaksi di PostgreSQL
 */
export async function updateDbTransactionStatus(
  identifier: string,
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED" | "CANCELLED" | "FAILED",
  extra?: {
    deliveredBy?: string;
    deliveredAt?: Date | string;
    paymentInfo?: any;
    platformFee?: number;
    platformFeeRate?: number;
    shopTier?: string;
    netAmount?: number;
  }
): Promise<TransactionRow | null> {
  await initDatabaseSchema();

  const updates: string[] = ["status = $2", "updated_at = CURRENT_TIMESTAMP"];
  const params: any[] = [identifier, status];

  if (extra?.deliveredBy) {
    params.push(extra.deliveredBy);
    updates.push(`delivered_by = $${params.length}`);
  }

  if (extra?.deliveredAt) {
    params.push(extra.deliveredAt);
    updates.push(`delivered_at = $${params.length}`);
  }

  if (extra?.paymentInfo) {
    params.push(JSON.stringify(extra.paymentInfo));
    updates.push(`payment_info = $${params.length}`);
  }

  if (extra?.platformFee !== undefined) {
    params.push(extra.platformFee);
    updates.push(`platform_fee = $${params.length}`);
  }

  if (extra?.platformFeeRate !== undefined) {
    params.push(extra.platformFeeRate);
    updates.push(`platform_fee_rate = $${params.length}`);
  }

  if (extra?.shopTier !== undefined) {
    params.push(extra.shopTier);
    updates.push(`shop_tier = $${params.length}`);
  }

  if (extra?.netAmount !== undefined) {
    params.push(extra.netAmount);
    updates.push(`net_amount = $${params.length}`);
  }

  const sql = `
    UPDATE transactions 
    SET ${updates.join(", ")}
    WHERE id = $1 OR invoice_number = $1 OR pr_id = $1
    RETURNING *;
  `;

  const res = await query(sql, params);
  if (res.rows.length === 0) return null;
  return mapRowToTransaction(res.rows[0]);
}

/**
 * 3. Ambil Transaksi Berdasarkan Invoice Number
 */
export async function getDbTransactionByInvoice(
  invoiceNumber: string
): Promise<TransactionRow | null> {
  await initDatabaseSchema();
  const res = await query(
    `SELECT * FROM transactions WHERE invoice_number = $1 OR id = $1 LIMIT 1`,
    [invoiceNumber]
  );
  if (res.rows.length === 0) return null;
  const tx = mapRowToTransaction(res.rows[0]);

  try {
    // 1. Ambil dari mail_delivery_logs
    const logRes = await query(
      `SELECT serial_key FROM mail_delivery_logs WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [tx.invoiceNumber]
    );
    if (logRes.rows.length > 0 && logRes.rows[0].serial_key) {
      tx.licenseKey = logRes.rows[0].serial_key;
      tx.licenseKeys = logRes.rows[0].serial_key
        .split("\n")
        .map((k: string) => k.trim())
        .filter(Boolean);
    } else {
      // 2. Ambil dari product_license_keys jika order_id cocok
      const keyRes = await query(
        `SELECT license_key FROM product_license_keys WHERE order_id = $1 ORDER BY id ASC`,
        [tx.invoiceNumber]
      );
      if (keyRes.rows.length > 0) {
        const keys = keyRes.rows.map((r: any) => r.license_key);
        tx.licenseKey = keys.join("\n");
        tx.licenseKeys = keys;
      }
    }
  } catch (err) {
    console.error("[getDbTransactionByInvoice] Error fetching license key:", err);
  }

  return tx;
}

/**
 * 4. Ambil Transaksi Berdasarkan Xendit Payment Request ID (pr_id)
 */
export async function getDbTransactionByPrId(
  prId: string
): Promise<TransactionRow | null> {
  await initDatabaseSchema();
  const res = await query(
    `SELECT * FROM transactions WHERE pr_id = $1 LIMIT 1`,
    [prId]
  );
  if (res.rows.length === 0) return null;
  return mapRowToTransaction(res.rows[0]);
}

/**
 * 5. Ambil Daftar Transaksi Pengguna (User Transactions)
 */
export async function getDbTransactionsByUserId(
  userId: string,
  limit = 50
): Promise<TransactionRow[]> {
  await initDatabaseSchema();
  const res = await query(
    `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return res.rows.map(mapRowToTransaction);
}

/**
 * 6. Ambil Daftar Pesanan Toko Penjual (Shop Orders)
 */
export async function getDbTransactionsByShopId(
  shopId: string,
  limit = 50
): Promise<TransactionRow[]> {
  await initDatabaseSchema();
  const res = await query(
    `SELECT * FROM transactions WHERE shop_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [shopId, limit]
  );
  return res.rows.map(mapRowToTransaction);
}

/**
 * 7. Ambil Seluruh Transaksi (Admin Platform)
 */
export async function getAllDbTransactions(limit = 100): Promise<TransactionRow[]> {
  await initDatabaseSchema();
  const res = await query(
    `SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map(mapRowToTransaction);
}
