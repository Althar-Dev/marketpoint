import { NextResponse } from "next/server";
import { expireXenditPaymentRequest } from "@/lib/xendit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pr_id, secret_key } = body;

    if (!pr_id) {
      return NextResponse.json(
        { success: false, message: "pr_id wajib diisi." },
        { status: 400 }
      );
    }

    const res = await expireXenditPaymentRequest(pr_id, secret_key);

    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          message: res.message || "Gagal membatalkan transaksi di Xendit.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan di Xendit.",
      data: res.data,
    });
  } catch (error: any) {
    console.error("[API PAYMENTS CANCEL ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}
