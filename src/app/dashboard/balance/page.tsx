"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { useUserBalance } from "@/hooks/use-user-balance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManualTopUpDialog } from "@/components/manual-topup-dialog";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  ShieldCheck,
  Coins,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Lock,
  Headphones,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCompactNumber } from "@/lib/utils";

interface NormalizedTransaction {
  id: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  type: "IN" | "OUT";
  status: "SUCCESS" | "PENDING" | "FAILED";
  rawStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

export default function DashboardBalancePage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "IN" | "OUT" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMCoinsOpen, setIsMCoinsOpen] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // PostgreSQL transactions state
  const [pgTransactions, setPgTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Firestore wallet info (for mcoins & pendingBalance)
  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { balance: pgBalance, loading: pgBalanceLoading, refreshBalance } = useUserBalance();

  // Optional Firestore transactions listener
  const firestoreTxQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: firestoreTxs, loading: firestoreLoading } = useCollection(firestoreTxQuery);

  // Fetch PostgreSQL transactions & sync balance
  const fetchTransactions = useCallback(() => {
    if (!user?.uid) return;
    setIsLoadingTx(true);
    refreshBalance();
    fetch(`/api/transactions?userId=${encodeURIComponent(user.uid)}&limit=250`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPgTransactions(data.transactions || []);
        }
      })
      .catch((err) => console.warn("[BALANCE] Gagal mengambil riwayat transaksi:", err))
      .finally(() => setIsLoadingTx(false));
  }, [user?.uid, refreshBalance]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Merge and normalize transactions from PostgreSQL and Firestore
  const allNormalizedTransactions = useMemo<NormalizedTransaction[]>(() => {
    const list: NormalizedTransaction[] = [];
    const seenInvoices = new Set<string>();

    // 1. Process PostgreSQL records
    for (const t of pgTransactions) {
      const inv = t.invoiceNumber || t.invoice_number || t.id;
      if (!inv || seenInvoices.has(inv)) continue;
      seenInvoices.add(inv);

      const rawStatus = (t.status || "PENDING").toUpperCase();
      let status: "SUCCESS" | "PENDING" | "FAILED" = "PENDING";
      if (["PAID", "SETTLED", "SUCCESS"].includes(rawStatus)) {
        status = "SUCCESS";
      } else if (["FAILED", "EXPIRED", "CANCELLED"].includes(rawStatus)) {
        status = "FAILED";
      }

      const isTopUp =
        (t.productTitle || t.product_title || "").toLowerCase().includes("top up") ||
        (t.productTitle || t.product_title || "").toLowerCase().includes("deposit");

      list.push({
        id: String(t.id || inv),
        invoiceNumber: inv,
        title: t.productTitle || t.product_title || "Pembelian Produk Digital",
        amount: Number(t.totalAmount || t.total_amount || 0),
        type: isTopUp ? "IN" : "OUT",
        status,
        rawStatus,
        paymentMethod: t.paymentMethod || t.payment_method || "SALDO",
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
      });
    }

    // 2. Process Firestore records (if any additional topups/refunds exist)
    if (firestoreTxs && Array.isArray(firestoreTxs)) {
      for (const ft of firestoreTxs) {
        const inv = ft.invoiceNumber || ft.id;
        if (!inv || seenInvoices.has(inv)) continue;
        seenInvoices.add(inv);

        const rawType = (ft.type || "PURCHASE").toUpperCase();
        const isInflow = rawType === "TOPUP" || rawType === "SALES" || rawType === "REFUND";
        const rawStatus = (ft.status || "SUCCESS").toUpperCase();

        let status: "SUCCESS" | "PENDING" | "FAILED" = "PENDING";
        if (["PAID", "SETTLED", "SUCCESS"].includes(rawStatus)) {
          status = "SUCCESS";
        } else if (["FAILED", "EXPIRED", "CANCELLED"].includes(rawStatus)) {
          status = "FAILED";
        }

        let dateStr = new Date().toISOString();
        if (ft.timestamp?.seconds) {
          dateStr = new Date(ft.timestamp.seconds * 1000).toISOString();
        }

        list.push({
          id: String(ft.id || inv),
          invoiceNumber: inv,
          title: ft.description || (isInflow ? "Pemasukan / Top Up Saldo" : "Pengeluaran Saldo"),
          amount: Number(ft.amount || 0),
          type: isInflow ? "IN" : "OUT",
          status,
          rawStatus,
          paymentMethod: ft.paymentMethod || "SALDO",
          createdAt: dateStr,
        });
      }
    }

    // Sort by date descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [pgTransactions, firestoreTxs]);

  // Overall financial statistics
  const stats = useMemo(() => {
    const successList = allNormalizedTransactions.filter((t) => t.status === "SUCCESS");
    const pendingList = allNormalizedTransactions.filter((t) => t.status === "PENDING");

    const totalSpent = successList
      .filter((t) => t.type === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTopUp = successList
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      balance: typeof pgBalance === "number" ? pgBalance : (wallet?.balance || 0),
      mcoins: wallet?.mcoins || 0,
      totalSpent,
      totalTopUp,
      successCount: successList.length,
      pendingCount: pendingList.length,
    };
  }, [allNormalizedTransactions, wallet, pgBalance]);

  // Filtered list based on active tab and search query
  const filteredTransactions = useMemo(() => {
    return allNormalizedTransactions.filter((t) => {
      // 1. Tab filter
      if (activeFilter === "IN" && t.type !== "IN") return false;
      if (activeFilter === "OUT" && t.type !== "OUT") return false;
      if (activeFilter === "PENDING" && t.status !== "PENDING") return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = t.invoiceNumber.toLowerCase().includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        return matchInvoice || matchTitle;
      }

      return true;
    });
  }, [allNormalizedTransactions, activeFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, startIndex, endIndex]);

  // Virtual Account Generator for Top Up
  const virtualAccountNum = useMemo(() => {
    const digits = (user?.uid || "9876543210").replace(/[^0-9]/g, "");
    const safeDigits = (digits + "1234567890").substring(0, 8);
    return `8808${safeDigits}`;
  }, [user?.uid]);

  const handleCopyVa = () => {
    navigator.clipboard.writeText(virtualAccountNum);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  const handleCopyInvoice = (inv: string) => {
    navigator.clipboard.writeText(inv);
    setCopiedInvoice(inv);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  if (!mounted) return null;

  const isDataLoading = (isLoadingTx || firestoreLoading) && allNormalizedTransactions.length === 0;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Saldo & Keuangan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau saldo aktif, riwayat mutasi dana, dan tukarkan poin reward transaksi Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            className="h-9 px-3 text-xs font-semibold text-slate-700 border-slate-200 rounded-xl hover:bg-slate-100 gap-1.5"
            title="Muat ulang data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingTx && "animate-spin text-[#00AA5B]")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWithdrawOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-200 rounded-xl hover:bg-slate-100 gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Tarik Saldo</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsTopUpOpen(true)}
            className="h-9 px-4 text-xs font-bold bg-[#00AA5B] hover:bg-[#00924E] text-white rounded-xl shadow-xs gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Top Up Saldo</span>
          </Button>
        </div>
      </div>

      {/* 2. Four Key Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Saldo Utama (Emerald Accent Card) */}
        <Card className="border border-emerald-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Saldo Aktif</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-emerald-600/70 hover:text-emerald-800 transition-colors p-0.5"
                  title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                >
                  {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#00AA5B] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              {(walletLoading && pgBalanceLoading) ? (
                <Skeleton className="h-7 w-28 mt-0.5" />
              ) : showBalance ? (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`Rp ${(stats.balance || 0).toLocaleString("id-ID")}`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.balance || 0)}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 text-slate-900 tracking-tight">
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">••••••••</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] text-emerald-700/80 font-medium mt-1">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">Terlindungi Rekber Otomatis</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: MCoins Rewards (Amber Accent Card) */}
        <Card className="border border-amber-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-white hover:border-amber-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">MCoins Loyalty</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>

            <div>
              {walletLoading ? (
                <Skeleton className="h-7 w-20 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`${(stats.mcoins || 0).toLocaleString("id-ID")} Poin`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.mcoins || 0)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Poin</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsMCoinsOpen(true)}
                className="text-[11px] text-amber-700/80 font-medium hover:underline mt-1 inline-flex items-center gap-0.5"
              >
                <span>Tukar Poin Diskon</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Total Pengeluaran (Purple Accent Card) */}
        <Card className="border border-purple-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-white hover:border-purple-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">Total Pengeluaran</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              {isLoadingTx ? (
                <Skeleton className="h-7 w-24 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight truncate"
                  title={`Rp ${(stats.totalSpent || 0).toLocaleString("id-ID")}`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.totalSpent || 0)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-purple-700/80 font-medium mt-1 truncate">
                {stats.successCount} transaksi sukses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Menunggu Pembayaran (Blue Accent Card) */}
        <Card className="border border-blue-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-white hover:border-blue-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Perlu Diselesaikan</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div>
              {isLoadingTx ? (
                <Skeleton className="h-7 w-16 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`${stats.pendingCount} Transaksi`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.pendingCount)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Transaksi</span>
                </div>
              )}
              <p className="text-[11px] text-blue-700/80 font-medium mt-1 truncate">
                Menunggu pembayaran aktif
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Financial Ledger / Riwayat Mutasi Card */}
      <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
        {/* 1. Card Top Bar / Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Riwayat Mutasi & Transaksi
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar mutasi saldo masuk (top-up) dan pengeluaran belanja akun Anda.
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
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingTx && "animate-spin text-[#00AA5B]")} />
              <span>Refresh</span>
            </Button>
            <Link
              href="/dashboard/transactions"
              className="text-xs font-semibold text-[#00AA5B] hover:underline flex items-center gap-0.5 ml-1"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Filter Status Tabs & Search Input inside Card */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: `Semua (${allNormalizedTransactions.length})` },
              { id: "IN", label: `Pemasukan (${allNormalizedTransactions.filter((t) => t.type === "IN").length})` },
              { id: "OUT", label: `Pengeluaran (${allNormalizedTransactions.filter((t) => t.type === "OUT").length})` },
              { id: "PENDING", label: `Menunggu (${stats.pendingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id as any);
                  setCurrentPage(1);
                }}
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
              placeholder="Cari invoice / produk..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 pl-8 pr-7 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Table Column Header Bar */}
        <div className="hidden sm:grid grid-cols-12 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-7">Produk & No. Invoice</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Nominal & Waktu</div>
        </div>

        {/* 4. Transactions List */}
        <CardContent className="p-0">
          {isDataLoading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="w-36 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Skeleton className="w-20 h-4 ml-auto" />
                    <Skeleton className="w-14 h-3 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                <History className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-800">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? `Tidak ada transaksi yang cocok dengan pencarian "${searchQuery}".`
                  : activeFilter === "ALL"
                    ? "Belum ada riwayat pesanan pada akun Anda."
                    : `Tidak ada mutasi dengan filter kategori ini.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => {
                const isSuccess = tx.status === "SUCCESS";
                const isPending = tx.status === "PENDING";
                const isFailed = tx.status === "FAILED";
                const isInflow = tx.type === "IN";

                let formattedDate = "-";
                try {
                  formattedDate = new Date(tx.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch {
                  formattedDate = tx.createdAt;
                }

                return (
                  <div
                    key={tx.id || tx.invoiceNumber}
                    className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between sm:grid sm:grid-cols-12 gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Left: Product & Invoice (col-span-7) */}
                    <div className="flex items-center gap-3 min-w-0 sm:col-span-7">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden",
                          isInflow
                            ? "bg-emerald-50 border-emerald-200 text-[#00AA5B]"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        )}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                          {tx.title || "Produk Digital"}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {tx.invoiceNumber}
                        </span>
                      </div>
                    </div>

                    {/* Center (Desktop/Tablet): Status Badge (col-span-2) */}
                    <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
                      <Badge
                        className={cn(
                          "text-[9px] font-semibold px-2 py-0.5 border-none",
                          isSuccess && "bg-emerald-50 text-emerald-700",
                          isPending && "bg-amber-50 text-amber-700",
                          isFailed && "bg-rose-50 text-rose-700"
                        )}
                      >
                        {isSuccess ? "Sukses" : isPending ? "Pending" : "Batal"}
                      </Badge>
                    </div>

                    {/* Right: Amount & Timestamp (col-span-3) */}
                    <div className="text-right shrink-0 sm:col-span-3">
                      <div className="flex items-center justify-end gap-1.5 sm:block">
                        <p
                          className={cn(
                            "text-xs sm:text-sm font-bold",
                            isInflow ? "text-[#00AA5B]" : "text-slate-900"
                          )}
                        >
                          {isInflow ? "+ " : "- "}Rp {(Number(tx.amount) || 0).toLocaleString("id-ID")}
                        </p>
                        <Badge
                          className={cn(
                            "sm:hidden text-[9px] font-semibold px-1.5 py-0 border-none",
                            isSuccess && "bg-emerald-50 text-emerald-700",
                            isPending && "bg-amber-50 text-amber-700",
                            isFailed && "bg-rose-50 text-rose-700"
                          )}
                        >
                          {isSuccess ? "Sukses" : isPending ? "Pending" : "Batal"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* 5. Card Footer Pagination & Record Counter */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          {/* Record Summary */}
          <div className="flex items-center gap-2">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-800">
                {filteredTransactions.length === 0 ? 0 : startIndex + 1}
              </strong>
              {" - "}
              <strong className="text-slate-800">{endIndex}</strong> dari{" "}
              <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
            </span>
            {searchQuery && (
              <Badge variant="outline" className="text-[10px] text-slate-600 font-normal px-1.5 py-0">
                Filter: &ldquo;{searchQuery}&rdquo;
              </Badge>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Page Size Dropdown Select */}
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="text-[11px] font-medium text-slate-500">Tampilkan:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[120px] text-xs font-semibold bg-white border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 focus:ring-1 focus:ring-[#00AA5B] focus:border-[#00AA5B] rounded-lg">
                  <SelectValue placeholder="Pilih limit" />
                </SelectTrigger>
                <SelectContent align="end" className="bg-white border-slate-200 shadow-lg rounded-xl">
                  <SelectItem value="50" className="text-xs font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-900">
                    50 Records
                  </SelectItem>
                  <SelectItem value="100" className="text-xs font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-900">
                    100 Records
                  </SelectItem>
                  <SelectItem value="250" className="text-xs font-medium cursor-pointer focus:bg-emerald-50 focus:text-emerald-900">
                    250 Records
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prev / Page Indicator / Next */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0 rounded-lg border-slate-200"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              <span className="px-2 text-[11px] font-semibold text-slate-700 min-w-16 text-center">
                {validPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0 rounded-lg border-slate-200"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Financial Security & Reliability Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Garansi Rekber Otomatis</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dana Anda ditahan dengan aman dalam sistem escrow dan baru diteruskan setelah pesanan berhasil terkirim.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Enkripsi Tingkat Perbankan</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Seluruh mutasi dan API saldo diproteksi dengan sertifikasi keamanan SSL 256-bit dan autentikasi multi-faktor.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Headphones className="w-4.5 h-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Bantuan Finansial 24/7</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kendala pada top-up otomatis atau konfirmasi penarikan? Tim finance kami selalu siap sedia membantu Anda.
            </p>
          </div>
        </div>
      </div>

      {/* 5. MODALS / DIALOGS */}

      {/* A. Top Up Modal */}
      <ManualTopUpDialog
        open={isTopUpOpen}
        onOpenChange={setIsTopUpOpen}
        onSuccess={() => {
          refreshBalance();
          fetchTransactions();
        }}
      />

      {/* B. Withdraw Modal */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Penarikan Dana (Withdraw)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cairkan saldo aktif dompet Anda ke rekening bank lokal atau nomor e-wallet terdaftar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Saldo Tersedia:</span>
                <span className="font-extrabold text-[#00AA5B]">
                  Rp {stats.balance.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Minimal Penarikan:</span>
                <span className="font-semibold text-slate-800">Rp 10.000</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Biaya Administrasi:</span>
                <span className="font-semibold text-emerald-700">Rp 0 (Gratis)</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Estimasi Waktu:</span>
                <span className="font-semibold text-slate-800">1 - 2 Jam Kerja</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Pastikan nama pemilik rekening bank atau e-wallet tujuan sesuai dengan identitas akun MarketPoint Anda untuk keamanan anti-fraud.
              </span>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWithdrawOpen(false)}
                className="flex-1 h-10 rounded-xl text-xs font-semibold border-slate-200"
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsWithdrawOpen(false);
                  router.push("/profile");
                }}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Atur Rekening Penarikan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* C. MCoins Modal */}
      <Dialog open={isMCoinsOpen} onOpenChange={setIsMCoinsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
              <Coins className="w-5 h-5 stroke-[2.5]" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Pusat Loyalty MCoins
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kumpulkan poin setiap transaksi dan gunakan sebagai potongan harga langsung.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 text-center space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Total Poin Anda
              </span>
              <p className="text-3xl font-black text-amber-600 tracking-tight">
                {stats.mcoins.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-500">
                Nilai tukar: 1 MCoins = Rp 1 Potongan Belanja
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Poin dapat langsung dipotongkan di halaman checkout belanja produk digital.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dapatkan cashback poin tambahan untuk setiap transaksi produk kategori promo.</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                setIsMCoinsOpen(false);
                router.push("/dashboard/products");
              }}
              className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Belanja & Gunakan Poin Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
