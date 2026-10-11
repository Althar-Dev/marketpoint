"use client";

import { useState, useEffect, useMemo } from "react";
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
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const STATUS_TABS = [
  { id: "all", label: "Semua", icon: ReceiptText },
  { id: "pending", label: "Menunggu", icon: Clock },
  { id: "success", label: "Berhasil", icon: CheckCircle2 },
  { id: "failed", label: "Gagal/Batal", icon: XCircle },
];

export default function TransactionsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const initialStatus = searchParams.get("status") || "all";
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  
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
      console.error("Gagal mengambil transaksi dari PostgreSQL:", err);
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
      // 1. Status Filter
      if (activeTab === "pending" && t.status !== "PENDING") return false;
      if (activeTab === "success" && !["PAID", "SETTLED", "SUCCESS"].includes(t.status)) return false;
      if (activeTab === "failed" && !["FAILED", "CANCELLED", "EXPIRED"].includes(t.status)) return false;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "SETTLED":
      case "SUCCESS":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">Berhasil</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">Menunggu</Badge>;
      case "CANCELLED":
      case "FAILED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">Dibatalkan</Badge>;
      case "EXPIRED":
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold">Kedaluwarsa</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-[9px] font-bold">{status}</Badge>;
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
                activeItem="pembelian-transactions"
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
                      Pantau status pesanan dan ambil lisensi produk digitalmu (PostgreSQL Database).
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
                      onClick={() => setActiveTab(tab.id)}
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
                <div className="mt-5 space-y-3.5">
                  {transLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 px-4 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300 border border-border/60">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Tidak Ada Transaksi</h3>
                      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        {searchQuery ? "Hasil pencarian tidak ditemukan." : "Kamu belum pernah melakukan transaksi di MarketPoint."}
                      </p>
                      {!searchQuery && (
                        <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#009650] text-white rounded-xl text-xs font-bold mt-2">
                          <Link href="/">Mulai Belanja</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredTransactions.map((t: any) => (
                      <Link key={t.id} href={`/transactions/${encodeURIComponent(t.invoiceNumber || t.id)}`}>
                        <div className="p-4 rounded-2xl border border-border/60 bg-white hover:border-[#00AA5B]/40 hover:shadow-sm transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-border/60 shrink-0 overflow-hidden relative">
                              {t.productImage ? (
                                <Image src={t.productImage} alt="" fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}</span>
                                {getStatusBadge(t.status)}
                                <span className="text-[10px] font-mono text-muted-foreground/60">{t.invoiceNumber}</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#00AA5B] transition-colors">
                                {t.productTitle || "Produk Digital"}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                <span>{t.quantity} Barang</span>
                                <span>•</span>
                                <span className="font-bold text-slate-800">Rp {(Number(t.totalAmount) || 0).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                             <div className="sm:hidden">
                               <p className="text-[10px] text-muted-foreground">Total Bayar</p>
                               <p className="text-xs font-black">Rp {(Number(t.totalAmount) || 0).toLocaleString('id-ID')}</p>
                             </div>
                             <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-bold text-[#00AA5B] hover:bg-emerald-50 gap-1">
                               Detail <ChevronRight className="w-3 h-3" />
                             </Button>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </Card>

              {/* Security Hint */}
              <div className="p-4 rounded-2xl border border-dashed border-border/80 bg-white flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00AA5B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-900">Jaminan Keamanan Transaksi</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Semua pembayaran diproteksi oleh sistem Rekening Bersama (Escrow) MarketPoint. Penjual hanya akan menerima dana setelah Anda mendapatkan produk digital yang valid.
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
