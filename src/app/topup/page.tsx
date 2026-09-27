"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronRight, 
  Star, 
  ShieldCheck,
  Store,
  ShoppingBag,
  Zap,
  Info,
  Layers,
  Gamepad2,
  Smartphone,
  Wallet as WalletIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const TOPUP_CATEGORIES = [
  { id: "all", label: "Semua", icon: "/assets/icons/more.png", color: "bg-slate-50" },
  { id: "pulsa", label: "Pulsa & Data", icon: "/assets/icons/pulsadata.png", color: "bg-blue-50", match: ["PULSA", "DATA"] },
  { id: "game", label: "Game", icon: "/assets/icons/game.png", color: "bg-purple-50", match: ["GAMES", "GAME"] },
  { id: "ewallet", label: "E-Wallet", icon: "/assets/icons/ewallet.png", color: "bg-emerald-50", match: ["E-MONEY", "E-WALLET", "SALDO"] },
  { id: "pln", label: "Listrik PLN", icon: "/assets/icons/listrik.png", color: "bg-amber-50", match: ["PLN"] },
  { id: "pdam", label: "Air PDAM", icon: "/assets/icons/pdam.png", color: "bg-cyan-50", match: ["PDAM"] },
  { id: "voucher", label: "Voucher", icon: "/assets/icons/voucher.png", color: "bg-orange-50", match: ["VOUCHER"] },
];

interface DigiFlazzBrand {
  brand: string;
  category: string;
  minPrice: number;
  skusCount: number;
  cmdType: string;
}

export default function TopUpHubPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [digiflazzItems, setDigiflazzItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const db = useFirestore();
  
  // Fetch Visual Settings for DigiFlazz Brands (official logos, colors)
  const visualsRef = useMemoFirebase(() => doc(db, "settings", "digiflazz_visuals"), [db]);
  const { data: visuals } = useDoc(visualsRef);

  useEffect(() => {
    setMounted(true);
    fetchDigiFlazzCatalog();
  }, []);

  const fetchDigiFlazzCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/digiflazz/products");
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

  // Group SKUs by Brand to show "Game/Provider Cards"
  const brandCards = useMemo(() => {
    const groups: Record<string, DigiFlazzBrand> = {};
    
    // Filter active items only
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

  // Apply filters (Category & Search)
  const filteredBrands = useMemo(() => {
    return brandCards.filter((b) => {
      // 1. Search filter
      const matchesSearch = b.brand.toLowerCase().includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;

      // 2. Category filter
      if (selectedCat === "all") return true;
      const catConfig = TOPUP_CATEGORIES.find(c => c.id === selectedCat);
      if (catConfig?.match) {
        return catConfig.match.some(m => b.category.toUpperCase().includes(m));
      }
      return true;
    });
  }, [brandCards, search, selectedCat]);

  if (!mounted) return null;

  return (
    <main className="flex-1 w-full pt-20 pb-24 md:pb-12 bg-white font-body">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 space-y-8">
        
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#212121]">Top Up & Tagihan</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Layanan instan pengisian pulsa, kuota, token, dan top up game favorit.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari brand game atau provider..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10 rounded-2xl bg-muted/30 border-transparent focus:bg-white focus:border-[#00AA5B] transition-all font-bold text-xs"
              />
            </div>
          </div>
        </section>

        {/* Categories Navigation */}
        <section className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {TOPUP_CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCat(cat.id)}
              className={cn(
                "group flex flex-col items-center gap-2.5 transition-all shrink-0 w-[70px] sm:w-[85px]",
                selectedCat === cat.id ? "opacity-100" : "opacity-60 hover:opacity-100"
              )}
            >
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-2xs",
                selectedCat === cat.id ? "bg-[#00AA5B] border-[#00AA5B] shadow-lg shadow-[#00AA5B]/20 scale-110" : cn("bg-white border-border/60", cat.color)
              )}>
                <Image 
                  src={cat.icon} 
                  alt={cat.label} 
                  width={28} 
                  height={28} 
                  className={cn("object-contain transition-transform group-hover:scale-110", selectedCat === cat.id && "brightness-0 invert")}
                />
              </div>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-bold text-center leading-tight whitespace-nowrap",
                selectedCat === cat.id ? "text-[#00AA5B]" : "text-muted-foreground"
              )}>
                {cat.label}
              </span>
            </button>
          ))}
        </section>

        {/* Brands Grid Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base md:text-lg font-black tracking-tight text-[#212121]">
                {selectedCat === 'all' ? "Semua Layanan" : `Layanan ${TOPUP_CATEGORIES.find(c => c.id === selectedCat)?.label}`}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              {filteredBrands.length} Brand
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="aspect-[4/6] rounded-2xl bg-muted/40 animate-pulse border border-border" />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-muted/5 rounded-3xl border border-dashed border-border/60">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/40">
                <Search className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Brand Tidak Ditemukan</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Maaf, tidak ada layanan DigiFlazz yang sesuai dengan pencarian atau kategori Anda saat ini.
                </p>
              </div>
              <Button 
                onClick={() => {setSearch(""); setSelectedCat("all");}}
                variant="outline" 
                className="h-9 px-6 rounded-xl text-xs font-bold border-border"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredBrands.map((b) => {
                // Get visual style from Firestore if available
                const visual = visuals?.brands?.[b.brand];
                const bgStyle = visual?.bgGradient || "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)";
                
                return (
                  <Link key={b.brand} href={`/search?q=${encodeURIComponent(b.brand)}`}>
                    <Card 
                      className="group relative h-full rounded-2xl overflow-hidden border-none bg-[#1A1A1A] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col shadow-md"
                    >
                      {/* Top Visual Area (Aspect 4/5) */}
                      <div 
                        className="relative aspect-[4/5] w-full flex items-center justify-center overflow-hidden"
                        style={{ background: bgStyle }}
                      >
                        {/* If there's a background image in settings */}
                        {visual?.bgImageUrl ? (
                          <Image 
                            src={visual.bgImageUrl} 
                            alt={b.brand} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center drop-shadow-lg transition-transform group-hover:scale-110 duration-300">
                            {visual?.iconUrl ? (
                              <img src={visual.iconUrl} alt={b.brand} className="w-full h-full object-contain filter drop-shadow-sm" />
                            ) : (
                              <div className="w-full h-full rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                 <Gamepad2 className="w-8 h-8 text-white/40" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status Badge in visual area */}
                        <div className="absolute top-3 right-3">
                           <span className="bg-black/40 backdrop-blur-sm text-white/90 font-black text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">
                              {b.cmdType}
                           </span>
                        </div>
                      </div>

                      {/* Dark Info Panel matching the reference image */}
                      <div className="p-3.5 bg-[#262626] space-y-1">
                        <p className="text-[#00AA5B] text-[10px] font-black uppercase tracking-tight truncate">
                          {visual?.badgeText || b.category.split(' ')[0]}
                        </p>
                        <h4 className="text-white text-[13px] sm:text-sm font-black leading-tight tracking-tight truncate group-hover:text-[#00AA5B] transition-colors">
                          {b.brand}
                        </h4>
                        <div className="flex items-center justify-between pt-1 opacity-60">
                           <span className="text-white text-[9px] font-medium">Mulai Rp {b.minPrice.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Security & Reliability Info */}
        <section className="pt-8 border-t border-border/60 pb-10">
           <Card className="bg-[#F8FAFC] border-none rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-[#00AA5B]" />
              </div>
              <div className="space-y-2 flex-1">
                 <h3 className="text-base md:text-lg font-black text-[#2E3137]">Sistem Top Up Otomatis 24 Jam</h3>
                 <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                    Semua transaksi di hub Top Up MarketPoint terhubung langsung ke sistem DigiFlazz yang menjamin kecepatan pengiriman saldo dan token dalam hitungan detik. Keamanan dana Anda dijamin 100% oleh sistem verifikasi kami.
                 </p>
              </div>
              <Button variant="outline" className="h-10 px-8 rounded-xl border-border bg-white text-xs font-bold hover:bg-white hover:text-[#00AA5B] hover:border-[#00AA5B] transition-all shrink-0">
                 Bantuan Center
              </Button>
           </Card>
        </section>

      </div>
    </main>
  );
}
