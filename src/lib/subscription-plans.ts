export interface PlanFeaturesConfig {
  voucherToko: boolean;
  flashSale: boolean;
  badgeVerified: boolean;
  badgeOfficial: boolean;
  telegramBot: boolean;
  resellerApi: boolean;
  prioritySupport: boolean;
}

export interface PlanConfigItem {
  id: "free" | "plus" | "pro" | "prime";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  commissionRate: number;
  maxProducts: number; // -1 = Unlimited
  maxVouchers: number; // -1 = Unlimited, 0 = Nonaktif
  maxFlashSaleProducts: number; // -1 = Unlimited, 0 = Nonaktif
  popular?: boolean;
  features: PlanFeaturesConfig;
  customFeatures: string[];
}

export const DEFAULT_PLANS_CONFIG: PlanConfigItem[] = [
  {
    id: "free",
    name: "Free",
    description: "Untuk toko baru yang baru mulai menjual produk digital.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    commissionRate: 7.0,
    maxProducts: 5,
    maxVouchers: 0,
    maxFlashSaleProducts: 0,
    features: {
      voucherToko: false,
      flashSale: false,
      badgeVerified: false,
      badgeOfficial: false,
      telegramBot: false,
      resellerApi: false,
      prioritySupport: false,
    },
    customFeatures: ["Komisi 7.0%", "Max 5 Produk", "Statistik dasar toko"]
  },
  {
    id: "plus",
    name: "Plus",
    description: "Ideal untuk penjual berkembang yang ingin kuota lebih besar dan fitur promo.",
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    commissionRate: 5.0,
    maxProducts: 15,
    maxVouchers: 2,
    maxFlashSaleProducts: 1,
    features: {
      voucherToko: true,
      flashSale: true,
      badgeVerified: false,
      badgeOfficial: false,
      telegramBot: false,
      resellerApi: false,
      prioritySupport: false,
    },
    customFeatures: ["Komisi 5.0%", "Max 15 Produk", "Max 2 Voucher toko", "Max 1 Flash sale", "Statistik dasar & Produk terlaris"]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Paling populer untuk merchant profesional dengan bot otomatisasi Telegram.",
    monthlyPrice: 49000,
    yearlyPrice: 490000,
    commissionRate: 3.5,
    maxProducts: 40,
    maxVouchers: 5,
    maxFlashSaleProducts: 3,
    popular: true,
    features: {
      voucherToko: true,
      flashSale: true,
      badgeVerified: true,
      badgeOfficial: false,
      telegramBot: true,
      resellerApi: false,
      prioritySupport: false,
    },
    customFeatures: ["Komisi 3.5%", "Max 40 Produk", "Max 5 Voucher toko", "Max 3 Flash sale", "Badge verified", "Bot Telegram", "Statistik riwayat 30 hari & Tren"]
  },
  {
    id: "prime",
    name: "Prime",
    description: "Solusi tanpa batas untuk merchant skala besar, API reseller dan prioritas support.",
    monthlyPrice: 249000,
    yearlyPrice: 2490000,
    commissionRate: 2.0,
    maxProducts: -1,
    maxVouchers: 15,
    maxFlashSaleProducts: 10,
    features: {
      voucherToko: true,
      flashSale: true,
      badgeVerified: true,
      badgeOfficial: true,
      telegramBot: true,
      resellerApi: true,
      prioritySupport: true,
    },
    customFeatures: ["Komisi 2.0%", "Unlimited produk", "Max 15 Voucher toko", "Max 10 Flash sale", "Badge official", "Bot Telegram", "Statistik lengkap semua waktu & Ekspor laporan", "API Reseller / Public Provider", "Prioritas support"]
  }
];

/**
 * Mengambil daftar konfigurasi paket langganan secara dinamis dari database (platform_settings).
 * - Sisi Server (Node / Next.js Server Components / API Route): langsung membaca dari PostgreSQL platform_settings.
 * - Sisi Klien (Browser / Client Components): mengambil via endpoint /api/subscription.
 * Database selalu menjadi sumber kebenaran (source of truth) utama, bukan data statis.
 */
export async function getSubscriptionPlans(): Promise<PlanConfigItem[]> {
  if (typeof window === "undefined") {
    try {
      const { getPlatformSettings } = await import("@/lib/database/settings");
      const settings = await getPlatformSettings();
      if (settings?.plans && Array.isArray(settings.plans) && settings.plans.length > 0) {
        return settings.plans;
      }
    } catch (e) {
      console.warn("[SUBSCRIPTION PLANS] Gagal query platform_settings:", e);
    }
  } else {
    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();
      if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
        return data.plans;
      }
    } catch (e) {
      console.warn("[SUBSCRIPTION PLANS] Gagal fetch /api/subscription:", e);
    }
  }
  return DEFAULT_PLANS_CONFIG;
}

/**
 * Mengambil satu paket langganan spesifik berdasarkan id ("free" | "plus" | "pro" | "prime") dari database.
 */
export async function getPlanConfig(planId: string): Promise<PlanConfigItem | undefined> {
  const plans = await getSubscriptionPlans();
  return plans.find((p) => p.id === planId);
}

