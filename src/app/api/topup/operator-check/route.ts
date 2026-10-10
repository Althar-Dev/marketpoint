import { NextResponse } from "next/server";
import { detectOperatorFromPhone, normalizePhoneNumber } from "@/lib/operator-detector";
import {
  getDigiFlazzCatalog,
  getDigiFlazzVisualsData,
  getDigiFlazzMarkupData,
  calculateMarkupPrice,
} from "@/lib/database/catalog-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone") || "";
    const type = (searchParams.get("type") || "pulsa").toLowerCase(); // "pulsa" | "data" | "all"

    const normalized = normalizePhoneNumber(phone);
    const operator = detectOperatorFromPhone(normalized);

    if (!operator) {
      return NextResponse.json({
        success: true,
        detected: false,
        phone: normalized,
        operator: null,
        skus: [],
      });
    }

    // Fetch active products for this operator brand from SQLite catalog.db
    const allBrandItems = await getDigiFlazzCatalog({
      brand: operator.brand,
      status: "active",
      sort: "price_asc",
    });

    // Filter by type: Pulsa or Data
    let filteredSkus = allBrandItems;
    if (type === "pulsa") {
      filteredSkus = allBrandItems.filter((i) => (i.category || "").toUpperCase().includes("PULSA"));
    } else if (type === "data" || type === "paket-data") {
      filteredSkus = allBrandItems.filter((i) => (i.category || "").toUpperCase().includes("DATA"));
    }

    // If by.U has 0 items in selected category, fallback to Telkomsel
    if (filteredSkus.length === 0 && operator.brand === "by.U") {
      const telkomselItems = await getDigiFlazzCatalog({
        brand: "TELKOMSEL",
        status: "active",
        sort: "price_asc",
      });
      if (type === "pulsa") {
        filteredSkus = telkomselItems.filter((i) => (i.category || "").toUpperCase().includes("PULSA"));
      } else if (type === "data" || type === "paket-data") {
        filteredSkus = telkomselItems.filter((i) => (i.category || "").toUpperCase().includes("DATA"));
      }
    }

    // Get brand visuals & markup config
    const [visuals, markupConfig] = await Promise.all([
      getDigiFlazzVisualsData(),
      getDigiFlazzMarkupData(),
    ]);

    let visual: any = null;
    if (visuals?.brands) {
      const target = operator.brand.toLowerCase().trim();
      for (const [k, v] of Object.entries(visuals.brands)) {
        if (k.toLowerCase().trim() === target) {
          visual = { ...(visual || {}), ...(v as any) };
        }
      }
    }

    return NextResponse.json({
      success: true,
      detected: true,
      phone: normalized,
      operator: {
        brand: operator.brand,
        name: operator.name,
        iconUrl: visual?.iconUrl || null,
        badgeText: visual?.badgeText || null,
        badgeBg: visual?.badgeBg || null,
      },
      count: filteredSkus.length,
      skus: filteredSkus.map((item) => {
        const base = item.price || item.admin || 0;
        const calc = calculateMarkupPrice(base, item.category, item.brand, markupConfig, item.buyer_sku_code);
        return {
          buyer_sku_code: item.buyer_sku_code,
          product_name: item.product_name,
          price: calc.finalPrice,
          base_price: base,
          desc: item.desc || "",
          category: item.category,
          brand: item.brand,
          type: item.type,
        };
      }),
    });
  } catch (error: any) {
    console.error("Operator Check API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memeriksa operator" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body.phone || "";
    const type = (body.type || "pulsa").toLowerCase();

    const normalized = normalizePhoneNumber(phone);
    const operator = detectOperatorFromPhone(normalized);

    if (!operator) {
      return NextResponse.json({
        success: true,
        detected: false,
        phone: normalized,
        operator: null,
        skus: [],
      });
    }

    const allBrandItems = await getDigiFlazzCatalog({
      brand: operator.brand,
      status: "active",
      sort: "price_asc",
    });

    let filteredSkus = allBrandItems;
    if (type === "pulsa") {
      filteredSkus = allBrandItems.filter((i) => (i.category || "").toUpperCase().includes("PULSA"));
    } else if (type === "data" || type === "paket-data") {
      filteredSkus = allBrandItems.filter((i) => (i.category || "").toUpperCase().includes("DATA"));
    }

    if (filteredSkus.length === 0 && operator.brand === "by.U") {
      const telkomselItems = await getDigiFlazzCatalog({
        brand: "TELKOMSEL",
        status: "active",
        sort: "price_asc",
      });
      if (type === "pulsa") {
        filteredSkus = telkomselItems.filter((i) => (i.category || "").toUpperCase().includes("PULSA"));
      } else if (type === "data" || type === "paket-data") {
        filteredSkus = telkomselItems.filter((i) => (i.category || "").toUpperCase().includes("DATA"));
      }
    }

    // Get brand visuals & markup config
    const [visuals, markupConfig] = await Promise.all([
      getDigiFlazzVisualsData(),
      getDigiFlazzMarkupData(),
    ]);

    let visual: any = null;
    if (visuals?.brands) {
      const target = operator.brand.toLowerCase().trim();
      for (const [k, v] of Object.entries(visuals.brands)) {
        if (k.toLowerCase().trim() === target) {
          visual = { ...(visual || {}), ...(v as any) };
        }
      }
    }

    return NextResponse.json({
      success: true,
      detected: true,
      phone: normalized,
      operator: {
        brand: operator.brand,
        name: operator.name,
        iconUrl: visual?.iconUrl || null,
        badgeText: visual?.badgeText || null,
        badgeBg: visual?.badgeBg || null,
      },
      count: filteredSkus.length,
      skus: filteredSkus.map((item) => {
        const base = item.price || item.admin || 0;
        const calc = calculateMarkupPrice(base, item.category, item.brand, markupConfig, item.buyer_sku_code);
        return {
          buyer_sku_code: item.buyer_sku_code,
          product_name: item.product_name,
          price: calc.finalPrice,
          base_price: base,
          desc: item.desc || "",
          category: item.category,
          brand: item.brand,
          type: item.type,
        };
      }),
    });
  } catch (error: any) {
    console.error("Operator Check API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memeriksa operator" },
      { status: 500 }
    );
  }
}
