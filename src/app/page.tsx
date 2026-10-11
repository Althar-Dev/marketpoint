"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Autoplay from "embla-carousel-autoplay";
import { HomeTopUpWidget } from "@/components/home-topup-widget";
import {
  Star,
  LayoutGrid,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Wallet,
  Smartphone,
  SmartphoneNfc,
  Headphones,
  Dog,
  Monitor,
  MoreVertical,
  MapPin,
  Store,
  TrendingUp,
  Gamepad2,
  Zap,
  Droplets,
  Tv,
  Film,
  Ticket,
  Flame,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { getProductActiveFlashSale, formatCountdown } from "@/lib/flash-sale";
import { PromoPriceBadge } from "@/components/promo-price-badge";

const BANNERS = [
  { id: "banner-main", imageUrl: "/assets/banner/banner.png", title: "Main Promo" },
  { id: "banner-1", imageUrl: "/assets/banner/banner1.png", title: "Promo 1" },
  { id: "banner-2", imageUrl: "/assets/banner/banner2.png", title: "Promo 2" },
  { id: "banner-3", imageUrl: "/assets/banner/banner3.png", title: "Promo 3" }
];

const QUICK_CHIPS = [
  { label: "Semua", icon: "/assets/icons/more.png", href: "/topup" },
  { label: "Pulsa & Paket Data", icon: "/assets/icons/pulsadata.png", href: "/topup?cat=pulsa" },
  { label: "Game", icon: "/assets/icons/game.png", href: "/topup?cat=game" },
  { label: "Voucher", icon: "/assets/icons/voucher.png", href: "/topup?cat=voucher" },
  { label: "E-Wallet", icon: "/assets/icons/ewallet.png", href: "/topup?cat=ewallet" },
  { label: "Listrik", icon: "/assets/icons/listrik.png", href: "/topup?cat=pln" },
  { label: "Air PDAM", icon: "/assets/icons/pdam.png", href: "/topup?cat=pdam" },
  { label: "TV Kabel", icon: "/assets/icons/tv.png", href: "/topup?q=TV" },
  { label: "Streaming", icon: "/assets/icons/stream.png", href: "/topup?q=Streaming" },
];

const MOBILE_MENU_ITEMS = [
  { label: "Pulsa & Data", icon: "/assets/icons/pulsadata.png", href: "/topup?cat=pulsa" },
  { label: "Game", icon: "/assets/icons/game.png", href: "/topup?cat=game" },
  { label: "Voucher", icon: "/assets/icons/voucher.png", href: "/topup?cat=voucher" },
  { label: "E-Wallet", icon: "/assets/icons/ewallet.png", href: "/topup?cat=ewallet" },
  { label: "Listrik", icon: "/assets/icons/listrik.png", href: "/topup?cat=pln" },
  { label: "Air PDAM", icon: "/assets/icons/pdam.png", href: "/topup?cat=pdam" },
  { label: "TV Kabel", icon: "/assets/icons/tv.png", href: "/topup?q=TV" },
  { label: "Streaming", icon: "/assets/icons/stream.png", href: "/topup?q=Streaming" },
];

const BASE_TABS = [
  { id: "foryou", label: "For You" },
  { id: "deals", label: "" },
  { id: "official", label: "Official" },
];

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState("foryou");
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [canScrollMobileLeft, setCanScrollMobileLeft] = useState(false);
  const [canScrollMobileRight, setCanScrollMobileRight] = useState(true);

  const checkMobileMenuScroll = () => {
    if (!mobileMenuRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mobileMenuRef.current;
    setCanScrollMobileLeft(scrollLeft > 8);
    setCanScrollMobileRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  const scrollMobileMenu = (direction: "left" | "right") => {
    if (!mobileMenuRef.current) return;
    const scrollAmount = direction === "left" ? -180 : 180;
    mobileMenuRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const checkTabsScroll = useCallback(() => {
    if (!tabsContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
    setCanScrollTabsLeft(scrollLeft > 6);
    setCanScrollTabsRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabsContainerRef.current) return;
    const scrollAmount = direction === "left" ? -240 : 240;
    tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    checkMobileMenuScroll();
    window.addEventListener("resize", checkMobileMenuScroll);
    return () => window.removeEventListener("resize", checkMobileMenuScroll);
  }, []);

  const db = useFirestore();
  const [products, setProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/products?categories=true");
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        setDbCategories(data.categories);
      }
    } catch (err) {
      console.warn("Gagal mengambil kategori PostgreSQL:", err);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && data.products) {
        let rawProducts = data.products;

        // Fetch real shop profiles from Firestore
        try {
          if (db) {
            const shopsSnap = await getDocs(collection(db, "shops"));
            const shopsMap: Record<string, any> = {};
            shopsSnap.forEach((docSnap) => {
              shopsMap[docSnap.id] = docSnap.data();
            });

            const extractString = (val: any): string => {
              if (!val) return "";
              if (typeof val === "string") return val;
              if (typeof val === "object") {
                if (typeof val.city === "string" && val.city) return val.city;
                if (typeof val.province === "string" && val.province) return val.province;
                if (typeof val.district === "string" && val.district) return val.district;
                if (typeof val.address === "string" && val.address) return val.address;
                if (typeof val.name === "string" && val.name) return val.name;
              }
              return "";
            };

            rawProducts = rawProducts.map((p: any) => {
              const shop = shopsMap[p.shopId];
              const realName = extractString(shop?.shopName) || extractString(shop?.name) || extractString(shop?.title) || extractString(shop?.slug);
              const fallbackName = typeof p.shopName === "string" && p.shopName && p.shopName !== "MarketPointID Seller"
                ? p.shopName
                : (p.shopId ? `Toko ${p.shopId.substring(0, 6)}` : "Toko Seller");

              const rawCity = extractString(shop?.city) || extractString(shop?.province) || extractString(shop?.location) || extractString(shop?.address) || extractString(p.shopCity);

              return {
                ...p,
                shopName: realName || fallbackName,
                shopLogoUrl: shop?.logoUrl || shop?.logo || shop?.avatar || shop?.photoUrl || p.shopLogoUrl || "",
                shopIsVerified: shop?.isVerified ?? shop?.verified ?? shop?.is_verified ?? p.shopIsVerified ?? false,
                shopIsOfficial: shop?.isOfficial ?? shop?.official ?? shop?.is_official ?? p.shopIsOfficial ?? false,
                shopCity: rawCity,
                shopFlashSales: Array.isArray(shop?.flashSales) ? shop.flashSales : [],
              };
            });
          }
        } catch (e) {
          console.warn("⚠️ Gagal mengambil profil toko dari Firestore:", e);
        }

        setProducts(rawProducts);
      }
    } catch (err) {
      console.error("Gagal mengambil produk beranda:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const activeFlashSales = useMemo(() => {
    return products
      .map((p: any) => {
        const fs = getProductActiveFlashSale(p.id, p.shopFlashSales, nowTime);
        return fs ? { product: p, flashSale: fs } : null;
      })
      .filter((item): item is { product: any; flashSale: any } => item !== null);
  }, [products, nowTime]);

  const soonestFlashSaleEnd = useMemo(() => {
    if (activeFlashSales.length === 0) return null;
    return Math.min(...activeFlashSales.map((x: any) => x.flashSale.endTimeMs));
  }, [activeFlashSales]);

  const marketTabs = useMemo(() => {
    const dynamicTabs = dbCategories
      .filter((cat) => cat.slug?.toLowerCase() !== "lainnya" && cat.name?.toLowerCase() !== "lainnya")
      .map((cat) => ({
        id: `cat-${cat.id}`,
        categoryId: cat.id,
        categorySlug: cat.slug,
        label: cat.name,
      }));
    return [...BASE_TABS, ...dynamicTabs];
  }, [dbCategories]);

  useEffect(() => {
    checkTabsScroll();
    const el = tabsContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkTabsScroll);
    }
    window.addEventListener("resize", checkTabsScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkTabsScroll);
      window.removeEventListener("resize", checkTabsScroll);
    };
  }, [checkTabsScroll, marketTabs]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "deals") {
      if (activeFlashSales.length > 0) {
        return activeFlashSales.map((x: any) => x.product);
      }
      return products.filter((p: any) => p.discountPrice && Number(p.discountPrice) > Number(p.price));
    }
    if (activeTab === "official") {
      return products.filter((p: any) => Boolean(p.shopIsOfficial));
    }
    if (activeTab.startsWith("cat-")) {
      const catId = Number(activeTab.replace("cat-", ""));
      const selectedCat = dbCategories.find((c) => c.id === catId);
      return products.filter((p: any) => {
        if (p.categoryId && Number(p.categoryId) === catId) return true;
        if (selectedCat && p.categoryName && p.categoryName.toLowerCase() === selectedCat.name.toLowerCase()) return true;
        if (selectedCat && p.categorySlug && p.categorySlug.toLowerCase() === selectedCat.slug.toLowerCase()) return true;
        return false;
      });
    }
    return products;
  }, [products, activeTab, activeFlashSales, dbCategories]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-primary/10 selection:text-primary flex flex-col">
      <MarketHeader />

      <main className="flex-1 w-full pt-16 pb-20 lg:pb-0">
        {/* Banner Carousel */}
        <section className="py-2 md:py-4 w-full overflow-hidden bg-white">
          <Carousel
            setApi={setApi}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            opts={{
              loop: true,
              align: "center",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {BANNERS.map((banner, index) => (
                <CarouselItem key={banner.id} className="pl-2 md:pl-4 basis-[92%] sm:basis-[75%] md:basis-[70%] lg:basis-[65%]">
                  <div className={cn(
                    "relative aspect-[3/1] w-full rounded-xl sm:rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-muted shadow-sm border border-border group transition-all duration-500",
                    current === index ? "opacity-100 scale-100" : "opacity-40 scale-[0.97]"
                  )}>
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer"></div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex justify-center gap-1.5 mt-3">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-1.5 transition-all duration-300 rounded-full",
                  current === i ? "w-5 bg-[#00AA5B]" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
        </section>

        {/* Mobile Menu Row (Directly to /topup hub) */}
        <section className="md:hidden relative py-3 w-full bg-white border-b border-border/40 overflow-hidden group">
          {canScrollMobileLeft && (
            <button
              onClick={() => scrollMobileMenu("left")}
              className="absolute left-1 top-[40px] -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-border shadow-md flex items-center justify-center text-foreground hover:text-[#00AA5B] active:scale-95 transition-all"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div
            ref={mobileMenuRef}
            onScroll={checkMobileMenuScroll}
            className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-3.5 pb-0.5 scroll-smooth"
          >
            {MOBILE_MENU_ITEMS.map((item, idx) => (
              <Link
                key={idx}
                href={item.href || "/topup"}
                className="flex flex-col items-center gap-1.5 group/item transition-transform active:scale-95 py-1 shrink-0 w-[68px]"
              >
                <div className="w-11 h-11 relative flex items-center justify-center bg-muted/20 rounded-xl p-1.5 border border-border/40 shadow-2xs group-hover/item:bg-[#00AA5B]/10 transition-colors">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#2E3137] text-center leading-tight whitespace-nowrap truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            ))}
            <div className="w-4 shrink-0 h-1" />
          </div>

          {canScrollMobileRight && (
            <button
              onClick={() => scrollMobileMenu("right")}
              className="absolute right-1 top-[40px] -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 border border-border shadow-md flex items-center justify-center text-foreground hover:text-[#00AA5B] active:scale-95 transition-all"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* Section: Popular Category & Top Up Widget */}
        <section className="hidden md:flex px-4 md:px-12 lg:px-20 py-4 max-w-screen-2xl mx-auto w-full">
          <Card className="border-border shadow-sm rounded-2xl p-4 md:p-6 bg-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-6">

              {/* Banner Kategori Populer */}
              <div className="flex lg:col-span-6 flex-col space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Kategori Populer</h2>
                <div className="relative h-[160px] md:h-[180px] rounded-2xl overflow-hidden bg-[#00AA5B] group cursor-pointer border border-border shadow-inner">
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center space-y-4 z-10 text-white">
                    <div className="space-y-1">
                      <p className="text-lg md:text-xl font-bold leading-tight">Yuk, belanja di STS Market</p>
                      <p className="text-[10px] md:text-xs opacity-90 font-medium max-w-[200px]">Infrastruktur lengkap untuk bisnis digital</p>
                    </div>
                    <Button variant="outline" className="w-fit bg-transparent border-white text-white hover:bg-white/10 font-bold rounded-xl h-10 px-6 text-xs transition-all">
                      Cek Sekarang
                    </Button>
                  </div>
                  <div className="absolute right-0 bottom-0 w-2/5 h-full opacity-40 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <div className="w-full h-full relative">
                      <Image
                        src="https://picsum.photos/seed/promo/400/400"
                        alt="Promo"
                        fill
                        className="object-contain object-right-bottom"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Top Up & Tagihan</h2>
                  <Link href="/topup" className="text-xs font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                    Lihat Semua
                  </Link>
                </div>

                <HomeTopUpWidget />
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
              {QUICK_CHIPS.map((chip, idx) => (
                <Link
                  key={idx}
                  href={chip.href || "/topup"}
                  className="flex items-center gap-2.5 px-3.5 h-11 rounded-xl border border-border bg-white hover:border-[#00AA5B]/30 hover:bg-[#00AA5B]/5 transition-all shrink-0 group shadow-2xs"
                >
                  <Image
                    src={chip.icon}
                    alt={chip.label}
                    width={22}
                    height={22}
                    className="w-5 h-5 object-contain transition-transform group-hover:scale-110"
                  />
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary whitespace-nowrap">{chip.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        {/* Section: Trending Products */}
        <section className="px-4 md:px-12 lg:px-20 max-w-screen-2xl mx-auto w-full">
          <div className="relative flex items-center bg-white sticky top-[64px] z-30">
            {canScrollTabsLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-2 bg-gradient-to-r from-white via-white/95 to-transparent">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollTabs("left")}
                  className="w-8 h-8 rounded-full border border-border bg-white shadow-sm hover:bg-muted"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </Button>
              </div>
            )}

            <div
              ref={tabsContainerRef}
              onScroll={checkTabsScroll}
              className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 md:gap-8 scroll-smooth"
            >
              {marketTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "py-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 relative border-b-[3px]",
                      isActive
                        ? (tab.id === 'deals' ? "text-red-600 border-red-500" : "text-[#00AA5B] border-[#00AA5B]")
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {tab.id === 'official' && (
                      <img
                        src="/assets/badge/officials.png"
                        alt="Official"
                        className="w-6 h-6 object-contain shrink-0"
                      />
                    )}
                    {tab.id === 'deals' && (
                      <div className={cn(
                        "flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full transition-all",
                        isActive
                          ? "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white font-black shadow-xs shadow-red-500/25 scale-105"
                          : "bg-red-50 hover:bg-red-100/80 text-red-600 font-bold border border-red-200"
                      )}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/icon/bolt.gif"
                          alt="Flash Sale"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <div className="flex flex-col text-[9.5px] italic font-black uppercase leading-[0.85] tracking-tight text-left">
                          <span>FLASH</span>
                          <span className="pl-2">SALE</span>
                        </div>
                      </div>
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {canScrollTabsRight && (
              <div className="pl-3 shrink-0 flex items-center z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollTabs("right")}
                  className="w-8 h-8 rounded-full border border-border bg-white shadow-sm hover:bg-muted"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </Button>
              </div>
            )}
          </div>

          {/* Flash Sale Banner in Deals Tab */}
          {activeTab === "deals" && (
            <div className="mt-4 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#FF3B30] via-[#FF5E3A] to-[#FF9500] text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/icon/fire.gif"
                      alt="Flash Sale"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    FLASH SALE HARI INI
                  </span>
                  <span className="text-white/80 text-xs font-semibold hidden sm:inline">•</span>
                  <span className="text-white/90 text-xs font-medium hidden sm:inline">Diskon Spesial Terbatas</span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold tracking-tight">
                  Serbu Produk Digital Pilihan
                </h3>
                <p className="text-xs text-white/90 max-w-md">
                  Harga promo eksklusif dengan kuota terbatas dari merchant resmi MarketPointID.
                </p>
              </div>

              {soonestFlashSaleEnd && (
                <div className="flex items-center gap-2 bg-black/35 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shrink-0 z-10">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <div className="text-xs font-bold text-white/90">
                    Berakhir: <span className="font-black text-amber-300 font-mono text-sm ml-1">{formatCountdown(Math.max(0, Math.floor((soonestFlashSaleEnd - nowTime) / 1000)))}</span>
                  </div>
                </div>
              )}

              {/* Decorative Background Accents */}
              <div className="absolute right-[-20px] top-[-30px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute left-[-20px] bottom-[-20px] w-36 h-36 bg-black/10 rounded-full blur-xl pointer-events-none" />
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4 pt-4 pb-16">
            {isLoadingProducts ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="border-border/80 shadow-2xs rounded-xl overflow-hidden bg-card flex flex-col border-[1px]">
                  <CardContent className="p-0 flex flex-col h-full">
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <div className="p-2 sm:p-2.5 space-y-1.5">
                      <Skeleton className="h-3 w-3/4 rounded-md" />
                      <Skeleton className="h-3.5 w-1/2 rounded-md" />
                      <Skeleton className="h-2.5 w-1/3 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border p-8">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Belum Ada Produk Ditampilkan</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {activeTab === "deals"
                      ? "Saat ini belum ada sesi Flash Sale aktif. Nantikan penawaran spesial berikutnya!"
                      : activeTab === "official"
                        ? "Belum ada produk dari Official Store saat ini."
                        : activeTab.startsWith("cat-")
                          ? `Belum ada produk untuk kategori ${dbCategories.find((c) => `cat-${c.id}` === activeTab)?.name || "ini"}.`
                          : "Produk digital yang ditambahkan oleh penjual akan otomatis muncul di sini secara realtime."}
                  </p>
                </div>
                <Link href="/my-shop/products">
                  <Button size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white font-bold rounded-xl text-xs">
                    Mulai Jual Produk
                  </Button>
                </Link>
              </div>
            ) : (
              filteredProducts.map((product: any) => {
                const flashSaleInfo = getProductActiveFlashSale(product.id, product.shopFlashSales, nowTime);
                const isFlashSale = !!flashSaleInfo;
                const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png";
                const price = isFlashSale ? flashSaleInfo.discountPrice : Number(product.price || 0);
                const originalPrice = isFlashSale ? flashSaleInfo.originalPrice : (product.discountPrice ? Number(product.discountPrice) : null);
                const discountPercent = isFlashSale
                  ? `${flashSaleInfo.discountPercentage}%`
                  : (originalPrice && originalPrice > price
                    ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}%`
                    : null);
                const rating = Number(product.ratingAvg || 0) > 0 ? Number(product.ratingAvg).toFixed(1) : "0.0";
                const soldText = product.salesCount ? `${product.salesCount} terjual` : "0 terjual";
                const shopName = typeof product.shopName === "string"
                  ? product.shopName
                  : (product.shopName && typeof product.shopName === "object" ? (product.shopName.name || product.shopName.shopName || "Toko Seller") : "Toko Seller");
                const shopLogoUrl = typeof product.shopLogoUrl === "string" ? product.shopLogoUrl : "";
                const isVerified = Boolean(product.shopIsVerified);
                const isOfficial = Boolean(product.shopIsOfficial);
                const shopCity = typeof product.shopCity === "string"
                  ? product.shopCity
                  : (product.shopCity && typeof product.shopCity === "object" ? (product.shopCity.city || product.shopCity.province || "") : "");

                return (
                  <Link key={product.id} href={`/${product.shopSlug || 'marketpoint'}/${product.slug || product.id}`}>
                    <Card className="group border-border/70 shadow-2xs rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border-[1px] h-full">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative aspect-square w-full bg-muted/20 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {isFlashSale ? (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-br-lg shadow-xs flex items-center gap-0.5 z-10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/assets/icon/bolt.gif"
                                alt="Flash Sale"
                                className="w-3.5 h-3.5 object-contain shrink-0"
                              />
                              {flashSaleInfo.discountPercentage}%
                            </div>
                          ) : discountPercent ? (
                            <div className="absolute top-0 left-0 bg-[#FF5E5E] text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-xs z-10">
                              {discountPercent}
                            </div>
                          ) : null}
                        </div>

                        <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                              {product.title}
                            </h4>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                {isFlashSale ? (
                                  <PromoPriceBadge price={price} />
                                ) : (
                                  <span className="text-xs sm:text-sm font-bold text-[#000000]">
                                    Rp {price.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                              {!isFlashSale && originalPrice && originalPrice > price && (
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                                  Rp {originalPrice.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1">
                              <Star className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", Number(rating) > 0 ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-300 fill-slate-200")} />
                              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                                {rating} <span className="opacity-40">|</span> {soldText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                {shopLogoUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={shopLogoUrl}
                                    alt={String(shopName)}
                                    className="w-[18px] h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                                  />
                                ) : (
                                  <div className="w-[18px] h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                    <Store className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[70px] sm:max-w-[90px]">
                                  {String(shopName)}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {isVerified && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src="/assets/badge/verified.png"
                                      alt="Verified"
                                      className="w-[17px] h-[17px] object-contain shrink-0"
                                    />
                                  )}
                                  {isOfficial && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src="/assets/badge/officials.png"
                                      alt="Official"
                                      className="w-[17px] h-[17px] object-contain shrink-0"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      <MarketFooter />
    </div>
  );
}
