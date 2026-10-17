import { NextResponse } from "next/server";
import { getShopSubscription, updateShopSubscription } from "@/lib/database/subscription";
import { getPlatformSettings } from "@/lib/database/settings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    const settings = await getPlatformSettings();
    const commissions = settings?.commissions || {
      free: 7.0,
      plus: 5.0,
      pro: 3.5,
      prime: 2.0,
    };

    let subscription = null;
    if (shopId) {
      subscription = await getShopSubscription(shopId);
    }

    return NextResponse.json({
      success: true,
      subscription,
      commissions,
      plans: settings?.plans || [],
    });
  } catch (error: any) {
    console.error("[API SUBSCRIPTION GET ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal mengambil data berlangganan." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, planId, billingCycle } = body;

    if (!shopId || !planId) {
      return NextResponse.json({ success: false, error: "Field shopId dan planId wajib diisi." }, { status: 400 });
    }

    const validPlanIds = ["free", "plus", "pro", "prime", "admin"];
    if (!validPlanIds.includes(planId)) {
      return NextResponse.json({ success: false, error: "Paket berlangganan tidak valid." }, { status: 400 });
    }

    const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const subscription = await updateShopSubscription(shopId, planId as any, cycle);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengubah paket toko ke ${subscription.planName}.`,
      subscription,
    });
  } catch (error: any) {
    console.error("[API SUBSCRIPTION POST ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses berlangganan." }, { status: 500 });
  }
}
