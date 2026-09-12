"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ShoppingBag,
  Share2,
  Heart,
  MessageCircle,
  Store,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Package,
  Info,
  ChevronRight,
  Zap,
  Key,
  Repeat,
  ExternalLink,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`);
      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
      } else {
        toast({
          variant: "destructive",
          title: "Produk tidak ditemukan",
          description: "Maaf, produk ini mungkin telah dihapus atau tidak tersedia."
        });
      }
    } catch (err) {
      console.error("Gagal mengambil detail produk:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch shop info based on ownerId (stored as shopId in product)
  const shopRef = useMemoFirebase(() => {
    if (!product?.shopId) return null;
    return doc(db, "shops", product.shopId);
  }, [db, product?.shopId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || loading) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 py-20 lg:py-24 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
            <Skeleton className="h-12 w-48 rounded-lg" />
            <div className="space-y-4 pt-6">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            <div className="pt-10 flex gap-4">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
          <Info className="w-10 h-10 text-muted-foreground opacity-30" />
        </div>
        <h1 className="text-xl font-bold">Produk Tidak Ditemukan</h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          Maaf, produk yang Anda cari mungkin telah dihapus oleh penjual atau alamat URL salah.
        </p>
        <Button asChild className="mt-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold rounded-xl text-white">
          <Link href="/">Kembali Belanja</Link>
        </Button>
      </main>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ imageUrl: "https://picsum.photos/seed/placeholder/800/800" }];
  const currentPrice = product.price || 0;
  const originalPrice = product.discountPrice || currentPrice;
  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  return (
    <main className="max-w-screen-xl mx-auto px-4 pt-20 lg:pt-28 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-5 space-y-4 sticky top-28">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-border/50 shadow-sm group">
            <Image 
              src={images[activeImage].imageUrl} 
              alt={product.title} 
              fill 
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black px-2 py-1 rounded shadow-lg">
                HEMAT {discountPercent}%
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                  activeImage === idx ? "border-[#00AA5B] ring-2 ring-[#00AA5B]/10" : "border-transparent hover:border-border"
                )}
              >
                <Image src={img.imageUrl} alt={`${product.title} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          {/* Desktop Shop Widget Small */}
          <div className="hidden lg:block pt-4">
             <Card className="border-border/60 bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-border">
                        <AvatarImage src={shop?.logoUrl} />
                        <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">{shop?.name?.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[11px] font-black leading-tight flex items-center gap-1">
                          {shop?.name}
                          {shop?.official && <CheckCircle2 className="w-3 h-3 text-[#8B5CF6]" />}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {shop?.location?.city || "Indonesia"}
                        </p>
                      </div>
                   </div>
                   <Button asChild variant="outline" size="sm" className="h-8 px-4 rounded-lg text-[10px] font-bold border-border hover:bg-muted">
                      <Link href={`/${shop?.slug}`}>Lihat Toko</Link>
                   </Button>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-[#00AA5B]/5 text-[#00AA5B] border-[#00AA5B]/20 text-[9px] font-black uppercase tracking-wider">
                {product.categoryName || "Digital Solution"}
              </Badge>
              {product.stockType === "REUSABLE" ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black gap-1">
                   <Repeat className="w-2.5 h-2.5" /> REUSABLE
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black gap-1">
                   <Key className="w-2.5 h-2.5" /> AKUN / LISENSI
                </Badge>
              )}
            </div>
            <h1 className="text-xl md:text-3xl font-black font-headline tracking-tight text-[#212121]">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#FFC400] fill-[#FFC400]" />
                <span className="font-bold text-[#2E3137]">{product.ratingAvg || "5.0"}</span>
                <span className="text-muted-foreground text-[11px] font-medium">(254 ulasan)</span>
              </div>
              <span className="text-muted-foreground/30">|</span>
              <span className="font-bold text-[#2E3137]">{product.salesCount || 0} Terjual</span>
            </div>
          </div>

          <div className="py-4 border-y border-border/50 space-y-1">
             {hasDiscount && (
               <p className="text-sm text-muted-foreground line-through opacity-50">Rp {originalPrice.toLocaleString('id-ID')}</p>
             )}
             <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-[#00AA5B]">Rp</span>
                <span className="text-4xl font-black tracking-tighter text-[#212121]">
                   {currentPrice.toLocaleString('id-ID')}
                </span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="border-border/60 bg-[#F8FAFC]/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-border/60 shrink-0">
                   <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pengiriman</p>
                   <p className="text-[11px] font-bold text-[#2E3137]">Instan & Otomatis</p>
                </div>
             </Card>
             <Card className="border-border/60 bg-[#F8FAFC]/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-border/60 shrink-0">
                   <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Keamanan</p>
                   <p className="text-[11px] font-bold text-[#2E3137]">MarketPoint Protection</p>
                </div>
             </Card>
          </div>

          {/* Desktop Desktop Actions (Sidebar style) */}
          <div className="hidden lg:grid grid-cols-2 gap-3 pt-4">
             <Button size="lg" className="h-12 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-black text-xs gap-2 shadow-lg shadow-[#00AA5B]/10 transition-transform active:scale-95">
                <ShoppingBag className="w-4 h-4" /> Beli Sekarang
             </Button>
             <Button variant="outline" size="lg" className="h-12 rounded-xl border-border font-black text-xs gap-2 hover:bg-white transition-transform active:scale-95">
                <MessageCircle className="w-4 h-4" /> Tanya Penjual
             </Button>
          </div>

          <div className="pt-8">
            <Tabs defaultValue="deskripsi" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none px-0 gap-8">
                <TabsTrigger value="deskripsi" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-black text-xs">DESKRIPSI</TabsTrigger>
                <TabsTrigger value="ulasan" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-black text-xs">ULASAN (254)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deskripsi" className="pt-6">
                <div className="prose prose-sm max-w-none text-[#2E3137] font-medium leading-relaxed space-y-4">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p>Tidak ada deskripsi untuk produk ini.</p>
                  )}
                  {product.demoUrl && (
                    <div className="pt-4">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Link Demo / Preview</p>
                       <a 
                        href={product.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 w-fit px-4 py-2 rounded-xl bg-[#00AA5B]/5 text-[#00AA5B] font-bold text-[11px] border border-[#00AA5B]/20 hover:bg-[#00AA5B]/10 transition-all"
                       >
                         <ExternalLink className="w-3.5 h-3.5" /> {product.demoUrl}
                       </a>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ulasan" className="pt-6">
                 <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
                    <Star className="w-10 h-10 text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-sm font-bold text-[#2E3137]">Belum ada ulasan publik</h3>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1 font-medium">Ulasan akan muncul setelah pembeli memberikan penilaian pada produk ini.</p>
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Floating Action Bar - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/60 px-4 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <div className="max-w-screen-xl mx-auto flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border shrink-0">
               <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border shrink-0">
               <Heart className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button className="flex-1 h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-black text-xs shadow-lg shadow-[#00AA5B]/20">
               Beli Sekarang
            </Button>
         </div>
      </div>
    </main>
  );
}
