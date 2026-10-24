import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendOutgoingEmail } from "@/lib/mailer";
import { renderVerificationCodeEmailHtml } from "@/lib/auth-mailer";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "marketpoint_auth_secret_key_2026_salt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    const type = body?.type === "add_email" ? "add_email" : "change_password";

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Generate cryptographic verification token
    const token = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${email}:${code}:${expiresAt}`)
      .digest("hex");

    // Render HTML Email
    const html = renderVerificationCodeEmailHtml({
      code,
      email,
      type,
      expiresMinutes: 10,
    });

    const isAddEmail = type === "add_email";
    const subject = isAddEmail
      ? `[MarketPointID] Kode Verifikasi Penambahan Email: ${code}`
      : `[MarketPointID] Kode Verifikasi Ubah Kata Sandi: ${code}`;

    // Send email using MarketPoint's mailer
    const sendResult = await sendOutgoingEmail({
      from: `"MarketPointID Security" <no-reply@marketpoint.id>`,
      to: email,
      subject,
      text: `Kode verifikasi keamanan akun MarketPointID Anda adalah: ${code}. Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.`,
      html,
    });

    if (!sendResult.success && sendResult.error) {
      console.warn("[SEND VERIFICATION CODE WARN] Direct send issue:", sendResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Kode verifikasi telah dikirimkan ke ${email} melalui no-reply@marketpoint.id`,
      token,
      expiresAt,
    });
  } catch (error: any) {
    console.error("[API SEND VERIFICATION CODE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengirimkan kode verifikasi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
