"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShopHeader } from "@/components/shop-header";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { ProductCard } from "@/components/product-card";
import { ShopProfileSkeleton } from "@/components/shop-profile-skeleton";
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from "@/firebase";
import {
  collection,
  query,
  where,
  limit,
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  MessageCircle,
  Star,
  ShoppingBag,
  Clock,
  Heart,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Award,
  Share2,
  Loader2,
  Package,
  Ticket,
  Copy,
  Check,
  Calendar,
  Store,
  SlidersHorizontal,
  Info,
  Phone,
  Globe,
  Instagram,
  Facebook,
  X,
  Sparkles,
  ArrowUpDown,
  Lock,
  Mail,
  Send,
  Youtube,
  Twitter,
  Headphones,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canShopUseFlashSale, canShopUseVouchers } from "@/lib/subscription-plans";
import { formatCountdown } from "@/lib/flash-sale";

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
  "favicon.ico",
  "deals",
  "inbox",
  "official",
  "favorites",
  "wishlist",
]);

export default function ShopProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "vouchers" | "reviews" | "about">("products");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState<number>(1250);
  const [copiedVoucherId, setCopiedVoucherId] = useState<string | null>(null);
  const [copiedHandle, setCopiedHandle] = useState(false);

  // Real-time ticking for flash sale countdowns
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sticky tab detection state & sentinel ref
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const tabSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (tabSentinelRef.current) {
            const headerHeight = window.innerWidth >= 768 ? 64 : 56;
            const rect = tabSentinelRef.current.getBoundingClientRect();
            const shouldBeSticky = rect.top <= headerHeight + 1;
            setIsTabsSticky((prev) => (prev !== shouldBeSticky ? shouldBeSticky : prev));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Fetch Shop Profile by Slug
  const shopQuery = useMemoFirebase(() => {
    if (!slug) return null;
    return query(collection(db, "shops"), where("slug", "==", slug), limit(1));
  }, [db, slug]);

  const { data: shops, loading: shopLoading } = useCollection(shopQuery);
  const shop = shops && shops.length > 0 ? shops[0] : null;

  // Sync followers count
  useEffect(() => {
    if (shop) {
      const count =
        typeof shop.followersCount === "number"
          ? shop.followersCount
          : typeof shop.followers === "number"
            ? shop.followers
            : 0;
      setFollowersCount(count);
    }
  }, [shop]);

  // Check user following status
  useEffect(() => {
    if (!user || !shop?.id || !db) return;
    const followDocRef = doc(db, "users", user.uid, "followedShops", shop.id);
    getDoc(followDocRef)
      .then((snap) => setIsFollowing(snap.exists()))
      .catch((err) => console.error("Error checking follow status:", err));
  }, [user, shop?.id, db]);

  // Products from PostgreSQL
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [loadingShopProducts, setLoadingShopProducts] = useState(false);

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

  // Shop Reviews & Stats from PostgreSQL
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

  // Feature Permissions based on Shop Subscription Plan
  const canUseFlashSaleFeature = useMemo(() => {
    return canShopUseFlashSale(
      shop?.subscription?.planId,
      shop?.subscription?.status,
      shop?.subscription?.expiresAt
    );
  }, [shop?.subscription]);

  const canUseVouchersFeature = useMemo(() => {
    return canShopUseVouchers(
      shop?.subscription?.planId,
      shop?.subscription?.status,
      shop?.subscription?.expiresAt
    );
  }, [shop?.subscription]);

  // Vouchers subcollection from Firestore
  const vouchersColRef = useMemoFirebase(() => {
    if (!shop?.id) return null;
    return query(collection(db, "shops", shop.id, "vouchers"), orderBy("createdAt", "desc"));
  }, [db, shop?.id]);
  const { data: rawVouchers, loading: vouchersLoading } = useCollection(vouchersColRef);

  const shopVouchers = useMemo(() => {
    if (!canUseVouchersFeature || !Array.isArray(rawVouchers)) return [];
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
      scope: v.scope || "ALL_PRODUCTS",
      applicableProductNames: Array.isArray(v.applicableProductNames) ? v.applicableProductNames : [],
    }));
  }, [canUseVouchersFeature, rawVouchers]);

  // Check active shop flash sale session
  const activeShopFlashSale = useMemo(() => {
    if (!canUseFlashSaleFeature || !shop?.flashSales || !Array.isArray(shop.flashSales)) return null;
    return shop.flashSales.find((s: any) => {
      if (s.status !== "ACTIVE" || !s.startTime || !s.endTime) return false;
      const sStart = new Date(s.startTime).getTime();
      const sEnd = new Date(s.endTime).getTime();
      return nowTime >= sStart && nowTime <= sEnd && Array.isArray(s.products) && s.products.length > 0;
    });
  }, [canUseFlashSaleFeature, shop?.flashSales, nowTime]);

  // Verification & Official status
  const isVerified = Boolean(
    shop?.verified ||
    shop?.isVerified ||
    shop?.is_verified ||
    shop?.subscription?.planId === "pro" ||
    shop?.subscription?.planId === "prime" ||
    shop?.subscription?.planId === "admin"
  );
  const isOfficial = Boolean(
    shop?.official ||
    shop?.isOfficial ||
    shop?.is_official ||
    shop?.subscription?.planId === "prime" ||
    shop?.subscription?.planId === "admin" ||
    shop?.slug === "marketpoint" ||
    shop?.id === "marketpoint"
  );

  // Decorate products with live shop data & flash sale sessions
  const decoratedProducts = useMemo(() => {
    return shopProducts.map((p) => ({
      ...p,
      shopId: shop?.id,
      shopSlug: shop?.slug || slug,
      shopName: shop?.name || "Toko Penjual",
      shopLogoUrl: shop?.logoUrl || "",
      shopIsVerified: isVerified,
      shopIsOfficial: isOfficial,
      shopFlashSales: canUseFlashSaleFeature && Array.isArray(shop?.flashSales) ? shop.flashSales : [],
    }));
  }, [shopProducts, shop, slug, isVerified, isOfficial, canUseFlashSaleFeature]);

  const totalProductsSold = useMemo(() => {
    return shopProducts.reduce((acc, p) => acc + (Number(p.salesCount) || 0), 0);
  }, [shopProducts]);

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}rb`;
    }
    return `${count}`;
  };

  // Actions
  const handleChat = () => {
    if (user && (user.uid === shop?.id || user.uid === (shop as any)?.userId || user.uid === (shop as any)?.ownerId)) {
      toast({
        title: "Pemberitahuan",
        description: "Ini adalah toko milik Anda sendiri.",
      });
      return;
    }
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/chat/${shop?.slug || slug}`)}`);
      return;
    }
    router.push(`/chat/${shop?.slug || slug}`);
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast({
        title: "Perlu Masuk",
        description: "Silakan masuk terlebih dahulu untuk mengikuti toko ini.",
      });
      router.push(`/login?redirect=${encodeURIComponent(`/${shop?.slug || slug}`)}`);
      return;
    }

    if (user.uid === shop?.id || user.uid === (shop as any)?.userId || user.uid === (shop as any)?.ownerId) {
      toast({
        variant: "destructive",
        title: "Pemberitahuan",
        description: "Anda tidak dapat mengikuti toko milik Anda sendiri.",
      });
      return;
    }

    setFollowLoading(true);
    const followDocRef = doc(db, "users", user.uid, "followedShops", shop!.id);
    const shopDocRef = doc(db, "shops", shop!.id);

    try {
      if (isFollowing) {
        await deleteDoc(followDocRef);
        try {
          await updateDoc(shopDocRef, { followersCount: increment(-1) });
        } catch { }
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast({
          title: "Berhenti Mengikuti",
          description: `Anda telah berhenti mengikuti ${shop?.name || "toko ini"}.`,
        });
      } else {
        await setDoc(followDocRef, {
          shopId: shop!.id,
          shopName: shop!.name || shop!.slug,
          shopSlug: shop!.slug,
          logoUrl: shop!.logoUrl || null,
          city: shop!.location?.city || null,
          isOfficial,
          isVerified,
          followedAt: new Date().toISOString(),
        });
        try {
          await updateDoc(shopDocRef, { followersCount: increment(1) });
        } catch { }
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast({
          title: "Mengikuti Toko 💚",
          description: `Anda kini mengikuti ${shop?.name || "toko ini"}. Update promo dan rilis baru akan muncul di inbox Anda.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: err.message || "Terjadi kesalahan pada sistem.",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: `${shop?.name || "Toko"} - MarketPointID`,
      text: `Kunjungi profil resmi ${shop?.name || "toko ini"} di MarketPointID!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Tautan Berhasil Disalin! 📋",
        description: "Link toko telah disalin ke clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin tautan.",
      });
    }
  };

  const handleCopyHandle = () => {
    if (typeof window === "undefined" || !shop?.slug) return;
    navigator.clipboard.writeText(`@${shop.slug}`);
    setCopiedHandle(true);
    toast({
      title: "Handle Toko Disalin",
      description: `@${shop.slug} disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const handleCopyVoucher = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucherId(id);
    toast({
      title: "Kode Voucher Berhasil Disalin! 🎟️",
      description: `Gunakan kode "${code}" saat checkout untuk mendapatkan potongan harga.`,
    });
    setTimeout(() => setCopiedVoucherId(null), 2500);
  };

  if (slug && RESERVED_PREFIXES.has(slug.toLowerCase())) {
    notFound();
  }

  if (!mounted || shopLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-slate-900">
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-slate-900">
      {/* HEADER DESKTOP */}
      <div className="hidden lg:block">
        <MarketHeader />
      </div>

      {/* HEADER MOBILE (NATIVE APP STYLE WITH SHOP NAME) */}
      <div className="lg:hidden">
        <ShopHeader
          shopName={shop.name}
          shopSlug={shop.slug}
          isVerified={isVerified}
          isOfficial={isOfficial}
        />
      </div>

      <main className="flex-1 w-full pt-14 md:pt-16 pb-16">
        {/* ========================================================================= */}
        {/* SHOP HEADER CONTAINER (FRAMED BANNER + PROFILE CARD)                     */}
        {/* ========================================================================= */}
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Banner Section with Proportional Aspect Ratio */}
            <div className="relative w-full aspect-[2.6/1] sm:aspect-[3.4/1] md:aspect-[4/1] lg:aspect-[4.5/1] bg-slate-900 overflow-hidden">
              {shop.bannerUrl ? (
                <Image
                  src={shop.bannerUrl}
                  alt={shop.name}
                  fill
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-white/10" />
                </div>
              )}
            </div>

            {/* Shop Profile Bar (Neatly positioned below the banner) */}
            <div className="p-4 sm:p-5 md:p-6 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Column: Avatar & Details */}
                <div className="flex items-start gap-3.5 sm:gap-5 min-w-0">
                  {/* Shop Avatar (Enlarged & centered across the banner border line with clean white border) */}
                  <div className="relative shrink-0 -mt-10 sm:-mt-12 md:-mt-15 z-10">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl sm:rounded-3xl bg-white border-4 border-white shadow-lg overflow-hidden relative">
                      {shop.logoUrl ? (
                        <Image
                          src={shop.logoUrl}
                          alt={shop.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                          <span className="text-2xl sm:text-4xl font-extrabold text-white uppercase">
                            {shop.name?.substring(0, 1) || "T"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name, Badges & Handle */}
                  <div className="flex-1 min-w-0 pt-0.5 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-sm md:max-w-lg">
                        {shop.name}
                      </h1>

                      {/* Verified Store Badge Modal */}
                      {isVerified && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="cursor-pointer inline-flex items-center transition-transform active:scale-95 shrink-0"
                              title="Toko Terverifikasi"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/assets/badge/verified.png"
                                alt="Verified Store"
                                className="h-4 sm:h-5 w-auto object-contain"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm border-slate-200 p-6">
                            <DialogHeader className="space-y-3">
                              <div className="flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/assets/badge/verified.png"
                                  alt="Verified Store"
                                  className="h-8 object-contain"
                                />
                              </div>
                              <DialogTitle className="text-center text-lg font-bold text-slate-900">
                                Toko Terverifikasi
                              </DialogTitle>
                              <DialogDescription className="text-center text-xs text-slate-500 font-medium">
                                Identitas pemilik dan reputasi toko ini telah diverifikasi resmi oleh platform MarketPointID.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#00AA5B] shrink-0 mt-0.5" />
                              <div className="text-xs text-slate-700">
                                <p className="font-bold text-slate-900">Verifikasi Terpercaya</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Belanja lebih aman dengan penjual yang telah melalui proses identifikasi.
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Official Store Badge Modal */}
                      {isOfficial && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="cursor-pointer inline-flex items-center transition-transform active:scale-95 shrink-0"
                              title="Official Store Resmi"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/assets/badge/officials.png"
                                alt="Official Store"
                                className="h-4 sm:h-5 w-auto object-contain"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-md border-slate-200 p-6">
                            <DialogHeader className="space-y-3">
                              <div className="flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/assets/badge/officials.png"
                                  alt="Official Store"
                                  className="h-10 object-contain"
                                />
                              </div>
                              <DialogTitle className="text-center text-lg font-bold text-slate-900">
                                Official Store Resmi
                              </DialogTitle>
                              <DialogDescription className="text-center text-xs text-slate-500 font-medium">
                                Mitra resmi MarketPointID dengan jaminan lisensi original 100% dan dukungan teknis prioritas.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 mt-4">
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-[#00AA5B] shrink-0" />
                                <div className="text-xs text-slate-700">
                                  <p className="font-bold text-slate-900">100% Lisensi Original</p>
                                  <p className="text-[11px] text-slate-600">Garansi aktivasi penuh langsung dari developer.</p>
                                </div>
                              </div>
                              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                                <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
                                <div className="text-xs text-slate-700">
                                  <p className="font-bold text-slate-900">Pengiriman Instan Otomatis</p>
                                  <p className="text-[11px] text-slate-600">Pesanan diproses realtime 24 jam nonstop.</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Slug handle with copy */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyHandle}
                        className="text-[11px] sm:text-xs font-semibold text-[#00AA5B] hover:text-[#00AA5B]/80 flex items-center gap-1 cursor-pointer"
                        title="Salin handle toko"
                      >
                        <span>@{shop.slug}</span>
                        {copiedHandle ? (
                          <Check className="w-3 h-3 text-[#00AA5B]" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                      {shop.location?.city && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{shop.location.city}</span>
                          </span>
                        </>
                      )}
                      {shop.tagline && (
                        <>
                          <span className="text-slate-300 hidden md:inline">•</span>
                          <span className="text-[11px] sm:text-xs text-slate-500 italic hidden md:inline font-medium">
                            "{shop.tagline}"
                          </span>
                        </>
                      )}
                    </div>

                    {/* Desktop Quick Metrics Bar */}
                    <div className="hidden sm:flex items-center gap-4 pt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Star
                          className={cn(
                            "w-3.5 h-3.5",
                            shopReviewStats.totalReviews > 0
                              ? "text-[#FFC400] fill-[#FFC400]"
                              : "text-slate-300 fill-slate-200"
                          )}
                        />
                        <span className="font-bold text-slate-900">
                          {shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({shopReviewStats.totalReviews} ulasan)
                        </span>
                      </div>

                      <span className="text-slate-200">|</span>

                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{formatFollowers(followersCount)}</span>
                        <span className="text-slate-400 text-[11px]">pengikut</span>
                      </div>

                      <span className="text-slate-200">|</span>

                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">
                          {totalProductsSold > 0 ? `${totalProductsSold}` : "0"}
                        </span>
                        <span className="text-slate-400 text-[11px]">terjual</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: CTA Buttons */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pt-2 sm:pt-1">
                  <Button
                    onClick={handleChat}
                    className="flex-1 sm:flex-initial h-9 sm:h-10 px-4 sm:px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat Penjual</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={cn(
                      "flex-1 sm:flex-initial h-9 sm:h-10 px-4 sm:px-5 rounded-xl font-bold text-xs gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs",
                      isFollowing
                        ? "border-[#00AA5B] text-[#00AA5B] bg-[#00AA5B]/10 hover:bg-[#00AA5B]/15"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isFollowing ? "fill-red-500 text-red-500" : "text-slate-400"
                      )}
                    />
                    <span>{isFollowing ? "Mengikuti" : "Follow"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    className="h-9 sm:h-10 w-9 sm:w-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Bagikan tautan toko"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile-Only Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 sm:hidden text-center">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-900">
                    <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                    <span>{shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Rating</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900">{formatFollowers(followersCount)}</p>
                  <p className="text-[10px] text-slate-400">Pengikut</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-100">
                  <p className="text-[11px] font-bold text-slate-900">{totalProductsSold}</p>
                  <p className="text-[10px] text-slate-400">Terjual</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STICKY NAVIGATION TABS (CLEAN UNDERLINE STYLE)                            */}
        {/* ========================================================================= */}
        <div ref={tabSentinelRef} className="h-0 w-full pointer-events-none" />
        <div
          className={cn(
            "sticky top-14 md:top-16 z-30 mb-6 transition-all duration-200",
            isTabsSticky
              ? "bg-white/95 backdrop-blur-md border-y border-slate-200/90 shadow-2xs"
              : "bg-transparent border-y border-transparent shadow-none"
          )}
        >
          <div className="max-w-screen-xl mx-auto px-3 sm:px-4 flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={cn(
                "flex items-center gap-1.5 py-3 sm:py-3.5 px-2.5 text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer shrink-0",
                activeTab === "products"
                  ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Package className="w-4 h-4" />
              <span>Semua Produk</span>
            </button>

            {canUseVouchersFeature && (
              <button
                type="button"
                onClick={() => setActiveTab("vouchers")}
                className={cn(
                  "flex items-center gap-1.5 py-3 sm:py-3.5 px-2.5 text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer shrink-0",
                  activeTab === "vouchers"
                    ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                <Ticket className="w-4 h-4" />
                <span>Voucher Toko</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "flex items-center gap-1.5 py-3 sm:py-3.5 px-2.5 text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer shrink-0",
                activeTab === "reviews"
                  ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Star className="w-4 h-4" />
              <span>Ulasan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={cn(
                "flex items-center gap-1.5 py-3 sm:py-3.5 px-2.5 text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer shrink-0",
                activeTab === "about"
                  ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Store className="w-4 h-4" />
              <span>Tentang Toko</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS                                                              */}
        {/* ========================================================================= */}
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4">
          {/* TAB 1: PRODUK TOKO */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Flash Sale Banner if Active */}
              {activeShopFlashSale && (
                <div className="p-3.5 sm:p-4.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/icon/fire.gif" alt="Flash Sale" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                          ⚡ Flash Sale Sedang Berlangsung!
                        </span>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold border-none shadow-none">
                          {activeShopFlashSale.products?.length || 0} Produk Promo
                        </Badge>
                      </div>
                      <p className="text-[11px] sm:text-xs text-white/90 font-medium">
                        Dapatkan potongan harga spesial kilat sebelum kuota atau batas waktu promo berakhir.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-center bg-black/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      Berakhir: {formatCountdown(Math.max(0, new Date(activeShopFlashSale.endTime).getTime() - nowTime))}
                    </span>
                  </div>
                </div>
              )}

              {/* Product Grid Render */}
              {loadingShopProducts ? (
                <div className="text-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00AA5B] mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">Memuat katalog produk toko...</p>
                </div>
              ) : decoratedProducts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Belum Ada Produk</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Toko ini belum menambahkan produk aktif ke dalam etalase toko.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                  {decoratedProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      nowTime={nowTime}
                      showUpcomingBadge={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VOUCHER TOKO */}
          {activeTab === "vouchers" && canUseVouchersFeature && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {vouchersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : shopVouchers.length === 0 ? (
                <div className="text-center py-20 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Belum Ada Voucher Aktif</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Toko ini belum merilis voucher diskon saat ini. Silakan cek kembali secara berkala.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopVouchers.map((v) => {
                    const isExpired = v.isExpired;
                    const isInactive = v.status === "INACTIVE";
                    const isUnavailable = isExpired || isInactive || (v.quota > 0 && v.used >= v.quota);
                    const remaining = Math.max(0, v.quota - v.used);
                    const isCopied = copiedVoucherId === v.id;

                    return (
                      <div
                        key={v.id}
                        className={cn(
                          "relative flex flex-row items-stretch bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs",
                          isUnavailable
                            ? "border-slate-200 opacity-60 grayscale"
                            : "border-slate-200/90 hover:border-[#00AA5B]/50 hover:shadow-md"
                        )}
                      >
                        {/* Perforation Notches */}
                        <div className="absolute top-0 left-[110px] sm:left-[125px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFC] border-b border-slate-200/90 z-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-[110px] sm:left-[125px] -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-[#F8FAFC] border-t border-slate-200/90 z-20 pointer-events-none" />

                        {/* LEFT STUB */}
                        <div
                          className={cn(
                            "w-[110px] sm:w-[125px] shrink-0 p-3.5 flex flex-col items-center justify-center text-center select-none text-white",
                            isUnavailable
                              ? "bg-slate-300 text-slate-500"
                              : "bg-gradient-to-br from-[#00AA5B] via-[#00924e] to-[#007a41]"
                          )}
                        >
                          <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-90 px-2 py-0.5 rounded-full bg-white/20">
                            {v.type === "percentage" ? "Diskon" : "Potongan"}
                          </span>
                          <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none my-1.5">
                            {v.type === "percentage" ? `${v.value}%` : `Rp${Math.round(v.value / 1000)}rb`}
                          </div>
                          {v.maxDiscount && v.type === "percentage" ? (
                            <span className="text-[9px] font-medium opacity-90 px-1.5 py-0.5 rounded-md bg-black/20">
                              maks. Rp{Math.round(v.maxDiscount / 1000)}rb
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium opacity-80">Voucher Toko</span>
                          )}
                        </div>

                        {/* DASHED DIVIDER */}
                        <div className="w-0 self-stretch border-r-2 border-dashed border-slate-200 relative z-10 shrink-0" />

                        {/* RIGHT INFO */}
                        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 min-w-0 bg-white">
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

                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {(v.minPurchase || 0) > 0
                                ? `Min. belanja Rp${(v.minPurchase || 0).toLocaleString("id-ID")}`
                                : "Tanpa minimum belanja"}
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
                                <span>{v.quota > 0 ? `Sisa ${remaining}` : "Kuota Tersedia"}</span>
                              </span>
                            </div>
                          </div>

                          {/* CTA BUTTON */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                              {v.scope === "SPECIFIC_PRODUCTS" ? "Khusus produk pilihan" : "Semua produk toko"}
                            </span>
                            <Button
                              size="sm"
                              disabled={isUnavailable}
                              onClick={() => handleCopyVoucher(v.code, v.id)}
                              className={cn(
                                "h-8 px-3.5 rounded-xl text-xs font-bold transition-all ml-auto cursor-pointer shadow-2xs",
                                isUnavailable
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : isCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white"
                              )}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 mr-1" />
                                  <span>Salin Kode</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ULASAN TOKO */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Rating Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
                  {/* Left: Overall Score */}
                  <div className="md:col-span-4 flex flex-col items-center text-center space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
                    <div className="flex items-baseline gap-1">
                      <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
                        {shopReviewStats.totalReviews > 0 ? shopReviewStats.ratingAvg.toFixed(1) : "0.0"}
                      </h2>
                      <span className="text-lg font-bold text-slate-400">/ 5.0</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-4 sm:w-5 h-4 sm:h-5",
                            shopReviewStats.totalReviews > 0
                              ? s <= Math.round(shopReviewStats.ratingAvg)
                                ? "text-[#FFC400] fill-[#FFC400]"
                                : "text-slate-200 fill-slate-100"
                              : "text-slate-200 fill-slate-100"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {shopReviewStats.totalReviews > 0
                        ? `Berdasarkan ${shopReviewStats.totalReviews} ulasan terverifikasi`
                        : "Belum ada ulasan dari pembeli"}
                    </p>
                  </div>

                  {/* Right: Star Distribution Bars */}
                  <div className="md:col-span-8 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = shopReviewStats.starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
                      const pct =
                        shopReviewStats.totalReviews > 0
                          ? Math.round((count / shopReviewStats.totalReviews) * 100)
                          : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-10 shrink-0 text-xs font-bold text-slate-700">
                            <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                            <span>{star}</span>
                          </div>
                          <Progress value={pct} className="h-2 rounded-full bg-slate-100 flex-1" />
                          <span className="text-[11px] font-medium text-slate-400 w-12 text-right">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review List & Sort Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Daftar Ulasan ({shopReviewStats.totalReviews})
                  </h3>
                  <Select value={shopReviewSort} onValueChange={(val: any) => setShopReviewSort(val)}>
                    <SelectTrigger className="w-40 h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="newest" className="text-xs">Ulasan Terbaru</SelectItem>
                      <SelectItem value="highest" className="text-xs">Rating Tertinggi</SelectItem>
                      <SelectItem value="lowest" className="text-xs">Rating Terendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingShopReviews ? (
                  <div className="text-center py-12 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B] mx-auto" />
                    <p className="text-xs text-slate-500">Memuat ulasan pembeli...</p>
                  </div>
                ) : shopReviews.length === 0 ? (
                  <div className="text-center py-14 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00AA5B] flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 fill-emerald-100" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Toko Ini Belum Memiliki Ulasan</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Ulasan dari pembeli yang telah menyelesaikan pesanan di toko ini akan otomatis ditampilkan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shopReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-full border border-slate-200">
                              {rev.userAvatar && !rev.userAvatar.includes("duck") && !rev.isAnonymous ? (
                                <AvatarImage src={rev.userAvatar} alt={rev.userName} />
                              ) : (
                                <AvatarFallback className="bg-emerald-50 text-[#00AA5B] text-xs font-bold">
                                  {rev.userName ? rev.userName.substring(0, 1).toUpperCase() : "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {rev.userName || "Pembeli MarketPointID"}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3 h-3",
                                      i < Number(rev.rating)
                                        ? "text-[#FFC400] fill-[#FFC400]"
                                        : "text-slate-200 fill-slate-100"
                                    )}
                                  />
                                ))}
                                <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                                  {new Date(rev.createdAt).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Badge variant="outline" className="text-[9px] font-bold bg-emerald-50 text-[#00AA5B] border-emerald-200 shrink-0">
                            Terverifikasi
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                          "{rev.comment || `Memberikan penilaian rating ${rev.rating} bintang.`}"
                        </p>

                        {rev.productName && (
                          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />
                            <span className="text-[11px] font-medium text-slate-600 truncate">
                              {rev.productName}
                            </span>
                          </div>
                        )}

                        {rev.sellerReply && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00AA5B]">
                              Balasan Penjual:
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed">{rev.sellerReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TENTANG TOKO */}
          {activeTab === "about" && (() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;

            const parseTimeToMinutes = (timeStr?: string) => {
              if (!timeStr) return 0;
              const [h, m] = timeStr.split(":").map(Number);
              return (h || 0) * 60 + (m || 0);
            };

            const todayDay = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];
            const scheduleList = Array.isArray(shop.operational?.schedule) ? shop.operational.schedule : [];
            const todaySched = scheduleList.find((s: any) => s.day === todayDay);

            const isOpenNow = todaySched
              ? todaySched.active &&
                currentTimeMinutes >= parseTimeToMinutes(todaySched.open) &&
                currentTimeMinutes <= parseTimeToMinutes(todaySched.close)
              : true;

            const formatWaLink = (phone: string) => {
              let clean = (phone || "").replace(/[^0-9]/g, "");
              if (clean.startsWith("0")) clean = "62" + clean.substring(1);
              return clean;
            };

            const hasDirectContacts = Boolean(shop.whatsapp || shop.email || shop.website);
            const hasSocials = Boolean(
              shop.socials?.telegram ||
              shop.socials?.instagram ||
              shop.socials?.facebook ||
              shop.socials?.tiktok ||
              shop.socials?.youtube ||
              shop.socials?.twitter
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in duration-300">
                {/* Left Column (8 Cols): Profil, Jam Operasional, Kontak & Medsos */}
                <div className="lg:col-span-8 space-y-5">

                  {/* 1. Main Profile & Highlights Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <Store className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            Profil & Tentang Toko
                          </h3>
                          <p className="text-[11px] text-slate-400">Informasi identitas dan keunggulan {shop.name}</p>
                        </div>
                      </div>

                      {shop.tagline && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#00AA5B] text-xs font-semibold border border-emerald-100 self-start sm:self-auto">
                          <Sparkles className="w-3 h-3 text-[#00AA5B]" />
                          <span>{shop.tagline}</span>
                        </div>
                      )}
                    </div>

                    {/* Description text */}
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                      {shop.description ||
                        `${shop.name} adalah penjual terdaftar di MarketPointID yang menyediakan produk digital, lisensi resmi, template perangkat lunak, dan layanan teknologi terpercaya.`}
                    </div>

                    {/* Quick Highlights Summary Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* Lokasi */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi Asal</p>
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {shop.location?.city ? `${shop.location.city}${shop.location.province ? `, ${shop.location.province}` : ''}` : 'Indonesia'}
                          </p>
                        </div>
                      </div>

                      {/* Jam Buka Hari Ini */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jam Hari Ini</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-block w-2 h-2 rounded-full shrink-0",
                                isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                              )}
                            />
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {isOpenNow ? "Buka Sekarang" : (todaySched?.active ? `${todaySched.open} - ${todaySched.close}` : "Tutup")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pesanan Otomatis */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <Zap className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengiriman Lisensi</p>
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            Instan 24 Jam Nonstop
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Warranty & Store Policy Box (if configured) */}
                    {shop.warrantyPolicy && (
                      <div className="mt-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00AA5B]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Kebijakan & Jaminan Garansi Toko</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-5.5">
                          {shop.warrantyPolicy}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 2. Operational Schedule & Support Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            Jam Operasional Toko & Layanan Chat
                          </h3>
                          <p className="text-[11px] text-slate-400">Jadwal operasional aktif toko setiap minggu</p>
                        </div>
                      </div>

                      <Badge
                        className={cn(
                          "text-[10px] font-bold border px-2.5 py-0.5",
                          isOpenNow
                            ? "bg-emerald-50 text-[#00AA5B] border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {isOpenNow ? "● Buka Sekarang" : "● Sedang Tutup"}
                      </Badge>
                    </div>

                    {/* Support Note Callout */}
                    {shop.operational?.supportNote ? (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <Headphones className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">Catatan Dukungan & Jam Respon Chat</p>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                            {shop.operational.supportNote}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                        <Headphones className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Pemesanan otomatis instan berjalan 24 jam nonstop. Layanan tanya jawab teknis dan pesan chat aktif pada jam kerja reguler.
                        </p>
                      </div>
                    )}

                    {/* Sleek Schedule Table */}
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden bg-slate-50/30">
                      {scheduleList.length > 0 ? (
                        scheduleList.map((sch: any, idx: number) => {
                          const isToday = sch.day === todayDay;
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors",
                                isToday ? "bg-emerald-50/70 font-bold" : "hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(isToday ? "text-[#00AA5B] font-bold" : "text-slate-700")}>
                                  {sch.day}
                                </span>
                                {isToday && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#00AA5B] text-white">
                                    Hari Ini
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[11px]",
                                  sch.active
                                    ? isToday
                                      ? "text-[#00AA5B] font-bold"
                                      : "text-slate-800 font-medium"
                                    : "text-slate-400"
                                )}
                              >
                                {sch.active ? `${sch.open || "08:00"} - ${sch.close || "20:00"} WIB` : "Tutup / Libur"}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500">
                          Toko ini melayani pesanan setiap hari secara online 24 jam.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Contact & Socials Card (if configured) */}
                  {(hasDirectContacts || hasSocials) && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                            <Globe className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                              Kontak & Media Sosial Resmi
                            </h3>
                            <p className="text-[11px] text-slate-400">Saluran komunikasi langsung dan akun resmi toko</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Klik untuk membuka</span>
                      </div>

                      {/* Direct Contacts Row */}
                      {hasDirectContacts && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                            Saluran Komunikasi Langsung
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* WhatsApp */}
                            {shop.whatsapp && (
                              <a
                                href={`https://wa.me/${formatWaLink(shop.whatsapp)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                                    <Phone className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00AA5B]">WhatsApp CS</p>
                                    <p className="text-[11px] text-slate-500 truncate">{shop.whatsapp}</p>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00AA5B] shrink-0" />
                              </a>
                            )}

                            {/* Email */}
                            {shop.email && (
                              <a
                                href={`mailto:${shop.email}`}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-red-50/60 border border-slate-200/80 hover:border-red-300 transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA4335] flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#EA4335]">Email Dukungan</p>
                                    <p className="text-[11px] text-slate-500 truncate">{shop.email}</p>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#EA4335] shrink-0" />
                              </a>
                            )}

                            {/* Website */}
                            {shop.website && (
                              <a
                                href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                                    <Globe className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#00AA5B]">Website Resmi</p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                      {shop.website.replace(/^https?:\/\//, "")}
                                    </p>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00AA5B] shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Socials Media Chips */}
                      {hasSocials && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                            Media Sosial Toko
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Instagram */}
                            {shop.socials?.instagram && (
                              <a
                                href={`https://instagram.com/${shop.socials.instagram.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-pink-50/60 border border-slate-200/80 hover:border-pink-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
                                <span className="font-semibold">@{shop.socials.instagram.replace("@", "")}</span>
                              </a>
                            )}

                            {/* Telegram */}
                            {shop.socials?.telegram && (
                              <a
                                href={
                                  shop.socials.telegram.startsWith("http")
                                    ? shop.socials.telegram
                                    : `https://t.me/${shop.socials.telegram.replace("@", "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                                <span className="font-semibold">
                                  {shop.socials.telegram.startsWith("@")
                                    ? shop.socials.telegram
                                    : `@${shop.socials.telegram.replace(/^https?:\/\/t\.me\//, "")}`}
                                </span>
                              </a>
                            )}

                            {/* TikTok */}
                            {shop.socials?.tiktok && (
                              <a
                                href={`https://tiktok.com/@${shop.socials.tiktok.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <span className="font-black text-[10px] text-slate-900">TT</span>
                                <span className="font-semibold">@{shop.socials.tiktok.replace("@", "")}</span>
                              </a>
                            )}

                            {/* YouTube */}
                            {shop.socials?.youtube && (
                              <a
                                href={
                                  shop.socials.youtube.startsWith("http")
                                    ? shop.socials.youtube
                                    : `https://youtube.com/${shop.socials.youtube.startsWith("@") ? shop.socials.youtube : "@" + shop.socials.youtube}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200/80 hover:border-red-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
                                <span className="font-semibold">YouTube</span>
                              </a>
                            )}

                            {/* X / Twitter */}
                            {shop.socials?.twitter && (
                              <a
                                href={`https://x.com/${shop.socials.twitter.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <Twitter className="w-3.5 h-3.5 text-slate-900" />
                                <span className="font-semibold">@{shop.socials.twitter.replace("@", "")}</span>
                              </a>
                            )}

                            {/* Facebook */}
                            {shop.socials?.facebook && (
                              <a
                                href={
                                  shop.socials.facebook.startsWith("http")
                                    ? shop.socials.facebook
                                    : `https://facebook.com/${shop.socials.facebook}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 text-xs text-slate-700 transition-all cursor-pointer"
                              >
                                <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                                <span className="font-semibold">Facebook</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Column (4 Cols): Jaminan Belanja Aman (Sticky) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 lg:sticky lg:top-32">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#00AA5B]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Jaminan Belanja Aman
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Escrow */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Rekening Bersama (Escrow)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Dana pembayaran Anda aman disimpan platform hingga produk Anda terima dan aktif dengan normal.
                          </p>
                        </div>
                      </div>

                      {/* Instant Delivery */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Pengiriman Otomatis Instan</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Akses unduhan dan lisensi langsung terbit seketika di email dan dashboard akun Anda.
                          </p>
                        </div>
                      </div>

                      {/* CS Support */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Pusat Mediasi & Bantuan</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Customer Support siap memfasilitasi klaim garansi bila terjadi kendala aktivasi produk.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2 text-xs text-[#00AA5B] font-bold">
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>Transaksi Terlindungi 100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
