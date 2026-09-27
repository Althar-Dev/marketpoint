"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  ChevronRight, 
  Star, 
  ShieldCheck,
  Store,
  ShoppingBag
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

const TOPUP_CATEGORIES = [
  { id: "pulsa", label: "Pulsa & Data", icon: "/assets/icons/pulsadata.png", color: "bg-blue-50" },
  { id: "game", label: "Game", icon: "/assets/icons/game.png", color: "bg-purple-50" },
  { id: "ewallet", label: "E-Wallet", icon: "/assets/icons/ewallet.png", color: "bg-emerald-50" },
  { id: "pln", label: "Listrik PLN", icon: "/assets/icons/listrik.png", color: "bg-amber-50" },
  { id: "pdam", label: "Air PDAM", icon: "/assets/icons/pdam.png", color: "bg-cyan-50" },
  { id: "tv", label: "TV Kabel", icon: "/assets/icons/tv.png", color: "bg-indigo-50" },
  { id: "stream", label: "Streaming", icon: "/assets/icons/stream.png", color: "bg-rose-50" },
  { id: "voucher", label: "Voucher", icon: "/assets/icons/voucher.png", color: "bg-orange-50" },
];

export default function TopUpHubPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
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

        // Fetch real shop profiles from Firestore to enrich product data
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

  if (!mounted) return null;

  const filteredCategories = TOPUP_CATEGORIES.filter(cat => 
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 w-full pt-20 pb-24 md:pb-12 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 space-y-8">
        
        {/* Search Header */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#212121]">Top Up & Tagihan</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Layanan digital lengkap untuk kebutuhan harian Anda.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari layanan digital..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10 rounded-2xl bg-muted/30 border-transparent focus:bg-white focus:border-[#00AA5B] transition-all font-bold text-xs"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-6">
          {filteredCategories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/search?q=${encodeURIComponent(cat.label)}`}
              className="group flex flex-col items-center gap-3 transition-all active:scale-95"
            >
              <div className={cn(
                "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border border-border/40 shadow-2xs group-hover:shadow-md group-hover:border-[#00AA5B]/30 transition-all",
                cat.color
              )}>
                <Image 
                  src={cat.icon} 
                  alt={cat.label} 
                  width={36} 
                  height={36} 
                  className="object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <span className="text-[10px] md:text-[11px] font-black text-[#2E3137] text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </section>

        {/* Product Card Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm md:text-lg font-black tracking-tight text-[#212121]">Produk Terpopuler</h2>
            <Link href="/" className="text-xs font-bold text-[#00AA5B] hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
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
              </div>
            ) : (
              products.slice(0, 12).map((product) => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png";
                const price = Number(product.price || 0);
                const rating = Number(product.ratingAvg || 5.0).toFixed(1);
                const soldText = product.salesCount ? `${product.salesCount} terjual` : "0 terjual";
                const shopName = typeof product.shopName === "string" ? product.shopName : "Toko Seller";
                const isVerified = Boolean(product.shopIsVerified);
                const isOfficial = Boolean(product.shopIsOfficial);

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
                        </div>

                        <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[10px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                              {product.title}
                            </h4>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[#000000] text-xs sm:text-sm font-bold">
                                Rp {price.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
                              <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                                {rating} <span className="opacity-40">|</span> {soldText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                  <Store className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground truncate max-w-[60px] sm:max-w-[90px]">
                                  {shopName}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {isVerified && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src="/assets/badge/verified.png" alt="Verified" className="w-[14px] h-[14px] sm:w-[17px] sm:h-[17px] object-contain shrink-0" />
                                  )}
                                  {isOfficial && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src="/assets/badge/officials.png" alt="Official" className="w-[14px] h-[14px] sm:w-[17px] sm:h-[17px] object-contain shrink-0" />
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

        {/* Security & Reliability Info */}
        <section className="pt-8 border-t border-border/60 pb-10">
           <Card className="bg-[#F8FAFC] border-none rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-[#00AA5B]" />
              </div>
              <div className="space-y-2 flex-1">
                 <h3 className="text-base md:text-lg font-black text-[#2E3137]">Transaksi Aman & Instan 24 Jam</h3>
                 <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                    Semua transaksi Top Up dan Tagihan di MarketPoint diproses secara otomatis dalam hitungan detik. Saldo Anda akan terlindungi oleh sistem rekber kami yang menjamin dana kembali jika transaksi gagal.
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
