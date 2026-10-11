"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReviewItem {
  id: string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  date?: string;
  createdAt?: any;
  comment?: string;
  productName?: string;
  reply?: string | null;
  shopId?: string;
}

export default function MerchantReviewsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "need_reply" | 5 | 4 | 3 | 2 | 1>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // State untuk form balas ulasan
  const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Query reviews riil dari Firestore untuk toko ini
  const reviewsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "reviews"),
      where("shopId", "==", user.uid)
    );
  }, [db, user]);

  const { data: rawReviews, loading: reviewsLoading } = useCollection<any>(reviewsQuery);
  const reviews: ReviewItem[] = (rawReviews || []) as ReviewItem[];

  // Perhitungan statistik ulasan nyata
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
    : (shop?.rating ? Number(shop.rating).toFixed(1) : "0.0");

  const starCounts = {
    5: reviews.filter(r => (Number(r.rating) || 5) === 5).length,
    4: reviews.filter(r => Number(r.rating) === 4).length,
    3: reviews.filter(r => Number(r.rating) === 3).length,
    2: reviews.filter(r => Number(r.rating) === 2).length,
    1: reviews.filter(r => Number(r.rating) === 1).length,
  };

  const needReplyCount = reviews.filter(r => !r.reply).length;

  // Filter ulasan
  const filteredReviews = reviews.filter((rev) => {
    if (activeFilter === "need_reply" && rev.reply) return false;
    if (typeof activeFilter === "number" && (Number(rev.rating) || 5) !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = rev.comment?.toLowerCase().includes(q);
      const matchProduct = rev.productName?.toLowerCase().includes(q);
      const matchUser = rev.userName?.toLowerCase().includes(q);
      if (!matchComment && !matchProduct && !matchUser) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "highest") return (Number(b.rating) || 5) - (Number(a.rating) || 5);
    if (sortBy === "lowest") return (Number(a.rating) || 5) - (Number(b.rating) || 5);
    return 0; // Default newest
  });

  // Handle kirim balasan ulasan ke Firestore
  const handleSubmitReply = async () => {
    if (!replyingReview || !replyText.trim() || !db) return;
    setIsSubmittingReply(true);
    try {
      const revDoc = doc(db, "reviews", replyingReview.id);
      await updateDoc(revDoc, {
        reply: replyText.trim(),
        repliedAt: serverTimestamp(),
      });
      toast({
        title: "Balasan Terkirim",
        description: "Tanggapan Anda telah berhasil disimpan untuk ulasan ini.",
      });
      setReplyingReview(null);
      setReplyText("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: e?.message || "Terjadi kesalahan saat menyimpan balasan.",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (!mounted || authLoading || shopLoading || reviewsLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full rounded-2xl md:col-span-1" />
          <Skeleton className="h-40 w-full rounded-2xl md:col-span-2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Ulasan Pelanggan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Pantau feedback dan tingkatkan reputasi toko Anda secara transparan.
            </p>
          </div>
        </div>

        {/* Rating Summary & Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-4 border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Rating Rata-rata</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter">{avgRating}</span>
              <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon
                  key={s}
                  icon="ph:star-fill"
                  className={cn(
                    "w-5 h-5",
                    s <= Math.round(Number(avgRating)) ? "text-[#FFC400]" : "text-slate-200"
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-4">
              ({totalReviews}) Total Ulasan Pembeli
            </p>
          </Card>

          <Card className="md:col-span-8 border-border border-[1.5px] shadow-sm rounded-2xl bg-white p-6">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Distribusi Bintang</h3>
            <div className="space-y-3">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = starCounts[star] || 0;
                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-4 group">
                    <div className="flex items-center gap-1.5 w-8 shrink-0">
                      <Icon icon="ph:star-fill" className="w-3.5 h-3.5 text-[#FFC400]" />
                      <span className="text-[11px] font-black">{star}</span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-2 rounded-full bg-muted"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground w-12 text-right opacity-70">
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Button
              variant={activeFilter === "all" ? "secondary" : "ghost"}
              onClick={() => setActiveFilter("all")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer",
                activeFilter === "all" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Semua ({totalReviews})
            </Button>
            <Button
              variant={activeFilter === "need_reply" ? "secondary" : "ghost"}
              onClick={() => setActiveFilter("need_reply")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer",
                activeFilter === "need_reply" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Perlu Dibalas ({needReplyCount})
            </Button>
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <Button
                key={star}
                variant={activeFilter === star ? "secondary" : "ghost"}
                onClick={() => setActiveFilter(star)}
                className={cn(
                  "h-8 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer",
                  activeFilter === star ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground hover:bg-muted"
                )}
              >
                Bintang {star} ({starCounts[star] || 0})
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-48">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari ulasan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20"
              />
            </div>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru</SelectItem>
                <SelectItem value="highest" className="text-[10px] font-bold">Rating Tertinggi</SelectItem>
                <SelectItem value="lowest" className="text-[10px] font-bold">Rating Terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reviews List / Clean Empty State */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-border/80 mb-3">
                <Icon icon="ph:star" className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Ulasan Pembeli</h3>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                {totalReviews === 0
                  ? "Ulasan pembeli akan tampil di sini secara otomatis setelah pelanggan menerima produk dan memberikan rating."
                  : "Tidak ada ulasan yang sesuai dengan filter yang Anda pilih."}
              </p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden hover:border-[#00AA5B]/30 transition-all">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                        {review.userAvatar ? (
                          <AvatarImage src={review.userAvatar} />
                        ) : null}
                        <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                          {review.userName ? review.userName.substring(0, 1).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[12px] font-black">{review.userName || "Pembeli MarketPoint"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              icon="ph:star-fill"
                              className={cn(
                                "w-2.5 h-2.5",
                                i < (Number(review.rating) || 5) ? "text-[#FFC400]" : "text-muted-foreground opacity-20"
                              )}
                            />
                          ))}
                          <span className="text-[9px] text-muted-foreground font-medium ml-1.5">
                            {review.date || "Baru saja"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {review.productName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-border/50 w-fit">
                        <div className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                          <Icon icon="ph:package" className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground max-w-[240px] truncate">
                          {review.productName}
                        </p>
                      </div>
                    )}
                    <p className="text-[13px] text-[#2E3137] leading-relaxed font-medium">
                      &quot;{review.comment || "Pembeli tidak menyertakan komentar teks."}&quot;
                    </p>
                  </div>

                  {review.reply ? (
                    <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border-l-4 border-[#00AA5B] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded bg-[#00AA5B] flex items-center justify-center">
                            <Icon icon="ph:storefront-fill" className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[10px] font-black text-[#00AA5B]">Balasan Penjual</span>
                        </div>
                        <button
                          onClick={() => {
                            setReplyingReview(review);
                            setReplyText(review.reply || "");
                          }}
                          className="text-[9px] font-bold text-muted-foreground hover:text-[#00AA5B] cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                        &quot;{review.reply}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReplyingReview(review);
                          setReplyText("");
                        }}
                        className="h-8 px-4 rounded-xl text-[10px] font-black border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B] hover:text-white transition-all gap-2 cursor-pointer"
                      >
                        <Icon icon="ph:arrow-bend-up-left" className="w-3.5 h-3.5" /> Balas Ulasan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal Balas Ulasan */}
      <Dialog open={!!replyingReview} onOpenChange={(open) => !open && setReplyingReview(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-slate-900">
              Balas Ulasan Pembeli
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Ulasan dari <strong className="text-slate-900">{replyingReview?.userName || "Pembeli"}</strong>:
            </p>
            <div className="p-3 bg-slate-50 border border-border rounded-xl text-xs text-slate-700 italic">
              &quot;{replyingReview?.comment}&quot;
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">Tanggapan Toko Anda</label>
              <Textarea
                placeholder="Tulis balasan terima kasih atau solusi untuk ulasan ini..."
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-xs rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingReview(null)}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingReply || !replyText.trim()}
              onClick={handleSubmitReply}
              className="text-xs font-black bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white rounded-xl shadow-xs"
            >
              {isSubmittingReply ? "Menyimpan..." : "Kirim Balasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
