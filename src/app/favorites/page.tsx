"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, deleteDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Store,
  ChevronLeft,
  Search,
  MessageCircle,
  Heart,
  Star,
  MapPin,
  X,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

// SKELETON LENGKAP SAAT PERTAMA KALI MASUK / REFRESH F5
function FavoritesFullSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col">
      {/* MOBILE FULL SKELETON (md:hidden) */}
      <div className="md:hidden flex flex-col flex-1">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-3.5 h-12 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4.5 w-24 rounded-md" />
              <Skeleton className="h-4 w-5 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>

        <div className="p-3 pb-8 space-y-2.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <Skeleton className="h-10 rounded-xl w-full" />
                <Skeleton className="h-10 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP FULL SKELETON (hidden md:flex) */}
      <div className="hidden md:flex flex-col flex-1">
        <MarketHeader />
        <div className="flex-1 w-full pt-16">
          <main className="max-w-screen-xl mx-auto w-full p-6 pb-12">
            <div className="flex gap-6 items-start">
              {/* Desktop Sidebar Skeleton */}
              <aside className="w-[260px] shrink-0 space-y-4 sticky top-20">
                <div className="border border-border/50 shadow-sm bg-white rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-2.5 w-32 rounded" />
                    </div>
                  </div>

                  <div className="space-y-2.5 py-3.5 border-t border-border/50">
                    <Skeleton className="h-8 w-full rounded-full" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>

                  <div className="py-2.5 border-t border-border/50">
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="w-3.5 h-3.5 rounded" />
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-3.5 w-20 rounded" />
                      </div>
                      <Skeleton className="w-3.5 h-3.5 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-3.5 w-20 rounded" />
                        </div>
                        <Skeleton className="w-3.5 h-3.5 rounded" />
                      </div>
                      <div className="pl-6 space-y-2">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-3 w-18 rounded" />
                        <Skeleton className="h-3.5 w-22 rounded bg-[#00AA5B]/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content Area Skeleton */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32 rounded-md" />
                        <Skeleton className="h-4.5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3.5 w-64 rounded" />
                    </div>
                    <Skeleton className="w-64 h-9 rounded-lg shrink-0" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <Skeleton className="h-4 w-32 rounded" />
                              <Skeleton className="h-3 w-20 rounded" />
                            </div>
                          </div>
                          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                          <Skeleton className="h-3 w-20 rounded" />
                          <Skeleton className="h-3 w-24 rounded" />
                        </div>
                        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                          <Skeleton className="h-10 rounded-xl w-full" />
                          <Skeleton className="h-10 rounded-xl w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { user: hookUser, loading: authLoading } = useUser();
  const auth = useAuth();
  const user = hookUser || auth?.currentUser || null;
  // Deteksi apakah ini perpindahan halaman (client-side navigation) atau reload pertama / F5
  const isClientNav = typeof window !== "undefined" && Boolean((window as any).__MP_APP_INITIALIZED__);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  // Real Database Query: Ambil toko yang di-follow oleh user secara real-time
  const followedShopsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "followedShops");
  }, [db, user]);

  const { data: userData } = useDoc(userRef);
  const { data: wallet } = useDoc(walletRef);
  const { data: shop } = useDoc(shopRef);
  const { data: followedDocs, loading: isFollowedLoading } = useCollection(followedShopsQuery);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      (window as any).__MP_APP_INITIALIZED__ = true;
    }
    if (!authLoading && !user) {
      router.push("/login?redirect=/favorites");
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPointID!",
      });
      router.push("/login");
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Keluar",
        description: "Terjadi gangguan pada sistem.",
      });
    }
  };

  const handleUnfollow = async (shopItem: any) => {
    if (!user || !db) return;
    try {
      const docId = shopItem.id || shopItem.shopId;
      await deleteDoc(doc(db, "users", user.uid, "followedShops", docId));
      toast({
        title: "Berhenti Mengikuti",
        description: `Anda telah berhenti mengikuti ${shopItem.shopName || shopItem.name || "toko ini"}.`,
      });
    } catch (err: any) {
      console.error("Error unfollowing shop:", err);
      toast({
        variant: "destructive",
        title: "Gagal Berhenti Mengikuti",
        description: err.message || "Terjadi kesalahan.",
      });
    }
  };

  const handleChatShop = (slug: string) => {
    router.push(`/chat/${slug}`);
  };

  const hasShop = userData?.hasShop === true || !!shop;
  const shopsList = followedDocs || [];

  const filteredShops = shopsList.filter((item: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (item.shopName || item.name || "").toLowerCase();
    const slug = (item.shopSlug || item.slug || "").toLowerCase();
    const city = (item.city || "").toLowerCase();
    return name.includes(query) || slug.includes(query) || city.includes(query);
  });

  // 1. SAAT PERTAMA KALI MASUK / F5: Tampilkan Full Page Skeleton (refresh semua)
  if (!isClientNav && (!mounted || authLoading || isFollowedLoading)) {
    return <FavoritesFullSkeleton />;
  }

  // 2. SAAT BERPINDAH HALAMAN: Layout (Header & Sidebar) tetap utuh di tempatnya,
  // dan HANYA area konten kartu toko favorit yang menampilkan skeleton loading!
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col">
      {/* HEADER DESKTOP */}
      <div className="hidden md:block">
        <MarketHeader />
      </div>

      {/* MOBILE APP BAR (SLEEK 48PX STICKY BAR) */}
      <div className="sticky top-0 z-40 md:hidden bg-white border-b border-slate-200/80 shadow-2xs">
        {isMobileSearchOpen ? (
          <header className="px-3.5 h-12 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Tutup pencarian"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari toko favorit..."
                className="h-8.5 pl-9 pr-8 text-xs rounded-lg border-slate-200 bg-slate-50 focus-visible:ring-[#00AA5B] w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title="Hapus teks"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>
        ) : (
          <header className="px-3.5 h-12 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Kembali"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">Toko Favorit</h1>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Cari toko favorit"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}
      </div>

      {/* MAIN CONTAINER WITH SAFE DESKTOP NAVBAR OFFSET */}
      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-8 md:pb-12">
          <div className="flex gap-6 items-start">
            {/* DESKTOP SIDEBAR - Tetap stabil di desktop tanpa kedip saat ganti halaman */}
            <DesktopAccountSidebar
                user={user}
                wallet={wallet}
                hasShop={hasShop}
                displayName={user?.displayName || ""}
                activeItem="profile-favorites"
                handleLogout={handleLogout}
              />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-transparent md:bg-white rounded-none md:rounded-2xl border-0 md:border md:border-slate-200/80 shadow-none md:shadow-xs p-0 md:p-5">
                {/* Header Title & Actions (Desktop Only) */}
                <div className="hidden md:flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Toko Favorit</h2>
                      {!mounted || authLoading || isFollowedLoading ? (
                        <Skeleton className="h-4.5 w-16 rounded-full" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#00AA5B] bg-[#00AA5B]/10 px-2 py-0.5 rounded-full">
                          {shopsList.length} Toko
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Daftar toko penjual digital terpercaya yang Anda ikuti secara langsung.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama toko atau kota..."
                        className="h-9 pl-9 pr-8 text-xs rounded-lg border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Hapus pencarian toko favorit"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* LIST KARTU TOKO FAVORIT / SKELETON / EMPTY STATE */}
                <div>
                  {!mounted || authLoading || isFollowedLoading ? (
                    /* SKELETON KONTEN TOKO FAVORIT */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3.5">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-3 w-20 rounded" />
                              </div>
                            </div>
                            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-3 w-24 rounded" />
                          </div>
                          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                            <Skeleton className="h-10 rounded-xl w-full" />
                            <Skeleton className="h-10 rounded-xl w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredShops.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="text-center py-16 px-4 space-y-3 bg-white rounded-xl border border-slate-200/80 md:border-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Store className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                          {searchQuery ? `Tidak ada toko dengan nama "${searchQuery}"` : "Belum Ada Toko Favorit"}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                          {searchQuery
                            ? "Coba gunakan kata kunci pencarian yang lain."
                            : "Ikuti toko yang Anda percaya untuk memantau katalog produk digital terbaru dan promo spesial."}
                        </p>
                      </div>
                      {!searchQuery && (
                        <div className="pt-2">
                          <Button
                            asChild
                            className="rounded-lg font-bold bg-[#00AA5B] hover:bg-[#00924e] text-xs h-9 px-4 shadow-xs cursor-pointer"
                          >
                            <Link href="/">
                              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Jelajahi Toko
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TOKO FAVORIT CARDS GRID */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3.5">
                      {filteredShops.map((item: any) => {
                        const shopName = item.shopName || item.name || "Toko Penjual";
                        const shopSlug = item.shopSlug || item.slug || item.id;
                        const logoUrl = item.logoUrl || "";
                        const city = item.city || "Indonesia";
                        const isOfficial = Boolean(item.isOfficial);
                        const isVerified = Boolean(item.isVerified);

                        return (
                          <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all p-4 flex flex-col justify-between space-y-3.5 relative"
                          >
                            {/* Header row: Avatar + Name + Floating Unfollow Heart */}
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-12 w-12 rounded-xl border border-slate-200/80 shrink-0 bg-white">
                                  <AvatarImage src={logoUrl} alt={shopName} className="object-cover" />
                                  <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-sm font-bold">
                                    {shopName.substring(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Link
                                      href={`/${shopSlug}`}
                                      className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00AA5B] transition-colors truncate"
                                      title={shopName}
                                    >
                                      {shopName}
                                    </Link>
                                    {isOfficial && (
                                      <img
                                        src="/assets/badge/officials.png"
                                        alt="Official Store"
                                        className="w-3.5 h-3.5 object-contain shrink-0"
                                        title="Official Store"
                                      />
                                    )}
                                    {isVerified && !isOfficial && (
                                      <img
                                        src="/assets/badge/verified.png"
                                        alt="Verified Store"
                                        className="w-3.5 h-3.5 object-contain shrink-0"
                                        title="Verified Store"
                                      />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium truncate">@{shopSlug}</p>
                                </div>
                              </div>

                              {/* Unfollow Button: Clean circular heart toggle */}
                              <button
                                type="button"
                                onClick={() => handleUnfollow(item)}
                                className="w-8 h-8 rounded-full border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
                                title="Berhenti mengikuti toko ini"
                              >
                                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 hover:scale-110 transition-transform" />
                              </button>
                            </div>

                            {/* Store Meta Row (Rating & Location) */}
                            <div className="flex items-center gap-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                <span>4.9</span>
                              </div>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{city}</span>
                              </div>
                            </div>

                            {/* Action CTA Buttons - Balanced 50/50 Grid, Solid & Proper Height */}
                            <div className="pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                              <Button
                                type="button"
                                onClick={() => handleChatShop(shopSlug)}
                                variant="outline"
                                className="h-10 rounded-xl font-bold text-xs sm:text-[13px] gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer w-full shadow-2xs transition-all"
                              >
                                <MessageCircle className="w-4 h-4 text-[#00AA5B] shrink-0" />
                                <span>Chat Toko</span>
                              </Button>

                              <Button
                                asChild
                                className="h-10 rounded-xl font-bold text-xs sm:text-[13px] bg-[#00AA5B] hover:bg-[#00924e] text-white shadow-xs cursor-pointer w-full transition-all"
                              >
                                <Link href={`/${shopSlug}`} className="flex items-center justify-center gap-1.5">
                                  <span>Kunjungi Toko</span>
                                  <ArrowRight className="w-4 h-4 shrink-0" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER DESKTOP ONLY */}
      <div className="hidden md:block">
        <MarketFooter />
      </div>
    </div>
  );
}
