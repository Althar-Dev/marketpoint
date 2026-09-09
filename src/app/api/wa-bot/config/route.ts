import { NextResponse } from "next/server";
import { getBotConfig, saveBotConfig } from "@/wa-bot";

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
