"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronRight,
  ShoppingBag,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Package,
  CreditCard,
  Copy,
  Check,
  Sparkles,
  Tag,
  ArrowRight,
  X
} from "lucide-react";
import { cn, cleanProductTitle, cleanPaymentMethodName, getPaymentLogo } from "@/lib/utils";

const STATUS_TABS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Menunggu Pembayaran" },
  { id: "success", label: "Berhasil" },
  { id: "failed", label: "Gagal / Batal" },
];

function TransactionsContent() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  const initialStatus = searchParams.get("status") || "all";
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Sync activeTab whenever URL query ?status= changes (e.g. from sidebar navigation)
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && ["pending", "success", "failed", "all"].includes(statusParam)) {
      setActiveTab(statusParam);
    } else if (!statusParam) {
      setActiveTab("all");
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "all") {
      router.push("/transactions", { scroll: false });
    } else {
      router.push(`/transactions?status=${tabId}`, { scroll: false });
    }
  };

  // PostgreSQL State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transLoading, setTransLoading] = useState(true);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: wallet } = useDoc(walletRef);
  const { data: shop } = useDoc(shopRef);
  const { data: userData } = useDoc(userRef);

  // Fetch from PostgreSQL API
  const fetchTransactions = async (uid: string) => {
    setTransLoading(true);
    try {
      const res = await fetch(`/api/transactions?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Gagal mengambil transaksi:", err);
    } finally {
      setTransLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login?redirect=/transactions");
    } else if (user) {
      fetchTransactions(user.uid);
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch {
      toast({ variant: "destructive", title: "Gagal Keluar" });
    }
  };

  // Metrics summary counts
  const stats = useMemo(() => {
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let totalSpend = 0;

    for (const t of transactions) {
      const statusUpper = String(t.status || "").toUpperCase();
      const amount = Number(t.totalAmount) || 0;

      if (["PAID", "SETTLED", "SUCCESS", "COMPLETED", "BERHASIL"].includes(statusUpper)) {
        successCount++;
        totalSpend += amount;
      } else if (["PENDING", "UNPAID", "WAITING", "MENUNGGU"].includes(statusUpper)) {
        pendingCount++;
      } else if (["FAILED", "CANCELLED", "EXPIRED", "BATAL", "GAGAL"].includes(statusUpper)) {
        failedCount++;
      }
    }

    return {
      total: transactions.length,
      successCount,
      pendingCount,
      failedCount,
      totalSpend,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      // 1. Status Filter
      const statusUpper = String(t.status || "").toUpperCase();
      if (activeTab === "pending" && !["PENDING", "UNPAID", "WAITING", "MENUNGGU"].includes(statusUpper)) return false;
      if (activeTab === "success" && !["PAID", "SETTLED", "SUCCESS", "COMPLETED", "BERHASIL"].includes(statusUpper)) return false;
      if (activeTab === "failed" && !["FAILED", "CANCELLED", "EXPIRED", "BATAL", "GAGAL"].includes(statusUpper)) return false;

      // 2. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = t.invoiceNumber?.toLowerCase().includes(q);
        const matchTitle = t.productTitle?.toLowerCase().includes(q);
        const matchVoucher = t.voucherCode?.toLowerCase().includes(q);
        if (!matchInvoice && !matchTitle && !matchVoucher) return false;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  const handleCopyInvoice = (e: React.MouseEvent, invoice: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(invoice);
    setCopiedInvoice(invoice);
    toast({
      title: "Invoice Disalin",
      description: `Nomor invoice ${invoice} berhasil disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (["PAID", "SETTLED", "SUCCESS", "COMPLETED", "BERHASIL"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#00AA5B] border border-emerald-200/70 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3 text-[#00AA5B] shrink-0" />
          <span>Berhasil</span>
        </span>
      );
    }
    if (["PENDING", "UNPAID", "WAITING", "MENUNGGU"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Menunggu Bayar</span>
        </span>
      );
    }
    if (["CANCELLED", "FAILED", "BATAL", "GAGAL"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/70 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Dibatalkan</span>
        </span>
      );
    }
    if (["EXPIRED", "KEDALUWARSA"].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Kedaluwarsa</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
        {status}
      </span>
    );
  };

  if (!mounted || authLoading) {
    if (!isMobile) return <DesktopProfileSkeleton />;
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B]" />
      </div>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col">
      {!isMobile && <MarketHeader />}

      {/* Mobile Top Header + Fixed Tabs */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
          {isMobileSearchOpen ? (
            <header className="px-3 h-12 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari invoice, judul, voucher..."
                  className="h-9 pl-9 pr-8 rounded-lg border-slate-200 bg-slate-50/90 text-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B] focus-visible:border-[#00AA5B]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
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
                <h1 className="text-sm font-bold text-slate-900 truncate">Riwayat Transaksi</h1>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-1.5 -mr-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
                title="Cari transaksi"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </header>
          )}

          {/* Fixed Tabs under Header on Mobile */}
          <div className="flex items-center gap-4 px-3.5 pt-1 overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              let tabCount: number | null = null;
              if (tab.id === "all") tabCount = stats.total;
              if (tab.id === "pending") tabCount = stats.pendingCount;
              if (tab.id === "success") tabCount = stats.successCount;
              if (tab.id === "failed") tabCount = stats.failedCount;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 pb-2.5 pt-1 px-0.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border-b-2",
                    isActive
                      ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  <span>{tab.label}</span>
                  {tabCount !== null && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors",
                        isActive
                          ? "bg-[#00AA5B]/10 text-[#00AA5B]"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-24 md:pb-12">
          <div className="flex gap-6 items-start">
            {!isMobile && (
              <DesktopAccountSidebar
                user={user}
                wallet={wallet}
                hasShop={hasShop}
                displayName={user.displayName || ""}
                activeItem={activeTab === "pending" ? "pembelian-pending" : "pembelian-transactions"}
                handleLogout={handleLogout}
              />
            )}

            <div className="flex-1 min-w-0 space-y-4">
              {/* Main Transactions Container */}
              <div className="bg-transparent md:bg-white rounded-none md:rounded-2xl border-0 md:border md:border-slate-200/80 shadow-none md:shadow-xs p-0 md:p-5">
                {/* Header & Search Bar (Desktop only) */}
                <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="hidden sm:block space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        Riwayat Transaksi
                      </h2>
                      <span className="text-[10px] font-bold text-[#00AA5B] bg-[#00AA5B]/10 px-2 py-0.5 rounded-full">
                        {filteredTransactions.length} Pesanan
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Pantau status pesanan, pembayaran, dan ambil lisensi produk digital Anda.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64 md:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari invoice, judul, voucher..."
                      className="h-9 pl-9 pr-8 rounded-lg border-slate-200 bg-slate-50/70 text-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B] focus-visible:border-[#00AA5B]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs Filter (Desktop only) */}
                <div className="hidden md:flex items-center gap-6 pt-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
                  {STATUS_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    let tabCount: number | null = null;
                    if (tab.id === "all") tabCount = stats.total;
                    if (tab.id === "pending") tabCount = stats.pendingCount;
                    if (tab.id === "success") tabCount = stats.successCount;
                    if (tab.id === "failed") tabCount = stats.failedCount;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 pb-2.5 pt-1 px-0.5 text-xs font-semibold transition-all shrink-0 cursor-pointer border-b-2",
                          isActive
                            ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <span>{tab.label}</span>
                        {tabCount !== null && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors",
                              isActive
                                ? "bg-[#00AA5B]/10 text-[#00AA5B]"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {tabCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Transactions List */}
                <div className="md:mt-4 space-y-2.5 sm:space-y-3">
                  {transLoading ? (
                    <div className="space-y-2.5 sm:space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-3.5 w-24 rounded-md" />
                              <Skeleton className="h-3.5 w-16 rounded-md" />
                            </div>
                            <Skeleton className="h-4.5 w-20 rounded-md" />
                          </div>
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shrink-0" />
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="h-3.5 w-2/3 rounded-md" />
                              <Skeleton className="h-3 w-1/3 rounded-md" />
                              <Skeleton className="h-3 w-1/4 rounded-md" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-12 rounded-lg" />
                              <Skeleton className="h-4 w-20 rounded-md" />
                            </div>
                            <Skeleton className="h-7 w-20 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-2xs flex items-center justify-center mx-auto text-slate-400 border border-slate-200/80">
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {searchQuery ? "Transaksi Tidak Ditemukan" : "Belum Ada Transaksi"}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {searchQuery
                            ? `Tidak ditemukan transaksi dengan kata kunci "${searchQuery}". Coba periksa nomor invoice atau judul produk.`
                            : "Kamu belum pernah melakukan pembelian produk digital di MarketPointID."}
                        </p>
                      </div>
                      {searchQuery ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                          className="rounded-lg text-xs font-semibold h-7.5 px-3"
                        >
                          Reset Pencarian
                        </Button>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="bg-[#00AA5B] hover:bg-[#009650] text-white rounded-lg text-xs font-semibold shadow-2xs h-8 px-3.5"
                        >
                          <Link href="/">Mulai Belanja Sekarang</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredTransactions.map((t: any) => {
                      const formattedDate = t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Baru saja";

                      const totalAmountNum = Number(t.totalAmount) || 0;
                      const unitPriceNum = Number(t.unitPrice) || totalAmountNum;
                      const quantityNum = Number(t.quantity) || 1;
                      const discountNum = Number(t.discount) || 0;
                      const invNumber = t.invoiceNumber || t.id;
                      const isPending = ["PENDING", "UNPAID", "WAITING", "MENUNGGU"].includes(String(t.status || "").toUpperCase());
                      const hasLicense = Boolean(t.licenseKey || (Array.isArray(t.licenseKeys) && t.licenseKeys.length > 0));
                      const isTopUp = Boolean((t.productTitle && t.productTitle.toLowerCase().includes("top up")) || (t.invoiceNumber && t.invoiceNumber.startsWith("TOPUP-")));

                      return (
                        <div
                          key={t.id}
                          className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#00AA5B]/40 hover:shadow-xs transition-all duration-150 flex flex-col gap-2.5"
                        >
                          {/* Top Meta Bar */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="p-1 rounded bg-emerald-50 text-[#00AA5B] shrink-0">
                                {isTopUp ? <Wallet className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 shrink-0">
                                {isTopUp ? "Isi Saldo" : "Pembayaran"}
                              </span>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyInvoice(e, invNumber)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded transition-colors cursor-pointer truncate max-w-[130px] sm:max-w-none"
                                title="Klik untuk salin invoice"
                              >
                                <span className="truncate">{invNumber}</span>
                                {copiedInvoice === invNumber ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                )}
                              </button>
                            </div>

                            <div className="shrink-0">
                              {getStatusBadge(t.status)}
                            </div>
                          </div>

                          {/* Main Row: Thumbnail & Info */}
                          <Link
                            href={`/transactions/${encodeURIComponent(invNumber)}`}
                            className="flex items-start gap-2.5 sm:gap-3 group/item"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0 overflow-hidden relative shadow-2xs group-hover/item:border-[#00AA5B]/40 transition-colors">
                              {t.productImage ? (
                                <Image
                                  src={t.productImage}
                                  alt={t.productTitle || "Produk"}
                                  fill
                                  className="object-cover group-hover/item:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-50/60 to-slate-100 flex items-center justify-center text-[#00AA5B]/70">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1 group-hover/item:text-[#00AA5B] transition-colors leading-tight">
                                {cleanProductTitle(t.productTitle)}
                              </h4>

                              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 font-medium">
                                {t.variant && (
                                  <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                                    {t.variant}
                                  </span>
                                )}
                                <span>
                                  {quantityNum} × Rp {unitPriceNum.toLocaleString("id-ID")}
                                </span>
                                {discountNum > 0 && (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5 text-[10px]">
                                    <Tag className="w-2.5 h-2.5" /> -Rp {discountNum.toLocaleString("id-ID")}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {formattedDate}
                                </span>

                                {hasLicense && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Lisensi Siap
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>

                          {/* Bottom Row: Total Belanja & Actions */}
                          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              <div
                                className="h-7 px-2 rounded-md bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0"
                                title={cleanPaymentMethodName(t.paymentMethodName || t.paymentMethod)}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getPaymentLogo(t.paymentMethodName || t.paymentMethod)}
                                  alt={cleanPaymentMethodName(t.paymentMethodName || t.paymentMethod)}
                                  className="h-2.5 sm:h-3 w-auto max-w-[50px] object-contain"
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                                  Rp {totalAmountNum.toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>

                            <Link
                              href={`/transactions/${encodeURIComponent(invNumber)}`}
                              className="inline-flex shrink-0"
                            >
                              <Button
                                size="sm"
                                className={cn(
                                  "h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold gap-1 transition-all shadow-2xs",
                                  isPending
                                    ? "bg-[#00AA5B] hover:bg-[#009650] text-white"
                                    : "bg-slate-900 hover:bg-slate-800 text-white"
                                )}
                              >
                                <span>{isPending ? "Bayar Sekarang" : "Lihat Detail"}</span>
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Security Banner Footer */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-[#00AA5B]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.2 min-w-0">
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Jaminan Keamanan Rekening Bersama (Escrow)</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Setiap transaksi diproteksi otomatis oleh sistem Escrow MarketPointID.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MarketBottomNav />
      {!isMobile && <MarketFooter />}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00AA5B] animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Memuat Transaksi...
          </p>
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
