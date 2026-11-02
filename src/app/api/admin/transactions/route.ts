import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import { verifyAdminRequest } from "@/lib/server-auth";
import { addUserBalance } from "@/lib/database/balance";
import { firebaseConfig } from "@/firebase/config";

/**
 * GET /api/admin/transactions
 * Retrieve transactions ledger with filters, search, and aggregates.
 * Requires Admin privileges.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Akses ditolak. Memerlukan otoritas Administrator." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const category = searchParams.get("category") || "ALL";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 200);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  try {
    // Auto-expire pending manual top-ups older than 15 minutes
    try {
      await query(`
        UPDATE transactions 
        SET status = 'EXPIRED', notes = COALESCE(notes, '') || ' [Kadaluarsa otomatis setelah 15 menit]'
        WHERE status = 'PENDING' 
          AND (payment_category IN ('MANUAL', 'MANUAL_TRANSFER') OR product_title ILIKE 'Top Up Saldo%')
          AND created_at < NOW() - INTERVAL '15 minutes'
      `);
    } catch (e) {
      console.warn("[ADMIN_AUTO_EXPIRE_MANUAL_TOPUP_WARN]", e);
    }

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (search.trim()) {
      whereConditions.push(
        `(invoice_number ILIKE $${paramIdx} OR buyer_name ILIKE $${paramIdx} OR buyer_email ILIKE $${paramIdx} OR user_id ILIKE $${paramIdx})`
      );
      queryParams.push(`%${search.trim()}%`);
      paramIdx++;
    }

    if (status !== "ALL") {
      whereConditions.push(`status = $${paramIdx}`);
      queryParams.push(status.toUpperCase());
      paramIdx++;
    }

    if (category !== "ALL") {
      if (category.toUpperCase() === "MANUAL" || category.toUpperCase() === "MANUAL_TRANSFER") {
        whereConditions.push(`(payment_category IN ('MANUAL', 'MANUAL_TRANSFER') OR product_title ILIKE 'Top Up Saldo%')`);
      } else {
        whereConditions.push(`payment_category = $${paramIdx}`);
        queryParams.push(category.toUpperCase());
        paramIdx++;
      }
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 1. Fetch transactions
    const queryText = `
      SELECT 
        id,
        invoice_number,
        user_id,
        shop_id,
        product_id,
        product_title,
        total_amount,
        payment_method,
        payment_method_name,
        payment_category,
        channel_code,
        status,
        buyer_name,
        buyer_email,
        buyer_phone,
        notes,
        payment_info,
        created_at,
        updated_at
      FROM transactions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    queryParams.push(limit, offset);
    const result = await query(queryText, queryParams);
    const transactions = result.rows;

    // 2. Fetch stats
    const statsQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('PAID', 'SETTLED', 'SUCCESS') THEN total_amount ELSE 0 END), 0) AS total_gmv,
        COUNT(CASE WHEN status IN ('PAID', 'SETTLED', 'SUCCESS') THEN 1 END) AS count_success,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS count_pending,
        COUNT(CASE WHEN status IN ('FAILED', 'CANCELLED', 'EXPIRED') THEN 1 END) AS count_failed,
        COUNT(*) AS total_count
      FROM transactions
    `;
    const statsRes = await query(statsQuery);
    const stats = statsRes.rows[0] || {
      total_gmv: 0,
      count_success: 0,
      count_pending: 0,
      count_failed: 0,
      total_count: 0,
    };

    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        totalGmv: Number(stats.total_gmv),
        countSuccess: Number(stats.count_success),
        countPending: Number(stats.count_pending),
        countFailed: Number(stats.count_failed),
        totalCount: Number(stats.total_count),
      },
    });
  } catch (err: any) {
    console.error("[ADMIN_TRANSACTIONS_GET_ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memuat daftar transaksi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/transactions
 * Action handler for approving or rejecting manual top-ups.
 * Requires Admin privileges.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Akses ditolak. Memerlukan otoritas Administrator." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, invoiceNumber, notes } = body;

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Nomor tagihan (invoiceNumber) wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Fetch transaction record
    const { rows } = await query(
      `SELECT * FROM transactions WHERE invoice_number = $1`,
      [invoiceNumber]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: `Transaksi ${invoiceNumber} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const trx = rows[0];

    // ACTION: APPROVE_TOPUP
    if (action === "APPROVE_TOPUP") {
      if (trx.status === "PAID" || trx.status === "SETTLED") {
        return NextResponse.json(
          { success: false, message: `Transaksi ${invoiceNumber} sudah berstatus ${trx.status}.` },
          { status: 400 }
        );
      }

      // Calculate credit amount: prioritize nominal in payment_info or total_amount
      const nominal =
        Number(trx.payment_info?.nominal) ||
        Number(trx.total_amount) ||
        0;

      if (nominal <= 0) {
        return NextResponse.json(
          { success: false, message: "Nominal pengisian saldo tidak valid." },
          { status: 400 }
        );
      }

      // Update in PostgreSQL
      await query(
        `UPDATE transactions 
         SET status = 'PAID', 
             notes = COALESCE(notes, '') || ' [Disetujui Admin: ' || $1 || ']',
             updated_at = CURRENT_TIMESTAMP
         WHERE invoice_number = $2`,
        [auth.uid || "SYSTEM_ADMIN", invoiceNumber]
      );

      // Atomic Balance Increment in PostgreSQL
      const newBalance = await addUserBalance(trx.user_id, nominal);

      // Attempt to mirror balance & status to Firestore via REST API if applicable
      const projectId = firebaseConfig.projectId || "marketpointid";
      try {
        await Promise.allSettled([
          fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${trx.user_id}/wallet/info?updateMask.fieldPaths=balance&updateMask.fieldPaths=updatedAt`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fields: {
                  balance: { integerValue: Math.round(newBalance) },
                  updatedAt: { timestampValue: new Date().toISOString() },
                },
              }),
            }
          ),
          fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/transactions/${invoiceNumber}?updateMask.fieldPaths=status&updateMask.fieldPaths=settledAt`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fields: {
                  status: { stringValue: "PAID" },
                  settledAt: { timestampValue: new Date().toISOString() },
                },
              }),
            }
          ),
        ]);
      } catch (fsErr) {
        console.warn("[ADMIN_TOPUP_FIRESTORE_REST_SYNC]", fsErr);
      }

      return NextResponse.json({
        success: true,
        message: `Top up sebesar Rp ${nominal.toLocaleString("id-ID")} berhasil disetujui. Saldo baru pengguna: Rp ${newBalance.toLocaleString("id-ID")}.`,
        newBalance,
      });
    }

    // ACTION: REJECT_TOPUP
    if (action === "REJECT_TOPUP") {
      if (trx.status === "PAID" || trx.status === "SETTLED") {
        return NextResponse.json(
          { success: false, message: "Tidak dapat menolak transaksi yang sudah lunas/disetujui." },
          { status: 400 }
        );
      }

      await query(
        `UPDATE transactions 
         SET status = 'CANCELLED', 
             notes = COALESCE(notes, '') || ' [Ditolak Admin: ' || $1 || ' | Alasan: ' || $2 || ']',
             updated_at = CURRENT_TIMESTAMP
         WHERE invoice_number = $3`,
        [auth.uid || "SYSTEM_ADMIN", notes || "Tidak ada bukti transfer valid", invoiceNumber]
      );

      return NextResponse.json({
        success: true,
        message: `Pengajuan transaksi ${invoiceNumber} berhasil ditolak.`,
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi ${action} tidak dikenali.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[ADMIN_TRANSACTIONS_POST_ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memproses transaksi." },
      { status: 500 }
    );
  }
}
