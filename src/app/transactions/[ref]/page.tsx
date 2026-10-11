"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Package,
  CreditCard,
  Mail,
  Phone,
  User,
  Calendar,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Home,
  FileText,
  ShoppingBag,
  History,
  Wallet,
  Tag,
  ChevronRight,
  Share2,
  Sparkles,
  Download,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { generateTransactionPdf } from "@/lib/pdf-invoice";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  invoiceNumber: string;
  productId?: string | null;
  productTitle: string;
  productImage?: string | null;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
  itemsSubtotal: number;
  paymentFee: number;
  discount: number;
  voucherCode?: string | null;
  totalAmount: number;
  platformFee?: number;
  platformFeeRate?: number;
  shopTier?: string;
  netAmount?: number;
  paymentMethod: string;
  paymentMethodName: string;
  paymentCategory: string;
  paymentCode?: string | null;
  status: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  deliveredBy?: string | null;
  deliveredAt?: string | null;
  licenseKey?: string | null;
  licenseKeys?: string[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeLabel: string; color: string; bg: string; badgeBg: string; glow: string; icon: React.ReactNode; desc: string }
> = {
  PAID: {
    label: "Pembayaran Berhasil",
    badgeLabel: "Lunas / Selesai",
    color: "text-emerald-700",
    bg: "bg-emerald-50/80 border-emerald-200/80",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    glow: "shadow-emerald-100",
    icon: <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />,
    desc: "Pesanan telah lunas. Lisensi produk otomatis diterbitkan dan dikirimkan ke email Anda.",
  },
  SETTLED: {
    label: "Lunas & Selesai",
    badgeLabel: "Lunas / Settled",
    color: "text-emerald-700",
    bg: "bg-emerald-50/80 border-emerald-200/80",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    glow: "shadow-emerald-100",
    icon: <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />,
    desc: "Transaksi telah berhasil diselesaikan secara penuh di MarketPoint.",
  },
  PENDING: {
    label: "Menunggu Pembayaran",
    badgeLabel: "Menunggu Bayar",
    color: "text-amber-700",
    bg: "bg-amber-50/80 border-amber-200/80",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    glow: "shadow-amber-100",
    icon: <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />,
    desc: "Silakan selesaikan pembayaran sesuai instruksi metode yang Anda pilih.",
  },
  EXPIRED: {
    label: "Tagihan Kedaluwarsa",
    badgeLabel: "Kedaluwarsa",
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    glow: "shadow-slate-100",
    icon: <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-slate-500" />,
    desc: "Batas waktu pembayaran telah habis. Silakan buat pesanan baru jika ingin melanjutkan.",
  },
  CANCELLED: {
    label: "Transaksi Dibatalkan",
    badgeLabel: "Dibatalkan",
    color: "text-rose-700",
    bg: "bg-rose-50/80 border-rose-200/80",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    glow: "shadow-rose-100",
    icon: <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />,
    desc: "Transaksi pembayaran ini telah dibatalkan oleh pengguna atau sistem.",
  },
  FAILED: {
    label: "Pembayaran Gagal",
    badgeLabel: "Gagal",
    color: "text-rose-700",
    bg: "bg-rose-50/80 border-rose-200/80",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    glow: "shadow-rose-100",
    icon: <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />,
    desc: "Pembayaran tidak dapat diproses. Silakan coba kembali dengan metode pembayaran lain.",
  },
};

function formatRupiah(amount: number) {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function CopyButton({
  text,
  label = "Salin",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Disalin ke Clipboard",
      description: `${label} "${text}" berhasil disalin.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors text-xs font-semibold shrink-0",
        className
      )}
      title={`Salin ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600 font-bold">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 opacity-60" />
          <span>Salin</span>
        </>
      )}
    </button>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const ref = params?.ref as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchTransaction = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Transaksi tidak ditemukan.");
      setTransaction(data.transaction);
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail transaksi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (ref) fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const handleDownloadPdf = async () => {
    if (!transaction) return;
    try {
      setDownloadingPdf(true);
      await generateTransactionPdf(transaction);
      toast({
        title: "PDF Berhasil Diunduh",
        description: `Bukti transaksi #${transaction.invoiceNumber} telah disimpan dalam format PDF.`,
      });
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      toast({
        title: "Gagal Mengunduh PDF",
        description: "Terjadi kendala saat memproses dokumen PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share && transaction) {
      navigator.share({
        title: `Invoice #${transaction.invoiceNumber} - MarketPoint`,
        text: `Detail Transaksi ${transaction.invoiceNumber} di MarketPoint`,
        url: window.location.href,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Tautan Disalin",
        description: "Tautan bukti transaksi telah disalin ke clipboard.",
      });
    }
  };

  const status = transaction?.status || "PENDING";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
  const isPaid = status === "PAID" || status === "SETTLED";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <div className="hidden md:block">
          <MarketHeader />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-14 h-14">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md border border-slate-100">
                <Loader2 className="w-6 h-6 text-[#00AA5B] animate-spin" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600">Memuat rincian transaksi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <div className="hidden md:block">
          <MarketHeader />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 sm:p-8 text-center rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-lg bg-white">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4 border border-rose-100">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-black text-slate-800">Transaksi Tidak Ditemukan</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
              {error || "Nomor referensi tidak valid atau data transaksi belum tercatat di sistem."}
            </p>
            <div className="flex flex-col gap-2.5">
              <Button asChild className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs">
                <Link href="/transactions">
                  <History className="w-4 h-4 mr-2" /> Lihat Riwayat Transaksi
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-xl font-bold text-xs border-slate-200">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" /> Ke Beranda MarketPoint
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col print:bg-white print:p-0">
      {/* 1. Header Desktop Nav */}
      <div className="hidden md:block print:hidden">
        <MarketHeader />
      </div>

      {/* 2. Header Mobile Nav */}
      <div className="sticky top-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-b border-border/70 px-4 h-14 flex items-center justify-between shadow-xs print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#00AA5B]" />
          <span className="text-xs font-black text-slate-900">Detail Transaksi</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchTransaction(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-[#00AA5B]")} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Bagikan"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Main Container Desktop & Mobile */}
      <div className="flex-1 w-full pt-3 sm:pt-6 pb-16 print:pt-0 print:pb-0">
        <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">

          {/* Desktop Breadcrumb & Action Toolbar */}
          <div className="hidden md:flex items-center justify-between pb-5 mb-6 border-b border-border/60 print:hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link href="/" className="hover:text-[#00AA5B] transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> Beranda
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/transactions" className="hover:text-[#00AA5B] transition-colors">
                Riwayat Transaksi
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 font-mono">#{transaction.invoiceNumber}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransaction(true)}
                disabled={refreshing}
                className="h-8 px-3 rounded-xl text-xs font-bold border-border/80 text-slate-700 hover:text-slate-900 gap-1.5"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#00AA5B]")} />
                <span>Segarkan</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="h-8 px-3 rounded-xl text-xs font-bold border-border/80 text-slate-700 hover:text-slate-900 gap-1.5"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00AA5B]" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadingPdf ? "Memproses..." : "Unduh PDF"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 px-3 rounded-xl text-xs font-bold border-border/80 text-slate-700 hover:text-slate-900 gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </Button>
            </div>
          </div>

          {/* Grid Layout: 2 Kolom untuk Desktop (7:5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-8 items-start">

            {/* ==================== KOLOM KIRI (7 Kolom Desktop) ==================== */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3.5 sm:space-y-5">

              {/* 1. Status Hero Banner Card */}
              <div className={cn(
                "rounded-2xl sm:rounded-3xl border p-4 sm:p-6 shadow-xs relative overflow-hidden transition-all bg-white",
                cfg.bg
              )}>
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                  <div className={cn(
                    "w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-100"
                  )}>
                    {isPaid ? (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-30" />
                        {cfg.icon}
                      </div>
                    ) : cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h1 className={cn("text-base sm:text-xl font-black tracking-tight", cfg.color)}>
                        {cfg.label}
                      </h1>
                      <Badge className={cn("text-[9px] sm:text-[10px] font-bold px-2 py-0.5 border shadow-none shrink-0", cfg.badgeBg)}>
                        {cfg.badgeLabel}
                      </Badge>
                    </div>
                    <p className="text-[11.5px] sm:text-xs text-slate-600 font-medium leading-relaxed">
                      {cfg.desc}
                    </p>
                  </div>
                </div>

                {/* Sub-bar Nomor Invoice & Waktu */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <span className="text-slate-500 font-medium text-[11px] shrink-0">No. Invoice:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs truncate">
                      {transaction.invoiceNumber}
                    </span>
                    <CopyButton text={transaction.invoiceNumber} label="Invoice" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-1 sm:px-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formatDate(transaction.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* 2. Banner Pengiriman Lisensi / Digital Fulfillment (Jika PAID) */}
              {isPaid && (
                <div className="bg-gradient-to-br from-emerald-600 via-[#00AA5B] to-teal-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    {/* Top Header Badge & Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs border border-white/15">
                        <Sparkles className="w-3 h-3 text-emerald-200" /> Lisensi Digital
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/15 text-[10.5px] font-medium text-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Terkirim Otomatis
                      </div>
                    </div>

                    {/* Title & Info */}
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                        <span>Pesanan Telah Diproses & Terkirim!</span>
                        <span className="text-base select-none">🎉</span>
                      </h2>
                      <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed mt-1">
                        Lisensi & file produk telah dikirimkan otomatis oleh layanan{" "}
                        <strong className="underline decoration-white/40 font-bold text-white">
                          {transaction.deliveredBy || "delivery@marketpoint.id"}
                        </strong>{" "}
                        langsung ke alamat email Anda:
                      </p>
                    </div>

                    {/* Email Display Box with Copy */}
                    <div className="bg-white/15 hover:bg-white/20 transition-colors border border-white/25 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white truncate">
                          {transaction.buyerEmail || "email Anda"}
                        </span>
                      </div>
                      {transaction.buyerEmail && (
                        <CopyButton
                          text={transaction.buyerEmail}
                          label="Email"
                          className="text-white hover:text-white hover:bg-white/20 px-2 py-1 text-[11px] border border-white/25"
                        />
                      )}
                    </div>

                    <p className="text-[11px] text-white/80 leading-relaxed">
                      *Silakan periksa folder <strong>Kotak Masuk (Inbox)</strong> atau <strong>Spam/Promosi</strong> pada akun email (Gmail, dsb) Anda.
                    </p>
                  </div>
                </div>
              )}

              {/* 2b. Kartu Data Lisensi & Serial Key Produk */}
              {isPaid && (transaction.licenseKey || (transaction.licenseKeys && transaction.licenseKeys.length > 0)) && (
                <Card className="rounded-2xl sm:rounded-3xl border border-emerald-200 shadow-sm bg-gradient-to-b from-emerald-50/70 to-white overflow-hidden">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-emerald-100/90 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#00AA5B]" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                        Data Lisensi & Serial Key Produk
                      </h2>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold shadow-none">
                      Siap Digunakan
                    </Badge>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Berikut data lisensi resmi untuk aktivasi produk digital Anda:
                    </p>

                    <div className="space-y-2">
                      {(transaction.licenseKeys && transaction.licenseKeys.length > 0
                        ? transaction.licenseKeys
                        : (transaction.licenseKey ? transaction.licenseKey.split("\n").filter(Boolean) : [])
                      ).map((key, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-emerald-700 block tracking-wide">
                              Kunci Lisensi {transaction.licenseKeys && transaction.licenseKeys.length > 1 ? `#${idx + 1}` : ""}
                            </span>
                            <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 tracking-wider break-all select-all">
                              {key}
                            </p>
                          </div>
                          <CopyButton
                            text={key}
                            label="Lisensi"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs px-2.5 py-1"
                          />
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      *Data lisensi ini juga tercantum resmi di dalam dokumen PDF bukti transaksi yang dapat Anda unduh.
                    </p>
                  </div>
                </Card>
              )}

              {/* 3. Detail Produk yang Dibeli */}
              <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#00AA5B]" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                      Item Produk Digital
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-slate-200">
                    1 Item Pesanan
                  </Badge>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
                    {transaction.productImage ? (
                      <img
                        src={transaction.productImage}
                        alt={transaction.productTitle}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200/80 shadow-xs shrink-0 bg-slate-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-[#00AA5B]">
                        <Package className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {transaction.productTitle}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        {transaction.variant && (
                          <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-700 border-none px-2 py-0.5">
                            <Tag className="w-3 h-3 mr-1 text-slate-500" />
                            Varian: {transaction.variant}
                          </Badge>
                        )}
                        <span className="font-medium text-slate-500 text-[11px] sm:text-xs">
                          Jumlah: <strong className="text-slate-800 font-bold">{transaction.quantity}x</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-500 text-[11px] sm:text-xs">
                          Harga Satuan: <strong className="text-slate-800 font-bold">{formatRupiah(transaction.unitPrice)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto flex sm:block items-center justify-between">
                      <p className="text-[11px] text-muted-foreground font-medium sm:block hidden">Subtotal</p>
                      <span className="text-[11px] text-muted-foreground font-medium sm:hidden">Total Item</span>
                      <p className="text-base sm:text-lg font-black text-slate-900">
                        {formatRupiah(transaction.itemsSubtotal || transaction.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. Informasi Pembeli & Kontak Pengiriman */}
              <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00AA5B]" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                      Informasi Pembeli & Kontak
                    </h2>
                  </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Nama Penerima
                    </span>
                    <p className="font-bold text-slate-800 text-sm">
                      {transaction.buyerName || "Pelanggan Terdaftar"}
                    </p>
                  </div>

                  <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Pengiriman
                    </span>
                    <p className="font-bold text-slate-800 text-sm truncate font-mono">
                      {transaction.buyerEmail || "-"}
                    </p>
                  </div>

                  {transaction.licenseKey && (
                    <div className="bg-emerald-50/70 rounded-2xl p-3.5 sm:p-4 border border-emerald-200/80 space-y-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> Data Lisensi / Akun Digital
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold shadow-none">
                          Siap Digunakan
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="font-mono font-bold text-slate-900 text-sm sm:text-base break-all">
                          {transaction.licenseKey}
                        </p>
                        <CopyButton
                          text={transaction.licenseKey}
                          label="Lisensi"
                          className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shrink-0 text-xs px-2.5 py-1"
                        />
                      </div>
                    </div>
                  )}

                  {transaction.buyerPhone && (
                    <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp / No. HP
                      </span>
                      <p className="font-bold text-slate-800 text-sm font-mono">
                        {transaction.buyerPhone}
                      </p>
                    </div>
                  )}

                  {transaction.notes && (
                    <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-4 border border-slate-100 space-y-1 sm:col-span-2">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Catatan Pesanan
                      </span>
                      <p className="text-slate-700 italic">
                        "{transaction.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* 5. Jaminan Keamanan Transaksi MarketPoint */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3.5 sm:p-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">100% Transaksi Aman & Terlindungi</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sistem otomatisasi MarketPoint menjamin pengiriman lisensi digital secara instan dan aman melalui enkripsi standar industri.
                  </p>
                </div>
              </div>

            </div>

            {/* ==================== KOLOM KANAN (5 Kolom Desktop - Sticky) ==================== */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 sm:space-y-5 lg:sticky lg:top-24">

              {/* 1. Ringkasan Pembayaran (Receipt Card) */}
              <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#00AA5B]" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                      Rincian Pembayaran
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                    IDR
                  </Badge>
                </div>

                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal Produk</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(transaction.itemsSubtotal || transaction.totalAmount)}
                    </span>
                  </div>

                  {Number(transaction.discount || 0) > 0 && (
                    <div className="flex justify-between items-center text-rose-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Diskon{transaction.voucherCode ? ` (${transaction.voucherCode})` : ""}
                      </span>
                      <span className="font-bold">- {formatRupiah(transaction.discount)}</span>
                    </div>
                  )}

                  {Number(transaction.paymentFee || 0) > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Biaya Layanan Pembayaran</span>
                      <span className="font-bold text-slate-800">+ {formatRupiah(transaction.paymentFee)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <div>
                      <p className="font-black text-slate-900 text-sm">Total Tagihan</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Sudah termasuk PPN</p>
                    </div>
                    <span className="text-xl font-black text-[#00AA5B] tracking-tight">
                      {formatRupiah(transaction.totalAmount)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 2. Kartu Metode Pembayaran */}
              <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#00AA5B]" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                      Metode Pembayaran
                    </h2>
                  </div>
                </div>

                <div className="p-4 sm:p-5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Kanal Pembayaran</span>
                    <Badge variant="outline" className="font-bold text-slate-800 bg-slate-50 border-slate-200 text-xs px-2.5 py-0.5">
                      {transaction.paymentMethodName || transaction.paymentMethod?.toUpperCase() || "QRIS"}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* 3. Log Waktu & Riwayat */}
              <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                      Log Waktu
                    </h2>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Waktu Dibuat</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Terakhir Diperbarui</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formatDate(transaction.updatedAt)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 4. Tombol Aksi Cepat */}
              <div className="space-y-2 pt-1 print:hidden">
                <Button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full h-11 rounded-2xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-md shadow-emerald-200/60 gap-2 disabled:opacity-75"
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{downloadingPdf ? "Menyiapkan Dokumen PDF..." : "Unduh Bukti Transaksi (PDF)"}</span>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 rounded-2xl font-bold text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 gap-2"
                >
                  <Link href="/transactions">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Lihat Semua Transaksi Saya</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full h-10 rounded-2xl font-semibold text-xs text-muted-foreground hover:text-slate-900 gap-1.5"
                >
                  <Link href="/">
                    <Home className="w-3.5 h-3.5" />
                    <span>Kembali ke Halaman Utama</span>
                  </Link>
                </Button>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* 4. Footer Desktop */}
      <div className="hidden md:block print:hidden">
        <MarketFooter />
      </div>
    </div>
  );
}
