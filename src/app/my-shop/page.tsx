"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  ExternalLink,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Wallet
} from "lucide-react";
import Link from "next/link";

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
      router.replace("/my-shop/setup");
    }
  }, [userData, userLoading, shop, shopLoading, user, authLoading, router, mounted]);

  if (!mounted || authLoading || userLoading || shopLoading || !user) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  if (!shop) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    <main className="flex-1 p-3 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-4">
        
        {/* Quick Actions Row */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-[10px] gap-1.5 border-border/60">
            <ExternalLink className="w-3 h-3" /> lihat toko
          </Button>
          <Button className="h-8 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[10px] gap-1.5 shadow-sm">
            <Plus className="w-3 h-3" /> tambah produk
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <div className="lg:col-span-8 space-y-4">
            
            {/* Order Status Cards */}
            <Card className="border-none shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">statistik hari ini</CardTitle>
                <Link href="#" className="text-[10px] font-bold text-[#00AA5B] hover:underline">detail</Link>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "pesanan baru", value: "0", color: "text-foreground" },
                     { label: "siap dikirim", value: "0", color: "text-foreground" },
                     { label: "komplain", value: "0", color: "text-destructive" },
                     { label: "chat baru", value: "0", color: "text-[#00AA5B]" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-transparent hover:border-[#00AA5B]/10 transition-all cursor-pointer">
                        <p className="text-lg font-black mb-0.5 text-[#212121]">{stat.value}</p>
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
                      <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground/80">produk terlaris</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5">
                      kelola produk
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                 <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground opacity-20" />
                 </div>
                 <h3 className="text-[11px] font-bold text-[#212121]">belum ada data penjualan</h3>
                 <p className="text-[9px] text-muted-foreground max-w-[200px] mt-0.5 leading-relaxed">
                   promosikan produkmu untuk mendapatkan pesanan pertama.
                 </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
             
             {/* Wallet Card */}
             <Card className="border-none shadow-md rounded-xl bg-[#00AA5B] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Wallet className="w-12 h-12" />
               </div>
               <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
                     <Wallet className="w-3 h-3" />
                     <span className="text-[9px] font-bold tracking-wider">saldo penghasilan</span>
                  </div>
                  <p className="text-xl font-black mb-4 tracking-tighter">
                     rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <Button variant="secondary" className="h-7 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        tarik saldo
                     </Button>
                     <Button variant="secondary" className="h-7 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>

             {/* Merchant Tips */}
             <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
               <div className="p-1 bg-[#8B5CF6]/5 flex items-center justify-center gap-2 text-[8px] font-bold text-[#8B5CF6] tracking-widest">
                  <AlertCircle className="w-3 h-3" /> info seller
               </div>
               <CardContent className="p-4">
                  <div className="space-y-3">
                     <div className="flex gap-2.5 items-start group cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold leading-none text-[#212121] group-hover:text-[#00AA5B] transition-colors">respon chat cepat</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">balas chat pembeli secepat mungkin.</p>
                        </div>
                     </div>
                     <div className="flex gap-2.5 items-start group cursor-pointer pt-3 border-t border-border/50">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                           <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold leading-none text-[#212121] group-hover:text-[#00AA5B] transition-colors">pantau statistik</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">lihat perkembangan kunjungan toko.</p>
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
