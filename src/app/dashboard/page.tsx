"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useUserBalance } from "@/hooks/use-user-balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  Coins,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Package,
  History,
  HelpCircle,
  ShieldCheck,
  Plus,
  Search,
  X
} from "lucide-react";
import Link from "next/link";
import { cn, formatCompactNumber } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [pgTransactions, setPgTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [activeTabTx, setActiveTabTx] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { balance: pgBalance, loading: pgBalanceLoading, refreshBalance } = useUserBalance();

  // Fetch transactions from PostgreSQL (up to 250 records)
  const fetchTransactions = () => {
    if (!user) return;
    setIsLoadingTx(true);
    fetch(`/api/transactions?userId=${user.uid}&limit=250`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPgTransactions(data.transactions || []);
        }
      })
      .catch((err) => console.warn("[DASHBOARD] Gagal ambil transaksi:", err))
      .finally(() => setIsLoadingTx(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Statistics calculation
  const stats = useMemo(() => {
    const successTxs = pgTransactions.filter((t) =>
      ["PAID", "SETTLED", "SUCCESS"].includes(t.status)
    );
    const pendingTxs = pgTransactions.filter((t) => t.status === "PENDING");
    const failedTxs = pgTransactions.filter((t) =>
      ["FAILED", "EXPIRED", "CANCELLED"].includes(t.status)
    );
    const totalSpent = successTxs.reduce(
      (sum, t) => sum + (Number(t.totalAmount) || 0),
      0
    );

    return {
      totalOrders: pgTransactions.length,
      successOrders: successTxs.length,
      pendingOrders: pendingTxs.length,
      failedOrders: failedTxs.length,
      totalSpent
    };
  }, [pgTransactions]);

  // Filtered transactions for status tab AND search query
  const filteredTransactions = useMemo(() => {
    return pgTransactions.filter((t) => {
      // 1. Filter Status
      const matchStatus =
        activeTabTx === "ALL" ||
        (activeTabTx === "SUCCESS" && ["PAID", "SETTLED", "SUCCESS"].includes(t.status)) ||
        (activeTabTx === "PENDING" && t.status === "PENDING") ||
        (activeTabTx === "FAILED" && ["FAILED", "EXPIRED", "CANCELLED"].includes(t.status));

      if (!matchStatus) return false;

      // 2. Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = (t.invoiceNumber || "").toLowerCase().includes(q);
        const matchTitle = (t.productTitle || "").toLowerCase().includes(q);
        return matchInvoice || matchTitle;
      }

      return true;
    });
  }, [pgTransactions, activeTabTx, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, startIndex, endIndex]);

  const handleTabChange = (tab: "ALL" | "SUCCESS" | "PENDING" | "FAILED") => {
    setActiveTabTx(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  if (!mounted || authLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="hidden md:block">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard Buyer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola saldo, integrasi API, dan pantau riwayat transaksi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/balance">
            <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-semibold text-xs gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              Top Up Saldo
            </Button>
          </Link>
          <Link href="/dashboard/api-key">
            <Button
              variant="outline"
              className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-slate-500" />
              API Key
            </Button>
          </Link>
          <Link href="/documentations">
            <Button
              variant="outline"
              className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              Dokumentasi
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Saldo Deposit (Emerald) */}
        <Card className="border border-emerald-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Saldo</span>
              <div className="flex items-center gap-1.5">
                <button
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
                  title={`Rp ${(typeof pgBalance === "number" ? pgBalance : (wallet?.balance || 0)).toLocaleString("id-ID")}`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(typeof pgBalance === "number" ? pgBalance : (wallet?.balance || 0))}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 text-slate-900 tracking-tight">
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">••••••••</span>
                </div>
              )}
              <Link
                href="/dashboard/balance"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00AA5B] hover:underline mt-1"
              >
                <span>Isi Saldo</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Total Transaksi (Blue) */}
        <Card className="border border-blue-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-white hover:border-blue-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Total Transaksi</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              {isLoadingTx ? (
                <Skeleton className="h-7 w-20 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`${stats.totalOrders} Pesanan`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.totalOrders)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Pesanan</span>
                </div>
              )}
              <p className="text-[11px] text-blue-700/80 font-medium mt-1 truncate">
                {stats.successOrders} transaksi berhasil
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: MCoins (Amber) */}
        <Card className="border border-amber-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-white hover:border-amber-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">MCoins</span>
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
                  title={`${(wallet?.mcoins || 0).toLocaleString("id-ID")} Poin`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(wallet?.mcoins || 0)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Poin</span>
                </div>
              )}
              <p className="text-[11px] text-amber-700/80 font-medium mt-1 truncate">
                Reward poin transaksi
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Belanja / Pengeluaran (Purple) */}
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
                  title={`Rp ${stats.totalSpent.toLocaleString("id-ID")}`}
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">Rp</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.totalSpent)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-purple-700/80 font-medium mt-1 truncate">
                Akumulasi belanja sukses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Main Grid: Transactions Feed & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Transactions Unified Card (8 cols) */}
        <div className="lg:col-span-8">
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
                      Riwayat Transaksi Terakhir
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar pesanan dari API maupun web checkout.
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
                  { id: "ALL", label: `Semua (${pgTransactions.length})` },
                  { id: "SUCCESS", label: `Sukses (${stats.successOrders})` },
                  { id: "PENDING", label: `Menunggu (${stats.pendingOrders})` },
                  { id: "FAILED", label: `Batal (${stats.failedOrders})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      activeTabTx === tab.id
                        ? "bg-slate-900 text-white shadow-2xs"
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
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
              {isLoadingTx ? (
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
              ) : filteredTransactions.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                    <ShoppingBag className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Tidak ada transaksi ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {searchQuery
                      ? `Tidak ada transaksi yang cocok dengan pencarian "${searchQuery}".`
                      : activeTabTx === "ALL"
                        ? "Belum ada riwayat pesanan pada akun Anda."
                        : `Tidak ada transaksi dengan status "${activeTabTx}".`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => {
                    const isSuccess = ["PAID", "SUCCESS", "SETTLED"].includes(tx.status);
                    const isPending = tx.status === "PENDING";
                    const isFailed = ["FAILED", "EXPIRED", "CANCELLED"].includes(tx.status);

                    return (
                      <Link
                        key={tx.id || tx.invoiceNumber}
                        href={`/transactions/${tx.invoiceNumber}`}
                        className="block hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between sm:grid sm:grid-cols-12 gap-3">
                          {/* Left: Product & Invoice */}
                          <div className="flex items-center gap-3 min-w-0 sm:col-span-7">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                              {tx.productImage ? (
                                <img
                                  src={tx.productImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                                {tx.productTitle || "Produk Digital"}
                              </p>
                              <span className="text-[10px] font-mono text-slate-500 block">
                                {tx.invoiceNumber}
                              </span>
                            </div>
                          </div>

                          {/* Center (Desktop/Tablet): Status Badge */}
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

                          {/* Right: Amount & Timestamp */}
                          <div className="text-right shrink-0 sm:col-span-3">
                            <div className="flex items-center justify-end gap-1.5 sm:block">
                              <p className="text-xs sm:text-sm font-bold text-slate-900">
                                Rp {(Number(tx.totalAmount) || 0).toLocaleString("id-ID")}
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
                              {tx.createdAt
                                ? new Date(tx.createdAt).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </Link>
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
        </div>

        {/* Right: Technical Support & Security (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Bantuan Reseller */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Bantuan Integrasi & H2H</h3>
                <p className="text-[11px] text-slate-500">Butuh bantuan teknis seputar API?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda mengalami kendala pada callback webhook, saldo, atau membutuhkan limit transaksi khusus, hubungi tim support kami.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20MarketPoint%2C%20saya%20reseller%20API%20ingin%20konsultasi%20H2H"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full h-8.5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-semibold text-xs gap-1.5 shadow-2xs">
                  Chat WhatsApp Support
                </Button>
              </a>
              <Link href="/documentations" className="block">
                <Button
                  variant="outline"
                  className="w-full h-8.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Buka Dokumentasi API
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card: Keamanan Sistem */}
          <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00AA5B]" />
              Proteksi & Keamanan Saldo
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B] mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-800">Auto-Refund:</strong> Saldo otomatis dikembalikan jika transaksi gagal dari sisi penyedia.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B] mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-800">Enkripsi API Key:</strong> Kunci rahasia Anda disimpan dengan proteksi standar industri.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/settings"
                className="font-semibold text-slate-700 hover:text-[#00AA5B] flex items-center gap-1 transition-colors"
              >
                Pengaturan Keamanan
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
