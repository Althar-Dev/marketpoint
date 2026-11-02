import { NextResponse } from "next/server";
import {
  getResellerProducts,
  getResellerProductBySku,
  upsertResellerProduct,
  deleteResellerProduct,
} from "@/lib/database/reseller-product";
import { validateApiKey } from "@/lib/database/api-key";
import { extractBearerToken, verifyFirebaseIdToken } from "@/lib/server-auth";
import { firebaseConfig } from "@/firebase/config";

export const dynamic = "force-dynamic";

async function isPlatformAdmin(uid: string): Promise<boolean> {
  const projectId = firebaseConfig.projectId || "marketpointid";
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return data.fields?.admin?.booleanValue === true;
    }
  } catch (_) {}
  return false;
}

/**
 * Helper to authenticate and authorize reseller requests.
 * Supports:
 * 1. Internal secret (x-internal-secret)
 * 2. API Key (Bearer mp_live_... or x-api-key)
 * 3. Firebase ID Token (Bearer <ID_TOKEN>)
 */
async function resolveAuthorizedUser(
  req: Request,
  targetUserId?: string | null
): Promise<{ authorized: boolean; userId?: string; error?: string; status?: number }> {
  const internalSecret = req.headers.get("x-internal-secret");
  if (process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET) {
    return { authorized: true, userId: targetUserId || undefined };
  }

  const authHeader = req.headers.get("authorization") || "";
  const bearerVal = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const headerKey = req.headers.get("x-api-key") || req.headers.get("api-key");
  const rawApiKey = headerKey || (bearerVal && (bearerVal.startsWith("mp_") || bearerVal.startsWith("key_")) ? bearerVal : null);

  // 1. API Key Auth
  if (rawApiKey) {
    const keyAuth = await validateApiKey(rawApiKey);
    if (!keyAuth.valid || !keyAuth.userId) {
      return { authorized: false, error: "API Key tidak valid atau telah dinonaktifkan.", status: 401 };
    }
    if (targetUserId && targetUserId !== keyAuth.userId) {
      return { authorized: false, error: "Akses ditolak: API Key tidak cocok dengan target pengguna.", status: 403 };
    }
    return { authorized: true, userId: keyAuth.userId };
  }

  // 2. Firebase ID Token Auth
  if (bearerVal) {
    const tokenAuth = await verifyFirebaseIdToken(bearerVal);
    if (!tokenAuth.valid || !tokenAuth.uid) {
      return { authorized: false, error: tokenAuth.error || "Token otentikasi tidak valid.", status: 401 };
    }
    if (targetUserId && targetUserId !== tokenAuth.uid) {
      const isAdmin = await isPlatformAdmin(tokenAuth.uid);
      if (!isAdmin) {
        return {
          authorized: false,
          error: "Akses ditolak: Anda tidak memiliki izin untuk mengelola produk pengguna lain.",
          status: 403,
        };
      }
      return { authorized: true, userId: targetUserId };
    }
    return { authorized: true, userId: tokenAuth.uid };
  }

  return {
    authorized: false,
    error: "Otentikasi diperlukan. Sertakan header Authorization: Bearer <TOKEN> atau API Key.",
    status: 401,
  };
}

/**
 * GET /api/reseller/products
 * - ?userId=... OR Authorization: Bearer <API_KEY / ID_TOKEN>
 * - ?sku=... : Lookup single product mapping by custom buyer_sku
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const sku = searchParams.get("sku");

    const auth = await resolveAuthorizedUser(req, requestedUserId);
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json(
        { success: false, message: auth.error || "Otentikasi diperlukan." },
        { status: auth.status || 401 }
      );
    }

    const userId = auth.userId;

    if (sku) {
      const product = await getResellerProductBySku(userId, sku);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Produk dengan kode '${sku}' tidak ditemukan.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, product });
    }

    const rawProducts = await getResellerProducts(userId);
    const KNOWN_SHOPS: Record<string, { name: string; isOfficial: boolean }> = {
      "7eiFB7ievpRHlVbdq049z3AhtT73": { name: "MarketPoint", isOfficial: true },
      "marketpoint": { name: "MarketPoint", isOfficial: true },
      "vRe8uW1dRcUxYjPiMlHN8bKZPBz1": { name: "StarVale", isOfficial: false },
    };

    const products = rawProducts.map((p) => {
      const known = p.sellerShopId ? KNOWN_SHOPS[p.sellerShopId] : null;
      return {
        ...p,
        sellerName: known?.name || (p.sellerShopId === "marketpoint" ? "MarketPoint" : "MarketPoint"),
        sellerIsOfficial: known?.isOfficial ?? true,
      };
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("[API RESELLER PRODUCTS GET ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil katalog produk reseller." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reseller/products
 * Add or update custom product code mapping for a buyer/reseller.
 * Body: { userId, buyerSku, productId, customName?, sellingPrice?, status? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, buyerSku, productId, customName, sellingPrice, status } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Field productId wajib diisi.",
        },
        { status: 400 }
      );
    }

    const auth = await resolveAuthorizedUser(req, userId);
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json(
        { success: false, message: auth.error || "Otentikasi diperlukan." },
        { status: auth.status || 401 }
      );
    }

    const targetUserId = auth.userId;

    const cleanSku =
      buyerSku !== undefined && buyerSku !== null && String(buyerSku).trim().length > 0
        ? String(buyerSku).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
        : null;

    const result = await upsertResellerProduct({
      userId: targetUserId,
      buyerSku: cleanSku,
      productId: String(productId),
      customName: customName ? String(customName) : undefined,
      sellingPrice:
        sellingPrice !== undefined && sellingPrice !== null ? Number(sellingPrice) : undefined,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });

    return NextResponse.json({
      success: true,
      message: "Produk reseller berhasil disimpan.",
      product: result,
    });
  } catch (error: any) {
    console.error("[API RESELLER PRODUCTS POST ERROR]", error);
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "Kode produk tersebut sudah digunakan untuk produk lain di katalog Anda. Gunakan kode yang unik.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan kode produk reseller." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reseller/products
 * Delete a product mapping from reseller's custom catalog.
 * Query or Body: { userId, sku / productId }
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let requestedUserId = searchParams.get("userId");
    let identifier =
      searchParams.get("sku") ||
      searchParams.get("buyerSku") ||
      searchParams.get("productId") ||
      searchParams.get("id");

    if (!identifier) {
      try {
        const body = await req.json();
        requestedUserId = requestedUserId || body.userId;
        identifier = identifier || body.sku || body.buyerSku || body.productId || body.id;
      } catch {
        // ignore json parse error
      }
    }

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Parameter sku atau productId wajib diberikan." },
        { status: 400 }
      );
    }

    const auth = await resolveAuthorizedUser(req, requestedUserId);
    if (!auth.authorized || !auth.userId) {
      return NextResponse.json(
        { success: false, message: auth.error || "Otentikasi diperlukan." },
        { status: auth.status || 401 }
      );
    }

    const targetUserId = auth.userId;

    const deleted = await deleteResellerProduct(targetUserId, identifier);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus dari katalog custom.",
    });
  } catch (error: any) {
    console.error("[API RESELLER PRODUCTS DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus produk reseller." },
      { status: 500 }
    );
  }
}
