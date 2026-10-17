"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Rocket,
  Crown,
  Loader2,
  Check,
  X,
  ChevronLeft,
  CreditCard,
  Wallet,
  ArrowRight,
  Landmark,
  QrCode,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMerchantShop } from "@/context/merchant-context";

export interface PlanFeatureItem {
  label: string;
  included: boolean;
}

interface PlanItem {
  id: "plus" | "pro" | "prime";
  name: string;
  badgeTag: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  commissionRate?: number;
  maxProducts?: number;
  maxVouchers?: number;
  maxFlashSaleProducts?: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
  features: string[];
  featureItems: PlanFeatureItem[];
}

function buildPlanFeatureItems(
  p: {
    id: string;
    commissionRate?: number;
    maxProducts?: number;
    maxVouchers?: number;
    maxFlashSaleProducts?: number;
    features?: any;
    customFeatures?: string[];
  },
  allPlans?: any[]
): PlanFeatureItem[] {
  const comm = p.commissionRate ?? (p.id === "prime" ? 2.0 : p.id === "pro" ? 3.5 : 5.0);
  const products = p.maxProducts ?? (p.id === "prime" ? -1 : p.id === "pro" ? 40 : 15);
  const vouchers = p.maxVouchers ?? (p.id === "prime" ? -1 : p.id === "pro" ? 5 : 2);
  const flash = p.maxFlashSaleProducts ?? (p.id === "prime" ? -1 : p.id === "pro" ? 3 : 1);
  const featConfig = p.features || {};
  const customFeats = Array.isArray(p.customFeatures) ? p.customFeatures : [];

  // Helper to extract custom string for core metrics if defined in admin
  const findCustom = (keyword: string) => {
    return customFeats.find((f) => f.toLowerCase().includes(keyword.toLowerCase()));
  };

  // 1. Core metric: Komisi
  const komisiLabel = findCustom("komisi") || `Komisi ${Number(comm).toFixed(1)}%`;

  // 2. Core metric: Batas Produk
  const produkLabel =
    findCustom("produk") ||
    (products === -1 ? "Unlimited produk" : `Max ${products} Produk`);

  // 3. Core metric: Voucher Toko
  const voucherLabel =
    findCustom("voucher") ||
    (vouchers === -1
      ? "Unlimited Voucher toko"
      : vouchers > 0
        ? `Max ${vouchers} Voucher toko`
        : "Voucher diskon toko");
  const voucherIncluded = vouchers !== 0 && (featConfig.voucherToko ?? true);

  // 4. Core metric: Flash Sale
  const flashLabel =
    findCustom("flash") ||
    (flash === -1
      ? "Unlimited Flash sale"
      : flash > 0
        ? `Max ${flash} Flash sale`
        : "Flash sale");
  const flashIncluded = flash !== 0 && (featConfig.flashSale ?? true);

  // 5. Core metric: Statistik
  const statistikLabel =
    findCustom("statistik") ||
    (p.id === "prime"
      ? "Statistik Semua Waktu & Ekspor Laporan (CSV, Excel, Word, PDF)"
      : p.id === "pro"
        ? "Statistik Riwayat 30 Hari & Tren"
        : "Statistik Dasar 7 Hari");

  const coreItems: PlanFeatureItem[] = [
    { label: komisiLabel, included: true },
    { label: produkLabel, included: true },
    { label: voucherLabel, included: voucherIncluded },
    { label: flashLabel, included: flashIncluded },
    { label: statistikLabel, included: true },
  ];

  // Standard add-ons configured across plans or in Admin
  const standardAddons = [
    {
      key: "badgeVerified",
      label: "Badge verified",
      check: (plan: any) =>
        Boolean(plan.features?.badgeVerified) ||
        (Array.isArray(plan.customFeatures) &&
          plan.customFeatures.some((f: string) =>
            f.toLowerCase().includes("verified")
          )),
    },
    {
      key: "telegramBot",
      label: "Bot Telegram",
      check: (plan: any) =>
        Boolean(plan.features?.telegramBot) ||
        (Array.isArray(plan.customFeatures) &&
          plan.customFeatures.some(
            (f: string) =>
              f.toLowerCase().includes("telegram") ||
              f.toLowerCase().includes("bot")
          )),
    },
    {
      key: "badgeOfficial",
      label: "Badge official",
      check: (plan: any) =>
        Boolean(plan.features?.badgeOfficial) ||
        (Array.isArray(plan.customFeatures) &&
          plan.customFeatures.some((f: string) =>
            f.toLowerCase().includes("official")
          )),
    },
    {
      key: "resellerApi",
      label: "API Reseller / Public Provider",
      check: (plan: any) =>
        Boolean(plan.features?.resellerApi) ||
        (Array.isArray(plan.customFeatures) &&
          plan.customFeatures.some(
            (f: string) =>
              f.toLowerCase().includes("api") ||
              f.toLowerCase().includes("reseller")
          )),
    },
    {
      key: "prioritySupport",
      label: "Prioritas support",
      check: (plan: any) =>
        Boolean(plan.features?.prioritySupport) ||
        (Array.isArray(plan.customFeatures) &&
          plan.customFeatures.some(
            (f: string) =>
              f.toLowerCase().includes("support") ||
              f.toLowerCase().includes("prioritas") ||
              f.toLowerCase().includes("vip")
          )),
    },
  ];

  // Collect any additional custom features from allPlans that aren't core metrics
  const extraAddons: { label: string; check: (plan: any) => boolean }[] = [];
  const knownAddonKeywords = [
    "verified",
    "telegram",
    "bot",
    "official",
    "api",
    "reseller",
    "support",
    "prioritas",
    "vip",
  ];

  if (Array.isArray(allPlans)) {
    for (const otherPlan of allPlans) {
      if (Array.isArray(otherPlan.customFeatures)) {
        for (const feat of otherPlan.customFeatures) {
          const trimmed = feat.trim();
          if (!trimmed) continue;
          const low = trimmed.toLowerCase();
          // Skip core features
          if (
            low.includes("komisi") ||
            low.includes("produk") ||
            low.includes("voucher") ||
            low.includes("flash") ||
            low.includes("statistik")
          ) {
            continue;
          }
          // Skip if already in standardAddons
          if (knownAddonKeywords.some((k) => low.includes(k))) {
            continue;
          }
          // If not already in extraAddons
          if (!extraAddons.some((e) => e.label.toLowerCase() === low)) {
            extraAddons.push({
              label: trimmed,
              check: (plan: any) =>
                Array.isArray(plan.customFeatures) &&
                plan.customFeatures.some(
                  (f: string) => f.trim().toLowerCase() === low
                ),
            });
          }
        }
      }
    }
  }

  const addonItems: PlanFeatureItem[] = [
    ...standardAddons.map((addon) => {
      // Find exact custom label if present in any plan's customFeatures (e.g. "API Reseller / Public Provider")
      let displayLabel = addon.label;
      if (Array.isArray(allPlans)) {
        for (const plan of allPlans) {
          const match = (plan.customFeatures || []).find((f: string) => {
            const low = f.toLowerCase();
            if (addon.key === "badgeVerified") return low.includes("verified");
            if (addon.key === "telegramBot") return low.includes("telegram") || low.includes("bot");
            if (addon.key === "badgeOfficial") return low.includes("official");
            if (addon.key === "resellerApi") return low.includes("reseller") || low.includes("api");
            if (addon.key === "prioritySupport") return low.includes("support") || low.includes("prioritas");
            return false;
          });
          if (match) {
            displayLabel = match;
            break;
          }
        }
      }
      return {
        label: displayLabel,
        included: addon.check(p),
      };
    }),
    ...extraAddons.map((extra) => ({
      label: extra.label,
      included: extra.check(p),
    })),
  ];

  return [...coreItems, ...addonItems];
}

function getPlans(commissions: Record<string, number>): PlanItem[] {
  const rawPlans = [
    {
      id: "plus",
      name: "Plus",
      badgeTag: "Starter Pro",
      description: "Ideal untuk penjual berkembang yang ingin kuota lebih besar dan fitur promo.",
      monthlyPrice: 29000,
      yearlyPrice: 290000,
      commissionRate: commissions.plus ?? 5.0,
      maxProducts: 15,
      maxVouchers: 2,
      maxFlashSaleProducts: 1,
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: {
        voucherToko: true,
        flashSale: true,
        badgeVerified: false,
        badgeOfficial: false,
        telegramBot: false,
        resellerApi: false,
        prioritySupport: false,
      },
      customFeatures: [
        `Komisi ${commissions.plus ?? 5.0}%`,
        "Max 15 Produk",
        "Max 2 Voucher toko",
        "Max 1 Flash sale",
        "Statistik dasar & Produk terlaris",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      badgeTag: "Paling Populer",
      description: "Paling populer untuk merchant profesional dengan bot otomatisasi Telegram.",
      monthlyPrice: 49000,
      yearlyPrice: 490000,
      commissionRate: commissions.pro ?? 3.5,
      maxProducts: 40,
      maxVouchers: 5,
      maxFlashSaleProducts: 3,
      icon: Rocket,
      color: "text-[#00AA5B]",
      bgColor: "bg-emerald-50",
      borderColor: "border-[#00AA5B]",
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
      customFeatures: [
        `Komisi ${commissions.pro ?? 3.5}%`,
        "Max 40 Produk",
        "Max 5 Voucher toko",
        "Max 3 Flash sale",
        "Badge verified",
        "Bot Telegram",
        "Statistik riwayat 30 hari & tren",
      ],
    },
    {
      id: "prime",
      name: "Prime",
      badgeTag: "Ultimate Enterprise",
      description: "Solusi tanpa batas untuk merchant skala besar, API reseller dan prioritas support.",
      monthlyPrice: 249000,
      yearlyPrice: 2490000,
      commissionRate: commissions.prime ?? 2.0,
      maxProducts: -1,
      maxVouchers: 15,
      maxFlashSaleProducts: 10,
      icon: Crown,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
      features: {
        voucherToko: true,
        flashSale: true,
        badgeVerified: true,
        badgeOfficial: true,
        telegramBot: true,
        resellerApi: true,
        prioritySupport: true,
      },
      customFeatures: [
        `Komisi ${commissions.prime ?? 2.0}%`,
        "Unlimited produk",
        "Max 15 Voucher toko",
        "Max 10 Flash sale",
        "Badge official",
        "Bot Telegram",
        "Statistik Lengkap & Ekspor Laporan",
        "API Reseller / Public Provider",
        "Prioritas support",
      ],
    },
  ];

  return rawPlans.map((p) => ({
    id: p.id as "plus" | "pro" | "prime",
    name: p.name,
    badgeTag: p.badgeTag,
    description: p.description,
    monthlyPrice: p.monthlyPrice,
    yearlyPrice: p.yearlyPrice,
    commissionRate: p.commissionRate,
    maxProducts: p.maxProducts,
    maxVouchers: p.maxVouchers,
    maxFlashSaleProducts: p.maxFlashSaleProducts,
    icon: p.icon,
    color: p.color,
    bgColor: p.bgColor,
    borderColor: p.borderColor,
    popular: p.popular,
    features: p.customFeatures,
    featureItems: buildPlanFeatureItems(p, rawPlans),
  }));
}

const PAYMENT_CATEGORIES = [
  {
    id: "bank_transfer",
    label: "BANK TRANSFER",
    icon: Landmark,
    logos: ["bsi", "bca", "bni", "bri", "mandiri", "permata", "bjb", "cimb", "bss"],
    previewCount: 3
  },
  {
    id: "retail_outlet",
    label: "RETAIL OUTLET",
    icon: Store,
    logos: ["alfamart", "indomaret"],
    previewCount: 2
  },
  {
    id: "e_wallet",
    label: "E-WALLET",
    icon: Wallet,
    logos: ["gopay", "ovo", "linkaja"],
    previewCount: 2
  },
  {
    id: "qr_payments",
    label: "QR PAYMENTS",
    icon: QrCode,
    logos: ["qris"],
    previewCount: 1
  }
];

export default function MerchantSubscriptionPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, activePlanId, isFullAdminUnlock, switchShopPlan, shopId: contextShopId } = useMerchantShop();

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"plans" | "checkout">("plans");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const [commissions, setCommissions] = useState<Record<string, number>>({
    free: 7.0,
    plus: 5.0,
    pro: 3.5,
    prime: 2.0,
  });
  const [dbSubscription, setDbSubscription] = useState<any>(null);
  const [dbPlans, setDbPlans] = useState<any[] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const url = user?.uid ? `/api/subscription?shopId=${encodeURIComponent(user.uid)}` : "/api/subscription";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          if (data.commissions) setCommissions(data.commissions);
          if (data.subscription) setDbSubscription(data.subscription);
          if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
            setDbPlans(data.plans);
          }
        }
      })
      .catch((err) => console.warn("Gagal memuat info langganan & komisi:", err));
  }, [user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  const activeSubscription = dbSubscription || shop?.subscription || {
    planId: "free",
    planName: "Free",
    billingCycle: "monthly",
    maxProducts: 10,
    commissionRate: commissions.free ?? 7.0,
    status: "ACTIVE"
  };

  const iconMap: Record<string, any> = {
    plus: Zap,
    pro: Rocket,
    prime: Crown,
  };

  const plans: PlanItem[] = useMemo(() => {
    const defaultList = getPlans(commissions);
    if (dbPlans && dbPlans.length > 0) {
      return dbPlans
        .filter((p) => p.id !== "free")
        .map((p) => {
          const fallback = defaultList.find((d) => d.id === p.id);
          const featureItems = buildPlanFeatureItems(p, dbPlans);
          return {
            id: p.id as "plus" | "pro" | "prime",
            name: p.name || fallback?.name || p.id,
            badgeTag: fallback?.badgeTag || (p.popular ? "Paling Populer" : "Paket Pilihan"),
            description: p.description || fallback?.description || "",
            monthlyPrice: p.monthlyPrice ?? fallback?.monthlyPrice ?? 0,
            yearlyPrice: p.yearlyPrice ?? fallback?.yearlyPrice ?? 0,
            commissionRate: p.commissionRate ?? commissions[p.id] ?? fallback?.commissionRate ?? 5,
            maxProducts: p.maxProducts !== undefined ? p.maxProducts : (fallback?.maxProducts ?? 30),
            maxVouchers: p.maxVouchers !== undefined ? p.maxVouchers : (fallback?.maxVouchers ?? 5),
            maxFlashSaleProducts: p.maxFlashSaleProducts !== undefined ? p.maxFlashSaleProducts : (fallback?.maxFlashSaleProducts ?? 3),
            popular: p.popular ?? fallback?.popular,
            icon: iconMap[p.id] || fallback?.icon || Zap,
            color: p.id === "pro" ? "text-[#00AA5B]" : p.id === "prime" ? "text-amber-600" : "text-blue-600",
            bgColor: p.id === "pro" ? "bg-emerald-500/10" : p.id === "prime" ? "bg-amber-500/10" : "bg-blue-500/10",
            borderColor: p.id === "pro" ? "border-[#00AA5B]" : p.id === "prime" ? "border-amber-300" : "border-slate-200",
            features:
              p.customFeatures && p.customFeatures.length > 0
                ? p.customFeatures
                : fallback?.features || [],
            featureItems,
          };
        });
    }
    return defaultList;
  }, [dbPlans, commissions]);

  const handleSelectPlan = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setView("checkout");
  };

  const handleConfirmSubscription = async () => {
    if (!user || !selectedPlan) return;

    if (!selectedMethod) {
      toast({ variant: "destructive", title: "Pilih Pembayaran", description: "Silakan pilih salah satu metode pembayaran terlebih dahulu." });
      return;
    }

    setIsSubmitting(true);
    try {
      const targetShopId = contextShopId || user.uid;
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: targetShopId,
          planId: selectedPlan.id,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses paket berlangganan.");
      }

      if (data.subscription) {
        await switchShopPlan(selectedPlan.id);
        setDbSubscription(data.subscription);
        if (db && user) {
          const targetShopId = contextShopId || user.uid;
          const isVerified = selectedPlan.id === "pro" || selectedPlan.id === "prime";
          const isOfficial = selectedPlan.id === "prime";

          updateDoc(doc(db, "shops", targetShopId), {
            verified: isVerified,
            isVerified: isVerified,
            official: isOfficial,
            isOfficial: isOfficial,
            subscription: {
              planId: data.subscription.planId,
              planName: data.subscription.planName,
              billingCycle: data.subscription.billingCycle,
              maxProducts: data.subscription.maxProducts,
              commissionRate: data.subscription.commissionRate,
              status: "ACTIVE",
              expiresAt: data.subscription.expiresAt,
            }
          }).catch((err) => console.warn("Failed to sync badges to Firestore:", err));
        }
      }

      toast({
        title: "Berlangganan berhasil",
        description: `Toko Anda kini aktif pada paket ${selectedPlan.name} (${billingCycle === "yearly" ? "tahunan" : "bulanan"}).`,
      });

      setView("plans");
      setSelectedPlan(null);
      setSelectedMethod(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal berlangganan",
        description: err.message || "Terjadi kesalahan saat memproses.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-3 md:p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <Skeleton className="h-6 w-36 rounded-lg mx-auto" />
          <Skeleton className="h-4 w-56 rounded-md mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (view === "checkout" && selectedPlan) {
    const priceDisplay = billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

    return (
      <main className="p-3 md:p-6 lg:p-8 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-4xl mx-auto space-y-5 md:space-y-6">
          <button
            onClick={() => setView("plans")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-[#00AA5B] transition-colors text-[10px] md:text-[11px] font-bold group"
          >
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Kembali pilih paket
          </button>

          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121]">Checkout Berlangganan</h2>
            <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Selesaikan pembayaran untuk mengaktifkan fitur toko Anda.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/30">
                  <CardTitle className="text-[11px] md:text-[12px] font-bold">Pilih Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Saldo MarketPointID (Internal) */}
                    <AccordionItem value="wallet" className="border-b border-border/40 px-4 md:px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-[#8B5CF6]" />
                          <span className="text-[10px] font-black tracking-wider text-[#2E3137]">SALDO MARKETPOINT</span>
                        </div>
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-[9px] font-bold text-muted-foreground">Rp 0</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-5">
                        <div className="p-4 rounded-xl border border-dashed border-border bg-slate-50/50 text-center">
                          <p className="text-[10px] text-muted-foreground font-medium">Saldo Anda tidak mencukupi untuk melakukan transaksi ini.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Payment Categories from Design */}
                    {PAYMENT_CATEGORIES.map((cat) => (
                      <AccordionItem key={cat.id} value={cat.id} className="border-b border-border/40 px-4 md:px-6 last:border-0">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3">
                            <cat.icon className="w-4 h-4 text-[#8B5CF6]" />
                            <span className="text-[10px] font-black tracking-wider text-[#2E3137]">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-2.5 mr-2 ml-auto overflow-hidden">
                            {cat.logos.slice(0, cat.previewCount).map((logo) => (
                              <img key={logo} src={`/assets/payments/${logo}.png`} alt={logo} className="h-4 w-auto object-contain opacity-80" />
                            ))}
                            {cat.logos.length > cat.previewCount && (
                              <span className="text-[9px] font-bold text-muted-foreground">+{cat.logos.length - cat.previewCount}</span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {cat.logos.map((logo) => (
                              <button
                                key={logo}
                                onClick={() => setSelectedMethod(logo)}
                                className={cn(
                                  "p-3 border rounded-xl flex items-center justify-center transition-all hover:bg-slate-50 group relative",
                                  selectedMethod === logo ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-2 ring-[#00AA5B]/10" : "border-border/60"
                                )}
                              >
                                <img src={`/assets/payments/${logo}.png`} alt={logo} className="h-7 sm:h-8 w-auto object-contain" />
                                {selectedMethod === logo && (
                                  <div className="absolute -top-1 -right-1 bg-[#00AA5B] text-white rounded-full p-0.5">
                                    <Check className="w-2 h-2 stroke-[4]" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
                <CardFooter className="p-4 md:p-5 border-t border-border/40 bg-slate-50/20">
                  <Button
                    onClick={handleConfirmSubscription}
                    disabled={isSubmitting || !selectedMethod}
                    className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10 transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Bayar dan Aktifkan Sekarang
                  </Button>
                </CardFooter>
              </Card>

              <div className="p-4 rounded-xl md:rounded-2xl bg-[#FFC400]/5 border border-[#FFC400]/20 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#FFC400] shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Paket akan langsung aktif setelah konfirmasi pembayaran berhasil dilakukan secara otomatis oleh sistem kami.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/30">
                  <CardTitle className="text-[11px] md:text-[12px] font-bold">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-5 space-y-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0 border border-green-100">
                      <selectedPlan.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#212121]">Paket {selectedPlan.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Aktif untuk {billingCycle === "yearly" ? "1 tahun" : "1 bulan"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[#00AA5B]">Rp {priceDisplay.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-5 border-t border-border/40">
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                      <span>Harga paket</span>
                      <span className="text-[#212121] font-bold">Rp {priceDisplay.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                      <span>Pajak layanan</span>
                      <span className="text-[#212121] font-bold">Rp 0</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/40">
                      <span className="text-[11px] font-bold text-[#212121]">Total pembayaran</span>
                      <span className="text-base font-black text-[#00AA5B]">Rp {priceDisplay.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Administrator Access Banner */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950 flex items-center gap-2">
                  Hak Akses Administrator Toko
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black uppercase shadow-2xs">
                    {activePlanId === "admin" ? "Admin Full Unlock" : `Paket: ${activePlanId.toUpperCase()}`}
                  </span>
                </p>
                <p className="text-[11px] text-amber-900/80 font-medium mt-0.5">
                  {activePlanId === "admin"
                    ? "Akun Anda memiliki hak Administrator (Full Unlock) ke seluruh fitur dan kuota toko langsung di database. Anda juga dapat memilih salah satu paket di bawah untuk langsung mengubah data paket toko secara nyata."
                    : `Paket aktif saat ini adalah ${activePlanId.toUpperCase()}. Kuota dan akses fitur toko berjalan sesuai paket ini.`}
                </p>
              </div>
            </div>
            {activePlanId !== "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await switchShopPlan("admin");
                  toast({
                    title: "Paket Diperbarui",
                    description: "Paket toko berhasil dikembalikan ke Admin Full Unlock di database.",
                  });
                }}
                className="shrink-0 h-8 text-xs font-bold border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 rounded-xl cursor-pointer"
              >
                Reset ke Admin Full Unlock
              </Button>
            )}
          </div>
        )}

        {/* Hero Header & Period Toggle */}
        <div className="text-center space-y-2.5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-[#00AA5B] font-semibold text-[10px] md:text-[11px] px-3 py-0.5 rounded-full shadow-2xs">
            <Crown className="w-3 h-3 text-[#00AA5B]" />
            Paket Berlangganan & Fitur Toko
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#212121]">
            Pilih Paket Fitur Toko Anda
          </h2>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Tingkatkan kuota produk, voucher diskon toko, flash sale, hingga otomatisasi bot Telegram dan API reseller.
          </p>

          <div className="flex items-center justify-center pt-1.5">
            <div className="bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  billingCycle === "monthly"
                    ? "bg-[#00AA5B] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  billingCycle === "yearly"
                    ? "bg-[#00AA5B] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Tahunan</span>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.2 rounded-md",
                  billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                )}>
                  HEMAT 2 BULAN
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Paket Toko Saat Ini */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 md:p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Paket Aktif: {activePlanId === "admin" ? "Admin Full Unlock" : `Paket ${(activeSubscription.planName || activePlanId).toUpperCase()}`}
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.2 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Aktif di Database
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Tarif komisi platform: <span className="font-bold text-[#00AA5B]">{activePlanId === "admin" ? "0%" : `${activeSubscription.commissionRate ?? (commissions[activePlanId] ?? 7)}%`}</span> • Batas produk: <span className="font-semibold text-slate-800">{activePlanId === "admin" || activeSubscription.maxProducts === -1 ? "Unlimited" : `${activeSubscription.maxProducts} produk`}</span>
              </p>
            </div>
          </div>
          {activePlanId === "free" && (
            <div className="text-[11px] text-muted-foreground bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md font-medium shrink-0">
              Tingkatkan paket untuk fitur promo & otomatisasi
            </div>
          )}
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch pt-2">
          {plans.map((plan) => {
            const isActive = activePlanId === plan.id;
            const priceDisplay = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const perMonthEquivalent = billingCycle === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
            const monthlyCostTotal = plan.monthlyPrice * 12;
            const savingsAmount = billingCycle === "yearly" ? monthlyCostTotal - plan.yearlyPrice : 0;
            const PlanIcon = plan.icon;
            const isPro = plan.id === "pro";
            const isPrime = plan.id === "prime";
            const isPlus = plan.id === "plus";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl transition-all duration-200 bg-white group",
                  isPro
                    ? "border-2 border-[#00AA5B] shadow-sm md:-translate-y-1.5 ring-2 ring-[#00AA5B]/10 z-10"
                    : isPrime
                      ? "border border-amber-200/80 hover:border-amber-300 shadow-2xs hover:shadow-sm"
                      : "border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-sm"
                )}
              >
                {/* Floating Top Badge */}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="inline-flex items-center gap-1 bg-[#00AA5B] text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs ring-2 ring-white">
                      <Rocket className="w-2.5 h-2.5 text-emerald-200" />
                      Paling Populer
                    </div>
                  </div>
                )}
                {isPrime && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="inline-flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs ring-2 ring-white">
                      <Crown className="w-2.5 h-2.5 text-amber-200" />
                      Ultimate Power
                    </div>
                  </div>
                )}
                {isPlus && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      <Zap className="w-2.5 h-2.5 text-blue-500" />
                      Starter Pro
                    </div>
                  </div>
                )}

                {/* Card Main Body */}
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  {/* Header Title + Icon */}
                  <div className="flex items-start justify-between gap-2.5 pt-0.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                          {plan.name}
                        </h3>
                        {isActive && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold px-1.5 py-0 h-4">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mt-1 min-h-[32px]">
                        {plan.description}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                        isPro && "bg-emerald-50 text-[#00AA5B] border border-emerald-200/60",
                        isPrime && "bg-amber-50 text-amber-600 border border-amber-200/60",
                        isPlus && "bg-blue-50 text-blue-600 border border-blue-200/60"
                      )}
                    >
                      <PlanIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="py-3.5 my-3.5 border-y border-slate-100 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Rp</span>
                      <span className="text-2xl font-bold text-slate-900 tracking-tight">
                        {priceDisplay.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        /{billingCycle === "yearly" ? "tahun" : "bulan"}
                      </span>
                    </div>

                    {billingCycle === "yearly" ? (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded">
                          Setara Rp {perMonthEquivalent.toLocaleString("id-ID")}/bln
                        </span>
                        {savingsAmount > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            • Hemat Rp {savingsAmount.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Ditagih bulanan, dapat dibatalkan kapan saja.
                      </p>
                    )}
                  </div>

                  {/* Features List with Check and Cross Icons */}
                  <div className="space-y-3 flex-1 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Daftar Fitur Paket {plan.name}:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.featureItems.map((item, idx) => (
                        <li
                          key={idx}
                          className={cn(
                            "flex items-center gap-2.5 text-xs transition-colors",
                            item.included
                              ? "text-slate-700 font-medium"
                              : "text-slate-400 font-normal"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                              item.included
                                ? "bg-emerald-50 text-[#00AA5B] border border-emerald-200/60"
                                : "bg-slate-100 text-slate-400 border border-slate-200/60"
                            )}
                          >
                            {item.included ? (
                              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                            ) : (
                              <X className="w-2.5 h-2.5 stroke-[2.5]" />
                            )}
                          </div>
                          <span className={cn(!item.included && "text-slate-400/90")}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 md:p-6 pt-0 mt-auto">
                  {isAdmin ? (
                    <Button
                      onClick={async () => {
                        await switchShopPlan(plan.id);
                        toast({
                          title: `Paket ${plan.name} Diaktifkan`,
                          description: `Paket toko di database berhasil diubah ke ${plan.name}.`,
                        });
                      }}
                      disabled={isActive}
                      className={cn(
                        "w-full h-9 rounded-lg font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer",
                        isActive
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-100 shadow-none"
                          : isPro
                            ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs"
                            : isPrime
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                      )}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Paket Aktif</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Aktifkan Paket {plan.name}</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isActive}
                      className={cn(
                        "w-full h-9 rounded-lg font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer",
                        isActive
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-100 shadow-none"
                          : isPro
                            ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs"
                            : isPrime
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                      )}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Paket Aktif</span>
                        </>
                      ) : (
                        <>
                          <span>Pilih Paket {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <Card className="border border-border/50 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[11px] md:text-[12px] font-medium text-[#212121]">Aman dan transparan</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5">
                    Tidak ada biaya tambahan tersembunyi. Akses fitur langsung aktif begitu proses konfirmasi selesai.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="rounded-lg text-[10px] font-medium h-8 px-3 border-border/50 bg-white">
                  Butuh bantuan?
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
