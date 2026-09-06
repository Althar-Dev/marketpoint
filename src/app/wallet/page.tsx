
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit, where } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
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
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
           </div>
           <Skeleton className="h-64 mt-8 rounded-2xl" />
        </main>
        <MarketFooter />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      
      <main className="flex-1 w-full pt-20 md:pt-28 pb-20 max-w-screen-xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
           <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black font-headline tracking-tight">Saldo & MCoin</h1>
              <p className="text-[11px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">Pusat Keuangan MarketPoint Anda</p>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white">
                <History className="w-3.5 h-3.5" /> Riwayat Transaksi
              </Button>
           </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           {/* Saldo Rupiah */}
           <Card className="border-none shadow-xl bg-gradient-to-br from-[#00AA5B] to-[#008F4C] text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <Wallet className="w-32 h-32" />
              </div>
              <CardContent className="p-6 md:p-8 relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                 <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Wallet className="w-3 h-3 text-white fill-white" />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-90">Saldo Belanja</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-lg font-bold">Rp</span>
                       <p className="text-4xl font-black tracking-tighter">
                          {wallet?.balance?.toLocaleString('id-ID') || 0}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 mt-6">
                    <Button className="h-9 px-6 rounded-xl bg-white text-[#00AA5B] hover:bg-white/90 font-black text-[11px] gap-2">
                       <Plus className="w-3.5 h-3.5" /> Top Up Saldo
                    </Button>
                    <button className="text-[11px] font-bold opacity-80 hover:opacity-100 flex items-center gap-1 transition-opacity">
                       Tarik Dana <ArrowUpRight className="w-3 h-3" />
                    </button>
                 </div>
              </CardContent>
           </Card>

           {/* MCoin Card */}
           <Card className="border-none shadow-xl bg-gradient-to-br from-[#2E3137] to-[#1A1C1F] text-white overflow-hidden relative group">
              <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <Coins className="w-32 h-32" />
              </div>
              <CardContent className="p-6 md:p-8 relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                 <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-6 w-6 rounded-full bg-[#FFC400] flex items-center justify-center">
                          <Coins className="w-3 h-3 text-white fill-white" />
                       </div>
                       <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FFC400]">MCoin Rewards</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-4xl font-black tracking-tighter text-[#FFC400]">0</p>
                       <span className="text-xs font-bold text-muted-foreground uppercase">MarketPoint Coins</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2 mt-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                       <Info className="w-3 h-3 text-[#FFC400]" />
                       <span>Kumpulkan MCoin dari setiap pembelian produk berlabel cashback.</span>
                    </div>
                    <button className="text-[11px] font-bold text-[#FFC400] hover:underline flex items-center gap-1 w-fit mt-1">
                       Tukar Poin <ChevronRight className="w-3 h-3" />
                    </button>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-black uppercase tracking-widest text-[#2E3137]">Aktivitas Terakhir</h2>
              <Link href="/transactions" className="text-[11px] font-black text-[#00AA5B] hover:underline">Lihat Semua</Link>
           </div>

           <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-0">
                 {transLoading ? (
                    <div className="p-6 space-y-4">
                       {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                    </div>
                 ) : transactions && transactions.length > 0 ? (
                    <div className="divide-y divide-border/50">
                       {transactions.map((t: any) => (
                          <div key={t.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                   "h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 border-[1.5px]",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="text-[13px] font-black text-[#2E3137]">{t.description || "Transaksi"}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                         {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </span>
                                      <span className="text-[8px] text-muted-foreground/30">•</span>
                                      <Badge variant="outline" className={cn(
                                         "text-[8px] font-black px-1.5 py-0 rounded-md border-none",
                                         t.status === 'SUCCESS' ? "bg-green-50 text-green-700" : t.status === 'PENDING' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                      )}>
                                         {t.status}
                                      </Badge>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={cn(
                                   "text-[14px] font-black",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} Rp {t.amount?.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">ID: {t.id.substring(0, 8)}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                       <div className="h-16 w-16 bg-muted/20 rounded-[2rem] flex items-center justify-center border border-border/50">
                          <History className="w-8 h-8 text-muted-foreground opacity-30" />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-sm font-black text-[#2E3137]">Belum Ada Aktivitas</h3>
                          <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed font-medium">
                             Segala transaksi belanja dan top-up akan tercatat secara otomatis di sini.
                          </p>
                       </div>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* Security Info */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-border border-dashed flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
           <div className="h-12 w-12 rounded-2xl bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#00AA5B]" />
           </div>
           <div className="flex-1 space-y-1">
              <h4 className="text-[12px] font-black text-[#2E3137] uppercase tracking-widest">Transaksi Aman & Terproteksi</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                 Setiap transaksi di MarketPoint menggunakan sistem enkripsi tingkat tinggi. Dana belanja Anda baru akan diteruskan ke penjual setelah Anda mengonfirmasi pesanan diterima.
              </p>
           </div>
           <Button variant="ghost" className="text-[11px] font-black text-[#00AA5B] hover:bg-[#00AA5B]/5">Pelajari Selengkapnya</Button>
        </div>

      </main>

      <MarketFooter />
    </div>
  );
}
