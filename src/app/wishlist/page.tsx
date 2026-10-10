"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { PromoPriceBadge } from "@/components/promo-price-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ChevronLeft,
  Search,
  Share2,
  Store,
  Star,
  ShoppingBag,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

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
    if (!authLoading && !user) {
      router.push("/login?redirect=/wishlist");
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPoint!",
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

  const handleShareWishlist = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: "Wishlist Saya di MarketPoint",
      text: "Lihat daftar wishlist produk impian saya di MarketPoint!",
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
        title: "Link Disalin! 📋",
        description: "Tautan wishlist Anda telah disalin ke clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin tautan.",
      });
    }
  };

  if (!mounted || authLoading) {
    if (!isMobile) return <DesktopProfileSkeleton />;
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AA5B]" />
      </div>
    );
  }

  if (!user) return null;

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col">
      {/* HEADER DESKTOP */}
      {!isMobile && <MarketHeader />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold leading-tight">Wishlist Saya</h1>
              <p className="text-[10px] text-muted-foreground">{productsList.length} barang disimpan</p>
            </div>
          </div>
          <button
            onClick={handleShareWishlist}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </header>
      )}

      {/* MAIN CONTAINER WITH SAFE DESKTOP NAVBAR OFFSET */}
      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-20 md:pb-12">
          <div className="flex gap-6 items-start">
            {/* DESKTOP SIDEBAR */}
            {!isMobile && (
              <DesktopAccountSidebar
                user={user}
                wallet={wallet}
                hasShop={hasShop}
                displayName={user.displayName || ""}
                activeItem="profile-wishlist"
                handleLogout={handleLogout}
              />
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 space-y-4">
              <Card className="border border-border/50 shadow-xs bg-white rounded-2xl overflow-hidden p-4 sm:p-6">
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
                  <div>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      Wishlist Saya
                      <Badge className="bg-[#00AA5B] text-white text-[10px] font-bold px-2 py-0 border-none">
                        {productsList.length} Barang
                      </Badge>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Daftar produk yang Anda simpan untuk dibeli nanti.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="wishlist-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari produk di wishlist..."
                        className="h-9 pl-9 pr-3 text-xs rounded-xl border-border/70 bg-[#F8FAFC] focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          aria-label="Hapus pencarian wishlist"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {!isMobile && (
                      <Button
                        id="wishlist-share-btn"
                        variant="outline"
                        size="sm"
                        onClick={handleShareWishlist}
                        className="h-9 text-xs font-bold rounded-xl border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0 gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Bagikan
                      </Button>
                    )}
                  </div>
                </div>

                {/* PRODUCT GRID - PERSIS SEPERTI BERANDA */}
                <div className="pt-4">
                  {isWishlistLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <Card key={idx} className="border-border/80 shadow-2xs rounded-xl overflow-hidden bg-card flex flex-col border-[1px]">
                          <CardContent className="p-0 flex flex-col h-full">
                            <div className="aspect-square w-full bg-muted/40 animate-pulse" />
                            <div className="p-2 sm:p-2.5 space-y-1.5">
                              <div className="h-3 w-3/4 bg-muted/40 rounded-md animate-pulse" />
                              <div className="h-3.5 w-1/2 bg-muted/40 rounded-md animate-pulse" />
                              <div className="h-2.5 w-1/3 bg-muted/40 rounded-md animate-pulse" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
                        <Heart className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Wishlist Anda Masih Kosong</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Simpan produk yang Anda minati dengan menekan tombol Wishlist pada halaman produk agar tersimpan di sini.
                      </p>
                      <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-xs h-9 px-5 mt-2">
                        <Link href="/">Jelajahi Produk</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
                      {filteredProducts.map((product: any) => {
                        const imageUrl =
                          product.imageUrl ||
                          (product.images && product.images.length > 0 ? product.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png");
                        const price = Number(product.price || 0);
                        const rating = Number(product.ratingAvg || 5.0).toFixed(1);
                        const soldText = product.salesCount ? (typeof product.salesCount === "string" ? product.salesCount : `${product.salesCount} terjual`) : "0 terjual";
                        const shopName = typeof product.shopName === "string" ? product.shopName : "MarketPoint";
                        const shopLogoUrl = typeof product.shopLogoUrl === "string" ? product.shopLogoUrl : "";
                        const isVerified = Boolean(product.shopIsVerified);
                        const isOfficial = Boolean(product.shopIsOfficial);

                        return (
                          <Link key={product.id || product.productId} href={`/${product.shopSlug || 'marketpoint'}/${product.slug || product.id || product.productId}`}>
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
                                    <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                                      {product.title}
                                    </h4>
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs sm:text-sm font-bold text-[#000000]">
                                          Rp {price.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 pt-1">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
                                      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                                        {rating} <span className="opacity-40">|</span> {soldText}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="flex items-center gap-1 min-w-0">
                                        {shopLogoUrl ? (
                                          /* eslint-disable-next-line @next/next/no-img-element */
                                          <img
                                            src={shopLogoUrl}
                                            alt={String(shopName)}
                                            className="w-[18px] h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                                          />
                                        ) : (
                                          <div className="w-[18px] h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                            <Store className="w-2.5 h-2.5 text-white" />
                                          </div>
                                        )}
                                        <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[70px] sm:max-w-[90px]">
                                          {String(shopName)}
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
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
