import { NextResponse } from "next/server";
import crypto from "crypto";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "marketpoint_auth_secret_key_2026_salt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, code: rawCode, token, expiresAt } = body || {};

    if (!rawEmail || !rawCode || !token || !expiresAt) {
      return NextResponse.json(
        { success: false, error: "Parameter verifikasi tidak lengkap." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const code = String(rawCode).trim();

    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json(
        { success: false, error: "Kode verifikasi telah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    // Recompute signature
    const expectedToken = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${email}:${code}:${expiresAt}`)
      .digest("hex");

    if (expectedToken !== token) {
      return NextResponse.json(
        { success: false, error: "Kode verifikasi yang Anda masukkan salah. Silakan periksa kembali." },
        { status: 400 }
      );
    }

    // Generate authorized signature valid for 15 minutes to allow password update
    const authExpiresAt = Date.now() + 15 * 60 * 1000;
    const authorizedToken = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${email}:AUTHORIZED:${authExpiresAt}`)
      .digest("hex");

    return NextResponse.json({
      success: true,
      message: "Kode verifikasi berhasil diverifikasi.",
      authorizedToken,
      authExpiresAt,
    });
  } catch (error: any) {
    console.error("[API VERIFY CODE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memverifikasi kode." },
      { status: 500 }
    );
  }
}
