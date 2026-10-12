import { query, initDatabaseSchema } from "./db";

export type DisputeStatus =
  | "OPEN"
  | "SELLER_RESPONDED"
  | "ADMIN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type DisputeReason =
  | "not_received"
  | "not_as_described"
  | "invalid_license"
  | "corrupted_file"
  | "wrong_item"
  | "refund_request"
  | "other";

export type DisputeResolution =
  | "refund_buyer"
  | "release_seller"
  | "partial_refund"
  | null;

export interface DisputeRecord {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  sellerId: string;
  sellerName?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  totalAmount: number;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  sellerResponse?: string | null;
  sellerRespondedAt?: string | null;
  adminNote?: string | null;
  resolution?: DisputeResolution;
  refundAmount?: number | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeInput {
  transactionId: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  sellerId: string;
  sellerName?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  totalAmount?: number;
  reason: DisputeReason;
  description: string;
  evidenceUrls?: string[];
}

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  not_received: "Produk tidak diterima",
  not_as_described: "Tidak sesuai deskripsi",
  invalid_license: "Lisensi / kunci tidak valid",
  corrupted_file: "File rusak / tidak lengkap",
  wrong_item: "Item salah / berbeda",
  refund_request: "Permintaan pengembalian dana",
  other: "Alasan lainnya",
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Menunggu Respon Penjual",
  SELLER_RESPONDED: "Sudah Direspon Penjual",
  ADMIN_REVIEW: "Ditinjau Admin",
  RESOLVED: "Selesai / Diselesaikan",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

// ─── Ensure disputes table exists ─────────────────────────────────────────────
export async function ensureDisputesTable() {
  await initDatabaseSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS disputes (
      id VARCHAR(64) PRIMARY KEY,
      transaction_id VARCHAR(150) NOT NULL,
      invoice_number VARCHAR(150),
      buyer_id VARCHAR(128) NOT NULL,
      buyer_name VARCHAR(150),
      buyer_email VARCHAR(255),
      seller_id VARCHAR(128) NOT NULL,
      seller_name VARCHAR(150),
      product_title VARCHAR(255),
      product_image TEXT,
      total_amount NUMERIC(12, 2) DEFAULT 0.00,
      reason VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      evidence_urls TEXT[] DEFAULT '{}',
      status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
      seller_response TEXT,
      seller_responded_at TIMESTAMPTZ,
      admin_note TEXT,
      resolution VARCHAR(30),
      refund_amount NUMERIC(12, 2),
      resolved_by VARCHAR(128),
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_disputes_buyer ON disputes(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_transaction ON disputes(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(150);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(150);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS seller_name VARCHAR(150);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS product_title VARCHAR(255);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS product_image TEXT;
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0.00;
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS seller_responded_at TIMESTAMPTZ;
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_note TEXT;
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution VARCHAR(30);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12, 2);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(128);
    ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
  `);
}

function mapRow(row: any): DisputeRecord {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    invoiceNumber: row.invoice_number || "",
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    productTitle: row.product_title,
    productImage: row.product_image,
    totalAmount: Number(row.total_amount) || 0,
    reason: row.reason as DisputeReason,
    description: row.description || "",
    evidenceUrls: row.evidence_urls || [],
    status: row.status as DisputeStatus,
    sellerResponse: row.seller_response,
    sellerRespondedAt: row.seller_responded_at
      ? new Date(row.seller_responded_at).toISOString()
      : null,
    adminNote: row.admin_note,
    resolution: row.resolution || null,
    refundAmount: row.refund_amount ? Number(row.refund_amount) : null,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at
      ? new Date(row.resolved_at).toISOString()
      : null,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : new Date().toISOString(),
  };
}

// ─── Create dispute ────────────────────────────────────────────────────────────
export async function createDispute(
  input: CreateDisputeInput
): Promise<DisputeRecord> {
  await ensureDisputesTable();

  const id = `DSP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const res = await query(
    `INSERT INTO disputes (
      id, transaction_id, invoice_number, buyer_id, buyer_name, buyer_email,
      seller_id, seller_name, product_title, product_image, total_amount,
      reason, description, evidence_urls, status
    ) VALUES (
      $1::TEXT, $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT,
      $7::TEXT, $8::TEXT, $9::TEXT, $10::TEXT, $11::NUMERIC,
      $12::TEXT, $13::TEXT, $14::TEXT[], 'OPEN'
    ) RETURNING *`,
    [
      id,
      input.transactionId,
      input.invoiceNumber || "",
      input.buyerId,
      input.buyerName || null,
      input.buyerEmail || null,
      input.sellerId,
      input.sellerName || null,
      input.productTitle || null,
      input.productImage || null,
      input.totalAmount || 0,
      input.reason,
      input.description,
      input.evidenceUrls || [],
    ]
  );
  return mapRow(res.rows[0]);
}

// ─── Get one by ID ─────────────────────────────────────────────────────────────
export async function getDisputeById(
  id: string
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const res = await query(`SELECT * FROM disputes WHERE id = $1::TEXT`, [id]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

// ─── Get by transaction ─────────────────────────────────────────────────────────
export async function getDisputeByTransactionId(
  transactionId: string
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const res = await query(
    `SELECT * FROM disputes WHERE transaction_id = $1::TEXT ORDER BY created_at DESC LIMIT 1`,
    [transactionId]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

// ─── Get all disputes for a buyer ─────────────────────────────────────────────
export async function getDisputesByBuyer(
  buyerId: string
): Promise<DisputeRecord[]> {
  await ensureDisputesTable();
  const res = await query(
    `SELECT * FROM disputes WHERE buyer_id = $1::TEXT ORDER BY created_at DESC`,
    [buyerId]
  );
  return res.rows.map(mapRow);
}

// ─── Get all disputes for a seller ────────────────────────────────────────────
export async function getDisputesBySeller(
  sellerId: string
): Promise<DisputeRecord[]> {
  await ensureDisputesTable();
  const res = await query(
    `SELECT * FROM disputes WHERE seller_id = $1::TEXT ORDER BY created_at DESC`,
    [sellerId]
  );
  return res.rows.map(mapRow);
}

// ─── Get all disputes (admin) ──────────────────────────────────────────────────
export async function getAllDisputes(
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<DisputeRecord[]> {
  await ensureDisputesTable();
  let q = `SELECT * FROM disputes`;
  const params: any[] = [];
  if (options.status && options.status !== "all") {
    q += ` WHERE status = $${params.length + 1}::TEXT`;
    params.push(options.status);
  }
  q += ` ORDER BY created_at DESC`;
  if (options.limit) {
    q += ` LIMIT $${params.length + 1}::INT`;
    params.push(options.limit);
  }
  if (options.offset) {
    q += ` OFFSET $${params.length + 1}::INT`;
    params.push(options.offset);
  }
  const res = await query(q, params);
  return res.rows.map(mapRow);
}

// ─── Seller respond ────────────────────────────────────────────────────────────
export async function sellerRespondToDispute(
  id: string,
  response: string
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const res = await query(
    `UPDATE disputes
     SET seller_response = $2::TEXT,
         seller_responded_at = NOW(),
         status = 'SELLER_RESPONDED',
         updated_at = NOW()
     WHERE id = $1::TEXT
     RETURNING *`,
    [id, response]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

// ─── Admin resolve ─────────────────────────────────────────────────────────────
export async function adminResolveDispute(
  id: string,
  data: {
    resolution: DisputeResolution;
    adminNote?: string;
    refundAmount?: number;
    resolvedBy?: string;
    status?: DisputeStatus;
  }
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const newStatus = data.status || "RESOLVED";
  const res = await query(
    `UPDATE disputes
     SET resolution = $2::TEXT,
         admin_note = $3::TEXT,
         refund_amount = $4::NUMERIC,
         resolved_by = $5::TEXT,
         resolved_at = NOW(),
         status = $6::TEXT,
         updated_at = NOW()
     WHERE id = $1::TEXT
     RETURNING *`,
    [
      id,
      data.resolution,
      data.adminNote || null,
      data.refundAmount || null,
      data.resolvedBy || null,
      newStatus,
    ]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

// ─── Escalate to admin review ──────────────────────────────────────────────────
export async function escalateToAdminReview(
  id: string
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const res = await query(
    `UPDATE disputes
     SET status = 'ADMIN_REVIEW', updated_at = NOW()
     WHERE id = $1::TEXT
     RETURNING *`,
    [id]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

// ─── Buyer cancel dispute ──────────────────────────────────────────────────────
export async function cancelDispute(
  id: string,
  buyerId: string
): Promise<DisputeRecord | null> {
  await ensureDisputesTable();
  const res = await query(
    `UPDATE disputes
     SET status = 'CANCELLED', updated_at = NOW()
     WHERE id = $1::TEXT AND buyer_id = $2::TEXT AND status = 'OPEN'
     RETURNING *`,
    [id, buyerId]
  );
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}
