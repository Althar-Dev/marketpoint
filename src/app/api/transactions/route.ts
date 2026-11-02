import { NextResponse } from "next/server";
import {
  getDbTransactionsByUserId,
  getDbTransactionsByShopId,
  getAllDbTransactions,
  createDbTransaction,
  updateDbTransactionStatus,
} from "@/lib/database/transaction-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const shopId = searchParams.get("shopId");
    const limitParam = parseInt(searchParams.get("limit") || "250", 10);
    const limit = Math.min(Math.max(1, limitParam || 250), 500);

    const internalSecret = req.headers.get("x-internal-secret");
    const isAuthorizedInternal = Boolean(
      process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET
    );

    // Ambil data transaksi dari PostgreSQL
    let transactions: any[] = [];
    if (shopId) {
      transactions = await getDbTransactionsByShopId(shopId, limit);
    } else if (userId) {
      transactions = await getDbTransactionsByUserId(userId, limit);
    } else if (isAuthorizedInternal) {
      // Hanya internal admin dengan secret yang boleh mengambil data transaksi global
      transactions = await getAllDbTransactions(limit);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter 'userId' atau 'shopId' wajib disertakan untuk mengakses transaksi.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (err: any) {
    console.error("[API TRANSACTIONS GET ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transaction = await createDbTransaction(body);
    return NextResponse.json({ success: true, transaction });
  } catch (err: any) {
    console.error("[API TRANSACTIONS POST ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal membuat transaksi di database." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      identifier,
      status,
      deliveredBy,
      deliveredAt,
      paymentInfo,
      platformFee,
      platformFeeRate,
      shopTier,
      netAmount,
    } = body;

    if (!identifier || !status) {
      return NextResponse.json(
        { success: false, message: "identifier dan status wajib disertakan." },
        { status: 400 }
      );
    }

    // Security check: Guard status PAID / SETTLED against unauthenticated clients
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === "PAID" || upperStatus === "SETTLED") {
      const internalSecret = req.headers.get("x-internal-secret");
      const isAuthorizedInternal = Boolean(
        process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET
      );

      if (!isAuthorizedInternal) {
        return NextResponse.json(
          {
            success: false,
            message: "Perubahan status ke PAID hanya dapat dilakukan oleh payment gateway atau internal sistem terverifikasi.",
          },
          { status: 403 }
        );
      }
    }

    const updated = await updateDbTransactionStatus(identifier, status, {
      deliveredBy,
      deliveredAt,
      paymentInfo,
      platformFee,
      platformFeeRate,
      shopTier,
      netAmount,
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err: any) {
    console.error("[API TRANSACTIONS PATCH ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal memperbarui status transaksi." },
      { status: 500 }
    );
  }
}
