"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  ChevronRight,
  ShieldCheck,
  Info
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserWalletPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const transactionQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: transactions, loading: transLoading } = useCollection(transactionQuery);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (!mounted || authLoading || (user && walletLoading)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body">
        <MarketHeader />
        <main className="flex-1 pt-24 pb-20 max-w-screen-xl mx-auto w-full px-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
           </div>
           <Skeleton className="h-64 mt-8 rounded-3xl" />
        </main>
        <MarketFooter />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      
      <main className="flex-1 w-full pt-20 md:pt-28 pb-20 max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
           <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black font-headline tracking-tight">Saldo & MCoins</h1>
              <p className="text-[10px] md:text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Pusat Keuangan MarketPoint Anda</p>
           </div>
           <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white hover:bg-muted/50 transition-all">
             <History className="w-3.5 h-3.5" /> Riwayat Transaksi
           </Button>
        </div>

        {/* Balance Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
           
           {/* Kartu Saldo Belanja (Green) */}
           <Card className="border-none shadow-xl bg-[#00AA5B] text-white overflow-hidden relative group rounded-[2rem]">
              {/* Subtle background icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/wallet.png" className="w-36 h-36" alt="" />
              </div>
              
              <CardContent className="p-8 md:p-10 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                       <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center p-1.5">
                          <img src="/assets/icon/wallet.png" className="w-full h-full" alt="" />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-90">Saldo Belanja</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-xl font-bold opacity-80">Rp</span>
                       <p className="text-5xl font-black tracking-tighter">
                          {wallet?.balance?.toLocaleString('id-ID') || 0}
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-6 mt-8">
                    <Button className="h-11 px-8 rounded-full bg-white text-[#00AA5B] hover:bg-white/95 font-black text-[12px] gap-2 shadow-lg shadow-black/5 transition-transform active:scale-95">
                       <Plus className="w-4 h-4 stroke-[3px]" /> Top Up Saldo
                    </Button>
                    <button className="text-[11px] font-black tracking-wide opacity-90 hover:opacity-100 flex items-center gap-1.5 transition-all group/link">
                       Tarik Dana <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                 </div>
              </CardContent>
           </Card>

           {/* Kartu MCoins Rewards (Dark) */}
           <Card className="border-none shadow-xl bg-gradient-to-br from-[#2E3137] to-[#1A1C1F] text-white overflow-hidden relative group rounded-[2rem]">
              {/* Subtle background icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/mcoins.png" className="w-36 h-36" alt="" />
              </div>

              <CardContent className="p-8 md:p-10 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                       <div className="h-7 w-7 rounded-full bg-[#FFC400]/20 flex items-center justify-center p-1.5">
                          <img src="/assets/icon/mcoins.png" className="w-full h-full" alt="" />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FFC400]">Mcoin Rewards</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-5xl font-black tracking-tighter text-[#FFC400]">0</p>
                       <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">MCoins</span>
                    </div>
                 </div>

                 <div className="space-y-5 mt-8">
                    <div className="flex items-start gap-2.5 max-w-[280px]">
                       <Info className="w-3.5 h-3.5 text-[#FFC400] shrink-0 mt-0.5" />
                       <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                          Kumpulkan MCoins dari setiap pembelian produk berlabel cashback untuk digunakan belanja kembali.
                       </p>
                    </div>
                    <button className="text-[11px] font-black text-[#FFC400] hover:text-[#FFD54F] flex items-center gap-1.5 transition-all group/link">
                       Tukar Poin <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-5">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-[#2E3137]">Aktivitas Terakhir</h2>
              <Link href="#" className="text-[11px] font-bold text-[#00AA5B] hover:underline">Lihat Semua</Link>
           </div>

           <Card className="border-border border-[1.5px] shadow-sm rounded-[1.5rem] bg-white overflow-hidden">
              <CardContent className="p-0">
                 {transLoading ? (
                    <div className="p-8 space-y-4">
                       {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
                    </div>
                 ) : transactions && transactions.length > 0 ? (
                    <div className="divide-y divide-border/40">
                       {transactions.map((t: any) => (
                          <div key={t.id} className="p-5 md:p-6 flex items-center justify-between hover:bg-[#F8FAFC] transition-all cursor-pointer group">
                             <div className="flex items-center gap-5">
                                <div className={cn(
                                   "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-[1.5px] transition-transform group-hover:scale-105",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5px]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5px]" />}
                                </div>
                                <div>
                                   <p className="text-[13px] font-black text-[#2E3137] tracking-tight">{t.description || "Transaksi"}</p>
                                   <div className="flex items-center gap-2.5 mt-1">
                                      <span className="text-[10px] text-muted-foreground font-bold uppercase">
                                         {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/30">•</span>
                                      <Badge variant="outline" className={cn(
                                         "text-[9px] font-black px-2 py-0.5 rounded-md border-none",
                                         t.status === 'SUCCESS' ? "bg-green-100 text-green-700" : t.status === 'PENDING' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                      )}>
                                         {t.status}
                                      </Badge>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={cn(
                                   "text-[15px] font-black tracking-tight",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} Rp {t.amount?.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">ID: {t.id.substring(0, 8)}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-20 flex flex-col items-center justify-center text-center space-y-5">
                       <div className="h-20 w-20 bg-muted/20 rounded-[2.5rem] flex items-center justify-center border border-border/50">
                          <History className="w-10 h-10 text-muted-foreground opacity-30" />
                       </div>
                       <div className="space-y-1.5">
                          <h3 className="text-sm font-black text-[#2E3137]">Belum Ada Aktivitas</h3>
                          <p className="text-[11px] text-muted-foreground max-w-[260px] leading-relaxed font-medium">
                             Segala transaksi belanja dan top-up akan tercatat secara otomatis di sini.
                          </p>
                       </div>
                       <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-[11px] text-white">Mulai Belanja</Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* Security Info */}
        <div className="mt-16 p-8 rounded-[2.5rem] bg-white border border-border border-dashed flex flex-col md:flex-row items-center gap-8 text-center md:text-left transition-all hover:border-[#00AA5B]/40">
           <div className="h-14 w-14 rounded-2xl bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#00AA5B]" />
           </div>
           <div className="flex-1 space-y-2">
              <h4 className="text-[13px] font-black text-[#2E3137] uppercase tracking-[0.1em]">Transaksi Aman & Terproteksi</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-2xl">
                 Setiap transaksi di MarketPoint menggunakan sistem enkripsi tingkat tinggi. Dana belanja Anda baru akan diteruskan ke penjual setelah Anda mengonfirmasi pesanan diterima dengan benar.
              </p>
           </div>
           <Button variant="ghost" className="text-[11px] font-black text-[#00AA5B] hover:bg-[#00AA5B]/5 px-6 rounded-xl">Pelajari Proteksi</Button>
        </div>

      </main>

      <MarketFooter />
    </div>
  );
}
