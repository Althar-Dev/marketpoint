"use client";

import { useState, useEffect, useMemo } from "react";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  ShieldCheck,
  ShoppingBag,
  Store,
  Search,
  BadgeCheck,
  Award,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";

type SortKey = "default" | "rating" | "sales" | "price_asc" | "price_desc";

export default function OfficialPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const [products, setProducts] = useState<any[]>([]);
  const [officialShops, setOfficialShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [nowTime, setNowTime] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

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
              sMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
            });
          } catch (e) {
            console.warn("Gagal mengambil profil toko:", e);
          }
        }

        rawProducts = rawProducts.map((p: any) => {
          const shop = sMap[p.shopId];
          const isVerified = Boolean(
            shop?.verified || shop?.isVerified || shop?.is_verified || shop?.subscription?.planId === "pro" || shop?.subscription?.planId === "prime" || shop?.subscription?.planId === "admin" || p.shopIsVerified
          );
          const isOfficial = Boolean(
            shop?.official || shop?.isOfficial || shop?.is_official || shop?.subscription?.planId === "prime" || shop?.subscription?.planId === "admin" || shop?.slug === "marketpoint" || p.shopSlug === "marketpoint" || p.shopIsOfficial
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

        const officialProducts = rawProducts.filter(
          (p: any) => p.shopIsOfficial || p.shopIsVerified
        );

        setProducts(officialProducts);

        const shopsById: Record<string, any> = {};
        officialProducts.forEach((p: any) => {
          if (!shopsById[p.shopId]) {
            shopsById[p.shopId] = {
              id: p.shopId,
              name: p.shopName,
              slug: p.shopSlug,
              logoUrl: p.shopLogoUrl,
              isVerified: p.shopIsVerified,
              isOfficial: p.shopIsOfficial,
              city: p.shopCity,
              productCount: 0,
            };
          }
          shopsById[p.shopId].productCount++;
        });
        setOfficialShops(Object.values(shopsById));
      } catch (err) {
        console.error("Gagal mengambil produk official:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedShop !== "all") list = list.filter((p) => p.shopId === selectedShop);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.shopName?.toLowerCase().includes(q)
      );
    }
    switch (sortKey) {
      case "rating": list.sort((a, b) => Number(b.ratingAvg || 0) - Number(a.ratingAvg || 0)); break;
      case "sales": list.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0)); break;
      case "price_asc": list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0)); break;
      case "price_desc": list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0)); break;
    }
    return list;
  }, [products, selectedShop, searchQuery, sortKey]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <MarketHeader />

      <main className="flex-1 pt-16 pb-24 lg:pb-12">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-border/70">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 border border-[#00AA5B]/20 flex items-center justify-center shrink-0 p-1.5 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/badge/officials.png"
                  alt="Official Store"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A]">Official Store</h1>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/badge/officials.png"
                    alt="Official"
                    className="w-4 h-4 object-contain shrink-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Toko resmi terverifikasi & bergaransi MarketPointID
                </p>
              </div>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { img: "/assets/badge/officials.png", label: "100% Original" },
                { img: "/assets/badge/verified.png", label: "Terverifikasi" },
                { icon: Award, label: "Garansi Resmi" },
                { icon: ShieldCheck, label: "Transaksi Aman" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#00AA5B]/25 bg-[#00AA5B]/5 text-[10px] font-semibold text-[#00AA5B]"
                >
                  {b.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.img} alt={b.label} className="w-3.5 h-3.5 object-contain shrink-0" />
                  ) : b.icon ? (
                    <b.icon className="w-3 h-3 text-[#00AA5B] shrink-0" />
                  ) : null}
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-5 space-y-5">

          {/* ── Shop Filter Chips ───────────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
              Pilih Toko
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {/* All */}
              <button
                onClick={() => setSelectedShop("all")}
                className={cn(
                  "flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                  selectedShop === "all"
                    ? "border-[#00AA5B] bg-[#00AA5B] text-white shadow-sm"
                    : "border-border bg-white text-muted-foreground hover:border-[#00AA5B]/50 hover:text-foreground"
                )}
              >
                <Store className="w-3.5 h-3.5" />
                Semua
              </button>

              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="shrink-0 h-9 w-28 rounded-xl" />
                  ))
                : officialShops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() =>
                        setSelectedShop(shop.id === selectedShop ? "all" : shop.id)
                      }
                      className={cn(
                        "flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all max-w-[200px]",
                        selectedShop === shop.id
                          ? "border-[#00AA5B] bg-[#00AA5B] text-white shadow-sm"
                          : "border-border bg-white text-muted-foreground hover:border-[#00AA5B]/50 hover:text-foreground"
                      )}
                    >
                      {shop.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={shop.logoUrl}
                          alt={shop.name}
                          className="w-5 h-5 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-white/30 flex items-center justify-center shrink-0">
                          <Store className="w-3 h-3" />
                        </div>
                      )}
                      <span className="truncate">{shop.name}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {shop.isVerified && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src="/assets/badge/verified.png"
                            alt="Verified"
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                        )}
                        {shop.isOfficial && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src="/assets/badge/officials.png"
                            alt="Official"
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                        )}
                      </div>
                    </button>
                  ))}
            </div>
          </section>

          {/* ── Search & Sort ───────────────────────────────────────────── */}
          <section className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari produk official..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#00AA5B]/30 focus:border-[#00AA5B] transition-all"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 px-3 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#00AA5B]/30 focus:border-[#00AA5B] transition-all cursor-pointer"
              >
                <option value="default">Default</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="sales">Terlaris</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>
          </section>

          {/* ── Count row ──────────────────────────────────────────────── */}
          {!loading && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredProducts.length}</span>{" "}
                produk ditemukan
                {selectedShop !== "all" && (
                  <button
                    onClick={() => setSelectedShop("all")}
                    className="ml-2 text-[#00AA5B] font-semibold hover:underline"
                  >
                    Hapus filter
                  </button>
                )}
              </p>
            </div>
          )}

          {/* ── Product Grid ────────────────────────────────────────────── */}
          <section className="pb-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <Card key={idx} className="rounded-xl overflow-hidden bg-white border-border/70">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-2.5 space-y-1.5">
                      <Skeleton className="h-3 w-3/4 rounded" />
                      <Skeleton className="h-3.5 w-1/2 rounded" />
                      <Skeleton className="h-2.5 w-2/3 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00AA5B]/10 flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-[#00AA5B]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk official"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? `Tidak ada yang cocok dengan "${searchQuery}"`
                      : "Cek kembali nanti ya!"}
                  </p>
                </div>
                <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white rounded-xl text-xs font-semibold">
                  <Link href="/">Ke Beranda</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} nowTime={nowTime} />
                ))}
              </div>
            )}
          </section>

          {/* ── Why Official Store ───────────────────────────────────────── */}
          {!loading && (
            <section className="border-t border-border/60 pt-8 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Produk Terjamin",
                    desc: "Setiap produk telah dikurasi dan diverifikasi oleh tim MarketPointID.",
                    accent: "text-[#00AA5B] bg-[#00AA5B]/8",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Identitas Terverifikasi",
                    desc: "Identitas penjual sudah divalidasi, transaksi jadi lebih aman.",
                    accent: "text-blue-500 bg-blue-50",
                  },
                  {
                    icon: Award,
                    title: "Garansi Resmi",
                    desc: "After-sales support langsung dari penyedia produk resmi.",
                    accent: "text-amber-500 bg-amber-50",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Transaksi Aman",
                    desc: "Dana ditahan escrow hingga produk berhasil diterima pembeli.",
                    accent: "text-purple-500 bg-purple-50",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 items-start">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.accent)}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Link href="/about">
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1.5 font-semibold hover:border-[#00AA5B] hover:text-[#00AA5B]">
                    Pelajari selengkapnya
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
