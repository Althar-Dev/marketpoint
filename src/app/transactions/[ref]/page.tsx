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
  Star,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { generateTransactionPdf } from "@/lib/pdf-invoice";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

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
    desc: "Transaksi telah berhasil diselesaikan secara penuh di MarketPointID.",
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
  const { user } = useUser();
  const db = useFirestore();
  const ref = params?.ref as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Firestore user data (for real photoURL & profile)
  const userDocRef = useMemoFirebase(() => {
    const targetUid = user?.uid || (transaction as any)?.userId;
    if (!targetUid || !db) return null;
    return doc(db, "users", targetUid);
  }, [db, user?.uid, (transaction as any)?.userId]);
  const { data: userData } = useDoc(userDocRef);

  // State Ulasan / Rating
  const [existingReview, setExistingReview] = useState<any>(null);
  const [checkingReview, setCheckingReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // State Dispute
  const [existingDispute, setExistingDispute] = useState<any>(null);
  const [checkingDispute, setCheckingDispute] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>("not_received");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeEvidenceUrls, setDisputeEvidenceUrls] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchReview = async (invoiceNum: string) => {
    try {
      setCheckingReview(true);
      const res = await fetch(`/api/reviews?transactionId=${encodeURIComponent(invoiceNum)}`);
      const data = await res.json();
      if (data.success && data.review) {
        setExistingReview(data.review);
      }
    } catch (err) {
      console.warn("Gagal memuat ulasan transaksi:", err);
    } finally {
      setCheckingReview(false);
    }
  };

  const fetchDispute = async (txId: string) => {
    try {
      setCheckingDispute(true);
      const res = await fetch(`/api/disputes?transactionId=${encodeURIComponent(txId)}`);
      const data = await res.json();
      if (data.success && data.dispute) {
        setExistingDispute(data.dispute);
      }
    } catch (err) {
      console.warn("Gagal memuat dispute:", err);
    } finally {
      setCheckingDispute(false);
    }
  };

  // Auto-sync real photoURL from Firestore to existing review in database if previously duck or mismatched
  useEffect(() => {
    if (!existingReview || existingReview.isAnonymous || !userData?.photoURL) return;
    const currentAvatar = existingReview.userAvatar;
    if (userData.photoURL && (!currentAvatar || currentAvatar.includes("duck") || currentAvatar !== userData.photoURL)) {
      fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: existingReview.transactionId || existingReview.invoiceNumber,
          userAvatar: userData.photoURL,
          userName: userData.displayName || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setExistingReview((prev: any) => (prev ? { ...prev, userAvatar: userData.photoURL } : prev));
          }
        })
        .catch(() => {});
    }
  }, [existingReview?.id, userData?.photoURL, existingReview?.userAvatar, existingReview?.isAnonymous]);

  const fetchTransaction = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Transaksi tidak ditemukan.");
      setTransaction(data.transaction);
      if (data.transaction.status === "PAID" || data.transaction.status === "SETTLED") {
        fetchReview(data.transaction.invoiceNumber || data.transaction.id);
        fetchDispute(data.transaction.id || data.transaction.invoiceNumber);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail transaksi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!transaction) return;
    try {
      setSubmittingReview(true);

      const rawAvatar = userData?.photoURL || user?.photoURL || null;
      // Do not use duck avatar fallback
      const realAvatar = isAnonymous ? null : rawAvatar;
      const realUserName = isAnonymous
        ? null
        : (userData?.displayName || userData?.name || user?.displayName || transaction.buyerName || "Pembeli MarketPointID");

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id || transaction.invoiceNumber,
          invoiceNumber: transaction.invoiceNumber,
          productId: transaction.productId || "general",
          productName: transaction.productTitle,
          shopId: (transaction as any).shopId || "",
          userId: user?.uid || (transaction as any).userId || transaction.buyerEmail || "buyer",
          userName: realUserName,
          userAvatar: realAvatar,
          rating: selectedRating,
          comment: reviewComment,
          isAnonymous: isAnonymous,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menyimpan ulasan.");
      }
      setExistingReview(data.review);
      setIsReviewModalOpen(false);
      toast({
        title: "Ulasan Berhasil Disimpan",
        description: "Terima kasih telah memberikan ulasan dan rating di MarketPointID!",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Mengirim Ulasan",
        description: err.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
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
        title: `Invoice #${transaction.invoiceNumber} - MarketPointID`,
        text: `Detail Transaksi ${transaction.invoiceNumber} di MarketPointID`,
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
                  <Home className="w-4 h-4 mr-2" /> Ke Beranda MarketPointID
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
                        <Sparkles className="w-4 h-4 text-emerald-200" />
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
                        Data Produk
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

              {/* 4. Beri Nilai / Ulasan Produk (Hanya jika PAID/SETTLED) */}
              {isPaid && (
                <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden transition-all">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#FFC400] fill-[#FFC400]" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                        {existingReview ? "Ulasan & Nilai Anda" : "Beri Nilai & Ulasan Produk"}
                      </h2>
                    </div>
                    {existingReview ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold shadow-none">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Sudah Dinilai
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50">
                        Menunggu Ulasan
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    {checkingReview ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00AA5B]" />
                        <span>Memeriksa status ulasan di database...</span>
                      </div>
                    ) : existingReview ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  star <= Number(existingReview.rating)
                                    ? "text-[#FFC400] fill-[#FFC400]"
                                    : "text-slate-200 fill-slate-100"
                                )}
                              />
                            ))}
                            <span className="text-xs font-black text-slate-800 ml-1.5">
                              {existingReview.rating}.0 / 5.0
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {formatDate(existingReview.createdAt)}
                          </span>
                        </div>

                        {existingReview.comment ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed italic">
                            "{existingReview.comment}"
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Anda memberikan penilaian {existingReview.rating} bintang tanpa ulasan teks.
                          </p>
                        )}

                        {existingReview.sellerReply && (
                          <div className="ml-3 pl-3 border-l-2 border-[#00AA5B] space-y-1 text-xs">
                            <span className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wider">
                              Balasan Penjual:
                            </span>
                            <p className="text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60 leading-relaxed">
                              {existingReview.sellerReply}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
                            {existingReview.isAnonymous ? "Ulasan anonim (nama disamarkan)" : "Ulasan publik terverifikasi"}
                          </span>
                          <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            Terverifikasi
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 via-emerald-50/40 to-slate-50 p-3.5 sm:p-4 rounded-2xl border border-amber-200/60">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">
                            Bagaimana Kualitas Produk & Layanan?
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed max-w-md">
                            Bantu pembeli lain dan toko penjual dengan memberikan nilai bintang dan ulasan pengalaman belanja Anda.
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsReviewModalOpen(true)}
                          className="bg-[#00AA5B] hover:bg-[#00924e] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs shrink-0 gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Beri Nilai</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 5. Dispute / Komplain Card */}
              {isPaid && (
                <Card className="rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden transition-all">
                  <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500" />
                      <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                        {existingDispute ? "Status Sengketa" : "Ajukan Sengketa"}
                      </h2>
                    </div>
                    {existingDispute ? (
                      <Badge
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 border shadow-none",
                          existingDispute.status === "OPEN"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : existingDispute.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : existingDispute.status === "REJECTED"
                            ? "bg-slate-100 text-slate-600 border-slate-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        )}
                      >
                        {existingDispute.status === "OPEN" && "Menunggu Respon"}
                        {existingDispute.status === "SELLER_RESPONDED" && "Direspon Penjual"}
                        {existingDispute.status === "ADMIN_REVIEW" && "Ditinjau Admin"}
                        {existingDispute.status === "RESOLVED" && "Selesai"}
                        {existingDispute.status === "REJECTED" && "Ditolak"}
                        {existingDispute.status === "CANCELLED" && "Dibatalkan"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                        Belum Ada
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    {checkingDispute ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                        <span>Memeriksa status sengketa...</span>
                      </div>
                    ) : existingDispute ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100">
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">
                            {{
                              not_received: "Produk tidak diterima",
                              not_as_described: "Tidak sesuai deskripsi",
                              invalid_license: "Lisensi tidak valid",
                              corrupted_file: "File rusak / tidak lengkap",
                              wrong_item: "Item salah",
                              refund_request: "Permintaan refund",
                              other: "Alasan lainnya",
                            }[existingDispute.reason as string] || existingDispute.reason}
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {existingDispute.description}
                          </p>
                        </div>

                        {existingDispute.sellerResponse && (
                          <div className="ml-3 pl-3 border-l-2 border-blue-400 space-y-1 text-xs">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              Respons Penjual:
                            </span>
                            <p className="text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60 leading-relaxed">
                              {existingDispute.sellerResponse}
                            </p>
                          </div>
                        )}

                        {existingDispute.adminNote && (
                          <div className="ml-3 pl-3 border-l-2 border-purple-400 space-y-1 text-xs">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                              Catatan Admin:
                            </span>
                            <p className="text-slate-600 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/60 leading-relaxed">
                              {existingDispute.adminNote}
                            </p>
                          </div>
                        )}

                        {existingDispute.resolution && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                            <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                            <span className="font-bold text-slate-700">
                              Resolusi:{" "}
                              {existingDispute.resolution === "refund_buyer"
                                ? "Refund ke Anda"
                                : existingDispute.resolution === "release_seller"
                                ? "Dana ke Penjual"
                                : "Refund Parsial"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
                            Sengketa #ID: {existingDispute.id}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-50/60 to-slate-50 p-3.5 sm:p-4 rounded-2xl border border-orange-200/60">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">
                            Ada Masalah dengan Pesanan Ini?
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed max-w-md">
                            Jika produk tidak sesuai, lisensi tidak valid, atau ada masalah lain — ajukan sengketa untuk mendapatkan bantuan tim admin MarketPointID.
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsDisputeModalOpen(true)}
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50 font-bold text-xs h-9 px-4 rounded-xl shadow-xs shrink-0 gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Ajukan Sengketa</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 6. Jaminan Keamanan Transaksi MarketPointID */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3.5 sm:p-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">100% Transaksi Aman & Terlindungi</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sistem otomatisasi MarketPointID menjamin pengiriman lisensi digital secara instan dan aman melalui enkripsi standar industri.
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

      {/* 5. Modal / Dialog Beri Nilai */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FFC400] fill-[#FFC400]" />
              <span>Beri Nilai & Ulasan Produk</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Ringkasan Produk */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              {transaction.productImage ? (
                <img
                  src={transaction.productImage}
                  alt={transaction.productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center font-bold text-sm shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {transaction.productTitle}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  Invoice: #{transaction.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Pilihan Bintang Interaktif */}
            <div className="space-y-2 text-center py-2">
              <p className="text-xs font-bold text-slate-700">Pilih Penilaian Bintang</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating !== null ? hoverRating : selectedRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 focus:outline-hidden"
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 transition-colors",
                          isFilled
                            ? "text-[#FFC400] fill-[#FFC400]"
                            : "text-slate-200 fill-slate-100"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#00AA5B]">
                <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                <span>
                  {selectedRating === 5 && "5 Bintang: Sangat Puas & Rekomendasi"}
                  {selectedRating === 4 && "4 Bintang: Puas / Bagus"}
                  {selectedRating === 3 && "3 Bintang: Cukup Baik"}
                  {selectedRating === 2 && "2 Bintang: Kurang Puas"}
                  {selectedRating === 1 && "1 Bintang: Sangat Kecewa"}
                </span>
              </div>
            </div>

            {/* Textarea Ulasan */}
            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-xs font-bold text-slate-700">
                Ulasan Anda (Opsional)
              </label>
              <Textarea
                id="review-comment"
                placeholder="Ceritakan pengalaman Anda mengenai kecepatan pengiriman lisensi, kesesuaian produk, atau respon penjual..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="text-xs rounded-xl resize-none border-slate-200 focus-visible:ring-[#00AA5B]"
              />
            </div>

            {/* Checkbox Anonim */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="anonymous-review"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
              />
              <label
                htmlFor="anonymous-review"
                className="text-xs text-slate-600 font-medium cursor-pointer select-none leading-none"
              >
                Samarkan nama saya di ulasan publik (Anonim)
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={submittingReview}
              className="text-xs font-bold rounded-xl h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs font-bold rounded-xl h-9 gap-1.5"
            >
              {submittingReview ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kirim Ulasan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dispute Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <span>Ajukan Sengketa</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invoice #{transaction?.invoiceNumber} · {transaction?.productTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Info box */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Sengketa akan diproses oleh tim admin MarketPointID dalam 1×24 jam kerja. Pastikan Anda sudah mencoba menghubungi penjual terlebih dahulu.
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Sengketa <span className="text-red-500">*</span>
              </label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger className="h-9 rounded-xl border-slate-200 text-xs font-bold focus:ring-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="not_received" className="text-xs font-bold">Produk tidak diterima</SelectItem>
                  <SelectItem value="not_as_described" className="text-xs font-bold">Tidak sesuai deskripsi</SelectItem>
                  <SelectItem value="invalid_license" className="text-xs font-bold">Lisensi / kunci tidak valid</SelectItem>
                  <SelectItem value="corrupted_file" className="text-xs font-bold">File rusak / tidak lengkap</SelectItem>
                  <SelectItem value="wrong_item" className="text-xs font-bold">Item salah / berbeda</SelectItem>
                  <SelectItem value="refund_request" className="text-xs font-bold">Permintaan pengembalian dana</SelectItem>
                  <SelectItem value="other" className="text-xs font-bold">Alasan lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Deskripsi Masalah <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Jelaskan masalah yang Anda alami secara detail. Sertakan langkah-langkah yang sudah Anda coba..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={4}
                className="text-xs rounded-xl resize-none border-slate-200 focus-visible:ring-orange-400"
              />
              <p className="text-[10px] text-muted-foreground">
                {disputeDescription.length}/1000 karakter
              </p>
            </div>

            {/* Evidence URLs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                URL Bukti Screenshot (opsional)
              </label>
              <Input
                placeholder="https://drive.google.com/... (pisahkan dengan koma jika lebih dari 1)"
                value={disputeEvidenceUrls}
                onChange={(e) => setDisputeEvidenceUrls(e.target.value)}
                className="h-9 text-xs rounded-xl border-slate-200 focus-visible:ring-orange-400"
              />
              <p className="text-[10px] text-muted-foreground">
                Upload screenshot ke Google Drive / Imgur lalu tempelkan linknya di sini.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisputeModalOpen(false)}
              disabled={submittingDispute}
              className="text-xs font-bold rounded-xl h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!transaction || !disputeDescription.trim()) return;
                setSubmittingDispute(true);
                try {
                  const evidenceArr = disputeEvidenceUrls
                    .split(",")
                    .map((u) => u.trim())
                    .filter(Boolean);
                  const res = await fetch("/api/disputes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      transactionId: transaction.id,
                      invoiceNumber: transaction.invoiceNumber,
                      buyerId: user?.uid || (transaction as any).userId || "",
                      buyerName: userData?.displayName || user?.displayName || transaction.buyerName || "Pembeli",
                      buyerEmail: transaction.buyerEmail || user?.email || "",
                      sellerId: (transaction as any).shopId || "",
                      sellerName: undefined,
                      productTitle: transaction.productTitle,
                      productImage: transaction.productImage,
                      totalAmount: transaction.totalAmount,
                      reason: disputeReason,
                      description: disputeDescription.trim(),
                      evidenceUrls: evidenceArr,
                    }),
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.error || "Gagal mengajukan sengketa");
                  setExistingDispute(data.dispute);
                  setIsDisputeModalOpen(false);
                  toast({
                    title: "Sengketa Berhasil Diajukan",
                    description: `ID Sengketa: ${data.dispute.id}. Tim admin akan meninjau dalam 1×24 jam kerja.`,
                  });
                } catch (err: any) {
                  toast({
                    title: "Gagal Mengajukan Sengketa",
                    description: err.message || "Terjadi kesalahan.",
                    variant: "destructive",
                  });
                } finally {
                  setSubmittingDispute(false);
                }
              }}
              disabled={submittingDispute || !disputeDescription.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl h-9 gap-1.5"
            >
              {submittingDispute ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengajukan...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Sengketa</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
