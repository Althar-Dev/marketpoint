
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  MessageCircle, 
  Star, 
  Info,
  ShoppingBag,
  Clock,
  Heart,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Award,
  ThumbsUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const SHOP_REVIEWS = [
  {
    id: 1,
    userName: "Budi Santoso",
    rating: 5,
    date: "2 hari lalu",
    comment: "Mantap banget API-nya, integrasi lancar jaya. Seller juga sangat responsif saat ditanya-tanya teknis. Sangat direkomendasikan untuk project enterprise.",
    productName: "Premium API Gateway Bridge - Enterprise Edition"
  },
  {
    id: 2,
    userName: "Siska Putri",
    rating: 4,
    date: "1 minggu lalu",
    comment: "Produk oke, pengiriman lisensi cepat. Cuma dokumentasinya mungkin bisa lebih diperjelas lagi untuk pemula, tapi overall puas.",
    productName: "Custom WhatsApp Bot Multi-Device - Official License"
  },
  {
    id: 3,
    userName: "Reza Pratama",
    rating: 5,
    date: "2 minggu lalu",
    comment: "Bintang 5! Engine PPOB-nya stabil banget, nggak ada kendala selama 1 bulan pemakaian.",
    productName: "PPOB Realtime Engine Module - NextJS Ready"
  }
];

export default function ShopProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

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
    );
  }

  if (!shop) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
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
    );
  }

  const handleContactWhatsApp = () => {
    if (shop.whatsapp) {
      window.open(`https://wa.me/${shop.whatsapp}`, "_blank");
    }
  };

  return (
    <main className="flex-1 w-full pt-14 md:pt-16 pb-20 lg:pb-0">
      {/* Banner Section - Optimized for 1300:500 */}
      <div className="relative h-32 sm:h-44 md:h-72 lg:h-[350px] w-full bg-muted overflow-hidden">
        {shop.bannerUrl ? (
          <Image 
            src={shop.bannerUrl} 
            alt={shop.name} 
            fill 
            className="object-cover"
            priority
            data-ai-hint="shop banner"
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
            
            <div className="flex flex-row items-start gap-4 md:gap-8">
              {/* Logo Section - Aligned Left */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 md:h-32 md:w-32 rounded-2xl md:rounded-3xl bg-white border-[1.5px] border-border shadow-md overflow-hidden relative">
                  {shop.logoUrl ? (
                    <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" data-ai-hint="shop logo" />
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
              <div className="flex-1 min-w-0 pr-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg md:text-3xl font-black font-headline tracking-tight truncate max-w-[180px] md:max-w-md">
                      {shop.name}
                    </h1>
                    
                    {shop.official === true && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="relative h-5 w-20 md:h-6 md:w-24 shrink-0 transition-transform active:scale-95">
                            <Image 
                              src="/assets/badge/official.png" 
                              alt="Official Store" 
                              fill 
                              className="object-contain object-left"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl max-w-sm md:max-w-md border-border p-6">
                          <DialogHeader>
                            <div className="flex justify-center mb-4">
                              <div className="relative h-12 w-48">
                                <Image 
                                  src="/assets/badge/official.png" 
                                  alt="Official Store" 
                                  fill 
                                  className="object-contain"
                                />
                              </div>
                            </div>
                            <DialogTitle className="text-center text-xl font-black font-headline">Toko Resmi MarketPoint</DialogTitle>
                            <DialogDescription className="text-center pt-2 font-medium">
                              Toko ini telah diverifikasi oleh MarketPoint sebagai mitra resmi dengan standar pelayanan terbaik.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 mt-6">
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-[#00AA5B]/5 border border-[#00AA5B]/10">
                              <div className="h-8 w-8 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-black">Produk 100% Original</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Jaminan keaslian lisensi dan infrastruktur langsung dari pengembang.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10">
                              <div className="h-8 w-8 rounded-full bg-[#8B5CF6] flex items-center justify-center shrink-0">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-black">Layanan Instan</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Pemrosesan pesanan otomatis dan dukungan teknis prioritas 24/7.</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-[#FFC400]/5 border border-[#FFC400]/10">
                              <div className="h-8 w-8 rounded-full bg-[#FFC400] flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-black">Terpercaya & Handal</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Toko dengan rekam jejak penjualan sukses dan ulasan bintang 5.</p>
                              </div>
                            </div>
                          </div>
                          <Button className="w-full mt-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black rounded-xl text-white py-3 h-auto" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                            Mengerti
                          </Button>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <p className="text-[11px] md:text-xs font-bold text-[#00AA5B] lowercase tracking-wide">
                    @{shop.slug}
                  </p>

                  {/* Desktop Stats */}
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

                  {/* Mobile Stats */}
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
                    <MessageCircle className="w-4 h-4" /> Chat
                  </Button>
                  <Button variant="outline" className="h-10 px-8 rounded-xl border-border font-black text-xs gap-2 hover:bg-[#F8FAFC] transition-transform active:scale-95">
                    <Heart className="w-4 h-4" /> Follow
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
                <MessageCircle className="w-3.5 h-3.5" /> Chat
              </Button>
              <Button variant="outline" className="flex-1 h-9 rounded-xl border-border font-black text-[10px] gap-2">
                <Heart className="w-3.5 h-3.5" /> Follow
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Content Grid */}
      <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* Sidebar Profil Bisnis */}
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
            </CardContent>
          </Card>

          <Button variant="ghost" className="w-full h-11 rounded-2xl border border-dashed border-border text-muted-foreground font-black text-[10px] hover:bg-white hover:text-[#00AA5B] hover:border-[#00AA5B] transition-all">
            Lihat catatan toko
          </Button>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* Optimized Nav Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-2">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveTab("products")}
                className={cn(
                  "text-[13px] font-bold pb-3 transition-all",
                  activeTab === "products" ? "text-[#00AA5B] border-b-[3px] border-[#00AA5B]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Semua produk
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={cn(
                  "text-[13px] font-bold pb-3 transition-all",
                  activeTab === "reviews" ? "text-[#00AA5B] border-b-[3px] border-[#00AA5B]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Ulasan toko
              </button>
              <button 
                onClick={() => setActiveTab("vouchers")}
                className={cn(
                  "text-[13px] font-bold pb-3 transition-all",
                  activeTab === "vouchers" ? "text-[#00AA5B] border-b-[3px] border-[#00AA5B]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Voucher
              </button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari produk di toko ini..." 
                className="h-9 pl-10 rounded-xl bg-white border-border text-xs font-bold"
              />
            </div>
          </div>

          {/* Tab Content Render */}
          {activeTab === "products" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {SHOP_PRODUCTS.map((product) => (
                  <Card key={product.id} className="group border-border border-[1.5px] shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col">
                    <div className="relative aspect-square bg-muted/20 overflow-hidden">
                      <Image 
                        src={product.imageUrl} 
                        alt={product.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        data-ai-hint="product photo"
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
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Rating Summary Card */}
              <Card className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-4 flex flex-col items-center text-center space-y-2 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0">
                      <div className="flex items-baseline gap-1">
                        <h2 className="text-5xl font-black font-headline">4.9</h2>
                        <span className="text-lg font-bold text-muted-foreground">/ 5.0</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-5 h-5 text-[#FFC400] fill-[#FFC400]" />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-muted-foreground mt-2">(2.5rb) Ulasan Pembeli</p>
                    </div>

                    <div className="md:col-span-8 space-y-2.5">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-4 group cursor-default">
                          <div className="flex items-center gap-1.5 w-8 shrink-0">
                            <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                            <span className="text-xs font-black">{star}</span>
                          </div>
                          <Progress 
                            value={star === 5 ? 92 : star === 4 ? 6 : star === 3 ? 1.5 : star === 2 ? 0.5 : 0} 
                            className="h-2 rounded-full bg-muted" 
                          />
                          <span className="text-[10px] font-bold text-muted-foreground w-10 text-right opacity-60">
                            {star === 5 ? "2.3rb" : star === 4 ? "150" : star === 3 ? "35" : star === 2 ? "12" : "3"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black tracking-tight">Semua Ulasan</h3>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-36 h-9 rounded-xl border-border bg-white text-[11px] font-bold">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="newest" className="text-[11px] font-bold">Terbaru</SelectItem>
                      <SelectItem value="highest" className="text-[11px] font-bold">Rating Tertinggi</SelectItem>
                      <SelectItem value="lowest" className="text-[11px] font-bold">Rating Terendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {SHOP_REVIEWS.map((review) => (
                    <Card key={review.id} className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white hover:border-[#00AA5B]/30 transition-all">
                      <CardContent className="p-5 md:p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                              <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                                {review.userName.substring(0, 1) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[12px] font-black">{review.userName}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "w-2.5 h-2.5",
                                      i < review.rating ? "text-[#FFC400] fill-[#FFC400]" : "text-muted-foreground opacity-20"
                                    )} 
                                  />
                                ))}
                                <span className="text-[10px] text-muted-foreground font-medium ml-1.5">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-[#00AA5B]">
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[13px] text-[#2E3137] leading-relaxed font-medium">
                            "{review.comment}"
                          </p>
                          
                          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-border/50 flex items-center gap-3 group cursor-pointer hover:bg-white hover:border-[#00AA5B]/20 transition-all">
                            <div className="h-8 w-8 rounded-lg bg-white border border-border overflow-hidden shrink-0">
                              <Image src={`https://picsum.photos/seed/${review.id}/100/100`} alt="Product" width={32} height={32} className="object-cover" />
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground truncate group-hover:text-primary transition-colors">
                              {review.productName}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-6">
                  <Button variant="outline" className="h-10 px-10 rounded-xl border-border font-black text-xs hover:bg-white hover:border-[#00AA5B] hover:text-[#00AA5B] transition-all">
                    Lihat ulasan lainnya
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "vouchers" && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                <Award className="w-8 h-8 text-muted-foreground opacity-30" />
              </div>
              <h3 className="text-base font-black tracking-tight">Tidak ada voucher tersedia</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs font-medium">
                Toko ini belum memiliki promo voucher aktif saat ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
