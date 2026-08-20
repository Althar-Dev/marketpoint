"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  Settings, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Wallet,
  Store,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MerchantDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ambil data user
  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  // Ambil data toko
  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  // Ambil data wallet
  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Pengalihan (Redirect)
  useEffect(() => {
    if (!mounted || authLoading || userLoading || shopLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const hasShopFlag = userData?.hasShop === true;
    const hasShopDoc = !!shop;

    if (!hasShopFlag && !hasShopDoc) {
      console.log("No shop detected, redirecting to setup...");
      router.push("/my-shop/setup");
    }
  }, [userData, userLoading, shop, shopLoading, user, authLoading, router, mounted]);

  if (!mounted || authLoading || userLoading || shopLoading || !user) {
    return (
      <div className="p-8 space-y-4 w-full">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  // Jika data toko belum ada, jangan render dashboard dulu (biarkan useEffect handle redirect)
  if (!shop) return null;

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Penjual</h1>
            <p className="text-sm text-muted-foreground">Kelola operasional dan pantau pertumbuhan toko Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-xs gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
            </Button>
            <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Shop Hero Card */}
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="relative h-32 md:h-48 bg-muted/30">
            {shop.bannerUrl ? (
              <Image src={shop.bannerUrl} alt="Banner" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#00AA5B]/10 flex items-center justify-center">
                <Store className="w-12 h-12 text-[#00AA5B] opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white p-1 border-2 border-white/20 shadow-xl overflow-hidden relative">
                  {shop.logoUrl ? (
                    <Image src={shop.logoUrl} alt="Logo" fill className="object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center rounded-xl">
                      <span className="text-2xl font-black">{shop.name?.substring(0, 1) || "?"}</span>
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight leading-none mb-1">{shop.name}</h2>
                  <p className="text-[10px] md:text-xs font-medium opacity-80 flex items-center gap-1.5">
                    marketpoint.id/{shop.slug} <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Performance */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Order Status Cards */}
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-[13px] font-black uppercase tracking-widest text-muted-foreground/50">Statistik Hari Ini</CardTitle>
                <Link href="#" className="text-xs font-bold text-[#00AA5B] hover:underline">Detail</Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: "Pesanan Baru", value: "0", color: "text-foreground" },
                     { label: "Siap Dikirim", value: "0", color: "text-foreground" },
                     { label: "Komplain", value: "0", color: "text-red-500" },
                     { label: "Chat Baru", value: "0", color: "text-[#00AA5B]" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-transparent hover:border-[#00AA5B]/20 transition-all cursor-pointer">
                        <p className="text-2xl font-black mb-1 truncate">{stat.value}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-tight ${stat.color} opacity-70`}>{stat.label}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products Placeholder */}
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-2 border-b border-border/50">
                 <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#00AA5B]" />
                      <CardTitle className="text-[13px] font-black uppercase tracking-widest">Produk Terlaris</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5">
                      Kelola Produk
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                 <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-30" />
                 </div>
                 <h3 className="text-sm font-bold text-foreground">Belum ada data penjualan</h3>
                 <p className="text-xs text-muted-foreground max-w-[240px] mt-1 leading-relaxed">
                   Tingkatkan promosi produk Anda untuk mulai mendapatkan pesanan pertama.
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Wallet & Tips */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Wallet Card */}
             <Card className="border-none shadow-md rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-24 h-24" />
               </div>
               <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-2 opacity-80 mb-1">
                     <Wallet className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Saldo Penghasilan</span>
                  </div>
                  <p className="text-3xl font-black mb-4 tracking-tighter">
                     Rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <Button variant="secondary" className="h-8 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[10px]">
                        Tarik Saldo
                     </Button>
                     <Button variant="secondary" className="h-8 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[10px]">
                        Riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>

             {/* Merchant Tips */}
             <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
               <div className="p-1 bg-[#8B5CF6]/10 flex items-center justify-center gap-2 text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3" /> Info Seller
               </div>
               <CardContent className="p-5">
                  <div className="space-y-4">
                     <div className="flex gap-3 items-start group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                           <p className="text-xs font-bold leading-snug group-hover:text-[#00AA5B] transition-colors">Respon Chat Cepat</p>
                           <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Balas chat pembeli dengan cepat untuk meningkatkan skor toko.</p>
                        </div>
                     </div>
                     <div className="flex gap-3 items-start group cursor-pointer pt-4 border-t border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                           <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-xs font-bold leading-snug group-hover:text-[#00AA5B] transition-colors">Pantau Statistik</p>
                           <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Lihat perkembangan kunjungan toko Anda setiap hari.</p>
                        </div>
                     </div>
                  </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
