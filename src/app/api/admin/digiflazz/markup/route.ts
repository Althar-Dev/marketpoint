import { NextResponse } from "next/server";
import {
  initCatalogDb,
  getDigiFlazzMarkupData,
  saveDigiFlazzMarkupData,
  DigiFlazzMarkupConfig,
  DEFAULT_MARKUP_CONFIG,
  calculateMarkupPrice,
} from "@/lib/database/catalog-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");

    const db = await initCatalogDb();

    // If dedicated product query by search, category, or brand
    if (searchQuery !== null || categoryParam !== null || brandParam !== null) {
      let query = `SELECT buyer_sku_code, product_name, category, brand, price, admin FROM digiflazz_catalog WHERE buyer_product_status = 1`;
      const params: any[] = [];

      if (categoryParam) {
        query += ` AND category = ?`;
        params.push(categoryParam);
      }
      if (brandParam) {
        query += ` AND brand = ?`;
        params.push(brandParam);
      }
      if (searchQuery) {
        query += ` AND (product_name LIKE ? OR buyer_sku_code LIKE ? OR brand LIKE ?)`;
        const q = `%${searchQuery.trim()}%`;
        params.push(q, q, q);
      }

      query += ` ORDER BY brand ASC, price ASC LIMIT 400`;

      const products = await new Promise<any[]>((resolve) => {
        db.all(query, params, (err, rows: any[]) => {
          if (err || !rows) resolve([]);
          else resolve(rows);
        });
      });

      return NextResponse.json({
        success: true,
        products,
      });
    }

    const config = await getDigiFlazzMarkupData();

    // Fetch distinct categories and brands for easy selection in admin UI
    const categoriesPromise = new Promise<string[]>((resolve) => {
      db.all(
        `SELECT DISTINCT category FROM digiflazz_catalog WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`,
        [],
        (err, rows: any[]) => {
          if (err || !rows) resolve([]);
          else resolve(rows.map((r) => r.category));
        }
      );
    });

    const brandsPromise = new Promise<{ brand: string; category: string; count: number }[]>((resolve) => {
      db.all(
        `SELECT brand, category, COUNT(*) as count FROM digiflazz_catalog WHERE brand IS NOT NULL AND brand != '' GROUP BY brand, category ORDER BY brand ASC`,
        [],
        (err, rows: any[]) => {
          if (err || !rows) resolve([]);
          else resolve(rows.map((r) => ({ brand: r.brand, category: r.category || "", count: r.count || 0 })));
        }
      );
    });

    const initialProductsPromise = new Promise<any[]>((resolve) => {
      db.all(
        `SELECT buyer_sku_code, product_name, category, brand, price, admin 
         FROM digiflazz_catalog 
         WHERE buyer_product_status = 1 
         ORDER BY price ASC 
         LIMIT 60`,
        [],
        (err, rows: any[]) => {
          if (err || !rows) resolve([]);
          else resolve(rows);
        }
      );
    });

    const samplesPromise = new Promise<any[]>((resolve) => {
      db.all(
        `SELECT buyer_sku_code, product_name, category, brand, price, admin FROM digiflazz_catalog WHERE buyer_product_status = 1 AND seller_product_status = 1 ORDER BY RANDOM() LIMIT 8`,
        [],
        (err, rows: any[]) => {
          if (err || !rows) resolve([]);
          else resolve(rows);
        }
      );
    });

    const [categories, brands, initialProducts, samples] = await Promise.all([
      categoriesPromise,
      brandsPromise,
      initialProductsPromise,
      samplesPromise,
    ]);

    // Calculate sample pricing with current config
    const sampleCalculations = samples.map((item) => {
      const base = item.price || item.admin || 0;
      const calc = calculateMarkupPrice(base, item.category, item.brand, config, item.buyer_sku_code);
      return {
        ...item,
        basePrice: base,
        markupAmount: calc.markupAmount,
        sellingPrice: calc.finalPrice,
        ruleApplied: calc.ruleApplied,
      };
    });

    return NextResponse.json({
      success: true,
      config: config || DEFAULT_MARKUP_CONFIG,
      categories,
      brands,
      products: initialProducts,
      sampleCalculations,
    });
  } catch (error: any) {
    console.error("GET Markup API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat konfigurasi markup" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config: DigiFlazzMarkupConfig = body.config;

    if (!config || !config.global) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi markup tidak valid" },
        { status: 400 }
      );
    }

    await saveDigiFlazzMarkupData(config);

    return NextResponse.json({
      success: true,
      message: "Pengaturan markup DigiFlazz berhasil disimpan",
      config,
    });
  } catch (error: any) {
    console.error("POST Markup API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan konfigurasi markup" },
      { status: 500 }
    );
  }
}
