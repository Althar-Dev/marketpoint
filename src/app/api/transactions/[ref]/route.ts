import { NextResponse } from "next/server";
import { getDbTransactionByInvoice } from "@/lib/database/transaction-db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;
    if (!ref) {
      return NextResponse.json({ success: false, message: "ref wajib diisi." }, { status: 400 });
    }

    const transaction = await getDbTransactionByInvoice(decodeURIComponent(ref));
    if (!transaction) {
      return NextResponse.json({ success: false, message: "Transaksi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ success: true, transaction });
  } catch (err: any) {
    console.error("[API TRANSACTION GET ERROR]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
