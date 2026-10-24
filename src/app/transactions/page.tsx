"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ReceiptText,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Package,
  CreditCard,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const STATUS_TABS = [
  { id: "all", label: "Semua", icon: ReceiptText },
  { id: "pending", label: "Menunggu Pembayaran", icon: Clock },
  { id: "success", label: "Berhasil", icon: CheckCircle2 },
  { id: "failed", label: "Gagal/Batal", icon: XCircle },
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      // 1. Status Filter (case-insensitive & supports aliases)
      const statusUpper = String(t.status || "").toUpperCase();
      if (activeTab === "pending" && !["PENDING", "UNPAID", "WAITING", "MENUNGGU"].includes(statusUpper)) return false;
      if (activeTab === "success" && !["PAID", "SETTLED", "SUCCESS", "COMPLETED", "BERHASIL"].includes(statusUpper)) return false;
      if (activeTab === "failed" && !["FAILED", "CANCELLED", "EXPIRED", "BATAL", "GAGAL"].includes(statusUpper)) return false;

      // 2. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInvoice = t.invoiceNumber?.toLowerCase().includes(q);
        const matchTitle = t.productTitle?.toLowerCase().includes(q);
        if (!matchInvoice && !matchTitle) return false;
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
      description: `Nomor invoice ${invoice} berhasil disalin.`,
    });
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "SETTLED":
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#00AA5B] border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-[#00AA5B]" /> Berhasil
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Pembayaran
          </span>
        );
      case "CANCELLED":
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-600" /> Dibatalkan
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-slate-500" /> Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (!mounted || authLoading) {
    if (!isMobile) return <DesktopProfileSkeleton />;
    return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-6 h-6 animate-spin text-[#00AA5B]" /></div>;
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col">
      {!isMobile && <MarketHeader />}

      {isMobile && (
        <header className="sticky top-0 z-40 bg-white border-b border-border/60 px-4 h-14 flex items-center gap-3 shadow-xs">
          <Link href="/profile" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold">Daftar Transaksi</h1>
        </header>
      )}

      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-20 md:pb-12">
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
              <Card className="border border-border/50 shadow-xs bg-white rounded-2xl overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                  <div className="space-y-0.5">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <ReceiptText className="w-5 h-5 text-[#00AA5B]" />
                      Riwayat Pembelian
                    </h2>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Pantau status pesanan dan ambil lisensi produk digitalmu.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari invoice atau produk..."
                      className="h-9 pl-9 rounded-xl border-border/70 bg-[#F8FAFC] text-xs focus-visible:ring-[#00AA5B]/20"
                    />
                  </div>
                </div>

                {/* Tabs Filter */}
                <div className="flex items-center gap-1.5 pt-4 pb-2 border-b border-border/50 overflow-x-auto no-scrollbar">
                  {STATUS_TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      size="sm"
                      variant={activeTab === tab.id ? "default" : "outline"}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "h-8 px-4 rounded-xl text-xs font-bold transition-all shrink-0",
                        activeTab === tab.id
                          ? "bg-[#00AA5B] text-white hover:bg-[#009650] shadow-sm"
                          : "border-border/80 text-muted-foreground hover:text-foreground bg-white"
                      )}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                {/* Transactions List */}
                <div className="mt-4 space-y-3">
                  {transLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2.5">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-40 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0" />
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="h-3.5 w-1/2 rounded-md" />
                              <Skeleton className="h-3 w-1/4 rounded-md" />
                            </div>
                            <Skeleton className="hidden sm:block h-7.5 w-24 rounded-lg shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300 border border-border/60">
                        <ShoppingBag className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
                      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        {searchQuery ? "Hasil pencarian tidak ditemukan." : "Kamu belum pernah melakukan transaksi di MarketPointID."}
                      </p>
                      {!searchQuery && (
                        <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white rounded-lg text-xs font-bold mt-1 shadow-2xs h-8 px-3">
                          <Link href="/">Mulai Belanja</Link>
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
                          })
                        : "Baru saja";

                      const totalAmountNum = Number(t.totalAmount) || 0;
                      const unitPriceNum = Number(t.unitPrice) || totalAmountNum;
                      const quantityNum = Number(t.quantity) || 1;
                      const invNumber = t.invoiceNumber || t.id;

                      return (
                        <div
                          key={t.id}
                          className="p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#00AA5B]/40 hover:shadow-xs transition-all duration-150 group flex flex-col gap-2.5"
                        >
                          {/* 1. Header Bar: Belanja Info, Tanggal, Invoice, Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              <div className="inline-flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                                <span className="p-0.5 rounded-md bg-emerald-50 text-[#00AA5B]">
                                  <ShoppingBag className="w-3 h-3" />
                                </span>
                                <span>Belanja</span>
                              </div>

                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-medium text-[10px] sm:text-[11px]">
                                {formattedDate}
                              </span>

                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyInvoice(e, invNumber)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded transition-colors cursor-pointer group/copy"
                                title="Klik untuk salin invoice"
                              >
                                <span>{invNumber}</span>
                                {copiedInvoice === invNumber ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-slate-400 group-hover/copy:text-slate-600" />
                                )}
                              </button>
                            </div>

                            <div>
                              {getStatusBadge(t.status)}
                            </div>
                          </div>

                          {/* 2. Main Content: Thumbnail, Product Info, Total Belanja, Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Product Thumbnail & Info */}
                            <Link
                              href={`/transactions/${encodeURIComponent(invNumber)}`}
                              className="flex items-start gap-3 min-w-0 flex-1 group/item"
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 overflow-hidden relative shadow-2xs group-hover/item:border-[#00AA5B]/40 transition-colors">
                                {t.productImage ? (
                                  <Image
                                    src={t.productImage}
                                    alt={t.productTitle || "Produk"}
                                    fill
                                    className="object-cover group-hover/item:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-50/60 to-slate-100 flex items-center justify-center text-[#00AA5B]/70">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover/item:text-[#00AA5B] transition-colors leading-tight">
                                  {t.productTitle || "Produk Digital"}
                                </h4>

                                {t.variant && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    Variasi: <span className="font-semibold text-slate-700">{t.variant}</span>
                                  </p>
                                )}

                                <p className="text-[11px] text-slate-500 font-medium">
                                  {quantityNum} barang × Rp {unitPriceNum.toLocaleString("id-ID")}
                                </p>

                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <span className="text-[9px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CreditCard className="w-2.5 h-2.5 text-slate-400" /> {t.paymentMethodName || t.paymentMethod || "QRIS"}
                                  </span>
                                  {Boolean(t.licenseKey || (t.licenseKeys && t.licenseKeys.length > 0)) && (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Sparkles className="w-2 h-2 text-emerald-600" /> Lisensi Siap
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>

                            {/* Right: Total Belanja & Action Button */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 sm:border-l sm:pl-4 sm:min-w-[145px]">
                              <div className="text-left sm:text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Total Belanja
                                </p>
                                <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                                  Rp {totalAmountNum.toLocaleString("id-ID")}
                                </p>
                              </div>

                              <Link
                                href={`/transactions/${encodeURIComponent(invNumber)}`}
                                className="inline-flex"
                              >
                                <Button
                                  size="sm"
                                  className="h-7.5 px-3 rounded-lg text-[11px] font-bold bg-[#00AA5B] hover:bg-[#009650] text-white shadow-2xs gap-1 transition-all"
                                >
                                  Lihat Detail <ChevronRight className="w-3 h-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Security Hint */}
              <div className="p-4 rounded-2xl border border-dashed border-border/80 bg-white flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00AA5B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-900">Jaminan Keamanan Transaksi</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Semua pembayaran diproteksi oleh sistem Rekening Bersama (Escrow) MarketPointID. Penjual hanya akan menerima dana setelah Anda mendapatkan produk digital yang valid.
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

