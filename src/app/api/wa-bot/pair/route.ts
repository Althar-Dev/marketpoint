import { NextResponse } from "next/server";
import { requestBotPairingCode, resetBotPairingState } from "@/wa-bot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp (misal: 6288976577650) wajib diisi." },
        { status: 400 }
      );
    }

    const result = await requestBotPairingCode(phone);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pairingCode: result.pairingCode,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[API PAIRING ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await resetBotPairingState();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membatalkan kode pairing." },
      { status: 500 }
    );
  }
}
