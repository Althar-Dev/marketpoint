"use client";

import { useState, useEffect, useMemo } from "react";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Zap,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  ShoppingBag,
  Store,
  Star,
  Tag,
  ArrowRight,
  Percent,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getProductActiveFlashSale,
  getProductUpcomingFlashSale,
  formatCountdown,
  FlashSaleSession,
} from "@/lib/flash-sale";
import { PromoPriceBadge } from "@/components/promo-price-badge";

export default function DealsPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const [products, setProducts] = useState<any[]>([]);
  const [shopsMap, setShopsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<"ONGOING" | "UPCOMING">("ONGOING");

  // Real-time tick every 1 second
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all products & shop data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        let rawProducts = data.products || [];

        const sMap: Record<string, any> = {};
        if (db) {
          try {
            const shopsSnap = await getDocs(collection(db, "shops"));
            shopsSnap.forEach((docSnap) => {
              sMap[docSnap.id] = docSnap.data();
            });
            setShopsMap(sMap);
          } catch (e) {
            console.warn("Gagal mengambil profil toko:", e);
          }
        }

        // Decorate products
        rawProducts = rawProducts.map((p: any) => {
          const shop = sMap[p.shopId];
          return {
            ...p,
            shopName: shop?.name || shop?.shopName || p.shopName || "Toko Seller",
            shopLogoUrl: shop?.logoUrl || p.shopLogoUrl || "",
            shopIsVerified: Boolean(shop?.isVerified ?? p.shopIsVerified),
            shopIsOfficial: Boolean(shop?.isOfficial ?? p.shopIsOfficial),
            shopFlashSales: Array.isArray(shop?.flashSales) ? shop.flashSales : [],
          };
        });

        setProducts(rawProducts);
      } catch (err) {
        console.error("Gagal mengambil promo flash sale:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db]);

  // Extract all ongoing flash sales
  const ongoingItems = useMemo(() => {
    return products
      .map((p) => {
        const fs = getProductActiveFlashSale(p.id, p.shopFlashSales, nowTime);
        return fs ? { product: p, flashSale: fs } : null;
      })
      .filter((x): x is { product: any; flashSale: any } => x !== null);
  }, [products, nowTime]);

  // Extract all upcoming flash sales
  const upcomingItems = useMemo(() => {
    return products
      .map((p) => {
        const fs = getProductUpcomingFlashSale(p.id, p.shopFlashSales, nowTime);
        return fs ? { product: p, flashSale: fs } : null;
      })
      .filter((x): x is { product: any; flashSale: any } => x !== null);
  }, [products, nowTime]);

  // Available Shop Vouchers across all shops
  const availableVouchers = useMemo(() => {
    const list: any[] = [];
    Object.entries(shopsMap).forEach(([shopId, shopData]) => {
      if (Array.isArray(shopData?.vouchers)) {
        shopData.vouchers.forEach((v: any) => {
          if (v.status === "ACTIVE") {
            list.push({
              ...v,
              shopId,
              shopName: shopData.name || shopData.shopName || "Toko Seller",
              shopLogo: shopData.logoUrl || "",
            });
          }
        });
      }
    });
    return list.slice(0, 8);
  }, [shopsMap]);

  // Nearest ongoing countdown
  const soonestOngoingEnd = useMemo(() => {
    if (ongoingItems.length === 0) return null;
    return Math.min(...ongoingItems.map((x) => x.flashSale.endTimeMs));
  }, [ongoingItems]);

  // Nearest upcoming start
  const soonestUpcomingStart = useMemo(() => {
    if (upcomingItems.length === 0) return null;
    return Math.min(...upcomingItems.map((x) => x.flashSale.startTimeMs));
  }, [upcomingItems]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />

      <main className="flex-1 max-w-screen-xl mx-auto px-4 md:px-6 pt-20 pb-24 md:pb-16 w-full space-y-6">
        {/* Hero Banner */}
        <section className="relative rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#D92D20] via-[#F04438] to-[#F79009] text-white p-6 md:p-10 shadow-lg overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/icon/fire.gif"
                alt="Flash Sale"
                className="w-5 h-5 object-contain shrink-0"
              />
              Pusat Promo & Flash Sale
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Diskon Kilat Terbesar Setiap Hari!
            </h1>
            <p className="text-sm md:text-base text-white/90 max-w-xl">
              Nikmati penawaran spesial produk digital dengan kuota terbatas. Klaim diskon merchant pilihan sekarang sebelum waktu habis.
            </p>

            {/* Countdown Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {tabFilter === "ONGOING" && soonestOngoingEnd ? (
                <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "8s" }} />
                  <span className="text-xs font-semibold text-white/90">Berakhir Dalam:</span>
                  <span className="font-mono font-black text-amber-300 text-base tracking-wider">
                    {formatCountdown(Math.max(0, Math.floor((soonestOngoingEnd - nowTime) / 1000)))}
                  </span>
                </div>
              ) : tabFilter === "UPCOMING" && soonestUpcomingStart ? (
                <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-semibold text-white/90">Dimulai Dalam:</span>
                  <span className="font-mono font-black text-emerald-300 text-base tracking-wider">
                    {formatCountdown(Math.max(0, Math.floor((soonestUpcomingStart - nowTime) / 1000)))}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute right-[-40px] top-[-40px] w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-[-50px] w-64 h-64 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        </section>

        {/* Tab Controls: Sedang Berlangsung vs Akan Datang */}
        <section className="flex items-center justify-between gap-4 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTabFilter("ONGOING")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                tabFilter === "ONGOING"
                  ? "bg-[#D92D20] text-white shadow-sm"
                  : "bg-white text-muted-foreground hover:text-foreground border border-border/70"
              )}
            >
              <Flame className={cn("w-4 h-4", tabFilter === "ONGOING" ? "fill-white" : "text-red-500")} />
              Sedang Berlangsung ({ongoingItems.length})
            </button>
            <button
              onClick={() => setTabFilter("UPCOMING")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                tabFilter === "UPCOMING"
                  ? "bg-[#00AA5B] text-white shadow-sm"
                  : "bg-white text-muted-foreground hover:text-foreground border border-border/70"
              )}
            >
              <Clock className="w-4 h-4" />
              Akan Datang ({upcomingItems.length})
            </button>
          </div>

          <Link href="/" className="text-xs font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
            Lihat Semua Produk <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Product Deals Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Card key={idx} className="border-border/80 shadow-2xs rounded-2xl overflow-hidden bg-card">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-2.5 w-full rounded-md" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (tabFilter === "ONGOING" ? ongoingItems : upcomingItems).length === 0 ? (
            <Card className="border-border/80 shadow-2xs rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 bg-white">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-2">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {tabFilter === "ONGOING"
                  ? "Belum Ada Flash Sale yang Sedang Berjalan"
                  : "Belum Ada Jadwal Flash Sale Berikutnya"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                {tabFilter === "ONGOING"
                  ? "Merchant sedang menyiapkan sesi promo berikutnya. Cek tab 'Akan Datang' atau voucher diskon di bawah!"
                  : "Penjual belum mendaftarkan sesi promo baru. Pantau terus halaman ini untuk update berkala."}
              </p>
              <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white font-bold rounded-xl text-xs mt-2">
                <Link href="/">Jelajahi Beranda</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {(tabFilter === "ONGOING" ? ongoingItems : upcomingItems).map(({ product, flashSale }) => {
                const imageUrl = product.images?.[0]?.imageUrl || "https://picsum.photos/seed/placeholder/600/600";
                const isOngoing = tabFilter === "ONGOING";
                const soldPercent = flashSale.sold > 0
                  ? Math.min(100, Math.round(((flashSale.sold) / (flashSale.quota || 1)) * 100))
                  : 0;

                return (
                  <Link key={product.id} href={`/${product.shopSlug || 'marketpoint'}/${product.slug || product.id}`}>
                    <Card className="group border-border/80 shadow-2xs rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border-[1px] h-full">
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Thumbnail */}
                        <div className="relative aspect-square w-full bg-muted/20 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Discount Badge */}
                          <div className={cn(
                            "absolute top-0 left-0 text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg shadow-xs flex items-center gap-1 z-10",
                            isOngoing ? "bg-gradient-to-r from-red-600 to-amber-500" : "bg-[#00AA5B]"
                          )}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/assets/icon/bolt.gif"
                              alt="Flash Sale"
                              className="w-3.5 h-3.5 object-contain shrink-0"
                            />
                            {flashSale.discountPercentage}% OFF
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                              {product.title}
                            </h4>

                            <div className="space-y-1 pt-1">
                              <div>
                                <PromoPriceBadge price={flashSale.discountPrice} />
                              </div>
                              <div className="text-[10px] text-muted-foreground line-through opacity-60">
                                Rp {flashSale.originalPrice.toLocaleString("id-ID")}
                              </div>
                            </div>

                            {/* Quota Bar */}
                            <div className="pt-1.5 space-y-1">
                              <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isOngoing ? "bg-gradient-to-r from-red-500 to-amber-500" : "bg-[#00AA5B]"
                                  )}
                                  style={{ width: `${soldPercent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-bold text-red-600 leading-none">
                                <span>{isOngoing ? (flashSale.remainingQuota <= 5 ? `Sisa ${flashSale.remainingQuota}!` : "Segera Habis") : "Kapasitas Terbatas"}</span>
                                <span className="text-muted-foreground text-[8px] font-medium">Terjual {flashSale.sold}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shop Info */}
                          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[100px] font-medium">{product.shopName}</span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {product.shopIsVerified && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain" />
                              )}
                              {product.shopIsOfficial && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/officials.png" alt="Official" className="w-3.5 h-3.5 object-contain" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Section: Shop Vouchers */}
        {availableVouchers.length > 0 && (
          <section className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#00AA5B]" />
                  Klaim Voucher Toko Pilihan
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gunakan kode voucher saat checkout untuk potongan harga ekstra.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableVouchers.map((voucher, idx) => (
                <Card key={idx} className="border-border/70 rounded-2xl bg-white shadow-2xs hover:shadow-sm transition-all p-3.5 flex flex-col justify-between space-y-3 border-dashed border-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground truncate">{voucher.shopName}</span>
                      <Badge variant="outline" className="text-[9px] font-bold bg-[#00AA5B]/10 text-[#00AA5B] border-[#00AA5B]/20 uppercase">
                        {voucher.type === "percentage" ? `${voucher.value}% OFF` : `POTONGAN Rp ${Number(voucher.value).toLocaleString("id-ID")}`}
                      </Badge>
                    </div>
                    <div className="text-xs font-bold text-foreground font-mono bg-muted/30 px-2 py-1 rounded-md text-center border border-border/50">
                      {voucher.code}
                    </div>
                    {voucher.minPurchase && (
                      <p className="text-[10px] text-muted-foreground">
                        Min. belanja Rp {Number(voucher.minPurchase).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>

                  <div className="text-[9px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                    <span>Exp: {voucher.expiry || "Selamanya"}</span>
                    <span className="text-[#00AA5B] font-bold">Klaim di Checkout</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <MarketBottomNav />
      <MarketFooter />
    </div>
  );
}
