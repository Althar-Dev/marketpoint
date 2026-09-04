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
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Star
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!shop) return <div className="min-h-screen bg-[#F8FAFC]" />;

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Atas: Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Ringkasan Toko</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pantau performa dan kelola operasional toko Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border hover:bg-white">
              <Link href={`/${shop.slug}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
              </Link>
            </Button>
            <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[11px] gap-2 shadow-sm border border-[#00AA5B] text-white">
              <Plus className="w-3.5 h-3.5" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Baris Utama: Statistik & Saldo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Statistik Hari Ini (Kiri) */}
          <div className="lg:col-span-8">
            <Card className="h-full border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between border-none">
                <div className="space-y-0.5">
                  <CardTitle className="text-[13px] font-bold text-[#2E3137]">Statistik Hari Ini</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-medium">Update real-time performa toko.</p>
                </div>
                <Link href="/my-shop/stats" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                  Detail <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: "Pesanan Baru", value: "0", color: "text-foreground", sub: "Menunggu diproses" },
                     { label: "Saldo Tertahan", value: "Rp0", color: "text-orange-600", sub: "Proses verifikasi" },
                     { label: "Pendapatan", value: "Rp0", color: "text-[#00AA5B]", sub: "Hari ini" },
                     { label: "Pengunjung", value: "0", color: "text-foreground", sub: "Trafik toko" },
                   ].map((stat, idx) => (
                     <div key={idx} className="p-4 rounded-xl bg-white border-[1.5px] border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-sm group">
                        <p className={cn("text-[15px] font-black mb-0.5 tracking-tight", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] font-bold text-[#2E3137]">{stat.label}</p>
                        <p className="text-[8px] text-muted-foreground mt-0.5 opacity-60 font-medium">{stat.sub}</p>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saldo Penghasilan (Kanan) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Wallet className="w-16 h-16" />
               </div>
               <CardContent className="p-6 relative z-10 flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 opacity-90 mb-1.5">
                       <Wallet className="w-4 h-4" />
                       <span className="text-[11px] font-bold tracking-wider">SALDO PENGHASILAN</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium">Rp</span>
                      <p className="text-3xl font-black tracking-tighter">
                         {wallet?.balance?.toLocaleString('id-ID') || 0}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <Button variant="secondary" className="h-9 rounded-xl bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[11px]">
                        Tarik Saldo
                     </Button>
                     <Button variant="secondary" className="h-9 rounded-xl bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[11px]">
                        Riwayat
                     </Button>
                  </div>
               </CardContent>
             </Card>

             {/* Kartu Tambahan Biar Ga Kosong */}
             <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#2E3137]">Status Toko</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-[#00AA5B] animate-pulse"></div>
                       <span className="text-[10px] text-muted-foreground font-bold">Aktif & Terverifikasi</span>
                    </div>
                  </div>
                </div>
             </Card>
          </div>
        </div>

        {/* Baris Kedua: Produk & Transaksi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Produk Terlaris */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white flex flex-col">
            <CardHeader className="p-5 border-b-[1.5px] border-border/50">
              <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#FFC400]/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[#FFC400]" />
                    </div>
                    <div>
                      <CardTitle className="text-[12px] font-bold text-[#2E3137]">Produk Terlaris</CardTitle>
                      <p className="text-[9px] text-muted-foreground font-medium">Top 5 produk performa terbaik.</p>
                    </div>
                  </div>
                  <Link href="/my-shop/products" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                    Kelola <ArrowUpRight className="w-3 h-3" />
                  </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center flex-1">
              <div className="w-14 h-14 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border-[1.5px] border-border">
                  <ShoppingBag className="w-6 h-6 text-muted-foreground opacity-30" />
              </div>
              <h3 className="text-[12px] font-bold text-[#212121]">Belum Ada Data Produk</h3>
              <p className="text-[10px] text-muted-foreground max-w-[240px] mt-1.5 leading-relaxed font-medium">
                Data penjualan produk Anda akan muncul di sini setelah pesanan berhasil diselesaikan.
              </p>
              <Button asChild variant="outline" className="mt-6 h-8 px-5 rounded-lg text-[10px] font-bold border-border">
                <Link href="/my-shop/products">Tambah Produk Pertama</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Transaksi Terbaru */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white flex flex-col">
            <CardHeader className="p-5 border-b-[1.5px] border-border/50">
              <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center">
                      <History className="w-4 h-4 text-[#00AA5B]" />
                    </div>
                    <div>
                      <CardTitle className="text-[12px] font-bold text-[#2E3137]">Aktivitas Transaksi</CardTitle>
                      <p className="text-[9px] text-muted-foreground font-medium">Riwayat pembayaran masuk & keluar.</p>
                    </div>
                  </div>
                  <Link href="/my-shop/wallet" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-0.5">
                    Lihat Semua <ArrowUpRight className="w-3 h-3" />
                  </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center flex-1">
              <div className="w-14 h-14 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border-[1.5px] border-border">
                  <Zap className="w-6 h-6 text-muted-foreground opacity-30" />
              </div>
              <h3 className="text-[12px] font-bold text-[#212121]">Belum Ada Transaksi</h3>
              <p className="text-[10px] text-muted-foreground max-w-[240px] mt-1.5 leading-relaxed font-medium">
                Semua catatan arus kas toko Anda akan tercatat secara otomatis di sini.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}
