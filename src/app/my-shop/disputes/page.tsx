"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  User,
  ExternalLink,
  RefreshCw,
  Send,
  Scale,
  ChevronRight,
  Loader2,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type DisputeStatus =
  | "OPEN"
  | "SELLER_RESPONDED"
  | "ADMIN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

interface DisputeRecord {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  sellerId: string;
  productTitle?: string | null;
  productImage?: string | null;
  totalAmount: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  sellerResponse?: string | null;
  sellerRespondedAt?: string | null;
  adminNote?: string | null;
  resolution?: string | null;
  refundAmount?: number | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  not_received: "Produk tidak diterima",
  not_as_described: "Tidak sesuai deskripsi",
  invalid_license: "Lisensi / kunci tidak valid",
  corrupted_file: "File rusak / tidak lengkap",
  wrong_item: "Item salah / berbeda",
  refund_request: "Permintaan pengembalian dana",
  other: "Alasan lainnya",
};

const STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "Perlu Direspon",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  SELLER_RESPONDED: {
    label: "Sudah Direspon",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <MessageSquare className="w-3 h-3" />,
  },
  ADMIN_REVIEW: {
    label: "Ditinjau Admin",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Scale className="w-3 h-3" />,
  },
  RESOLVED: {
    label: "Selesai",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  REJECTED: {
    label: "Ditolak",
    color: "text-slate-700",
    bg: "bg-slate-50 border-slate-200",
    icon: <XCircle className="w-3 h-3" />,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const QUICK_RESPONSES = [
  "Terima kasih telah menghubungi kami. Kami sudah menerima laporan Anda dan sedang meninjau kasus ini.",
  "Kami mohon maaf atas ketidaknyamanan ini. Produk yang Anda terima seharusnya berfungsi dengan baik. Bisakah Anda mengirimkan screenshot error yang Anda alami?",
  "Lisensi yang kami berikan sudah valid. Mohon pastikan Anda mengikuti panduan aktivasi yang terlampir di email pengiriman.",
  "Kami bersedia memberikan solusi terbaik. Mohon berikan detail lebih lanjut agar kami dapat memproses penyelesaian kasus ini.",
  "Kami setuju untuk memberikan penggantian/refund sesuai ketentuan platform. Proses ini akan ditinjau oleh tim admin.",
];

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRupiah(amount: number) {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MerchantDisputePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { shop, isLoading: shopLoading } = useMerchantShop();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "open" | "responded" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Response Dialog
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail Dialog
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailDispute, setDetailDispute] = useState<DisputeRecord | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDisputes = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setIsLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch(`/api/disputes?sellerId=${user.uid}`);
        const data = await res.json();
        if (data.success) setDisputes(data.disputes || []);
      } catch (err) {
        console.error("Gagal memuat disputes:", err);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) fetchDisputes();
  }, [user, fetchDisputes]);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const open = disputes.filter((d) => d.status === "OPEN").length;
    const responded = disputes.filter(
      (d) => d.status === "SELLER_RESPONDED"
    ).length;
    const adminReview = disputes.filter(
      (d) => d.status === "ADMIN_REVIEW"
    ).length;
    const resolved = disputes.filter(
      (d) => d.status === "RESOLVED" || d.status === "REJECTED"
    ).length;
    return { open, responded, adminReview, resolved };
  }, [disputes]);

  // ─── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...disputes];
    if (activeTab === "open")
      list = list.filter((d) => d.status === "OPEN");
    else if (activeTab === "responded")
      list = list.filter(
        (d) => d.status === "SELLER_RESPONDED" || d.status === "ADMIN_REVIEW"
      );
    else if (activeTab === "resolved")
      list = list.filter(
        (d) => d.status === "RESOLVED" || d.status === "REJECTED" || d.status === "CANCELLED"
      );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.invoiceNumber?.toLowerCase().includes(q) ||
          d.buyerName?.toLowerCase().includes(q) ||
          d.buyerEmail?.toLowerCase().includes(q) ||
          d.productTitle?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) =>
      sortBy === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return list;
  }, [disputes, activeTab, searchQuery, sortBy]);

  // ─── Handle respond ─────────────────────────────────────────────────────────
  const handleOpenResponse = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setResponseText(dispute.sellerResponse || "");
    setIsResponseOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedDispute || !responseText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDispute.id,
          action: "seller_respond",
          response: responseText.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal mengirim respons");
      setDisputes((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? data.dispute : d))
      );
      setIsResponseOpen(false);
      toast({
        title: "Respons Berhasil Dikirim",
        description: "Pembeli akan mendapat notifikasi balasan Anda.",
      });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  const isLoadingInitial = !mounted || authLoading || (isLoading && disputes.length === 0);

  if (isLoadingInitial) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Komplain & Dispute
              </h1>
              {stats.open > 0 && (
                <Badge className="bg-orange-500 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {stats.open} baru
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Kelola keluhan pembeli dan selesaikan sengketa transaksi secara adil.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDisputes(true)}
            disabled={refreshing}
            className="h-8 px-3 rounded-xl text-xs font-bold border-border gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#00AA5B]")} />
            Segarkan
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Perlu Direspon",
              value: stats.open,
              color: "text-orange-600",
              bg: "bg-orange-50",
              border: "border-orange-100",
              icon: <AlertTriangle className="w-4 h-4" />,
            },
            {
              label: "Sudah Direspon",
              value: stats.responded,
              color: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-100",
              icon: <MessageSquare className="w-4 h-4" />,
            },
            {
              label: "Ditinjau Admin",
              value: stats.adminReview,
              color: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-100",
              icon: <Scale className="w-4 h-4" />,
            },
            {
              label: "Selesai",
              value: stats.resolved,
              color: "text-[#00AA5B]",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
              icon: <CheckCircle2 className="w-4 h-4" />,
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-1.5 rounded-lg border", stat.bg, stat.border)}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase mb-1">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-black tracking-tight",
                    stat.value > 0 && stat.color
                  )}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "all", label: `Semua (${disputes.length})` },
                { id: "open", label: `Perlu Respon (${stats.open})` },
                { id: "responded", label: `Direspon (${stats.responded + stats.adminReview})` },
                { id: "resolved", label: `Selesai (${stats.resolved})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-8 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-[#00AA5B]/10 text-[#00AA5B]"
                    : "text-muted-foreground hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari ID, invoice, pembeli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20"
              />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="h-8 w-28 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-xs font-bold">
                  Terbaru
                </SelectItem>
                <SelectItem value="oldest" className="text-xs font-bold">
                  Terlama
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Dispute List ── */}
        <div className="space-y-3 pb-20">
          {filtered.length === 0 ? (
            <Card className="border border-border rounded-2xl bg-white">
              <CardContent className="p-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 text-[#00AA5B] rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 mb-3">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {disputes.length === 0
                    ? "Tidak Ada Komplain Aktif"
                    : "Tidak Ada Hasil"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                  {disputes.length === 0
                    ? "Bagus! Semua pesanan toko Anda berjalan lancar tanpa sengketa dari pembeli."
                    : "Tidak ada dispute yang cocok dengan filter yang Anda pilih."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((dispute) => {
              const cfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG["OPEN"];
              const isNeedsAction = dispute.status === "OPEN";

              return (
                <Card
                  key={dispute.id}
                  className={cn(
                    "border rounded-2xl bg-white overflow-hidden transition-all group",
                    isNeedsAction
                      ? "border-orange-200 shadow-sm shadow-orange-50"
                      : "border-border shadow-xs hover:border-[#00AA5B]/30"
                  )}
                >
                  <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="px-4 py-3 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]/50">
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-foreground font-mono">
                            {dispute.id}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium">
                            #{dispute.invoiceNumber}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1",
                            cfg.bg,
                            cfg.color
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                        {isNeedsAction && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground font-medium">
                          Nilai Dispute
                        </p>
                        <p className="text-[11px] font-black text-slate-800">
                          {formatRupiah(dispute.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col md:flex-row md:items-start gap-4">
                      {/* Left: info */}
                      <div className="flex-1 space-y-3">
                        {/* Buyer Info */}
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-700">
                              {dispute.buyerName?.[0]?.toUpperCase() || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[12px] font-black text-slate-900">
                              {dispute.buyerName || "Pembeli"}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {dispute.buyerEmail || "—"} · {formatDate(dispute.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Product */}
                        {dispute.productTitle && (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                              {dispute.productTitle}
                            </span>
                          </div>
                        )}

                        {/* Reason & Description */}
                        <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100">
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                            {REASON_LABELS[dispute.reason] || dispute.reason}
                          </p>
                          <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-3">
                            {dispute.description}
                          </p>
                        </div>

                        {/* Seller response preview */}
                        {dispute.sellerResponse && (
                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                              Respons Anda:
                            </p>
                            <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-2">
                              {dispute.sellerResponse}
                            </p>
                          </div>
                        )}

                        {/* Resolution */}
                        {dispute.resolution && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" />
                            <span>
                              Resolusi:{" "}
                              <strong className="text-slate-700">
                                {dispute.resolution === "refund_buyer"
                                  ? "Refund ke Pembeli"
                                  : dispute.resolution === "release_seller"
                                  ? "Dana ke Penjual"
                                  : "Refund Parsial"}
                              </strong>
                              {dispute.refundAmount
                                ? ` · ${formatRupiah(dispute.refundAmount)}`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-row md:flex-col gap-2 md:w-36 shrink-0">
                        <Button
                          variant="outline"
                          className="flex-1 h-8 rounded-xl text-[10px] font-bold border-border hover:bg-slate-50 gap-1"
                          onClick={() => {
                            setDetailDispute(dispute);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Button>
                        {(dispute.status === "OPEN" ||
                          dispute.status === "SELLER_RESPONDED") && (
                          <Button
                            className="flex-1 h-8 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold shadow-sm gap-1"
                            onClick={() => handleOpenResponse(dispute)}
                          >
                            <Send className="w-3 h-3" />
                            {dispute.status === "OPEN" ? "Respon" : "Edit Respon"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Response Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#00AA5B]" />
              Kirim Respons Dispute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dispute #{selectedDispute?.id} · {selectedDispute?.buyerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            {selectedDispute && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                  Komplain Pembeli:
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {selectedDispute.description}
                </p>
              </div>
            )}

            {/* Quick templates */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Template Cepat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_RESPONSES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setResponseText(t)}
                    className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#00AA5B]/10 text-slate-600 hover:text-[#00AA5B] border border-transparent hover:border-[#00AA5B]/20 transition-colors"
                  >
                    Template {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Respons Anda <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Tuliskan respons, klarifikasi, atau solusi untuk pembeli..."
                rows={5}
                className="text-xs rounded-xl resize-none border-slate-200 focus-visible:ring-[#00AA5B]"
              />
              <p className="text-[10px] text-muted-foreground">
                {responseText.length}/1000 karakter
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsResponseOpen(false)}
              disabled={submitting}
              className="text-xs font-bold rounded-xl h-9"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={submitting || !responseText.trim()}
              className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs font-bold rounded-xl h-9 gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim Respons
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00AA5B]" />
              Detail Dispute
            </DialogTitle>
            {detailDispute && (
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                {detailDispute.id}
              </DialogDescription>
            )}
          </DialogHeader>

          {detailDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-muted-foreground font-medium mb-1">Invoice</p>
                  <p className="font-bold text-slate-900 font-mono">
                    #{detailDispute.invoiceNumber}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-muted-foreground font-medium mb-1">Nilai</p>
                  <p className="font-bold text-slate-900">
                    {formatRupiah(detailDispute.totalAmount)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-muted-foreground font-medium mb-1">Pembeli</p>
                  <p className="font-bold text-slate-900">{detailDispute.buyerName || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-muted-foreground font-medium mb-1">Tanggal</p>
                  <p className="font-bold text-slate-900">
                    {formatDate(detailDispute.createdAt)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                  Alasan: {REASON_LABELS[detailDispute.reason] || detailDispute.reason}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {detailDispute.description}
                </p>
              </div>

              {detailDispute.evidenceUrls?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Bukti Foto / Screenshot</p>
                  <div className="flex flex-wrap gap-2">
                    {detailDispute.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Bukti {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detailDispute.sellerResponse && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                    Respons Anda ({formatDate(detailDispute.sellerRespondedAt)}):
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {detailDispute.sellerResponse}
                  </p>
                </div>
              )}

              {detailDispute.adminNote && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">
                    Catatan Admin:
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {detailDispute.adminNote}
                  </p>
                </div>
              )}

              {detailDispute.resolution && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-[#00AA5B]">
                      Resolusi Akhir
                    </p>
                    <p className="text-xs text-slate-700 font-semibold">
                      {detailDispute.resolution === "refund_buyer"
                        ? "Refund ke Pembeli"
                        : detailDispute.resolution === "release_seller"
                        ? "Dana Dilepas ke Penjual"
                        : "Refund Parsial"}
                      {detailDispute.refundAmount
                        ? ` · ${formatRupiah(detailDispute.refundAmount)}`
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {detailDispute && detailDispute.status === "OPEN" && (
              <Button
                className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs font-bold rounded-xl h-9 gap-1.5"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenResponse(detailDispute);
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Respons
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="text-xs font-bold rounded-xl h-9"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
