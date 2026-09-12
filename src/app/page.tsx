"use client";

import { useState, useEffect } from "react";
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
import {
  Star,
  LayoutGrid,
  CheckCircle2,
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
  TrendingUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

const BANNERS = [
  { id: "banner-main", imageUrl: "/assets/banner/banner.png", title: "Main Promo" },
  { id: "banner-1", imageUrl: "/assets/banner/banner1.png", title: "Promo 1" },
  { id: "banner-2", imageUrl: "/assets/banner/banner2.png", title: "Promo 2" },
  { id: "banner-3", imageUrl: "/assets/banner/banner3.png", title: "Promo 3" }
];

const QUICK_CHIPS = [
  { label: "Kategori", icon: LayoutGrid },
  { label: "Handphone & Tablet", icon: Smartphone },
  { label: "Top-Up & Tagihan", icon: SmartphoneNfc },
  { label: "Elektronik", icon: Headphones },
  { label: "Perawatan Hewan", icon: Dog },
  { label: "Keuangan", icon: Wallet },
  { label: "Komputer & Laptop", icon: Monitor },
];

const MOBILE_MENU_ITEMS = [
  { label: "Pulsa & Data", icon: "/assets/icons/pulsadata.png" },
  { label: "Game", icon: "/assets/icons/game.png" },
  { label: "E-Wallet", icon: "/assets/icons/ewallet.png" },
  { label: "Listrik", icon: "/assets/icons/listrik.png" },
  { label: "Air PDAM", icon: "/assets/icons/pdam.png" },
];

const MARKET_TABS = [
  { id: "foryou", label: "For You" },
  { id: "weekend", label: "" },
  { id: "mall", label: "Mall" },
  { id: "digital", label: "Digital" },
  { id: "elektronik", label: "Elektronik" },
  { id: "gadget", label: "Handphone & Gadget" },
  { id: "fashion", label: "Fashion" },
  { id: "otomotif", label: "Otomotif" },
  { id: "harian", label: "Kebutuhan Harian" },
];

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState("foryou");
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const db = useFirestore();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

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
              const fallbackName = typeof p.shopName === "string" && p.shopName && p.shopName !== "MarketPoint Seller"
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
                    "relative aspect-[2.8/1] sm:aspect-[3.2/1] md:aspect-[3.5/1] w-full rounded-xl sm:rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-muted shadow-sm border border-border group transition-all duration-500",
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

        {/* Mobile Menu Grid (Hidden on Desktop) */}
        <section className="lg:hidden px-3 py-4 w-full bg-white border-b border-border/40">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {MOBILE_MENU_ITEMS.map((item, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95 py-1"
              >
                <div className="w-10 h-10 relative flex items-center justify-center bg-muted/20 rounded-xl p-1 border border-border/40 shadow-2xs">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#2E3137] text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
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
                  <Link href="#" className="text-xs font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                    Lihat Semua
                  </Link>
                </div>

                <Card className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm flex-1">
                  <Tabs defaultValue="pulsa" className="w-full h-full flex flex-col">
                    <div className="w-full overflow-x-auto no-scrollbar border-b border-border bg-white px-2">
                      <TabsList className="bg-transparent h-12 w-full p-0 justify-between items-center rounded-none border-none">
                        <div className="flex">
                          <TabsTrigger value="pulsa" className="px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs">Pulsa</TabsTrigger>
                          <TabsTrigger value="paket-data" className="px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs">Paket Data</TabsTrigger>
                          <TabsTrigger value="listrik" className="px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs">Listrik PLN</TabsTrigger>
                          <TabsTrigger value="roaming" className="px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs">Roaming</TabsTrigger>
                        </div>
                        <button className="p-2 hover:bg-muted rounded-full transition-colors mr-2">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </TabsList>
                    </div>

                    <TabsContent value="pulsa" className="p-6 mt-0 flex-1 flex flex-col justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nomor Telepon</Label>
                          <div className="relative">
                            <Input placeholder="088976577650" className="h-11 rounded-xl bg-muted/20 border-border text-sm font-bold pr-14" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">STS NODE</span>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-5 space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nominal</Label>
                          <Select defaultValue="pilih">
                            <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border font-bold text-sm">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="pilih" className="text-xs">Pilih Nominal...</SelectItem>
                              <SelectItem value="50" className="text-xs">50rb - Transaksi Instan</SelectItem>
                              <SelectItem value="100" className="text-xs">100rb - Transaksi Instan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Button className="w-full h-11 rounded-xl bg-[#E5E7E9] text-muted-foreground hover:bg-[#E5E7E9] font-bold text-xs shadow-none cursor-not-allowed">
                            Beli
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-3 px-4 h-11 rounded-xl border border-border bg-white hover:border-[#00AA5B]/30 hover:bg-[#00AA5B]/5 transition-all shrink-0 group shadow-sm"
                >
                  <chip.icon className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary whitespace-nowrap">{chip.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </section>

        {/* Section: Trending Products */}
        <section className="px-4 md:px-12 lg:px-20 max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-border bg-white sticky top-[64px] z-30">
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 md:gap-8">
              {MARKET_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "py-4 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap flex items-center gap-2 relative",
                      isActive
                        ? "text-[#00AA5B] border-[#00AA5B]"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {tab.id === 'mall' && (
                      <div className="w-3.5 h-3.5 bg-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                    {tab.id === 'weekend' && (
                      <div className={cn(
                        "flex items-center gap-1 shrink-0 px-1 rounded transition-colors",
                        isActive ? "bg-[#00AA5B]/10" : "bg-muted/40"
                      )}>
                        <span className={cn(
                          "text-[10px] italic font-black uppercase text-left leading-[1] transition-colors",
                          isActive ? "text-[#00AA5B]" : "text-foreground/40"
                        )}>
                          INSTAN<br />WEEKEND
                        </span>
                      </div>
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="pl-4 shrink-0 h-14 flex items-center">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full border border-border bg-white shadow-sm hover:bg-muted">
                <ChevronRight className="w-4 h-4 text-foreground" />
              </Button>
            </div>
          </div>

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
            ) : products.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border p-8">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Belum Ada Produk Ditampilkan</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Produk digital yang ditambahkan oleh penjual akan otomatis muncul di sini secara realtime.
                  </p>
                </div>
                <Link href="/my-shop/products">
                  <Button size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white font-bold rounded-xl text-xs">
                    Mulai Jual Produk
                  </Button>
                </Link>
              </div>
            ) : (
              products.map((product) => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png";
                const price = Number(product.price || 0);
                const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
                const discountPercent = discountPrice && discountPrice > price
                  ? `${Math.round(((discountPrice - price) / discountPrice) * 100)}%`
                  : null;
                const rating = Number(product.ratingAvg || 5.0).toFixed(1);
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
                          {discountPercent && (
                            <div className="absolute top-1.5 left-1.5 bg-[#FF5E5E] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs">
                              {discountPercent}
                            </div>
                          )}
                        </div>

                        <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                              {product.title}
                            </h4>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[#000000] text-xs sm:text-sm font-bold">
                                  Rp {price.toLocaleString('id-ID')}
                                </span>
                              </div>
                              {discountPrice && discountPrice > price && (
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                                  Rp {discountPrice.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
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
