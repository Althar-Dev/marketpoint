"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CheckCircle2,
  Clock
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Dummy products for the shop
const SHOP_PRODUCTS = [
  {
    id: 1,
    name: "Premium API Gateway Bridge - Enterprise",
    price: 125000,
    rating: 4.9,
    sold: "1.2rb",
    imageUrl: "https://picsum.photos/seed/shop1/400/400"
  },
  {
    id: 2,
    name: "Custom WhatsApp Bot Multi-Device",
    price: 85000,
    rating: 4.8,
    sold: "850",
    imageUrl: "https://picsum.photos/seed/shop2/400/400"
  },
  {
    id: 3,
    name: "PPOB Realtime Engine Module",
    price: 45000,
    rating: 5.0,
    sold: "2.5rb",
    imageUrl: "https://picsum.photos/seed/shop3/400/400"
  },
  {
    id: 4,
    name: "NextJS 15 E-Commerce Template",
    price: 150000,
    rating: 4.7,
    sold: "120",
    imageUrl: "https://picsum.photos/seed/shop4/400/400"
  }
];

export default function ShopProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();
  const router = useRouter();
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
          <Skeleton className="h-40 md:h-64 w-full rounded-none" />
          <div className="max-w-screen-xl mx-auto px-4 -mt-10 md:-mt-16 relative z-10 mb-8">
            <Card className="border-border border-[1.5px] shadow-lg rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 md:p-6 flex items-center gap-4 md:gap-6">
                <Skeleton className="h-16 w-16 md:h-24 md:w-24 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
            <aside className="lg:col-span-3 space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
            </aside>
            <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="border-border border-[1px] shadow-sm rounded-xl overflow-hidden bg-white">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
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
          <h1 className="text-xl font-bold">Toko Tidak Ditemukan</h1>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Maaf, toko dengan alamat ini tidak tersedia atau telah dihapus.
          </p>
          <Button asChild className="mt-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold rounded-xl text-white">
            <Link href="/">Kembali ke Beranda</Link>
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
        {/* Banner Section */}
        <div className="relative h-40 md:h-64 w-full bg-muted overflow-hidden">
          {shop.bannerUrl ? (
            <Image 
              src={shop.bannerUrl} 
              alt={shop.name} 
              fill 
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[#00AA5B]/10 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#00AA5B] opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Shop Info Card */}
        <div className="max-w-screen-xl mx-auto px-4 -mt-10 md:-mt-16 relative z-10 mb-8">
          <Card className="border-border border-[1.5px] shadow-lg rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl bg-white border-[1.5px] border-border shadow-md overflow-hidden shrink-0 relative">
                  {shop.logoUrl ? (
                    <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                      <span className="text-xl md:text-2xl font-bold text-white">{shop.name?.substring(0, 1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{shop.name}</h1>
                    <Badge variant="secondary" className="bg-[#00AA5B]/10 text-[#00AA5B] border-none font-bold text-[9px] md:text-[10px] h-5 shrink-0 px-2">
                      OFFICIAL STORE
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      <span className="text-[10px] md:text-xs font-medium">{shop.location?.city || "Lokasi tidak diatur"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#FFC400] fill-[#FFC400]" />
                      <span className="text-[10px] md:text-xs font-bold text-foreground">4.9</span>
                      <span className="text-[10px] md:text-xs">(2.5rb Penilaian)</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Online 5 menit yang lalu</span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <Button 
                    onClick={handleContactWhatsApp}
                    className="h-10 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border hover:bg-muted/50">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex md:hidden items-center gap-2 mt-4 pt-4 border-t border-border">
                <Button 
                  onClick={handleContactWhatsApp}
                  className="flex-1 h-9 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </Button>
                <Button variant="outline" className="flex-1 h-9 rounded-lg border-border font-bold text-xs gap-2">
                  <Share2 className="w-3.5 h-3.5" /> Bagikan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Content */}
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* Sidebar Info (Desktop) */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white p-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Informasi Toko</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Status Toko</span>
                  <div className="flex items-center gap-1 text-[#00AA5B]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[11px] font-bold">Aktif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Produk Terjual</span>
                  <span className="text-[11px] font-bold">10rb+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Pengikut</span>
                  <span className="text-[11px] font-bold">5.2rb</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 h-9 rounded-lg border-border font-bold text-[10px]">
                Lihat Catatan Toko
              </Button>
            </Card>
          </aside>

          {/* Product List */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex gap-6">
                <button className="text-sm font-bold text-[#00AA5B] border-b-2 border-[#00AA5B] pb-2">Produk</button>
                <button className="text-sm font-bold text-muted-foreground hover:text-foreground pb-2 transition-colors">Ulasan</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {SHOP_PRODUCTS.map((product) => (
                <Card key={product.id} className="group border-border border-[1px] shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="relative aspect-square bg-muted/30 overflow-hidden">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h4 className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">{product.name}</h4>
                    <p className="text-[13px] font-black">Rp {product.price.toLocaleString('id-ID')}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Star className="w-2.5 h-2.5 text-[#FFC400] fill-[#FFC400]" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {product.rating} <span className="opacity-40">|</span> {product.sold} terjual
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}
