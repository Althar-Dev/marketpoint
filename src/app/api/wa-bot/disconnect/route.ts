import { NextResponse } from "next/server";
import { clearBotSession } from "@/wa-bot";

export async function POST() {
  try {
    const result = await clearBotSession();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus sesi WhatsApp." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await clearBotSession();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus sesi WhatsApp." },
      { status: 500 }
    );
  }
}
