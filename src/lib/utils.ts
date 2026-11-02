import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format numbers with compact Indonesian suffixes:
 * >= 1.000.000.000 -> "1.5 M"
 * >= 1.000.000 -> "1.5jt"
 * >= 10.000 -> "10rb", "100rb"
 * < 10.000 -> formatted with dot separators (e.g. "9.500")
 */
export function formatCompactNumber(num: number | string | undefined | null): string {
  const val = Number(num);
  if (!val || isNaN(val)) return "0";
  const abs = Math.abs(val);

  if (abs >= 1_000_000_000) {
    const formatted = (val / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${formatted} M`;
  }
  if (abs >= 1_000_000) {
    const formatted = (val / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${formatted}jt`;
  }
  if (abs >= 10_000) {
    const formatted = (val / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${formatted}rb`;
  }
  return val.toLocaleString("id-ID");
}

/**
 * Clean redundant bank/channel names or double-parentheses in product titles
 * e.g. "Top Up Saldo Akun (Bank Central Asia (BCA))" -> "Top Up Saldo"
 */
export function cleanProductTitle(title?: string | null): string {
  if (!title) return "Produk Digital";
  const trimmed = title.trim();
  if (trimmed.toLowerCase().includes("top up saldo")) {
    return "Top Up Saldo";
  }
  return trimmed
    .replace(/\s*\(Bank Central Asia(\s*\(BCA\))?\)/gi, "")
    .replace(/\s*\(BCA\)/gi, "")
    .replace(/\s*\(Bank Mandiri\)/gi, "")
    .replace(/\s*\(Bank Rakyat Indonesia(\s*\(BRI\))?\)/gi, "")
    .replace(/\s*\(QRIS\)/gi, "")
    .replace(/\(\s*\)/g, "")
    .trim();
}

/**
 * Clean payment method display name (e.g. "Bank Central Asia (BCA)" -> "BCA")
 */
export function cleanPaymentMethodName(name?: string | null): string {
  if (!name) return "QRIS";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes("bca")) return "BCA";
  if (lower.includes("mandiri")) return "Mandiri";
  if (lower.includes("bri")) return "BRI";
  if (lower.includes("bni")) return "BNI";
  if (lower.includes("bsi")) return "BSI";
  if (lower.includes("seabank")) return "SeaBank";
  if (lower.includes("cimb")) return "CIMB Niaga";
  if (lower.includes("permata")) return "Permata";
  if (lower.includes("dana")) return "DANA";
  if (lower.includes("gopay")) return "GoPay";
  if (lower.includes("ovo")) return "OVO";
  if (lower.includes("shopeepay")) return "ShopeePay";
  if (lower.includes("qris")) return "QRIS";
  return trimmed.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Resolves official payment logo URL from /assets/bank/
 */
export function getPaymentLogo(paymentMethod?: string | null): string {
  if (!paymentMethod) return "/assets/bank/hd/qris.png";
  const lower = paymentMethod.toLowerCase();
  if (lower.includes("bca")) return "/assets/bank/hd/bca.png";
  if (lower.includes("mandiri")) return "/assets/bank/hd/mandiri.png";
  if (lower.includes("bri")) return "/assets/bank/hd/bri.png";
  if (lower.includes("bni")) return "/assets/bank/hd/bni.png";
  if (lower.includes("bsi")) return "/assets/bank/hd/bsi.png";
  if (lower.includes("bss")) return "/assets/bank/hd/bss.png";
  if (lower.includes("permata")) return "/assets/bank/hd/permata.png";
  if (lower.includes("cimb")) return "/assets/bank/hd/cimb.png";
  if (lower.includes("seabank")) return "/assets/bank/hd/seabank.png";
  if (lower.includes("bjb")) return "/assets/bank/hd/bjb.png";
  if (lower.includes("dana")) return "/assets/bank/hd/dana.png";
  if (lower.includes("gopay")) return "/assets/bank/hd/gopay.png";
  if (lower.includes("ovo")) return "/assets/bank/hd/ovo.png";
  if (lower.includes("linkaja")) return "/assets/bank/hd/linkaja.png";
  if (lower.includes("alfamart")) return "/assets/bank/hd/alfamart.png";
  if (lower.includes("indomaret")) return "/assets/bank/hd/indomaret.png";
  if (lower.includes("akulaku")) return "/assets/bank/hd/akulaku.png";
  return "/assets/bank/hd/qris.png";
}
