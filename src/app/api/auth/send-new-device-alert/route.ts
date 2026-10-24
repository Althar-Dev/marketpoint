import { NextResponse } from "next/server";
import { sendOutgoingEmail } from "@/lib/mailer";
import { renderNewDeviceAlertEmailHtml } from "@/lib/auth-mailer";

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
    const deviceName = body?.deviceName || "Perangkat Tidak Dikenal";
    const browser = body?.browser || "Browser Web";
    const os = body?.os || "Sistem Operasi";
    const deviceType = body?.deviceType || "desktop";
    const location = body?.location || "Indonesia";

    // Detect client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    let detectedIp = forwarded ? forwarded.split(",")[0].trim() : (realIp || body?.ipAddress);
    if (!detectedIp || detectedIp === "::1" || detectedIp === "127.0.0.1") {
      detectedIp = body?.ipAddress || undefined;
    }

    // Render HTML Email
    const html = renderNewDeviceAlertEmailHtml({
      email,
      displayName,
      deviceName,
      browser,
      os,
      deviceType,
      location,
      ipAddress: detectedIp,
    });

    const subject = `[Pemberitahuan Keamanan] Login Terdeteksi di Perangkat Baru`;
    const text = `Halo ${displayName},\n\nKami mendeteksi aktivitas login ke akun MarketPointID Anda menggunakan perangkat baru:\n\n- Perangkat: ${deviceName}\n- Browser: ${browser}\n- Sistem Operasi: ${os}\n- Lokasi: ${location}\n${detectedIp ? `- Alamat IP: ${detectedIp}\n` : ""}\nJika ini BUKAN Anda, segera putuskan perangkat asing ini dan ubah kata sandi akun Anda melalui tautan berikut:\nhttps://marketpoint.id/settings/devices\nhttps://marketpoint.id/settings/security/change-password\n\nSalam,\nTim Keamanan MarketPointID (no-reply@marketpoint.id)`;

    // Send email using MarketPoint's official mailer
    const sendResult = await sendOutgoingEmail({
      from: `"MarketPointID Security" <no-reply@marketpoint.id>`,
      to: email,
      subject,
      text,
      html,
    });

    if (!sendResult.success && sendResult.error) {
      console.warn("[SEND NEW DEVICE ALERT WARN] Direct send issue:", sendResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Pemberitahuan login perangkat baru telah dikirimkan ke ${email} melalui no-reply@marketpoint.id`,
    });
  } catch (error: any) {
    console.error("[API SEND NEW DEVICE ALERT ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengirim pemberitahuan login perangkat baru." },
      { status: 500 }
    );
  }
}
