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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BellRing,
  ChevronLeft,
  Search,
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  Tag,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Megaphone,
  Zap,
  Gift,
  Clock,
  X,
  Loader2,
  Ticket,
  Bell,
  Flame,
  CheckCheck,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interface untuk item update feed
interface UpdateItem {
  id: string;
  type: "flash_sale" | "voucher" | "shop" | "system";
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  author: {
    name: string;
    slug?: string;
    avatar?: string;
    isOfficial?: boolean;
    isVerified?: boolean;
  };
  bannerImage?: string;
  actionUrl?: string;
  actionText?: string;

  // Khusus Flash Sale Toko
  flashSaleData?: {
    productTitle: string;
    productImage: string;
    productSlug: string;
    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    soldPercent: number;
    stockRemaining: number;
    targetSeconds: number; // Untuk countdown timer
    isUpcoming?: boolean;
    hasReminder?: boolean;
  };

  // Khusus Voucher Toko
  voucherData?: {
    code: string;
    discountText: string;
    minSpendText: string;
    validUntil: string;
    isClaimed: boolean;
  };
}

const INITIAL_UPDATES: UpdateItem[] = [
  {
    id: "upd-flash-1",
    type: "flash_sale",
    title: "⚡ Flash Sale Terbatas: Windows 11 Pro Retail Key Diskon 73%!",
    message: "Promo kilat 4 jam saja dari Digital Pro Store! Kuota lisensi retail original sangat terbatas, dapatkan garansi aktivasi seumur hidup dengan harga terendah bulan ini.",
    time: "10 menit yang lalu",
    isUnread: true,
    author: {
      name: "Digital Pro Store",
      slug: "digital-pro",
      avatar: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    flashSaleData: {
      productTitle: "Windows 11 Pro Original Lifetime Retail Key License 64-Bit",
      productImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&auto=format&fit=crop&q=80",
      productSlug: "windows-11-pro-license",
      originalPrice: 185000,
      salePrice: 49900,
      discountPercent: 73,
      soldPercent: 82,
      stockRemaining: 5,
      targetSeconds: 3 * 3600 + 42 * 60 + 18, // 3 jam 42 menit
    },
    actionUrl: "/digital-pro/windows-11-pro-license",
    actionText: "Beli Flash Sale",
  },
  {
    id: "upd-voucher-1",
    type: "voucher",
    title: "🎟️ Voucher Toko Baru: Potongan Rp 50.000 dari Master Code Official!",
    message: "Klaim voucher spesial toko kami untuk pembelian semua produk template SaaS, microservices starter kit, dan komponen UI. Berlaku untuk 50 transaksi pertama!",
    time: "1 jam yang lalu",
    isUnread: true,
    author: {
      name: "Master Code Official",
      slug: "master-code",
      avatar: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    voucherData: {
      code: "MASTER50K",
      discountText: "Potongan Rp 50.000",
      minSpendText: "Min. Belanja Rp 150.000",
      validUntil: "25 Okt 2026",
      isClaimed: false,
    },
    actionUrl: "/master-code",
    actionText: "Kunjungi Toko",
  },
  {
    id: "upd-flash-2",
    type: "flash_sale",
    title: "⏰ Flash Sale Akan Datang Pukul 19:00: VPS NVMe High Performance 4GB RAM",
    message: "CloudTech Official akan membuka kuota diskon 50% untuk langganan server VPS NVMe SSD. Pasang pengingat agar kamu tidak ketinggalan saat kuota dibuka!",
    time: "3 jam yang lalu",
    isUnread: false,
    author: {
      name: "CloudTech Official",
      slug: "cloudtech-official",
      avatar: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    flashSaleData: {
      productTitle: "VPS Cloud Linux NVMe Hosting SSD - 4GB RAM 2 Core",
      productImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80",
      productSlug: "vps-cloud-linux-nvme",
      originalPrice: 95000,
      salePrice: 47500,
      discountPercent: 50,
      soldPercent: 0,
      stockRemaining: 20,
      targetSeconds: 5 * 3600 + 15 * 60,
      isUpcoming: true,
      hasReminder: false,
    },
    actionUrl: "/cloudtech-official/vps-cloud-linux-nvme",
    actionText: "Lihat Produk",
  },
  {
    id: "upd-voucher-2",
    type: "voucher",
    title: "🎟️ Voucher Diskon 20% dari Graphic Studio ID",
    message: "Spesial untuk para desainer & kreator konten! Gunakan voucher ini untuk download 10.000+ aset 3D pack dan ilustrasi vektor komersial.",
    time: "Kemarin, 15:40",
    isUnread: false,
    author: {
      name: "Graphic Studio ID",
      slug: "graphic-studio-id",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
      isOfficial: true,
      isVerified: true,
    },
    voucherData: {
      code: "3DPACK20",
      discountText: "Diskon 20%",
      minSpendText: "Min. Belanja Rp 50.000",
      validUntil: "30 Okt 2026",
      isClaimed: true,
    },
    actionUrl: "/graphic-studio-id",
    actionText: "Gunakan Voucher",
  },
  {
    id: "upd-sys-1",
    type: "system",
    title: "📢 Update Fitur: Kotak Masuk Balasan Ulasan Toko & Tampilan Responsif",
    message: "Sekarang kamu dapat memantau setiap balasan resmi dari penjual atas ulasanmu secara langsung di Kotak Masuk, serta menikmati pengalaman navigasi yang lebih mulus di HP dan Desktop.",
    time: "2 hari yang lalu",
    isUnread: false,
    author: {
      name: "MarketPointID Care",
      avatar: "/assets/avatar/duck.png",
      isOfficial: true,
    },
    actionUrl: "/inbox/reviews",
    actionText: "Cek Balasan Ulasan",
  },
];

export default function UpdatesPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [updates, setUpdates] = useState<UpdateItem[]>(INITIAL_UPDATES);
  const [activeTab, setActiveTab] = useState<"all" | "flash_sale" | "voucher" | "system">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Countdown timer state (decrementing seconds)
  const [countdowns, setCountdowns] = useState<Record<string, number>>({
    "upd-flash-1": 3 * 3600 + 42 * 60 + 18,
    "upd-flash-2": 5 * 3600 + 15 * 60,
  });

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

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns((prev) => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          next[k] = Math.max(0, v - 1);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    setUpdates(updates.map((item) => ({ ...item, isUnread: false })));
    toast({
      title: "Semua Update Ditandai Dibaca",
      description: "Kotak masuk update Anda kini bersih.",
    });
  };

  const handleMarkItemRead = (id: string) => {
    setUpdates(
      updates.map((item) =>
        item.id === id ? { ...item, isUnread: false } : item
      )
    );
  };

  // Klaim voucher toko
  const handleClaimVoucher = (itemId: string, voucherCode: string) => {
    setUpdates(
      updates.map((item) => {
        if (item.id === itemId && item.voucherData) {
          return {
            ...item,
            isUnread: false,
            voucherData: { ...item.voucherData, isClaimed: true },
          };
        }
        return item;
      })
    );

    toast({
      title: "Voucher Berhasil Diklaim! 🎟️",
      description: `Kode ${voucherCode} telah tersimpan ke akun Anda dan siap dipakai saat checkout.`,
    });
  };

  // Salin kode voucher
  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Kode Voucher Disalin! 📋",
      description: `Kode "${code}" disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Toggle pengingat Flash Sale
  const handleToggleReminder = (itemId: string, productTitle: string) => {
    setUpdates(
      updates.map((item) => {
        if (item.id === itemId && item.flashSaleData) {
          const nextReminder = !item.flashSaleData.hasReminder;
          toast({
            title: nextReminder ? "Pengingat Diaktifkan! ⏰" : "Pengingat Dibatalkan",
            description: nextReminder
              ? `Kami akan mengirim notifikasi saat Flash Sale "${productTitle}" dimulai.`
              : "Pengingat Flash Sale telah dimatikan.",
          });
          return {
            ...item,
            flashSaleData: { ...item.flashSaleData, hasReminder: nextReminder },
          };
        }
        return item;
      })
    );
  };

  // Format detik ke format HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
  const unreadCount = updates.filter((u) => u.isUnread).length;

  const filteredUpdates = updates.filter((item) => {
    const matchTab = activeTab === "all" ? true : item.type === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      query === "" ||
      item.title.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query) ||
      item.author.name.toLowerCase().includes(query) ||
      (item.voucherData && item.voucherData.code.toLowerCase().includes(query)) ||
      (item.flashSaleData && item.flashSaleData.productTitle.toLowerCase().includes(query));

    return matchTab && matchSearch;
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
              <h1 className="text-sm font-bold leading-tight">Update Promo & Toko</h1>
              <p className="text-[10px] text-muted-foreground">Flash Sale & Voucher Toko</p>
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
                activeItem="inbox-updates"
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
                      <BellRing className="w-5 h-5 text-[#00AA5B]" />
                      Kotak Masuk Update
                      {unreadCount > 0 && (
                        <Badge className="bg-[#00AA5B] text-white text-[10px] font-bold px-2 py-0 border-none">
                          {unreadCount} Baru
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pemberitahuan Flash Sale kilat, Voucher Toko resmi, dan info pembaruan produk.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari promo, voucher, toko..."
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

                {/* TABS KATEGORI PROMOSI */}
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => setActiveTab(val as any)}
                  className="w-full mt-4"
                >
                  <div className="border-b border-border/50 pb-3 overflow-x-auto no-scrollbar">
                    <TabsList className="bg-muted/40 p-1 rounded-xl h-10 w-full sm:w-auto inline-flex gap-1">
                      <TabsTrigger
                        value="all"
                        className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-xs px-3.5"
                      >
                        Semua Update ({updates.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="flash_sale"
                        className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-xs px-3.5"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                        Flash Sale Toko
                      </TabsTrigger>
                      <TabsTrigger
                        value="voucher"
                        className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-xs px-3.5"
                      >
                        <Ticket className="w-3.5 h-3.5 mr-1.5 text-[#00AA5B]" />
                        Voucher Toko
                      </TabsTrigger>
                      <TabsTrigger
                        value="system"
                        className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs px-3.5"
                      >
                        <Megaphone className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                        Info Sistem
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* FEED CONTENT */}
                  <div className="mt-4 space-y-4">
                    {filteredUpdates.length === 0 ? (
                      <div className="text-center py-12 px-4 space-y-3">
                        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
                          <CheckCircle2 className="w-7 h-7 text-[#00AA5B]" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Tidak Ada Update</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Belum ada promo atau voucher baru pada kategori ini.
                        </p>
                      </div>
                    ) : (
                      filteredUpdates.map((item) => (
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
                          {/* Unread Indicator Bar */}
                          {item.isUnread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00AA5B]" />
                          )}

                          {/* Author Header & Timestamp */}
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                                <AvatarImage src={item.author.avatar} alt={item.author.name} />
                                <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                                  {item.author.name.substring(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {item.author.slug ? (
                                    <Link
                                      href={`/${item.author.slug}`}
                                      className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00AA5B] truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.author.name}
                                    </Link>
                                  ) : (
                                    <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                                      {item.author.name}
                                    </span>
                                  )}
                                  {item.author.isOfficial && (
                                    <img
                                      src="/assets/badge/officials.png"
                                      alt="Official"
                                      className="w-3.5 h-3.5 object-contain shrink-0"
                                    />
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {item.time}
                                </p>
                              </div>
                            </div>

                            {/* Badge Kategori Promo */}
                            <div className="flex items-center gap-2">
                              {item.isUnread && (
                                <Badge className="bg-[#00AA5B] text-white text-[9px] font-bold px-1.5 py-0 border-none">
                                  Baru
                                </Badge>
                              )}
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-bold px-2.5 py-0.5 border-none flex items-center gap-1",
                                  item.type === "flash_sale"
                                    ? "bg-amber-500/15 text-amber-700"
                                    : item.type === "voucher"
                                    ? "bg-emerald-500/15 text-emerald-700"
                                    : "bg-blue-500/15 text-blue-700"
                                )}
                              >
                                {item.type === "flash_sale" ? (
                                  <>
                                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Flash Sale
                                  </>
                                ) : item.type === "voucher" ? (
                                  <>
                                    <Ticket className="w-3 h-3 text-[#00AA5B]" /> Voucher Toko
                                  </>
                                ) : (
                                  <>
                                    <Megaphone className="w-3 h-3 text-blue-500" /> Info
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>

                          {/* Title & Message */}
                          <div className="pt-3 space-y-2.5">
                            <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#00AA5B] transition-colors leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs text-foreground/80 leading-relaxed font-normal">
                              {item.message}
                            </p>

                            {/* ============================================================ */}
                            {/* KHUSUS: KARTU FLASH SALE TOKO INTERAKTIF */}
                            {/* ============================================================ */}
                            {item.flashSaleData && (
                              <div
                                className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/25 space-y-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Header Flash Sale Strip: Live Countdown Timer */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                                    <Flame className="w-4 h-4 text-orange-600 fill-orange-600 animate-pulse" />
                                    <span>
                                      {item.flashSaleData.isUpcoming ? "FLASH SALE AKAN DATANG" : "FLASH SALE BERLANGSUNG"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                    <Timer className="w-3.5 h-3.5 text-orange-600" />
                                    <span className="text-[11px] font-medium text-amber-800">
                                      {item.flashSaleData.isUpcoming ? "Dimulai dalam:" : "Berakhir dalam:"}
                                    </span>
                                    <span className="font-mono bg-orange-600 text-white text-[11px] px-2 py-0.5 rounded-md font-bold tracking-wider">
                                      {formatTime(countdowns[item.id] ?? item.flashSaleData.targetSeconds)}
                                    </span>
                                  </div>
                                </div>

                                {/* Flash Sale Product Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img
                                      src={item.flashSaleData.productImage}
                                      alt={item.flashSaleData.productTitle}
                                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-amber-200 shrink-0 shadow-xs"
                                    />
                                    <div className="min-w-0 space-y-1">
                                      <h4 className="text-xs sm:text-[13px] font-bold text-foreground truncate">
                                        {item.flashSaleData.productTitle}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-black text-red-600">
                                          Rp {item.flashSaleData.salePrice.toLocaleString("id-ID")}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground line-through">
                                          Rp {item.flashSaleData.originalPrice.toLocaleString("id-ID")}
                                        </span>
                                        <Badge className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0 border-none">
                                          -{item.flashSaleData.discountPercent}%
                                        </Badge>
                                      </div>

                                      {/* Stock Progress Bar */}
                                      {!item.flashSaleData.isUpcoming && (
                                        <div className="w-full max-w-[220px] space-y-0.5 pt-1">
                                          <div className="flex justify-between text-[9px] font-bold text-amber-900">
                                            <span>Terjual {item.flashSaleData.soldPercent}%</span>
                                            <span className="text-orange-700">Sisa {item.flashSaleData.stockRemaining} slot</span>
                                          </div>
                                          <Progress
                                            value={item.flashSaleData.soldPercent}
                                            className="h-1.5 bg-amber-200/80 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-600"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action CTA Button */}
                                  <div className="sm:self-center shrink-0">
                                    {item.flashSaleData.isUpcoming ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handleToggleReminder(item.id, item.flashSaleData!.productTitle)}
                                        className={cn(
                                          "w-full sm:w-auto h-8 px-3.5 rounded-xl text-xs font-bold gap-1.5 transition-all shadow-xs",
                                          item.flashSaleData.hasReminder
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-orange-600 hover:bg-orange-700 text-white"
                                        )}
                                      >
                                        <Bell className="w-3.5 h-3.5" />
                                        {item.flashSaleData.hasReminder ? "Pengingat Aktif ✓" : "Ingatkan Saya"}
                                      </Button>
                                    ) : (
                                      <Button
                                        asChild
                                        size="sm"
                                        className="w-full sm:w-auto h-8 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-xs"
                                      >
                                        <Link href={item.actionUrl || `/deals`}>
                                          <Zap className="w-3.5 h-3.5 fill-white" />
                                          Beli Sekarang
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ============================================================ */}
                            {/* KHUSUS: KARTU VOUCHER TOKO INTERAKTIF */}
                            {/* ============================================================ */}
                            {item.voucherData && (
                              <div
                                className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-[#00AA5B]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-xl bg-[#00AA5B] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Ticket className="w-6 h-6" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-bold text-foreground">
                                        {item.voucherData.discountText}
                                      </span>
                                      <span className="text-xs font-mono font-bold tracking-wider text-[#00AA5B] bg-white px-2 py-0.5 rounded border border-[#00AA5B]/40">
                                        {item.voucherData.code}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      {item.voucherData.minSpendText} • Berlaku s/d {item.voucherData.validUntil}
                                    </p>
                                  </div>
                                </div>

                                {/* Voucher Action Buttons */}
                                <div className="flex items-center gap-2 sm:self-center shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyVoucher(item.voucherData!.code)}
                                    className="h-8 px-2.5 rounded-xl text-[11px] font-bold border-border/70 hover:bg-white gap-1"
                                  >
                                    {copiedCode === item.voucherData.code ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#00AA5B]" /> Tersalin
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" /> Salin
                                      </>
                                    )}
                                  </Button>

                                  <Button
                                    size="sm"
                                    onClick={() => handleClaimVoucher(item.id, item.voucherData!.code)}
                                    disabled={item.voucherData.isClaimed}
                                    className={cn(
                                      "h-8 px-3.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs transition-all",
                                      item.voucherData.isClaimed
                                        ? "bg-muted text-muted-foreground border border-border/60 hover:bg-muted"
                                        : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white"
                                    )}
                                  >
                                    {item.voucherData.isClaimed ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" /> Sudah Diklaim
                                      </>
                                    ) : (
                                      "Klaim Voucher"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Tombol aksi umum (jika bukan voucher/flash sale) */}
                            {!item.flashSaleData && !item.voucherData && item.actionUrl && (
                              <div className="pt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 px-4 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5"
                                >
                                  <Link href={item.actionUrl}>
                                    {item.actionText || "Lihat Selengkapnya"}
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </Tabs>
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
