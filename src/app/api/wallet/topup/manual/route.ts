import { NextResponse } from "next/server";
import {
  createDbTransaction,
  getDbTransactionByInvoice,
  updateDbTransactionStatus,
} from "@/lib/database/transaction-db";
import { query } from "@/lib/database/db";
import { addUserBalance, getUserBalance } from "@/lib/database/balance";
import { extractBearerToken, verifyFirebaseIdToken, verifyAdminRequest } from "@/lib/server-auth";
import {
  MANUAL_PAYMENT_CHANNELS,
  buildWhatsAppTopUpUrl,
} from "@/lib/manual-topup";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallet/topup/manual
 * Retrieve manual top-up requests.
 * - Admin can retrieve all pending or specific requests
 * - Users can retrieve their own manual top-up requests
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceNumber = searchParams.get("invoiceNumber");
    const statusParam = searchParams.get("status");

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
      console.warn("[AUTO_EXPIRE_MANUAL_TOPUP_WARN]", e);
    }

    // 1. Check admin authorization
    const adminAuth = await verifyAdminRequest(req);

    if (adminAuth.authorized) {
      if (invoiceNumber) {
        const tx = await getDbTransactionByInvoice(invoiceNumber);
        if (!tx) {
          return NextResponse.json({ success: false, message: "Invoice tidak ditemukan." }, { status: 404 });
        }
        return NextResponse.json({ success: true, transaction: tx });
      }

      // Admin global view: fetch manual topups
      let sql = `
        SELECT * FROM transactions 
        WHERE (payment_category = 'MANUAL_TRANSFER' OR product_title ILIKE 'Top Up Saldo%')
      `;
      const params: any[] = [];
      if (statusParam) {
        params.push(statusParam.toUpperCase());
        sql += ` AND status = $${params.length}`;
      }
      sql += ` ORDER BY created_at DESC LIMIT 100`;

      const res = await query(sql, params);
      return NextResponse.json({ success: true, transactions: res.rows });
    }

    // 2. Regular authenticated user
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Otentikasi diperlukan." },
        { status: 401 }
      );
    }

    const userAuth = await verifyFirebaseIdToken(token);
    if (!userAuth.valid || !userAuth.uid) {
      return NextResponse.json(
        { success: false, message: "Sesi login tidak valid." },
        { status: 401 }
      );
    }

    const targetUid = userAuth.uid;

    if (invoiceNumber) {
      const tx = await getDbTransactionByInvoice(invoiceNumber);
      if (!tx) {
        return NextResponse.json({ success: false, message: "Invoice tidak ditemukan." }, { status: 404 });
      }
      if (tx.userId !== targetUid) {
        return NextResponse.json({ success: false, message: "Akses ditolak: Anda tidak memiliki akses ke invoice ini." }, { status: 403 });
      }
      return NextResponse.json({ success: true, transaction: tx });
    }

    const res = await query(
      `
      SELECT * FROM transactions 
      WHERE user_id = $1 
        AND (payment_category = 'MANUAL_TRANSFER' OR product_title ILIKE 'Top Up Saldo%')
      ORDER BY created_at DESC LIMIT 50
    `,
      [targetUid]
    );

    return NextResponse.json({ success: true, transactions: res.rows });
  } catch (error: any) {
    console.error("[API WALLET TOPUP MANUAL GET ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data top up." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/topup/manual
 * Create a new manual balance top-up request.
 */
export async function POST(req: Request) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Otentikasi diperlukan untuk pengajuan top up." },
        { status: 401 }
      );
    }

    const auth = await verifyFirebaseIdToken(token);
    if (!auth.valid || !auth.uid) {
      return NextResponse.json(
        { success: false, message: "Sesi login tidak valid atau kadaluarsa." },
        { status: 401 }
      );
    }

    const finalUserId = auth.uid;
    const authenticatedEmail = auth.email;

    const body = await req.json().catch(() => ({}));
    const {
      amount,
      channelId,
      buyerName,
      buyerEmail,
      buyerPhone,
    } = body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10000) {
      return NextResponse.json(
        { success: false, message: "Nominal top up minimal Rp 10.000." },
        { status: 400 }
      );
    }

    if (numAmount > 50000000) {
      return NextResponse.json(
        { success: false, message: "Nominal top up maksimal Rp 50.000.000 per transaksi." },
        { status: 400 }
      );
    }

    const selectedChannel = MANUAL_PAYMENT_CHANNELS.find(
      (c) => c.id.toLowerCase() === String(channelId || "bca").toLowerCase()
    ) || MANUAL_PAYMENT_CHANNELS[0];

    const totalAmount = numAmount;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Generate unique invoice number
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `TOPUP-${timestampPart}-${randomPart}`;

    const channelShort = selectedChannel.id.toUpperCase();

    const newTransaction = await createDbTransaction({
      invoiceNumber,
      userId: finalUserId,
      shopId: null,
      productId: null,
      productTitle: "Top Up Saldo",
      unitPrice: totalAmount,
      quantity: 1,
      itemsSubtotal: numAmount,
      paymentFee: 0,
      discount: 0,
      totalAmount,
      paymentMethod: selectedChannel.id.toUpperCase(),
      paymentMethodName: channelShort,
      paymentCategory: "MANUAL_TRANSFER",
      channelCode: selectedChannel.category,
      paymentCode: selectedChannel.accountNumber || "WHATSAPP_CONFIRM",
      status: "PENDING",
      buyerName: buyerName || "Pengguna MarketPoint",
      buyerEmail: buyerEmail || authenticatedEmail || null,
      buyerPhone: buyerPhone || null,
      notes: `Menunggu transfer manual ke ${channelShort} dan konfirmasi WhatsApp Admin (6285658286012). Berlaku 15 menit.`,
      paymentInfo: {
        channelId: selectedChannel.id,
        channelName: channelShort,
        accountName: selectedChannel.accountName || "Admin Keuangan MarketPoint",
        accountNumber: selectedChannel.accountNumber || "0856-5828-6012 (WhatsApp)",
        originalAmount: numAmount,
        uniqueCode: 0,
        totalAmount,
        requestedAt: new Date().toISOString(),
        expiresAt,
      },
    });

    const waUrl = buildWhatsAppTopUpUrl({
      invoiceNumber,
      userId: finalUserId,
      userName: buyerName,
      userEmail: buyerEmail || authenticatedEmail,
      nominal: totalAmount,
      channelName: selectedChannel.label,
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan top up manual berhasil dibuat.",
      transaction: newTransaction,
      channel: selectedChannel,
      uniqueCode: 0,
      totalAmount,
      whatsappUrl: waUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error("[API WALLET TOPUP MANUAL POST ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membuat pengajuan top up." },
      { status: 500 }
    );
  }
}

/**
 * Helper to sync user wallet balance to Firestore
 */
async function syncFirestoreWallet(userId: string, newBalance: number, invoiceNumber: string) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpointid";
    await fetch(
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
    );

    await fetch(
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
    );
  } catch (fsErr) {
    console.warn("[FS_WALLET_SYNC_WARN]", fsErr);
  }
}

/**
 * PATCH /api/wallet/topup/manual
 * - Admin approves or rejects a manual balance top up request.
 * - User can cancel or expire their own pending request (e.g. 15-minute countdown expired).
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { invoiceNumber, action, adminNote } = body;

    if (!invoiceNumber || !action) {
      return NextResponse.json(
        { success: false, message: "Field 'invoiceNumber' dan 'action' (approve/reject/cancel/expire) wajib disertakan." },
        { status: 400 }
      );
    }

    const tx = await getDbTransactionByInvoice(invoiceNumber);
    if (!tx) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. Action: CANCEL or EXPIRE by User (or Admin)
    if (action === "cancel" || action === "expire") {
      const token = extractBearerToken(req);
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Otentikasi diperlukan." },
          { status: 401 }
        );
      }

      const userAuth = await verifyFirebaseIdToken(token);
      if (!userAuth.valid || !userAuth.uid) {
        return NextResponse.json(
          { success: false, message: "Sesi login tidak valid." },
          { status: 401 }
        );
      }

      // Check ownership (unless admin)
      const adminAuth = await verifyAdminRequest(req);
      if (tx.userId !== userAuth.uid && !adminAuth.authorized) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Anda tidak memiliki wewenang untuk membatalkan transaksi ini." },
          { status: 403 }
        );
      }

      if (tx.status !== "PENDING") {
        return NextResponse.json(
          { success: false, message: `Transaksi ini sudah berstatus ${tx.status}, tidak dapat diubah.` },
          { status: 400 }
        );
      }

      const targetStatus = action === "expire" ? "EXPIRED" : "CANCELLED";
      const reasonNote = action === "expire" 
        ? " [Kadaluarsa: batas waktu 15 menit habis]" 
        : " [Dibatalkan oleh pengguna]";

      const updatedTx = await updateDbTransactionStatus(invoiceNumber, targetStatus, {
        notes: (tx.notes || "") + reasonNote,
      });

      return NextResponse.json({
        success: true,
        message: action === "expire" ? "Pengajuan top up telah kadaluarsa." : "Pengajuan top up berhasil dibatalkan.",
        transaction: updatedTx,
      });
    }

    // 2. Action: APPROVE or REJECT (Admin Only)
    const adminAuth = await verifyAdminRequest(req);
    if (!adminAuth.authorized) {
      return NextResponse.json(
        { success: false, message: adminAuth.error || "Akses ditolak: Hanya administrator yang dapat memproses top up manual." },
        { status: 403 }
      );
    }

    if (tx.status === "PAID" || tx.status === "SETTLED") {
      return NextResponse.json(
        { success: false, message: "Transaksi ini sudah disetujui sebelumnya." },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Credit amount to user's balance
      const creditAmount = Number(tx.totalAmount || tx.itemsSubtotal || 0);
      if (creditAmount <= 0) {
        return NextResponse.json(
          { success: false, message: "Nominal transaksi tidak valid." },
          { status: 400 }
        );
      }

      const newBalance = await addUserBalance(tx.userId, creditAmount);
      await syncFirestoreWallet(tx.userId, newBalance, invoiceNumber);

      // Update status to PAID
      const updatedTx = await updateDbTransactionStatus(invoiceNumber, "PAID", {
        deliveredBy: adminAuth.uid || "admin",
        deliveredAt: new Date(),
        paymentInfo: {
          ...(tx.paymentInfo || {}),
          approvedBy: adminAuth.uid || "admin",
          approvedAt: new Date().toISOString(),
          adminNote: adminNote || "Disetujui oleh Administrator",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Top up sebesar Rp ${creditAmount.toLocaleString("id-ID")} berhasil disetujui. Saldo baru pengguna: Rp ${newBalance.toLocaleString("id-ID")}`,
        transaction: updatedTx,
        newBalance,
      });
    } else if (action === "reject") {
      const updatedTx = await updateDbTransactionStatus(invoiceNumber, "CANCELLED", {
        deliveredBy: adminAuth.uid || "admin",
        deliveredAt: new Date(),
        paymentInfo: {
          ...(tx.paymentInfo || {}),
          rejectedBy: adminAuth.uid || "admin",
          rejectedAt: new Date().toISOString(),
          adminNote: adminNote || "Ditolak oleh Administrator",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pengajuan top up telah ditolak.",
        transaction: updatedTx,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Nilai 'action' tidak valid. Gunakan approve, reject, cancel, atau expire." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[API WALLET TOPUP MANUAL PATCH ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses persetujuan top up." },
      { status: 500 }
    );
  }
}
