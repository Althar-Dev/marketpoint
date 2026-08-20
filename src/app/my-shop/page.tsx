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
  Plus, 
  ExternalLink,
  Wallet,
  History,
  ArrowRight,
  TrendingUp,
  ArrowUpRight
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
    return (
      <main className="flex-1 p-3 md:p-6 lg:p-8">
        <div className="max-w-screen-xl mx-auto space-y-5">
          <div className="flex justify-end gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!shop) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    <main className="flex-1 p-3 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-5 flex flex-col">
        
        {/* Atas: Action Bar */}
        <div className="flex justify-end gap-2 shrink-0">
          <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-[10px] gap-1.5 border-border hover:bg-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
          </Button>
          <Button className="h-8 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[10px] gap-1.5 shadow-sm border border-[#00AA5B] text-white">
            <Plus className="w-3.5 h-3.5" /> Tambah Produk
          </Button>
        </div>

        {/* Layout Grid Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Kolom Kiri (Statistik & Produk/Transaksi) */}
          <div className="lg:col-span-8 space-y-5 flex flex-col order-2 lg:order-1">
            
            {/* Statistik Hari Ini */}
            <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground tracking-wide">Statistik Hari Ini</CardTitle>
                <Link href="/my-shop/stats" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                  Detail <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "Pesanan", value: "0", color: "text-foreground" },
                     { label: "Saldo Tertahan", value: "Rp0", color: "text-orange-600" },
                     { label: "Saldo Masuk", value: "Rp0", color: "text-[#00AA5B]" },
                     { label: "Pelanggan Baru", value: "0", color: "text-foreground" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-3 rounded-lg bg-white border-[1.5px] border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-sm group">
                        <p className={cn("text-[12px] font-bold mb-0.5 tracking-tight", stat.color)}>{stat.value}</p>
                        <p className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid Baris Kedua: Produk & Transaksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Produk Terlaris */}
              <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white flex flex-col">
                <CardHeader className="p-4 border-b-[1.5px] border-border">
                  <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#00AA5B]" />
                        <CardTitle className="text-[11px] font-bold tracking-wide text-[#2E3137]">Produk Terlaris</CardTitle>
                      </div>
                      <Link href="/my-shop/products" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                        Kelola <ArrowUpRight className="w-3 h-3" />
                      </Link>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center flex-1">
                  <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground opacity-30" />
                  </div>
                  <h3 className="text-[11px] font-bold text-[#212121]">Belum Ada Data Produk</h3>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 leading-relaxed">
                    Promosikan produk Anda untuk melihat data penjualan di sini.
                  </p>
                </CardContent>
              </Card>

              {/* Transaksi Hari Ini */}
              <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white flex flex-col">
                <CardHeader className="p-4 border-b-[1.5px] border-border">
                  <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#00AA5B]" />
                        <CardTitle className="text-[11px] font-bold tracking-wide text-[#2E3137]">Transaksi Hari Ini</CardTitle>
                      </div>
                      <Link href="/my-shop/wallet" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                        Lihat Semua <ArrowUpRight className="w-3 h-3" />
                      </Link>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center flex-1">
                  <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                      <History className="w-5 h-5 text-muted-foreground opacity-30" />
                  </div>
                  <h3 className="text-[11px] font-bold text-[#212121]">Belum Ada Transaksi</h3>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 leading-relaxed">
                    Semua riwayat transaksi hari ini akan muncul secara otomatis di sini.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Kolom Kanan (Saldo) */}
          <div className="lg:col-span-4 flex flex-col order-1 lg:order-2">
            <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-[#00AA5B] text-white overflow-hidden relative h-fit">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-12 h-12" />
               </div>
               <CardContent className="p-4 relative z-10 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 opacity-90 mb-1">
                       <Wallet className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold">Saldo Penghasilan</span>
                    </div>
                    <p className="text-[15px] font-bold tracking-tight">
                       Rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                    </p>
                  </div>
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
          </div>
        </div>

      </div>
    </main>
  );
}
