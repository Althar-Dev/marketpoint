import { NextResponse } from "next/server";
import {
  getPlatformSettings,
  updatePlansConfig,
  updateCommissionSettings,
} from "@/lib/database/settings";
import {
  getAllShopSubscriptions,
  updateShopSubscription,
  adminCancelShopSubscription,
} from "@/lib/database/subscription";

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    const subscriptions = await getAllShopSubscriptions();

    return NextResponse.json({
      success: true,
      settings,
      subscriptions,
    });
  } catch (error: any) {
    console.error("[API ADMIN SUBSCRIPTION GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data pengaturan paket berlangganan." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "update_plans") {
      const { plans } = body;
      if (!Array.isArray(plans)) {
        return NextResponse.json({ success: false, error: "Format data plans tidak valid." }, { status: 400 });
      }
      await updatePlansConfig(plans);
      const updatedSettings = await getPlatformSettings();
      return NextResponse.json({
        success: true,
        message: "Pengaturan paket langganan dan fitur berhasil diperbarui!",
        settings: updatedSettings,
      });
    }

    if (action === "update_commissions") {
      const { commissions } = body;
      if (!commissions) {
        return NextResponse.json({ success: false, error: "Data commissions wajib disertakan." }, { status: 400 });
      }
      await updateCommissionSettings(commissions);
      const updatedSettings = await getPlatformSettings();
      return NextResponse.json({
        success: true,
        message: "Tarif komisi platform berhasil disimpan!",
        settings: updatedSettings,
      });
    }

    if (action === "update_shop_subscription") {
      const { shopId, planId, billingCycle } = body;
      if (!shopId || !planId) {
        return NextResponse.json({ success: false, error: "shopId dan planId wajib disertakan." }, { status: 400 });
      }
      const subscription = await updateShopSubscription(shopId, planId, billingCycle || "monthly");
      return NextResponse.json({
        success: true,
        message: `Plan toko berhasil diperbarui ke ${subscription.planName}.`,
        subscription,
      });
    }

    if (action === "cancel_shop_subscription") {
      const { shopId } = body;
      if (!shopId) {
        return NextResponse.json({ success: false, error: "shopId wajib disertakan." }, { status: 400 });
      }
      await adminCancelShopSubscription(shopId);
      return NextResponse.json({
        success: true,
        message: "Langganan toko berhasil dibatalkan.",
      });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    console.error("[API ADMIN SUBSCRIPTION POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan pengaturan." },
      { status: 500 }
    );
  }
}
