"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  Plus,
  ExternalLink,
  History,
  ArrowRight,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Star,
  Lock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useMerchantShop } from "@/context/merchant-context";

export default function MerchantDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    shop,
    shopId,
    loading: merchantLoading,
    isOwner,
    isStaff,
    staffRole,
    staffRoleLabel,
    staffPermissions,
  } = useMerchantShop();

  const activeShopTargetId = shopId || user?.uid;

  const canAccessFinance = isOwner || staffRole === "CO_OWNER" || !!staffPermissions?.finance;

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!activeShopTargetId) return null;
    return doc(db, "users", activeShopTargetId, "wallet", "info");
  }, [db, activeShopTargetId]);

  const ordersQuery = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return query(collection(db, "shops", activeShopTargetId, "orders"));
  }, [db, activeShopTargetId]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: wallet } = useDoc(walletRef);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => (rawOrders || []) as any[], [rawOrders]);

  // Hitung statistik toko secara real-time dari riwayat pesanan
  const statsData = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING");
    const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED");

    // 1. Pesanan Baru (Menunggu diproses / verifikasi)
    const newOrdersCount = pendingOrders.length;

    // 2. Saldo Tertahan (Pesanan PENDING yang belum diverifikasi)
    const heldBalance = pendingOrders.reduce((acc, o) => {
      const val = Number(o.totalAmount || o.amount || o.itemsSubtotal || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    // 3. Pendapatan Hari Ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPaidOrders = paidOrders.filter((o) => {
      const ts = o.updatedAt?.toDate ? o.updatedAt.toDate() : (o.createdAt?.toDate ? o.createdAt.toDate() : (o.timestamp ? new Date(o.timestamp) : null));
      return ts ? ts >= today : true;
    });

    const todayRevenue = todayPaidOrders.reduce((acc, o) => {
      const val = Number(o.itemsSubtotal || o.totalAmount || o.amount || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    // 4. Total Transaksi Selesai / Terkirim
    const completedCount = paidOrders.length;

    return {
      newOrdersCount,
      heldBalance,
      todayRevenue,
      completedCount,
      totalRevenue: paidOrders.reduce((acc, o) => acc + (Number(o.itemsSubtotal || o.totalAmount || o.amount || 0)), 0),
    };
  }, [orders]);

  // Auto-reconcile: jika ada pesanan PAID tapi saldo dompet toko belum tercatat / 0
  useEffect(() => {
    if (!db || !activeShopTargetId || orders.length === 0) return;
    const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED");
    if (paidOrders.length === 0) return;

    const totalPaidAmount = paidOrders.reduce((acc, o) => {
      const val = Number(o.itemsSubtotal || o.totalAmount || o.amount || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const currentBalance = Number(wallet?.balance) || 0;
    if (totalPaidAmount > 0 && currentBalance < totalPaidAmount) {
      setDoc(
        doc(db, "users", activeShopTargetId, "wallet", "info"),
        {
          balance: totalPaidAmount,
          totalRevenue: totalPaidAmount,
          currency: "IDR",
          userId: activeShopTargetId,
          lastReconciledAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }
  }, [db, activeShopTargetId, orders, wallet]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || userLoading || merchantLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const hasShopFlag = userData?.hasShop === true;
    const hasShopDoc = !!shop;
    const isStaffMember = isStaff || !!userData?.staffShopId || userData?.isStaff === true;

    // Staff or owner should never be prompted to create a shop
    if (!hasShopFlag && !hasShopDoc && !isStaffMember) {
      router.replace("/my-shop/setup");
    }
  }, [userData, userLoading, shop, merchantLoading, isStaff, user, authLoading, router, mounted]);

  if (!mounted || authLoading || userLoading || merchantLoading || !user) {
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
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        <div className="flex items-center justify-between gap-4">
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#212121]">Ringkasan Toko</h2>
              {isStaff && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {staffRoleLabel || "Staf Toko"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Pantau performa dan kelola operasional toko Anda.</p>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button asChild variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border hover:bg-white transition-all">
              <Link href={`/${shop.slug}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat Toko
              </Link>
            </Button>
            <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-[11px] gap-2 shadow-md border border-[#00AA5B] text-white transition-all">
              <Plus className="w-3.5 h-3.5" /> Tambah Produk
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 h-full">
              {[
                {
                  label: "Pesanan Baru",
                  value: statsData.newOrdersCount.toString(),
                  color: "text-foreground",
                  sub: "Menunggu diproses",
                  href: "/my-shop/orders?tab=pending"
                },
                {
                  label: "Saldo Tertahan",
                  value: `Rp ${statsData.heldBalance.toLocaleString('id-ID')}`,
                  color: "text-orange-600",
                  sub: "Proses verifikasi",
                  href: "/my-shop/wallet"
                },
                {
                  label: "Pendapatan",
                  value: `Rp ${statsData.todayRevenue.toLocaleString('id-ID')}`,
                  color: "text-[#00AA5B]",
                  sub: "Hari ini",
                  href: "/my-shop/wallet"
                },
                {
                  label: "Pesanan Selesai",
                  value: statsData.completedCount.toString(),
                  color: "text-foreground",
                  sub: "Trafik & transaksi",
                  href: "/my-shop/orders?tab=completed"
                },
              ].map((stat, idx) => (
                <Link
                  key={idx}
                  href={stat.href}
                  className="p-4 sm:p-5 rounded-2xl bg-white border-[1.5px] border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-xs group flex flex-col justify-center"
                >
                  <p className={cn("text-xl sm:text-2xl font-black mb-1 tracking-tight", stat.color)}>
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-[#2E3137]">{stat.label}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.sub}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-105 transition-transform duration-500">
                <img src="/assets/icon/wallets.png" className="w-16 h-16" alt="Wallet" />
              </div>
              <CardContent className="p-6 relative z-10 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 opacity-90 mb-1.5">
                    <img src="/assets/icon/wallets.png" className="w-4 h-4" alt="Wallet" />
                    <span className="text-[11px] font-bold tracking-wider">Saldo Penghasilan</span>
                    {!canAccessFinance && (
                      <span className="flex items-center gap-1 text-[9px] bg-black/20 px-2 py-0.5 rounded-full font-medium ml-auto">
                        <Lock className="w-2.5 h-2.5" /> Dibatasi
                      </span>
                    )}
                  </div>
                  {canAccessFinance ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium">Rp</span>
                      <p className="text-3xl font-black tracking-tighter">
                        {wallet?.balance?.toLocaleString('id-ID') || 0}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium">Rp</span>
                      <p className="text-2xl font-black tracking-widest opacity-60">
                        ••••••••
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canAccessFinance ? (
                    <>
                      <Button asChild variant="secondary" className="h-9 rounded-xl bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[11px] transition-all">
                        <Link href="/my-shop/wallet">Tarik Saldo</Link>
                      </Button>
                      <Button asChild variant="secondary" className="h-9 rounded-xl bg-white/20 hover:bg-white/30 border-none text-white font-bold text-[11px] transition-all">
                        <Link href="/my-shop/wallet">Riwayat</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button disabled variant="secondary" className="h-9 rounded-xl bg-white/10 border-none text-white/50 font-medium text-[11px] cursor-not-allowed">
                        Tarik Saldo
                      </Button>
                      <Button disabled variant="secondary" className="h-9 rounded-xl bg-white/10 border-none text-white/50 font-medium text-[11px] cursor-not-allowed">
                        Riwayat
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
              <Button asChild variant="outline" className="mt-6 h-8 px-5 rounded-lg text-[10px] font-bold border-border transition-all">
                <Link href="/my-shop/products">Tambah Produk Pertama</Link>
              </Button>
            </CardContent>
          </Card>

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
