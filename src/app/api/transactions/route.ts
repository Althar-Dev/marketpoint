import { NextResponse } from "next/server";
import { getDbTransactionsByUserId } from "@/lib/database/transaction-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil data transaksi dari PostgreSQL
    const transactions = await getDbTransactionsByUserId(userId);
    
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
