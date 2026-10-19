"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Zap,
  Ticket,
  ShieldCheck,
  Star,
  Plus,
  ArrowUpRight,
  History,
  MessageCircle,
  Package,
  ChevronRight,
  Store
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserDashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [pgTransactions, setPgTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  // Fetch transactions from PostgreSQL
  useEffect(() => {
    if (!user) return;
    setIsLoadingTx(true);
    fetch(`/api/transactions?userId=${user.uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPgTransactions(data.transactions || []);
        }
      })
      .catch(err => console.warn("[DASHBOARD] Gagal ambil transaksi PG:", err))
      .finally(() => setIsLoadingTx(false));
  }, [user]);

  const stats = useMemo(() => {
    const successTxs = pgTransactions.filter(t => ["PAID", "SETTLED", "SUCCESS"].includes(t.status));
    const pendingTxs = pgTransactions.filter(t => t.status === "PENDING");
    const totalSpent = successTxs.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    
    return {
      totalOrders: successTxs.length,
      pendingOrders: pendingTxs.length,
      totalSpent,
      lastOrder: successTxs.length > 0 ? successTxs[0] : null
    };
  }, [pgTransactions]);

  if (!mounted || authLoading) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-[#00AA5B]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-[#00AA5B] hover:bg-[#00AA5B] text-white border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">
              Buyer Dashboard
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Halo, {user?.displayName || "Pengguna MarketPoint"}! 👋
            </h2>
            <p className="text-sm text-slate-400 max-w-md">
              Kelola seluruh aset digital, riwayat pesanan, dan saldo belanja Anda dalam satu dashboard terpusat.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/topup">
              <Button className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl h-11 px-6 gap-2 shadow-lg shadow-[#00AA5B]/20">
                <Zap className="w-4 h-4" /> Top Up Saldo
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-xl h-11 px-6 gap-2 backdrop-blur-md">
                <ShoppingBag className="w-4 h-4" /> Belanja Lagi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card: Wallet */}
        <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden group hover:border-[#00AA5B]/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-green-50 text-[#00AA5B]">
                <Wallet className="w-5 h-5" />
              </div>
              <Link href="/wallet" className="text-[10px] font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
                Detail <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Aktif</p>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {walletLoading ? <Skeleton className="h-6 w-32" /> : `Rp ${(wallet?.balance || 0).toLocaleString("id-ID")}`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: MCoins */}
        <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden group hover:border-amber-400/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Ticket className="w-5 h-5" />
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-bold">Reward</Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">MCoins Poin</p>
              <div className="text-xl font-black text-slate-900 mt-0.5">0 Poin</div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Total Orders */}
        <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden group hover:border-blue-400/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">Berhasil</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Pesanan</p>
              <div className="text-xl font-black text-slate-900 mt-0.5">{stats.totalOrders} Order</div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Total Spending */}
        <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden group hover:border-purple-400/50 transition-all">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">Akumulasi</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Belanja</p>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                Rp {stats.totalSpent.toLocaleString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#00AA5B]" /> Transaksi Terakhir
            </h3>
            <Link href="/dashboard/transactions" className="text-xs font-bold text-[#00AA5B] hover:underline flex items-center gap-1">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-0">
              {isLoadingTx ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : pgTransactions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-border/60">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Belum Ada Transaksi</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px]">
                    Riwayat pembelian produk digital Anda akan muncul di sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {pgTransactions.slice(0, 6).map((tx) => (
                    <Link key={tx.id} href={`/transactions/${tx.invoiceNumber}`}>
                      <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border/60 shrink-0 flex items-center justify-center overflow-hidden relative">
                            {tx.productImage ? (
                              <img src={tx.productImage} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{tx.productTitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-muted-foreground">{tx.invoiceNumber}</span>
                              <Badge className={cn(
                                "text-[8px] font-bold px-1.5 py-0 border-none",
                                ["PAID", "SUCCESS", "SETTLED"].includes(tx.status) ? "bg-emerald-100 text-emerald-700" : 
                                tx.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {tx.status === "PAID" ? "Lunas" : tx.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-900">Rp {(Number(tx.totalAmount) || 0).toLocaleString("id-ID")}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' }) : "-"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Support Card */}
          <Card className="border-border/50 shadow-sm rounded-2xl bg-[#00AA5B]/5 border-dashed border-2 overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00AA5B] text-white flex items-center justify-center shadow-lg shadow-[#00AA5B]/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Bantuan Layanan</h4>
                  <p className="text-[10px] text-muted-foreground">Butuh bantuan transaksi?</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tim customer care kami siap membantu 24/7 jika Anda mengalami kendala saat aktivasi lisensi atau pembayaran.
              </p>
              <Link href="/support" className="block">
                <Button variant="outline" className="w-full h-9 rounded-xl border-[#00AA5B]/30 text-[#00AA5B] hover:bg-[#00AA5B] hover:text-white font-bold text-[11px] transition-all">
                  Pusat Bantuan
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Info / Security */}
          <Card className="border-border/50 shadow-sm rounded-2xl bg-white p-5 space-y-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Keamanan Akun</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#00AA5B] mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Proteksi Escrow</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Dana Anda ditahan aman sistem sampai lisensi berhasil diterima.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Email Terverifikasi</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Notifikasi pesanan dikirimkan ke alamat email resmi Anda.</p>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <Link href="/settings" className="flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-[#00AA5B]">
               <span>Update Profil Keamanan</span>
               <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Seller CTA Card */}
          <Card className="border-none shadow-md rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden p-5 space-y-3 relative group">
            <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Store className="w-24 h-24" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider opacity-80">Jadilah Mitra Seller</h4>
            <p className="text-[11px] leading-relaxed font-medium">
              Punya source code, lisensi, atau produk digital sendiri? Buka toko di MarketPointID gratis & raih penghasilan tambahan.
            </p>
            <Link href="/register" className="block pt-1">
               <Button className="w-full h-8 rounded-lg bg-white text-indigo-700 hover:bg-white/90 font-bold text-[10px] shadow-sm">
                  Daftar Jadi Penjual Sekarang
               </Button>
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
