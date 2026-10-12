"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MessageSquare,
  Reply,
  CheckCircle2,
  Clock,
  Search,
  RotateCw,
  ThumbsUp,
  AlertCircle,
  Package,
  User,
  Copy,
  Trash2,
  ExternalLink,
  Store,
  Filter,
  Check,
  MoreVertical,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface UnifiedReview {
  id: string;
  transactionId?: string;
  invoiceNumber?: string;
  productId?: string;
  productName?: string;
  shopId?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string | null;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  createdAt?: string | any;
  source: "postgres" | "firestore";
}

const QUICK_TEMPLATES = [
  {
    title: "Terima Kasih Positif",
    text: "Terima kasih atas ulasan positif dan kepercayaannya! Semoga produknya bermanfaat dan awet.",
  },
  {
    title: "Pelanggan Setia",
    text: "Terima kasih banyak sudah berbelanja di toko kami! Ditunggu pesanan berikutnya, kak.",
  },
  {
    title: "Komitmen Kualitas",
    text: "Halo kak, terima kasih atas masukannya. Kami akan terus meningkatkan kualitas produk dan layanan toko kami.",
  },
  {
    title: "Solusi & Bantuan",
    text: "Mohon maaf atas kendala yang dialami kak. Tim kami siap membantu, silakan hubungi kami via chat toko ya.",
  },
];

export default function MerchantReviewsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { shopId: contextShopId, shop: contextShop } = useMerchantShop();

  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "need_reply" | "replied" | 5 | 4 | 3 | 2 | 1>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "unreplied_first">("newest");
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // PostgreSQL reviews & stats state
  const [pgReviews, setPgReviews] = useState<UnifiedReview[]>([]);
  const [pgLoading, setPgLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal Balas / Edit Balasan
  const [selectedReview, setSelectedReview] = useState<UnifiedReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDeleteReply, setReviewToDeleteReply] = useState<UnifiedReview | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeShopId = contextShopId || user?.uid || null;

  // Shop details from Firestore if available
  const shopRef = useMemoFirebase(() => {
    if (!activeShopId || !db) return null;
    return doc(db, "shops", activeShopId);
  }, [db, activeShopId]);

  const { data: firestoreShop, loading: shopDocLoading } = useDoc(shopRef);
  const shop = contextShop || firestoreShop;

  // Fetch reviews from PostgreSQL
  const fetchPgReviews = useCallback(async (showToast = false) => {
    if (!activeShopId) return;
    setPgLoading(true);
    try {
      const res = await fetch(`/api/reviews?shopId=${encodeURIComponent(activeShopId)}&limit=100`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        const mapped: UnifiedReview[] = data.reviews.map((r: any) => ({
          id: r.id,
          transactionId: r.transactionId,
          invoiceNumber: r.invoiceNumber,
          productId: r.productId,
          productName: r.productName,
          shopId: r.shopId,
          userId: r.userId,
          userName: r.userName,
          userAvatar: r.userAvatar,
          rating: Number(r.rating) || 5,
          comment: r.comment || "",
          isAnonymous: Boolean(r.isAnonymous),
          sellerReply: r.sellerReply || null,
          sellerRepliedAt: r.sellerRepliedAt || null,
          createdAt: r.createdAt,
          source: "postgres",
        }));
        setPgReviews(mapped);
        if (showToast) {
          toast({
            title: "Ulasan Diperbarui",
            description: "Data ulasan pelanggan telah disinkronkan dengan data terbaru.",
          });
        }
      }
    } catch (err) {
      console.warn("[MERCHANT REVIEWS PG FETCH ERROR]", err);
    } finally {
      setPgLoading(false);
      setIsRefreshing(false);
    }
  }, [activeShopId, toast]);

  useEffect(() => {
    if (activeShopId) {
      fetchPgReviews(false);
    }
  }, [activeShopId, fetchPgReviews]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchPgReviews(true);
  };

  const allReviews: UnifiedReview[] = pgReviews;

  // Overall Statistics Calculation
  const totalReviews = allReviews.length;
  const ratingSum = allReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
  const avgRatingNumber = totalReviews > 0 ? ratingSum / totalReviews : Number(shop?.rating || 0);
  const avgRating = avgRatingNumber > 0 ? avgRatingNumber.toFixed(1) : "0.0";

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of allReviews) {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    }
    return counts;
  }, [allReviews]);

  const needReplyCount = useMemo(() => {
    return allReviews.filter((r) => !r.sellerReply).length;
  }, [allReviews]);

  const repliedCount = totalReviews - needReplyCount;
  const replyRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 100;
  const positiveReviewsCount = starCounts[5] + starCounts[4];
  const positiveRate = totalReviews > 0 ? Math.round((positiveReviewsCount / totalReviews) * 100) : 100;

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return allReviews
      .filter((rev) => {
        // Tab Filters
        if (activeFilter === "need_reply" && rev.sellerReply) return false;
        if (activeFilter === "replied" && !rev.sellerReply) return false;
        if (typeof activeFilter === "number") {
          const star = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
          if (star !== activeFilter) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchComment = rev.comment?.toLowerCase().includes(q);
          const matchProduct = rev.productName?.toLowerCase().includes(q);
          const matchUser = rev.userName?.toLowerCase().includes(q);
          const matchInvoice = rev.invoiceNumber?.toLowerCase().includes(q);
          if (!matchComment && !matchProduct && !matchUser && !matchInvoice) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "highest") {
          return (Number(b.rating) || 5) - (Number(a.rating) || 5);
        }
        if (sortBy === "lowest") {
          return (Number(a.rating) || 5) - (Number(b.rating) || 5);
        }
        if (sortBy === "unreplied_first") {
          if (!a.sellerReply && b.sellerReply) return -1;
          if (a.sellerReply && !b.sellerReply) return 1;
        }
        // Default newest
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [allReviews, activeFilter, searchQuery, sortBy]);

  // Copy invoice number
  const handleCopyInvoice = (inv: string) => {
    navigator.clipboard.writeText(inv);
    setCopiedInvoice(inv);
    toast({
      title: "Invoice Disalin",
      description: `Nomor invoice "${inv}" telah disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedInvoice(null), 2500);
  };

  // Open Reply Modal
  const handleOpenReplyModal = (review: UnifiedReview) => {
    setSelectedReview(review);
    setReplyText(review.sellerReply || "");
  };

  // Submit Reply (saves to PostgreSQL and Firestore)
  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setIsSubmittingReply(true);

    const cleanReply = replyText.trim();
    const revId = selectedReview.id;

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: revId,
          sellerReply: cleanReply,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menyimpan balasan ulasan.");
      }

      // Optimistic local update
      setPgReviews((prev) =>
        prev.map((r) =>
          r.id === revId
            ? { ...r, sellerReply: cleanReply, sellerRepliedAt: new Date().toISOString() }
            : r
        )
      );

      toast({
        title: "Balasan Berhasil Disimpan",
        description: "Tanggapan Anda kini dapat dilihat oleh pelanggan dan pengunjung toko.",
      });

      setSelectedReview(null);
      setReplyText("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Balasan",
        description: error?.message || "Terjadi kendala saat menyimpan tanggapan ulasan.",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete Seller Reply
  const handleConfirmDeleteReply = async () => {
    if (!reviewToDeleteReply) return;
    const revId = reviewToDeleteReply.id;

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: revId,
          sellerReply: null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal menghapus balasan.");
      }

      // Optimistic update
      setPgReviews((prev) =>
        prev.map((r) =>
          r.id === revId ? { ...r, sellerReply: null, sellerRepliedAt: null } : r
        )
      );

      toast({
        title: "Balasan Dihapus",
        description: "Tanggapan toko pada ulasan ini telah berhasil dihapus.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Balasan",
        description: err?.message || "Terjadi kesalahan saat menghapus tanggapan.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setReviewToDeleteReply(null);
    }
  };

  // Format Date Helper
  const formatDateDisplay = (dateVal: any) => {
    if (!dateVal) return "Baru saja";
    try {
      const d = dateVal?.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
      if (isNaN(d.getTime())) return "Baru saja";
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Baru saja";
    }
  };

  const isLoadingInitial =
    !mounted || authLoading || (shopDocLoading && !contextShop) || (pgLoading && allReviews.length === 0);

  if (isLoadingInitial) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <Skeleton className="h-48 md:col-span-4 rounded-2xl" />
          <Skeleton className="h-48 md:col-span-5 rounded-2xl" />
          <Skeleton className="h-48 md:col-span-3 rounded-2xl" />
        </div>

        <Skeleton className="h-14 w-full rounded-2xl" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                <Star className="w-4 h-4 fill-[#00AA5B]" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Ulasan Pelanggan
              </h1>
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] hover:bg-[#00AA5B]/15 border-none font-bold text-[11px] px-2 py-0.5">
                {totalReviews} Total
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Pantau kepuasan pembeli, tanggapi ulasan, dan tingkatkan reputasi toko Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || pgLoading}
              className="h-8.5 rounded-xl text-xs font-semibold border-border hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <RotateCw className={cn("w-3.5 h-3.5", (isRefreshing || pgLoading) && "animate-spin text-[#00AA5B]")} />
              <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan"}</span>
            </Button>

            {shop?.slug && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-[#00AA5B] gap-1.5 cursor-pointer"
              >
                <Link href={`/${shop.slug}?tab=reviews`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Halaman Toko</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Rating Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          {/* Card 1: Score & Overall Satisfaction */}
          <Card className="md:col-span-4 border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Skor Rating Toko
                </span>
                <span className="text-[11px] font-semibold text-[#00AA5B] bg-[#00AA5B]/10 px-2 py-0.5 rounded-full">
                  {positiveRate}% Positif
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {avgRating}
                </span>
                <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-4.5 h-4.5",
                      s <= Math.round(Number(avgRating))
                        ? "text-[#FFC400] fill-[#FFC400]"
                        : "text-slate-200 fill-slate-100"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Berdasarkan ulasan pembeli</span>
              <span className="font-bold text-slate-800">{totalReviews} Ulasan</span>
            </div>
          </Card>

          {/* Card 2: Star Distribution Bars */}
          <Card className="md:col-span-5 border-border border shadow-xs rounded-2xl bg-white p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Distribusi Bintang
                </span>
                <span className="text-[11px] text-muted-foreground">Klik bar untuk filter</span>
              </div>

              <div className="space-y-2.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = starCounts[star] || 0;
                  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  const isFiltered = activeFilter === star;

                  return (
                    <button
                      key={star}
                      onClick={() => setActiveFilter(activeFilter === star ? "all" : star)}
                      className={cn(
                        "w-full flex items-center gap-3 text-left py-1 px-1.5 rounded-lg transition-colors cursor-pointer group",
                        isFiltered ? "bg-[#00AA5B]/10 font-bold" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-1 w-8 shrink-0">
                        <span className="text-xs font-bold text-slate-800">{star}</span>
                        <Star className="w-3.5 h-3.5 text-[#FFC400] fill-[#FFC400]" />
                      </div>

                      <div className="flex-1">
                        <Progress
                          value={pct}
                          className="h-2 rounded-full bg-slate-100"
                        />
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500 w-14 text-right">
                        {count} <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Card 3: Reply Performance & Pending Counter */}
          <Card className="md:col-span-3 border-border border shadow-xs rounded-2xl bg-white p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                Respon Ulasan
              </span>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-amber-800">Perlu Dibalas</p>
                    <p className="text-2xl font-black text-amber-900">{needReplyCount}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-emerald-800">Telah Dibalas</p>
                    <p className="text-2xl font-black text-emerald-900">{repliedCount}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Tingkat Balasan:</span>
              <span className="font-bold text-[#00AA5B]">{replyRate}%</span>
            </div>
          </Card>
        </div>

        {/* Filter Tabs, Search & Sort Bar */}
        <div className="space-y-3 bg-white p-4 sm:p-4.5 rounded-2xl border border-border shadow-xs">
          {/* Scrollable Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "h-8 rounded-xl text-xs font-semibold shrink-0 cursor-pointer",
                activeFilter === "all"
                  ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs"
                  : "border-border text-slate-700 hover:bg-slate-50"
              )}
            >
              Semua ({totalReviews})
            </Button>

            <Button
              variant={activeFilter === "need_reply" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("need_reply")}
              className={cn(
                "h-8 rounded-xl text-xs font-semibold shrink-0 cursor-pointer gap-1.5",
                activeFilter === "need_reply"
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  : "border-border text-slate-700 hover:bg-slate-50"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Perlu Dibalas ({needReplyCount})
            </Button>

            <Button
              variant={activeFilter === "replied" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("replied")}
              className={cn(
                "h-8 rounded-xl text-xs font-semibold shrink-0 cursor-pointer gap-1.5",
                activeFilter === "replied"
                  ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs"
                  : "border-border text-slate-700 hover:bg-slate-50"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sudah Dibalas ({repliedCount})
            </Button>

            {([5, 4, 3, 2, 1] as const).map((star) => (
              <Button
                key={star}
                variant={activeFilter === star ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(star)}
                className={cn(
                  "h-8 rounded-xl text-xs font-semibold shrink-0 cursor-pointer gap-1",
                  activeFilter === star
                    ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs"
                    : "border-border text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{star}</span>
                <Star className="w-3 h-3 fill-current text-[#FFC400]" />
                <span className="opacity-80">({starCounts[star] || 0})</span>
              </Button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari produk, pembeli, invoice, atau ulasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 rounded-xl border-border text-xs bg-slate-50/70 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                Urutkan:
              </span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="h-9 w-full sm:w-48 rounded-xl border-border text-xs font-semibold bg-white">
                  <SelectValue placeholder="Urutan Ulasan" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="newest" className="text-xs">Terbaru</SelectItem>
                  <SelectItem value="unreplied_first" className="text-xs">Belum Dibalas Dahulu</SelectItem>
                  <SelectItem value="highest" className="text-xs">Rating Tertinggi (5★)</SelectItem>
                  <SelectItem value="lowest" className="text-xs">Rating Terendah (1★)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reviews List & Empty State */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="border-border border shadow-xs rounded-2xl bg-white p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-border/80 mb-3">
                <Star className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {totalReviews === 0
                  ? "Belum Ada Ulasan Pembeli"
                  : "Tidak Ada Ulasan yang Sesuai"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
                {totalReviews === 0
                  ? "Ulasan pembeli akan tampil di sini secara otomatis setelah pelanggan menyelesaikan transaksi dan memberikan rating terhadap produk Anda."
                  : "Coba ubah kata kunci pencarian atau reset filter bintang untuk melihat ulasan pelanggan lainnya."}
              </p>
              {(activeFilter !== "all" || searchQuery) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveFilter("all");
                      setSearchQuery("");
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-border cursor-pointer"
                  >
                    Reset Filter
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const ratingNum = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5)));
              const isAnonymous = Boolean(review.isAnonymous);
              const displayName = isAnonymous
                ? "Pembeli Anonim"
                : review.userName || "Pembeli MarketPointID";

              return (
                <Card
                  key={review.id}
                  className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden hover:border-[#00AA5B]/40 transition-all"
                >
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Review Header: User & Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-xl border border-border shadow-xs shrink-0">
                          {review.userAvatar && !review.userAvatar.includes("duck") && !isAnonymous ? (
                            <AvatarImage src={review.userAvatar} referrerPolicy="no-referrer" />
                          ) : null}
                          <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                            {isAnonymous ? (
                              <User className="w-4 h-4 text-[#00AA5B]" />
                            ) : (
                              displayName.substring(0, 1).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {displayName}
                            </span>
                            <Badge className="bg-emerald-50 text-[#00AA5B] border-emerald-200/60 font-semibold text-[10px] px-1.5 py-0 h-4.5 gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Terverifikasi
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "w-3.5 h-3.5",
                                    s <= ratingNum
                                      ? "text-[#FFC400] fill-[#FFC400]"
                                      : "text-slate-200 fill-slate-100"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              • {formatDateDisplay(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Meta: Invoice info */}
                      {review.invoiceNumber && (
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          <button
                            onClick={() => handleCopyInvoice(review.invoiceNumber!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-border text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                            title="Klik untuk salin invoice"
                          >
                            <span>{review.invoiceNumber}</span>
                            {copiedInvoice === review.invoiceNumber ? (
                              <Check className="w-3 h-3 text-[#00AA5B]" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Product Chip */}
                    {review.productName && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 border border-border/80 w-fit max-w-full">
                        <div className="h-6 w-6 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-[#00AA5B]" />
                        </div>
                        {review.productId && review.productId !== "general" ? (
                          <Link
                            href={`/products/${review.productId}`}
                            target="_blank"
                            className="text-[11px] font-semibold text-slate-800 hover:text-[#00AA5B] truncate max-w-[280px] sm:max-w-md inline-flex items-center gap-1"
                          >
                            <span>{review.productName}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[280px] sm:max-w-md">
                            {review.productName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Review Comment Content */}
                    <div className="text-slate-800 text-xs sm:text-[13px] leading-relaxed font-normal bg-white">
                      {review.comment ? (
                        <p className="whitespace-pre-line">&quot;{review.comment}&quot;</p>
                      ) : (
                        <p className="text-muted-foreground italic text-xs">
                          Pembeli tidak menyertakan komentar teks (hanya memberikan rating bintang).
                        </p>
                      )}
                    </div>

                    {/* Seller Reply Box OR Reply Action Button */}
                    {review.sellerReply ? (
                      <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-slate-50/90 border-l-4 border-[#00AA5B] border-y border-r border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-md bg-[#00AA5B] flex items-center justify-center text-white">
                              <Store className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold text-[#00AA5B]">
                              Respon Toko Anda
                            </span>
                            {review.sellerRepliedAt && (
                              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                                • {formatDateDisplay(review.sellerRepliedAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReplyModal(review)}
                              className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:text-[#00AA5B] hover:bg-white rounded-lg cursor-pointer"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReviewToDeleteReply(review);
                                setDeleteConfirmOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                          {review.sellerReply}
                        </p>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReplyModal(review)}
                          className="h-8 px-3.5 rounded-xl text-xs font-semibold border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B] hover:text-white transition-all gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Balas Ulasan</span>
                        </Button>
                        <span className="text-[11px] text-muted-foreground">
                          Balasan Anda membantu membangun kepercayaan calon pembeli.
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Balas / Edit Balasan Ulasan */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReview(null);
            setReplyText("");
          }
        }}
      >
        <DialogContent className="w-[94vw] sm:max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col p-0 rounded-2xl bg-white border border-border shadow-xl overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 shrink-0 text-left">
            <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#00AA5B]" />
              {selectedReview?.sellerReply ? "Edit Balasan Ulasan" : "Balas Ulasan Pembeli"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tulis tanggapan yang sopan dan profesional untuk pelanggan toko Anda.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Review Context Box */}
              <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-border/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {selectedReview.isAnonymous
                      ? "Pembeli Anonim"
                      : selectedReview.userName || "Pembeli MarketPointID"}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3 h-3",
                          s <= Math.round(Number(selectedReview.rating) || 5)
                            ? "text-[#FFC400] fill-[#FFC400]"
                            : "text-slate-200 fill-slate-100"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {selectedReview.productName && (
                  <p className="text-[11px] text-muted-foreground font-medium truncate">
                    Produk: {selectedReview.productName}
                  </p>
                )}

                <p className="text-xs text-slate-700 italic leading-relaxed">
                  &quot;{selectedReview.comment || "Tidak ada komentar tertulis."}&quot;
                </p>
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Template Balasan Cepat
                  </label>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Pilih untuk mengisi otomatis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_TEMPLATES.map((tmpl, idx) => {
                    const isSelected = replyText === tmpl.text;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(tmpl.text)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                          isSelected
                            ? "bg-[#00AA5B]/10 border-[#00AA5B] text-slate-900 shadow-2xs"
                            : "bg-slate-50 hover:bg-white hover:border-[#00AA5B]/50 border-border text-slate-700"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span
                            className={cn(
                              "text-[10px] font-bold tracking-tight",
                              isSelected ? "text-[#00AA5B]" : "text-slate-900 group-hover:text-[#00AA5B]"
                            )}
                          >
                            {tmpl.title}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-[#00AA5B] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          &quot;{tmpl.text}&quot;
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reply Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Tanggapan Toko Anda
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {replyText.length} / 500 karakter
                  </span>
                </div>
                <Textarea
                  placeholder="Tulis balasan terima kasih atau bantuan solusi untuk ulasan ini..."
                  rows={3}
                  maxLength={500}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs rounded-xl border-border resize-none focus-visible:ring-[#00AA5B]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-3.5 sm:p-4 border-t border-border/60 bg-slate-50/70 shrink-0 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedReview(null);
                setReplyText("");
              }}
              disabled={isSubmittingReply}
              className="h-8 text-xs font-semibold rounded-xl border-border cursor-pointer"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingReply || !replyText.trim()}
              onClick={handleSubmitReply}
              className="h-8 text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white rounded-xl shadow-xs cursor-pointer gap-1.5"
            >
              {isSubmittingReply ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Reply className="w-3.5 h-3.5" />
                  <span>{selectedReview?.sellerReply ? "Perbarui Balasan" : "Kirim Balasan"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Reply */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="w-[94vw] sm:max-w-md max-h-[85vh] rounded-2xl bg-white p-5 border border-border">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-600" />
              Hapus Balasan Ulasan?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Apakah Anda yakin ingin menghapus tanggapan Anda untuk ulasan ini? Anda dapat menulis balasan baru kapan saja.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs font-semibold rounded-xl border-border cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteReply}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Ya, Hapus Balasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
