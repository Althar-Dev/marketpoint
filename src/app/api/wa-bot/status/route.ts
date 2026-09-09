import { NextResponse } from "next/server";
import { getBotStatus, initWASocket } from "@/wa-bot";

export async function GET() {
  try {
    let status = getBotStatus();
    if (status.status === "DISCONNECTED" && status.hasSession) {
      // Auto reconnect using saved session files if disconnected
      initWASocket().catch((err) => console.error("Auto init socket error:", err));
      status = getBotStatus();
    }
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initWASocket();
    const status = getBotStatus();
    return NextResponse.json({ success: true, message: "Inisialisasi WhatsApp Bot dimulai", status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
