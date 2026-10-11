import { NextResponse } from "next/server";
import { requestXenditPayment } from "@/lib/xendit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      external_id,
      amount,
      type,
      channel_code,
      bank_code,
      name,
      payer_email,
      mobile_number,
      description,
      return_url,
      secret_key,
    } = body;

    if (!external_id || !amount || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter external_id, amount, dan type wajib diisi.",
        },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    const minRequired = type === "qris" ? 1 : 100;
    if (isNaN(numAmount) || numAmount < minRequired) {
      return NextResponse.json(
        {
          success: false,
          message: `Nominal pembayaran minimal Rp ${minRequired.toLocaleString("id-ID")}.`,
        },
        { status: 400 }
      );
    }

    const result = await requestXenditPayment(type, {
      external_id,
      amount: numAmount,
      channel_code: channel_code || bank_code,
      bank_code: bank_code || channel_code,
      name,
      payer_email,
      mobile_number,
      description,
      return_url,
      secret_key,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Gagal membuat tagihan di Xendit.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API PAYMENTS CREATE ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}
