import { NextResponse } from "next/server";
import { verifyOTP, formatPhoneNumber } from "@/wa-bot";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Rate Limiting: Max 5 attempts per 5 minutes per phone & IP
    const rl = checkRateLimit(`wa-otp-verify:${formattedPhone}:${clientIp}`, {
      intervalMs: 5 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak percobaan kode OTP WhatsApp yang salah. Silakan tunggu 5 menit." },
        { status: 429 }
      );
    }

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
