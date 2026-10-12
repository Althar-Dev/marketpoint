"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  Users,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  RotateCw,
  Wallet,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  Bar,
  BarChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatCompactRupiah(amount: number) {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
}

export default function MerchantStatsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { shopId: contextShopId, shop: contextShop } = useMerchantShop();

  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<"7days" | "30days" | "this_month" | "all">("7days");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");

  // Real data states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>({
    ratingAvg: 0,
    totalReviews: 0,
    starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeShopId = contextShopId || user?.uid || null;

  // Shop details from Firestore
  const shopRef = useMemoFirebase(() => {
    if (!activeShopId || !db) return null;
    return doc(db, "shops", activeShopId);
  }, [db, activeShopId]);

  const { data: firestoreShop, loading: shopLoading } = useDoc(shopRef);
  const shop = contextShop || firestoreShop;

  // Fetch all business statistics
  const fetchAllStats = useCallback(async (showToast = false) => {
    if (!activeShopId) return;
    setIsLoadingData(true);

    try {
      // 1. Fetch transactions
      const txPromise = fetch(`/api/transactions?shopId=${encodeURIComponent(activeShopId)}`)
        .then((res) => res.json())
        .catch(() => ({ success: false, transactions: [] }));

      // 2. Fetch products
      const prodPromise = fetch(`/api/products?shopId=${encodeURIComponent(activeShopId)}`)
        .then((res) => res.json())
        .catch(() => ({ success: false, products: [] }));

      // 3. Fetch reviews & rating
      const revPromise = fetch(`/api/reviews?shopId=${encodeURIComponent(activeShopId)}`)
        .then((res) => res.json())
        .catch(() => ({ success: false, reviews: [], stats: null }));

      const [txData, prodData, revData] = await Promise.all([txPromise, prodPromise, revPromise]);

      if (txData.success && Array.isArray(txData.transactions)) {
        setTransactions(txData.transactions);
      }

      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }

      if (revData.success && revData.stats) {
        setReviewStats(revData.stats);
      }

      if (showToast) {
        toast({
          title: "Statistik Diperbarui",
          description: "Data performa toko berhasil disinkronkan dengan transaksi terkini.",
        });
      }
    } catch (err) {
      console.warn("[MERCHANT STATS FETCH ERROR]", err);
    } finally {
      setIsLoadingData(false);
      setIsRefreshing(false);
    }
  }, [activeShopId, toast]);

  useEffect(() => {
    if (activeShopId) {
      fetchAllStats(false);
    }
  }, [activeShopId, fetchAllStats]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchAllStats(true);
  };

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (period === "all") return true;
      const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
      if (!txDate || isNaN(txDate.getTime())) return true;

      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

      if (period === "7days") return diffDays <= 7;
      if (period === "30days") return diffDays <= 30;
      if (period === "this_month") {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate Key Metrics
  const metrics = useMemo(() => {
    const paidTxs = filteredTransactions.filter(
      (tx) => tx.status === "PAID" || tx.status === "SETTLED"
    );

    const pendingTxs = filteredTransactions.filter((tx) => tx.status === "PENDING");
    const cancelledTxs = filteredTransactions.filter(
      (tx) => tx.status === "CANCELLED" || tx.status === "EXPIRED" || tx.status === "FAILED"
    );

    const totalRevenue = paidTxs.reduce(
      (sum, tx) => sum + (Number(tx.netAmount ?? tx.totalAmount) || 0),
      0
    );

    const totalOrders = paidTxs.length;
    const totalUnitsSold = paidTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const totalAllAttempts = filteredTransactions.length;
    const completionRate =
      totalAllAttempts > 0 ? Math.round((totalOrders / totalAllAttempts) * 100) : 100;

    // Rating
    const avgRating =
      reviewStats.totalReviews > 0
        ? Number(reviewStats.ratingAvg || 0).toFixed(1)
        : shop?.rating
        ? Number(shop.rating).toFixed(1)
        : "5.0";

    const positiveReviews =
      (reviewStats.starCounts?.[5] || 0) + (reviewStats.starCounts?.[4] || 0);
    const positiveRate =
      reviewStats.totalReviews > 0
        ? Math.round((positiveReviews / reviewStats.totalReviews) * 100)
        : 100;

    return {
      totalRevenue,
      totalOrders,
      totalUnitsSold,
      avgOrderValue,
      pendingOrders: pendingTxs.length,
      cancelledOrders: cancelledTxs.length,
      completionRate,
      avgRating,
      totalReviews: reviewStats.totalReviews || 0,
      positiveRate,
    };
  }, [filteredTransactions, reviewStats, shop?.rating]);

  // Generate Daily Trend Data for Recharts
  const chartData = useMemo(() => {
    const now = new Date();
    const daysCount = period === "7days" ? 7 : period === "30days" ? 30 : 14;

    const dateBuckets: { [key: string]: { label: string; revenue: number; orders: number } } = {};

    // Generate buckets from earliest to today
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: daysCount > 7 ? "numeric" : "short",
      });
      dateBuckets[dateKey] = { label, revenue: 0, orders: 0 };
    }

    // Populate with real transactions
    for (const tx of filteredTransactions) {
      if (tx.status !== "PAID" && tx.status !== "SETTLED") continue;
      const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
      if (!txDate || isNaN(txDate.getTime())) continue;

      const dateKey = txDate.toISOString().split("T")[0];
      if (dateBuckets[dateKey]) {
        dateBuckets[dateKey].revenue += Number(tx.netAmount ?? tx.totalAmount) || 0;
        dateBuckets[dateKey].orders += 1;
      }
    }

    return Object.values(dateBuckets);
  }, [filteredTransactions, period]);

  // Group Top Products from Transactions
  const topProducts = useMemo(() => {
    const productSalesMap: {
      [id: string]: {
        productId: string;
        title: string;
        image?: string;
        unitsSold: number;
        revenue: number;
        ordersCount: number;
      };
    } = {};

    // Calculate from paid transactions
    for (const tx of transactions) {
      if (tx.status !== "PAID" && tx.status !== "SETTLED") continue;
      const pId = tx.productId || tx.productTitle || "general";
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = {
          productId: pId,
          title: tx.productTitle || "Produk Digital",
          image: tx.productImage,
          unitsSold: 0,
          revenue: 0,
          ordersCount: 0,
        };
      }
      productSalesMap[pId].unitsSold += Number(tx.quantity) || 1;
      productSalesMap[pId].revenue += Number(tx.netAmount ?? tx.totalAmount) || 0;
      productSalesMap[pId].ordersCount += 1;
    }

    const sortedFromTx = Object.values(productSalesMap).sort(
      (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue
    );

    // If transactions don't have enough product detail, supplement from products table
    if (sortedFromTx.length === 0 && products.length > 0) {
      return products.slice(0, 5).map((p) => ({
        productId: p.id,
        title: p.title || p.name || "Produk",
        image: p.images?.[0]?.imageUrl || p.image,
        unitsSold: Number(p.salesCount) || 0,
        revenue: (Number(p.salesCount) || 0) * (Number(p.price) || 0),
        ordersCount: Number(p.salesCount) || 0,
        price: Number(p.price) || 0,
      }));
    }

    return sortedFromTx.slice(0, 5);
  }, [transactions, products]);

  // Payment Methods Breakdown
  const paymentMethodsBreakdown = useMemo(() => {
    const counts: { [method: string]: { count: number; total: number } } = {};
    const paidTxs = filteredTransactions.filter(
      (tx) => tx.status === "PAID" || tx.status === "SETTLED"
    );

    for (const tx of paidTxs) {
      const rawName = tx.paymentMethodName || tx.paymentCategory || "QRIS";
      // Normalize: strip suffixes like "All Payment", "All Payments" to prevent duplicates
      const name = rawName
        .replace(/\s+All\s+Payments?$/i, "")
        .replace(/\s+\(.*?\)$/i, "")
        .trim() || rawName;
      if (!counts[name]) counts[name] = { count: 0, total: 0 };
      counts[name].count += 1;
      counts[name].total += Number(tx.totalAmount) || 0;
    }

    const totalCount = paidTxs.length || 1;
    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        percentage: Math.round((data.count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTransactions]);

  const isLoadingInitial = !mounted || authLoading || (isLoadingData && transactions.length === 0);

  if (isLoadingInitial) {
    return (
      <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>

        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Statistik & Analisis Bisnis
              </h1>
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] hover:bg-[#00AA5B]/15 border-none font-bold text-[11px] px-2 py-0.5">
                Real-Time
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Pantau omzet penjualan, konversi pesanan, dan tren performa toko Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
              <SelectTrigger className="h-8.5 w-[145px] sm:w-[160px] rounded-xl border-border bg-white text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="7days" className="text-xs">7 Hari Terakhir</SelectItem>
                <SelectItem value="30days" className="text-xs">30 Hari Terakhir</SelectItem>
                <SelectItem value="this_month" className="text-xs">Bulan Ini</SelectItem>
                <SelectItem value="all" className="text-xs">Semua Waktu</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoadingData}
              className="h-8.5 rounded-xl text-xs font-semibold border-border hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <RotateCw className={cn("w-3.5 h-3.5", (isRefreshing || isLoadingData) && "animate-spin text-[#00AA5B]")} />
              <span className="hidden sm:inline">{isRefreshing ? "Menyinkronkan..." : "Perbarui"}</span>
            </Button>
          </div>
        </div>

        {/* 4 Key Performance Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Total Revenue */}
          <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Omzet
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {formatCompactRupiah(metrics.totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                {metrics.totalOrders} transaksi berhasil
              </p>
            </div>
          </Card>

          {/* Metric 2: Completed Orders */}
          <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pesanan Sukses
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalOrders}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                <span className="text-emerald-700 font-bold">{metrics.completionRate}%</span>
                <span>penyelesaian</span>
              </div>
            </div>
          </Card>

          {/* Metric 3: Units Sold */}
          <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Produk Terjual
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalUnitsSold} <span className="text-xs font-semibold text-muted-foreground">unit</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                Rata-rata {formatCompactRupiah(metrics.avgOrderValue)} / order
              </p>
            </div>
          </Card>

          {/* Metric 4: Store Rating */}
          <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Rating & Ulasan
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-[#FFC400] flex items-center justify-center">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#FFC400]" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {metrics.avgRating}
                </span>
                <span className="text-xs font-bold text-muted-foreground">/ 5.0</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                {metrics.positiveRate}% ulasan positif ({metrics.totalReviews})
              </p>
            </div>
          </Card>
        </div>

        {/* Charts & Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Chart (2 cols on lg) */}
          <Card className="lg:col-span-2 border-border border shadow-xs rounded-2xl bg-white p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tren Penjualan & Pesanan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Grafik pergerakan performa transaksi tokomu.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setChartMetric("revenue")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      chartMetric === "revenue"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-muted-foreground hover:text-slate-900"
                    )}
                  >
                    Omzet (Rp)
                  </button>
                  <button
                    onClick={() => setChartMetric("orders")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      chartMetric === "orders"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-muted-foreground hover:text-slate-900"
                    )}
                  >
                    Pesanan
                  </button>
                </div>
              </div>

              {/* Responsive Recharts Container */}
              <div className="h-[260px] sm:h-[300px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00AA5B" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00AA5B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
                      tickFormatter={(val) =>
                        chartMetric === "revenue" ? formatCompactRupiah(val) : String(val)
                      }
                      width={chartMetric === "revenue" ? 70 : 35}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                              <p className="font-semibold text-slate-300">{data.label}</p>
                              <p className="font-black text-[#00AA5B] text-sm">
                                {chartMetric === "revenue"
                                  ? formatRupiah(data.revenue)
                                  : `${data.orders} Pesanan`}
                              </p>
                              {chartMetric === "revenue" && (
                                <p className="text-[11px] text-slate-400">
                                  {data.orders} pesanan berhasil
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartMetric}
                      stroke="#00AA5B"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#metricGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Status Pesanan:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> {metrics.totalOrders} Berhasil
                </span>
                {metrics.pendingOrders > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <Clock className="w-3 h-3" /> {metrics.pendingOrders} Pending
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Secondary Column: Breakdown & Quick Insights */}
          <div className="space-y-4 sm:space-y-5">
            {/* Payment Methods Card */}
            <Card className="border-border border shadow-xs rounded-2xl bg-white p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Metode Pembayaran
                </h4>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>

              {paymentMethodsBreakdown.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Belum ada transaksi pembayaran pada periode ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentMethodsBreakdown.slice(0, 4).map((pm, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{pm.name}</span>
                        <span className="font-bold text-slate-900">
                          {pm.count}x ({pm.percentage}%)
                        </span>
                      </div>
                      <Progress value={pm.percentage} className="h-1.5 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Smart Insight Card */}
            <Card className="border-border border shadow-xs rounded-2xl bg-emerald-50/60 p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#00AA5B] text-white flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Insight Pertumbuhan Toko
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {metrics.totalOrders > 0
                      ? `Tingkat penyelesaian transaksi tokomu mencapai ${metrics.completionRate}%. Terus jaga respon cepat ulasan agar pembeli makin percaya.`
                      : "Toko Anda siap menerima pesanan! Bagikan tautan produk dan pasang voucher promosi untuk memancing pesanan pertama."}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-semibold rounded-xl border-emerald-300/80 bg-white hover:bg-emerald-100/50 text-[#00AA5B] cursor-pointer"
                >
                  <Link href="/my-shop/vouchers">
                    Buat Voucher Promosi Toko
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Products Performance Section */}
        <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                Performa Produk Unggulan
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Produk dengan kontribusi penjualan dan perputaran omzet tertinggi.
              </CardDescription>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold text-[#00AA5B] hover:text-[#00AA5B] hover:bg-[#00AA5B]/10 rounded-xl self-start sm:self-auto gap-1 cursor-pointer"
            >
              <Link href="/my-shop/products">
                <span>Kelola Semua Produk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto border border-border">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Belum Ada Data Penjualan Produk
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Data peringkat produk terlaris akan otomatis dihitung berdasarkan transaksi sukses pembeli.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.productId || idx}
                    className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-xs text-slate-400">
                        #{idx + 1}
                      </span>

                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="space-y-0.5 max-w-sm sm:max-w-md">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {p.ordersCount}x dipesan • {p.unitsSold} unit terjual
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-black text-[#00AA5B]">
                          {formatRupiah(p.revenue)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                          Total Omzet
                        </p>
                      </div>

                      {p.productId && p.productId !== "general" && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-xl border-border text-xs font-semibold hover:text-[#00AA5B] hover:border-[#00AA5B] cursor-pointer"
                        >
                          <Link href={`/products/${p.productId}`} target="_blank">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
