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
  ChevronLeft,
  Zap,
  Key,
  Repeat,
  ExternalLink,
  Loader2,
  Check,
  Layers,
  ArrowLeft,
  Plus,
  Minus,
  ThumbsUp,
  CornerDownRight,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

export default function ProductDetailPage() {
  const params = useParams();
  const id = ((params?.productSlug as string) || (params?.id as string)) || "";
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [shopProductsCount, setShopProductsCount] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState("helpful");
  const [currentPage, setCurrentPage] = useState(1);
  const [showReplyMap, setShowReplyMap] = useState<Record<string, boolean>>({
    "rev-1": true,
  });
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [otherShopProducts, setOtherShopProducts] = useState<any[]>([]);

  const toggleReply = (revId: string) => {
    setShowReplyMap((prev) => ({ ...prev, [revId]: !prev[revId] }));
  };

  useEffect(() => {
    if (product?.shopId) {
      fetch(`/api/products?shopId=${product.shopId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products)) {
            setShopProductsCount(data.products.length);
            const filtered = data.products.filter((p: any) => p.id !== product.id && p.id !== id);
            setOtherShopProducts(filtered.slice(0, 12));
          }
        })
        .catch(() => { });
    }
  }, [product?.shopId, product?.id, id]);

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
        if (data.product.attributes?.variants && data.product.attributes.variants.length > 0) {
          setSelectedVariant(data.product.attributes.variants[0]);
        }
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

  const { data: shop } = useDoc(shopRef);

  const isVerified = Boolean(shop?.isVerified ?? shop?.verified ?? shop?.is_verified);
  const isOfficial = Boolean(shop?.isOfficial ?? shop?.official ?? shop?.is_official);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link produk disalin!",
        description: "Alamat URL produk telah disalin ke clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContactSeller = () => {
    if (shop?.whatsapp) {
      const msg = encodeURIComponent(`Halo, saya tertarik dengan produk ${product?.title || ''} di MarketPoint.`);
      window.open(`https://wa.me/${shop.whatsapp}?text=${msg}`, "_blank");
    } else {
      toast({
        title: "Kontak Penjual",
        description: "Penjual belum mendaftarkan nomor WhatsApp aktif."
      });
    }
  };

  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = () => {
    toast({
      title: "Ditambahkan ke Keranjang",
      description: `${quantity}x "${product?.title || "Produk"}" berhasil masuk ke keranjang belanja Anda.`,
    });
  };

  const handleToggleWishlist = () => {
    setIsWishlisted((prev) => !prev);
    toast({
      title: !isWishlisted ? "Ditambahkan ke Wishlist" : "Dihapus dari Wishlist",
      description: !isWishlisted
        ? `"${product?.title}" telah disimpan ke wishlist favorit.`
        : `"${product?.title}" dihapus dari wishlist.`,
    });
  };

  const handleBuyNow = () => {
    toast({
      title: "Memproses Pesanan",
      description: "Mengarahkan Anda ke halaman checkout pembayaran..."
    });
    router.push(`/checkout?product=${id}`);
  };

  if (!mounted || loading) {
    return (
      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 pt-14 md:pt-16 pb-24 md:pb-28">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 py-2.5">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>

        {/* 3-Column Layout Skeleton Matching Actual Page */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Image & Shop Info */}
          <div className="lg:col-span-3 space-y-3.5">
            <Skeleton className="aspect-square w-full rounded-2xl lg:rounded-xl mx-auto" />
            <div className="flex gap-2 justify-center lg:justify-start">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-lg" />
              ))}
            </div>
            {/* Shop Info Card Skeleton */}
            <div className="border border-border/70 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-7 w-12 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Column 2: Product Info & Details */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-3/4 rounded-md" />
            </div>
            <div className="flex gap-3 items-center">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />

            {/* Varian Selector Skeleton */}
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>

            {/* Deskripsi Skeleton */}
            <div className="pt-4 border-t border-border/60 space-y-3">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
              <Skeleton className="h-3.5 w-4/6 rounded-md" />
            </div>

            {/* Ulasan Pembeli Skeleton */}
            <div className="pt-5 border-t border-border/60 space-y-4">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          </div>

          {/* Column 3: Desktop Purchase Card Skeleton */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="border border-border/80 rounded-2xl p-4 space-y-4 shadow-2xs">
              <Skeleton className="h-4 w-36 rounded-md" />
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
              <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="flex justify-around pt-2 border-t border-border/60">
                <Skeleton className="h-6 w-12 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar Skeleton */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/60 px-4 py-2.5 flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-3 border border-border">
          <Info className="w-8 h-8 text-muted-foreground opacity-40" />
        </div>
        <h1 className="text-lg font-bold">Produk Tidak Ditemukan</h1>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Maaf, produk yang Anda cari mungkin telah dihapus oleh penjual atau alamat URL salah.
        </p>
        <Button asChild className="mt-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold rounded-xl text-white text-xs h-9 px-6">
          <Link href="/">Kembali Belanja</Link>
        </Button>
      </main>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ imageUrl: "https://picsum.photos/seed/placeholder/800/800" }];
  const currentPrice = selectedVariant ? Number(selectedVariant.price || 0) : Number(product.price || 0);
  const originalPrice = product.discountPrice ? Number(product.discountPrice) : currentPrice;
  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const stockCount = Number(product.stockCount || 0);

  return (
    <main className="max-w-screen-xl mx-auto px-3 sm:px-4 pt-14 md:pt-16 pb-24 md:pb-28">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground py-2.5 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-[#00AA5B] transition-colors font-medium">Beranda</Link>
        <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
        <span className="hover:text-[#00AA5B] transition-colors font-medium">{product.categoryName || "Produk Digital"}</span>
        <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
        <span className="text-foreground font-bold truncate max-w-[140px] sm:max-w-xs">{product.title}</span>
      </nav>

      {/* 3-Column Layout on Desktop: Image | Detail | Ringkasan Pembelian */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 items-start">

        {/* Column 1: Image Gallery & Shop Info */}
        <div className="lg:col-span-3 space-y-3.5 lg:sticky lg:top-20">
          <div className="relative aspect-square w-full rounded-2xl lg:rounded-xl overflow-hidden bg-white border border-border/80 shadow-xs group mx-auto">
            <Image
              src={images[activeImage]?.imageUrl || "https://picsum.photos/seed/placeholder/800/800"}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            {hasDiscount && (
              <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-xs shadow-xs uppercase tracking-wider">
                HEMAT {discountPercent}%
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-1.5 w-full">
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border transition-all",
                    activeImage === idx ? "border-[#00AA5B] ring-2 ring-[#00AA5B]/15" : "border-border/60 hover:border-border"
                  )}
                >
                  <Image src={img.imageUrl} alt={`${product.title} ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Shop Info Card - Desktop Only */}
          <Card className="hidden lg:block border-border/70 bg-white rounded-xl overflow-hidden shadow-2xs max-w-[280px] sm:max-w-[320px] lg:max-w-none mx-auto">
            <CardContent className="p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 rounded-lg border border-border/80 shadow-2xs shrink-0">
                  <AvatarImage src={shop?.logoUrl} />
                  <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-bold">
                    {shop?.name?.substring(0, 1) || "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate max-w-[100px] sm:max-w-[130px]">
                      {shop?.name || "Toko Seller"}
                    </span>
                    {isVerified && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain shrink-0" />
                    )}
                    {isOfficial && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src="/assets/badge/officials.png" alt="Official" className="w-3.5 h-3.5 object-contain shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {Number(shop?.ratingAvg || shop?.rating || product?.ratingAvg || 5.0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                      <Package className="w-3 h-3 text-[#00AA5B]" />
                      {shopProductsCount !== null ? `${shopProductsCount} Produk` : `${shop?.productsCount || shop?.totalProducts || 1} Produk`}
                    </span>
                  </div>
                </div>
              </div>

              {shop?.slug && (
                <Button asChild variant="outline" size="sm" className="h-7 px-2 rounded-lg text-[10px] font-bold border-border hover:border-[#00AA5B] hover:text-[#00AA5B] shrink-0">
                  <Link href={`/${shop.slug}`}>Lihat</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Product Detail & Description */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="bg-[#00AA5B]/5 text-[#00AA5B] border-[#00AA5B]/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                {product.categoryName || "Digital Solution"}
              </Badge>

              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] sm:text-[10px] font-bold">
                Stok: {product.stockType === "REUSABLE" ? "Tersedia" : `${stockCount} Unit`}
              </Badge>
            </div>

            <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[#212121] leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                <span className="font-bold text-[#2E3137]">{Number(product.ratingAvg || 5.0).toFixed(1)}</span>
                <span className="text-muted-foreground text-[10px] font-medium">(254 ulasan)</span>
              </div>
              <span className="text-muted-foreground/30">|</span>
              <span className="font-bold text-[#2E3137] text-[11px]">{product.salesCount || 0} Terjual</span>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="py-2 space-y-0.5 my-1">
            {hasDiscount && (
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-muted-foreground line-through opacity-60">Rp {originalPrice.toLocaleString('id-ID')}</p>
                <span className="bg-rose-100 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded">-{discountPercent}%</span>
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-[#00AA5B]">Rp</span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#212121]">
                {currentPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Fitur Varian Produk Selector */}
          {product.attributes?.variants && product.attributes.variants.length > 0 && (
            <div className="space-y-2.5 pt-3.5 pb-2 mt-2 border-t border-border/60">
              <div className="text-xs font-bold text-[#212121] tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00AA5B]" /> <h3 className="text-xs font-bold text-[#212121] tracking-wider">Pilih Varian:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.attributes.variants.map((v: any, idx: number) => {
                  const isSelected = selectedVariant?.name === v.name || (!selectedVariant && idx === 0);
                  return (
                    <button
                      key={v.id || idx}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        isSelected
                          ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] shadow-2xs ring-1 ring-[#00AA5B]/30"
                          : "border-border/80 bg-white hover:border-border text-foreground hover:bg-muted/20"
                      )}
                    >
                      <span>{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}



          {/* Deskripsi & Ulasan Sections (Stacked) */}
          <div className="space-y-6 pt-3 border-t border-border/60">
            {/* Deskripsi Produk */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#212121] tracking-wider">
                Deskripsi Produk
              </h3>
              <div className="prose prose-sm max-w-none text-[#2E3137] text-xs sm:text-sm font-medium leading-relaxed space-y-3">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : product.shortDescription ? (
                  <p>{product.shortDescription}</p>
                ) : (
                  <p className="text-muted-foreground italic text-xs">Tidak ada deskripsi rinci untuk produk ini.</p>
                )}

                {product.demoUrl && (
                  <div className="pt-3 border-t border-border/40">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Link Demo / Preview</p>
                    <a
                      href={product.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg bg-[#00AA5B]/5 text-[#00AA5B] font-bold text-[11px] border border-[#00AA5B]/20 hover:bg-[#00AA5B]/10 transition-all truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{product.demoUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Ulasan Pembeli Section */}
            <div className="pt-4 border-t border-border/60 space-y-4">
              {/* Shop Info Card - Mobile Only (Below the divider line) */}
              <Card className="lg:hidden border-border/70 bg-white rounded-xl overflow-hidden shadow-2xs w-full">
                <CardContent className="p-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 rounded-lg border border-border/80 shadow-2xs shrink-0">
                      <AvatarImage src={shop?.logoUrl} />
                      <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-bold">
                        {shop?.name?.substring(0, 1) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate max-w-[130px]">
                          {shop?.name || "Toko Seller"}
                        </span>
                        {isVerified && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain shrink-0" />
                        )}
                        {isOfficial && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src="/assets/badge/officials.png" alt="Official" className="w-3.5 h-3.5 object-contain shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {Number(shop?.ratingAvg || shop?.rating || product?.ratingAvg || 5.0).toFixed(1)}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                          <Package className="w-3 h-3 text-[#00AA5B]" />
                          {shopProductsCount !== null ? `${shopProductsCount} Produk` : `${shop?.productsCount || shop?.totalProducts || 1} Produk`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(shop?.slug || product?.shopSlug) && (
                    <Button asChild variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[10px] font-bold border-border hover:border-[#00AA5B] hover:text-[#00AA5B] shrink-0">
                      <Link href={`/${shop?.slug || product?.shopSlug}`}>Lihat</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <h3 className="text-xs font-bold text-[#212121] tracking-wider">
                Ulasan Pembeli ({product.ratingCount || 1809})
              </h3>

              {/* Rating Summary Breakdown Card */}
              <Card className="border-border/80 border shadow-xs rounded-2xl bg-white p-4 sm:p-5 overflow-hidden space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left Column: Big Rating & Satisfaction */}
                  <div className="space-y-1 shrink-0">
                    <div className="flex items-baseline gap-1.5">
                      <Star className="w-6 h-6 text-[#FFC400] fill-[#FFC400] self-center shrink-0" />
                      <span className="text-3xl font-black text-[#212121] tracking-tight">
                        {Number(product?.ratingAvg || 4.9).toFixed(1)}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">/ 5.0</span>
                    </div>
                    <p className="text-xs font-bold text-[#212121]">
                      97% pembeli merasa puas
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      5.819 rating • 1.809 ulasan
                    </p>
                  </div>

                  {/* Right Column: Rating Bars Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-md">
                    {/* Star 5 */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-6 shrink-0 text-muted-foreground font-bold text-[11px]">
                        <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                        <span>5</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA5B] rounded-full w-[88%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">(5.452)</span>
                    </div>

                    {/* Star 2 */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-6 shrink-0 text-muted-foreground font-bold text-[11px]">
                        <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                        <span>2</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA5B] rounded-full w-[15%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">(26)</span>
                    </div>

                    {/* Star 4 */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-6 shrink-0 text-muted-foreground font-bold text-[11px]">
                        <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                        <span>4</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA5B] rounded-full w-[35%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">(238)</span>
                    </div>

                    {/* Star 1 */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-6 shrink-0 text-muted-foreground font-bold text-[11px]">
                        <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                        <span>1</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA5B] rounded-full w-[10%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">(42)</span>
                    </div>

                    {/* Star 3 */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 w-6 shrink-0 text-muted-foreground font-bold text-[11px]">
                        <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                        <span>3</span>
                      </div>
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA5B] rounded-full w-[20%]" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">(54)</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Badge */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium">
                  <span className="h-px bg-border/60 flex-1" />
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-[#00AA5B]" /> Rating & Ulasan Terverifikasi Pembeli MarketPoint
                  </span>
                  <span className="h-px bg-border/60 flex-1" />
                </div>
              </Card>

              {/* Buyer Reviews List Header */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1 border-b border-border/40">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-[#212121] uppercase tracking-wider">ULASAN PILIHAN</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Menampilkan 10 dari {product.ratingCount || 1809} ulasan
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-[#212121]">Urutkan</span>
                    <Select value={reviewSort} onValueChange={setReviewSort}>
                      <SelectTrigger className="h-8.5 w-40 sm:w-44 rounded-xl border-border/80 text-xs font-medium bg-white">
                        <SelectValue placeholder="Urutkan ulasan" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border text-xs font-medium bg-white">
                        <SelectItem value="helpful">Paling Membantu</SelectItem>
                        <SelectItem value="newest">Terbaru</SelectItem>
                        <SelectItem value="highest">Rating Tertinggi</SelectItem>
                        <SelectItem value="lowest">Rating Terendah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {[
                    {
                      id: "rev-1",
                      name: "Budi Santoso",
                      avatar: "B",
                      rating: 5,
                      variant: "Default",
                      date: "2 hari yang lalu",
                      comment: "Sangat puas belanja di sini! Pengiriman lisensi instan langsung aktif. Seller juga ramah dan merespons pertanyaan dengan sangat cepat.",
                      likes: 14,
                      sellerReply: {
                        shopName: shop?.name || "Toko Penjual",
                        date: "1 hari yang lalu",
                        comment: "Terima kasih banyak kak Budi atas ulasan positif dan kepercayaannya! Semoga lisensi dan produknya bermanfaat untuk project Anda. Jika ada kendala, tim kami siap membantu kapan saja! 🙏✨",
                      },
                    },
                    {
                      id: "rev-2",
                      name: "Rian Pratama",
                      avatar: "R",
                      rating: 5,
                      variant: "1 Bulan License",
                      date: "1 minggu yang lalu",
                      comment: "Script & asset berfungsi 100% tanpa kendala. Dokumentasi lengkap dan pengerjaannya sangat rapi. Recommended seller!",
                      likes: 8,
                      sellerReply: {
                        shopName: shop?.name || "Toko Penjual",
                        date: "6 hari yang lalu",
                        comment: "Terima kasih mas Rian atas apresiasinya! Sukses selalu untuk project-nya! 🔥",
                      },
                    },
                    {
                      id: "rev-3",
                      name: "Dian Permata",
                      avatar: "D",
                      rating: 5,
                      variant: "Default",
                      date: "2 minggu yang lalu",
                      comment: "Pelayanan top! Langsung bisa dipakai dan garansi terjamin. Pasti bakal order lagi untuk kebutuhan produk digital berikutnya.",
                      likes: 5,
                    },
                  ].map((review) => (
                    <div key={review.id} className="p-4 rounded-2xl bg-white border border-border/70 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 rounded-full border border-border/80">
                            <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                              {review.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#212121]">{review.name}</span>
                              <Badge variant="outline" className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0">
                                Pembeli Terverifikasi
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Varian: <span className="text-[#212121] font-semibold">{review.variant}</span> • {review.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-[#2E3137] font-medium leading-relaxed">
                        {review.comment}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-[#00AA5B] transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Membantu ({review.likes})</span>
                        </button>

                        {review.sellerReply && (
                          <button
                            type="button"
                            onClick={() => toggleReply(review.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#00AA5B] hover:underline transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{showReplyMap[review.id] ? "Sembunyikan Balasan" : "Lihat Balasan (1)"}</span>
                          </button>
                        )}
                      </div>

                      {/* Seller Reply Box */}
                      {review.sellerReply && showReplyMap[review.id] && (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />
                              <span className="font-bold text-[#212121]">Balasan Penjual</span>
                              <Badge variant="outline" className="text-[8px] font-bold bg-[#00AA5B]/10 text-[#00AA5B] border-[#00AA5B]/20 px-1 py-0">
                                {review.sellerReply.shopName}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{review.sellerReply.date}</span>
                          </div>
                          <p className="text-[11px] text-[#2E3137] font-medium leading-relaxed pl-5">
                            {review.sellerReply.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Review Pagination Bar */}
                <div className="flex items-center justify-center pt-4 border-t border-border/40 text-xs">
                  {/* Page Numbers */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-muted-foreground font-semibold flex-wrap">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {[1, 2, 3, 4, 5, 6, 7].map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center text-xs font-bold transition-all relative cursor-pointer",
                          currentPage === page
                            ? "text-[#00AA5B]"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {page}
                        {currentPage === page && (
                          <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-[#00AA5B] rounded-full" />
                        )}
                      </button>
                    ))}

                    <span className="px-1 text-muted-foreground/60 font-bold">...</span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(50)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center text-xs font-bold transition-all relative cursor-pointer",
                        currentPage === 50
                          ? "text-[#00AA5B]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      50
                      {currentPage === 50 && (
                        <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-[#00AA5B] rounded-full" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={currentPage === 50}
                      onClick={() => setCurrentPage((prev) => Math.min(50, prev + 1))}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Sticky Atur Jumlah & Ringkasan Card (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 space-y-3">
          <Card className="border-border/80 bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground tracking-tight border-b border-border/60 pb-2.5">
              Atur jumlah & Ringkasan
            </h3>

            {/* Atur Jumlah Selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atur Jumlah</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border border-border rounded-xl p-1 bg-muted/20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-7 w-7 rounded-lg hover:bg-white text-foreground disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-9 text-center text-xs font-bold text-foreground">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-7 w-7 rounded-lg hover:bg-white text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Stok: <span className="font-bold text-[#00AA5B]">{product.stockType === "REUSABLE" ? "Tersedia" : `${stockCount} Unit`}</span>
                </span>
              </div>
            </div>

            {/* Price & Subtotal Section */}
            <div className="pt-3 border-t border-border/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Subtotal</span>
                <div className="text-right">
                  {hasDiscount && (
                    <p className="text-[10px] text-muted-foreground line-through opacity-60">
                      Rp {(originalPrice * quantity).toLocaleString('id-ID')}
                    </p>
                  )}
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-xs font-bold text-[#00AA5B]">Rp</span>
                    <span className="text-xl font-extrabold tracking-tight text-[#212121]">
                      {(currentPrice * quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleAddToCart}
                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 shadow-md shadow-[#00AA5B]/10 transition-transform active:scale-[0.98]"
              >
                + Keranjang
              </Button>

              <Button
                variant="outline"
                onClick={handleBuyNow}
                className="w-full h-10 rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/5 font-bold text-xs gap-2 transition-transform active:scale-[0.98]"
              >
                Beli Langsung
              </Button>
            </div>

            {/* Chat | Wishlist | Share Bar */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-around text-xs font-bold text-[#212121]">
              <button
                type="button"
                onClick={handleContactSeller}
                className="flex items-center gap-1.5 hover:text-[#00AA5B] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-foreground" />
                <span>Chat</span>
              </button>

              <span className="text-muted-foreground/30 font-normal">|</span>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className={cn(
                  "flex items-center gap-1.5 hover:text-[#00AA5B] transition-colors cursor-pointer",
                  isWishlisted && "text-rose-500 hover:text-rose-600"
                )}
              >
                <Heart className={cn("w-4 h-4", isWishlisted ? "fill-rose-500 text-rose-500" : "text-foreground")} />
                <span>Wishlist</span>
              </button>

              <span className="text-muted-foreground/30 font-normal">|</span>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-[#00AA5B] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-foreground" />
                <span>{copied ? "Disalin!" : "Share"}</span>
              </button>
            </div>
          </Card>
        </div>

      </div>

      {/* Lainnya di Toko Ini Section */}
      {otherShopProducts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#00AA5B]" />
              <h2 className="text-base sm:text-lg font-black text-[#212121]">
                Lainnya di toko ini
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-border text-xs font-bold text-foreground hover:bg-muted/30"
            >
              <Link href={`/${shop?.slug || product?.shopSlug || product?.shopId || 'marketpoint'}`}>
                Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {otherShopProducts.map((item: any) => {
              const itemImg = item.images?.find((img: any) => img.isPrimary)?.imageUrl || item.images?.[0]?.imageUrl || "https://picsum.photos/seed/placeholder/400/400";
              const itemPrice = Number(item.price || 0);
              const itemOriginalPrice = item.discountPrice ? Number(item.discountPrice) : itemPrice;
              const itemHasDiscount = itemOriginalPrice > itemPrice;
              const itemDiscountPercent = itemHasDiscount ? Math.round(((itemOriginalPrice - itemPrice) / itemOriginalPrice) * 100) : null;
              const itemRating = Number(item.ratingAvg || 5.0).toFixed(1);
              const itemSoldText = item.salesCount ? `${item.salesCount} terjual` : "0 terjual";
              const shopNameStr = shop?.name || shop?.shopName || product?.shopName || "Toko Seller";
              const shopLogo = shop?.logoUrl || shop?.avatar || product?.shopLogoUrl || "";
              const shopSlug = shop?.slug || product?.shopSlug || 'marketpoint';
              const targetUrl = `/${shopSlug}/${item.slug || item.id}`;

              return (
                <Link key={item.id} href={targetUrl}>
                  <Card className="group border-border/70 shadow-2xs rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border-[1px] h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative aspect-square w-full bg-muted/20 overflow-hidden">
                        <Image
                          src={itemImg}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {itemDiscountPercent && (
                          <div className="absolute top-1.5 left-1.5 bg-[#FF5E5E] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs">
                            {itemDiscountPercent}%
                          </div>
                        )}
                      </div>

                      <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[#000000] text-xs sm:text-sm font-bold">
                                Rp {itemPrice.toLocaleString('id-ID')}
                              </span>
                            </div>
                            {itemHasDiscount && (
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                                Rp {itemOriginalPrice.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
                            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                              {itemRating} <span className="opacity-40">|</span> {itemSoldText}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              {shopLogo ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={shopLogo}
                                  alt={String(shopNameStr)}
                                  className="w-[18px] h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                                />
                              ) : (
                                <div className="w-[18px] h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                  <Store className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[70px] sm:max-w-[90px]">
                                {String(shopNameStr)}
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
            })}
          </div>
        </section>
      )}

      {/* Floating Action Bar - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/60 px-4 py-2.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-screen-xl mx-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleContactSeller}
            className="h-10 w-10 rounded-xl border-border shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-foreground" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowMobileSheet(true)}
            className="flex-1 h-10 rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/5 font-bold text-xs"
          >
            + Keranjang
          </Button>

          <Button
            onClick={() => setShowMobileSheet(true)}
            className="flex-1 h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm"
          >
            Beli Langsung
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Sheet: Atur jumlah & Ringkasan */}
      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" hideClose className="rounded-t-3xl p-5 bg-white space-y-4 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-black text-[#212121]">
                Atur jumlah & Ringkasan
              </SheetTitle>
              <SheetClose className="h-7 w-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer outline-none">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
          </SheetHeader>

          {/* Varian Selector in Mobile Sheet */}
          {product.attributes?.variants && product.attributes.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#212121] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00AA5B]" /> Pilih Varian:
              </p>
              <div className="flex flex-wrap gap-2">
                {product.attributes.variants.map((v: any, idx: number) => {
                  const isSelected = selectedVariant?.name === v.name || (!selectedVariant && idx === 0);
                  return (
                    <button
                      key={v.id || idx}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        isSelected
                          ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] shadow-2xs ring-1 ring-[#00AA5B]/30"
                          : "border-border/80 bg-white hover:border-border text-foreground hover:bg-muted/20"
                      )}
                    >
                      <span>{v.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Atur Jumlah Selector */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atur Jumlah</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center border border-border rounded-xl p-1 bg-muted/20">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-7 w-7 rounded-lg hover:bg-white text-foreground disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-9 text-center text-xs font-bold text-foreground">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-7 w-7 rounded-lg hover:bg-white text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Stok: <span className="font-bold text-[#00AA5B]">{product.stockType === "REUSABLE" ? "Tersedia" : `${stockCount} Unit`}</span>
              </span>
            </div>
          </div>

          {/* Price & Subtotal Section */}
          <div className="pt-3 border-t border-border/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Subtotal</span>
              <div className="text-right">
                {hasDiscount && (
                  <p className="text-[10px] text-muted-foreground line-through opacity-60">
                    Rp {(originalPrice * quantity).toLocaleString('id-ID')}
                  </p>
                )}
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xs font-bold text-[#00AA5B]">Rp</span>
                  <span className="text-xl font-extrabold tracking-tight text-[#212121]">
                    {(currentPrice * quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                handleAddToCart();
                setShowMobileSheet(false);
              }}
              className="h-10 rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/5 font-bold text-xs"
            >
              + Keranjang
            </Button>

            <Button
              onClick={() => {
                setShowMobileSheet(false);
                handleBuyNow();
              }}
              className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm"
            >
              Beli Langsung
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}


