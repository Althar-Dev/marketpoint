import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/database/settings";
import { getDigiFlazzPriceList } from "@/lib/digiflazz";
import {
  saveDigiFlazzCatalog,
  getDigiFlazzCatalog,
  getCatalogStats,
  clearDigiFlazzCatalog,
  DigiFlazzCatalogItem,
} from "@/lib/database/catalog-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const cmd_type = searchParams.get("cmd_type") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || undefined;

    const items = await getDigiFlazzCatalog({ search, category, brand, cmd_type, status, sort });
    const stats = await getCatalogStats();

    return NextResponse.json({
      success: true,
      count: items.length,
      total: stats.total,
      categories: stats.categories,
      brands: stats.brands,
      lastSync: stats.lastSync,
      dbSize: stats.dbSize,
      dbSizeBytes: stats.dbSizeBytes,
      data: items,
    });
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

      if (Array.isArray(prepaidList)) {
        combined = [...combined, ...prepaidList.map((item: any) => ({ ...item, cmd_type: "prepaid" }))];
      }
      if (Array.isArray(pascaList)) {
        combined = [...combined, ...pascaList.map((item: any) => ({ ...item, cmd_type: "pasca" }))];
      }

      if (combined.length > 0) {
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
      const count = await saveDigiFlazzCatalog(items);
      const stats = await getCatalogStats();
      return NextResponse.json({
        success: true,
        count,
        total: stats.total,
        categories: stats.categories,
        brands: stats.brands,
        dbSize: stats.dbSize,
        lastSync: stats.lastSync,
        message: `Berhasil menyimpan ${count.toLocaleString("id-ID")} produk`,
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("POST DigiFlazz Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyinkronkan katalog produk" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearDigiFlazzCatalog();
    const stats = await getCatalogStats();
    return NextResponse.json({
      success: true,
      count: 0,
      total: 0,
      dbSize: stats.dbSize,
      message: "Katalog produk SQLite (database/catalog.db) berhasil dikosongkan.",
    });
  } catch (error: any) {
    console.error("DELETE DigiFlazz Catalog Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengosongkan katalog produk" },
      { status: 500 }
    );
  }
}
