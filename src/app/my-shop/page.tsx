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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Wallet,
  Store
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MerchantDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);
  const { data: wallet } = useDoc(walletRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || userLoading || shopLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const hasShopFlag = userData?.hasShop === true;
    const hasShopDoc = !!shop;

    if (!hasShopFlag && !hasShopDoc) {
      router.push("/my-shop/setup");
    }
  }, [userData, userLoading, shop, shopLoading, user, authLoading, router, mounted]);

  if (!mounted || authLoading || userLoading || shopLoading || !user) {
    return (
      <div className="p-4 md:p-8 space-y-4 w-full">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <main className="flex-1 p-3 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-5">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard penjual</h1>
            <p className="text-xs text-muted-foreground">Kelola operasional dan pantau pertumbuhan toko.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-[10px] gap-1.5">
              <ExternalLink className="w-3 h-3" /> Lihat toko
            </Button>
            <Button className="h-8 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[10px] gap-1.5 shadow-sm">
              <Plus className="w-3 h-3" /> Tambah produk
            </Button>
          </div>
        </div>

        {/* Shop Hero Card */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="relative h-24 md:h-40 bg-muted/30">
            {shop.bannerUrl ? (
              <Image src={shop.bannerUrl} alt="Banner" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#00AA5B]/5 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00AA5B] opacity-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl bg-white p-0.5 border border-white/20 shadow-lg overflow-hidden relative">
                  {shop.logoUrl ? (
                    <Image src={shop.logoUrl} alt="Logo" fill className="object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center rounded-lg">
                      <span className="text-xl font-black">{shop.name?.substring(0, 1) || "?"}</span>
                    </div>
                  )}
                </div>
                <div className="pb-0.5">
                  <h2 className="text-base md:text-xl font-bold tracking-tight leading-tight">{shop.name}</h2>
                  <p className="text-[9px] md:text-xs font-medium opacity-80 flex items-center gap-1">
                    marketpoint.id/{shop.slug} <ChevronRight className="w-2.5 h-2.5" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Stats & Performance */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Order Status Cards */}
            <Card className="border-none shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground/60 tracking-wider">Statistik hari ini</CardTitle>
                <Link href="#" className="text-[10px] font-bold text-[#00AA5B] hover:underline">Detail</Link>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "Pesanan baru", value: "0", color: "text-foreground" },
                     { label: "Siap dikirim", value: "0", color: "text-foreground" },
                     { label: "Komplain", value: "0", color: "text-red-500" },
                     { label: "Chat baru", value: "0", color: "text-[#00AA5B]" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-transparent hover:border-[#00AA5B]/10 transition-all cursor-pointer">
                        <p className="text-xl font-black mb-0.5">{stat.value}</p>
                        <p className={`text-[9px] font-bold ${stat.color} opacity-60`}>{stat.label}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products Placeholder */}
            <Card className="border-none shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 border-b border-border/50">
                 <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[#00AA5B]" />
                      <CardTitle className="text-[11px] font-bold tracking-wider text-muted-foreground/80">Produk terlaris</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5">
                      Kelola produk
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                 <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                    <ShoppingBag className="w-6 h-6 text-muted-foreground opacity-20" />
                 </div>
                 <h3 className="text-[11px] font-bold text-foreground">Belum ada data penjualan</h3>
                 <p className="text-[10px] text-muted-foreground max-w-[200px] mt-0.5 leading-relaxed">
                   Promosikan produkmu untuk mendapatkan pesanan pertama.
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Wallet & Tips */}
          <div className="lg:col-span-4 space-y-5">
             
             {/* Wallet Card */}
             <Card className="border-none shadow-md rounded-xl bg-[#00AA5B] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Wallet className="w-16 h-16" />
               </div>
               <CardContent className="p-5 relative z-10">
                  <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
                     <Wallet className="w-3 h-3" />
                     <span className="text-[10px] font-bold tracking-wider">Saldo penghasilan</span>
                  </div>
                  <p className="text-2xl font-black mb-4 tracking-tighter">
                     Rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <Button variant="secondary" className="h-7 rounded-md bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        Tarik saldo
                     </Button>
                     <Button variant="secondary" className="h-7 rounded-md bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        Riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>

             {/* Merchant Tips */}
             <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
               <div className="p-1 bg-[#8B5CF6]/5 flex items-center justify-center gap-2 text-[9px] font-bold text-[#8B5CF6] tracking-widest">
                  <AlertCircle className="w-3 h-3" /> Info seller
               </div>
               <CardContent className="p-4">
                  <div className="space-y-3.5">
                     <div className="flex gap-2.5 items-start group cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div>
                           <p className="text-[11px] font-bold leading-none group-hover:text-[#00AA5B] transition-colors">Respon chat cepat</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Balas chat pembeli secepat mungkin untuk menaikkan skor.</p>
                        </div>
                     </div>
                     <div className="flex gap-2.5 items-start group cursor-pointer pt-3 border-t border-border/50">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                           <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-[11px] font-bold leading-none group-hover:text-[#00AA5B] transition-colors">Pantau statistik</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Lihat perkembangan kunjungan toko setiap hari.</p>
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
