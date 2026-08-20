"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  MessageCircle, 
  Star, 
  Share2, 
  Info,
  ShoppingBag,
  Clock,
  Heart,
  Search
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";

// Dummy products for the shop
const SHOP_PRODUCTS = [
  {
    id: 1,
    name: "Premium API Gateway Bridge - Enterprise Edition",
    price: 125000,
    rating: 4.9,
    sold: "1.2rb",
    imageUrl: "https://picsum.photos/seed/shop1/400/400"
  },
  {
    id: 2,
    name: "Custom WhatsApp Bot Multi-Device - Official License",
    price: 85000,
    rating: 4.8,
    sold: "850",
    imageUrl: "https://picsum.photos/seed/shop2/400/400"
  },
  {
    id: 3,
    name: "PPOB Realtime Engine Module - NextJS Ready",
    price: 45000,
    rating: 5.0,
    sold: "2.5rb",
    imageUrl: "https://picsum.photos/seed/shop3/400/400"
  },
  {
    id: 4,
    name: "NextJS 15 E-Commerce Template - Modern Stack",
    price: 150000,
    rating: 4.7,
    sold: "120",
    imageUrl: "https://picsum.photos/seed/shop4/400/400"
  },
  {
    id: 5,
    name: "GenKit AI Plugin - Gemini AI Integration",
    price: 250000,
    rating: 4.9,
    sold: "45",
    imageUrl: "https://picsum.photos/seed/shop5/400/400"
  },
  {
    id: 6,
    name: "Cloud Hosting Bridge - AWS Managed Service",
    price: 75000,
    rating: 4.6,
    sold: "310",
    imageUrl: "https://picsum.photos/seed/shop6/400/400"
  }
];

export default function ShopProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopQuery = useMemoFirebase(() => {
    if (!slug) return null;
    return query(collection(db, "shops"), where("slug", "==", slug), limit(1));
  }, [db, slug]);

  const { data: shops, loading } = useCollection(shopQuery);
  const shop = shops && shops.length > 0 ? shops[0] : null;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body">
        <MarketHeader />
        <main className="flex-1 w-full pt-16">
          <Skeleton className="h-32 sm:h-44 md:h-72 lg:h-[350px] w-full rounded-none" />
          <div className="max-w-screen-xl mx-auto px-4 -mt-10 md:-mt-20 relative z-10 mb-8">
            <Card className="border-border border-[1.5px] shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 md:p-8 flex flex-row items-start gap-4 md:gap-8">
                <Skeleton className="h-16 w-16 md:h-32 md:w-32 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40 md:h-8 md:w-64" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="hidden md:flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-32 rounded-xl" />
                    <Skeleton className="h-9 w-32 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </main>
        <MarketBottomNav />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
            <Info className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Toko tidak ditemukan</h1>
          <p className="text-muted-foreground mt-2 max-w-xs text-sm">
            Maaf, toko dengan alamat ini tidak tersedia atau telah dihapus.
          </p>
          <Button asChild className="mt-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold rounded-xl text-white">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </main>
        <MarketFooter />
      </div>
    );
  }

  const handleContactWhatsApp = () => {
    if (shop.whatsapp) {
      window.open(`https://wa.me/${shop.whatsapp}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />

      <main className="flex-1 w-full pt-16 pb-20 lg:pb-0">
        {/* Banner Section with Overlay - Adjusted for 1300:500 Aspect Ratio */}
        <div className="relative h-32 sm:h-44 md:h-72 lg:h-[350px] w-full bg-muted overflow-hidden">
          {shop.bannerUrl ? (
            <Image 
              src={shop.bannerUrl} 
              alt={shop.name} 
              fill 
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[#00AA5B]/5 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-[#00AA5B] opacity-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Shop Info Card */}
        <div className="max-w-screen-xl mx-auto px-4 -mt-10 md:-mt-20 relative z-20 mb-8">
          <Card className="border-border border-[1.5px] shadow-xl rounded-2xl bg-white overflow-hidden relative">
            <CardContent className="p-4 md:p-8 relative">
              
              {/* Share Button - Absolute Top Right */}
              <div className="absolute top-4 right-4 z-30">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 md:h-10 md:w-10 rounded-xl border-border bg-white shadow-sm hover:bg-muted transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-row items-start gap-4 md:gap-8">
                {/* Logo Section */}
                <div className="relative shrink-0">
                  <div className="h-16 w-16 md:h-32 md:w-32 rounded-2xl md:rounded-3xl bg-white border-[1.5px] border-border shadow-md overflow-hidden relative">
                    {shop.logoUrl ? (
                      <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-xl md:text-4xl font-bold text-white uppercase">{shop.name?.substring(0, 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 md:h-7 md:w-7 rounded-full bg-white flex items-center justify-center border-[1.5px] border-border shadow-sm">
                    <div className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 rounded-full bg-[#00AA5B] animate-pulse"></div>
                  </div>
                </div>

                {/* Info Container - Right of Logo */}
                <div className="flex-1 min-w-0 pr-10 md:pr-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg md:text-3xl font-black font-headline tracking-tight truncate max-w-[180px] md:max-w-md">
                        {shop.name}
                      </h1>
                      {shop.official === true && (
                        <div className="relative h-5 w-20 md:h-6 md:w-24 shrink-0">
                          <Image 
                            src="/assets/badge/official.png" 
                            alt="Official Store" 
                            fill 
                            className="object-contain object-left"
                          />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[11px] md:text-xs font-bold text-[#00AA5B] lowercase tracking-wide">
                      @{shop.slug}
                    </p>

                    <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#00AA5B]" />
                        <span className="text-xs font-bold text-[#2E3137]">{shop.location?.city || "Lokasi toko"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#FFC400] fill-[#FFC400]" />
                        <span className="text-xs font-bold text-[#2E3137]">4.9</span>
                        <span className="text-[11px] font-medium opacity-60">(2.5rb ulasan)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-[11px] font-medium">Aktif 5 menit lalu</span>
                      </div>
                    </div>

                    <div className="flex md:hidden items-center gap-3 mt-1.5 text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                         <span className="text-[10px] font-bold text-[#212121]">4.9</span>
                         <span className="text-[9px] font-medium opacity-60">(2.5rb ulasan)</span>
                       </div>
                       <span className="text-muted-foreground/30">|</span>
                       <div className="flex items-center gap-1">
                         <MapPin className="w-3 h-3" />
                         <span className="text-[10px] font-bold text-[#212121]">{shop.location?.city || "Lokasi"}</span>
                       </div>
                    </div>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="hidden md:flex items-center gap-3 pt-6">
                    <Button 
                      onClick={handleContactWhatsApp}
                      className="h-10 px-8 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-xs gap-2 shadow-lg shadow-[#00AA5B]/10 transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat penjual
                    </Button>
                    <Button variant="outline" className="h-10 px-8 rounded-xl border-border font-black text-xs gap-2 hover:bg-[#F8FAFC] transition-transform active:scale-95">
                      <Heart className="w-4 h-4" /> Favoritkan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex md:hidden items-center gap-2 mt-6 pt-4 border-t border-border/50">
                <Button 
                  onClick={handleContactWhatsApp}
                  className="flex-1 h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[10px] gap-2 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat penjual
                </Button>
                <Button variant="outline" className="flex-1 h-9 rounded-xl border-border font-black text-[10px] gap-2">
                  <Heart className="w-3.5 h-3.5" /> Favoritkan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Content Grid */}
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
          <aside className="lg:col-span-3 space-y-6">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="p-5 border-b border-border bg-[#F8FAFC]">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Profil bisnis</h3>
              </div>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Kualitas produk</span>
                    <div className="flex items-center gap-1 text-[#00AA5B] font-black text-[11px]">
                      <Star className="w-3 h-3 fill-current" /> 4.9
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Kecepatan respon</span>
                    <span className="text-[11px] font-black text-[#2E3137]">Sangat baik</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Produk terjual</span>
                    <span className="text-[11px] font-black text-[#2E3137]">15.4rb+</span>
                  </div>
                </div>
                <div className="h-px bg-border w-full"></div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Metode pengiriman</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 rounded-lg border-border">Instan</Badge>
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 rounded-lg border-border">Reguler</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="ghost" className="w-full h-11 rounded-2xl border border-dashed border-border text-muted-foreground font-black text-[10px] hover:bg-white hover:text-[#00AA5B] hover:border-[#00AA5B] transition-all">
              Lihat catatan toko
            </Button>
          </aside>

          <div className="lg:col-span-9 space-y-8">
            {/* Optimized Nav Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-2">
              <div className="flex gap-8">
                <button className="text-[13px] font-bold text-[#00AA5B] border-b-[3px] border-[#00AA5B] pb-3 transition-all">Semua produk</button>
                <button className="text-[13px] font-bold text-muted-foreground hover:text-foreground pb-3 transition-colors">Ulasan toko</button>
                <button className="text-[13px] font-bold text-muted-foreground hover:text-foreground pb-3 transition-colors">Voucher</button>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari produk di toko ini..." 
                  className="h-9 pl-10 rounded-xl bg-white border-border text-xs font-bold"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {SHOP_PRODUCTS.map((product) => (
                <Card key={product.id} className="group border-border border-[1.5px] shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col">
                  <div className="relative aspect-square bg-muted/20 overflow-hidden">
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <CardContent className="p-2.5 md:p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="text-[11px] md:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[#000000] text-[12px] md:text-sm font-black">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-[#FFC400] fill-[#FFC400]" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {product.rating} <span className="opacity-40">|</span> {product.sold} terjual
                        </span>
                      </div>
                      
                      <Button className="w-full h-8 rounded-lg bg-[#F8FAFC] hover:bg-[#00AA5B] text-[#2E3137] hover:text-white font-bold text-[9px] border border-border group-hover:border-[#00AA5B] transition-all">
                        Tambah ke keranjang
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button variant="outline" className="h-10 px-10 rounded-xl border-border font-black text-xs hover:bg-white hover:border-[#00AA5B] hover:text-[#00AA5B] transition-all">
                Tampilkan lebih banyak
              </Button>
            </div>
          </div>
        </div>
      </main>

      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}
