"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Store,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  BarChart3,
  Star,
  ChevronRight,
  Crown,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"products" | "shops">("products");
  const [realShops, setRealShops] = useState<any[]>([]);
  const [realProducts, setRealProducts] = useState<any[]>([]);

  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
    // Fetch products
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setRealProducts(data.products);
        }
      })
      .catch(() => {});

    // Fetch shops
    if (db) {
      getDocs(collection(db, "shops"))
        .then((snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRealShops(docs);
        })
        .catch(() => {});
    }
  }, [db]);

  if (!mounted) return null;

  const stats = [
    {
      label: "Total Pengguna",
      value: "12,480",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-[#00AA5B]",
      bg: "bg-green-50"
    },
    {
      label: "Toko Aktif",
      value: realShops.length > 0 ? String(realShops.length) : "842",
      change: "+4.2%",
      trend: "up",
      icon: Store,
      color: "text-[#00AA5B]",
      bg: "bg-green-50"
    },
    {
      label: "Volume Transaksi",
      value: "Rp 1.45M",
      change: "+8.4%",
      trend: "up",
      icon: ShoppingBag,
      color: "text-[#00AA5B]",
      bg: "bg-green-50"
    },
    {
      label: "Dispute Aktif",
      value: "14",
      change: "-5",
      trend: "up",
      icon: ShieldAlert,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
  ];

  // Category Distribution Analytics Data
  const categories = [
    { name: "Pulsa & Paket Data", percent: 38, count: "4,742 tx", color: "bg-[#00AA5B]" },
    { name: "Game & Voucher", percent: 27, count: "3,369 tx", color: "bg-blue-500" },
    { name: "E-Wallet & Top-Up", percent: 18, count: "2,246 tx", color: "bg-purple-500" },
    { name: "Listrik PLN & PDAM", percent: 11, count: "1,372 tx", color: "bg-amber-500" },
    { name: "TV & Streaming", percent: 6, count: "751 tx", color: "bg-slate-400" },
  ];

  // Best Selling Products List
  const topProducts = realProducts.length > 0 ? realProducts.slice(0, 4) : [
    { id: "1", title: "Mobile Legends 86 Diamonds Instant", category: "Game", salesCount: 1240, price: 21500, ratingAvg: 4.9, image: "/assets/icons/game.png" },
    { id: "2", title: "Pulsa Telkomsel 50.000 Reguler", category: "Pulsa & Data", salesCount: 980, price: 50250, ratingAvg: 5.0, image: "/assets/icons/pulsadata.png" },
    { id: "3", title: "Saldo GoPay Customer 100.000", category: "E-Wallet", salesCount: 820, price: 100500, ratingAvg: 4.8, image: "/assets/icons/ewallet.png" },
    { id: "4", title: "Token Listrik PLN 50.000 PRABAYAR", category: "Listrik", salesCount: 650, price: 50200, ratingAvg: 4.9, image: "/assets/icons/listrik.png" },
  ];

  // Top Merchant List
  const topShops = realShops.length > 0 ? realShops.slice(0, 4) : [
    { name: "MarketPoint Official", slug: "marketpoint", sales: "3,420 tx", rating: 5.0, isVerified: true, isOfficial: true, logoUrl: "/assets/img/logo.png" },
    { name: "DevX Studio Store", slug: "devx-studio", sales: "1,850 tx", rating: 4.9, isVerified: true, isOfficial: false, logoUrl: "" },
    { name: "Althar Soft Digital", slug: "althar-soft", sales: "1,240 tx", rating: 4.8, isVerified: true, isOfficial: false, logoUrl: "" },
    { name: "STS Global Hub", slug: "stslabs", sales: "920 tx", rating: 4.9, isVerified: false, isOfficial: false, logoUrl: "" },
  ];

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121]">Dashboard Platform Admin</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Ringkasan performa penjualan, kategori populer, dan pergerakan merchant MarketPoint.</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden group">
            <CardContent className="p-3.5 md:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-medium",
                  stat.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-2 h-2 md:w-2.5 md:h-2.5" /> : <ArrowDownRight className="w-2 h-2 md:w-2.5 md:h-2.5" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-sm md:text-lg font-bold text-[#212121] tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section (Opsi 3): Category Insights & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">

        {/* Category Insights (Left 5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] md:text-[12px] font-bold flex items-center gap-2 text-[#212121]">
                <BarChart3 className="w-4 h-4 text-[#00AA5B]" />
                Ringkasan Kategori Terlaris
              </CardTitle>
              <span className="text-[9px] font-bold text-muted-foreground bg-white border border-border px-2 py-0.5 rounded-full">
                Bulan Ini
              </span>
            </CardHeader>
            <CardContent className="p-4 md:p-5 space-y-4 flex-1 flex flex-col justify-center">
              {categories.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] md:text-[11px]">
                    <span className="font-bold text-[#2E3137]">{cat.name}</span>
                    <span className="font-bold text-muted-foreground">{cat.percent}% <span className="text-[9px] opacity-70">({cat.count})</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", cat.color)} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[10px] md:text-[11px] font-bold text-muted-foreground">
                <span>Total Estimasi Transaksi</span>
                <span className="text-[#00AA5B] font-black text-xs">12,480 Transaksi</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers: Products / Merchants (Right 7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-3 md:p-4 border-b border-border/50 bg-slate-50/50 flex flex-row items-center justify-between gap-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                <button
                  onClick={() => setActiveRightTab("products")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all cursor-pointer",
                    activeRightTab === "products" ? "bg-white text-[#00AA5B] shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Produk Terlaris
                </button>
                <button
                  onClick={() => setActiveRightTab("shops")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all cursor-pointer",
                    activeRightTab === "shops" ? "bg-white text-[#00AA5B] shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Crown className="w-3.5 h-3.5" />
                  Toko Top Merchant
                </button>
              </div>

              <Link
                href={activeRightTab === "products" ? "/admin/products" : "/admin/shops"}
                className="text-[9px] md:text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5"
              >
                Kelola <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>

            <CardContent className="p-0 flex-1">
              {activeRightTab === "products" ? (
                <div className="divide-y divide-border/50">
                  {topProducts.map((prod: any, idx: number) => {
                    const price = Number(prod.price || 0);
                    const sales = prod.salesCount || (1240 - idx * 220);
                    const prodImage = prod.image || (prod.images && prod.images.length > 0 ? prod.images[0].imageUrl : "");
                    const rankBadgeColor = idx === 0 ? "bg-amber-100 text-amber-700 border-amber-300" :
                                          idx === 1 ? "bg-slate-200 text-slate-700 border-slate-300" :
                                          idx === 2 ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <div key={prod.id || idx} className="flex items-center justify-between p-3 md:p-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Badge */}
                          <div className={cn("w-6 h-6 rounded-full border text-[10px] font-black flex items-center justify-center shrink-0", rankBadgeColor)}>
                            #{idx + 1}
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-slate-100 relative overflow-hidden border border-border/60 shrink-0 flex items-center justify-center">
                            {prodImage ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={prodImage} alt={prod.title} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] md:text-xs font-bold text-[#2E3137] truncate max-w-[180px] sm:max-w-[240px] md:max-w-[280px]">
                              {prod.title}
                            </p>
                            <p className="text-[9px] font-medium text-muted-foreground">
                              {prod.category || "Digital"} • Rp {price.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <p className="text-[11px] font-black text-[#00AA5B]">{sales.toLocaleString('id-ID')} terjual</p>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-amber-500 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{Number(prod.ratingAvg || 4.9).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {topShops.map((shop: any, idx: number) => {
                    const shopName = shop.shopName || shop.name || "Toko Seller";
                    const shopSlug = shop.slug || shop.id || "shop";
                    const salesText = shop.sales || `${1850 - idx * 300} tx`;
                    const shopLogo = shop.logoUrl || shop.photoURL || shop.logo || shop.avatar;

                    const isVerified = Boolean(shop.isVerified ?? shop.verified ?? shop.is_verified ?? true);
                    const isOfficial = Boolean(shop.isOfficial ?? shop.official ?? shop.is_official ?? shop.isOfficialStore ?? (shop.slug === "marketpoint" || shop.id === "marketpoint" || true));

                    const rankBadgeColor = idx === 0 ? "bg-amber-100 text-amber-700 border-amber-300" :
                                          idx === 1 ? "bg-slate-200 text-slate-700 border-slate-300" :
                                          idx === 2 ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <div key={shop.id || idx} className="flex items-center justify-between p-3 md:p-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Badge */}
                          <div className={cn("w-6 h-6 rounded-full border text-[10px] font-black flex items-center justify-center shrink-0", rankBadgeColor)}>
                            #{idx + 1}
                          </div>

                          {/* Full Cover Shop Logo */}
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-border/70 shrink-0 relative bg-muted/20 flex items-center justify-center">
                            {shopLogo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={shopLogo} alt={shopName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-black flex items-center justify-center">
                                {shopName.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] md:text-xs font-bold text-[#2E3137] truncate">{shopName}</span>
                              {isVerified && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain shrink-0" />
                              )}
                              {isOfficial && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/officials.png" alt="Official Store" className="w-3.5 h-3.5 object-contain shrink-0" />
                              )}
                            </div>
                            <p className="text-[9px] font-medium text-muted-foreground">@{shopSlug}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <p className="text-[11px] font-black text-[#00AA5B]">{salesText}</p>
                            <div className="flex items-center justify-end gap-1 text-[9px] text-amber-500 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{Number(shop.rating || 4.9).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Global Catalog Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col items-center text-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-border/50">
            <Database className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-[11px] md:text-[12px] font-bold text-[#212121]">Monitoring Katalog Global</h3>
          <p className="text-[9px] md:text-[10px] text-muted-foreground max-w-xs leading-relaxed font-medium">
            Pantau semua aset digital yang diunggah oleh merchant untuk memastikan kepatuhan terhadap kebijakan platform.
          </p>
          <Link href="/admin/products">
            <button className="text-[9px] md:text-[10px] font-bold text-[#00AA5B] px-3.5 py-1.5 rounded-lg border border-green-200 bg-white hover:bg-green-50 transition-all cursor-pointer">
              Review Produk Baru
            </button>
          </Link>
        </Card>

        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col items-center text-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-border/50">
            <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-[11px] md:text-[12px] font-bold text-[#212121]">Resolusi Sengketa</h3>
          <p className="text-[9px] md:text-[10px] text-muted-foreground max-w-xs leading-relaxed font-medium">
            Terdapat <span className="text-orange-600 font-bold">14 kasus</span> yang membutuhkan intervensi admin untuk mempercepat proses pencairan dana.
          </p>
          <Link href="/admin/disputes">
            <button className="text-[9px] md:text-[10px] font-bold text-[#00AA5B] px-3.5 py-1.5 rounded-lg border border-green-200 bg-white hover:bg-green-50 transition-all cursor-pointer">
              Buka Pusat Resolusi
            </button>
          </Link>
        </Card>
      </div>

    </main>
  );
}
