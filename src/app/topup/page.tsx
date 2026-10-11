"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  Gamepad2,
  Smartphone,
  Wallet as WalletIcon,
  Droplets,
  Ticket,
  Sparkles,
  ArrowRight,
  Store,
  RefreshCw,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const TOPUP_CATEGORIES = [
  { id: "all", label: "Semua", icon: Layers, color: "bg-slate-100 text-slate-700", match: [] },
  { id: "game", label: "Game", icon: Gamepad2, color: "bg-purple-50 text-purple-600", match: ["GAMES", "GAME"] },
  { id: "pulsa", label: "Pulsa & Data", icon: Smartphone, color: "bg-blue-50 text-blue-600", match: ["PULSA", "DATA"] },
  { id: "ewallet", label: "E-Wallet", icon: WalletIcon, color: "bg-emerald-50 text-emerald-600", match: ["E-MONEY", "E-WALLET", "SALDO"] },
  { id: "pln", label: "Listrik PLN", icon: Zap, color: "bg-amber-50 text-amber-600", match: ["PLN"] },
  { id: "pdam", label: "Air PDAM", icon: Droplets, color: "bg-cyan-50 text-cyan-600", match: ["PDAM"] },
  { id: "voucher", label: "Voucher", icon: Ticket, color: "bg-orange-50 text-orange-600", match: ["VOUCHER"] },
];

interface DigiFlazzBrand {
  brand: string;
  category: string;
  minPrice: number;
  skusCount: number;
  cmdType: string;
}

function TopUpCardSkeleton() {
  return (
    <Card className="rounded-2xl overflow-hidden border border-border/70 bg-white flex flex-col shadow-xs animate-pulse">
      <div className="aspect-square w-full bg-slate-100 flex items-center justify-center p-4 border-b border-border/40">
        <div className="w-16 h-16 rounded-2xl bg-slate-200/80" />
      </div>
      <div className="p-3 bg-white space-y-1.5">
        <div className="h-2.5 w-12 bg-slate-200/70 rounded-full" />
        <div className="h-4 w-3/4 bg-slate-300/80 rounded-md" />
      </div>
    </Card>
  );
}

function TopUpHubContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [digiflazzItems, setDigiflazzItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visuals, setVisuals] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const cat = searchParams.get("cat") || searchParams.get("category");
    const q = searchParams.get("q") || searchParams.get("search");
    if (cat) setSelectedCat(cat);
    if (q) setSearch(q);

    window.scrollTo({ top: 0, behavior: "instant" });
    fetchDigiFlazzCatalog();
    fetchVisuals();
  }, [searchParams]);

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

  const fetchDigiFlazzCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/digiflazz/products?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDigiflazzItems(data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil katalog DigiFlazz:", err);
    } finally {
      setLoading(false);
    }
  };

  const brandCards = useMemo(() => {
    const groups: Record<string, DigiFlazzBrand> = {};
    const activeItems = digiflazzItems.filter(item => item.buyer_product_status && item.seller_product_status);

    activeItems.forEach((item) => {
      const brandName = item.brand ? item.brand.toUpperCase() : "UNKNOWN";
      const price = item.price || item.admin || 0;

      if (!groups[brandName]) {
        groups[brandName] = {
          brand: brandName,
          category: item.category || "",
          minPrice: price,
          skusCount: 1,
          cmdType: item.cmd_type || "prepaid"
        };
      } else {
        groups[brandName].skusCount += 1;
        if (price > 0 && (groups[brandName].minPrice === 0 || price < groups[brandName].minPrice)) {
          groups[brandName].minPrice = price;
        }
      }
    });

    return Object.values(groups).sort((a, b) => a.brand.localeCompare(b.brand));
  }, [digiflazzItems]);

  const filteredBrands = useMemo(() => {
    return brandCards.filter((b) => {
      const matchesSearch = b.brand.toLowerCase().includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (selectedCat === "all") return true;
      const catConfig = TOPUP_CATEGORIES.find(c => c.id === selectedCat);
      if (catConfig?.match && catConfig.match.length > 0) {
        return catConfig.match.some(m => b.category.toUpperCase().includes(m));
      }
      return true;
    });
  }, [brandCards, search, selectedCat]);

  const getSlugify = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const formatBrandTitle = (raw: string) => {
    if (!raw) return "";
    const acronyms = ["PLN", "PDAM", "HP", "ID", "VA", "BCA", "BRI", "BNI", "OVO", "QRIS"];
    return raw
      .toLowerCase()
      .split(" ")
      .map((word) => {
        if (acronyms.includes(word.toUpperCase())) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const getBrandVisual = (brandName?: string) => {
    if (!brandName || !visuals?.brands) return null;
    const target = brandName.trim().toLowerCase();
    let merged: any = null;
    for (const [k, v] of Object.entries(visuals.brands)) {
      if (k.trim().toLowerCase() === target) {
        merged = { ...(merged || {}), ...(v as any) };
      }
    }
    return merged;
  };

  const groupedCategories = useMemo(() => {
    const activeCats = TOPUP_CATEGORIES.filter((c) => c.id !== "all");
    const assignedBrandNames = new Set<string>();

    const groups = activeCats
      .map((cat) => {
        const items = filteredBrands.filter((b) => {
          const catUpper = (b.category || "").toUpperCase();
          return cat.match.some((m) => catUpper.includes(m));
        });
        items.forEach((i) => assignedBrandNames.add(i.brand));
        return {
          ...cat,
          brands: items,
        };
      })
      .filter((g) => g.brands.length > 0);

    const otherBrands = filteredBrands.filter((b) => !assignedBrandNames.has(b.brand));
    if (otherBrands.length > 0) {
      groups.push({
        id: "other",
        label: "Layanan Lainnya",
        icon: Sparkles,
        color: "bg-slate-50 text-slate-700",
        match: [],
        brands: otherBrands,
      });
    }

    return groups;
  }, [filteredBrands]);

  const renderBrandCard = (b: DigiFlazzBrand) => {
    const visual = getBrandVisual(b.brand);
    const catSlug = getSlugify(b.category);
    const brandSlug = getSlugify(b.brand);

    return (
      <Link key={b.brand} href={`/topup/${catSlug}/${brandSlug}`} scroll={true}>
        <Card className="group relative h-full rounded-2xl overflow-hidden border border-border/70 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col shadow-xs hover:-translate-y-0.5">
          <div className="relative aspect-square w-full overflow-hidden border-b border-border/40">
            {/* MarketPointID Logo */}
            <img
              src="/assets/img/logo.png"
              alt="MarketPointID"
              className="absolute top-2 right-2 z-10 h-5 sm:h-6 w-auto object-contain pointer-events-none drop-shadow-sm transition-transform group-hover:scale-105"
              loading="lazy"
            />

            {visual?.iconUrl ? (
              <img
                src={visual.iconUrl}
                alt={b.brand}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <Gamepad2 className="w-10 h-10 text-muted-foreground/20" />
              </div>
            )}
          </div>

          <div className="p-2.5 sm:p-3 bg-white flex items-center justify-center">
            <h4 className="text-[#212121] text-xs sm:text-sm font-black leading-snug tracking-tight truncate w-full text-center group-hover:text-[#00AA5B] transition-colors">
              {formatBrandTitle(b.brand)}
            </h4>
          </div>
        </Card>
      </Link>
    );
  };

  if (!mounted) return null;

  return (
    <main className="flex-1 w-full py-4 sm:py-6 pb-20 md:pb-12 bg-[#F8FAFC] font-body">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">

        <section className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 border border-border/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-green-50 text-[#00AA5B]">
                  <Zap className="w-4 h-4 fill-[#00AA5B]" />
                </span>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#212121]">
                  Top Up & PPOB Store
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Pengisian pulsa, paket data, token PLN, e-wallet, & game instan 24 jam nonstop.
              </p>
            </div>

            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari brand, game, provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-8 rounded-xl bg-slate-50 border-border/70 text-xs font-bold focus:bg-white focus:border-[#00AA5B] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            {TOPUP_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCat === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border whitespace-nowrap",
                    isActive
                      ? "bg-[#00AA5B] text-white border-[#00AA5B] shadow-xs scale-[1.02]"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-border/50"
                  )}
                >
                  <IconComp className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <TopUpCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-dashed border-border/60">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200">
                <Search className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">Layanan Tidak Ditemukan</h3>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Tidak ada provider atau game yang sesuai dengan filter pencarian &quot;{search}&quot;.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCat("all");
                }}
                className="h-8 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Reset Filter Pencarian
              </Button>
            </div>
          ) : selectedCat === "all" ? (
            <div className="space-y-6 sm:space-y-8">
              {groupedCategories.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.id} className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between px-1 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-green-50 text-[#00AA5B]">
                          <GroupIcon className="w-4 h-4" />
                        </span>
                        <h2 className="text-sm sm:text-base font-black tracking-tight text-[#212121]">
                          {group.label}
                        </h2>
                        <span className="text-[10px] font-bold text-muted-foreground bg-white border border-border/50 px-2.5 py-0.5 rounded-full shadow-2xs">
                          {group.brands.length} Brand
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCat(group.id)}
                        className="text-xs font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5"
                      >
                        Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                      {group.brands.map(renderBrandCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between px-1 border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-green-50 text-[#00AA5B]">
                    {(() => {
                      const IconComp = TOPUP_CATEGORIES.find((c) => c.id === selectedCat)?.icon || Layers;
                      return <IconComp className="w-4 h-4" />;
                    })()}
                  </span>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#212121]">
                    {TOPUP_CATEGORIES.find((c) => c.id === selectedCat)?.label || "Semua Layanan"}
                  </h2>
                  <span className="text-[10px] font-bold text-muted-foreground bg-white border border-border/50 px-2.5 py-0.5 rounded-full shadow-2xs">
                    {filteredBrands.length} Brand Siap
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCat("all")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  Tampilkan Semua Kategori
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                {filteredBrands.map(renderBrandCard)}
              </div>
            </div>
          )}
        </section>

        {/* Bottom Guarantee Banner */}
        <section className="pt-4 pb-8">
          <Card className="bg-white border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-2xs">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-green-50 text-[#00AA5B] border border-green-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-800">Sistem Top Up Otomatis Realtime 24 Jam</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-relaxed">
                Pengisian pulsa, kuota, token PLN, & game diproses otomatis via koneksi DigiFlazz API. Transaksi aman & saldo terverifikasi.
              </p>
            </div>
          </Card>
        </section>

      </div>
    </main>
  );
}

export default function TopUpHubPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 w-full py-4 sm:py-6 pb-20 md:pb-12 bg-[#F8FAFC] font-body">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
            <div className="h-32 bg-slate-200/60 rounded-3xl animate-pulse" />
          </div>
        </main>
      }
    >
      <TopUpHubContent />
    </Suspense>
  );
}
