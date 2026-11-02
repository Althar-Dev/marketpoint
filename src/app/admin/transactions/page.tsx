"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Activity,
  ChevronRight,
  RefreshCw,
  Eye,
  Check,
  X,
  CreditCard,
  User,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileText,
  Calendar,
  Layers,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  invoice_number: string;
  user_id: string;
  shop_id?: string;
  product_id?: string;
  product_title: string;
  total_amount: number;
  payment_method: string;
  payment_method_name: string;
  payment_category: string;
  channel_code: string;
  payment_code?: string;
  status: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  notes?: string;
  payment_info?: any;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalGmv: number;
  countSuccess: number;
  countPending: number;
  countFailed: number;
  totalCount: number;
}

function cleanTitle(title?: string): string {
  if (!title) return "-";
  return title
    .replace(/Bank Central Asia \(BCA\)/gi, "BCA")
    .replace(/Bank Central Asia/gi, "BCA")
    .replace(/Transfer Bank BCA/gi, "BCA")
    .replace(/Bank Mandiri \(Mandiri\)/gi, "Mandiri")
    .replace(/Bank Mandiri/gi, "Mandiri")
    .replace(/Transfer Bank Mandiri/gi, "Mandiri")
    .replace(/Bank Rakyat Indonesia \(BRI\)/gi, "BRI")
    .replace(/Bank Rakyat Indonesia/gi, "BRI")
    .replace(/Transfer Bank BRI/gi, "BRI")
    .replace(/Transfer SeaBank/gi, "SeaBank")
    .replace(/SeaBank/gi, "SeaBank")
    .replace(/QRIS \(Semua Bank & E-Wallet\)/gi, "QRIS")
    .replace(/QRIS Instant/gi, "QRIS")
    .replace(/DANA E-Wallet/gi, "DANA")
    .replace(/Transfer DANA/gi, "DANA")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function cleanChannelName(name?: string): string {
  if (!name) return "-";
  if (name.toLowerCase().includes("bca")) return "BCA";
  if (name.toLowerCase().includes("mandiri")) return "Mandiri";
  if (name.toLowerCase().includes("bri")) return "BRI";
  if (name.toLowerCase().includes("seabank")) return "SeaBank";
  if (name.toLowerCase().includes("qris")) return "QRIS";
  if (name.toLowerCase().includes("dana")) return "DANA";
  return cleanTitle(name);
}

export default function AdminTransactionsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalGmv: 0,
    countSuccess: 0,
    countPending: 0,
    countFailed: 0,
    totalCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Selected Transaction for Detail / Approval Modal
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      params.append("limit", "100");

      const res = await fetch(`/api/admin/transactions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast({
          title: "Gagal memuat transaksi",
          description: data.message || "Terjadi kesalahan sistem",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Koneksi Terputus",
        description: err.message || "Gagal menghubungi server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, searchTerm, statusFilter, categoryFilter, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Approve Top-Up
  const handleApproveTopUp = async (customTrx?: Transaction) => {
    const trx = customTrx || selectedTrx;
    if (!user || !trx) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "APPROVE_TOPUP",
          invoiceNumber: trx.invoice_number,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Top Up Disetujui",
          description: data.message,
        });
        setIsDetailOpen(false);
        fetchTransactions();
      } else {
        toast({
          title: "Gagal menyetujui",
          description: data.message || "Terjadi kesalahan sistem",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Kesalahan Jaringan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Top-Up
  const handleRejectTopUp = async (customTrx?: Transaction, customReason?: string) => {
    const trx = customTrx || selectedTrx;
    if (!user || !trx) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "REJECT_TOPUP",
          invoiceNumber: trx.invoice_number,
          notes: customReason || rejectReason || "Bukti transfer tidak valid atau belum masuk",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Top Up Ditolak",
          description: data.message,
        });
        setIsDetailOpen(false);
        setShowRejectInput(false);
        setRejectReason("");
        fetchTransactions();
      } else {
        toast({
          title: "Gagal menolak",
          description: data.message || "Terjadi kesalahan sistem",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Kesalahan Jaringan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-5 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Transaksi Platform
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor arus transaksi platform, verifikasi permohonan top-up manual, dan tinjau mutasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={refreshing}
            className="h-9 px-3 rounded-xl bg-white border-slate-200 text-xs font-semibold gap-1.5 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#00AA5B]")} />
            <span>Perbarui Data</span>
          </Button>
        </div>
      </div>

      {/* 4 Stats Overview Cards (Harmonious Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Volume GMV Sukses */}
        <Card className="border border-emerald-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white hover:border-emerald-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900/80">Volume GMV Sukses</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-[#00AA5B] border border-emerald-200/60 flex items-center justify-center shadow-2xs">
                <DollarSign className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1 text-slate-900 tracking-tight">
                <span className="text-xs font-semibold text-emerald-600/80">Rp</span>
                <span className="text-2xl font-bold">
                  {stats.totalGmv.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-[#00AA5B] font-medium mt-1">
                Total perputaran uang berhasil
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Trx Berhasil */}
        <Card className="border border-blue-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white hover:border-blue-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900/80">Transaksi Sukses</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/60 flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-slate-900 tracking-tight">
                <span className="text-2xl font-bold">
                  {stats.countSuccess.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-medium text-slate-400">/ {stats.totalCount} total</span>
              </div>
              <p className="text-[11px] text-blue-700/80 font-medium mt-1">
                Tingkat keberhasilan {stats.totalCount > 0 ? Math.round((stats.countSuccess / stats.totalCount) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Trx Menunggu */}
        <Card className="border border-amber-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white hover:border-amber-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900/80">Menunggu Verifikasi</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 border border-amber-200/60 flex items-center justify-center shadow-2xs">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-slate-900 tracking-tight">
                <span className="text-2xl font-bold">
                  {stats.countPending.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-medium text-slate-400">transaksi</span>
              </div>
              <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  stats.countPending > 0 ? "bg-amber-500 animate-pulse" : "bg-amber-400/60"
                )} />
                {stats.countPending > 0 ? "Memerlukan konfirmasi admin" : "Tidak ada antrean pending"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Batal / Gagal */}
        <Card className="border border-rose-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-rose-50/70 via-rose-50/20 to-white hover:border-rose-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900/80">Batal / Gagal</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 border border-rose-200/60 flex items-center justify-center shadow-2xs">
                <AlertCircle className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-slate-900 tracking-tight">
                <span className="text-2xl font-bold">
                  {stats.countFailed.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-medium text-slate-400">transaksi</span>
              </div>
              <p className="text-[11px] text-rose-700/80 font-medium mt-1">
                Transaksi kadaluarsa atau ditolak
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari Invoice, Nama Pengguna, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-lg bg-slate-50/80 border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
          />
        </div>

        {/* Quick Filter Buttons & Selects */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {/* Quick Filter: Pending Only */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
            className={cn(
              "h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 transition-all shadow-2xs cursor-pointer",
              statusFilter === "PENDING"
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu</span>
            {stats.countPending > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                statusFilter === "PENDING" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"
              )}>
                {stats.countPending}
              </span>
            )}
          </Button>

          {/* Quick Filter: Top Up Manual */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCategoryFilter(categoryFilter === "MANUAL" ? "ALL" : "MANUAL")}
            className={cn(
              "h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 transition-all shadow-2xs cursor-pointer",
              categoryFilter === "MANUAL"
                ? "bg-[#00AA5B] hover:bg-[#00924E] text-white border-[#00AA5B]"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Top Up Manual</span>
          </Button>

          {/* Select Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 rounded-lg border-slate-200 bg-white text-xs font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
              <SelectItem value="PENDING" className="text-xs">PENDING</SelectItem>
              <SelectItem value="PAID" className="text-xs">PAID / SUKSES</SelectItem>
              <SelectItem value="CANCELLED" className="text-xs">DIBATALKAN</SelectItem>
              <SelectItem value="FAILED" className="text-xs">GAGAL</SelectItem>
            </SelectContent>
          </Select>

          {/* Select Category */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 bg-white text-xs font-medium">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
              <SelectItem value="MANUAL" className="text-xs">Top Up Manual</SelectItem>
              <SelectItem value="QRIS" className="text-xs">QRIS</SelectItem>
              <SelectItem value="VA" className="text-xs">Virtual Account</SelectItem>
              <SelectItem value="RESELLER" className="text-xs">Reseller H2H</SelectItem>
              <SelectItem value="STORE" className="text-xs">Produk Toko</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table Card */}
      <Card className="border border-slate-200/80 shadow-2xs rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1050px]">
            <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-5 h-11 whitespace-nowrap">
                  Waktu & Invoice
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 whitespace-nowrap">
                  Pengguna / Pembeli
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 whitespace-nowrap">
                  Item / Kategori
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 whitespace-nowrap">
                  Nominal & Metode
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider h-11 whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right px-5 h-11 whitespace-nowrap">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-slate-100 hover:bg-transparent">
                    <TableCell className="px-5 py-3.5 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-7 w-16 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Tidak ada transaksi ditemukan</p>
                      <p className="text-[11px] text-slate-500">
                        Tidak ada transaksi yang cocok dengan kriteria filter saat ini.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => {
                  const isTopUpManual =
                    t.payment_category === "MANUAL" ||
                    t.payment_category === "MANUAL_TRANSFER" ||
                    t.payment_method === "MANUAL_TRANSFER" ||
                    t.product_id === "TOPUP-MANUAL" ||
                    Boolean(t.product_title && t.product_title.toLowerCase().includes("top up saldo"));
                  const isPending = t.status === "PENDING";

                  return (
                    <TableRow
                      key={t.id || t.invoice_number}
                      className={cn(
                        "border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer",
                        isTopUpManual && isPending && "bg-amber-50/20"
                      )}
                      onClick={() => {
                        setSelectedTrx(t);
                        setShowRejectInput(false);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* 1. Invoice & Waktu */}
                      <TableCell className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {t.invoice_number}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(t.invoice_number);
                                toast({ title: "Disalin", description: "Nomor invoice berhasil disalin." });
                              }}
                              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
                              title="Salin Invoice"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(t.created_at).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Pengguna / Pembeli */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 font-bold text-[10px]">
                            {(t.buyer_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-[130px] whitespace-nowrap">
                            <span className="text-xs font-semibold text-slate-800">
                              {t.buyer_name || "Tanpa Nama"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                              {t.buyer_email || t.user_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Item / Kategori */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-800">
                            {cleanTitle(t.product_title)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold bg-slate-50 border-slate-200 text-slate-600">
                              {t.payment_category || "GENERAL"}
                            </Badge>
                            {isTopUpManual && (
                              <Badge className="h-4 px-1.5 text-[8.5px] bg-amber-100 text-amber-800 border-amber-200 font-semibold">
                                Manual Transfer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 4. Nominal & Metode */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-900">
                            Rp {Number(t.total_amount).toLocaleString("id-ID")}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {cleanChannelName(t.payment_method_name || t.payment_method)}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Status */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                            t.status === "PAID" || t.status === "SETTLED" || t.status === "SUCCESS"
                              ? "bg-emerald-50 text-[#00AA5B] border-emerald-200/80"
                              : t.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                : t.status === "EXPIRED"
                                  ? "bg-slate-50 text-slate-600 border-slate-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200/80"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              t.status === "PAID" || t.status === "SETTLED" || t.status === "SUCCESS"
                                ? "bg-[#00AA5B]"
                                : t.status === "PENDING"
                                  ? "bg-amber-500 animate-pulse"
                                  : t.status === "EXPIRED"
                                    ? "bg-slate-400"
                                    : "bg-rose-500"
                            )}
                          />
                          {t.status === "PAID" || t.status === "SETTLED" || t.status === "SUCCESS"
                            ? "Lunas / Selesai"
                            : t.status === "PENDING"
                              ? "Menunggu"
                              : t.status === "EXPIRED"
                                ? "Kadaluarsa"
                                : t.status === "CANCELLED"
                                  ? "Dibatalkan"
                                  : t.status}
                        </span>
                      </TableCell>

                      {/* 6. Aksi */}
                      <TableCell className="text-right px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTopUpManual && isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveTopUp(t);
                                }}
                                disabled={actionLoading}
                                title="Setujui Top Up & Tambah Saldo Langsung"
                                className="h-7 px-2.5 rounded-lg bg-[#00AA5B] hover:bg-[#00924E] text-white text-[11px] font-semibold gap-1 shadow-2xs cursor-pointer"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Setujui</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrx(t);
                                  setShowRejectInput(true);
                                  setIsDetailOpen(true);
                                }}
                                disabled={actionLoading}
                                title="Tolak Top Up"
                                className="h-7 px-2 rounded-lg border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-[11px] font-semibold gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                                <span>Tolak</span>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrx(t);
                              setShowRejectInput(false);
                              setIsDetailOpen(true);
                            }}
                            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200/80 gap-1 shadow-2xs cursor-pointer"
                          >
                            Detail
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3.5 border-t border-slate-200/60 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{transactions.length}</span> transaksi
          </p>
        </div>
      </Card>

      {/* DETAIL & VERIFICATION DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-5 sm:p-6 bg-white border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
          {selectedTrx && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        Transaksi #{selectedTrx.invoice_number}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 line-clamp-1">
                        {cleanTitle(selectedTrx.product_title)}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                      selectedTrx.status === "PAID" || selectedTrx.status === "SETTLED" || selectedTrx.status === "SUCCESS"
                        ? "bg-emerald-50 text-[#00AA5B] border-emerald-200"
                        : selectedTrx.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    )}
                  >
                    {selectedTrx.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 pt-2 text-xs">
                {/* User & Amount Card */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Pengguna / Pembeli
                    </span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      {selectedTrx.buyer_name || "Tanpa Nama"}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                      {selectedTrx.buyer_email || selectedTrx.user_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Total Pembayaran
                    </span>
                    <p className="font-black text-slate-900 text-base mt-0.5">
                      Rp {Number(selectedTrx.total_amount).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Metode: {cleanChannelName(selectedTrx.payment_method_name || selectedTrx.payment_method)}
                    </p>
                  </div>
                </div>

                {/* Transfer Proof & Manual Top-Up Info */}
                {(selectedTrx.payment_category === "MANUAL" ||
                  selectedTrx.payment_category === "MANUAL_TRANSFER" ||
                  selectedTrx.payment_method === "MANUAL_TRANSFER" ||
                  selectedTrx.product_id === "TOPUP-MANUAL" ||
                  Boolean(selectedTrx.product_title && selectedTrx.product_title.toLowerCase().includes("top up saldo"))) && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Data Pengajuan Top Up Saldo Manual</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Tujuan Transfer:</span>
                          <p className="font-bold text-slate-800">
                            {cleanChannelName(selectedTrx.payment_info?.channelName || selectedTrx.payment_info?.bankName || selectedTrx.payment_method_name || selectedTrx.channel_code)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Nominal Pokok:</span>
                          <p className="font-bold text-slate-800">
                            Rp {(Number(selectedTrx.payment_info?.originalAmount) || Number(selectedTrx.payment_info?.nominal) || Number(selectedTrx.total_amount)).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Nomor Rekening:</span>
                          <p className="font-mono font-bold text-slate-800">
                            {selectedTrx.payment_info?.accountNumber || selectedTrx.payment_code || "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Atas Nama:</span>
                          <p className="font-bold text-slate-800">
                            {selectedTrx.payment_info?.accountName || selectedTrx.payment_info?.accountHolder || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Bukti Transfer Image Viewer */}
                      {selectedTrx.payment_info?.proofUrl ? (
                        <div className="pt-1.5">
                          <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                            Bukti Transfer dari Pengguna:
                          </span>
                          <a
                            href={selectedTrx.payment_info.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block relative rounded-xl overflow-hidden border border-amber-200 group bg-white max-h-60"
                          >
                            <img
                              src={selectedTrx.payment_info.proofUrl}
                              alt="Bukti Transfer"
                              className="w-full object-contain max-h-60"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-opacity">
                              <ExternalLink className="w-4 h-4" /> Buka Ukuran Penuh
                            </div>
                          </a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-800 italic">
                          Pengguna belum mengunggah foto bukti transfer saat pengajuan.
                        </p>
                      )}
                    </div>
                  )}

                {/* Additional Notes */}
                {selectedTrx.notes && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Catatan Sistem / Audit
                    </span>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">
                      {selectedTrx.notes}
                    </p>
                  </div>
                )}

                {/* Reject Input Box */}
                {showRejectInput && (
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <label className="text-xs font-bold text-rose-900 block">
                      Alasan Penolakan Top Up:
                    </label>
                    <Input
                      placeholder="Contoh: Mutasi belum masuk / nominal tidak sesuai"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="h-8.5 text-xs bg-white border-rose-300 focus-visible:ring-rose-400"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                {selectedTrx.status === "PENDING" && (
                  selectedTrx.payment_category === "MANUAL" ||
                  selectedTrx.payment_category === "MANUAL_TRANSFER" ||
                  selectedTrx.payment_method === "MANUAL_TRANSFER" ||
                  selectedTrx.product_id === "TOPUP-MANUAL" ||
                  Boolean(selectedTrx.product_title && selectedTrx.product_title.toLowerCase().includes("top up saldo"))
                ) ? (
                  <>
                    {!showRejectInput ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRejectInput(true)}
                          disabled={actionLoading}
                          className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Tolak Top Up
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleApproveTopUp()}
                          disabled={actionLoading}
                          className="rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white text-xs font-semibold flex-1 shadow-2xs"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                          )}
                          Setujui & Tambah Saldo Pengguna
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowRejectInput(false)}
                          disabled={actionLoading}
                          className="rounded-xl text-xs font-semibold text-slate-600"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleRejectTopUp()}
                          disabled={actionLoading}
                          className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex-1 shadow-2xs"
                        >
                          {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                          Konfirmasi Penolakan
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                    className="w-full rounded-xl text-xs font-semibold border-slate-200 text-slate-700"
                  >
                    Tutup
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
