"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Search,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  Calendar,
  User,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

interface TopUpTransaction {
  id: string;
  invoice_number: string;
  user_id: string;
  product_title: string;
  total_amount: number;
  payment_method: string;
  payment_method_name: string;
  payment_category: string;
  channel_code: string;
  payment_code?: string;
  status: "PENDING" | "PAID" | "SETTLED" | "SUCCESS" | "CANCELLED" | "EXPIRED";
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  notes?: string;
  payment_info?: any;
  created_at: string;
  updated_at: string;
}

interface TopUpStats {
  countPending: number;
  countSuccess: number;
  countFailed: number;
  totalCount: number;
  todayVolume: number;
  totalVolume: number;
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

export default function AdminTopUpPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<TopUpTransaction[]>([]);
  const [stats, setStats] = useState<TopUpStats>({
    countPending: 0,
    countSuccess: 0,
    countFailed: 0,
    totalCount: 0,
    todayVolume: 0,
    totalVolume: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected for Detail / Action Modal
  const [selectedTrx, setSelectedTrx] = useState<TopUpTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal State
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Direct Credit Modal State
  const [isDirectCreditOpen, setIsDirectCreditOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [directCreditLoading, setDirectCreditLoading] = useState(false);

  // Copied states
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Fetch Top Up Queue
  const fetchTopUps = useCallback(async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("limit", "100");

      const res = await fetch(`/api/admin/topup?${params.toString()}`, {
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
          title: "Gagal Mengambil Data",
          description: data.message || "Terjadi kesalahan saat memuat antrean top up.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Koneksi Terputus",
        description: err.message || "Gagal menghubungi server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, searchTerm, statusFilter, toast]);

  useEffect(() => {
    fetchTopUps();
  }, [fetchTopUps]);

  // Handle Approve Top-Up
  const handleApprove = async (trxToApprove?: TopUpTransaction) => {
    const trx = trxToApprove || selectedTrx;
    if (!user || !trx) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "APPROVE",
          invoiceNumber: trx.invoice_number,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Top Up Berhasil Disetujui!",
          description: data.message,
        });
        setIsDetailOpen(false);
        fetchTopUps();
      } else {
        toast({
          title: "Gagal Menyetujui",
          description: data.message || "Terjadi kesalahan sistem.",
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
  const handleReject = async (trxToReject?: TopUpTransaction) => {
    const trx = trxToReject || selectedTrx;
    if (!user || !trx) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "REJECT",
          invoiceNumber: trx.invoice_number,
          notes: rejectReason || "Bukti transfer tidak valid atau dana belum masuk.",
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
        fetchTopUps();
      } else {
        toast({
          title: "Gagal Menolak",
          description: data.message || "Terjadi kesalahan sistem.",
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

  // Handle Direct Credit
  const handleDirectCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(creditAmount.replace(/[^0-9]/g, ""));
    if (!targetUserId.trim() || isNaN(num) || num <= 0) {
      toast({
        title: "Form Belum Lengkap",
        description: "Pastikan User ID/Email dan Nominal terisi dengan benar.",
        variant: "destructive",
      });
      return;
    }

    setDirectCreditLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "DIRECT_CREDIT",
          targetUserId: targetUserId.trim(),
          amount: num,
          notes: creditNotes.trim() || "Penambahan saldo manual oleh admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Saldo Berhasil Ditambahkan!",
          description: data.message,
        });
        setIsDirectCreditOpen(false);
        setTargetUserId("");
        setCreditAmount("");
        setCreditNotes("");
        fetchTopUps();
      } else {
        toast({
          title: "Gagal Menambahkan Saldo",
          description: data.message || "Terjadi kendala sistem.",
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
      setDirectCreditLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(id);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#F8FAFC] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Verifikasi Top Up Saldo
            </h1>
            {refreshing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00AA5B]" />}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola antrean permohonan isi ulang saldo manual, verifikasi mutasi rekening, dan setujui penambahan saldo akun secara instan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchTopUps}
            disabled={refreshing}
            className="h-9 px-3 text-xs font-medium text-slate-700 bg-white border-slate-200 rounded-xl hover:bg-slate-100 shadow-2xs gap-1.5"
            title="Muat ulang data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#00AA5B]")} />
            <span>Perbarui</span>
          </Button>
          <Button
            onClick={() => setIsDirectCreditOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Saldo Manual</span>
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Antrean Menunggu */}
        <Card className="border border-amber-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white hover:border-amber-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900/80">Antrean Verifikasi</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 border border-amber-200/60 flex items-center justify-center shadow-2xs">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-slate-900 tracking-tight">
                <span className="text-2xl font-bold">
                  {stats.countPending}
                </span>
                <span className="text-xs font-medium text-slate-400">permohonan</span>
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

        {/* Metric 2: Saldo Masuk Hari Ini */}
        <Card className="border border-emerald-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white hover:border-emerald-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900/80">Masuk Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-[#00AA5B] border border-emerald-200/60 flex items-center justify-center shadow-2xs">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1 text-slate-900 tracking-tight">
                <span className="text-xs font-semibold text-emerald-600/80">Rp</span>
                <span className="text-2xl font-bold">
                  {stats.todayVolume.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-[#00AA5B] font-medium mt-1">
                Volume top up disetujui hari ini
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Total Akumulasi Top Up */}
        <Card className="border border-blue-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white hover:border-blue-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900/80">Total Akumulasi</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 border border-blue-200/60 flex items-center justify-center shadow-2xs">
                <DollarSign className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1 text-slate-900 tracking-tight">
                <span className="text-xs font-semibold text-blue-600/80">Rp</span>
                <span className="text-2xl font-bold">
                  {stats.totalVolume.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-blue-700/80 font-medium mt-1">
                Total keseluruhan saldo masuk
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Permohonan Berhasil */}
        <Card className="border border-purple-200/70 shadow-2xs rounded-xl bg-gradient-to-b from-purple-50/70 via-purple-50/20 to-white hover:border-purple-300 transition-all">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-900/80">Total Sukses</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-700 border border-purple-200/60 flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 text-slate-900 tracking-tight">
                <span className="text-2xl font-bold">
                  {stats.countSuccess}
                </span>
                <span className="text-xs font-medium text-slate-400">/ {stats.totalCount} total</span>
              </div>
              <p className="text-[11px] text-purple-700/80 font-medium mt-1">
                Tingkat keberhasilan {stats.totalCount > 0 ? Math.round((stats.countSuccess / stats.totalCount) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/90 shadow-2xs rounded-2xl bg-white overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/40">
          {/* Quick Filter Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Semua", count: stats.totalCount },
              { id: "PENDING", label: "Menunggu", count: stats.countPending, highlight: true },
              { id: "PAID", label: "Disetujui", count: stats.countSuccess },
              { id: "CANCELLED", label: "Ditolak / Batal" },
              { id: "EXPIRED", label: "Kadaluarsa" },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs font-semibold"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : tab.highlight
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Cari no. tagihan, nama, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-7 h-8.5 text-xs rounded-lg bg-white border-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-6 py-3 whitespace-nowrap">
                  Tagihan & Waktu
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Pemohon
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Metode Pembayaran
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Nominal Top Up
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right px-6 whitespace-nowrap">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-slate-100 hover:bg-transparent">
                    <TableCell className="px-6 py-3.5 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-3 w-28 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="text-right px-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-7.5 w-16 rounded-lg" />
                        <Skeleton className="h-7.5 w-14 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Tidak Ada Permohonan Top Up
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {statusFilter === "PENDING"
                          ? "Semua permohonan telah selesai diverifikasi. Tidak ada antrean pending saat ini."
                          : "Belum ada transaksi top up yang sesuai dengan filter pencarian Anda."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => {
                  const isPending = t.status === "PENDING";
                  const channelLabel =
                    t.payment_info?.channelName ||
                    t.payment_method_name ||
                    t.payment_method;

                  return (
                    <TableRow
                      key={t.id || t.invoice_number}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTrx(t);
                        setShowRejectInput(false);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Invoice & Time */}
                      <TableCell className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-xs font-mono font-semibold text-slate-900 whitespace-nowrap">
                              {t.invoice_number}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(t.invoice_number, t.invoice_number);
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Salin No. Tagihan"
                            >
                              {copiedInvoice === t.invoice_number ? (
                                <Check className="w-3 h-3 text-[#00AA5B]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                            <Calendar className="w-3 h-3 opacity-60" />
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

                      {/* User Info */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col min-w-[140px] whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                            {t.buyer_name || "Pengguna MarketPoint"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[160px] whitespace-nowrap">
                            {t.buyer_email || t.user_id}
                          </span>
                        </div>
                      </TableCell>

                      {/* Payment Method / Channel */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                            {cleanChannelName(channelLabel)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                            {t.payment_info?.accountNumber || t.payment_code || "Admin Transfer"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Total Nominal */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-slate-900 whitespace-nowrap">
                            Rp {Number(t.total_amount).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap",
                            t.status === "PAID" || t.status === "SETTLED" || t.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : t.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200/60"
                                : t.status === "EXPIRED"
                                  ? "bg-slate-100 text-slate-600 border-slate-200/60"
                                  : "bg-rose-50 text-rose-700 border-rose-200/60"
                          )}
                        >
                          {t.status === "PAID" || t.status === "SETTLED" || t.status === "SUCCESS"
                            ? "Disetujui"
                            : t.status === "PENDING"
                              ? "Menunggu"
                              : t.status === "EXPIRED"
                                ? "Kadaluarsa"
                                : t.status === "CANCELLED"
                                  ? "Dibatalkan"
                                  : t.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right px-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(t);
                                }}
                                disabled={actionLoading}
                                title="Setujui & Langsung Tambah Saldo"
                                className="h-7.5 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00924E] text-white text-[11px] font-semibold gap-1 shadow-2xs cursor-pointer"
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
                                className="h-7.5 px-2.5 rounded-lg border-slate-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3 stroke-[2.5]" />
                                <span>Tolak</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrx(t);
                                  setShowRejectInput(false);
                                  setIsDetailOpen(true);
                                }}
                                className="h-7.5 px-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 gap-0.5"
                              >
                                Detail
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrx(t);
                                setShowRejectInput(false);
                                setIsDetailOpen(true);
                              }}
                              className="h-7.5 px-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1"
                            >
                              Detail
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <p className="text-[11px] text-slate-500 font-medium">
            Menampilkan {transactions.length} permohonan top up
          </p>
        </div>
      </Card>

      {/* DETAIL & VERIFICATION MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 bg-white border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto no-scrollbar">
          {selectedTrx && (
            <>
              <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Detail Verifikasi Top Up
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                      selectedTrx.status === "PAID" || selectedTrx.status === "SETTLED" || selectedTrx.status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                        : selectedTrx.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : selectedTrx.status === "EXPIRED"
                            ? "bg-slate-100 text-slate-600 border-slate-200/60"
                            : "bg-rose-50 text-rose-700 border-rose-200/60"
                    )}
                  >
                    {selectedTrx.status === "PAID" || selectedTrx.status === "SETTLED" || selectedTrx.status === "SUCCESS"
                      ? "Disetujui"
                      : selectedTrx.status === "PENDING"
                        ? "Menunggu"
                        : selectedTrx.status === "EXPIRED"
                          ? "Kadaluarsa"
                          : "Ditolak"}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-bold text-slate-900 pt-1 font-mono">
                  {selectedTrx.invoice_number}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Dibuat pada {new Date(selectedTrx.created_at).toLocaleString("id-ID")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* User & Destination Details */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Pemohon (User):
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedTrx.buyer_name || "Pengguna MarketPoint"}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 truncate mt-0.5">
                        {selectedTrx.buyer_email || selectedTrx.user_id}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Metode Transfer:
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {cleanChannelName(selectedTrx.payment_info?.channelName || selectedTrx.payment_method_name)}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {selectedTrx.payment_info?.accountNumber || selectedTrx.payment_code || "Admin Transfer"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Nominal Top Up:
                      </span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        Rp {Number(selectedTrx.total_amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {selectedTrx.buyer_phone && (
                      <a
                        href={`https://wa.me/${selectedTrx.buyer_phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Audit Notes */}
                {selectedTrx.notes && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Catatan Audit / Sistem:
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px]">
                      {selectedTrx.notes}
                    </p>
                  </div>
                )}

                {/* Reject Input Box */}
                {showRejectInput && (
                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <label className="text-xs font-semibold text-rose-900 block">
                      Alasan Penolakan Top Up:
                    </label>
                    <Input
                      placeholder="Contoh: Bukti transfer tidak valid atau dana belum masuk..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="h-8.5 text-xs bg-white border-rose-200 rounded-lg focus-visible:ring-1 focus-visible:ring-rose-500 placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                {selectedTrx.status === "PENDING" ? (
                  <>
                    {!showRejectInput ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRejectInput(true)}
                          disabled={actionLoading}
                          className="rounded-xl border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium h-9"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Tolak Top Up
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleApprove()}
                          disabled={actionLoading}
                          className="rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white text-xs font-semibold flex-1 h-9 shadow-xs"
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
                          className="rounded-xl text-xs font-medium h-9"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleReject()}
                          disabled={actionLoading}
                          className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex-1 h-9 shadow-xs"
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
                    className="w-full rounded-xl text-xs font-medium h-9"
                  >
                    Tutup
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIRECT CREDIT MODAL */}
      <Dialog open={isDirectCreditOpen} onOpenChange={setIsDirectCreditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6 bg-white border-slate-200 shadow-xl">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Tambah Saldo Manual
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Langsung kreditkan saldo ke dompet pengguna tertentu.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleDirectCreditSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                User ID (UID) Pengguna
              </label>
              <Input
                placeholder="Contoh: e7wK... atau masukkan UID Firebase"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                className="h-9 text-xs rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Nominal Saldo (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <Input
                  type="text"
                  placeholder="Contoh: 100000"
                  value={
                    creditAmount
                      ? Number(creditAmount.replace(/[^0-9]/g, "")).toLocaleString("id-ID")
                      : ""
                  }
                  onChange={(e) => setCreditAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="h-9 pl-9 text-xs font-bold rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Alasan / Catatan Penambahan
              </label>
              <Input
                placeholder="Contoh: Bonus referral, kompensasi gangguan, atau deposit cash..."
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                className="h-9 text-xs rounded-xl border-slate-200"
              />
            </div>

            <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDirectCreditOpen(false)}
                className="rounded-xl text-xs font-medium h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={directCreditLoading || !targetUserId || !creditAmount}
                className="rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white text-xs font-semibold flex-1 h-9 shadow-xs"
              >
                {directCreditLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                    Kreditkan Saldo Sekarang
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

