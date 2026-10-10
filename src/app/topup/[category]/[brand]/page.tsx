"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Zap,
  ShieldCheck,
  MessageCircle,
  Check,
  Wallet,
  CreditCard,
  QrCode,
  AlertCircle,
  Info,
  ShoppingBag,
  ArrowRight,
  User,
  HelpCircle,
  Building2,
  Gamepad2,
  Layers,
  ChevronUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatProductName } from "@/lib/format-product";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// Payment methods presets
const PAYMENT_METHODS = [
  { id: "qris", name: "QRIS All Payment", type: "Instant", icon: QrCode, badge: "Bebas Biaya" },
  { id: "dana", name: "DANA", type: "E-Wallet", icon: Wallet, badge: "Otomatis" },
  { id: "gopay", name: "GoPay", type: "E-Wallet", icon: Wallet, badge: "Otomatis" },
  { id: "ovo", name: "OVO", type: "E-Wallet", icon: Wallet, badge: "Otomatis" },
  { id: "shopeepay", name: "ShopeePay", type: "E-Wallet", icon: Wallet, badge: "Otomatis" },
  { id: "va_bca", name: "BCA Virtual Account", type: "Bank VA", icon: Building2, badge: "24 Jam" },
  { id: "va_mandiri", name: "Mandiri Virtual Account", type: "Bank VA", icon: Building2, badge: "24 Jam" },
];

function TopUpDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-2xs">
        <div className="aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[260px] max-h-[340px] bg-slate-200/80 w-full relative" />
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="-mt-14 sm:-mt-20 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-slate-300 border-4 border-white shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-1/3 bg-slate-300 rounded-md" />
            <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-36 rounded-2xl bg-slate-200/70" />
          <div className="h-60 rounded-2xl bg-slate-200/70" />
        </div>
        <div className="lg:col-span-4 h-80 rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}

export default function TopUpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const categorySlug = (params?.category as string) || "";
  const brandSlug = (params?.brand as string) || "";

  const [mounted, setMounted] = useState(false);
  const [customerID, setCustomerID] = useState("");
  const [zoneID, setZoneID] = useState("");
  const [selectedSKU, setSelectedSKU] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("qris");
  const [skus, setSkus] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("Semua");
  const [loading, setLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [visuals, setVisuals] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMounted(true);
    fetchVisuals();
    if (brandSlug) {
      fetchBrandSKUs();
    }
  }, [brandSlug]);

  const fetchVisuals = async () => {
    try {
      const res = await fetch("/api/admin/digiflazz/visuals");
      const data = await res.json();
      if (data.success && data.data) {
        setVisuals(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil visual config:", err);
    }
  };

  const fetchBrandSKUs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/digiflazz/products?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const matched = data.data.filter((item: any) => {
          const itemBrandSlug = item.brand
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          return itemBrandSlug === brandSlug && item.buyer_product_status && item.seller_product_status;
        });

        const sorted = matched.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
        setSkus(sorted);
        if (sorted.length > 0) {
          setSelectedSKU(sorted[0]);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil SKU brand:", err);
    } finally {
      setLoading(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  };

  const brandInfo = useMemo(() => {
    if (skus.length === 0) return null;
    const first = skus[0];
    return {
      name: first.brand,
      category: first.category,
      type: first.cmd_type || "prepaid",
    };
  }, [skus]);

  const formattedBrandName = useMemo(() => {
    const raw = brandInfo?.name || (brandSlug ? brandSlug.replace(/-/g, " ") : "");
    if (!raw) return "";
    const acronyms = ["PLN", "PDAM", "HP", "ID", "VA", "BCA", "BRI", "BNI", "OVO", "QRIS"];
    return raw
      .toLowerCase()
      .split(" ")
      .map((word: string) => {
        if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }, [brandInfo, brandSlug]);

  // Helper to categorize / group SKUs so Pulsa, Data, Voucher, etc. are separated cleanly
  const getProductGroupKey = (item: any): string => {
    const cat = (item.category || "").trim();
    const type = (item.type || "").trim();
    const name = (item.product_name || "").toLowerCase();

    // Pulsa & Seluler PPOB
    if (cat.toLowerCase() === "pulsa") return "Pulsa";
    if (cat.toLowerCase() === "data") return "Paket Data";
    if (cat.toLowerCase() === "voucher") return "Voucher";
    if (cat.toLowerCase().includes("sms") || cat.toLowerCase().includes("telpon") || cat.toLowerCase().includes("telepon")) return "Paket SMS & Telpon";
    if (cat.toLowerCase().includes("masa aktif")) return "Masa Aktif";
    if (cat.toLowerCase().includes("perdana")) return "Perdana";

    // Games (Separate Membership / Pass vs Regular Diamond)
    if (cat.toLowerCase() === "games") {
      if (
        type.toLowerCase() === "membership" ||
        name.includes("pass") ||
        name.includes("membership") ||
        name.includes("starlight") ||
        name.includes("twilight") ||
        name.includes("welkin")
      ) {
        return "Membership & Pass";
      }
      return "Umum / Diamond";
    }

    // PLN
    if (cat.toLowerCase().includes("pln") || cat.toLowerCase().includes("listrik")) {
      return "Token Listrik";
    }

    return cat || type || "Umum";
  };

  const productGroups = useMemo(() => {
    if (skus.length === 0) return [];
    const groupMap = new Map<string, any[]>();

    skus.forEach((item) => {
      const key = getProductGroupKey(item);
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    });

    return Array.from(groupMap.entries()).map(([name, items]) => ({
      name,
      items,
      count: items.length,
    }));
  }, [skus]);

  // Auto-select initial group matching current category slug or first group
  useEffect(() => {
    if (productGroups.length > 0) {
      const slug = (categorySlug || "").toLowerCase();
      const matched = productGroups.find((g) => {
        const gLower = g.name.toLowerCase();
        if (slug.includes("pulsa") && gLower.includes("pulsa")) return true;
        if (slug.includes("data") && gLower.includes("data")) return true;
        if (slug.includes("voucher") && gLower.includes("voucher")) return true;
        return false;
      });

      if (matched) {
        setSelectedGroup(matched.name);
      } else {
        setSelectedGroup("Semua");
      }
    }
  }, [productGroups, categorySlug]);

  const visual = useMemo(() => {
    if (!visuals?.brands) return null;
    const name = brandInfo?.name || (brandSlug ? brandSlug.replace(/-/g, " ") : "");
    if (!name) return null;
    const target = name.trim().toLowerCase();
    let merged: any = null;
    for (const [k, v] of Object.entries(visuals.brands)) {
      if (k.trim().toLowerCase() === target) {
        merged = { ...(merged || {}), ...(v as any) };
      }
    }
    return merged;
  }, [brandInfo, brandSlug, visuals]);

  const isGame = useMemo(() => {
    const cat = (categorySlug + " " + (brandInfo?.category || "")).toLowerCase();
    return cat.includes("game") || cat.includes("voucher");
  }, [categorySlug, brandInfo]);

  const isPln = useMemo(() => {
    const cat = (categorySlug + " " + (brandInfo?.category || "")).toLowerCase();
    return cat.includes("pln") || cat.includes("listrik");
  }, [categorySlug, brandInfo]);

  // Target input configuration (Dynamic from Admin Config or Auto Detection)
  const effectiveTargetType = useMemo<"id_only" | "id_server" | "phone_only" | "meter_only">(() => {
    if (visual?.targetType && visual.targetType !== "auto") {
      return visual.targetType as "id_only" | "id_server" | "phone_only" | "meter_only";
    }
    if (isPln) return "meter_only";
    if (isGame) {
      const b = (brandInfo?.name || "").toLowerCase();
      if (b.includes("mobile legend") || b.includes("lifeafter") || b.includes("genshin") || b.includes("point blank")) {
        return "id_server";
      }
      return "id_only";
    }
    return "phone_only";
  }, [visual, isPln, isGame, brandInfo]);

  const needZoneId = effectiveTargetType === "id_server";

  const idInputLabel = useMemo(() => {
    if (visual?.idLabel?.trim()) return visual.idLabel.trim();
    switch (effectiveTargetType) {
      case "id_server":
      case "id_only":
        return "User ID / Game ID";
      case "meter_only":
        return "ID Pelanggan PLN / No. Meter";
      case "phone_only":
      default:
        return "Nomor HP";
    }
  }, [visual, effectiveTargetType]);

  const idInputPlaceholder = useMemo(() => {
    if (visual?.idPlaceholder?.trim()) return visual.idPlaceholder.trim();
    switch (effectiveTargetType) {
      case "id_server":
      case "id_only":
        return "Contoh: 12345678";
      case "meter_only":
        return "11 Digit ID Pelanggan";
      case "phone_only":
      default:
        return "Contoh: 08123456789";
    }
  }, [visual, effectiveTargetType]);

  const serverInputLabel = useMemo(() => {
    if (visual?.serverLabel?.trim()) return visual.serverLabel.trim();
    return "Zone ID / Server";
  }, [visual]);

  const serverInputPlaceholder = useMemo(() => {
    if (visual?.serverPlaceholder?.trim()) return visual.serverPlaceholder.trim();
    return "Zone ID (Contoh: 1234)";
  }, [visual]);

  const inputHelperText = useMemo(() => {
    if (visual?.helperText?.trim()) return visual.helperText.trim();
    switch (effectiveTargetType) {
      case "id_server":
        return "User ID & Zone ID / Server dapat dilihat pada profil akun game Anda.";
      case "id_only":
        return "User ID dapat dilihat pada profil akun game Anda.";
      case "meter_only":
        return "Pastikan No. Meter atau ID Pelanggan PLN sudah benar.";
      case "phone_only":
      default:
        return "Pastikan nomor tujuan pengisian sudah benar dan aktif.";
    }
  }, [visual, effectiveTargetType]);

  const selectedPaymentData = useMemo(() => {
    return PAYMENT_METHODS.find((m) => m.id === selectedPayment) || PAYMENT_METHODS[0];
  }, [selectedPayment]);

  const handleOpenCheckout = () => {
    if (!customerID.trim()) {
      toast({
        variant: "destructive",
        title: "Data Belum Lengkap",
        description: `Silakan masukkan ${idInputLabel} Anda terlebih dahulu.`,
      });
      return;
    }
    if (needZoneId && !zoneID.trim()) {
      toast({
        variant: "destructive",
        title: "Server / Zone Kosong",
        description: `Silakan masukkan ${serverInputLabel} terlebih dahulu.`,
      });
      return;
    }
    if (!selectedSKU) {
      toast({
        variant: "destructive",
        title: "Nominal Belum Dipilih",
        description: "Silakan pilih nominal / paket top up terlebih dahulu.",
      });
      return;
    }

    setShowCheckoutModal(true);
  };

  const confirmOrder = () => {
    setShowCheckoutModal(false);
    toast({
      title: "Pesanan Dibuat!",
      description: `Menyiapkan halaman pembayaran untuk ${selectedSKU.product_name}.`,
    });
    router.push(
      `/checkout?sku=${selectedSKU.buyer_sku_code}&target=${customerID.trim()}${zoneID ? `&zone=${zoneID.trim()}` : ""}&payment=${selectedPayment}`
    );
  };

  const bgStyle = useMemo(() => {
    if (visual?.bgImageUrl) {
      return {
        backgroundImage: `url('${visual.bgImageUrl}')`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      };
    }
    if (visual?.bgGradient) {
      if (visual.bgGradient.includes("gradient")) {
        return { background: visual.bgGradient };
      }
      return {
        background: `linear-gradient(135deg, ${visual.bgGradient} 0%, #0F172A 100%)`,
      };
    }
    return {
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    };
  }, [visual]);

  if (!mounted) return null;

  const StepHeader = ({ number, title }: { number: number; title: string }) => (
    <div className="-mx-4 -mt-4 mb-4 md:-mx-6 md:-mt-6 flex items-stretch overflow-hidden rounded-t-2xl bg-slate-50 border-b border-border/50">
      <div className="flex w-9 sm:w-11 shrink-0 items-center justify-center bg-[#00AA5B] text-white font-black text-xs sm:text-sm">
        {number}
      </div>
      <div className="flex-1 flex items-center px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/80">
        <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-800">{title}</h3>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-body">
      {/* Main Content */}

      {/* Main Content */}
      <main className="flex-grow pb-20 sm:pb-24 lg:pb-12">
        {loading ? (
          <TopUpDetailSkeleton />
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

            {/* Top Product Hero Banner */}
            <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-white shadow-xs overflow-hidden">
              <div
                className="relative aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[260px] max-h-[340px] w-full overflow-hidden flex items-center justify-center transition-all bg-slate-900"
                style={!visual?.bgImageUrl ? bgStyle : undefined}
              >
                {visual?.bgImageUrl ? (
                  <img
                    src={visual.bgImageUrl}
                    alt={brandInfo?.name || "Background"}
                    className="w-full h-full object-cover object-center select-none"
                    loading="eager"
                  />
                ) : null}

                {/* Subtle soft bottom edge vignette to smoothly anchor the logo box */}
                <div className="absolute inset-x-0 bottom-0 h-14 sm:h-20 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
              </div>

              {/* Product Info Strip */}
              <div className="relative px-4 pb-4 sm:px-6 sm:pb-5 pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-5 items-start sm:items-center">
                {/* Logo Icon Box overlapping header */}
                <div className="-mt-10 sm:-mt-14 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative z-20">
                  {visual?.iconUrl ? (
                    <img
                      src={visual.iconUrl}
                      alt={brandInfo?.name || "Logo"}
                      className="w-full h-full object-cover filter drop-shadow-xs"
                    />
                  ) : (
                    <Gamepad2 className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 z-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {formattedBrandName}
                    </h1>
                    <Badge variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-[#00AA5B] border-emerald-200/80 rounded-full shadow-2xs">
                      {brandInfo?.category}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
                    Layanan pengisian otomatis 24 jam nonstop. Proses kilat, terverifikasi, & garansi 100%.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-[11px] font-semibold text-slate-700">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>Proses Instan</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-[11px] font-semibold text-slate-700">
                      <MessageCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>CS 24/7</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-[11px] font-semibold text-slate-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#00AA5B] shrink-0" />
                      <span>100% Garansi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Grid (Left: 3 Steps Form, Right: Desktop Sticky Summary) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">

              {/* Left Column: 3 Steps (8 cols) */}
              <div className="lg:col-span-8 space-y-5">

                {/* STEP 1: DATA AKUN */}
                <div className="rounded-2xl border border-border/60 bg-white p-4 sm:p-6 shadow-2xs">
                  <StepHeader
                    number={1}
                    title={
                      effectiveTargetType === "id_server"
                        ? "Masukkan Data Akun & Server Game"
                        : effectiveTargetType === "id_only"
                          ? "Masukkan User ID Akun Game"
                          : effectiveTargetType === "meter_only"
                            ? "Masukkan Nomor Meter / ID Pelanggan PLN"
                            : "Masukkan Nomor HP Tujuan"
                    }
                  />

                  <div className={cn(needZoneId ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" : "w-full space-y-1.5")}>
                    <div className="space-y-1.5 w-full">
                      <Label htmlFor="userId" className="text-[11px] font-bold text-slate-700">
                        {idInputLabel}
                      </Label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="userId"
                          value={customerID}
                          onChange={(e) => {
                            if (effectiveTargetType === "phone_only" || effectiveTargetType === "meter_only") {
                              setCustomerID(e.target.value.replace(/[^0-9]/g, ""));
                            } else {
                              setCustomerID(e.target.value.replace(/[^0-9a-zA-Z_.-]/g, ""));
                            }
                          }}
                          placeholder={idInputPlaceholder}
                          className="h-11 pl-9 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 border-border/70 focus:bg-white focus:border-[#00AA5B] w-full"
                        />
                      </div>
                    </div>

                    {needZoneId && (
                      <div className="space-y-1.5 w-full">
                        <Label htmlFor="zoneId" className="text-[11px] font-bold text-slate-700">
                          {serverInputLabel}
                        </Label>
                        <Input
                          id="zoneId"
                          value={zoneID}
                          onChange={(e) => setZoneID(e.target.value.replace(/[^0-9a-zA-Z_.-]/g, ""))}
                          placeholder={serverInputPlaceholder}
                          className="h-11 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 border-border/70 focus:bg-white focus:border-[#00AA5B] w-full"
                        />
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />
                    {inputHelperText}
                  </p>
                </div>

                {/* STEP 2: PILIH NOMINAL TOP UP */}
                <div className="rounded-2xl border border-border/60 bg-white p-4 sm:p-6 shadow-2xs space-y-4">
                  <StepHeader number={2} title="Pilih Nominal Top Up" />

                  {/* Kategori / Tipe Tabs Selector (Contoh: Pulsa, Paket Data, Voucher) */}
                  {productGroups.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                      {/* Tombol Tampilkan Semua di Paling Kiri */}
                      <button
                        type="button"
                        onClick={() => setSelectedGroup("Semua")}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                          selectedGroup === "Semua"
                            ? "bg-[#00AA5B] text-white border-[#00AA5B] shadow-xs"
                            : "bg-slate-50 text-slate-700 border-border/70 hover:bg-slate-100"
                        )}
                      >
                        Semua
                      </button>

                      {productGroups.map((grp) => {
                        const isActive = selectedGroup === grp.name;
                        return (
                          <button
                            key={grp.name}
                            type="button"
                            onClick={() => {
                              setSelectedGroup(grp.name);
                              // Auto select SKU pertama di grup ini jika SKU terpilih sebelumnya bukan dari grup ini
                              const hasCurrent = grp.items.some(
                                (it: any) => it.buyer_sku_code === selectedSKU?.buyer_sku_code
                              );
                              if (!hasCurrent && grp.items.length > 0) {
                                setSelectedSKU(grp.items[0]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0",
                              isActive
                                ? "bg-[#00AA5B] text-white border-[#00AA5B] shadow-xs"
                                : "bg-slate-50 text-slate-700 border-border/70 hover:bg-slate-100"
                            )}
                          >
                            <span>{grp.name}</span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600 font-medium"
                              )}
                            >
                              {grp.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* DAFTAR NOMINAL / SKU */}
                  {(() => {
                    const renderNominalCard = (item: any) => {
                      const isSelected = selectedSKU?.buyer_sku_code === item.buyer_sku_code;
                      const priceVal = item.price || item.admin || 0;
                      const formattedName = formatProductName(
                        item.product_name,
                        item.brand || brandInfo?.name,
                        item.category || brandInfo?.category
                      );

                      return (
                        <button
                          key={item.buyer_sku_code}
                          type="button"
                          onClick={() => setSelectedSKU(item)}
                          className={cn(
                            "relative group flex flex-col justify-between rounded-2xl border text-left transition-all duration-200 min-h-[96px] sm:min-h-[104px] cursor-pointer active:scale-[0.99] overflow-hidden",
                            isSelected
                              ? "bg-white border-[#00AA5B] ring-1 ring-[#00AA5B]/30 shadow-xs"
                              : "bg-white border-slate-200/90 hover:border-[#00AA5B]/50 hover:shadow-2xs"
                          )}
                        >
                          {/* Top Section: Title & Radio Indicator */}
                          <div className="p-3 sm:p-3.5 flex items-start justify-between gap-2 w-full flex-1">
                            <div className="space-y-1 flex-1 pr-1">
                              {item.type && !["umum", "nominal", "customer", "reguler"].includes(item.type.toLowerCase()) && (
                                <span className="inline-block text-[9px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider mb-0.5">
                                  {item.type}
                                </span>
                              )}
                              <h4
                                className={cn(
                                  "text-xs sm:text-[13px] font-medium leading-snug line-clamp-2 transition-colors",
                                  isSelected ? "text-[#00AA5B]" : "text-slate-700 group-hover:text-slate-900"
                                )}
                              >
                                {formattedName}
                              </h4>
                            </div>

                            {/* Radio Indicator */}
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150",
                                isSelected
                                  ? "bg-[#00AA5B] text-white shadow-2xs"
                                  : "border border-slate-300 group-hover:border-[#00AA5B]/60"
                              )}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                            </div>
                          </div>

                          {/* Bottom Section: Distinct Background Price Footer */}
                          <div
                            className={cn(
                              "px-3 sm:px-3.5 py-2 sm:py-2.5 border-t flex items-center justify-between w-full transition-colors",
                              isSelected
                                ? "bg-[#00AA5B]/[0.08] border-[#00AA5B]/20"
                                : "bg-slate-50/90 border-slate-100 group-hover:bg-slate-100/70"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px] sm:text-[11px] font-normal transition-colors",
                                isSelected ? "text-[#00AA5B]/80" : "text-muted-foreground"
                              )}
                            >
                              Harga
                            </span>
                            <span
                              className={cn(
                                "text-xs sm:text-[13px] font-medium tracking-tight transition-colors",
                                isSelected ? "text-[#00AA5B]" : "text-slate-800 group-hover:text-slate-900"
                              )}
                            >
                              Rp {priceVal.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </button>
                      );
                    };

                    return selectedGroup === "Semua" ? (
                      // Jika "Semua", tampilkan per kelompok yang terorganisir rapi
                      <div className="space-y-5 pt-1">
                        {productGroups.map((grp) => (
                          <div key={grp.name} className="space-y-2.5">
                            {productGroups.length > 1 && (
                              <div className="flex items-center gap-2 pt-1">
                                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
                                  {grp.name}
                                </h4>
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                              {grp.items.map(renderNominalCard)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Jika satu grup dipilih (misal hanya Pulsa saja, atau Data saja, atau Voucher saja)
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
                        {productGroups
                          .find((g) => g.name === selectedGroup)
                          ?.items.map(renderNominalCard)}
                      </div>
                    );
                  })()}
                </div>

                {/* STEP 3: METODE PEMBAYARAN */}
                <div className="rounded-2xl border border-border/60 bg-white p-4 sm:p-6 shadow-2xs">
                  <StepHeader number={3} title="Metode Pembayaran" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = selectedPayment === method.id;
                      const IconComp = method.icon;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 shadow-2xs",
                            isSelected
                              ? "bg-[#00AA5B]/5 border-[#00AA5B] ring-2 ring-[#00AA5B]/20"
                              : "bg-white border-border/70 hover:border-[#00AA5B]/50 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-border/60",
                              isSelected ? "bg-[#00AA5B] text-white border-[#00AA5B]" : "bg-slate-50 text-slate-600"
                            )}>
                              <IconComp className="h-4.5 w-4.5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{method.name}</p>
                              <span className="text-[9px] font-semibold text-muted-foreground">{method.badge}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#00AA5B] text-white flex items-center justify-center text-xs">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Desktop Sticky Order Summary (4 cols) */}
              <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 space-y-4 w-full shrink-0">
                <Card className="border-border/60 shadow-md rounded-2xl bg-white overflow-hidden w-full">
                  <CardHeader className="p-3.5 sm:p-4 border-b border-border/40 bg-slate-50/50">
                    <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2 truncate">
                      <ShoppingBag className="w-4 h-4 text-[#00AA5B] shrink-0" /> Ringkasan Pesanan
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-3.5 sm:p-4 space-y-3.5">
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-slate-600 min-w-0">
                        <span className="shrink-0">Layanan</span>
                        <span className="font-bold text-slate-900 truncate text-right">{formattedBrandName || "-"}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-slate-600 min-w-0">
                        <span className="shrink-0">Target ID</span>
                        <span className="font-mono font-bold text-[#00AA5B] truncate text-right">
                          {customerID || "-"} {zoneID ? `(${zoneID})` : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-slate-600 min-w-0">
                        <span className="shrink-0">Nominal</span>
                        <span className="font-bold text-slate-900 truncate text-right">
                          {selectedSKU ? formatProductName(selectedSKU.product_name, selectedSKU.brand || brandInfo?.name, selectedSKU.category || brandInfo?.category) : "Belum Dipilih"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 text-slate-600 min-w-0">
                        <span className="shrink-0">Pembayaran</span>
                        <span className="font-bold text-slate-900 truncate text-right">{selectedPaymentData.name}</span>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs text-slate-500 font-medium shrink-0">Total Bayar</span>
                        <span className="text-base sm:text-lg font-semibold text-[#00AA5B] truncate text-right">
                          Rp {selectedSKU ? (selectedSKU.price || selectedSKU.admin || 0).toLocaleString("id-ID") : "0"}
                        </span>
                      </div>
                    </div>

                    <Button
                      disabled={!customerID.trim() || !selectedSKU}
                      onClick={handleOpenCheckout}
                      className="w-full h-10 sm:h-11 rounded-xl font-medium text-xs sm:text-sm bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs transition-all gap-1.5 whitespace-nowrap"
                    >
                      Beli Sekarang <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Order Summary Bar (Replaces Mobile Footer Nav) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-normal leading-none block">
              Total Pembayaran
            </span>
            <div className="text-base sm:text-lg font-semibold text-[#00AA5B] truncate leading-tight mt-1">
              Rp {selectedSKU ? (selectedSKU.price || selectedSKU.admin || 0).toLocaleString("id-ID") : "0"}
            </div>
          </div>

          <Button
            disabled={!customerID.trim() || !selectedSKU}
            onClick={handleOpenCheckout}
            className="h-10 px-5 sm:px-6 rounded-xl font-medium text-xs sm:text-sm bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs transition-all gap-1.5 shrink-0"
          >
            <span>Beli Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="rounded-2xl max-w-md bg-white border border-border/80 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#00AA5B]" /> Konfirmasi Pesanan Top Up
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Mohon periksa kembali data tujuan dan paket pesanan Anda sebelum melanjutkan ke pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs font-semibold space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-muted-foreground">Layanan:</span>
                <span className="font-bold text-slate-900">{formattedBrandName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-muted-foreground">Target ID / No. Tujuan:</span>
                <span className="font-mono font-bold text-[#00AA5B]">
                  {customerID} {zoneID ? `(${zoneID})` : ""}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-muted-foreground">Nominal Top Up:</span>
                <span className="font-bold text-slate-900">
                  {formatProductName(selectedSKU?.product_name, selectedSKU?.brand || brandInfo?.name, selectedSKU?.category || brandInfo?.category)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-muted-foreground">Metode Pembayaran:</span>
                <span className="font-bold text-slate-900">{selectedPaymentData.name}</span>
              </div>

              <div className="flex justify-between pt-1 text-sm font-black text-slate-900">
                <span>Total Bayar:</span>
                <span className="text-[#00AA5B]">
                  Rp {(selectedSKU?.price || selectedSKU?.admin || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="rounded-xl text-xs font-bold h-9">
              Batal
            </Button>
            <Button onClick={confirmOrder} className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-black rounded-xl text-xs h-9 px-5 gap-1">
              Lanjut Pembayaran <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
