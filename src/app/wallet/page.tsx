"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserBalance } from "@/hooks/use-user-balance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManualTopUpDialog } from "@/components/manual-topup-dialog";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  ChevronRight,
  ShieldCheck,
  Info,
  QrCode,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Sparkles,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NormalizedWalletTx {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  type: "TOPUP" | "PURCHASE" | "SALES" | "WITHDRAW";
  isInflow: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED";
  rawStatus: string;
  createdAt: any;
}

export default function UserWalletPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // States
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "in" | "out">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMCoinsOpen, setIsMCoinsOpen] = useState(false);
  const [isSecurityInfoOpen, setIsSecurityInfoOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // PostgreSQL transactions state
  const [pgTransactions, setPgTransactions] = useState<any[]>([]);
  const [isPgLoading, setIsPgLoading] = useState(true);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const transactionQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: firestoreTxs, loading: firestoreLoading } = useCollection(transactionQuery);
  const { balance: pgBalance, refreshBalance } = useUserBalance();

  const fetchTransactions = useCallback(() => {
    if (!user?.uid) return;
    setIsPgLoading(true);
    refreshBalance();
    fetch(`/api/transactions?userId=${encodeURIComponent(user.uid)}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.transactions)) {
          setPgTransactions(data.transactions);
        }
      })
      .catch((err) => console.warn("[WALLET] Gagal mengambil riwayat transaksi:", err))
      .finally(() => setIsPgLoading(false));
  }, [user?.uid, refreshBalance]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Merge and normalize transactions from PostgreSQL and Firestore
  const allNormalizedTransactions = useMemo<NormalizedWalletTx[]>(() => {
    const list: NormalizedWalletTx[] = [];
    const seen = new Set<string>();

    // 1. PostgreSQL records
    for (const t of pgTransactions) {
      const inv = t.invoiceNumber || t.invoice_number || t.id;
      if (!inv || seen.has(inv)) continue;
      seen.add(inv);

      const title = t.productTitle || t.product_title || "";
      const rawCat = (t.paymentCategory || t.payment_category || "").toUpperCase();
      const rawMethod = (t.paymentMethod || t.payment_method || "").toUpperCase();
      const isTopUp =
        rawCat === "MANUAL_TRANSFER" ||
        rawMethod === "ADMIN_CREDIT" ||
        title.toLowerCase().includes("top up") ||
        title.toLowerCase().includes("deposit");

      const rawStatus = (t.status || "PENDING").toUpperCase();
      let status: "SUCCESS" | "PENDING" | "FAILED" = "PENDING";
      if (["PAID", "SETTLED", "SUCCESS"].includes(rawStatus)) {
        status = "SUCCESS";
      } else if (["FAILED", "EXPIRED", "CANCELLED", "REJECTED"].includes(rawStatus)) {
        status = "FAILED";
      }

      list.push({
        id: String(t.id || inv),
        invoiceNumber: inv,
        description: title || (isTopUp ? "Top Up Saldo" : "Pembelian Produk"),
        amount: Number(t.totalAmount || t.total_amount || 0),
        type: isTopUp ? "TOPUP" : "PURCHASE",
        isInflow: isTopUp,
        status,
        rawStatus,
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
      });
    }

    // 2. Firestore records (if any)
    if (firestoreTxs && Array.isArray(firestoreTxs)) {
      for (const ft of firestoreTxs) {
        const inv = ft.invoiceNumber || ft.id;
        if (!inv || seen.has(inv)) continue;
        seen.add(inv);

        const rawType = (ft.type || "PURCHASE").toUpperCase();
        const isInflow = rawType === "TOPUP" || rawType === "SALES" || rawType === "REFUND";
        const rawStatus = (ft.status || "SUCCESS").toUpperCase();

        let status: "SUCCESS" | "PENDING" | "FAILED" = "PENDING";
        if (["PAID", "SETTLED", "SUCCESS"].includes(rawStatus)) {
          status = "SUCCESS";
        } else if (["FAILED", "EXPIRED", "CANCELLED", "REJECTED"].includes(rawStatus)) {
          status = "FAILED";
        }

        list.push({
          id: String(ft.id || inv),
          invoiceNumber: inv,
          description: ft.description || (isInflow ? "Pemasukan Saldo" : "Pengeluaran Saldo"),
          amount: Number(ft.amount || 0),
          type: isInflow ? "TOPUP" : "PURCHASE",
          isInflow,
          status,
          rawStatus,
          createdAt: ft.timestamp || new Date().toISOString(),
        });
      }
    }

    // Sort by createdAt descending
    return list.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return (timeB || 0) - (timeA || 0);
    });
  }, [pgTransactions, firestoreTxs]);

  const transLoading = isPgLoading && (!firestoreTxs || firestoreLoading);

  const inCount = useMemo(
    () => allNormalizedTransactions.filter((t) => t.isInflow).length,
    [allNormalizedTransactions]
  );
  const outCount = useMemo(
    () => allNormalizedTransactions.filter((t) => !t.isInflow).length,
    [allNormalizedTransactions]
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allNormalizedTransactions.filter((t) => {
      if (activeFilter === "in" && !t.isInflow) return false;
      if (activeFilter === "out" && t.isInflow) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inv = (t.invoiceNumber || t.id).toLowerCase();
        const desc = (t.description || "").toLowerCase();
        return inv.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [allNormalizedTransactions, activeFilter, searchQuery]);

  const formatTxDate = (dateVal: any, includeYear = false) => {
    if (!dateVal) return "-";
    let d: Date;
    if (dateVal?.seconds) {
      d = new Date(dateVal.seconds * 1000);
    } else if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      ...(includeYear ? { year: "numeric" } : {}),
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading skeleton (tanpa header/footer di mobile)
  if (!mounted || authLoading || (user && walletLoading)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body">
        {!isMobile && <MarketHeader />}
        <main className={cn(
          "flex-1 mx-auto w-full px-4",
          isMobile ? "max-w-md pt-4 pb-10" : "max-w-4xl pt-24 pb-16 sm:px-6"
        )}>
          {isMobile ? (
            <div className="space-y-3 max-w-md mx-auto">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
              </div>
              <Skeleton className="h-56 mt-6 rounded-2xl" />
            </>
          )}
        </main>
        {!isMobile && <MarketFooter />}
      </div>
    );
  }

  if (!user) return null;

  const balanceNumber = typeof pgBalance === "number" ? pgBalance : (wallet?.balance ?? 0);
  const mcoinsNumber = wallet?.mcoins ?? 0;

  const handleCopyVa = () => {
    navigator.clipboard.writeText(`8808${user?.uid?.substring(0, 10).replace(/[^0-9]/g, "1") || "12345678"}`);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // --- MOBILE VIEW (Dedicated Clean Fintech App View - NO FOOTER) ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
        {/* Sticky Mobile App Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-border/50 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-[#212121]" />
            </button>
            <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Saldo & MCoins</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchTransactions()}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors active:scale-95"
              title="Segarkan Riwayat & Saldo"
            >
              <RefreshCw className={cn("w-4 h-4", isPgLoading && "animate-spin text-[#00AA5B]")} />
            </button>
            <button
              type="button"
              onClick={() => setIsSecurityInfoOpen(true)}
              className="p-1.5 hover:bg-emerald-50 rounded-full text-[#00AA5B] transition-colors active:scale-95"
              title="Info Proteksi Saldo"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area - NO FOOTER */}
        <main className="flex-1 px-4 py-3.5 space-y-3 max-w-md mx-auto w-full pb-10">
          {/* 1. HERO BALANCE CARD (Luxe Gradient & Glassmorphism) */}
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#00AA5B] via-[#00924E] to-[#007A41] text-white shadow-md shadow-[#00AA5B]/20 overflow-hidden">
            {/* Ambient blur overlays */}
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-3 bottom-2 opacity-15 pointer-events-none">
              <img src="/assets/icon/wallets.png" className="w-20 h-20 object-contain" alt="" />
            </div>

            <div className="relative z-10">
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-medium text-white/95">
                  <ShieldCheck className="w-3 h-3 text-emerald-200" />
                  <span>Saldo Aktif MarketPoint</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95"
                  title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                >
                  {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Saldo Utama */}
              <div className="mt-3 mb-1">
                <p className="text-[10px] text-emerald-100/80 font-medium">Total Saldo Belanja</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-emerald-100/90">Rp</span>
                  <p className="text-2xl font-black tracking-tight text-white">
                    {showBalance ? balanceNumber.toLocaleString("id-ID") : "••••••••"}
                  </p>
                </div>
              </div>

              {/* Status Note */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/15 text-[10px] text-emerald-100/90 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-200 shrink-0" />
                <span>Dana aman terlindungi sistem rekber otomatis</span>
              </div>
            </div>
          </div>

          {/* 2. QUICK ACTION DOCK (4 Buttons) */}
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-white rounded-xl border border-border/60 shadow-xs">
            {/* Top Up */}
            <button
              type="button"
              onClick={() => setIsTopUpOpen(true)}
              className="flex flex-col items-center gap-1 py-1 rounded-lg hover:bg-muted/40 transition-all active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#212121]">Top Up</span>
            </button>

            {/* Tarik Dana */}
            <button
              type="button"
              onClick={() => setIsWithdrawOpen(true)}
              className="flex flex-col items-center gap-1 py-1 rounded-lg hover:bg-muted/40 transition-all active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#212121]">Tarik Dana</span>
            </button>

            {/* Transfer / Beli */}
            <button
              type="button"
              onClick={() => router.push("/topup?cat=ewallet")}
              className="flex flex-col items-center gap-1 py-1 rounded-lg hover:bg-muted/40 transition-all active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#212121]">Transfer</span>
            </button>

            {/* Riwayat */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("riwayat-transaksi-mobile");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col items-center gap-1 py-1 rounded-lg hover:bg-muted/40 transition-all active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <History className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-[#212121]">Riwayat</span>
            </button>
          </div>

          {/* 3. MCOINS REWARDS COMPANION CARD */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-amber-500/25 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <img src="/assets/icon/mcoins.png" className="w-7 h-7 object-contain" alt="MCoins" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">MCoins Rewards</p>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[8px] font-black">CASHBACK</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <p className="text-xl font-black text-amber-400">
                      {mcoinsNumber.toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-300 font-medium">Poin Aktif</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMCoinsOpen(true)}
                className="h-8 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-transform active:scale-95"
              >
                Tukar
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              1 MCoins bernilai Rp 1 untuk potongan harga transaksi produk berlogo khusus.
            </p>
          </div>

          {/* 4. TRUST & SECURITY BANNER */}
          <div
            onClick={() => setIsSecurityInfoOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-border/60 shadow-xs flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#212121]">Proteksi Saldo Rekber</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Transaksi dilindungi escrow hingga produk diterima
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          {/* 5. RIWAYAT TRANSAKSI DENGAN FILTER */}
          <div id="riwayat-transaksi-mobile" className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-[14px] font-bold text-[#212121]">Riwayat Aktivitas</h2>
                <p className="text-[10px] text-muted-foreground">Catatan mutasi saldo akun</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    activeFilter === "all" ? "bg-white text-[#212121] shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("in")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    activeFilter === "in" ? "bg-white text-[#00AA5B] shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("out")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    activeFilter === "out" ? "bg-white text-red-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Keluar
                </button>
              </div>
            </div>

            {/* List Transaksi */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-xs overflow-hidden divide-y divide-border/40">
              {transLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => {
                  const isInflow = t.isInflow;
                  const dateStr = formatTxDate(t.createdAt);

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex items-center justify-between active:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                            isInflow
                              ? "bg-emerald-50 border-emerald-100 text-[#00AA5B]"
                              : "bg-red-50 border-red-100 text-red-600"
                          )}
                        >
                          {isInflow ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-[#212121] truncate leading-tight">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.2 rounded",
                                t.status === "SUCCESS"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : t.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              )}
                            >
                              {t.rawStatus || (t.status === "SUCCESS" ? "BERHASIL" : t.status === "PENDING" ? "MENUNGGU" : "GAGAL")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-[13px] font-black tracking-tight",
                            isInflow ? "text-[#00AA5B]" : "text-[#212121]"
                          )}
                        >
                          {isInflow ? "+" : "-"} Rp {(t.amount || 0).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                          {t.invoiceNumber}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-muted-foreground">
                    <History className="w-6 h-6 opacity-40" />
                  </div>
                  <h3 className="text-xs font-bold text-[#212121]">Belum Ada Aktivitas</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Semua mutasi pemasukan saldo, pembelian produk, dan transaksi Anda akan dicatat otomatis di sini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* DIALOGS / MODALS FOR MOBILE ACTIONS */}
        {renderActionDialogs()}
      </div>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />

      <main className="flex-1 w-full pt-24 pb-14 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saldo & Keuangan</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kelola saldo utama MarketPoint Pay, mutasi transaksi, dan reward MCoins Anda.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsSecurityInfoOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-xl border-emerald-200 text-[#00AA5B] hover:bg-emerald-50 text-xs font-semibold gap-1.5 h-8 px-3"
          >
            <ShieldCheck className="w-4 h-4" />
            Proteksi Rekber Aktif
          </Button>
        </div>

        {/* 2 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card Saldo Utama */}
          <Card className="border-none shadow-md bg-gradient-to-br from-[#00AA5B] via-[#008f4c] to-[#00723d] text-white overflow-hidden relative group rounded-2xl">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700">
              <img src="/assets/icon/wallets.png" className="w-24 h-24" alt="" />
            </div>
            <CardContent className="p-5 sm:p-6 relative z-10 flex flex-col justify-between h-full min-h-[170px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/assets/icon/wallets.png" className="w-5 h-5 object-contain" alt="" />
                    <span className="text-[10px] font-bold tracking-wider opacity-90 uppercase">Saldo Belanja Utama</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold opacity-80">Rp</span>
                  <p className="text-3xl font-black tracking-tight">
                    {showBalance ? balanceNumber.toLocaleString("id-ID") : "••••••••"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-5">
                <Button
                  type="button"
                  onClick={() => setIsTopUpOpen(true)}
                  className="h-9 px-4 sm:px-5 rounded-xl bg-white text-[#00AA5B] hover:bg-emerald-50 font-bold text-xs gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Top Up Saldo</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="h-9 px-4 sm:px-5 rounded-xl bg-white text-[#00AA5B] hover:bg-emerald-50 font-bold text-xs gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tarik Dana</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card MCoins Rewards */}
          <Card className="border-none shadow-md bg-gradient-to-br from-[#2E3137] via-[#1E2024] to-[#141517] text-white overflow-hidden relative group rounded-2xl">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-700">
              <img src="/assets/icon/mcoins.png" className="w-24 h-24" alt="" />
            </div>
            <CardContent className="p-5 sm:p-6 relative z-10 flex flex-col justify-between h-full min-h-[170px]">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <img src="/assets/icon/mcoins.png" className="w-5 h-5 object-contain" alt="" />
                  <span className="text-[10px] font-bold tracking-wider text-[#FFC400] uppercase">Pusat Reward MCoins</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-black tracking-tight text-[#FFC400]">
                    {mcoinsNumber.toLocaleString("id-ID")}
                  </p>
                  <span className="text-xs font-semibold text-muted-foreground ml-1">Poin Cashback</span>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-[11px] font-medium text-slate-300 leading-snug line-clamp-2">
                  Dapatkan MCoins setiap belanja produk khusus. Tukarkan langsung poin Anda dengan potongan harga belanja.
                </p>
                <Button
                  onClick={() => setIsMCoinsOpen(true)}
                  className="h-8 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs gap-1"
                >
                  Tukar MCoins <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unified Transactions Feed Card (seperti dashboard/transactions) */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-2xl bg-white overflow-hidden">
          {/* Card Top Bar / Header */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Riwayat Mutasi Saldo
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
                    {filteredTransactions.length} Data
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log pencatatan mutasi saldo masuk dan transaksi pengeluaran.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTransactions}
                className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 gap-1.5 rounded-lg hover:bg-slate-100"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isPgLoading && "animate-spin text-[#00AA5B]")} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Filter Status Tabs & Search Input inside Card */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: `Semua (${allNormalizedTransactions.length})` },
                { id: "in", label: `Pemasukan (${inCount})` },
                { id: "out", label: `Pengeluaran (${outCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    activeFilter === tab.id
                      ? "bg-slate-900 text-white shadow-2xs font-semibold"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Filter Input */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari invoice / aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Transactions List */}
          <CardContent className="p-0">
            {transLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="w-36 h-3.5" />
                        <Skeleton className="w-24 h-2.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Skeleton className="w-20 h-3.5 ml-auto" />
                      <Skeleton className="w-14 h-2.5 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => {
                  const isInflow = t.isInflow;
                  const dateStr = formatTxDate(t.createdAt, true);

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 shadow-xs",
                            isInflow
                              ? "bg-emerald-50 border-emerald-100 text-[#00AA5B]"
                              : "bg-red-50 border-red-100 text-red-600"
                          )}
                        >
                          {isInflow ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-slate-900 tracking-tight truncate">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.2 rounded border-none",
                                t.status === "SUCCESS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {t.rawStatus || (t.status === "SUCCESS" ? "BERHASIL" : t.status === "PENDING" ? "MENUNGGU" : "GAGAL")}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5 shrink-0">
                        <p
                          className={cn(
                            "text-[13px] font-black tracking-tight",
                            isInflow ? "text-[#00AA5B]" : "text-slate-900"
                          )}
                        >
                          {isInflow ? "+" : "-"} Rp {(t.amount || 0).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          Ref: {t.invoiceNumber}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                  <History className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-800">Tidak ada riwayat ditemukan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {searchQuery
                    ? `Tidak ada riwayat mutasi yang cocok dengan pencarian "${searchQuery}".`
                    : activeFilter === "all"
                    ? "Belum ada catatan mutasi saldo pada akun Anda."
                    : `Tidak ada mutasi saldo pada kategori "${activeFilter === "in" ? "Pemasukan" : "Pengeluaran"}".`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MarketFooter />

      {/* DIALOGS */}
      {renderActionDialogs()}
    </div>
  );

  // --- REUSABLE DIALOGS FOR BOTH MOBILE & DESKTOP ---
  function renderActionDialogs() {
    return (
      <>
        {/* 1. TOP UP MODAL (MANUAL) */}
        <ManualTopUpDialog
          open={isTopUpOpen}
          onOpenChange={setIsTopUpOpen}
          onSuccess={() => {
            refreshBalance();
            fetchTransactions();
          }}
        />

        {/* 2. TARIK DANA / WITHDRAWAL MODAL */}
        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <DialogTitle className="text-base font-bold">Pencairan Dana (Withdraw)</DialogTitle>
              <DialogDescription className="text-xs">
                Tarik saldo utama Anda ke rekening bank lokal atau dompet digital terdaftar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-border/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saldo Dapat Ditarik:</span>
                  <span className="font-extrabold text-[#00AA5B]">Rp {balanceNumber.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Minimal Penarikan:</span>
                  <span className="font-semibold text-slate-700">Rp 10.000</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Estimasi Waktu:</span>
                  <span className="font-semibold text-emerald-700">Instan s/d 1-2 Jam Kerja</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-[11px] text-amber-800 leading-relaxed">
                Pastikan nomor rekening atau nomor e-wallet tujuan sesuai dengan nama pemilik akun untuk mencegah kendala verifikasi anti-fraud.
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsWithdrawOpen(false);
                    router.push("/settings/profile");
                  }}
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Atur Rekening Bank
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 3. MCOINS REWARDS MODAL */}
        <Dialog open={isMCoinsOpen} onOpenChange={setIsMCoinsOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center mb-2">
                <img src="/assets/icon/mcoins.png" className="w-7 h-7 object-contain" alt="" />
              </div>
              <DialogTitle className="text-base font-bold">Pusat MCoins Rewards</DialogTitle>
              <DialogDescription className="text-xs">
                Kumpulkan cashback MCoins dari setiap transaksi produk dan gunakan sebagai potongan harga langsung.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Total Poin Anda</p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">{mcoinsNumber.toLocaleString("id-ID")} MCoins</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <span>Bernilai sekitar</span>
                  <p className="font-bold text-slate-800">Rp {mcoinsNumber.toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-bold text-foreground">Cara Menggunakan MCoins:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Pilih opsi <strong>"Pakai MCoins"</strong> pada halaman Checkout sebelum membayar.</li>
                  <li>1 MCoins memotong Rp 1 dari total belanjaan Anda tanpa minimal transaksi.</li>
                  <li>MCoins didapat otomatis setelah transaksi berlabel cashback selesai diverifikasi.</li>
                </ul>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setIsMCoinsOpen(false);
                  router.push("/deals");
                }}
                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs"
              >
                Jelajahi Produk dengan Cashback MCoins
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 4. PROTEKSI KEAMANAN MODAL */}
        <Dialog open={isSecurityInfoOpen} onOpenChange={setIsSecurityInfoOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-bold">Proteksi Saldo Rekber Otomatis</DialogTitle>
              <DialogDescription className="text-xs">
                Sistem keamanan transaksi dan proteksi saldo berstandar finansial digital di MarketPointID.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B]" /> Rekening Bersama (Escrow System)
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">
                  Uang belanja Anda ditahan di sistem rekber MarketPointID dan baru akan diteruskan ke penjual setelah Anda mengonfirmasi produk telah diterima dengan baik.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B]" /> Enkripsi PIN & Notifikasi Keamanan
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">
                  Setiap mutasi saldo dan penarikan dana diamankan menggunakan PIN transaksi 6 digit serta peringatan email otomatis real-time.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setIsSecurityInfoOpen(false)}
                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs mt-2"
              >
                Saya Mengerti
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}
