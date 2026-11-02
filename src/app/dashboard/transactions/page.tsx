"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  History,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Package,
  RefreshCw,
  X,
  ExternalLink
} from "lucide-react";
import { cn, formatCompactNumber } from "@/lib/utils";
import Link from "next/link";

export default function DashboardTransactionsPage() {
  const { user, loading: authLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?userId=${encodeURIComponent(user.uid)}&limit=250`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("[TRANSACTIONS] Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchTransactions();
    }
  }, [user?.uid, fetchTransactions]);

  // Statistics calculation
  const stats = useMemo(() => {
    const successTxs = transactions.filter((t) =>
      ["PAID", "SETTLED", "SUCCESS"].includes(t.status)
    );
    const pendingTxs = transactions.filter((t) => t.status === "PENDING");
    const failedTxs = transactions.filter((t) =>
      ["FAILED", "EXPIRED", "CANCELLED"].includes(t.status)
    );
    const totalSpent = successTxs.reduce(
      (sum, t) => sum + (Number(t.totalAmount || t.total_amount) || 0),
      0
    );

    return {
      totalOrders: transactions.length,
      successOrders: successTxs.length,
      pendingOrders: pendingTxs.length,
      failedOrders: failedTxs.length,
      totalSpent
    };
  }, [transactions]);

  // Filtered transactions for status tab AND search query
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Status Filter
      const status = (t.status || "PENDING").toUpperCase();
      const matchStatus =
        activeTab === "ALL" ||
        (activeTab === "SUCCESS" && ["PAID", "SETTLED", "SUCCESS"].includes(status)) ||
        (activeTab === "PENDING" && status === "PENDING") ||
        (activeTab === "FAILED" && ["FAILED", "EXPIRED", "CANCELLED"].includes(status));

      if (!matchStatus) return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invoice = (t.invoiceNumber || t.invoice_number || "").toLowerCase();
        const title = (t.productTitle || t.product_title || "").toLowerCase();
        return invoice.includes(q) || title.includes(q);
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);

  const paginatedTransactions = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const handleTabChange = (tabId: "ALL" | "SUCCESS" | "PENDING" | "FAILED") => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (!mounted || authLoading) return null;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status pesanan produk digital, unduh bukti pembayaran, dan lacak seluruh pesanan Anda.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            className="h-9 px-3 text-xs font-semibold text-slate-700 border-slate-200 rounded-xl hover:bg-slate-100 gap-1.5"
            title="Muat ulang transaksi"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#00AA5B]")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link href="/dashboard/products">
            <Button
              size="sm"
              className="h-9 px-4 text-xs font-bold bg-[#00AA5B] hover:bg-[#00924E] text-white rounded-xl shadow-xs gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>Beli Produk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Key Metric Cards (Mobile 2 columns, Desktop 4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Transaksi (Blue) */}
        <Card className="border border-blue-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-white hover:border-blue-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800">Total Transaksi</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              {loading ? (
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
                Seluruh pesanan Anda
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Transaksi Berhasil (Emerald) */}
        <Card className="border border-emerald-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Transaksi Sukses</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#00AA5B] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-20 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`${stats.successOrders} Sukses`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.successOrders)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Sukses</span>
                </div>
              )}
              <p className="text-[11px] text-emerald-700/80 font-medium mt-1 truncate">
                Pesanan selesai terproses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Menunggu Pembayaran (Amber) */}
        <Card className="border border-amber-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-white hover:border-amber-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">Menunggu</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              {loading ? (
                <Skeleton className="h-7 w-20 mt-0.5" />
              ) : (
                <div
                  className="flex items-baseline gap-1 text-slate-900 tracking-tight"
                  title={`${stats.pendingOrders} Pending`}
                >
                  <span className="text-lg sm:text-2xl font-bold">
                    {formatCompactNumber(stats.pendingOrders)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-400">Pending</span>
                </div>
              )}
              <p className="text-[11px] text-amber-700/80 font-medium mt-1 truncate">
                Perlu diselesaikan segera
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Belanja (Purple) */}
        <Card className="border border-purple-200/90 shadow-2xs rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-white hover:border-purple-400 hover:shadow-xs transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-800">Total Pengeluaran</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              {loading ? (
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

      {/* 3. Main Transactions Feed Card */}
      <Card className="border border-slate-200 shadow-2xs rounded-2xl bg-white overflow-hidden">
        {/* Card Top Bar / Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Daftar Semua Transaksi
                </h2>
                <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
                  {filtered.length} Data
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pesanan dari API gateway maupun web checkout.
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
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#00AA5B]")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Status Tabs & Search Input inside Card */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: `Semua (${transactions.length})` },
              { id: "SUCCESS", label: `Sukses (${stats.successOrders})` },
              { id: "PENDING", label: `Menunggu (${stats.pendingOrders})` },
              { id: "FAILED", label: `Batal (${stats.failedOrders})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
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

        {/* Table Column Header Bar */}
        <div className="hidden sm:grid grid-cols-12 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-7">Produk & No. Invoice</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Nominal & Waktu</div>
        </div>

        {/* Transactions List */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
          ) : filtered.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 border border-slate-200">
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-800">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchQuery
                  ? `Tidak ada transaksi yang cocok dengan pencarian "${searchQuery}".`
                  : activeTab === "ALL"
                    ? "Belum ada riwayat pesanan pada akun Anda."
                    : `Tidak ada transaksi dengan status "${activeTab}".`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => {
                const isSuccess = ["PAID", "SUCCESS", "SETTLED"].includes(tx.status);
                const isPending = tx.status === "PENDING";
                const isFailed = ["FAILED", "EXPIRED", "CANCELLED"].includes(tx.status);
                const invNum = tx.invoiceNumber || tx.invoice_number || tx.id;

                let formattedDate = "-";
                try {
                  const d = new Date(tx.createdAt || tx.created_at);
                  formattedDate = d.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                } catch {
                  formattedDate = tx.createdAt || "-";
                }

                return (
                  <Link
                    key={tx.id || invNum}
                    href={`/transactions/${invNum}`}
                    className="block hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between sm:grid sm:grid-cols-12 gap-3">
                      {/* Left: Product & Invoice (col-span-7) */}
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
                            {tx.productTitle || tx.product_title || "Produk Digital"}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            {invNum}
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
                          <p className="text-xs sm:text-sm font-bold text-slate-900">
                            Rp {(Number(tx.totalAmount || tx.total_amount) || 0).toLocaleString("id-ID")}
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
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Card Footer Pagination & Record Counter */}
        {filtered.length > 0 && (
          <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            {/* Record Summary */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan{" "}
                <strong className="text-slate-800">
                  {filtered.length === 0 ? 0 : startIndex + 1}
                </strong>
                {" - "}
                <strong className="text-slate-800">{endIndex}</strong> dari{" "}
                <strong className="text-slate-800">{filtered.length}</strong> transaksi
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
        )}
      </Card>
    </main>
  );
}
