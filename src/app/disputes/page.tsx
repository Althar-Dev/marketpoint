"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  MessageSquareWarning, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert,
  ShoppingBag,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

type DisputeStatus =
  | "OPEN"
  | "SELLER_RESPONDED"
  | "ADMIN_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

interface DisputeItem {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  productTitle?: string | null;
  productImage?: string | null;
  totalAmount: number;
  reason: string;
  description: string;
  status: DisputeStatus;
  sellerName?: string | null;
  sellerResponse?: string | null;
  adminNote?: string | null;
  resolution?: string | null;
  refundAmount?: number | null;
  createdAt: string;
}

const STATUS_LABELS: Record<DisputeStatus, { label: string; color: string; border: string; bg: string }> = {
  OPEN: { label: "Menunggu Respon Penjual", color: "text-amber-700", border: "border-amber-300", bg: "bg-amber-50" },
  SELLER_RESPONDED: { label: "Penjual Merespons", color: "text-blue-700", border: "border-blue-300", bg: "bg-blue-50" },
  ADMIN_REVIEW: { label: "Ditinjau Admin", color: "text-purple-700", border: "border-purple-300", bg: "bg-purple-50" },
  RESOLVED: { label: "Selesai (Disetujui)", color: "text-emerald-700", border: "border-emerald-300", bg: "bg-emerald-50" },
  REJECTED: { label: "Ditolak", color: "text-rose-700", border: "border-rose-300", bg: "bg-rose-50" },
  CANCELLED: { label: "Dibatalkan", color: "text-slate-600", border: "border-slate-300", bg: "bg-slate-100" },
};

const REASON_LABELS: Record<string, string> = {
  not_received: "Produk tidak diterima",
  not_as_described: "Tidak sesuai deskripsi",
  invalid_license: "Lisensi / kunci tidak valid",
  corrupted_file: "File rusak / tidak lengkap",
  wrong_item: "Item salah / berbeda",
  refund_request: "Permintaan pengembalian dana",
  other: "Lainnya",
};

const TABS = [
  { id: "all", label: "Semua" },
  { id: "active", label: "Diproses" },
  { id: "resolved", label: "Selesai" },
];

export default function DisputesPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchDisputes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/disputes?buyerId=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.disputes)) {
        setDisputes(data.disputes);
      } else {
        setDisputes([]);
      }
    } catch (e) {
      console.error("Gagal memuat sengketa:", e);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDisputes();
    }
  }, [user, authLoading]);

  const filteredDisputes = disputes.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") {
      return ["OPEN", "SELLER_RESPONDED", "ADMIN_REVIEW"].includes(item.status);
    }
    if (activeTab === "resolved") {
      return ["RESOLVED", "REJECTED", "CANCELLED"].includes(item.status);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <div className="hidden md:block">
        <MarketHeader />
      </div>

      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-slate-700 hover:text-black cursor-pointer"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-slate-900">Pesanan Dikomplain</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchDisputes} className="h-8 w-8 text-muted-foreground">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:py-8 md:px-6">
        {/* Desktop Title Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/profile" className="hover:underline">Akun</Link>
              <span>/</span>
              <span className="text-foreground font-semibold">Pesanan Dikomplain</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-[#00AA5B]" />
              Pesanan Dikomplain
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pantau status pengajuan komplain dan resolusi sengketa pesanan Anda.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDisputes} className="gap-2 h-9 text-xs font-bold rounded-xl">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Perbarui
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-[#00AA5B] text-white shadow-xs"
                  : "bg-white border border-border/70 text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-border/60 bg-white rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <Card className="border border-border/60 bg-white rounded-2xl p-8 text-center space-y-3 my-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MessageSquareWarning className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Tidak ada komplain aktif</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Anda tidak memiliki pesanan yang sedang dalam proses komplain atau sengketa pada status ini.
              </p>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs rounded-xl h-9 px-5">
                <Link href="/transactions">Lihat Daftar Transaksi</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => {
              const statusCfg = STATUS_LABELS[dispute.status] || {
                label: dispute.status,
                color: "text-slate-700",
                border: "border-slate-300",
                bg: "bg-slate-50",
              };

              return (
                <Card key={dispute.id} className="border border-border/60 bg-white rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#00AA5B]/40 transition-colors">
                  {/* Card Header: Invoice & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Invoice:</span>
                      <span className="text-[12px] font-black text-slate-800">#{dispute.invoiceNumber}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusCfg.bg, statusCfg.border, statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Product Info */}
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {dispute.productImage ? (
                        <Image src={dispute.productImage} alt="Product" fill className="object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {dispute.productTitle || "Produk Transaksi"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Alasan: <span className="font-semibold text-slate-700">{REASON_LABELS[dispute.reason] || dispute.reason}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-[#00AA5B]">
                        Rp {dispute.totalAmount?.toLocaleString("id-ID") || 0}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(dispute.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Keluhan Anda:</p>
                    <p className="line-clamp-2 leading-relaxed">{dispute.description}</p>
                  </div>

                  {/* Seller or Admin Response if any */}
                  {dispute.sellerResponse && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-900">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Tanggapan Penjual:</p>
                      <p className="leading-relaxed">{dispute.sellerResponse}</p>
                    </div>
                  )}

                  {dispute.adminNote && (
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/70 text-xs text-purple-900">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Keputusan Admin:</p>
                      <p className="leading-relaxed">{dispute.adminNote}</p>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-2 flex justify-end">
                    <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-[11px] font-bold gap-1.5 border-border hover:bg-slate-50">
                      <Link href={`/transactions?invoice=${encodeURIComponent(dispute.invoiceNumber)}`}>
                        <span>Lihat Transaksi</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <div className="hidden md:block">
        <MarketFooter />
      </div>
      <div className="md:hidden">
        <MarketBottomNav />
      </div>
    </div>
  );
}
