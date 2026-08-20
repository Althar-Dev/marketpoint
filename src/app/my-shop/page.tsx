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
  Wallet,
  Users
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-[10px] gap-1.5 border-border hover:bg-white">
            <ExternalLink className="w-3 h-3" /> Lihat Toko
          </Button>
          <Button className="h-8 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[10px] gap-1.5 shadow-sm">
            <Plus className="w-3 h-3" /> Tambah Produk
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <div className="lg:col-span-8 space-y-4">
            
            <Card className="border-border shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Statistik Hari Ini</CardTitle>
                <Link href="#" className="text-[10px] font-bold text-[#00AA5B] hover:underline">Detail</Link>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "Pesanan", value: "0", color: "text-foreground" },
                     { label: "Saldo Tertahan", value: "Rp0", color: "text-orange-600" },
                     { label: "Saldo Masuk", value: "Rp0", color: "text-[#00AA5B]" },
                     { label: "Pelanggan Baru", value: "0", color: "text-foreground" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-3 rounded-lg bg-white border border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-sm group">
                        <p className={cn("text-lg font-black mb-0.5 tracking-tighter", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 border-b border-border">
                 <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[#00AA5B]" />
                      <CardTitle className="text-[10px] font-bold tracking-wider text-muted-foreground">Produk Terlaris</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5">
                      Kelola Produk
                    </Button>
                 </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                 <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center mb-3 border border-border">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground opacity-20" />
                 </div>
                 <h3 className="text-[11px] font-bold text-[#212121]">Belum Ada Data Penjualan</h3>
                 <p className="text-[9px] text-muted-foreground max-w-[200px] mt-0.5 leading-relaxed">
                   Promosikan produkmu untuk mendapatkan pesanan pertama.
                 </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
             
             <Card className="border border-border shadow-md rounded-xl bg-[#00AA5B] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Wallet className="w-12 h-12" />
               </div>
               <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
                     <Wallet className="w-3 h-3" />
                     <span className="text-[9px] font-bold tracking-wider">Saldo Penghasilan</span>
                  </div>
                  <p className="text-xl font-black mb-4 tracking-tighter">
                     Rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                     <Button variant="secondary" className="h-7 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        Tarik Saldo
                     </Button>
                     <Button variant="secondary" className="h-7 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[9px]">
                        Riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>

             <Card className="border border-border shadow-sm rounded-xl bg-white overflow-hidden">
               <div className="p-1 bg-[#8B5CF6]/5 border-b border-border flex items-center justify-center gap-2 text-[8px] font-bold text-[#8B5CF6] tracking-widest uppercase">
                  <AlertCircle className="w-3 h-3" /> Info Seller
               </div>
               <CardContent className="p-4">
                  <div className="space-y-3">
                     <div className="flex gap-2.5 items-start group cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold leading-none text-[#212121] group-hover:text-[#00AA5B] transition-colors">Respon Chat Cepat</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Balas chat pembeli secepat mungkin.</p>
                        </div>
                     </div>
                     <div className="flex gap-2.5 items-start group cursor-pointer pt-3 border-t border-border">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                           <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold leading-none text-[#212121] group-hover:text-[#00AA5B] transition-colors">Pantau Statistik</p>
                           <p className="text-[9px] text-muted-foreground mt-1 leading-normal">Lihat perkembangan kunjungan toko.</p>
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
