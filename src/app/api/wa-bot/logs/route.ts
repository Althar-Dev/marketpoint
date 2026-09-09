import { NextResponse } from "next/server";
import { getBotLogs, clearBotLogs } from "@/wa-bot";

export async function GET() {
  try {
    const logs = getBotLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil log bot" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    clearBotLogs();
    return NextResponse.json({ success: true, message: "Log berhasil dibersihkan" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membersihkan log" },
      { status: 500 }
    );
  }
}
