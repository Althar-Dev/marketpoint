"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
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
  ChevronLeft,
  Share2,
  Download,
  KeyRound,
  Star,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { generateTransactionPdf } from "@/lib/pdf-invoice";
import { cn, cleanProductTitle, cleanPaymentMethodName, getPaymentLogo } from "@/lib/utils";
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
  { label: string; badgeLabel: string; color: string; badgeCls: string; icon: React.ReactNode; desc: string }
> = {
  PAID: {
    label: "Pembayaran Berhasil",
    badgeLabel: "Berhasil",
    color: "text-emerald-700",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    desc: "Pembayaran Anda telah diverifikasi dan transaksi telah selesai.",
  },
  SETTLED: {
    label: "Lunas & Selesai",
    badgeLabel: "Berhasil",
    color: "text-emerald-700",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    desc: "Transaksi telah berhasil diselesaikan secara penuh.",
  },
  PENDING: {
    label: "Menunggu Pembayaran",
    badgeLabel: "Menunggu Bayar",
    color: "text-amber-700",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-5 h-5 text-amber-600" />,
    desc: "Silakan selesaikan pembayaran sebelum batas waktu berakhir.",
  },
  EXPIRED: {
    label: "Tagihan Kedaluwarsa",
    badgeLabel: "Kedaluwarsa",
    color: "text-slate-600",
    badgeCls: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <AlertCircle className="w-5 h-5 text-slate-500" />,
    desc: "Batas waktu pembayaran telah habis.",
  },
  CANCELLED: {
    label: "Transaksi Dibatalkan",
    badgeLabel: "Dibatalkan",
    color: "text-rose-700",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="w-5 h-5 text-rose-600" />,
    desc: "Transaksi pembayaran ini telah dibatalkan.",
  },
  FAILED: {
    label: "Pembayaran Gagal",
    badgeLabel: "Gagal",
    color: "text-rose-700",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="w-5 h-5 text-rose-600" />,
    desc: "Pembayaran tidak dapat diproses oleh penyedia layanan.",
  },
};

function formatRupiah(amount: number) {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
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
      title: "Disalin",
      description: `${label} berhasil disalin.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs font-semibold shrink-0 cursor-pointer",
        className
      )}
      title={`Salin ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-600 text-[11px] font-bold">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 opacity-70" />
          <span className="text-[11px]">Salin</span>
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

      const rawAvatar = (!isAnonymous && userData?.photoURL && !userData.photoURL.includes("duck")) ? userData.photoURL : (user?.photoURL && !user.photoURL.includes("duck") ? user.photoURL : null);
      const realAvatar = isAnonymous ? null : rawAvatar;
      const realUserName = isAnonymous
        ? null
        : (transaction.buyerName || userData?.displayName || userData?.name || user?.displayName || "Pembeli MarketPointID");

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id || transaction.invoiceNumber,
          invoiceNumber: transaction.invoiceNumber,
          productId: transaction.productId || "general",
          productName: transaction.productTitle,
          shopId: (transaction as any).shopId || "",
          userId: transaction.buyerEmail || (transaction as any).userId || user?.email || user?.uid || "buyer",
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

  const handleSubmitDispute = async () => {
    if (!transaction) return;
    if (!disputeDescription.trim()) {
      toast({
        title: "Deskripsi Wajib Diisi",
        description: "Mohon jelaskan kendala yang Anda alami secara detail.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmittingDispute(true);
      const evidenceList = disputeEvidenceUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id || transaction.invoiceNumber,
          invoiceNumber: transaction.invoiceNumber,
          reason: disputeReason,
          description: disputeDescription,
          evidenceUrls: evidenceList,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal mengajukan sengketa.");
      }
      setExistingDispute(data.dispute);
      setIsDisputeModalOpen(false);
      toast({
        title: "Komplain Diajukan",
        description: "Laporan Anda telah diteruskan ke tim penanganan sengketa.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Mengajukan Komplain",
        description: err.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDispute(false);
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

  // Penentuan Jenis Transaksi: ISI SALDO (TOP UP) vs BELANJA PRODUK
  const isTopUpRef = Boolean(
    ref && (ref.toLowerCase().startsWith("topup") || ref.toLowerCase().includes("topup"))
  );

  const isTopUp = Boolean(
    (transaction?.productTitle && transaction.productTitle.toLowerCase().includes("top up")) ||
    (transaction?.invoiceNumber && transaction.invoiceNumber.startsWith("TOPUP-")) ||
    (transaction?.paymentCategory === "TOPUP") ||
    isTopUpRef
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col print:bg-white">
        {/* Header Desktop */}
        <div className="hidden md:block print:hidden">
          <MarketHeader />
        </div>

        {/* Header Mobile Nav */}
        <header className="sticky top-0 z-40 md:hidden bg-white border-b border-slate-200/80 px-3.5 h-12 flex items-center justify-between shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-7 h-7 rounded-lg" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <div className="flex-1 w-full pt-3 sm:pt-6 pb-16">
          <main className="max-w-5xl mx-auto px-3.5 sm:px-6">
            {/* Desktop Toolbar Skeleton */}
            <div className="hidden md:flex items-center justify-between pb-4 mb-5 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded" />
                <span className="text-slate-300">/</span>
                <Skeleton className="h-4 w-28 rounded" />
                <span className="text-slate-300">/</span>
                <Skeleton className="h-4 w-36 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>

            {/* SKELETON 1: KHUSUS ISI SALDO (TOP UP) */}
            {isTopUpRef ? (
              <div className="max-w-lg mx-auto">
                <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                  {/* Hero Status Skeleton */}
                  <div className="p-6 text-center border-b border-slate-100 space-y-3">
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                    <Skeleton className="w-28 h-5 rounded-full mx-auto" />
                    <Skeleton className="w-44 h-8 rounded-md mx-auto" />
                    <Skeleton className="w-64 h-3.5 rounded mx-auto" />
                  </div>

                  {/* Rincian Transaksi Key-Value Skeleton */}
                  <div className="p-5 sm:p-6 space-y-3.5">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-3.5 w-32 rounded" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-3.5 w-36 rounded" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-3.5 w-24 rounded" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-3.5 w-16 rounded" />
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-6 w-28 rounded" />
                    </div>
                  </div>

                  {/* Footer Action Skeletons */}
                  <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-2.5">
                    <Skeleton className="w-full h-10 rounded-lg" />
                    <Skeleton className="w-full h-10 rounded-lg" />
                    <Skeleton className="w-36 h-3 rounded mx-auto" />
                  </div>
                </Card>
              </div>
            ) : (
              /* SKELETON 2: KHUSUS BELANJA PRODUK */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                {/* Kolom Kiri */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  {/* Status Hero Card Skeleton */}
                  <Card className="rounded-xl border border-slate-200/80 p-4 sm:p-5 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-36 rounded" />
                          <Skeleton className="h-4 w-16 rounded-md" />
                        </div>
                        <Skeleton className="h-3 w-3/4 rounded" />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Skeleton className="h-3.5 w-44 rounded" />
                      <Skeleton className="h-3.5 w-32 rounded" />
                    </div>
                  </Card>

                  {/* Item Card Skeleton */}
                  <Card className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3.5 w-16 rounded" />
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-3.5">
                        <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-4/5 rounded" />
                          <Skeleton className="h-3.5 w-1/3 rounded" />
                        </div>
                        <Skeleton className="h-5 w-20 rounded hidden sm:block" />
                      </div>
                    </div>
                  </Card>

                  {/* Buyer Info Card Skeleton */}
                  <Card className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <Skeleton className="h-4 w-36 rounded" />
                    </div>
                    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-1.5">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-4 w-32 rounded" />
                      </div>
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-1.5">
                        <Skeleton className="h-3 w-24 rounded" />
                        <Skeleton className="h-4 w-40 rounded" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Kolom Kanan (Summary) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  <Card className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <Skeleton className="h-4 w-40 rounded" />
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3.5 w-32 rounded" />
                        <Skeleton className="h-3.5 w-20 rounded" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-3.5 w-16 rounded" />
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-5 w-24 rounded" />
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </Card>

                  {/* Button Skeletons */}
                  <div className="space-y-2">
                    <Skeleton className="w-full h-10 rounded-lg" />
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </div>
                </div>
              </div>
            )}
          </main>
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
          <Card className="max-w-md w-full p-6 text-center rounded-xl border border-slate-200/80 shadow-xs bg-white">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-3 border border-rose-100">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Transaksi Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              {error || "Nomor referensi tidak valid atau data transaksi belum tercatat di sistem."}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="h-9 rounded-lg bg-[#00AA5B] hover:bg-[#00924e] text-white font-semibold text-xs">
                <Link href="/transactions">
                  <History className="w-4 h-4 mr-2" /> Lihat Riwayat Transaksi
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-lg font-semibold text-xs border-slate-200">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" /> Ke Beranda
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col print:bg-white print:p-0">
      {/* 1. Header Desktop Nav */}
      <div className="hidden md:block print:hidden">
        <MarketHeader />
      </div>

      {/* 2. Header Mobile Nav */}
      <header className="sticky top-0 z-40 md:hidden bg-white border-b border-slate-200/80 px-3.5 h-12 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-slate-900 truncate">
            {isTopUp ? "Detail Isi Saldo" : "Detail Transaksi"}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => fetchTransaction(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            title="Segarkan data"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-[#00AA5B]")} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Bagikan bukti"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Container Desktop & Mobile */}
      <div className="flex-1 w-full pt-3 sm:pt-6 pb-16 print:pt-0 print:pb-0">
        <main className="max-w-5xl mx-auto px-3.5 sm:px-6">

          {/* Desktop Breadcrumb & Action Toolbar */}
          <div className="hidden md:flex items-center justify-between pb-4 mb-5 border-b border-slate-200/70 print:hidden">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/" className="hover:text-[#00AA5B] transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> Beranda
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/transactions" className="hover:text-[#00AA5B] transition-colors">
                Riwayat Transaksi
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800 font-mono">
                {isTopUp ? "Isi Saldo" : `#${transaction.invoiceNumber}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTransaction(true)}
                disabled={refreshing}
                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:text-slate-900 gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-[#00AA5B]")} />
                <span>Segarkan</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:text-slate-900 gap-1.5 cursor-pointer"
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
                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:text-slate-900 gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAMPILAN 1: KHUSUS TRANSAKSI ISI SALDO (TOP UP)                           */}
          {/* Didesain bersih, elegan, dan profesional layaknya struk mutasi banking    */}
          {/* ========================================================================= */}
          {isTopUp ? (
            <div className="max-w-lg mx-auto">
              <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                {/* Hero Status Transaksi Saldo */}
                <div className="p-6 text-center border-b border-slate-100">
                  <div className="flex items-center justify-center mb-3">
                    {isPaid ? (
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00AA5B] border border-emerald-200/70 flex items-center justify-center shadow-2xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : status === "PENDING" ? (
                      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shadow-2xs">
                        <Clock className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shadow-2xs">
                        <XCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-1.5 bg-slate-50 border-slate-200/80">
                    <span className={cn("inline-flex items-center gap-1", cfg.color)}>
                      {isPaid && <CheckCircle2 className="w-3 h-3 text-[#00AA5B]" />}
                      {status === "PENDING" && <Clock className="w-3 h-3 text-amber-600" />}
                      {!isPaid && status !== "PENDING" && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>{isPaid ? "Top Up Berhasil" : cfg.badgeLabel}</span>
                    </span>
                  </div>

                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 mb-1">
                    {formatRupiah(transaction.totalAmount)}
                  </p>

                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {isPaid
                      ? "Saldo telah berhasil ditambahkan ke saldo dompet akun Anda."
                      : status === "PENDING"
                        ? "Silakan selesaikan pembayaran sesuai metode yang Anda pilih."
                        : "Transaksi pengisian saldo tidak dapat diproses atau telah dibatalkan."}
                  </p>
                </div>

                {/* Nomor Rekening / VA / Kode Bayar (Jika Status PENDING) */}
                {status === "PENDING" && transaction.paymentCode && (
                  <div className="mx-5 my-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center space-y-1">
                    <p className="text-xs text-amber-800 font-semibold">Nomor Rekening / Kode Bayar</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                        {transaction.paymentCode}
                      </span>
                      <CopyButton text={transaction.paymentCode} label="Kode Bayar" />
                    </div>
                  </div>
                )}

                {/* Rincian Transaksi Key-Value List */}
                <div className="p-5 sm:p-6 space-y-3.5 text-xs">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Rincian Transaksi
                  </h3>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Nomor Referensi</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-800">{transaction.invoiceNumber}</span>
                      <CopyButton text={transaction.invoiceNumber} label="Invoice" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Waktu Transaksi</span>
                    <span className="font-medium text-slate-800">{formatDate(transaction.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Jenis Transaksi</span>
                    <span className="font-semibold text-slate-800">Top Up Saldo</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                    <div className="flex items-center justify-end">
                      {getPaymentLogo(transaction.paymentMethodName || transaction.paymentMethod) ? (
                        <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getPaymentLogo(transaction.paymentMethodName || transaction.paymentMethod)}
                            alt={cleanPaymentMethodName(transaction.paymentMethodName || transaction.paymentMethod)}
                            className="h-3.5 w-auto object-contain max-w-[70px]"
                          />
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {cleanPaymentMethodName(transaction.paymentMethodName || transaction.paymentMethod)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Nominal Saldo</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(transaction.itemsSubtotal || transaction.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Biaya Layanan</span>
                    <span className="font-semibold text-slate-800">
                      {transaction.paymentFee > 0 ? formatRupiah(transaction.paymentFee) : "Rp 0 (Gratis)"}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900">Total Pembayaran</span>
                    <span className="font-black text-slate-900 text-base">
                      {formatRupiah(transaction.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-2.5 print:hidden">
                  <Button
                    asChild
                    className="w-full h-10 rounded-lg bg-[#00AA5B] hover:bg-[#00924e] text-white font-bold text-xs shadow-xs"
                  >
                    <Link href="/wallet">
                      <Wallet className="w-4 h-4 mr-2" /> Lihat Saldo Saya
                    </Link>
                  </Button>

                  <Button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    variant="outline"
                    className="w-full h-10 rounded-lg font-semibold text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#00AA5B]" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    <span>{downloadingPdf ? "Memproses PDF..." : "Unduh Bukti Transaksi"}</span>
                  </Button>

                  <div className="text-center pt-1">
                    <Link
                      href="/transactions"
                      className="text-xs font-semibold text-slate-500 hover:text-[#00AA5B] transition-colors"
                    >
                      Kembali ke Riwayat Transaksi
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAMPILAN 2: KHUSUS TRANSAKSI BELANJA PRODUK                               */
            /* Rapi, profesional, terstruktur 2-kolom desktop tanpa elemen norak         */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

              {/* ========== KOLOM KIRI (Main Content) ========== */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">

                {/* 1. Status Transaksi Bar */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900">
                            {cfg.label}
                          </h2>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", cfg.badgeCls)}>
                            {cfg.badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {cfg.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-500 font-medium text-[11px] shrink-0">No. Invoice:</span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate">
                        {transaction.invoiceNumber}
                      </span>
                      <CopyButton text={transaction.invoiceNumber} label="Invoice" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Item Produk yang Dibeli */}
                <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#00AA5B]" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                        Item Produk Digital
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {transaction.quantity} Barang
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      {transaction.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={transaction.productImage}
                          alt={cleanProductTitle(transaction.productTitle)}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-slate-200/80 shrink-0 bg-slate-50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-[#00AA5B]">
                          <Package className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {cleanProductTitle(transaction.productTitle)}
                        </h4>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                          {transaction.variant && (
                            <Badge variant="secondary" className="text-[10px] font-semibold bg-slate-100 text-slate-700 border-none px-2 py-0.5">
                              <Tag className="w-3 h-3 mr-1 text-slate-400" />
                              {transaction.variant}
                            </Badge>
                          )}
                          <span className="font-medium text-slate-600">
                            {transaction.quantity}x @ {formatRupiah(transaction.unitPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto flex sm:block items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium sm:block hidden">Subtotal</span>
                        <span className="text-[11px] text-slate-500 font-medium sm:hidden">Total Item:</span>
                        <p className="text-sm sm:text-base font-bold text-slate-900">
                          {formatRupiah(transaction.itemsSubtotal || transaction.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 3. Lisensi / Akses Produk (Hanya jika Status Berhasil & Ada Lisensi) */}
                {isPaid && (
                  <Card className="rounded-xl border border-emerald-200/80 shadow-2xs bg-white overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#00AA5B]" />
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                          Data Lisensi & Akses Produk
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Siap Digunakan
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Gunakan data lisensi / serial key berikut untuk mengaktifkan produk digital Anda:
                      </p>

                      <div className="space-y-2">
                        {(transaction.licenseKeys && transaction.licenseKeys.length > 0
                          ? transaction.licenseKeys
                          : (transaction.licenseKey ? transaction.licenseKey.split("\n").filter(Boolean) : ["Akses telah diaktifkan ke akun email Anda"])
                        ).map((key, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-2.5"
                          >
                            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 tracking-wide break-all select-all">
                              {key}
                            </span>
                            <CopyButton
                              text={key}
                              label="Lisensi"
                              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        *Data lisensi juga otomatis dikirimkan ke email <strong>{transaction.buyerEmail || "Anda"}</strong> dan tercantum di dokumen PDF.
                      </p>
                    </div>
                  </Card>
                )}

                {/* 4. Informasi Pembeli */}
                <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#00AA5B]" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                        Informasi Pembeli
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">Nama Pembeli</span>
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {transaction.buyerName || "Pelanggan Terdaftar"}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">Email Pengiriman</span>
                      <p className="font-bold text-slate-800 text-xs truncate font-mono">
                        {transaction.buyerEmail || "-"}
                      </p>
                    </div>

                    {transaction.buyerPhone && (
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-0.5">
                        <span className="text-[11px] text-slate-400 font-medium">No. WhatsApp</span>
                        <p className="font-bold text-slate-800 text-xs font-mono">
                          {transaction.buyerPhone}
                        </p>
                      </div>
                    )}

                    {transaction.notes && (
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-0.5 sm:col-span-2">
                        <span className="text-[11px] text-slate-400 font-medium">Catatan Pesanan</span>
                        <p className="font-medium text-slate-700 text-xs leading-relaxed italic">
                          "{transaction.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 5. Ulasan Produk (Hanya jika PAID / SETTLED) */}
                {isPaid && (
                  <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                          Ulasan Produk
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      {checkingReview ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00AA5B]" />
                          <span>Memeriksa status ulasan...</span>
                        </div>
                      ) : existingReview ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-3.5 h-3.5",
                                    star <= Number(existingReview.rating)
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200 fill-slate-100"
                                  )}
                                />
                              ))}
                              <span className="text-xs font-bold text-slate-800 ml-1">
                                {existingReview.rating}.0 / 5.0
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(existingReview.createdAt)}
                            </span>
                          </div>

                          {existingReview.comment && (
                            <p className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed italic">
                              "{existingReview.comment}"
                            </p>
                          )}

                          {existingReview.sellerReply && (
                            <div className="ml-2 pl-3 border-l-2 border-[#00AA5B] space-y-1 text-xs">
                              <span className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wider">
                                Balasan Toko:
                              </span>
                              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg leading-relaxed">
                                {existingReview.sellerReply}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">
                              Bagaimana Kualitas Produk Ini?
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Beri rating & ulasan untuk membantu pembeli lain.
                            </p>
                          </div>
                          <Button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="bg-[#00AA5B] hover:bg-[#00924e] text-white font-bold text-xs h-8 px-3 rounded-lg shadow-2xs shrink-0 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 mr-1 fill-white" />
                            <span>Beri Nilai</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* 6. Kendala Pesanan & Komplain (Sederhana & Bersih) */}
                {isPaid && (
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-500 px-1 print:hidden">
                    <span>Mengalami kendala pada pesanan ini?</span>
                    <button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(true)}
                      className="text-slate-700 hover:text-rose-600 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {existingDispute ? "Lihat Status Komplain" : "Ajukan Komplain"}
                    </button>
                  </div>
                )}

              </div>

              {/* ========== KOLOM KANAN (Ringkasan & Aksi) ========== */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">

                {/* 1. Ringkasan Pembayaran */}
                <Card className="rounded-xl border border-slate-200/80 shadow-2xs bg-white overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#00AA5B]" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                        Ringkasan Pembayaran
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Harga ({transaction.quantity} Barang)</span>
                      <span className="font-semibold text-slate-800">
                        {formatRupiah(transaction.itemsSubtotal || transaction.unitPrice * transaction.quantity)}
                      </span>
                    </div>

                    {transaction.discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 font-semibold">
                        <span>Diskon Promo</span>
                        <span>- {formatRupiah(transaction.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Biaya Layanan</span>
                      <span className="font-semibold text-slate-800">
                        {transaction.paymentFee > 0 ? formatRupiah(transaction.paymentFee) : "Rp 0 (Gratis)"}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Total Belanja</span>
                      <span className="font-black text-slate-900 text-base sm:text-lg">
                        {formatRupiah(transaction.totalAmount)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                      <div className="flex items-center justify-end">
                        {getPaymentLogo(transaction.paymentMethodName || transaction.paymentMethod) ? (
                          <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getPaymentLogo(transaction.paymentMethodName || transaction.paymentMethod)}
                              alt={cleanPaymentMethodName(transaction.paymentMethodName || transaction.paymentMethod)}
                              className="h-3.5 w-auto object-contain max-w-[70px]"
                            />
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {cleanPaymentMethodName(transaction.paymentMethodName || transaction.paymentMethod)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Tombol Aksi Cepat */}
                <div className="space-y-2 pt-1 print:hidden">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full h-10 rounded-lg bg-[#00AA5B] hover:bg-[#00924e] text-white font-bold text-xs shadow-xs gap-2 disabled:opacity-75 cursor-pointer"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingPdf ? "Memproses PDF..." : "Unduh Bukti Pembayaran (PDF)"}</span>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 rounded-lg font-semibold text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 gap-2"
                  >
                    <Link href="/transactions">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>Lihat Riwayat Transaksi</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    className="w-full h-9 rounded-lg font-medium text-xs text-slate-500 hover:text-slate-800 gap-1.5"
                  >
                    <Link href="/">
                      <Home className="w-3.5 h-3.5" />
                      <span>Kembali ke Halaman Utama</span>
                    </Link>
                  </Button>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* 4. Footer Desktop */}
      <div className="hidden md:block print:hidden">
        <MarketFooter />
      </div>

      {/* 5. Modal / Dialog Beri Nilai */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-5 sm:p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Beri Nilai & Ulasan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Bagikan pengalaman belanja Anda untuk produk ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              {transaction.productImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={transaction.productImage}
                  alt={transaction.productTitle}
                  className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {cleanProductTitle(transaction.productTitle)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {transaction.variant ? `Varian: ${transaction.variant}` : "Produk Digital"}
                </p>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Pilih Rating Bintang:
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating !== null ? hoverRating : selectedRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 transition-colors",
                          active
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 hover:text-slate-300"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-1.5">
                {{
                  1: "Sangat Kecewa (1/5)",
                  2: "Kurang Memuaskan (2/5)",
                  3: "Cukup Baik (3/5)",
                  4: "Sangat Baik (4/5)",
                  5: "Luar Biasa Memuaskan (5/5)",
                }[selectedRating]}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ulasan Anda (Opsional):
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Ceritakan pengalaman Anda mengenai produk ini..."
                className="text-xs min-h-[90px] rounded-lg border-slate-200 focus-visible:ring-[#00AA5B]"
                maxLength={500}
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="anon"
                checked={isAnonymous}
                onCheckedChange={(v) => setIsAnonymous(Boolean(v))}
              />
              <label
                htmlFor="anon"
                className="text-xs text-slate-600 font-medium cursor-pointer"
              >
                Sembunyikan nama saya (Ulasan Anonim)
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={submittingReview}
              className="text-xs h-9 rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="bg-[#00AA5B] hover:bg-[#00924e] text-white text-xs h-9 rounded-lg font-bold"
            >
              {submittingReview ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                "Kirim Ulasan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Dispute Modal */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-5 sm:p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>{existingDispute ? "Status Komplain" : "Ajukan Komplain"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tim penanganan sengketa akan meninjau kendala pesanan Anda.
            </DialogDescription>
          </DialogHeader>

          {existingDispute ? (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">Alasan: </span>
                <span className="text-slate-600">{existingDispute.reason}</span>
                <p className="mt-1.5 text-slate-700 leading-relaxed italic">
                  "{existingDispute.description}"
                </p>
              </div>

              {existingDispute.sellerResponse && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="font-bold mb-1">Tanggapan Toko:</p>
                  <p>{existingDispute.sellerResponse}</p>
                </div>
              )}

              {existingDispute.adminNote && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-900">
                  <p className="font-bold mb-1">Catatan Admin:</p>
                  <p>{existingDispute.adminNote}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Alasan Komplain</label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger className="text-xs h-9 rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_received">Produk Tidak Diterima</SelectItem>
                    <SelectItem value="invalid_license">Lisensi / Akun Tidak Valid</SelectItem>
                    <SelectItem value="not_as_described">Tidak Sesuai Deskripsi</SelectItem>
                    <SelectItem value="corrupted_file">File Rusak / Tidak Lengkap</SelectItem>
                    <SelectItem value="refund_request">Permintaan Refund</SelectItem>
                    <SelectItem value="other">Alasan Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Penjelasan Kendala</label>
                <Textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Jelaskan secara rinci kendala yang Anda alami..."
                  className="text-xs min-h-[90px] rounded-lg border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Tautan Bukti / Screenshot (Opsional)</label>
                <Textarea
                  value={disputeEvidenceUrls}
                  onChange={(e) => setDisputeEvidenceUrls(e.target.value)}
                  placeholder="https://... (satu tautan per baris)"
                  className="text-xs min-h-[60px] rounded-lg border-slate-200 font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisputeModalOpen(false)}
              className="text-xs h-9 rounded-lg"
            >
              Tutup
            </Button>
            {!existingDispute && (
              <Button
                type="button"
                onClick={handleSubmitDispute}
                disabled={submittingDispute}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-lg font-bold"
              >
                {submittingDispute ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Komplain"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
