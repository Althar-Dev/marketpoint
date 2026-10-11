"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
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
  Star,
  ChevronLeft,
  Search,
  Store,
  CheckCircle2,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  Clock,
  X,
  Loader2,
  CheckCheck,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Data model: Balasan ulasan dari toko untuk akun pembeli
interface StoreReviewReplyItem {
  id: string;
  orderId: string;
  replyDate: string;
  isUnread: boolean;
  shop: {
    name: string;
    slug: string;
    logo?: string;
    isOfficial?: boolean;
    isVerified?: boolean;
  };
  product: {
    title: string;
    slug: string;
    variant: string;
    image: string;
    price: number;
  };
  myReview: {
    rating: number;
    comment: string;
    reviewDate: string;
  };
  sellerReply: {
    message: string;
    repliedAt: string;
  };
}

const INITIAL_STORE_REPLIES: StoreReviewReplyItem[] = [
  {
    id: "reply-1",
    orderId: "INV/20261005/MP/8839102",
    replyDate: "Hari ini, 09:15",
    isUnread: true,
    shop: {
      name: "Digital Pro Store",
      slug: "digital-pro",
      logo: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    product: {
      title: "Windows 11 Pro Original Lifetime Retail Key License",
      slug: "windows-11-pro-license",
      variant: "Retail License 64-Bit",
      price: 185000,
      image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80",
    },
    myReview: {
      rating: 5,
      comment: "Lisensinya langsung aktif permanen tanpa kendala. Pengiriman key otomatis dan super cepat!",
      reviewDate: "5 Okt 2026",
    },
    sellerReply: {
      message: "Terima kasih banyak Kak atas ulasan positif dan rating bintang 5-nya! Senang lisensi Windows 11 Pro nya bisa langsung aktif dengan lancar. Jika ada kendala teknis atau butuh bantuan lebih lanjut, jangan ragu hubungi tim support kami via chat ya. Sukses selalu kak! 🙏✨",
      repliedAt: "Hari ini, 09:15",
    },
  },
  {
    id: "reply-2",
    orderId: "INV/20260915/MP/6620199",
    replyDate: "Kemarin, 14:30",
    isUnread: true,
    shop: {
      name: "Master Code Official",
      slug: "master-code",
      logo: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    product: {
      title: "Next.js 15 Tailwind SaaS Dashboard Starter Kit",
      slug: "saas-dashboard-starter-kit",
      variant: "Full Source Code + Figma",
      price: 320000,
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80",
    },
    myReview: {
      rating: 5,
      comment: "Source codenya clean banget, integrasi Tailwind dan Next.js Turbopack-nya ngebut. Dokumentasi instalasinya juga sangat lengkap.",
      reviewDate: "16 Sep 2026",
    },
    sellerReply: {
      message: "Halo Kak! Terima kasih banyak atas apresiasi ulasan bintang 5-nya. Kami sangat senang starter kit ini bermanfaat untuk mempercepat project Anda. Pembaruan v2.0 untuk fitur autentikasi tambahan juga sudah tersedia di repositori. Sukses terus untuk bisnis SaaS-nya ya! 🚀",
      repliedAt: "Kemarin, 14:30",
    },
  },
  {
    id: "reply-3",
    orderId: "INV/20260928/MP/7710294",
    replyDate: "3 hari yang lalu",
    isUnread: false,
    shop: {
      name: "CloudTech Official",
      slug: "cloudtech-official",
      logo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    product: {
      title: "VPS Cloud Linux NVMe Hosting SSD - 4GB RAM 2 Core",
      slug: "vps-cloud-linux-nvme",
      variant: "Paket 1 Bulan",
      price: 95000,
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80",
    },
    myReview: {
      rating: 5,
      comment: "Setup cepat, latency rendah, server sangat stabil selama 2 minggu running tanpa kendala sama sekali.",
      reviewDate: "28 Sep 2026",
    },
    sellerReply: {
      message: "Terima kasih banyak kak sudah mempercayakan kebutuhan server cloud kepada CloudTech Official. Kami selalu berkomitmen menjaga uptime dan stabilitas jaringan server Anda. Jika ingin upgrade spesifikasi di masa mendatang, kami siap membantu dengan diskon renewal khusus! ⚡",
      repliedAt: "3 hari yang lalu",
    },
  },
];

export default function ReviewsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // Data state
  const [replies, setReplies] = useState<StoreReviewReplyItem[]>(INITIAL_STORE_REPLIES);
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");
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

  const { data: userData } = useDoc(userRef);
  const { data: wallet } = useDoc(walletRef);
  const { data: shop } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
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

  const handleMarkAllRead = () => {
    setReplies(replies.map((item) => ({ ...item, isUnread: false })));
    toast({
      title: "Semua Ditandai Dibaca",
      description: "Semua balasan ulasan toko telah ditandai sudah dibaca.",
    });
  };

  const handleMarkItemRead = (id: string) => {
    setReplies(
      replies.map((item) =>
        item.id === id ? { ...item, isUnread: false } : item
      )
    );
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
  const unreadCount = replies.filter((r) => r.isUnread).length;

  const filteredReplies = replies.filter((item) => {
    const matchFilter =
      filterTab === "all"
        ? true
        : filterTab === "unread"
        ? item.isUnread
        : !item.isUnread;

    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      query === "" ||
      item.shop.name.toLowerCase().includes(query) ||
      item.product.title.toLowerCase().includes(query) ||
      item.sellerReply.message.toLowerCase().includes(query) ||
      item.myReview.comment.toLowerCase().includes(query);

    return matchFilter && matchSearch;
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
              <h1 className="text-sm font-bold leading-tight">Balasan Ulasan</h1>
              <p className="text-[10px] text-muted-foreground">Tanggapan resmi dari penjual</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-[#00AA5B] hover:underline"
            >
              Tandai Dibaca
            </button>
          )}
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
                activeItem="inbox-reviews"
                handleLogout={handleLogout}
              />
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 space-y-4">
              <Card className="border border-border/50 shadow-xs bg-white rounded-2xl overflow-hidden p-4 sm:p-6">
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#00AA5B]" />
                      Balasan Ulasan dari Toko
                      {unreadCount > 0 && (
                        <Badge className="bg-[#00AA5B] text-white text-[10px] font-bold px-2 py-0 border-none">
                          {unreadCount} Baru
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lihat respon dan tanggapan langsung dari penjual atas ulasan yang pernah kamu berikan.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari toko atau ulasan..."
                        className="h-9 pl-9 pr-3 text-xs rounded-xl border-border/70 bg-[#F8FAFC] focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {unreadCount > 0 && !isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="h-9 text-xs font-bold rounded-xl border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-[#00AA5B]" />
                        Tandai Semua Dibaca
                      </Button>
                    )}
                  </div>
                </div>

                {/* FILTER TABS */}
                <div className="flex items-center gap-1.5 pt-4 pb-2 border-b border-border/50 overflow-x-auto no-scrollbar">
                  <Button
                    size="sm"
                    variant={filterTab === "all" ? "default" : "outline"}
                    onClick={() => setFilterTab("all")}
                    className={cn(
                      "h-8 px-3.5 rounded-xl text-xs font-bold transition-all",
                      filterTab === "all"
                        ? "bg-[#00AA5B] text-white hover:bg-[#00AA5B]/90 shadow-xs"
                        : "border-border/70 text-muted-foreground hover:text-foreground bg-white"
                    )}
                  >
                    Semua Balasan ({replies.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterTab === "unread" ? "default" : "outline"}
                    onClick={() => setFilterTab("unread")}
                    className={cn(
                      "h-8 px-3.5 rounded-xl text-xs font-bold transition-all",
                      filterTab === "unread"
                        ? "bg-[#00AA5B] text-white hover:bg-[#00AA5B]/90 shadow-xs"
                        : "border-border/70 text-muted-foreground hover:text-foreground bg-white"
                    )}
                  >
                    Belum Dibaca ({unreadCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterTab === "read" ? "default" : "outline"}
                    onClick={() => setFilterTab("read")}
                    className={cn(
                      "h-8 px-3.5 rounded-xl text-xs font-bold transition-all",
                      filterTab === "read"
                        ? "bg-[#00AA5B] text-white hover:bg-[#00AA5B]/90 shadow-xs"
                        : "border-border/70 text-muted-foreground hover:text-foreground bg-white"
                    )}
                  >
                    Sudah Dibaca ({replies.length - unreadCount})
                  </Button>
                </div>

                {/* LIST KARTU BALASAN TOKO */}
                <div className="mt-4 space-y-4">
                  {filteredReplies.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
                        <CheckCircle2 className="w-7 h-7 text-[#00AA5B]" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Tidak Ada Balasan Ulasan</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        {filterTab === "unread"
                          ? "Semua tanggapan dari penjual telah kamu baca."
                          : "Belum ada balasan dari penjual pada ulasan yang kamu berikan."}
                      </p>
                    </div>
                  ) : (
                    filteredReplies.map((item) => (
                      <article
                        key={item.id}
                        onClick={() => item.isUnread && handleMarkItemRead(item.id)}
                        className={cn(
                          "p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer",
                          item.isUnread
                            ? "bg-[#00AA5B]/[0.02] border-[#00AA5B]/40 shadow-xs ring-1 ring-[#00AA5B]/20"
                            : "bg-white border-border/60 hover:border-border hover:shadow-xs"
                        )}
                      >
                        {/* Unread Left Indicator Bar */}
                        {item.isUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00AA5B]" />
                        )}

                        {/* Store Header & Time */}
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                              <AvatarImage src={item.shop.logo} alt={item.shop.name} />
                              <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                                {item.shop.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/${item.shop.slug}`}
                                  className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00AA5B] truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.shop.name}
                                </Link>
                                {item.shop.isOfficial && (
                                  <img
                                    src="/assets/badge/officials.png"
                                    alt="Official"
                                    className="w-3.5 h-3.5 object-contain shrink-0"
                                  />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Membalas {item.sellerReply.repliedAt}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.isUnread && (
                              <Badge className="bg-[#00AA5B] text-white text-[9px] font-bold px-1.5 py-0 border-none">
                                Baru
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              {item.orderId}
                            </span>
                          </div>
                        </div>

                        {/* STORE REPLY MESSAGE (HIGHLIGHT UTAMA) */}
                        <div className="mt-3.5 p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00AA5B]">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Tanggapan Penjual:</span>
                          </div>
                          <p className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed font-medium pl-5">
                            &quot;{item.sellerReply.message}&quot;
                          </p>
                        </div>

                        {/* ORIGINAL REVIEW BY BUYER (KUTIPAN ULASAN KITA) */}
                        <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              Ulasan yang kamu berikan:
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "w-3 h-3",
                                    s <= item.myReview.rating
                                      ? "text-[#FFC400] fill-[#FFC400]"
                                      : "text-gray-200 fill-gray-200"
                                  )}
                                />
                              ))}
                              <span className="text-[10px] font-bold text-muted-foreground ml-1">
                                {item.myReview.reviewDate}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground/90 italic pl-2 border-l-2 border-border/70">
                            &quot;{item.myReview.comment}&quot;
                          </p>

                          {/* PRODUCT DETAILS STRIP */}
                          <div className="flex items-center gap-3 bg-[#F8FAFC] p-2.5 rounded-xl border border-border/50 mt-2">
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-foreground truncate">
                                {item.product.title}
                              </h5>
                              <p className="text-[10px] text-muted-foreground">
                                {item.product.variant} • Rp {item.product.price.toLocaleString("id-ID")}
                              </p>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border/70 hover:bg-white gap-1"
                              >
                                <Link href={`/chat/${item.shop.slug}`}>
                                  <MessageCircle className="w-3 h-3 text-[#00AA5B]" />
                                  Chat Toko
                                </Link>
                              </Button>

                              <Button
                                asChild
                                size="sm"
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1"
                              >
                                <Link href={`/${item.shop.slug}/${item.product.slug}`}>
                                  <ShoppingBag className="w-3 h-3" />
                                  Beli Lagi
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
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
