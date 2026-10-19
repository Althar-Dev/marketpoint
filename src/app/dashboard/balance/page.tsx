"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  ChevronRight,
  ShieldCheck,
  Info,
  ArrowRightLeft,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardBalancePage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Saldo & Keuangan</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Kelola aset digital dan pantau aliran dana Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl bg-[#00AA5B] text-white overflow-hidden relative group rounded-[1.5rem]">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-36 h-36" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full min-h-[200px]">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest opacity-80 uppercase">Total Saldo Aktif</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold opacity-80">Rp</span>
                <p className="text-4xl font-black tracking-tighter">
                  {walletLoading ? <Skeleton className="h-10 w-32 bg-white/20" /> : (wallet?.balance || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Button className="h-9 px-6 rounded-full bg-white text-[#00AA5B] hover:bg-white/95 font-bold text-xs gap-1.5 shadow-lg shadow-black/10">
                <Plus className="w-3.5 h-3.5" /> Top Up
              </Button>
              <Button variant="ghost" className="h-9 px-4 rounded-full text-white hover:bg-white/10 font-bold text-xs gap-1.5 border border-white/20">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-white rounded-[1.5rem] p-6 flex flex-col justify-between">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MCoins Rewards</span>
               <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">0 Poin</Badge>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               Dapatkan MCoins setiap kali belanja produk digital. Poin dapat ditukarkan dengan voucher potongan harga.
             </p>
          </div>
          <Button variant="outline" className="w-full mt-4 h-9 rounded-xl border-border/60 font-bold text-xs">
            Tukar Poin Sekarang
          </Button>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-[#00AA5B]" /> Aktivitas Terakhir
        </h3>
        
        <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            {transLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border/40">
                {transactions.map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        t.type === 'SALES' || t.type === 'TOPUP' ? "bg-green-50 border-green-100 text-[#00AA5B]" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        {t.type === 'SALES' || t.type === 'TOPUP' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t.description || "Transaksi"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-black",
                      t.type === 'SALES' || t.type === 'TOPUP' ? "text-[#00AA5B]" : "text-[#2E3137]"
                    )}>
                      {t.type === 'SALES' || t.type === 'TOPUP' ? '+' : '-'} {t.amount?.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-border/60">
                  <History className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-700">Belum ada aktivitas keuangan</p>
                <p className="text-[10px] text-muted-foreground mt-1">Seluruh riwayat belanja akan muncul di sini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
