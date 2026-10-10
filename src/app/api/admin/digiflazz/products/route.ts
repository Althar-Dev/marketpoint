import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/database/settings";
import { getDigiFlazzPriceList } from "@/lib/digiflazz";
import {
  saveDigiFlazzCatalog,
  getDigiFlazzCatalog,
  getCatalogStats,
  clearDigiFlazzCatalog,
  deleteDigiFlazzProduct,
  deleteDigiFlazzProducts,
  DigiFlazzCatalogItem,
  getDigiFlazzMarkupData,
  calculateMarkupPrice,
} from "@/lib/database/catalog-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const cmd_type = searchParams.get("cmd_type") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || undefined;

    const [items, stats, markupConfig] = await Promise.all([
      getDigiFlazzCatalog({ search, category, brand, cmd_type, status, sort }),
      getCatalogStats(),
      getDigiFlazzMarkupData(),
    ]);

    const mappedData = items.map((item: DigiFlazzCatalogItem) => {
      const base = item.price || item.admin || 0;
      const calc = calculateMarkupPrice(base, item.category, item.brand, markupConfig, item.buyer_sku_code);
      return {
        ...item,
        base_price: base,
        selling_price: calc.finalPrice,
        price: calc.finalPrice,
        markup_amount: calc.markupAmount,
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: items.length,
        total: stats.total,
        categories: stats.categories,
        brands: stats.brands,
        lastSync: stats.lastSync,
        dbSize: stats.dbSize,
        dbSizeBytes: stats.dbSizeBytes,
        data: mappedData,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET DigiFlazz Catalog Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil katalog produk" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "sync";

    if (action === "clear") {
      await clearDigiFlazzCatalog();
      const stats = await getCatalogStats();
      return NextResponse.json({
        success: true,
        count: 0,
        total: 0,
        dbSize: stats.dbSize,
        message: "Katalog produk SQLite (database/catalog.db) berhasil dikosongkan.",
      });
    }

    if (action === "sync") {
      const settings = await getPlatformSettings();
      const username = body.username || settings.digiflazz?.username;
      const apiKey = body.apiKey || settings.digiflazz?.apiKey;

      if (!username || !apiKey) {
        return NextResponse.json(
          { success: false, error: "Username & API Key DigiFlazz belum dikonfigurasi" },
          { status: 400 }
        );
      }

      // Fetch prepaid products
      const prepaidList = await getDigiFlazzPriceList("prepaid", { username, apiKey });
      // Fetch pasca products
      const pascaList = await getDigiFlazzPriceList("pasca", { username, apiKey });

      let combined: DigiFlazzCatalogItem[] = [];

      const isItemActive = (item: any) => {
        const buyerOk = item.buyer_product_status === true || item.buyer_product_status === 1 || item.buyer_product_status === "true";
        const sellerOk = item.seller_product_status === true || item.seller_product_status === 1 || item.seller_product_status === "true";
        return buyerOk && sellerOk;
      };

      if (Array.isArray(prepaidList)) {
        const activePrepaid = prepaidList
          .filter(isItemActive)
          .map((item: any) => ({ ...item, cmd_type: "prepaid" }));
        combined = [...combined, ...activePrepaid];
      }
      if (Array.isArray(pascaList)) {
        const activePasca = pascaList
          .filter(isItemActive)
          .map((item: any) => ({ ...item, cmd_type: "pasca" }));
        combined = [...combined, ...activePasca];
      }

      if (combined.length > 0) {
        // Clear catalog items first so inactive products are removed from catalog table
        await clearDigiFlazzCatalog();
        await saveDigiFlazzCatalog(combined);
      }

      const stats = await getCatalogStats();

      return NextResponse.json({
        success: true,
        count: combined.length,
        total: stats.total,
        categories: stats.categories,
        brands: stats.brands,
        dbSize: stats.dbSize,
        lastSync: stats.lastSync,
        message: `Berhasil menyinkronkan ${combined.length.toLocaleString("id-ID")} produk ke database/catalog.db SQLite!`,
      });
    }

    if (action === "save_items") {
      const { items } = body;
      if (!Array.isArray(items)) {
        return NextResponse.json({ success: false, error: "Items harus berupa array" }, { status: 400 });
      }

      const isItemActive = (item: any) => {
        const buyerOk = item.buyer_product_status === true || item.buyer_product_status === 1 || item.buyer_product_status === "true";
        const sellerOk = item.seller_product_status === true || item.seller_product_status === 1 || item.seller_product_status === "true";
        return buyerOk && sellerOk;
      };

      const activeItems = items.filter(isItemActive);

      // Clear old catalog products table first so deleted products from DigiFlazz are completely wiped
      await clearDigiFlazzCatalog();
      const count = await saveDigiFlazzCatalog(activeItems);
      const stats = await getCatalogStats();

      return NextResponse.json({
        success: true,
        count,
        total: stats.total,
        categories: stats.categories,
        brands: stats.brands,
        dbSize: stats.dbSize,
        lastSync: stats.lastSync,
        message: `Berhasil menyinkronkan & menyimpan ${count.toLocaleString("id-ID")} produk aktif ke database/catalog.db!`,
      });
    }

    if (action === "delete_item") {
      const sku = body.sku || body.buyer_sku_code;
      if (!sku) {
        return NextResponse.json({ success: false, error: "SKU diperlukan" }, { status: 400 });
      }
      const deleted = await deleteDigiFlazzProduct(sku);
      const stats = await getCatalogStats();
      if (!deleted) {
        return NextResponse.json({ success: false, error: `Produk dengan SKU ${sku} tidak ditemukan` }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Produk dengan SKU ${sku} berhasil dihapus dari .`,
        sku,
        total: stats.total,
        dbSize: stats.dbSize,
      });
    }

    if (action === "delete_items") {
      const skus = body.skus;
      if (!Array.isArray(skus) || skus.length === 0) {
        return NextResponse.json({ success: false, error: "Daftar SKU diperlukan" }, { status: 400 });
      }
      const count = await deleteDigiFlazzProducts(skus);
      const stats = await getCatalogStats();
      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus ${count.toLocaleString("id-ID")} produk dari .`,
        deletedCount: count,
        total: stats.total,
        dbSize: stats.dbSize,
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("POST DigiFlazz Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses katalog produk" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku") || searchParams.get("buyer_sku_code");
    const action = searchParams.get("action");

    // Also support JSON body if passed
    let bodySkus: string[] = [];
    try {
      const body = await req.json();
      if (body?.sku) {
        bodySkus = [body.sku];
      } else if (Array.isArray(body?.skus)) {
        bodySkus = body.skus;
      }
    } catch {
      // Body is optional
    }

    if (sku) {
      const deleted = await deleteDigiFlazzProduct(sku);
      const stats = await getCatalogStats();
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: `Produk dengan SKU ${sku} tidak ditemukan` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Produk dengan SKU ${sku} berhasil dihapus dari .`,
        sku,
        total: stats.total,
        dbSize: stats.dbSize,
      });
    }

    if (bodySkus.length > 0) {
      const count = await deleteDigiFlazzProducts(bodySkus);
      const stats = await getCatalogStats();
      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus ${count.toLocaleString("id-ID")} produk dari .`,
        deletedCount: count,
        total: stats.total,
        dbSize: stats.dbSize,
      });
    }

    // If no specific sku, check if action is explicitly clear or fallback to clear whole catalog
    if (action === "clear" || (!sku && bodySkus.length === 0)) {
      await clearDigiFlazzCatalog();
      const stats = await getCatalogStats();
      return NextResponse.json({
        success: true,
        count: 0,
        total: 0,
        dbSize: stats.dbSize,
        message: "Katalog produk SQLite (database/catalog.db) berhasil dikosongkan.",
      });
    }
  } catch (error: any) {
    console.error("DELETE DigiFlazz Catalog Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus produk dari katalog" },
      { status: 500 }
    );
  }
}
