"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, deleteDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import { PromoPriceBadge } from "@/components/promo-price-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  ChevronLeft,
  Search,
  Share2,
  Store,
  Star,
  ShoppingBag,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// SKELETON LENGKAP SAAT PERTAMA KALI MASUK ATAU REFRESH F5
function WishlistFullSkeleton() {
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
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-7 h-7 rounded-lg" />
          </div>
        </div>

        <div className="p-3 pb-8">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square w-full bg-slate-100 animate-pulse">
                  <Skeleton className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80" />
                </div>
                <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded-md mt-1.5" />
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-slate-50">
                    <Skeleton className="h-2.5 w-1/3 rounded" />
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                      <Skeleton className="h-2.5 w-14 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                        <Skeleton className="h-3.5 w-20 rounded bg-[#00AA5B]/20" />
                        <Skeleton className="h-3 w-18 rounded" />
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
                        <Skeleton className="h-5 w-28 rounded-md" />
                        <Skeleton className="h-4.5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3.5 w-64 rounded" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Skeleton className="w-64 h-9 rounded-lg" />
                      <Skeleton className="w-24 h-9 rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col"
                      >
                        <div className="relative aspect-square w-full bg-slate-100 animate-pulse">
                          <Skeleton className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80" />
                        </div>
                        <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-full rounded" />
                            <Skeleton className="h-3.5 w-3/4 rounded" />
                            <Skeleton className="h-4.5 w-1/2 rounded-md mt-2" />
                          </div>
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Skeleton className="w-3 h-3 rounded-full" />
                              <Skeleton className="h-3 w-16 rounded" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                              <Skeleton className="h-3 w-20 rounded" />
                            </div>
                          </div>
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

export default function WishlistPage() {
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

  // Real database query: Ambil produk yang disimpan pengguna di users/{uid}/wishlist
  const wishlistQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "wishlist");
  }, [db, user]);

  const { data: userData } = useDoc(userRef);
  const { data: wallet } = useDoc(walletRef);
  const { data: shop } = useDoc(shopRef);
  const { data: wishlistDocs, loading: isWishlistLoading } = useCollection(wishlistQuery);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      (window as any).__MP_APP_INITIALIZED__ = true;
    }
    if (!authLoading && !user) {
      router.push("/login?redirect=/wishlist");
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

  const handleRemoveWishlist = async (productId: string, productTitle: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "wishlist", String(productId)));
      toast({
        title: "Dihapus dari Wishlist",
        description: `"${productTitle}" telah dihapus dari wishlist.`,
      });
    } catch (err: any) {
      console.error("Gagal menghapus wishlist:", err);
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: err.message || "Terjadi kendala saat memproses permintaan.",
      });
    }
  };

  const handleShareWishlist = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: "Wishlist Saya di MarketPointID",
      text: "Lihat daftar produk impian saya di MarketPointID!",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Share API error:", err);
        } else {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Tautan Disalin",
        description: "Tautan wishlist Anda berhasil disalin ke clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin tautan.",
      });
    }
  };

  const hasShop = userData?.hasShop === true || !!shop;
  const productsList = wishlistDocs || [];

  const filteredProducts = productsList.filter((p: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title?.toLowerCase().includes(query) ||
      (typeof p.shopName === "string" && p.shopName.toLowerCase().includes(query))
    );
  });

  // 1. SAAT PERTAMA KALI MASUK / F5: Tampilkan Full Page Skeleton (refresh semua)
  if (!isClientNav && (!mounted || authLoading || isWishlistLoading)) {
    return <WishlistFullSkeleton />;
  }

  // 2. SAAT BERPINDAH HALAMAN: Layout (Header & Sidebar) tetap utuh di tempatnya,
  // dan HANYA area konten kartu wishlist yang menampilkan skeleton loading!
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
                placeholder="Cari produk di wishlist..."
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
                <h1 className="text-sm font-bold text-slate-900 truncate">Wishlist Saya</h1>
                {productsList.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
                    {productsList.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Cari di wishlist"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleShareWishlist}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Bagikan tautan wishlist"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-8 md:pb-12">
          <div className="flex gap-6 items-start">
            {/* DESKTOP SIDEBAR - Tetap stabil di desktop tanpa kedip saat ganti halaman */}
            <DesktopAccountSidebar
                user={user}
                wallet={wallet}
                hasShop={hasShop}
                displayName={user?.displayName || ""}
                activeItem="profile-wishlist"
                handleLogout={handleLogout}
              />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-transparent md:bg-white rounded-none md:rounded-2xl border-0 md:border md:border-slate-200/80 shadow-none md:shadow-xs p-0 md:p-5">
                {/* Header Title & Actions (Desktop) */}
                <div className="hidden md:flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Wishlist Saya</h2>
                      {!mounted || authLoading || isWishlistLoading ? (
                        <Skeleton className="h-4.5 w-16 rounded-full" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#00AA5B] bg-[#00AA5B]/10 px-2 py-0.5 rounded-full">
                          {productsList.length} Barang
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Daftar produk digital impian yang Anda simpan untuk dibeli kapan saja.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari di wishlist..."
                        className="h-9 pl-9 pr-8 text-xs rounded-lg border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                          title="Hapus pencarian"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareWishlist}
                      className="h-9 px-3.5 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:text-slate-900 gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </Button>
                  </div>
                </div>

                {/* PRODUCT GRID / SKELETON / EMPTY STATE */}
                <div>
                  {!mounted || authLoading || isWishlistLoading ? (
                    <>
                      {/* SKELETON MOBILE (2 Kolom) */}
                      <div className="md:hidden grid grid-cols-2 gap-2.5">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col"
                          >
                            <div className="relative aspect-square w-full bg-slate-100 animate-pulse">
                              <Skeleton className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80" />
                            </div>
                            <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-4/5 rounded" />
                                <Skeleton className="h-3 w-3/5 rounded" />
                                <Skeleton className="h-4 w-1/2 rounded-md mt-1.5" />
                              </div>
                              <div className="space-y-1.5 pt-1 border-t border-slate-50">
                                <Skeleton className="h-2.5 w-1/3 rounded" />
                                <div className="flex items-center gap-1.5">
                                  <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                                  <Skeleton className="h-2.5 w-14 rounded" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* SKELETON DESKTOP (5 Kolom Proposional) */}
                      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col"
                          >
                            <div className="relative aspect-square w-full bg-slate-100 animate-pulse">
                              <Skeleton className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80" />
                            </div>
                            <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <Skeleton className="h-3.5 w-full rounded" />
                                <Skeleton className="h-3.5 w-3/4 rounded" />
                                <Skeleton className="h-4.5 w-1/2 rounded-md mt-2" />
                              </div>
                              <div className="space-y-2 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <Skeleton className="w-3 h-3 rounded-full" />
                                  <Skeleton className="h-3 w-16 rounded" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                                  <Skeleton className="h-3 w-20 rounded" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : productsList.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="text-center py-16 px-4 space-y-3 bg-white rounded-xl border border-slate-200/80 md:border-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Heart className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                          Wishlist Anda Masih Kosong
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                          Simpan produk yang Anda sukai dengan menekan ikon hati agar tersimpan di sini dan mudah ditemukan kembali.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button
                          asChild
                          className="rounded-lg font-bold bg-[#00AA5B] hover:bg-[#00924e] text-xs h-9 px-4 shadow-xs"
                        >
                          <Link href="/">
                            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Jelajahi Produk
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    /* EMPTY SEARCH RESULT */
                    <div className="text-center py-12 px-4 space-y-2 bg-white rounded-xl border border-slate-200/80 md:border-0">
                      <Search className="w-7 h-7 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">
                        Tidak ada produk yang cocok dengan "{searchQuery}"
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-[#00AA5B] font-bold hover:underline cursor-pointer"
                      >
                        Reset Pencarian
                      </button>
                    </div>
                  ) : (
                    /* PRODUCT CARDS GRID */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                      {filteredProducts.map((product: any) => {
                        const targetId = String(product.id || product.productId);
                        const imageUrl =
                          product.imageUrl ||
                          (product.images && product.images.length > 0
                            ? product.images[0]?.imageUrl || product.images[0]
                            : null) ||
                          "/assets/img/cate.png";

                        const price = Number(product.price || 0);
                        const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
                        const rating = product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : "5.0";
                        const soldText = product.salesCount || "0 terjual";
                        const shopName = product.shopName || "Toko Partner";
                        const shopLogoUrl = product.shopLogoUrl || "";
                        const isVerified = product.isVerified === true;
                        const isOfficial = product.isOfficial === true;

                        const productHref = product.slug && product.shopSlug
                          ? `/${product.shopSlug}/${product.slug}`
                          : `/products/${targetId}`;

                        return (
                          <div
                            key={targetId}
                            className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col relative"
                          >
                            {/* Floating Heart / Remove Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveWishlist(targetId, product.title);
                              }}
                              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-2xs text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer border border-slate-200/60"
                              title="Hapus dari Wishlist"
                            >
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            </button>

                            <Link href={productHref} className="flex-1 flex flex-col">
                              {/* Product Thumbnail */}
                              <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                                <Image
                                  src={imageUrl}
                                  alt={product.title}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>

                              {/* Product Info */}
                              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                                <div className="space-y-1">
                                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                                    {product.title}
                                  </h3>

                                  <div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                                      Rp {(discountPrice || price).toLocaleString("id-ID")}
                                    </p>
                                    {discountPrice && discountPrice < price && (
                                      <p className="text-[10px] text-slate-400 line-through">
                                        Rp {price.toLocaleString("id-ID")}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                  {/* Rating & Sales */}
                                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                    <span className="font-semibold text-slate-700">{rating}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate">{soldText}</span>
                                  </div>

                                  {/* Shop info */}
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {shopLogoUrl ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={shopLogoUrl}
                                        alt={String(shopName)}
                                        className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200"
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                        <Store className="w-2.5 h-2.5" />
                                      </div>
                                    )}
                                    <span className="text-[11px] text-slate-500 font-medium truncate">
                                      {String(shopName)}
                                    </span>
                                    {isVerified && (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src="/assets/badge/verified.png"
                                        alt="Verified"
                                        className="w-3.5 h-3.5 object-contain shrink-0"
                                      />
                                    )}
                                    {isOfficial && (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src="/assets/badge/officials.png"
                                        alt="Official"
                                        className="w-3.5 h-3.5 object-contain shrink-0"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
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

      {/* FOOTER DESKTOP */}
      <div className="hidden md:block">
        <MarketFooter />
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden">
        <MarketBottomNav />
      </div>
    </div>
  );
}
