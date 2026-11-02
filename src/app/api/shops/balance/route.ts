import { NextResponse } from "next/server";
import { getShopBalance, withdrawShopBalance, creditShopSales } from "@/lib/database/shop-balance";
import { extractBearerToken, verifyFirebaseIdToken, verifyShopAuthorization } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/shops/balance?shopId=...
 * Fetch shop revenue & settlement balance.
 * Requires Shop Owner, Admin, or Staff with 'finance' permission.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Parameter shopId diperlukan." },
        { status: 400 }
      );
    }

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

      const access = await verifyShopAuthorization(auth.uid, shopId, "finance");
      if (!access.authorized) {
        return NextResponse.json(
          {
            success: false,
            error: access.reason || "Akses ditolak: Anda tidak memiliki izin mengelola keuangan toko ini.",
            unauthorizedRole: access.role,
          },
          { status: 403 }
        );
      }
    }

    const balance = await getShopBalance(shopId);

    return NextResponse.json({
      success: true,
      shopId,
      balance,
    });
  } catch (error: any) {
    console.error("[API SHOPS BALANCE GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil saldo toko." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shops/balance
 * Process a withdrawal request for shop revenue.
 * Requires Shop Owner, Admin, or Staff with 'finance' permission.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shopId, amount, action = "withdraw" } = body;

    if (!shopId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Parameter shopId dan amount (angka > 0) wajib diisi." },
        { status: 400 }
      );
    }

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

      const access = await verifyShopAuthorization(auth.uid, shopId, "finance");
      if (!access.authorized) {
        return NextResponse.json(
          { success: false, error: access.reason || "Akses ditolak: Anda tidak memiliki izin finansial untuk toko ini." },
          { status: 403 }
        );
      }
    }

    if (action === "withdraw") {
      const result = await withdrawShopBalance(shopId, amount);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.message || "Gagal memproses penarikan saldo." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Permintaan penarikan dana sebesar Rp ${amount.toLocaleString("id-ID")} berhasil diproses.`,
        activeBalance: result.activeBalance,
      });
    }

    if (action === "credit" && isInternal) {
      const result = await creditShopSales(shopId, amount);
      return NextResponse.json({
        success: true,
        balance: result,
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    console.error("[API SHOPS BALANCE POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi saldo toko." },
      { status: 500 }
    );
  }
}
