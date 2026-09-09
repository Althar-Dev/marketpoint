import { NextResponse } from "next/server";
import { verifyOTP, formatPhoneNumber } from "@/wa-bot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const result = verifyOTP(formattedPhone, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi nomor WhatsApp berhasil!",
      phone: formattedPhone,
    });
  } catch (error: any) {
    console.error("[API OTP VERIFY ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
