import { NextResponse } from "next/server";
import { getBotConfig, saveBotConfig } from "@/wa-bot";
import { verifyAdminRequest } from "@/lib/server-auth";

export async function GET() {
  try {
    const config = getBotConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membaca konfigurasi bot." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Akses admin ditolak." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = saveBotConfig(body);
    return NextResponse.json({
      success: true,
      message: "Konfigurasi Bot WhatsApp berhasil disimpan ke database/config.json",
      config: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan konfigurasi bot." },
      { status: 500 }
    );
  }
}
