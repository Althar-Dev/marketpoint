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
  Lock,
  Clock,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  const [pgOrders, setPgOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!activeShopTargetId) return;
    fetch(`/api/transactions?shopId=${activeShopTargetId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.transactions)) {
          setPgOrders(data.transactions);
        }
      })
      .catch((err) => console.warn("[DASHBOARD ORDERS PG FETCH ERROR]", err));

    fetch(`/api/products?shopId=${activeShopTargetId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn("[DASHBOARD PRODUCTS FETCH ERROR]", err));
  }, [activeShopTargetId]);

  const orders = useMemo(() => {
    const combined: any[] = [...(rawOrders || [])];
    const seen = new Set(combined.map((o) => o.invoiceNumber || o.id));

    for (const po of pgOrders) {
      const key = po.invoiceNumber || po.id;
      if (!seen.has(key)) {
        seen.add(key);
        const grossVal = Number(po.itemsSubtotal || po.totalAmount || 0);
        const discVal = Number(po.discount || 0);
        const feeVal = Number(po.platformFee || 0);
        const parsedNet = Number(po.netAmount);
        const safeNet = (!isNaN(parsedNet) && parsedNet > 0) ? parsedNet : Math.max(0, grossVal - discVal - feeVal);

        combined.push({
          id: po.id,
          invoiceNumber: po.invoiceNumber,
          productTitle: po.productTitle,
          totalAmount: Number(po.totalAmount),
          itemsSubtotal: Number(po.itemsSubtotal || po.totalAmount),
          discount: discVal,
          platformFee: feeVal,
          platformFeeRate: Number(po.platformFeeRate || 0),
          shopTier: po.shopTier || "free",
          netAmount: safeNet,
          amount: safeNet,
          status: po.status,
          createdAt: po.createdAt,
          updatedAt: po.updatedAt,
        });
      }
    }
    return combined;
  }, [rawOrders, pgOrders]);

  // Durasi settlement saldo penjualan: 3 Hari (72 jam)
  const SETTLEMENT_DAYS = 3;
  const SETTLEMENT_MS = SETTLEMENT_DAYS * 24 * 60 * 60 * 1000;

  // Hitung statistik toko secara real-time dari riwayat pesanan
  const statsData = useMemo(() => {
    const now = Date.now();
    const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING");
    const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED");

    // 1. Pesanan Baru (Menunggu diproses / verifikasi)
    const newOrdersCount = pendingOrders.length;

    // 2. Saldo Tertahan & Saldo Tersedia (Settlement 3 Hari):
    let heldBalance = 0;
    let availableBalance = 0;

    for (const o of orders) {
      const subtotal = Number(
        o.itemsSubtotal ||
        (Number(o.unitPrice || 0) * Number(o.quantity || 1)) ||
        o.totalAmount ||
        o.amount ||
        0
      );
      const discount = Number(o.discount || 0) + Number(o.voucherDiscount || 0) + Number(o.flashSaleDiscount || 0);
      const platformFee = Number(o.platformFee || o.platform_fee || 0);
      const parsedNet = Number(o.netAmount);
      const netAmount = (!isNaN(parsedNet) && parsedNet > 0)
        ? parsedNet
        : Math.max(0, subtotal - discount - platformFee);

      if (o.status === "PENDING" || o.status === "PROCESSING") {
        heldBalance += netAmount;
      } else if (o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED") {
        const orderDate = o.createdAt?.toDate
          ? o.createdAt.toDate().getTime()
          : (o.createdAt ? new Date(o.createdAt).getTime() : now);

        const isSettled = o.status === "SETTLED" || (now - orderDate >= SETTLEMENT_MS);

        if (isSettled) {
          availableBalance += netAmount;
        } else {
          // Tertahan selama 3 hari untuk proteksi garansi pesanan
          heldBalance += netAmount;
        }
      }
    }

    // 3. Pendapatan Hari Ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPaidOrders = paidOrders.filter((o) => {
      const ts = o.updatedAt?.toDate ? o.updatedAt.toDate() : (o.createdAt?.toDate ? o.createdAt.toDate() : (o.timestamp ? new Date(o.timestamp) : null));
      return ts ? ts >= today : true;
    });

    const todayRevenue = todayPaidOrders.reduce((acc, o) => {
      const sub = Number(o.itemsSubtotal || (Number(o.unitPrice || 0) * Number(o.quantity || 1)) || o.totalAmount || 0);
      const disc = Number(o.discount || 0) + Number(o.voucherDiscount || 0) + Number(o.flashSaleDiscount || 0);
      const fee = Number(o.platformFee || o.platform_fee || 0);
      const parsedNet = Number(o.netAmount);
      const net = (!isNaN(parsedNet) && parsedNet > 0) ? parsedNet : Math.max(0, sub - disc - fee);
      return acc + net;
    }, 0);

    // 4. Total Transaksi Selesai / Terkirim
    const completedCount = paidOrders.length;

    const totalNetRevenue = paidOrders.reduce((acc, o) => {
      const sub = Number(o.itemsSubtotal || (Number(o.unitPrice || 0) * Number(o.quantity || 1)) || o.totalAmount || 0);
      const disc = Number(o.discount || 0) + Number(o.voucherDiscount || 0) + Number(o.flashSaleDiscount || 0);
      const fee = Number(o.platformFee || o.platform_fee || 0);
      const parsedNet = Number(o.netAmount);
      const net = (!isNaN(parsedNet) && parsedNet > 0) ? parsedNet : Math.max(0, sub - disc - fee);
      return acc + net;
    }, 0);

    return {
      newOrdersCount,
      heldBalance,
      availableBalance,
      todayRevenue,
      completedCount,
      totalRevenue: totalNetRevenue,
    };
  }, [orders]);

  // Top 5 Produk Terlaris
  const topProducts = useMemo(() => {
    const orderSalesCount: Record<string, { count: number; revenue: number }> = {};
    for (const o of orders) {
      if (o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED") {
        const title = o.productTitle || o.title || "Produk";
        if (!orderSalesCount[title]) {
          orderSalesCount[title] = { count: 0, revenue: 0 };
        }
        orderSalesCount[title].count += Number(o.quantity || 1);
        orderSalesCount[title].revenue += Number(o.totalAmount || o.amount || 0);
      }
    }

    if (products.length > 0) {
      return [...products]
        .map((p) => {
          const fromOrders = orderSalesCount[p.title];
          const realSales = Math.max(Number(p.salesCount || 0), fromOrders ? fromOrders.count : 0);
          return {
            ...p,
            salesCount: realSales,
          };
        })
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5);
    }

    // Jika list products kosong tapi ada penjualan di database orders
    const orderKeys = Object.keys(orderSalesCount);
    if (orderKeys.length > 0) {
      return orderKeys
        .map((title) => ({
          id: title,
          title,
          salesCount: orderSalesCount[title].count,
          price: Math.round(orderSalesCount[title].revenue / Math.max(1, orderSalesCount[title].count)),
          categoryName: "Digital",
          images: [{ imageUrl: "https://cdn.marketpoint.id/marketpoint.png" }],
        }))
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5);
    }

    return [];
  }, [products, orders]);

  // Top 5 Transaksi Terbaru Toko
  const recentTransactions = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    return sorted.slice(0, 5);
  }, [orders]);

  // Sinkronisasi saldo dompet toko dengan status settlement
  useEffect(() => {
    if (!db || !activeShopTargetId || orders.length === 0) return;
    if (statsData.heldBalance > 0 || statsData.availableBalance > 0) {
      setDoc(
        doc(db, "users", activeShopTargetId, "wallet", "info"),
        {
          pendingBalance: statsData.heldBalance,
          balance: statsData.availableBalance,
          totalRevenue: statsData.totalRevenue,
          currency: "IDR",
          userId: activeShopTargetId,
          lastReconciledAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }
  }, [db, activeShopTargetId, statsData]);

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
                  icon: ShoppingBag,
                  iconBg: "bg-blue-50 text-blue-600",
                  href: "/my-shop/orders?tab=pending"
                },
                {
                  label: "Saldo Tertahan",
                  value: `Rp ${statsData.heldBalance.toLocaleString('id-ID')}`,
                  color: "text-amber-600",
                  sub: "Settlement 3 hari",
                  icon: Clock,
                  iconBg: "bg-amber-50 text-amber-600",
                  href: "/my-shop/wallet"
                },
                {
                  label: "Pendapatan",
                  value: `Rp ${statsData.todayRevenue.toLocaleString('id-ID')}`,
                  color: "text-[#00AA5B]",
                  sub: "Hari ini",
                  icon: TrendingUp,
                  iconBg: "bg-emerald-50 text-[#00AA5B]",
                  href: "/my-shop/wallet"
                },
                {
                  label: "Pesanan Selesai",
                  value: statsData.completedCount.toString(),
                  color: "text-foreground",
                  sub: "Trafik & transaksi",
                  icon: CheckCircle2,
                  iconBg: "bg-slate-100 text-slate-700",
                  href: "/my-shop/orders?tab=completed"
                },
              ].map((stat, idx) => (
                <Link
                  key={idx}
                  href={stat.href}
                  className="p-3.5 sm:p-4 rounded-xl bg-white border-[1.5px] border-border hover:border-[#00AA5B] transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", stat.iconBg)}>
                      <stat.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                      {stat.sub}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <p className={cn("text-base sm:text-lg font-bold tracking-tight", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-[11px] sm:text-xs font-semibold text-[#2E3137] mt-0.5">
                      {stat.label}
                    </p>
                  </div>
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
                      <span className="text-xs font-medium">Rp</span>
                      <p className="text-2xl font-bold tracking-tight">
                        {statsData.availableBalance.toLocaleString('id-ID')}
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
            {topProducts.length === 0 ? (
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
            ) : (
              <CardContent className="p-4 space-y-2.5 flex-1 flex flex-col justify-start">
                {topProducts.map((product, idx) => {
                  const img = product.images?.[0]?.imageUrl || "https://cdn.marketpoint.id/marketpoint.png";
                  return (
                    <div
                      key={product.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-border overflow-hidden bg-muted relative shrink-0">
                          <Image src={img} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2E3137] truncate max-w-[180px] sm:max-w-[240px]">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                              {product.categoryName || "Digital"}
                            </span>
                            <span className="text-[8px] text-muted-foreground/40">•</span>
                            <span className="text-[10px] font-bold text-[#00AA5B]">
                              {product.salesCount || 0} Terjual
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-bold text-[#2E3137] whitespace-nowrap">
                          Rp {Number(product.price || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
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
            {recentTransactions.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-16 text-center flex-1">
                <div className="w-14 h-14 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border-[1.5px] border-border">
                  <Zap className="w-6 h-6 text-muted-foreground opacity-30" />
                </div>
                <h3 className="text-[12px] font-bold text-[#212121]">Belum Ada Transaksi</h3>
                <p className="text-[10px] text-muted-foreground max-w-[240px] mt-1.5 leading-relaxed font-medium">
                  Semua catatan arus kas toko Anda akan tercatat secara otomatis di sini.
                </p>
              </CardContent>
            ) : (
              <CardContent className="p-4 space-y-2.5 flex-1 flex flex-col justify-start">
                {recentTransactions.map((tx, idx) => {
                  const subtotal = Number(
                    tx.itemsSubtotal ||
                    (Number(tx.unitPrice || 0) * Number(tx.quantity || 1)) ||
                    tx.totalAmount ||
                    tx.amount ||
                    0
                  );
                  const discount = Number(tx.discount || 0) + Number(tx.voucherDiscount || 0) + Number(tx.flashSaleDiscount || 0);
                  const netAmount = Math.max(0, subtotal - discount);
                  const isPaid = tx.status === "PAID" || tx.status === "COMPLETED" || tx.status === "SETTLED";
                  const dateStr = tx.createdAt?.toDate
                    ? tx.createdAt.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Baru saja");

                  return (
                    <div
                      key={tx.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          isPaid ? "bg-emerald-50 text-[#00AA5B]" : "bg-amber-50 text-amber-600"
                        )}>
                          {isPaid ? <ArrowUpRight className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2E3137] truncate max-w-[180px] sm:max-w-[240px]">
                            {tx.productTitle || tx.invoiceNumber || "Transaksi Toko"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                            <span className="text-[8px] text-muted-foreground/40">•</span>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.2 rounded",
                              isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                            )}>
                              {isPaid ? "Lunas" : "Menunggu"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={cn("text-xs font-bold whitespace-nowrap", isPaid ? "text-[#00AA5B]" : "text-amber-600")}>
                          +Rp {netAmount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          #{tx.invoiceNumber?.slice(-6) || tx.id?.slice(-6) || "INV"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </div>

      </div>
    </main>
  );
}
