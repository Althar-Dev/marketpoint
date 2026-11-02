import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/db";
import { verifyAdminRequest } from "@/lib/server-auth";
import { addUserBalance } from "@/lib/database/balance";
import { firebaseConfig } from "@/firebase/config";
import { createDbTransaction } from "@/lib/database/transaction-db";

export const dynamic = "force-dynamic";

/**
 * Helper to sync user wallet balance to Firestore
 */
async function syncFirestoreWallet(userId: string, newBalance: number, invoiceNumber?: string) {
  try {
    const projectId = firebaseConfig.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpointid";
    const promises: Promise<any>[] = [
      fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/wallet/info?updateMask.fieldPaths=balance&updateMask.fieldPaths=updatedAt`,
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
    ];

    if (invoiceNumber) {
      promises.push(
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
        )
      );
    }

    await Promise.allSettled(promises);
  } catch (fsErr) {
    console.warn("[ADMIN_TOPUP_FIRESTORE_SYNC_WARN]", fsErr);
  }
}

/**
 * GET /api/admin/topup
 * Retrieve manual balance top up requests, queue stats, and filters.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.error || "Akses ditolak. Memerlukan otoritas Administrator." },
      { status: 403 }
    );
  }

  try {
    // 1. Auto-expire pending manual top-ups older than 15 minutes
    try {
      await query(`
        UPDATE transactions 
        SET status = 'EXPIRED', notes = COALESCE(notes, '') || ' [Kadaluarsa otomatis setelah 15 menit]'
        WHERE status = 'PENDING' 
          AND (payment_category IN ('MANUAL', 'MANUAL_TRANSFER') OR product_title ILIKE 'Top Up Saldo%')
          AND created_at < NOW() - INTERVAL '15 minutes'
      `);
    } catch (e) {
      console.warn("[ADMIN_TOPUP_AUTO_EXPIRE_WARN]", e);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 200);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    let whereConditions: string[] = [
      `(payment_category IN ('MANUAL', 'MANUAL_TRANSFER') OR product_title ILIKE 'Top Up Saldo%')`
    ];
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

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // 2. Fetch top up requests
    const listQuery = `
      SELECT 
        id,
        invoice_number,
        user_id,
        shop_id,
        product_title,
        total_amount,
        payment_method,
        payment_method_name,
        payment_category,
        channel_code,
        payment_code,
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
      ORDER BY 
        CASE WHEN status = 'PENDING' THEN 1 ELSE 2 END ASC,
        created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    queryParams.push(limit, offset);
    const listRes = await query(listQuery, queryParams);

    // 3. Stats for top up operations
    const statsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS count_pending,
        COUNT(CASE WHEN status IN ('PAID', 'SETTLED', 'SUCCESS') THEN 1 END) AS count_success,
        COUNT(CASE WHEN status IN ('FAILED', 'CANCELLED', 'EXPIRED') THEN 1 END) AS count_failed,
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN status IN ('PAID', 'SETTLED', 'SUCCESS') AND created_at >= CURRENT_DATE THEN total_amount ELSE 0 END), 0) AS today_volume,
        COALESCE(SUM(CASE WHEN status IN ('PAID', 'SETTLED', 'SUCCESS') THEN total_amount ELSE 0 END), 0) AS total_volume
      FROM transactions
      WHERE (payment_category IN ('MANUAL', 'MANUAL_TRANSFER') OR product_title ILIKE 'Top Up Saldo%')
    `;

    const statsRes = await query(statsQuery);
    const statsRow = statsRes.rows[0] || {};

    return NextResponse.json({
      success: true,
      transactions: listRes.rows,
      stats: {
        countPending: Number(statsRow.count_pending || 0),
        countSuccess: Number(statsRow.count_success || 0),
        countFailed: Number(statsRow.count_failed || 0),
        totalCount: Number(statsRow.total_count || 0),
        todayVolume: Number(statsRow.today_volume || 0),
        totalVolume: Number(statsRow.total_volume || 0),
      },
    });
  } catch (err: any) {
    console.error("[ADMIN_TOPUP_GET_ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memuat data antrean top up." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/topup
 * Action handler for Approving, Rejecting, or Direct-Crediting balance.
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
    const body = await req.json().catch(() => ({}));
    const { action, invoiceNumber, notes, targetUserId, amount } = body;

    // ACTION: DIRECT_CREDIT (Admin manually grants balance to a user)
    if (action === "DIRECT_CREDIT") {
      const numAmount = Number(amount);
      if (!targetUserId || isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { success: false, message: "Field 'targetUserId' dan 'amount' (nominal > 0) wajib diisi." },
          { status: 400 }
        );
      }

      const timestampPart = Date.now().toString(36).toUpperCase();
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const directInvoice = `CREDIT-${timestampPart}-${randomPart}`;

      // Create ledger transaction
      const directTrx = await createDbTransaction({
        invoiceNumber: directInvoice,
        userId: targetUserId,
        shopId: null,
        productId: null,
        productTitle: `Penambahan Saldo oleh Admin: ${notes || "Penyesuaian Manual / Bonus"}`,
        unitPrice: numAmount,
        quantity: 1,
        itemsSubtotal: numAmount,
        paymentFee: 0,
        discount: 0,
        totalAmount: numAmount,
        paymentMethod: "ADMIN_CREDIT",
        paymentMethodName: "Manual Admin Deposit",
        paymentCategory: "MANUAL_TRANSFER",
        channelCode: "ADMIN",
        status: "PAID",
        buyerName: "Pengguna MarketPoint",
        notes: `Ditambahkan oleh Admin (${auth.uid || "SYSTEM"}). Catatan: ${notes || "-"}`,
        paymentInfo: {
          creditedBy: auth.uid || "SYSTEM_ADMIN",
          creditedAt: new Date().toISOString(),
          reason: notes || "Direct Admin Top Up",
        },
      });

      const newBalance = await addUserBalance(targetUserId, numAmount);
      await syncFirestoreWallet(targetUserId, newBalance, directInvoice);

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan saldo Rp ${numAmount.toLocaleString("id-ID")} ke user ${targetUserId}. Saldo baru: Rp ${newBalance.toLocaleString("id-ID")}`,
        transaction: directTrx,
        newBalance,
      });
    }

    // For APPROVE or REJECT, invoiceNumber is mandatory
    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Nomor tagihan (invoiceNumber) wajib disertakan." },
        { status: 400 }
      );
    }

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

    // ACTION: APPROVE
    if (action === "APPROVE") {
      if (trx.status === "PAID" || trx.status === "SETTLED") {
        return NextResponse.json(
          { success: false, message: `Transaksi ${invoiceNumber} sudah disetujui sebelumnya.` },
          { status: 400 }
        );
      }

      const nominal =
        Number(trx.payment_info?.originalAmount) ||
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
             delivered_by = $1,
             delivered_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE invoice_number = $2`,
        [auth.uid || "SYSTEM_ADMIN", invoiceNumber]
      );

      // Atomic Balance Increment
      const newBalance = await addUserBalance(trx.user_id, nominal);
      await syncFirestoreWallet(trx.user_id, newBalance, invoiceNumber);

      return NextResponse.json({
        success: true,
        message: `Top up sebesar Rp ${nominal.toLocaleString("id-ID")} berhasil disetujui! Saldo langsung masuk ke akun pengguna (Saldo baru: Rp ${newBalance.toLocaleString("id-ID")}).`,
        newBalance,
      });
    }

    // ACTION: REJECT
    if (action === "REJECT") {
      if (trx.status === "PAID" || trx.status === "SETTLED") {
        return NextResponse.json(
          { success: false, message: "Tidak dapat menolak transaksi yang sudah disetujui / lunas." },
          { status: 400 }
        );
      }

      const reason = notes || "Bukti transfer tidak valid atau dana belum masuk ke mutasi";

      await query(
        `UPDATE transactions 
         SET status = 'CANCELLED', 
             notes = COALESCE(notes, '') || ' [Ditolak Admin: ' || $1 || ' | Alasan: ' || $2 || ']',
             updated_at = CURRENT_TIMESTAMP
         WHERE invoice_number = $3`,
        [auth.uid || "SYSTEM_ADMIN", reason, invoiceNumber]
      );

      return NextResponse.json({
        success: true,
        message: `Permohonan top up ${invoiceNumber} telah ditolak.`,
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi '${action}' tidak dikenali. Gunakan APPROVE, REJECT, atau DIRECT_CREDIT.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[ADMIN_TOPUP_POST_ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memproses aksi top up." },
      { status: 500 }
    );
  }
}

