"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
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

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Authentication Redirect
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  // Handle Shop Setup Redirect - Diperketat agar tidak terjadi race condition
  useEffect(() => {
    if (mounted && !authLoading && user && !shopLoading && shopRef) {
      if (shop === null) {
        console.log("Shop not found, redirecting to setup...");
        router.push("/my-shop/setup");
      }
    }
  }, [shop, shopLoading, user, authLoading, router, mounted, shopRef]);

  if (!mounted || authLoading || shopLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <div className="p-8 space-y-4 max-w-screen-xl mx-auto w-full">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Jika data toko belum ada, jangan render dashboard dulu (biarkan useEffect handle redirect)
  if (!shop) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>

      <main className="flex-1 lg:pt-24 pb-24 lg:pb-12">
        <div className="max-w-screen-xl mx-auto px-4">
          
          {/* Mobile Back Header */}
          <div className="lg:hidden flex items-center gap-3 py-4 sticky top-0 bg-[#F8FAFC] z-40">
            <Link href="/profile" className="p-1 hover:bg-muted rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold">Kelola Toko</h1>
          </div>

          {/* Shop Hero Card */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white mb-6">
            <div className="relative h-28 md:h-48 bg-muted/30">
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
                    <h2 className="text-lg md:text-2xl font-bold font-headline tracking-tight leading-none mb-1">{shop.name}</h2>
                    <p className="text-[10px] md:text-xs font-medium opacity-80 flex items-center gap-1.5">
                      marketpoint.id/{shop.slug} <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex gap-2 mb-1">
                   <Button variant="outline" className="h-9 px-4 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-xs gap-2">
                     <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
                   </Button>
                   <Button asChild className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 border-none">
                     <Link href="/my-shop/setup"><Settings className="w-3.5 h-3.5" /> Edit Info</Link>
                   </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Stats & Performance */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Quick Action Mobile Only */}
              <div className="grid grid-cols-3 gap-3 md:hidden">
                 <Button variant="outline" className="flex-col h-auto py-3 rounded-2xl border-none shadow-sm bg-white gap-2">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                       <Plus className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Produk</span>
                 </Button>
                 <Button variant="outline" className="flex-col h-auto py-3 rounded-2xl border-none shadow-sm bg-white gap-2">
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
                       <ShoppingBag className="w-4.5 h-4.5 text-orange-600" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Pesanan</span>
                 </Button>
                 <Button variant="outline" className="flex-col h-auto py-3 rounded-2xl border-none shadow-sm bg-white gap-2">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                       <TrendingUp className="w-4.5 h-4.5 text-green-600" />
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Laporan</span>
                 </Button>
              </div>

              {/* Order Status Cards */}
              <Card className="border-none shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Penting Hari Ini</CardTitle>
                  <Link href="#" className="text-xs font-bold text-[#00AA5B] hover:underline">Detail</Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { label: "Pesanan Baru", value: "0", color: "text-[#212121]" },
                       { label: "Siap Dikirim", value: "0", color: "text-[#212121]" },
                       { label: "Pesanan Dikomplain", value: "0", color: "text-red-500" },
                       { label: "Chat Baru", value: "0", color: "text-[#00AA5B]" },
                     ].map((stat, idx) => (
                       <div key={idx} className="p-4 rounded-xl bg-muted/20 border border-transparent hover:border-[#00AA5B]/20 transition-all cursor-pointer">
                          <p className="text-2xl font-black mb-1 font-headline truncate">{stat.value}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-tight ${stat.color} opacity-70`}>{stat.label}</p>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activity / Latest Products Placeholder */}
              <Card className="border-none shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-2 border-b border-border/50">
                   <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#00AA5B]" />
                        <CardTitle className="text-[13px] font-bold uppercase tracking-wider">Produk Terlaris</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5">
                        Kelola Semua
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-30" />
                   </div>
                   <h3 className="text-sm font-bold text-foreground">Belum ada produk terlaris</h3>
                   <p className="text-xs text-muted-foreground max-w-[240px] mt-1 leading-relaxed">
                     Mulai tambahkan produk digital Anda dan tingkatkan penjualan sekarang!
                   </p>
                   <Button className="mt-6 h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold px-8 text-xs">
                      Tambah Produk Pertama
                   </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Wallet & Store Info */}
            <div className="lg:col-span-4 space-y-6">
               
               {/* Wallet Card */}
               <Card className="border-none shadow-md rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24" />
                 </div>
                 <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                       <Wallet className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Saldo Toko</span>
                    </div>
                    <p className="text-3xl font-black font-headline mb-4 tracking-tighter">
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

               {/* Store Health / Tips */}
               <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                 <div className="p-1 bg-[#8B5CF6]/10 flex items-center justify-center gap-2 text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3" /> Tips Jualan
                 </div>
                 <CardContent className="p-5">
                    <div className="space-y-4">
                       <div className="flex gap-3 items-start group cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                             <MessageSquare className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                             <p className="text-xs font-bold leading-snug group-hover:text-[#00AA5B] transition-colors">Optimasi Balas Chat</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Balas chat pembeli <span className="font-bold">dibawah 5 menit</span> meningkatkan konversi hingga 2x lipat.</p>
                          </div>
                       </div>
                       <div className="flex gap-3 items-start group cursor-pointer pt-4 border-t border-border/50">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                             <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                             <p className="text-xs font-bold leading-snug group-hover:text-[#00AA5B] transition-colors">Kelola Stok Otomatis</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Gunakan fitur <span className="font-bold">API Bridge</span> untuk pengiriman solusi digital instan.</p>
                          </div>
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </div>

          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <MarketFooter />
      </div>
      <MarketBottomNav />
    </div>
  );
}
