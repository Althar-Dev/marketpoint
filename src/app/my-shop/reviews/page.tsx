"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const MOCK_REVIEWS = [
  {
    id: "rev-1",
    userName: "Budi Santoso",
    userAvatar: "",
    rating: 5,
    date: "2 jam lalu",
    comment: "Produk API Gateway-nya mantap banget! Dokumentasi lengkap dan sangat mudah diintegrasikan ke project NextJS saya. Seller juga sangat responsif saat ditanya via chat.",
    productName: "Premium API Gateway Bridge - Enterprise Edition",
    reply: "Terima kasih Kak Budi atas ulasan positifnya! Senang bisa membantu project Anda. Sukses selalu!",
  },
  {
    id: "rev-2",
    userName: "Siska Putri",
    userAvatar: "",
    rating: 4,
    date: "Kemarin",
    comment: "Lisensi cepat sampai, cuma mungkin untuk tutorial instalasinya bisa dibikin lebih detail lagi buat pemula. Tapi overall software-nya jalan lancar jaya.",
    productName: "Custom WhatsApp Bot Multi-Device - Official License",
    reply: null,
  },
  {
    id: "rev-3",
    userName: "Andi Wijaya",
    userAvatar: "",
    rating: 5,
    date: "2 hari lalu",
    comment: "Gak nyesel beli di sini. Script-nya clean, gak ada bug, dan performanya kenceng banget. Bintang 5 pokoknya!",
    productName: "PPOB Realtime Engine Module - NextJS Ready",
    reply: "Mantap Kak Andi! Ditunggu orderan selanjutnya ya.",
  }
];

export default function MerchantReviewsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || authLoading || shopLoading) {
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
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Ulasan Pelanggan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Pantau feedback dan tingkatkan kualitas layanan toko Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Icon icon="ph:download-simple" className="w-3.5 h-3.5" /> Unduh Laporan
            </Button>
          </div>
        </div>

        {/* Rating Summary & Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Card className="md:col-span-4 border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col items-center justify-center p-6 text-center">
             <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Rating Rata-rata</h3>
             <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter">4.9</span>
                <span className="text-sm font-bold text-muted-foreground">/ 5.0</span>
             </div>
             <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon key={s} icon="ph:star-fill" className="w-5 h-5 text-[#FFC400]" />
                ))}
             </div>
             <p className="text-[10px] font-bold text-muted-foreground mt-4">(254) Total Ulasan Pembeli</p>
          </Card>

          <Card className="md:col-span-8 border-border border-[1.5px] shadow-sm rounded-2xl bg-white p-6">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Distribusi Bintang</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-4 group">
                  <div className="flex items-center gap-1.5 w-8 shrink-0">
                    <Icon icon="ph:star-fill" className="w-3.5 h-3.5 text-[#FFC400]" />
                    <span className="text-[11px] font-black">{star}</span>
                  </div>
                  <Progress 
                    value={star === 5 ? 90 : star === 4 ? 7 : star === 3 ? 2 : star === 2 ? 1 : 0} 
                    className="h-2 rounded-full bg-muted" 
                  />
                  <span className="text-[10px] font-bold text-muted-foreground w-10 text-right opacity-60">
                    {star === 5 ? "230" : star === 4 ? "18" : star === 3 ? "4" : star === 2 ? "2" : "0"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Button variant="secondary" className="h-8 rounded-lg text-[10px] font-bold bg-[#00AA5B]/10 text-[#00AA5B] hover:bg-[#00AA5B]/20">Semua (254)</Button>
              <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground hover:bg-muted">Perlu Dibalas (12)</Button>
              <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground hover:bg-muted">Bintang 5</Button>
              <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground hover:bg-muted">Bintang 4</Button>
           </div>
           <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-48">
                 <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                 <Input placeholder="Cari ulasan..." className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20" />
              </div>
              <Select defaultValue="newest">
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

        {/* Reviews List */}
        <div className="space-y-4">
          {MOCK_REVIEWS.map((review) => (
            <Card key={review.id} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden hover:border-[#00AA5B]/30 transition-all">
               <CardContent className="p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                        <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                          {review.userName.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[12px] font-black">{review.userName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Icon 
                              key={i} 
                              icon="ph:star-fill" 
                              className={cn(
                                "w-2.5 h-2.5",
                                i < review.rating ? "text-[#FFC400]" : "text-muted-foreground opacity-20"
                              )} 
                            />
                          ))}
                          <span className="text-[9px] text-muted-foreground font-medium ml-1.5">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                       <Icon icon="ph:dots-three-vertical" className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-border/50 w-fit">
                       <div className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                          <Icon icon="ph:package" className="w-3.5 h-3.5 text-muted-foreground" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground max-w-[200px] truncate">
                          {review.productName}
                       </p>
                    </div>
                    <p className="text-[13px] text-[#2E3137] leading-relaxed font-medium">
                      "{review.comment}"
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
                          <button className="text-[9px] font-bold text-muted-foreground hover:text-[#00AA5B]">Edit</button>
                       </div>
                       <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                         "{review.reply}"
                       </p>
                    </div>
                  ) : (
                    <div className="pt-2">
                       <Button variant="outline" className="h-8 px-4 rounded-xl text-[10px] font-black border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B] hover:text-white transition-all gap-2">
                          <Icon icon="ph:arrow-bend-up-left" className="w-3.5 h-3.5" /> Balas Ulasan
                       </Button>
                    </div>
                  )}
               </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-6 pb-10">
          <Button variant="ghost" className="text-[11px] font-bold text-[#00AA5B] hover:bg-white">Tampilkan lebih banyak ulasan</Button>
        </div>
      </div>
    </main>
  );
}
