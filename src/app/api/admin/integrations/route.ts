import { NextResponse } from "next/server";
import {
  getPlatformSettings,
  updateCommissionSettings,
  updateXenditSettings,
  updateDigiFlazzSettings,
} from "@/lib/database/settings";
import { testXenditConnection } from "@/lib/xendit";
import { checkDigiFlazzBalance } from "@/lib/digiflazz";

export async function GET() {
  try {
    const settings = await getPlatformSettings();

    // Perform background live status checks if credentials are present
    let xenditStatus: { success: boolean; message: string; balance?: number } = {
      success: false,
      message: "Belum dikonfigurasi",
    };
    if (settings.xendit.secretKey) {
      xenditStatus = await testXenditConnection(settings.xendit.secretKey);
    }

    let digiflazzStatus: { success: boolean; message: string; deposit?: number } = {
      success: false,
      message: "Belum dikonfigurasi",
    };
    if (settings.digiflazz.username && settings.digiflazz.apiKey) {
      digiflazzStatus = await checkDigiFlazzBalance({
        username: settings.digiflazz.username,
        apiKey: settings.digiflazz.apiKey,
      });
    }

    return NextResponse.json({
      settings,
      xenditStatus,
      digiflazzStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengambil pengaturan integrasi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "update_commissions") {
      const { commissions } = body;
      if (!commissions) {
        return NextResponse.json({ error: "Data komisi tidak valid" }, { status: 400 });
      }
      await updateCommissionSettings({
        free: Number(commissions.free ?? 5),
        plus: Number(commissions.plus ?? 3),
        pro: Number(commissions.pro ?? 1.5),
        prime: Number(commissions.prime ?? 0),
      });
      return NextResponse.json({ success: true, message: "Pengaturan komisi berhasil disimpan!" });
    }

    if (action === "update_xendit") {
      const { xendit } = body;
      if (!xendit) {
        return NextResponse.json({ error: "Data Xendit tidak valid" }, { status: 400 });
      }
      await updateXenditSettings({
        secretKey: xendit.secretKey || "",
        webhookToken: xendit.webhookToken || "",
      });
      return NextResponse.json({ success: true, message: "Pengaturan Xendit berhasil disimpan!" });
    }

    if (action === "test_xendit") {
      const { secretKey } = body;
      const result = await testXenditConnection(secretKey);
      return NextResponse.json(result);
    }

    if (action === "update_digiflazz") {
      const { digiflazz } = body;
      if (!digiflazz) {
        return NextResponse.json({ error: "Data DigiFlazz tidak valid" }, { status: 400 });
      }
      await updateDigiFlazzSettings({
        mode: digiflazz.mode || "development",
        username: digiflazz.username || "",
        apiKey: digiflazz.apiKey || "",
        webhookSecret: digiflazz.webhookSecret || "",
      });
      return NextResponse.json({ success: true, message: "Pengaturan DigiFlazz berhasil disimpan!" });
    }

    if (action === "check_digiflazz_balance") {
      const { username, apiKey } = body;
      const result = await checkDigiFlazzBalance(username && apiKey ? { username, apiKey } : undefined);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Aksi tidak diketahui" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses permintaan" }, { status: 500 });
  }
}
