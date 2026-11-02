import { NextResponse } from "next/server";
import { getAllActiveProducts, getCategories } from "@/lib/database/product";
import { getResellerProducts } from "@/lib/database/reseller-product";
import { query, initDatabaseSchema } from "@/lib/database/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/reseller/market-products
 * Fetch all real active marketplace seller products for the "Tambah Produk" page.
 * Optional query: ?userId=... (to mark products already added by user)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");

    await initDatabaseSchema();

    // 1. Fetch real active products from PostgreSQL
    const rawProducts = await getAllActiveProducts(
      categoryId ? Number(categoryId) : undefined,
      150
    );

    // 2. Fetch real categories
    const categories = await getCategories();

    // 3. Resolve real shop names from Firestore (marketpointid)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpointid";
    const shopsMap = new Map<string, { name: string; city: string; isVerified: boolean; isOfficial: boolean }>();

    try {
      const fsRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shops`,
        { cache: "no-store" }
      );
      if (fsRes.ok) {
        const fsData = await fsRes.json();
        if (fsData.documents && Array.isArray(fsData.documents)) {
          fsData.documents.forEach((doc: any) => {
            const fields = doc.fields || {};
            const docId = doc.name.split("/").pop();
            const name = fields.name?.stringValue || fields.shopName?.stringValue || "MarketPoint";
            const locationMap = fields.location?.mapValue?.fields || {};
            const city = locationMap.city?.stringValue || fields.city?.stringValue || "Jakarta";
            const isVerified = fields.verified?.booleanValue ?? fields.isVerified?.booleanValue ?? true;
            const isOfficial = fields.official?.booleanValue ?? fields.isOfficial?.booleanValue ?? (name.toLowerCase().includes("marketpoint") || docId === "7eiFB7ievpRHlVbdq049z3AhtT73");
            shopsMap.set(docId, { name, city, isVerified, isOfficial });
          });
        }
      }
    } catch (e) {
      console.warn("[WARN] Failed to fetch shops from Firestore:", e);
    }

    // 4. Fetch already added products if userId provided
    const userAddedMap = new Map<string, string>();
    if (userId) {
      try {
        const userProducts = await getResellerProducts(userId);
        userProducts.forEach((rp) => {
          userAddedMap.set(rp.productId, rp.buyerSku);
        });
      } catch (e) {
        console.warn("[WARN] Gagal mengambil produk existing user:", e);
      }
    }

    // 5. Build clean, real product offer items
    const products = rawProducts.map((p) => {
      const shopInfo = shopsMap.get(p.shopId);
      const isOfficialShop = shopInfo?.isOfficial || p.shopId === "7eiFB7ievpRHlVbdq049z3AhtT73" || p.shopId === "marketpoint";
      const sellerName = shopInfo?.name || (isOfficialShop ? "MarketPoint Official" : "Toko Seller");

      // Default suggested SKU: alphanumeric from title or ID
      const defaultSku = p.id
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "")
        .slice(0, 16);

      const isAdded = userAddedMap.has(p.id);

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        categoryId: p.categoryId,
        categoryName: p.categoryName || "Produk Digital",
        categorySlug: (p as any).categorySlug || "digital",
        price: p.price,
        discountPrice: p.discountPrice,
        stockType: p.stockType || "REUSABLE",
        stockCount: p.stockCount,
        status: p.status,
        ratingAvg: Number(p.ratingAvg || 0),
        ratingCount: Number(p.ratingCount || 0),
        salesCount: p.salesCount || 0,
        images: p.images || [],
        imageUrl: p.images?.[0]?.imageUrl || "",
        seller: {
          id: p.shopId,
          name: sellerName,
          city: shopInfo?.city || "Jakarta",
          badge: (isOfficialShop
            ? "OFFICIAL"
            : shopInfo?.isVerified
            ? "VERIFIED"
            : "STAR_SELLER") as "OFFICIAL" | "VERIFIED" | "STAR_SELLER",
        },
        defaultSku,
        isAdded,
        currentBuyerSku: userAddedMap.get(p.id) || null,
      };
    });

    return NextResponse.json({
      success: true,
      products,
      categories,
      total: products.length,
    });
  } catch (error: any) {
    console.error("[API RESELLER MARKET PRODUCTS ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data produk pasar." },
      { status: 500 }
    );
  }
}
