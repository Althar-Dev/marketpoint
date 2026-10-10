/**
 * Utility to format and clean DigiFlazz product names.
 * Strips game/brand prefix and redundant category words so users see clean nominals.
 * Example:
 * - "AFK Journey 21 Dragon Crystals" with brand "AFK Journey" -> "21 Dragon Crystals"
 * - "Free Fire 140 Diamond" with brand "FREE FIRE" -> "140 Diamond"
 * - "MOBILE LEGENDS 86 Diamond" with brand "MOBILE LEGENDS" -> "86 Diamond"
 * - "DANA 20.000" with brand "DANA" -> "20.000"
 */

export function formatProductName(name: string, brand?: string, category?: string): string {
  if (!name) return "";
  let cleaned = name.trim();

  // If brand is provided, try stripping brand variations
  if (brand) {
    const cleanBrand = brand.trim();

    // 1. Exact brand (case-insensitive), with optional separators like "-", ":", "–", "|"
    const escapedBrand = cleanBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp("^" + escapedBrand + "\\s*[-:–|/]?\\s*", "i"), "");

    // 2. Brand without non-alphanumeric (e.g. "by.U" -> "by u", "Honkai: Star Rail" -> "Honkai Star Rail")
    const brandAlpha = cleanBrand.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, "\\s+").trim();
    if (brandAlpha && brandAlpha !== escapedBrand) {
      cleaned = cleaned.replace(new RegExp("^" + brandAlpha + "\\s*[-:–|/]?\\s*", "i"), "");
    }

    // 3. Known aliases & abbreviations
    const brandAliases: Record<string, string[]> = {
      "arena of valor": ["aov", "arena of valor"],
      "mobile legends": ["mlbb", "ml", "mobile legend", "mobile legends bang bang"],
      "free fire": ["ff", "free fire max", "free fire"],
      "pubg mobile": ["pubgm", "pubg"],
      "genshin impact": ["gi", "genshin"],
      "call of duty mobile": ["codm", "cod mobile", "cod"],
      "au2 mobile": ["au2"],
      "crossfire": ["crossfire legends", "crossfire"],
      "ragnarok origin": ["roo", "ro origin", "ragnarok"],
      "honkai: star rail": ["hsr", "honkai star rail"],
      "honkai impact 3": ["hi3", "honkai impact", "honkai impact 3rd"],
      "league of legends: wild rift": ["wild rift", "wr", "lolwr", "lol wild rift"],
      "magic chess": ["magic chess go go", "mcgg"],
      "tri": ["three", "tri"],
      "indosat": ["isat", "im3", "indosat ooredoo"],
      "smartfren": ["smart"],
      "telkomsel": ["tsel", "telkomsel"],
    };

    const normalizedBrandKey = cleanBrand.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    for (const [key, aliases] of Object.entries(brandAliases)) {
      if (normalizedBrandKey.includes(key) || key.includes(normalizedBrandKey)) {
        for (const alias of aliases) {
          const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          cleaned = cleaned.replace(new RegExp("^" + escapedAlias + "\\s*[-:–|/]?\\s*", "i"), "");
        }
      }
    }

    // 4. If brand is "X Mobile" (e.g. "AU2 MOBILE"), try stripping "X"
    const words = cleanBrand.split(/\s+/);
    if (words.length === 2 && words[1].toUpperCase() === "MOBILE") {
      const firstWord = words[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleaned = cleaned.replace(new RegExp("^" + firstWord + "\\s*[-:–|/]?\\s*", "i"), "");
    }
  }

  // 5. Remove common category prefixes at start (e.g., "Pulsa Telkomsel 10.000", "Token PLN 20.000", "Voucher Indomaret 5.000")
  cleaned = cleaned.replace(/^(pulsa|paket data|data|token pln|token listrik|token|voucher)\s+[-:–|/]?\s*/i, "");

  // If brand is mentioned again after category prefix (e.g. "Pulsa Indosat 10.000" -> "Indosat 10.000" -> "10.000")
  if (brand) {
    const escapedBrand = brand.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp("^" + escapedBrand + "\\s*[-:–|/]?\\s*", "i"), "");
  }

  // Clean trailing / leading punctuation
  cleaned = cleaned.replace(/^[-:–|/]\s*/, "").trim();

  // If result is empty or too short, fallback to original name
  return cleaned || name;
}
