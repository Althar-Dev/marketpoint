export interface MarkupRule {
  type: "fixed" | "percent";
  value: number;
  product_name?: string;
  category?: string;
  brand?: string;
}

export interface DigiFlazzMarkupConfig {
  global: MarkupRule;
  categories: Record<string, MarkupRule>;
  brands: Record<string, MarkupRule>;
  products: Record<string, MarkupRule>;
  rounding?: "none" | "up_100" | "up_500" | "up_1000";
}

export const DEFAULT_MARKUP_CONFIG: DigiFlazzMarkupConfig = {
  global: { type: "percent", value: 3 },
  categories: {},
  brands: {},
  products: {},
  rounding: "up_100",
};

export function calculateMarkupPrice(
  basePrice: number,
  category?: string | null,
  brand?: string | null,
  config?: DigiFlazzMarkupConfig | null,
  skuOrProductName?: string | null
): {
  basePrice: number;
  markupAmount: number;
  finalPrice: number;
  ruleApplied: string;
} {
  const cfg = config || DEFAULT_MARKUP_CONFIG;
  if (!basePrice || basePrice <= 0) {
    return { basePrice: 0, markupAmount: 0, finalPrice: 0, ruleApplied: "None" };
  }

  let activeRule: MarkupRule = cfg.global || { type: "percent", value: 3 };
  let ruleApplied = `Global (${activeRule.type === "percent" ? `${activeRule.value}%` : `+Rp ${activeRule.value.toLocaleString("id-ID")}`})`;

  // 1. Check Product / SKU rule (Highest Priority)
  if (skuOrProductName && cfg.products) {
    const searchTarget = skuOrProductName.trim().toLowerCase();
    for (const [k, v] of Object.entries(cfg.products)) {
      const keyLower = k.trim().toLowerCase();
      const nameLower = (v.product_name || "").trim().toLowerCase();
      if ((keyLower === searchTarget || nameLower === searchTarget) && v && v.value > 0) {
        activeRule = v;
        const displayName = v.product_name ? `${v.product_name} (${k})` : k;
        ruleApplied = `Produk: ${displayName} (${v.type === "percent" ? `${v.value}%` : `+Rp ${v.value.toLocaleString("id-ID")}`})`;
        break;
      }
    }
  }

  // 2. Check Brand (2nd Priority - only if product rule wasn't applied)
  if (ruleApplied.startsWith("Global") && brand && cfg.brands) {
    const brandLower = brand.trim().toLowerCase();
    for (const [k, v] of Object.entries(cfg.brands)) {
      if (k.trim().toLowerCase() === brandLower && v && v.value > 0) {
        activeRule = v;
        ruleApplied = `Brand: ${k} (${v.type === "percent" ? `${v.value}%` : `+Rp ${v.value.toLocaleString("id-ID")}`})`;
        break;
      }
    }
  }

  // 3. Check Category (3rd Priority - only if product & brand rules weren't applied)
  if (ruleApplied.startsWith("Global") && category && cfg.categories) {
    const catLower = category.trim().toLowerCase();
    for (const [k, v] of Object.entries(cfg.categories)) {
      if (k.trim().toLowerCase() === catLower && v && v.value > 0) {
        activeRule = v;
        ruleApplied = `Kategori: ${k} (${v.type === "percent" ? `${v.value}%` : `+Rp ${v.value.toLocaleString("id-ID")}`})`;
        break;
      }
    }
  }

  // Calculate markup amount
  let markupAmount = 0;
  if (activeRule.type === "percent") {
    markupAmount = Math.round((basePrice * activeRule.value) / 100);
  } else {
    markupAmount = Math.round(activeRule.value);
  }

  let finalPrice = basePrice + markupAmount;

  // Apply rounding
  if (cfg.rounding === "up_100") {
    finalPrice = Math.ceil(finalPrice / 100) * 100;
  } else if (cfg.rounding === "up_500") {
    finalPrice = Math.ceil(finalPrice / 500) * 500;
  } else if (cfg.rounding === "up_1000") {
    finalPrice = Math.ceil(finalPrice / 1000) * 1000;
  }

  // Recalculate exact margin after rounding
  markupAmount = finalPrice - basePrice;

  return {
    basePrice,
    markupAmount,
    finalPrice,
    ruleApplied,
  };
}
