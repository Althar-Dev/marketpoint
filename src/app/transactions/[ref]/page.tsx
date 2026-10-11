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
  Download,
  Package,
  CreditCard,
  Mail,
  Phone,
  User,
  Calendar,
  Hash,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Home,
  Receipt,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  invoiceNumber: string;
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
  paymentMethod: string;
  paymentMethodName: string;
  paymentCategory: string;
  paymentCode?: string | null;
  status: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  deliveredBy?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; glow: string }> = {
  PAID: {
    label: "Pembayaran Berhasil",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    glow: "shadow-emerald-100",
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
  },
  SETTLED: {
    label: "Lunas & Selesai",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    glow: "shadow-emerald-100",
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  },
  PENDING: {
    label: "Menunggu Pembayaran",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    glow: "shadow-amber-100",
    icon: <Clock className="w-6 h-6 text-amber-500" />,
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    glow: "shadow-slate-100",
    icon: <AlertCircle className="w-6 h-6 text-slate-400" />,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    glow: "shadow-red-100",
    icon: <XCircle className="w-6 h-6 text-red-400" />,
  },
  FAILED: {
    label: "Gagal",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    glow: "shadow-red-100",
    icon: <XCircle className="w-6 h-6 text-red-500" />,
  },
};

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      title="Salin"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ref = params?.ref as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const status = transaction?.status || "PENDING";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["PENDING"];
  const isPaid = status === "PAID" || status === "SETTLED";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500">Memuat detail transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Transaksi Tidak Ditemukan</h2>
            <p className="text-sm text-slate-500 mt-1">{error || "Nomor referensi tidak valid atau transaksi sudah dihapus."}</p>
          </div>
          <Button onClick={() => router.push("/")} className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white rounded-xl">
            <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <span className="text-sm font-bold text-slate-700">Detail Transaksi</span>
          <button
            onClick={() => fetchTransaction(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-500", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Status Hero Card */}
        <div className={cn(
          "rounded-3xl border-2 p-6 text-center shadow-lg",
          cfg.bg, cfg.glow
        )}>
          <div className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4",
            isPaid ? "bg-emerald-100" : "bg-white"
          )}>
            {isPaid ? (
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-30" />
                {cfg.icon}
              </div>
            ) : cfg.icon}
          </div>
          <h1 className={cn("text-xl font-black mb-1", cfg.color)}>{cfg.label}</h1>
          <p className="text-sm text-slate-500 font-medium">{formatDate(transaction.createdAt)}</p>
          <div className="mt-4 flex items-center justify-center gap-2 bg-white/70 rounded-xl px-4 py-2 w-fit mx-auto">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-bold text-slate-700 tracking-wide">{transaction.invoiceNumber}</span>
            <CopyButton text={transaction.invoiceNumber} />
          </div>
        </div>

        {/* Produk */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produk</span>
          </div>
          <div className="p-5 flex gap-4">
            {transaction.productImage && (
              <img
                src={transaction.productImage}
                alt={transaction.productTitle}
                className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{transaction.productTitle}</h2>
              {transaction.variant && (
                <Badge variant="outline" className="mt-1.5 text-[10px] font-semibold">
                  <Tag className="w-3 h-3 mr-1" />{transaction.variant}
                </Badge>
              )}
              <p className="text-xs text-slate-400 mt-1">Qty: {transaction.quantity}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black text-slate-800">{formatRupiah(transaction.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Rincian Pembayaran */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rincian Pembayaran</span>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-700">{formatRupiah(transaction.itemsSubtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Diskon{transaction.voucherCode ? ` (${transaction.voucherCode})` : ""}</span>
                <span className="font-semibold text-emerald-600">- {formatRupiah(transaction.discount)}</span>
              </div>
            )}
            {transaction.paymentFee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Biaya Layanan</span>
                <span className="font-semibold text-slate-700">+ {formatRupiah(transaction.paymentFee)}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-700">Total Dibayar</span>
              <span className="text-lg font-black text-[#00AA5B]">{formatRupiah(transaction.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Metode Pembayaran</span>
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Via</span>
              <span className="text-sm font-bold text-slate-800">{transaction.paymentMethodName}</span>
            </div>
            {transaction.paymentCode && (
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kode Pembayaran</p>
                  <p className="text-sm font-bold text-slate-800 tracking-wider">{transaction.paymentCode}</p>
                </div>
                <CopyButton text={transaction.paymentCode} />
              </div>
            )}
          </div>
        </div>

        {/* Info Pembeli */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Info Pembeli</span>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {transaction.buyerName && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="font-semibold text-slate-700">{transaction.buyerName}</span>
              </div>
            )}
            {transaction.buyerEmail && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-slate-600">{transaction.buyerEmail}</span>
              </div>
            )}
            {transaction.buyerPhone && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-slate-600">{transaction.buyerPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Banner Pengiriman Digital */}
        {isPaid && transaction.deliveredBy && (
          <div className="bg-gradient-to-r from-emerald-500 to-[#00AA5B] rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Produk Terkirim!</p>
                <p className="text-xs text-white/80">oleh {transaction.deliveredBy}</p>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">
              Lisensi & data produk telah dikirimkan ke email Anda. Periksa kotak masuk di{" "}
              <Link href="/email" className="underline font-bold">Email Service MarketPoint</Link>.
            </p>
          </div>
        )}

        {/* Waktu Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu Transaksi</span>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Dibuat</span>
              <span className="font-semibold text-slate-700 text-right">{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Diperbarui</span>
              <span className="font-semibold text-slate-700 text-right">{formatDate(transaction.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
          <span>Transaksi dilindungi keamanan MarketPoint</span>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2 pb-8">
          <Button
            asChild
            className="w-full h-12 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold shadow-lg shadow-emerald-200"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
            </Link>
          </Button>
          {isPaid && (
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-xl font-bold border-slate-200"
            >
              <Link href="/email">
                <Mail className="w-4 h-4 mr-2" /> Lihat Email Pengiriman
              </Link>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
