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
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  if (!shop) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    <main className="flex-1 p-3 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-5">
        
        {/* Atas: Action Bar */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 px-3 rounded-lg font-bold text-[10px] gap-1.5 border-border hover:bg-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Lihat toko
          </Button>
          <Button className="h-8 px-3 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[10px] gap-1.5 shadow-sm border border-[#00AA5B] text-white">
            <Plus className="w-3.5 h-3.5" /> Tambah produk
          </Button>
        </div>

        {/* Baris 1: Saldo & Statistik */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Kiri: Statistik (Desktop: Lebar, Mobile: Tengah) */}
          <div className="order-2 lg:order-1 lg:col-span-8 space-y-5">
            <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-muted-foreground tracking-wide">Statistik hari ini</CardTitle>
                <Link href="/my-shop/stats" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                  Detail <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "Pesanan", value: "0", color: "text-foreground" },
                     { label: "Saldo tertahan", value: "Rp0", color: "text-orange-600" },
                     { label: "Saldo masuk", value: "Rp0", color: "text-[#00AA5B]" },
                     { label: "Pelanggan baru", value: "0", color: "text-foreground" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-3 rounded-lg bg-white border-[1.5px] border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-sm group">
                        <p className={cn("text-[12px] font-bold mb-0.5 tracking-tight", stat.color)}>{stat.value}</p>
                        <p className="text-[9px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanan: Saldo (Desktop: Samping, Mobile: Paling Atas) */}
          <div className="order-1 lg:order-2 lg:col-span-4">
            <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-[#00AA5B] text-white overflow-hidden relative h-full">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-12 h-12" />
               </div>
               <CardContent className="p-4 relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 opacity-90 mb-1">
                       <Wallet className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold">Saldo penghasilan</span>
                    </div>
                    <p className="text-[15px] font-bold mb-4 tracking-tight">
                       Rp{wallet?.balance?.toLocaleString('id-ID') || 0}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                     <Button variant="secondary" className="h-8 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[10px]">
                        Tarik saldo
                     </Button>
                     <Button variant="secondary" className="h-8 rounded-lg bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[10px]">
                        Riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>
          </div>
        </div>

        {/* Baris 2: Produk & Transaksi (Desktop: Side-by-side, Mobile: Produk lalu Transaksi) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Produk Terlaris */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white flex flex-col">
            <CardHeader className="p-4 border-b-[1.5px] border-border">
               <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00AA5B]" />
                    <CardTitle className="text-[11px] font-bold tracking-wide text-[#2E3137]">Produk terlaris</CardTitle>
                  </div>
                  <Link href="/my-shop/products" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                    Kelola <ArrowUpRight className="w-3 h-3" />
                  </Link>
               </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center flex-1">
               <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                  <ShoppingBag className="w-6 h-6 text-muted-foreground opacity-30" />
               </div>
               <h3 className="text-[11px] font-bold text-[#212121]">Belum ada data produk</h3>
               <p className="text-[10px] text-muted-foreground max-w-[220px] mt-1 leading-relaxed">
                 Promosikan produk Anda untuk melihat data penjualan di sini.
               </p>
            </CardContent>
          </Card>

          {/* Transaksi Terbaru */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-xl bg-white flex flex-col">
            <CardHeader className="p-4 border-b-[1.5px] border-border">
               <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#00AA5B]" />
                    <CardTitle className="text-[11px] font-bold tracking-wide text-[#2E3137]">Transaksi terbaru</CardTitle>
                  </div>
                  <Link href="/my-shop/wallet" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                    Lihat semua <ArrowUpRight className="w-3 h-3" />
                  </Link>
               </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center flex-1">
               <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-4 border-[1.5px] border-border">
                  <History className="w-6 h-6 text-muted-foreground opacity-30" />
               </div>
               <h3 className="text-[11px] font-bold text-[#212121]">Belum ada transaksi</h3>
               <p className="text-[10px] text-muted-foreground max-w-[220px] mt-1 leading-relaxed">
                 Semua riwayat transaksi penjualan Anda akan muncul di sini.
               </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}