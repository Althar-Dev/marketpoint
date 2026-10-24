import { NextResponse } from "next/server";
import { sendOutgoingEmail } from "@/lib/mailer";
import { renderSecurityAlertEmailHtml } from "@/lib/auth-mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "Alamat email penerima wajib diisi." },
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

    const displayName = body?.displayName || "Pengguna";
    const eventType = body?.eventType as "password_changed" | "pin_changed" | "phone_changed";
    const newValue = body?.newValue;

    if (!eventType || !["password_changed", "pin_changed", "phone_changed"].includes(eventType)) {
      return NextResponse.json(
        { success: false, error: "Tipe event keamanan tidak valid." },
        { status: 400 }
      );
    }

    let subject = "[Pemberitahuan Keamanan] Perubahan Pada Akun MarketPointID";
    if (eventType === "password_changed") {
      subject = "Kata Sandi Akun MarketPointID Anda Berhasil Diubah";
    } else if (eventType === "pin_changed") {
      subject = "PIN Transaksi MarketPointID Anda Berhasil Diperbarui";
    } else if (eventType === "phone_changed") {
      subject = "Nomor Handphone Akun MarketPointID Anda Berhasil Diperbarui";
    }

    // Render HTML Email
    const html = renderSecurityAlertEmailHtml({
      email,
      displayName,
      eventType,
      newValue,
    });

    const text = `Halo ${displayName},\n\nKami menginformasikan bahwa telah terjadi perubahan keamanan pada akun MarketPointID Anda (${email}):\n- Jenis: ${subject}\n${newValue ? `- Rincian: ${newValue}\n` : ""}\nJika ini BUKAN Anda yang melakukan perubahan, segera amankan akun Anda di https://marketpoint.id/settings/security\n\nSalam,\nTim Keamanan MarketPointID (no-reply@marketpoint.id)`;

    // Send email using MarketPoint's official mailer
    const sendResult = await sendOutgoingEmail({
      from: `"MarketPointID Security" <no-reply@marketpoint.id>`,
      to: email,
      subject,
      text,
      html,
    });

    if (!sendResult.success && sendResult.error) {
      console.warn("[SEND SECURITY ALERT WARN] Direct send issue:", sendResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Pemberitahuan keamanan telah dikirimkan ke ${email} melalui no-reply@marketpoint.id`,
    });
  } catch (error: any) {
    console.error("[API SEND SECURITY ALERT ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengirim pemberitahuan keamanan." },
      { status: 500 }
    );
  }
}
