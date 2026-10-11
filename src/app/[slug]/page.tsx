
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";

const RESERVED_PREFIXES = new Set([
  "admin",
  "api",
  "topup",
  "my-shop",
  "products",
  "search",
  "settings",
  "profile",
  "wallet",
  "terms",
  "privacy",
  "login",
  "register",
  "checkout",
  "assets",
  "favicon.ico"
]);
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit, orderBy, doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopProfileSkeleton } from "@/components/shop-profile-skeleton";
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
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Award,
  ThumbsUp,
  Share2,
  Loader2,
  Package,
  Ticket,
  Copy,
  Check,
  Percent,
  Calendar,
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
  const router = useRouter();
  const slug = params.slug as string;
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState<number>(1250);

  // Current user's Firestore profile
  const userDocRef = useMemoFirebase(() => (!user ? null : doc(db, "users", user.uid)), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // PostgreSQL Shop Reviews & Rating stats
  const [shopReviews, setShopReviews] = useState<any[]>([]);
  const [shopReviewStats, setShopReviewStats] = useState<{
    ratingAvg: number;
    totalReviews: number;
    starCounts: { 5: number; 4: number; 3: number; 2: number; 1: number };
  }>({
    ratingAvg: 5.0,
    totalReviews: 0,
    starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loadingShopReviews, setLoadingShopReviews] = useState(false);
  const [shopReviewSort, setShopReviewSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [copiedVoucherId, setCopiedVoucherId] = useState<string | null>(null);

  const handleCopyVoucher = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucherId(id);
    toast({
      title: "Kode Voucher Berhasil Disalin",
      description: `Gunakan kode "${code}" saat checkout untuk klaim potongan harga.`,
    });
    setTimeout(() => {
      setCopiedVoucherId(null);
    }, 2500);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopQuery = useMemoFirebase(() => {
    if (!slug) return null;
    return query(collection(db, "shops"), where("slug", "==", slug), limit(1));
  }, [db, slug]);

  const { data: shops, loading } = useCollection(shopQuery);
  const shop = shops && shops.length > 0 ? shops[0] : null;

  // Sync followers count dari data toko
  useEffect(() => {
    if (shop) {
      const count = typeof shop.followersCount === 'number'
        ? shop.followersCount
        : typeof shop.followers === 'number'
          ? shop.followers
          : 1250;
      setFollowersCount(count);
    }
  }, [shop]);

  // Cek status follow user terhadap toko
  useEffect(() => {
    if (!user || !shop?.id || !db) return;
    const followDocRef = doc(db, "users", user.uid, "followedShops", shop.id);
    getDoc(followDocRef)
      .then((snap) => {
        setIsFollowing(snap.exists());
      })
      .catch((err) => console.error("Error checking follow status:", err));
  }, [user, shop?.id, db]);

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}rb pengikut`;
    }
    return `${count} pengikut`;
  };

  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [loadingShopProducts, setLoadingShopProducts] = useState(false);

  const totalProductsSold = useMemo(() => {
    return shopProducts.reduce((acc, p) => acc + (Number(p.salesCount) || 0), 0);
  }, [shopProducts]);

  // Fetch produk toko nyata dari PostgreSQL
  useEffect(() => {
    const shopIdentifier = shop?.id || shop?.ownerId || slug;
    if (shopIdentifier) {
      setLoadingShopProducts(true);
      fetch(`/api/products?shopId=${encodeURIComponent(shopIdentifier)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products)) {
            setShopProducts(data.products);
          }
        })
        .catch((err) => console.warn("Gagal memuat produk toko:", err))
        .finally(() => setLoadingShopProducts(false));
    }
  }, [shop?.id, shop?.ownerId, slug]);

  // Fetch ulasan toko nyata dari PostgreSQL
  useEffect(() => {
    const shopIdentifier = shop?.id || shop?.ownerId || slug;
    if (shopIdentifier) {
      setLoadingShopReviews(true);
      fetch(`/api/reviews?shopId=${encodeURIComponent(shopIdentifier)}&sortBy=${shopReviewSort}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setShopReviews(data.reviews || []);
            if (data.stats) {
              setShopReviewStats(data.stats);
            }
          }
        })
        .catch((err) => console.warn("Gagal memuat ulasan toko:", err))
        .finally(() => setLoadingShopReviews(false));
    }
  }, [shop?.id, shop?.ownerId, slug, shopReviewSort]);

  // Auto-sync real photoURL from Firestore into reviews in PostgreSQL if duck was previously stored
  useEffect(() => {
    if (!user || !userData?.photoURL || userData.photoURL.includes("duck") || shopReviews.length === 0) return;
    const userReview = shopReviews.find(
      (r) =>
        !r.isAnonymous &&
        (r.userId === user.uid || r.userId === user.email || r.userName === userData.displayName) &&
        (!r.userAvatar || r.userAvatar.includes("duck") || r.userAvatar !== userData.photoURL)
    );
    if (userReview) {
      fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: userReview.transactionId || userReview.invoiceNumber || userReview.id,
          userAvatar: userData.photoURL,
          userName: userData.displayName || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setShopReviews((prev) =>
              prev.map((r) => (r.id === userReview.id ? { ...r, userAvatar: userData.photoURL } : r))
            );
          }
        })
        .catch(() => {});
    }
  }, [user, userData?.photoURL, userData?.displayName, shopReviews]);

  // Vouchers dari Firestore subcollection
  const vouchersColRef = useMemoFirebase(() => {
    if (!shop?.id) return null;
    return query(collection(db, "shops", shop.id, "vouchers"), orderBy("createdAt", "desc"));
  }, [db, shop?.id]);
  const { data: rawVouchers, loading: vouchersLoading } = useCollection(vouchersColRef);

  const shopVouchers = useMemo(() => {
    if (!Array.isArray(rawVouchers)) return [];
    const now = new Date();
    return rawVouchers.map((v: any) => ({
      id: v.id,
      code: v.code || "",
      type: (v.type || "percentage") as "percentage" | "fixed",
      value: Number(v.value) || 0,
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
      minPurchase: v.minPurchase ? Number(v.minPurchase) : 0,
      quota: Number(v.quota) || 0,
      used: Number(v.used) || 0,
      status: v.status || "ACTIVE",
      expiry: v.expiry || null,
      isExpired: v.expiry ? new Date(v.expiry) < now : false,
    }));
  }, [rawVouchers]);

  if (slug && RESERVED_PREFIXES.has(slug.toLowerCase())) {
    notFound();
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
        <div className="hidden lg:block">
          <MarketHeader />
        </div>
        <div className="lg:hidden">
          <ShopHeader />
        </div>
        <div className="flex-1">
          <ShopProfileSkeleton />
        </div>
        <MarketFooter />
      </div>
    );
  }

  if (!shop) {
    notFound();
  }

  const handleChat = () => {
    if (user && (user.uid === shop.id || user.uid === (shop as any).userId || user.uid === (shop as any).ownerId)) {
      toast({
        title: "Pemberitahuan",
        description: "Ini adalah toko milik Anda sendiri.",
      });
      return;
    }
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/chat/${shop.slug}`)}`);
      return;
    }
    router.push(`/chat/${shop.slug}`);
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: "Perlu Masuk",
        description: "Silakan masuk terlebih dahulu untuk mengikuti toko ini.",
      });
      router.push(`/login?redirect=${encodeURIComponent(`/${shop.slug}`)}`);
      return;
    }

    if (user.uid === shop.id || user.uid === (shop as any).userId || user.uid === (shop as any).ownerId) {
      toast({
        variant: "destructive",
        title: "Pemberitahuan",
        description: "Anda tidak dapat mengikuti toko milik Anda sendiri.",
      });
      return;
    }

    setFollowLoading(true);
    const followDocRef = doc(db, "users", user.uid, "followedShops", shop.id);
    const shopDocRef = doc(db, "shops", shop.id);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(followDocRef);
        try {
          await updateDoc(shopDocRef, { followersCount: increment(-1) });
        } catch { }
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast({
          title: "Berhenti Mengikuti",
          description: `Anda telah berhenti mengikuti ${shop.name || "toko ini"}.`,
        });
      } else {
        // Follow
        await setDoc(followDocRef, {
          shopId: shop.id,
          shopName: shop.name || shop.slug,
          shopSlug: shop.slug,
          logoUrl: shop.logoUrl || null,
          city: shop.location?.city || null,
          isOfficial: Boolean(shop.isOfficial || shop.official),
          isVerified: Boolean(shop.isVerified || shop.verified),
          followedAt: new Date().toISOString(),
        });
        try {
          await updateDoc(shopDocRef, { followersCount: increment(1) });
        } catch { }
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast({
          title: "Berhasil Mengikuti Toko",
          description: `Anda kini mengikuti ${shop.name || "toko ini"}. Anda akan mendapatkan update promo & rilis produk terbaru mereka.`,
        });
      }
    } catch (err: any) {
      console.error("Error toggling follow:", err);
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: err.message || "Terjadi kesalahan saat memproses permintaan follow.",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const isVerified = Boolean(shop.isVerified ?? shop.verified ?? shop.is_verified);
  const isOfficial = Boolean(shop.isOfficial ?? shop.official ?? shop.is_official);

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: shop.name,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>
      <div className="lg:hidden">
        <ShopHeader />
      </div>
      <main className="flex-1 w-full pt-14 md:pt-16 pb-20 lg:pb-0">
        {/* Banner Section */}
        <div className="relative h-36 sm:h-52 md:h-72 lg:h-[320px] xl:h-[360px] w-full bg-muted overflow-hidden">
          {shop.bannerUrl ? (
            <Image
              src={shop.bannerUrl}
              alt={shop.name}
              fill
              className="object-cover object-center"
              priority
              data-ai-hint="shop banner"
            />
          ) : (
            <div className="absolute inset-0 bg-[#00AA5B]/5 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-[#00AA5B] opacity-10" />
            </div>
          )}
        </div>

        {/* Shop Info Card */}
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 -mt-4 sm:-mt-6 md:-mt-8 relative z-20 mb-6">
          <Card className="border-border border-[1px] shadow-lg rounded-2xl bg-white overflow-hidden relative">
            <CardContent className="p-3.5 sm:p-5 md:p-6 relative">

              <div className="flex flex-row items-start gap-3 md:gap-6">
                {/* Logo Section - Aligned Left */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-xl md:rounded-2xl bg-white border border-border shadow-sm overflow-hidden relative">
                    {shop.logoUrl ? (
                      <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" data-ai-hint="shop logo" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-lg md:text-3xl font-bold text-white uppercase">{shop.name?.substring(0, 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-white flex items-center justify-center border border-border shadow-xs">
                    <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#00AA5B] animate-pulse"></div>
                  </div>
                </div>

                {/* Info Container - Right of Logo */}
                <div className="flex-1 min-w-0 pr-0">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h1 className="text-base sm:text-xl md:text-2xl font-bold font-headline tracking-tight truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                        {shop.name}
                      </h1>

                      {/* Verified Badge - Rendered 1st */}
                      {isVerified && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative h-5 md:h-6 w-auto shrink-0 transition-transform active:scale-95 inline-flex items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/assets/badge/verified.png"
                                alt="Verified Store"
                                className="h-5 md:h-6 w-auto object-contain"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm md:max-w-md border-border p-6">
                            <DialogHeader>
                              <div className="flex justify-center mb-4">
                                <div className="relative h-10 w-40">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src="/assets/badge/verified.png"
                                    alt="Verified Store"
                                    className="h-10 object-contain mx-auto"
                                  />
                                </div>
                              </div>
                              <DialogTitle className="text-center text-xl font-black font-headline">Toko Terverifikasi MarketPointID</DialogTitle>
                              <DialogDescription className="text-center pt-2 font-medium">
                                Toko ini telah melalui proses verifikasi identitas dan legalitas seller oleh MarketPointID.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 mt-6">
                              <div className="flex items-start gap-4 p-3 rounded-xl bg-[#00AA5B]/5 border border-[#00AA5B]/10">
                                <div className="h-8 w-8 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-black">Identitas Terverifikasi</p>
                                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Penjual terverifikasi resmi oleh sistem MarketPointID.</p>
                                </div>
                              </div>
                            </div>
                            <Button className="w-full mt-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black rounded-xl text-white py-3 h-auto" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                              Mengerti
                            </Button>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Official Badge - Rendered 2nd */}
                      {isOfficial && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative h-5 md:h-6 w-auto shrink-0 transition-transform active:scale-95 inline-flex items-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/assets/badge/officials.png"
                                alt="Official Store"
                                className="h-5 md:h-6 w-auto object-contain"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm md:max-w-md border-border p-6">
                            <DialogHeader>
                              <div className="flex justify-center mb-4">
                                <div className="relative h-12 w-48">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src="/assets/badge/officials.png"
                                    alt="Official Store"
                                    className="h-12 object-contain mx-auto"
                                  />
                                </div>
                              </div>
                              <DialogTitle className="text-center text-xl font-black font-headline">Toko Resmi MarketPointID</DialogTitle>
                              <DialogDescription className="text-center pt-2 font-medium">
                                Toko ini telah diverifikasi oleh MarketPointID sebagai mitra resmi dengan standar pelayanan terbaik.
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
                        <Star className={cn("w-4 h-4", shopReviewStats.totalReviews > 0 ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-300 fill-slate-200")} />
                        <span className="text-xs font-bold text-[#2E3137]">
                          {shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-[11px] font-medium opacity-60">
                          ({shopReviewStats.totalReviews} ulasan)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-[11px] font-medium">{formatFollowers(followersCount)}</span>
                      </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="flex md:hidden items-center gap-2.5 mt-1.5 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className={cn("w-3 h-3", shopReviewStats.totalReviews > 0 ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-300 fill-slate-200")} />
                        <span className="text-[10px] font-bold text-[#212121]">
                          {shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-[9px] font-medium opacity-60">
                          ({shopReviewStats.totalReviews} ulasan)
                        </span>
                      </div>
                      <span className="text-muted-foreground/30">|</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] font-bold text-[#212121]">{formatFollowers(followersCount)}</span>
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
                      onClick={handleChat}
                      className="h-10 px-8 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-lg shadow-[#00AA5B]/10 transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" /> Chat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={cn(
                        "h-10 px-8 rounded-xl font-bold text-xs gap-2 transition-all active:scale-95",
                        isFollowing
                          ? "border-[#00AA5B] text-[#00AA5B] bg-[#00AA5B]/10 hover:bg-[#00AA5B]/15"
                          : "border-border hover:bg-[#F8FAFC]"
                      )}
                    >
                      <Heart className={cn("w-4 h-4 transition-colors", isFollowing ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                      {isFollowing ? "Mengikuti" : "Follow"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      className="h-10 w-10 rounded-xl border-border transition-transform active:scale-95"
                    >
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex md:hidden items-center gap-2 mt-6 pt-4 border-t border-border/50">
                <Button
                  onClick={handleChat}
                  className="flex-1 h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-[10px] gap-2 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={cn(
                    "flex-1 h-9 rounded-xl font-bold text-[10px] gap-2 transition-all",
                    isFollowing
                      ? "border-[#00AA5B] text-[#00AA5B] bg-[#00AA5B]/10 hover:bg-[#00AA5B]/15"
                      : "border-border"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5 transition-colors", isFollowing ? "fill-red-500 text-red-500" : "")} />
                  {isFollowing ? "Mengikuti" : "Follow"}
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
                    <div className={cn("flex items-center gap-1 font-black text-[11px]", shopReviewStats.totalReviews > 0 ? "text-[#00AA5B]" : "text-slate-400")}>
                      <Star className={cn("w-3 h-3", shopReviewStats.totalReviews > 0 ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-300 fill-slate-200")} />
                      <span>{shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Kecepatan respon</span>
                    <span className="text-[11px] font-black text-[#2E3137]">
                      {shop?.responseSpeed || shop?.responseRate || "Sangat baik"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Produk terjual</span>
                    <span className="text-[11px] font-black text-[#2E3137]">
                      {totalProductsSold > 0
                        ? (totalProductsSold >= 1000
                          ? `${(totalProductsSold / 1000).toFixed(1).replace(/\.0$/, "")}rb+`
                          : `${totalProductsSold}`)
                        : "0"}
                    </span>
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
            </div>

            {/* Tab Content Render */}
            {activeTab === "products" && (
              <div className="space-y-8">
                {loadingShopProducts ? (
                  <div className="text-center py-12 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B] mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground">Memuat produk toko...</p>
                  </div>
                ) : shopProducts.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-white rounded-2xl border border-border/80 shadow-xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Belum Ada Produk</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Toko ini belum memiliki produk aktif yang terdaftar di katalog MarketPointID.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {shopProducts.map((product) => {
                      const img = product.images?.[0]?.imageUrl || "https://cdn.marketpoint.id/marketpoint.png";
                      const rating = Number(product.ratingAvg || 0) > 0 ? Number(product.ratingAvg).toFixed(1) : "0.0";
                      const sold = product.salesCount || 0;
                      return (
                        <Card key={product.id} className="group border-border border-[1.5px] shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col">
                          <Link href={`/${slug}/${product.slug || product.id}`} className="block flex-1 flex flex-col">
                            <div className="relative aspect-square bg-muted/20 overflow-hidden">
                              <Image
                                src={img}
                                alt={product.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            </div>
                            <CardContent className="p-2.5 md:p-3 space-y-2 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <h4 className="text-[11px] md:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                                  {product.title}
                                </h4>
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[#000000] text-[12px] md:text-sm font-black">
                                    Rp {(Number(product.price) || 0).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1">
                                  <Star className={cn("w-2.5 h-2.5", Number(rating) > 0 ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-300 fill-slate-200")} />
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    {rating} <span className="opacity-40">|</span> {sold} terjual
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Link>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
                          <h2 className="text-5xl font-black font-headline">
                            {shopReviewStats.totalReviews > 0
                              ? shopReviewStats.ratingAvg.toFixed(1)
                              : "0.0"}
                          </h2>
                          <span className="text-lg font-bold text-muted-foreground">/ 5.0</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "w-5 h-5",
                                shopReviewStats.totalReviews > 0
                                  ? (s <= Math.round(shopReviewStats.ratingAvg) ? "text-[#FFC400] fill-[#FFC400]" : "text-slate-200 fill-slate-100")
                                  : "text-slate-200 fill-slate-100"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground mt-2">
                          {shopReviewStats.totalReviews > 0
                            ? `(${shopReviewStats.totalReviews}) Ulasan Terverifikasi`
                            : "Belum Ada Ulasan Pembeli"}
                        </p>
                      </div>

                      <div className="md:col-span-8 space-y-2.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = shopReviewStats.starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
                          const pct = shopReviewStats.totalReviews > 0
                            ? Math.round((count / shopReviewStats.totalReviews) * 100)
                            : 0;
                          return (
                            <div key={star} className="flex items-center gap-4 group cursor-default">
                              <div className="flex items-center gap-1.5 w-8 shrink-0">
                                <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                                <span className="text-xs font-black">{star}</span>
                              </div>
                              <Progress
                                value={pct}
                                className="h-2 rounded-full bg-muted"
                              />
                              <span className="text-[10px] font-bold text-muted-foreground w-10 text-right opacity-60">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Reviews List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black tracking-tight">Semua Ulasan</h3>
                    <Select value={shopReviewSort} onValueChange={(val: any) => setShopReviewSort(val)}>
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
                    {loadingShopReviews ? (
                      <div className="text-center py-12 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B] mx-auto" />
                        <p className="text-xs font-bold text-muted-foreground">Memuat ulasan...</p>
                      </div>
                    ) : shopReviews.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-2xl bg-white border border-border/80 shadow-xs space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00AA5B] flex items-center justify-center mx-auto">
                          <Star className="w-6 h-6 fill-emerald-100" />
                        </div>
                        <p className="text-sm font-black text-slate-800">Toko Ini Belum Memiliki Ulasan</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Ulasan dan rating dari pembeli yang telah menyelesaikan transaksi akan otomatis ditampilkan di sini.
                        </p>
                      </div>
                    ) : (
                      shopReviews.map((review) => (
                        <Card key={review.id} className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white hover:border-[#00AA5B]/30 transition-all">
                          <CardContent className="p-5 md:p-6 space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                                  {(() => {
                                    const isCurrentUser =
                                      user &&
                                      (review.userId === user.uid ||
                                        review.userId === user.email ||
                                        review.userName === userData?.displayName);
                                    const resolvedAvatar =
                                      isCurrentUser && userData?.photoURL && !userData.photoURL.includes("duck")
                                        ? userData.photoURL
                                        : review.userAvatar && !review.userAvatar.includes("duck")
                                        ? review.userAvatar
                                        : null;

                                    if (resolvedAvatar) {
                                      return (
                                        <img
                                          src={resolvedAvatar}
                                          alt={review.userName}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      );
                                    }
                                    return (
                                      <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                                        {review.userName ? review.userName.substring(0, 1).toUpperCase() : "U"}
                                      </AvatarFallback>
                                    );
                                  })()}
                                </Avatar>
                                <div>
                                  <p className="text-[12px] font-black">{review.userName || "Pembeli MarketPointID"}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "w-2.5 h-2.5",
                                          i < Number(review.rating) ? "text-[#FFC400] fill-[#FFC400]" : "text-muted-foreground opacity-20"
                                        )}
                                      />
                                    ))}
                                    <span className="text-[10px] text-muted-foreground font-medium ml-1.5">
                                      {new Date(review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[8px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                Terverifikasi
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[13px] text-[#2E3137] leading-relaxed font-medium">
                                "{review.comment || `Memberikan rating ${review.rating} bintang.`}"
                              </p>

                              {review.productName && (
                                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-border/50 flex items-center gap-2.5">
                                  <ShoppingBag className="w-4 h-4 text-[#00AA5B] shrink-0" />
                                  <p className="text-[10px] font-bold text-slate-700 truncate">
                                    {review.productName}
                                  </p>
                                </div>
                              )}

                              {review.sellerReply && (
                                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1 text-xs">
                                  <span className="font-bold text-[#00AA5B] text-[10px] uppercase tracking-wider">Balasan Penjual:</span>
                                  <p className="text-slate-700 text-[11px] leading-relaxed">
                                    {review.sellerReply}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
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
              <div className="animate-in fade-in duration-500 space-y-4">
                {vouchersLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-[96px] rounded-2xl bg-muted/30 animate-pulse" />
                    ))}
                  </div>
                ) : shopVouchers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                      <Ticket className="w-8 h-8 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-base font-black tracking-tight">Tidak ada voucher tersedia</h3>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs font-medium">
                      Toko ini belum memiliki promo voucher aktif saat ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {shopVouchers.map((v) => {
                      const isExpired = v.isExpired;
                      const isInactive = v.status === "INACTIVE";
                      const isUnavailable = isExpired || isInactive || v.used >= v.quota;
                      const remaining = v.quota - v.used;
                      const isCopied = copiedVoucherId === v.id;

                      return (
                        <div
                          key={v.id}
                          className={cn(
                            "relative flex flex-row items-stretch bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs",
                            isUnavailable
                              ? "border-slate-200/60 opacity-60 grayscale"
                              : "border-slate-200/90 hover:border-[#00AA5B]/40 hover:shadow-md group"
                          )}
                        >
                          {/* Top & Bottom Tear-Off Notches at Perforation Line */}
                          <div className="absolute top-0 left-[110px] sm:left-[120px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFC] border-b border-slate-200/90 z-20 pointer-events-none" />
                          <div className="absolute bottom-0 left-[110px] sm:left-[120px] -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFC] border-t border-slate-200/90 z-20 pointer-events-none" />

                          {/* LEFT STUB: Discount Badge Section */}
                          <div
                            className={cn(
                              "w-[110px] sm:w-[120px] shrink-0 p-3.5 flex flex-col items-center justify-center text-center relative overflow-hidden select-none",
                              isUnavailable
                                ? "bg-slate-200 text-slate-500"
                                : "bg-gradient-to-br from-[#00AA5B] via-[#00924e] to-[#007a41] text-white"
                            )}
                          >
                            <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-85 px-2 py-0.5 rounded-full bg-white/15">
                              {v.type === "percentage" ? "Diskon" : "Potongan"}
                            </span>
                            <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none my-1.5">
                              {v.type === "percentage" ? `${v.value}%` : `Rp${Math.round(v.value / 1000)}rb`}
                            </div>
                            {v.maxDiscount && v.type === "percentage" ? (
                              <span className="text-[9px] font-medium opacity-90 px-1.5 py-0.5 rounded-md bg-black/15 text-emerald-50">
                                maks. Rp{Math.round(v.maxDiscount / 1000)}rb
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium opacity-80">
                                Voucher Toko
                              </span>
                            )}
                          </div>

                          {/* VERTICAL PERFORATED DIVIDER */}
                          <div className="w-0 self-stretch border-r-2 border-dashed border-slate-200/90 relative z-10 shrink-0" />

                          {/* RIGHT SECTION: Info & Action */}
                          <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 min-w-0 bg-white">
                            {/* Header: Code Pill & Status Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00AA5B] font-mono text-xs font-black tracking-wider border border-dashed border-emerald-300 truncate">
                                <Ticket className="w-3.5 h-3.5 shrink-0" />
                                <span>{v.code}</span>
                              </span>

                              {isUnavailable ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-slate-100 text-slate-500 border-slate-200 shrink-0">
                                  {isExpired ? "Kadaluarsa" : isInactive ? "Nonaktif" : "Habis"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                                  Aktif
                                </Badge>
                              )}
                            </div>

                            {/* Terms / Min purchase */}
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {(v.minPurchase || 0) > 0
                                  ? `Min. belanja Rp${(v.minPurchase || 0).toLocaleString("id-ID")}`
                                  : "Tanpa minimum transaksi"}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                {v.expiry && (
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>s/d {v.expiry}</span>
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 shrink-0">
                                  <Users className="w-3 h-3 shrink-0" />
                                  <span>{remaining <= 0 ? "Habis" : `Sisa ${remaining}`}</span>
                                </span>
                              </div>
                            </div>

                            {/* Action CTA: Salin Kode Button */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                Gunakan saat checkout
                              </span>
                              <button
                                type="button"
                                disabled={isUnavailable}
                                onClick={() => handleCopyVoucher(v.code, v.id)}
                                className={cn(
                                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ml-auto shadow-2xs active:scale-95",
                                  isUnavailable
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                    : isCopied
                                    ? "bg-emerald-600 text-white shadow-emerald-200"
                                    : "bg-[#00AA5B] hover:bg-[#00924e] text-white hover:shadow-xs"
                                )}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin Kode</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            )}
          </div>
        </div>
      </main>
      <MarketFooter />
    </div>
  );
}
