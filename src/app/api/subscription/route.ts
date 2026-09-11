import { NextResponse } from "next/server";
import { getShopSubscription, updateShopSubscription } from "@/lib/database/subscription";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ success: false, error: "Parameter shopId wajib disertakan." }, { status: 400 });
    }

    const subscription = await getShopSubscription(shopId);
    return NextResponse.json({ success: true, subscription });
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

    const validPlanIds = ["plus", "pro", "prime"];
    if (!validPlanIds.includes(planId)) {
      return NextResponse.json({ success: false, error: "Paket berlangganan tidak valid." }, { status: 400 });
    }

    const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const subscription = await updateShopSubscription(shopId, planId as any, cycle);

    return NextResponse.json({
      success: true,
      message: `Berhasil berlangganan Paket ${subscription.planName} (${cycle === "yearly" ? "Tahunan" : "Bulanan"}).`,
      subscription,
    });
  } catch (error: any) {
    console.error("[API SUBSCRIPTION POST ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses berlangganan." }, { status: 500 });
  }
}
