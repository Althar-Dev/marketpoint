"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, deleteDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Store,
  ChevronLeft,
  Search,
  MessageCircle,
  Heart,
  Star,
  MapPin,
  Users,
  ExternalLink,
  ShoppingBag,
  X,
  Loader2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
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

  const shopsList = followedDocs || [];

  const filteredShops = shopsList.filter((item: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (item.shopName || item.name || "").toLowerCase();
    const slug = (item.shopSlug || item.slug || "").toLowerCase();
    const city = (item.city || "").toLowerCase();
    return name.includes(query) || slug.includes(query) || city.includes(query);
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
              <h1 className="text-sm font-bold leading-tight">Toko Favorit</h1>
              <p className="text-[10px] text-muted-foreground">{shopsList.length} toko diikuti</p>
            </div>
          </div>
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
                activeItem="profile-favorites"
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
                      <Store className="w-5 h-5 text-[#00AA5B]" />
                      Toko Favorit Saya
                      <Badge className="bg-[#00AA5B] text-white text-[10px] font-bold px-2 py-0 border-none">
                        {shopsList.length} Toko
                      </Badge>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Daftar toko yang Anda ikuti secara langsung dari platform MarketPointID.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="favorites-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari toko favorit..."
                        className="h-9 pl-9 pr-3 text-xs rounded-xl border-border/70 bg-[#F8FAFC] focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          aria-label="Hapus pencarian toko favorit"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* LIST KARTU TOKO FAVORIT NYATA */}
                <div className="mt-5">
                  {isFollowedLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <div key={idx} className="p-5 rounded-2xl border border-border/70 bg-white space-y-4 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-muted/60" />
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3.5 w-1/3 bg-muted/60 rounded" />
                              <div className="h-3 w-1/4 bg-muted/60 rounded" />
                            </div>
                          </div>
                          <div className="h-8 bg-muted/60 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : filteredShops.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-[#00AA5B]">
                        <Store className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">Belum Ada Toko Favorit</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Anda belum mengikuti toko mana pun. Buka profil toko yang Anda percayai dan klik tombol Follow untuk memfavoritkannya.
                      </p>
                      <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-xs h-9 px-5 mt-2">
                        <Link href="/">Jelajahi Toko</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-white hover:border-[#00AA5B]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                          >
                            {/* Shop Header Info & Action Buttons */}
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="h-12 w-12 rounded-xl border border-border/80 shrink-0">
                                    <AvatarImage src={logoUrl} alt={shopName} />
                                    <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-sm font-bold">
                                      {shopName.substring(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        href={`/${shopSlug}`}
                                        className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00AA5B] truncate"
                                      >
                                        {shopName}
                                      </Link>
                                      {isVerified && (
                                        <img
                                          src="/assets/badge/verified.png"
                                          alt="Verified"
                                          className="w-3.5 h-3.5 object-contain shrink-0"
                                        />
                                      )}
                                      {isOfficial && (
                                        <img
                                          src="/assets/badge/officials.png"
                                          alt="Official"
                                          className="w-3.5 h-3.5 object-contain shrink-0"
                                        />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#00AA5B] font-bold">@{shopSlug}</p>

                                    <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                                      <div className="flex items-center gap-0.5 text-[#FFC400]">
                                        <Star className="w-3 h-3 fill-[#FFC400]" />
                                        <span className="font-bold text-foreground">4.9</span>
                                      </div>
                                      <span>•</span>
                                      <div className="flex items-center gap-0.5">
                                        <MapPin className="w-3 h-3" />
                                        <span>{city}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Unfollow Toggle Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnfollow(item)}
                                  className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-[#00AA5B] text-[#00AA5B] bg-[#00AA5B]/5 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all shrink-0 group/unfollow"
                                  title="Berhenti Mengikuti"
                                >
                                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 group-hover/unfollow:fill-none" />
                                  <span className="group-hover/unfollow:hidden">Mengikuti</span>
                                  <span className="hidden group-hover/unfollow:inline">Batal</span>
                                </Button>
                              </div>
                            </div>

                            {/* Quick Action CTA Buttons */}
                            <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                              <Button
                                onClick={() => handleChatShop(shopSlug)}
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 rounded-xl font-bold text-xs gap-1.5 border-border/70 hover:bg-[#F8FAFC]"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#00AA5B]" /> Chat Toko
                              </Button>

                              <Button
                                asChild
                                size="sm"
                                className="flex-1 h-8 rounded-xl font-bold text-xs bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5 shadow-xs"
                              >
                                <Link href={`/${shopSlug}`}>
                                  Kunjungi Toko <ArrowRight className="w-3 h-3" />
                                </Link>
                              </Button>
                            </div>
                          </div>
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
