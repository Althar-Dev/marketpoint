"use client";

import { useState, useEffect, useMemo } from "react";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Flame,
  Clock,
  ShoppingBag,
  Tag,
  ChevronRight,
  Ticket,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getProductActiveFlashSale,
  getProductUpcomingFlashSale,
  formatCountdown,
} from "@/lib/flash-sale";
import { ProductCard } from "@/components/product-card";

export default function DealsPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const [products, setProducts] = useState<any[]>([]);
  const [shopsMap, setShopsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<"ONGOING" | "UPCOMING">("ONGOING");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

        // Decorate products with shop data
        rawProducts = rawProducts.map((p: any) => {
          const shop = sMap[p.shopId];
          const isVerified = Boolean(
            shop?.isVerified ?? shop?.verified ?? shop?.is_verified ?? p.shopIsVerified ?? false
          );
          const isOfficial = Boolean(
            shop?.isOfficial ?? shop?.official ?? shop?.is_official ?? (shop?.slug === "marketpoint" || p.shopSlug === "marketpoint") ?? p.shopIsOfficial ?? false
          );
          return {
            ...p,
            shopName: shop?.name || shop?.shopName || p.shopName || "Toko Seller",
            shopSlug: shop?.slug || p.shopSlug || p.shopId,
            shopLogoUrl: shop?.logoUrl || shop?.logo || shop?.avatar || shop?.photoUrl || p.shopLogoUrl || "",
            shopIsVerified: isVerified,
            shopIsOfficial: isOfficial,
            shopFlashSales: Array.isArray(shop?.flashSales) ? shop.flashSales : [],
            shopCity: shop?.city || shop?.province || p.shopCity || "",
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
        const fs = getProductActiveFlashSale(String(p.id), p.shopFlashSales, nowTime);
        return fs ? { product: p, flashSale: fs } : null;
      })
      .filter((x): x is { product: any; flashSale: any } => x !== null);
  }, [products, nowTime]);

  // Extract all upcoming flash sales
  const upcomingItems = useMemo(() => {
    return products
      .map((p) => {
        const fs = getProductUpcomingFlashSale(String(p.id), p.shopFlashSales, nowTime);
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

  const activeCountdown =
    tabFilter === "ONGOING" ? soonestOngoingEnd : soonestUpcomingStart;

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-body text-[#212121]">
      <MarketHeader />

      <main className="flex-1 pt-16 pb-24 lg:pb-12">
        {/* ── Compact Hero Strip (Consistent with /official) ──────────── */}
        <section className="bg-white border-b border-border/70">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shrink-0 p-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/icon/fire.gif"
                  alt="Flash Sale"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                    Pusat Promo & Flash Sale
                  </h1>
                  <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Diskon Kilat
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Penawaran spesial produk digital harga promo dengan kuota terbatas
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            {activeCountdown && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold self-start sm:self-auto shadow-2xs">
                <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
                <span>{tabFilter === "ONGOING" ? "Berakhir dalam:" : "Dimulai dalam:"}</span>
                <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-red-600">
                  {formatCountdown(
                    Math.max(0, Math.floor((activeCountdown - nowTime) / 1000))
                  )}
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-5 space-y-5">
          {/* ── Segmented Tab Controls ──────────────────────────────────── */}
          <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center p-1 bg-white border border-border rounded-xl shadow-2xs w-full sm:w-auto">
              <button
                onClick={() => setTabFilter("ONGOING")}
                className={cn(
                  "flex-1 sm:flex-initial py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  tabFilter === "ONGOING"
                    ? "bg-[#D92D20] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Flame
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    tabFilter === "ONGOING" ? "fill-white" : "text-red-500"
                  )}
                />
                <span>Berlangsung</span>
                <span className="text-[10px] opacity-80 font-normal">
                  ({ongoingItems.length})
                </span>
              </button>

              <button
                onClick={() => setTabFilter("UPCOMING")}
                className={cn(
                  "flex-1 sm:flex-initial py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  tabFilter === "UPCOMING"
                    ? "bg-[#00AA5B] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Akan Datang</span>
                <span className="text-[10px] opacity-80 font-normal">
                  ({upcomingItems.length})
                </span>
              </button>
            </div>
          </section>

          {/* ── Product Deals Grid ──────────────────────────────────────── */}
          <section className="pb-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <Card
                    key={idx}
                    className="rounded-xl overflow-hidden bg-white border-border/70"
                  >
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-2.5 space-y-1.5">
                      <Skeleton className="h-3 w-3/4 rounded" />
                      <Skeleton className="h-3.5 w-1/2 rounded" />
                      <Skeleton className="h-2.5 w-2/3 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (tabFilter === "ONGOING" ? ongoingItems : upcomingItems).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center bg-white rounded-2xl border border-border/70 shadow-2xs p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tabFilter === "ONGOING"
                      ? "Belum Ada Flash Sale yang Sedang Berjalan"
                      : "Belum Ada Jadwal Flash Sale Berikutnya"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {tabFilter === "ONGOING"
                      ? "Merchant sedang menyiapkan sesi promo berikutnya. Cek tab 'Akan Datang' atau voucher diskon di bawah!"
                      : "Penjual belum mendaftarkan sesi promo baru. Pantau terus halaman ini untuk update berkala."}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#00AA5B] hover:bg-[#009650] text-white rounded-xl text-xs font-semibold mt-1"
                >
                  <Link href="/">Jelajahi Beranda</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                {(tabFilter === "ONGOING" ? ongoingItems : upcomingItems).map(
                  ({ product }) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      nowTime={nowTime}
                      showUpcomingBadge={tabFilter === "UPCOMING"}
                    />
                  )
                )}
              </div>
            )}
          </section>

          {/* ── Section: Shop Vouchers ───────────────────────────────────── */}
          {availableVouchers.length > 0 && (
            <section className="border-t border-border/60 pt-6 space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#00AA5B]" />
                  Klaim Voucher Toko Pilihan
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Salin kode voucher untuk mendapatkan potongan harga ekstra saat checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableVouchers.map((voucher, idx) => {
                  const isCopied = copiedCode === voucher.code;
                  const hasMinPurchase =
                    Boolean(voucher.minPurchase) && Number(voucher.minPurchase) > 0;

                  return (
                    <Card
                      key={idx}
                      className="border-border/70 rounded-xl bg-white shadow-2xs hover:shadow-sm transition-all p-3.5 flex flex-col justify-between gap-3 border-dashed border-[1.5px]"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-muted-foreground truncate">
                            {voucher.shopName}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold bg-[#00AA5B]/10 text-[#00AA5B] border-[#00AA5B]/20 uppercase shrink-0"
                          >
                            {voucher.type === "percentage"
                              ? `${voucher.value}% OFF`
                              : `Rp ${Number(voucher.value).toLocaleString("id-ID")}`}
                          </Badge>
                        </div>

                        {/* Voucher Code Box */}
                        <div className="flex items-center justify-between bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/60">
                          <span className="text-xs font-bold text-foreground font-mono tracking-wider">
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => handleCopyVoucher(voucher.code)}
                            className="text-[10px] font-bold text-[#00AA5B] hover:text-[#009650] flex items-center gap-1 transition-colors"
                            title="Salin kode"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-[#00AA5B]" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>

                        {hasMinPurchase && (
                          <p className="text-[10px] text-muted-foreground">
                            Min. belanja Rp{" "}
                            {Number(voucher.minPurchase).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span>Exp: {voucher.expiry || "Selamanya"}</span>
                        <span className="text-[#00AA5B] font-semibold">Gunakan</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
