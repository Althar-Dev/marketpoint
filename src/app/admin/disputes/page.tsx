"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  Loader2,
  RefreshCw,
  MessageSquare,
  Package,
  ExternalLink,
  FileText,
  Banknote,
  User,
  Store,
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

type DisputeResolution = "refund_buyer" | "release_seller" | "partial_refund";

interface DisputeRecord {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  buyerId: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  sellerId: string;
  sellerName?: string | null;
  productTitle?: string | null;
  totalAmount: number;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  sellerResponse?: string | null;
  sellerRespondedAt?: string | null;
  adminNote?: string | null;
  resolution?: DisputeResolution | null;
  refundAmount?: number | null;
  resolvedBy?: string | null;
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
  { label: string; color: string; bg: string }
> = {
  OPEN: { label: "Perlu Respon", color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
  SELLER_RESPONDED: { label: "Direspon Penjual", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
  ADMIN_REVIEW: { label: "Ditinjau Admin", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  RESOLVED: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
  REJECTED: { label: "Ditolak", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  CANCELLED: { label: "Dibatalkan", color: "text-slate-500", bg: "bg-slate-100 border-slate-200" },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatRupiah(amount?: number | null) {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDisputesPage() {
  const { toast } = useToast();

  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Resolve Dialog
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolution, setResolution] = useState<DisputeResolution>("release_seller");
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [newStatus, setNewStatus] = useState<DisputeStatus>("RESOLVED");
  const [submitting, setSubmitting] = useState(false);

  // Detail Dialog
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailDispute, setDetailDispute] = useState<DisputeRecord | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchDisputes = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(
        `/api/disputes?admin=1&status=${statusFilter}&limit=100`
      );
      const data = await res.json();
      if (data.success) setDisputes(data.disputes || []);
    } catch (err) {
      console.error("Gagal memuat disputes:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: disputes.length,
    open: disputes.filter((d) => d.status === "OPEN").length,
    sellerResponded: disputes.filter((d) => d.status === "SELLER_RESPONDED").length,
    adminReview: disputes.filter((d) => d.status === "ADMIN_REVIEW").length,
    resolved: disputes.filter((d) => d.status === "RESOLVED" || d.status === "REJECTED").length,
  }), [disputes]);

  // ─── Filtered ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...disputes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.invoiceNumber?.toLowerCase().includes(q) ||
          d.buyerName?.toLowerCase().includes(q) ||
          d.sellerName?.toLowerCase().includes(q) ||
          d.productTitle?.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [disputes, searchQuery]);

  // ─── Handle Resolve ────────────────────────────────────────────────────────
  const handleOpenResolve = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setResolution("release_seller");
    setAdminNote("");
    setRefundAmount(String(dispute.totalAmount || ""));
    setNewStatus("RESOLVED");
    setIsResolveOpen(true);
  };

  const handleSubmitResolve = async () => {
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDispute.id,
          action: "admin_resolve",
          resolution,
          adminNote: adminNote.trim() || undefined,
          refundAmount: resolution !== "release_seller" ? Number(refundAmount) : undefined,
          resolvedBy: "admin",
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gagal memproses resolusi");
      setDisputes((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? data.dispute : d))
      );
      setIsResolveOpen(false);
      toast({
        title: "Resolusi Berhasil",
        description: `Dispute ${selectedDispute.id} telah diselesaikan.`,
      });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (dispute: DisputeRecord) => {
    try {
      const res = await fetch("/api/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dispute.id, action: "admin_review" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDisputes((prev) =>
        prev.map((d) => (d.id === dispute.id ? data.dispute : d))
      );
      toast({ title: "Dispute Dieskalasi ke Admin Review" });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Manajemen Dispute
              </h1>
              {stats.adminReview > 0 && (
                <Badge className="bg-purple-600 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {stats.adminReview} review
                </Badge>
              )}
              {stats.open > 0 && (
                <Badge className="bg-orange-500 text-white border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {stats.open} open
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Mediasi sengketa antara pembeli dan penjual, tentukan resolusi akhir.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDisputes(true)}
            disabled={refreshing}
            className="h-8 px-3 rounded-xl text-xs font-bold border-border gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Segarkan
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-slate-700", bg: "bg-slate-50" },
            { label: "Menunggu", value: stats.open, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Direspon", value: stats.sellerResponded, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Review Admin", value: stats.adminReview, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Selesai", value: stats.resolved, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat, i) => (
            <Card key={i} className="border border-border rounded-2xl bg-white shadow-xs">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase mb-2">
                  {stat.label}
                </p>
                <p className={cn("text-2xl font-black tracking-tight", stat.color)}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-xs">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari ID, invoice, nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 rounded-lg border-border text-xs bg-muted/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="h-8 w-44 rounded-lg border-border text-xs font-bold bg-white">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-xs font-bold">Semua Status</SelectItem>
              <SelectItem value="OPEN" className="text-xs font-bold">Perlu Respon</SelectItem>
              <SelectItem value="SELLER_RESPONDED" className="text-xs font-bold">Direspon Penjual</SelectItem>
              <SelectItem value="ADMIN_REVIEW" className="text-xs font-bold">Ditinjau Admin</SelectItem>
              <SelectItem value="RESOLVED" className="text-xs font-bold">Selesai</SelectItem>
              <SelectItem value="REJECTED" className="text-xs font-bold">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ── */}
        <Card className="border border-border rounded-2xl bg-white shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 mb-3">
                <ShieldAlert className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada dispute</p>
              <p className="text-xs text-muted-foreground mt-1">
                {disputes.length === 0
                  ? "Belum ada dispute yang tercatat di sistem."
                  : "Tidak ada hasil sesuai filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC] border-b border-border">
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3 pl-5">
                      ID / Invoice
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3">
                      Pembeli
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3 hidden md:table-cell">
                      Penjual
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3 hidden lg:table-cell">
                      Alasan
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3 text-right hidden sm:table-cell">
                      Nilai
                    </TableHead>
                    <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-wide py-3 text-right pr-5">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dispute) => {
                    const cfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG["OPEN"];
                    const canResolve =
                      dispute.status !== "RESOLVED" &&
                      dispute.status !== "REJECTED" &&
                      dispute.status !== "CANCELLED";

                    return (
                      <TableRow
                        key={dispute.id}
                        className="hover:bg-[#F8FAFC]/70 border-b border-border/50 transition-colors"
                      >
                        <TableCell className="py-3.5 pl-5">
                          <p className="text-[11px] font-black text-slate-900 font-mono">
                            {dispute.id}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            #{dispute.invoiceNumber}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDate(dispute.createdAt)}
                          </p>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-border shrink-0">
                              <AvatarFallback className="text-[9px] font-black bg-slate-100">
                                {dispute.buyerName?.[0]?.toUpperCase() || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-[11px] font-bold text-slate-900">
                                {dispute.buyerName || "Pembeli"}
                              </p>
                              <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                                {dispute.buyerEmail || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3 h-3 text-muted-foreground shrink-0" />
                            <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]">
                              {dispute.sellerName || dispute.sellerId}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 hidden lg:table-cell">
                          <p className="text-[10px] font-semibold text-slate-700 max-w-[160px]">
                            {REASON_LABELS[dispute.reason] || dispute.reason}
                          </p>
                          {dispute.productTitle && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                              <Package className="w-2.5 h-2.5 shrink-0" />
                              {dispute.productTitle}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5">
                          <Badge
                            className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-md border",
                              cfg.bg,
                              cfg.color
                            )}
                          >
                            {cfg.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3.5 text-right hidden sm:table-cell">
                          <p className="text-[11px] font-black text-slate-800">
                            {formatRupiah(dispute.totalAmount)}
                          </p>
                        </TableCell>

                        <TableCell className="py-3.5 text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border"
                              onClick={() => {
                                setDetailDispute(dispute);
                                setIsDetailOpen(true);
                              }}
                            >
                              Detail
                            </Button>
                            {canResolve && (
                              <>
                                {dispute.status !== "ADMIN_REVIEW" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
                                    onClick={() => handleEscalate(dispute)}
                                  >
                                    Eskalasi
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold shadow-sm"
                                  onClick={() => handleOpenResolve(dispute)}
                                >
                                  Selesaikan
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Resolve Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              Selesaikan Dispute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedDispute?.id} · {selectedDispute?.buyerName} vs {selectedDispute?.sellerName || "Penjual"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            {selectedDispute && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alasan</span>
                  <span className="font-bold text-slate-800">
                    {REASON_LABELS[selectedDispute.reason] || selectedDispute.reason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nilai</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(selectedDispute.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Pilih Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status Akhir</label>
              <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="RESOLVED" className="text-xs font-bold">Selesai (RESOLVED)</SelectItem>
                  <SelectItem value="REJECTED" className="text-xs font-bold">Ditolak (REJECTED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Resolusi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Resolusi Dana <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    {
                      value: "refund_buyer",
                      label: "Refund ke Pembeli",
                      desc: "Dana dikembalikan ke pembeli",
                      icon: <Banknote className="w-4 h-4 text-rose-600" />,
                    },
                    {
                      value: "release_seller",
                      label: "Dana ke Penjual",
                      desc: "Dispute ditolak, dana ke penjual",
                      icon: <Store className="w-4 h-4 text-blue-600" />,
                    },
                    {
                      value: "partial_refund",
                      label: "Refund Parsial",
                      desc: "Sebagian dikembalikan ke pembeli",
                      icon: <Scale className="w-4 h-4 text-purple-600" />,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResolution(opt.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      resolution === opt.value
                        ? "border-[#00AA5B] bg-emerald-50"
                        : "border-border hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="shrink-0">{opt.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nominal refund (partial) */}
            {resolution !== "release_seller" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nominal Refund (Rp)
                </label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Maks: ${Number(selectedDispute?.totalAmount || 0).toLocaleString("id-ID")}`}
                  className="h-9 rounded-xl border-slate-200 text-xs font-bold"
                />
              </div>
            )}

            {/* Admin Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Catatan Admin (opsional)
              </label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Tambahkan catatan atau alasan keputusan mediasi..."
                rows={3}
                className="text-xs rounded-xl resize-none border-slate-200 focus-visible:ring-[#00AA5B]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsResolveOpen(false)}
              disabled={submitting}
              className="text-xs font-bold rounded-xl h-9"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitResolve}
              disabled={submitting || !resolution}
              className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs font-bold rounded-xl h-9 gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan Resolusi
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
                {[
                  { label: "Invoice", value: `#${detailDispute.invoiceNumber}` },
                  { label: "Nilai", value: formatRupiah(detailDispute.totalAmount) },
                  { label: "Pembeli", value: detailDispute.buyerName || "—" },
                  { label: "Penjual", value: detailDispute.sellerName || detailDispute.sellerId },
                  { label: "Dibuat", value: formatDate(detailDispute.createdAt) },
                  { label: "Diperbarui", value: formatDate(detailDispute.updatedAt) },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-muted-foreground font-medium mb-1">{item.label}</p>
                    <p className="font-bold text-slate-900 break-all">{item.value}</p>
                  </div>
                ))}
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
                  <p className="text-xs font-bold text-slate-700">Bukti Lampiran</p>
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
                    Respons Penjual ({formatDate(detailDispute.sellerRespondedAt)}):
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
                    <p className="text-[10px] font-bold text-[#00AA5B]">Resolusi Akhir</p>
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
            {detailDispute &&
              detailDispute.status !== "RESOLVED" &&
              detailDispute.status !== "REJECTED" &&
              detailDispute.status !== "CANCELLED" && (
                <Button
                  className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs font-bold rounded-xl h-9 gap-1.5"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenResolve(detailDispute);
                  }}
                >
                  <Scale className="w-3.5 h-3.5" />
                  Selesaikan Dispute
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
