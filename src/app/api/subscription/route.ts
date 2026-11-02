import { NextResponse } from "next/server";
import { getShopSubscription, updateShopSubscription } from "@/lib/database/subscription";
import { getPlatformSettings } from "@/lib/database/settings";
import { extractBearerToken, verifyFirebaseIdToken, verifyShopAuthorization } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

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
    const body = await req.json().catch(() => ({}));
    const { shopId, planId, billingCycle } = body;

    if (!shopId || !planId) {
      return NextResponse.json({ success: false, error: "Field shopId dan planId wajib diisi." }, { status: 400 });
    }

    const validPlanIds = ["free", "plus", "pro", "prime", "admin"];
    if (!validPlanIds.includes(planId)) {
      return NextResponse.json({ success: false, error: "Paket berlangganan tidak valid." }, { status: 400 });
    }

    // Check internal secret (e.g. payment webhook activating subscription)
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    if (!isInternal) {
      const token = extractBearerToken(req);
      if (!token) {
        return NextResponse.json(
          { success: false, error: "Otentikasi diperlukan: Header Authorization: Bearer <TOKEN> wajib disertakan." },
          { status: 401 }
        );
      }

      const auth = await verifyFirebaseIdToken(token);
      if (!auth.valid || !auth.uid) {
        return NextResponse.json(
          { success: false, error: auth.error || "Token autentikasi tidak valid." },
          { status: 401 }
        );
      }

      const access = await verifyShopAuthorization(auth.uid, shopId);
      if (!access.authorized) {
        return NextResponse.json(
          { success: false, error: access.reason || "Akses ditolak: Anda tidak memiliki wewenang untuk toko ini." },
          { status: 403 }
        );
      }

      // Non-admins cannot grant themselves the 'admin' plan for free
      if (planId === "admin" && !access.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak: Paket Admin hanya dapat diaktifkan oleh Administrator Platform." },
          { status: 403 }
        );
      }
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
