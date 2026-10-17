import { NextResponse } from "next/server";
import {
  getDbTransactionsByUserId,
  getDbTransactionsByShopId,
  getAllDbTransactions,
  createDbTransaction,
  updateDbTransactionStatus
} from "@/lib/database/transaction-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const shopId = searchParams.get("shopId");

    // Ambil data transaksi dari PostgreSQL
    let transactions: any[] = [];
    if (shopId) {
      transactions = await getDbTransactionsByShopId(shopId);
    } else if (userId) {
      transactions = await getDbTransactionsByUserId(userId);
    } else {
      // Hanya jika tidak ada parameter shopId maupun userId, ambil transaksi umum
      transactions = await getAllDbTransactions(100);
    }
    
    return NextResponse.json({ 
      success: true, 
      transactions 
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
    const { identifier, status, deliveredBy, deliveredAt, paymentInfo, platformFee, platformFeeRate, shopTier, netAmount } = body;
    if (!identifier || !status) {
      return NextResponse.json(
        { success: false, message: "identifier dan status wajib disertakan." },
        { status: 400 }
      );
    }
    const updated = await updateDbTransactionStatus(identifier, status, {
      deliveredBy,
      deliveredAt,
      paymentInfo,
      platformFee,
      platformFeeRate,
      shopTier,
      netAmount
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
