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
  ArrowRightLeft,
  LayoutGrid
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
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/50 h-14 flex items-center px-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-3 text-base font-bold">Saldo & MCoins</h1>
        </header>

        <main className="flex-1 pt-14 pb-20">
          {/* Main Balance Section */}
          <div className="p-4 bg-white">
            <Card className="border-none shadow-lg bg-[#00AA5B] text-white overflow-hidden relative rounded-3xl">
              <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Saldo Saya</p>
                    <p className="text-3xl font-black tracking-tighter">
                      Rp {wallet?.balance?.toLocaleString('id-ID') || 0}
                    </p>
                  </div>
                  <img src="/assets/icon/wallets.png" className="w-10 h-10 object-contain" alt="" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2 mb-4">
            {[
              { label: "Top Up", icon: Plus, color: "text-[#00AA5B]", bg: "bg-green-50" },
              { label: "Transfer", icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Scan", icon: QrCode, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Riwayat", icon: History, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center gap-1.5 py-2">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", action.bg)}>
                  <action.icon className={cn("w-5 h-5", action.color)} />
                </div>
                <span className="text-[10px] font-bold text-[#2E3137]">{action.label}</span>
              </button>
            ))}
          </div>

          {/* MCoins Section */}
          <div className="px-4 mb-6">
            <Card className="border border-border/60 bg-gradient-to-r from-[#2E3137] to-[#1A1C1F] text-white rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/assets/icon/mcoins.png" className="w-8 h-8 object-contain" alt="" />
                  <div>
                    <p className="text-[10px] font-bold text-[#FFC400] uppercase tracking-wider leading-none">MCoins Rewards</p>
                    <p className="text-lg font-black text-[#FFC400]">0</p>
                  </div>
                </div>
                <button className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Tukar</button>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            <div className="px-5 flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Aktivitas Terbaru</h2>
              <button className="text-[10px] font-bold text-[#00AA5B]">Lihat Semua</button>
            </div>

            <div className="divide-y divide-border/40 border-t border-border/40">
              {transLoading ? (
                <div className="p-4 space-y-4">
                   {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between active:bg-[#F8FAFC]">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#2E3137] leading-tight">{t.description || "Transaksi"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-[13px] font-black",
                        t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                      )}>
                        {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} {t.amount?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center text-center px-8">
                  <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-xs font-bold">Belum Ada Transaksi</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Riwayat transaksi Anda akan muncul secara otomatis di sini.</p>
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
        {/* Top Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           {/* Balance Card */}
           <Card className="border-none shadow-xl bg-[#00AA5B] text-white overflow-hidden relative group rounded-[2.5rem]">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/wallets.png" className="w-44 h-44" alt="" />
              </div>
              <CardContent className="p-10 relative z-10 flex flex-col justify-between h-full min-h-[250px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <img src="/assets/icon/wallets.png" className="w-8 h-8 object-contain" alt="" />
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-90">Saldo Belanja Utama</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                       <span className="text-2xl font-bold opacity-80">Rp</span>
                       <p className="text-6xl font-black tracking-tighter">
                          {wallet?.balance?.toLocaleString('id-ID') || 0}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-8 mt-10">
                    <Button className="h-12 px-10 rounded-full bg-white text-[#00AA5B] hover:bg-white/95 font-black text-[13px] gap-2 shadow-lg shadow-black/10 transition-transform active:scale-95">
                       <Plus className="w-4 h-4 stroke-[3px]" /> Top Up Sekarang
                    </Button>
                    <button className="text-[12px] font-black tracking-wide opacity-90 hover:opacity-100 flex items-center gap-1.5 transition-all group/link underline-offset-4 hover:underline">
                       Pencairan Dana <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                 </div>
              </CardContent>
           </Card>

           {/* MCoins Card */}
           <Card className="border-none shadow-xl bg-gradient-to-br from-[#2E3137] to-[#1A1C1F] text-white overflow-hidden relative group rounded-[2.5rem]">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <img src="/assets/icon/mcoins.png" className="w-44 h-44" alt="" />
              </div>
              <CardContent className="p-10 relative z-10 flex flex-col justify-between h-full min-h-[250px]">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <img src="/assets/icon/mcoins.png" className="w-8 h-8 object-contain" alt="" />
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFC400]">Pusat Reward MCoins</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                       <p className="text-6xl font-black tracking-tighter text-[#FFC400]">0</p>
                       <span className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Poin Aktif</span>
                    </div>
                 </div>
                 <div className="space-y-6 mt-10">
                    <div className="flex items-start gap-3 max-w-[320px]">
                       <Info className="w-4 h-4 text-[#FFC400] shrink-0 mt-0.5" />
                       <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                          Dapatkan MCoins sebagai cashback dari transaksi produk berlabel khusus. Tukarkan poin Anda dengan voucher diskon eksklusif.
                       </p>
                    </div>
                    <button className="text-[12px] font-black text-[#FFC400] hover:text-[#FFD54F] flex items-center gap-1.5 transition-all group/link">
                       Tukar MCoins <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-xl bg-white shadow-sm border border-border flex items-center justify-center">
                    <History className="w-4 h-4 text-[#00AA5B]" />
                 </div>
                 <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#2E3137]">Riwayat Aktivitas Keuangan</h2>
              </div>
              <Link href="#" className="text-[12px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                Selengkapnya <ArrowRightLeft className="w-3 h-3" />
              </Link>
           </div>

           <Card className="border-border border-[1.5px] shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardContent className="p-0">
                 {transLoading ? (
                    <div className="p-12 space-y-6">
                       {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                 ) : transactions && transactions.length > 0 ? (
                    <div className="divide-y divide-border/40">
                       {transactions.map((t: any) => (
                          <div key={t.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-[#F8FAFC] transition-all cursor-pointer group">
                             <div className="flex items-center gap-6">
                                <div className={cn(
                                   "h-14 w-14 rounded-[1.25rem] flex items-center justify-center shrink-0 border-[1.5px] transition-transform group-hover:scale-105 shadow-sm",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-6 h-6 stroke-[2.5px]" /> : <ArrowUpRight className="w-6 h-6 stroke-[2.5px]" />}
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[15px] font-black text-[#2E3137] tracking-tight">{t.description || "Transaksi"}</p>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                                         {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                      </span>
                                      <span className="text-muted-foreground/30">•</span>
                                      <Badge variant="outline" className={cn(
                                         "text-[10px] font-black px-2.5 py-0.5 rounded-md border-none",
                                         t.status === 'SUCCESS' ? "bg-green-100 text-green-700" : t.status === 'PENDING' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                      )}>
                                         {t.status}
                                      </Badge>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right space-y-1">
                                <p className={cn(
                                   "text-[18px] font-black tracking-tight",
                                   t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                                )}>
                                   {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} Rp {t.amount?.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity">REF ID: {t.id?.substring(0, 12).toUpperCase()}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-32 flex flex-col items-center justify-center text-center space-y-6">
                       <div className="h-24 w-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center border border-border/50">
                          <History className="w-12 h-12 text-muted-foreground opacity-30" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-lg font-black text-[#2E3137]">Riwayat Masih Kosong</h3>
                          <p className="text-[12px] text-muted-foreground max-w-[300px] leading-relaxed font-medium">
                             Seluruh catatan transaksi belanja dan penambahan saldo akan tampil di sini secara otomatis.
                          </p>
                       </div>
                       <Button className="h-11 px-10 rounded-2xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-[13px] text-white shadow-lg shadow-[#00AA5B]/10 transition-transform active:scale-95">Mulai Jelajahi Pasar</Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* Security Info Card */}
        <div className="mt-20 p-10 rounded-[3rem] bg-white border border-border border-dashed flex items-center gap-10 transition-all hover:border-[#00AA5B]/40 group">
           <div className="h-20 w-20 rounded-[1.5rem] bg-[#00AA5B]/10 flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12">
              <ShieldCheck className="w-10 h-10 text-[#00AA5B]" />
           </div>
           <div className="flex-1 space-y-3">
              <h4 className="text-[15px] font-black text-[#2E3137] uppercase tracking-[0.15em]">Sistem Keamanan Berlapis</h4>
              <p className="text-[12px] text-muted-foreground font-medium leading-relaxed max-w-3xl">
                 Seluruh aktivitas transaksi di platform MarketPoint dilindungi dengan enkripsi AES-256 dan sistem pemantauan real-time. Dana Anda aman dalam sistem rekber kami dan hanya akan diteruskan ke penjual setelah konfirmasi penerimaan barang/jasa yang valid.
              </p>
           </div>
           <Button variant="ghost" className="text-[13px] font-black text-[#00AA5B] hover:bg-[#00AA5B]/5 px-8 h-12 rounded-2xl border border-transparent hover:border-[#00AA5B]/20">Pelajari Proteksi</Button>
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
