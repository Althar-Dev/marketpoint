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
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  ChevronRight,
  ShieldCheck,
  Info,
  ChevronLeft,
  QrCode,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserWalletPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const isMobile = useIsMobile();
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

  // --- MOBILE VIEW ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body text-[#212121]">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/50 h-14 flex items-center px-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-3 text-base font-bold">Saldo & MCoins</h1>
        </header>

        <main className="flex-1 pt-14 pb-20">
          <div className="p-4 bg-white">
            <Card className="border-none shadow-lg bg-[#00AA5B] text-white overflow-hidden relative rounded-3xl">
              <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold opacity-80">Saldo Saya</p>
                    <p className="text-2xl font-black tracking-tighter">
                      Rp {wallet?.balance?.toLocaleString('id-ID') || 0}
                    </p>
                  </div>
                  <img src="/assets/icon/wallets.png" className="w-10 h-10 object-contain" alt="" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-4 gap-2 px-4 py-2 mb-4">
            {[
              { label: "Top Up", icon: Plus, color: "text-[#00AA5B]", bg: "bg-green-50" },
              { label: "Transfer", icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Scan", icon: QrCode, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Riwayat", icon: History, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center gap-1.5 py-2">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-95", action.bg)}>
                  <action.icon className={cn("w-5 h-5", action.color)} />
                </div>
                <span className="text-[10px] font-medium text-[#2E3137]">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="px-4 mb-6">
            <Card className="border border-border/60 bg-gradient-to-r from-[#2E3137] to-[#1A1C1F] text-white rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/assets/icon/mcoins.png" className="w-8 h-8 object-contain" alt="" />
                  <div>
                    <p className="text-[10px] font-bold text-[#FFC400] leading-none">MCoins Rewards</p>
                    <p className="text-lg font-black text-[#FFC400]">0</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors active:bg-white/20">Tukar</button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="px-5 flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-muted-foreground">Aktivitas Terbaru</h2>
              <button className="text-[10px] font-bold text-[#00AA5B] hover:underline">Lihat Semua</button>
            </div>

            <div className="divide-y divide-border/40 border-t border-border/40">
              {transLoading ? (
                <div className="p-4 space-y-4">
                   {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between active:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-[#2E3137] leading-tight">{t.description || "Transaksi"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-[13px] font-bold",
                        t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                      )}>
                        {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} {t.amount?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center text-center px-8">
                  <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border border-border/40">
                    <History className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-xs font-bold text-[#2E3137]">Belum ada transaksi</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">Riwayat transaksi belanja akan muncul di sini secara otomatis.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      
      <main className="flex-1 w-full pt-28 pb-20 max-w-screen-xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <Card className="border-none shadow-xl bg-[#00AA5B] text-white overflow-hidden relative group rounded-[2rem]">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/wallets.png" className="w-36 h-36" alt="" />
              </div>
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <img src="/assets/icon/wallets.png" className="w-6 h-6 object-contain" alt="" />
                       <span className="text-[11px] font-bold tracking-wider opacity-90">Saldo Belanja Utama</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-xl font-bold opacity-80">Rp</span>
                       <p className="text-5xl font-black tracking-tighter">
                          {wallet?.balance?.toLocaleString('id-ID') || 0}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6 mt-8">
                    <Button className="h-10 px-8 rounded-full bg-white text-[#00AA5B] hover:bg-white/95 font-bold text-[12px] gap-2 shadow-lg shadow-black/10 transition-all active:scale-95">
                       <Plus className="w-4 h-4" /> Top Up Sekarang
                    </Button>
                    <button className="text-[12px] font-bold opacity-90 hover:opacity-100 flex items-center gap-1.5 transition-all group/link underline-offset-4 hover:underline">
                       Pencairan Dana <ArrowUpRight className="w-4 h-4" />
                    </button>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl bg-gradient-to-br from-[#2E3137] to-[#1A1C1F] text-white overflow-hidden relative group rounded-[2rem]">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/mcoins.png" className="w-36 h-36" alt="" />
              </div>
              <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <img src="/assets/icon/mcoins.png" className="w-6 h-6 object-contain" alt="" />
                       <span className="text-[11px] font-bold tracking-wider text-[#FFC400]">Pusat Reward MCoins</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-5xl font-black tracking-tighter text-[#FFC400]">0</p>
                       <span className="text-sm font-bold text-muted-foreground ml-1">Poin Aktif</span>
                    </div>
                 </div>
                 <div className="space-y-4 mt-8">
                    <div className="flex items-start gap-3 max-w-[300px]">
                       <Info className="w-4 h-4 text-[#FFC400] shrink-0 mt-0.5" />
                       <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                          Dapatkan MCoins sebagai cashback dari transaksi produk berlabel khusus. Tukarkan poin Anda dengan voucher diskon eksklusif.
                       </p>
                    </div>
                    <button className="text-[12px] font-bold text-[#FFC400] hover:text-[#FFD54F] flex items-center gap-1.5 transition-all group/link">
                       Tukar MCoins <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-border flex items-center justify-center">
                    <History className="w-4 h-4 text-[#00AA5B]" />
                 </div>
                 <h2 className="text-sm font-bold text-[#2E3137]">Riwayat Aktivitas Keuangan</h2>
              </div>
              <Link href="#" className="text-[11px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                Selengkapnya <ArrowRightLeft className="w-3 h-3" />
              </Link>
           </div>

           <Card className="border-border border-[1.5px] shadow-sm rounded-[1.5rem] bg-white overflow-hidden">
              <CardContent className="p-0">
                 {transLoading ? (
                    <div className="p-8 space-y-4">
                       {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                 ) : transactions && transactions.length > 0 ? (
                    <div className="divide-y divide-border/40">
                       {transactions.map((t: any) => (
                          <div key={t.id} className="p-6 flex items-center justify-between hover:bg-[#F8FAFC] transition-all cursor-pointer group">
                             <div className="flex items-center gap-6">
                                <div className={cn(
                                   "h-12 w-12 rounded-[1rem] flex items-center justify-center shrink-0 border-[1.5px] transition-transform group-hover:scale-105 shadow-sm",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-5 h-5 stroke-[2px]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2px]" />}
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[14px] font-bold text-[#2E3137] tracking-tight">{t.description || "Transaksi"}</p>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                         {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </span>
                                      <span className="text-muted-foreground/30">•</span>
                                      <Badge variant="outline" className={cn(
                                         "text-[9px] font-bold px-2 py-0.5 rounded-md border-none",
                                         t.status === 'SUCCESS' ? "bg-green-100 text-green-700" : t.status === 'PENDING' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                      )}>
                                         {t.status}
                                      </Badge>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right space-y-0.5">
                                <p className={cn(
                                   "text-[16px] font-black tracking-tight",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} Rp {t.amount?.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">Ref ID: {t.id?.substring(0, 10).toUpperCase()}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-24 flex flex-col items-center justify-center text-center space-y-6">
                       <div className="h-20 w-20 bg-muted/20 rounded-[1.5rem] flex items-center justify-center border border-border/50">
                          <History className="w-8 h-8 text-muted-foreground opacity-30" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-sm font-bold text-[#2E3137]">Riwayat masih kosong</h3>
                          <p className="text-[11px] text-muted-foreground max-w-[280px] leading-relaxed font-medium">
                             Seluruh catatan transaksi belanja dan penambahan saldo akan tampil di sini secara otomatis.
                          </p>
                       </div>
                       <Button className="h-10 px-8 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[12px] text-white shadow-lg shadow-[#00AA5B]/10 transition-all active:scale-95">Mulai Jelajahi Pasar</Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        <div className="mt-16 p-8 rounded-[2rem] bg-white border border-border border-dashed flex items-center gap-8 transition-all hover:border-[#00AA5B]/40 group">
           <div className="h-16 w-16 rounded-[1.25rem] bg-[#00AA5B]/10 flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6">
              <ShieldCheck className="w-8 h-8 text-[#00AA5B]" />
           </div>
           <div className="flex-1 space-y-2">
              <h4 className="text-[14px] font-bold text-[#2E3137]">Sistem keamanan berlapis</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-2xl">
                 Seluruh aktivitas transaksi di platform MarketPoint dilindungi dengan enkripsi tingkat tinggi dan pemantauan real-time. Dana Anda aman dalam sistem rekber kami dan hanya akan diteruskan ke penjual setelah konfirmasi penerimaan barang/jasa yang valid.
              </p>
           </div>
           <Button variant="ghost" className="text-[12px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/5 px-6 h-10 rounded-xl border border-transparent hover:border-[#00AA5B]/20">Pelajari Proteksi</Button>
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
