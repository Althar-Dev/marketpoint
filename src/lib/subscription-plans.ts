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
    maxProducts: 10,
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
    customFeatures: ["Hingga 10 produk", "Komisi 7.0%", "Fitur dasar toko"]
  },
  {
    id: "plus",
    name: "Plus",
    description: "Ideal untuk penjual berkembang yang ingin kuota lebih besar dan fitur promo.",
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    commissionRate: 5.0,
    maxProducts: 30,
    maxVouchers: 5,
    maxFlashSaleProducts: 3,
    features: {
      voucherToko: true,
      flashSale: true,
      badgeVerified: false,
      badgeOfficial: false,
      telegramBot: false,
      resellerApi: false,
      prioritySupport: false,
    },
    customFeatures: ["Hingga 30 produk", "Komisi 5.0%", "Hingga 5 voucher toko", "Hingga 3 produk flash sale"]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Paling populer untuk merchant profesional dengan bot otomatisasi Telegram.",
    monthlyPrice: 49000,
    yearlyPrice: 490000,
    commissionRate: 3.5,
    maxProducts: 60,
    maxVouchers: 20,
    maxFlashSaleProducts: 10,
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
    customFeatures: ["Hingga 60 produk", "Komisi 3.5%", "Hingga 20 voucher toko", "Hingga 10 produk flash sale", "Badge verified", "Bot Telegram"]
  },
  {
    id: "prime",
    name: "Prime",
    description: "Solusi tanpa batas untuk merchant skala besar, API reseller dan prioritas support.",
    monthlyPrice: 249000,
    yearlyPrice: 2490000,
    commissionRate: 2.0,
    maxProducts: -1,
    maxVouchers: -1,
    maxFlashSaleProducts: -1,
    features: {
      voucherToko: true,
      flashSale: true,
      badgeVerified: true,
      badgeOfficial: true,
      telegramBot: true,
      resellerApi: true,
      prioritySupport: true,
    },
    customFeatures: ["Unlimited produk", "Komisi 2.0%", "Unlimited voucher toko", "Unlimited flash sale", "Badge official", "Bot Telegram", "API reseller", "Prioritas support"]
  }
];
