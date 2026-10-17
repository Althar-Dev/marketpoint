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
  ChevronDown,
  Layers,
  ArrowDownRight,
  Percent,
  Crown,
  Lock,
  Download,
  Flame,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

/**
 * Loads the MarketPoint official logo as an optimized Base64 data URL for PDF generation
 */
async function loadLogoBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 120; // Crisp high-DPI (4x) for 28x28 pt in PDF
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(img.src);
            return;
          }
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(img.src);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "/assets/img/logo.png";
    });
  } catch {
    return null;
  }
}

export default function MerchantStatsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { shopId: contextShopId, shop: contextShop, effectiveFeatures, isAdmin } = useMerchantShop();

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

  // Subscription Info dynamically derived from Merchant Context
  const subInfo = useMemo(
    () => ({
      planId: effectiveFeatures.planId,
      planName: effectiveFeatures.planName,
      commissionRate: effectiveFeatures.commissionRate,
      hasAdvancedStats: effectiveFeatures.hasAdvancedStats,
      has30DaysStats: effectiveFeatures.has30DaysStats,
      hasAllTimeStats: effectiveFeatures.hasAllTimeStats,
    }),
    [effectiveFeatures]
  );

  const canAccess30Days = subInfo.has30DaysStats;
  const canAccessAllTime = subInfo.hasAllTimeStats;

  // Upgrade Modal State for Advanced Analytics
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState({
    title: "",
    description: "",
  });

  const openUpgradeModal = (title: string, description: string) => {
    setUpgradeModalFeature({ title, description });
    setShowUpgradeModal(true);
  };

  const handlePeriodChange = (val: "7days" | "30days" | "this_month" | "all") => {
    if ((val === "30days" || val === "this_month") && !canAccess30Days) {
      openUpgradeModal(
        "Akses Riwayat Statistik 30 Hari Khusus Plan Pro & Prime",
        `Toko Anda saat ini menggunakan Plan ${subInfo.planName}. Tingkatkan paket ke Pro atau Prime untuk mengakses analisis performa dan transaksi toko hingga 30 hari terakhir.`
      );
      return;
    }

    if (val === "all" && !canAccessAllTime) {
      openUpgradeModal(
        "Akses Riwayat Statistik Lengkap (Semua Waktu) Khusus Plan Prime",
        `Toko Anda saat ini menggunakan Plan ${subInfo.planName}. Tingkatkan paket ke Prime untuk membuka seluruh data analitik performa toko sepanjang masa (Semua Waktu).`
      );
      return;
    }

    setPeriod(val);
  };

  // Sync period state with plan tier permissions
  useEffect(() => {
    if (!canAccessAllTime && period === "all") {
      setPeriod(canAccess30Days ? "30days" : "7days");
    } else if (!canAccess30Days && (period === "30days" || period === "this_month")) {
      setPeriod("7days");
    }
  }, [canAccess30Days, canAccessAllTime, period]);

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
      totalAllAttempts > 0 ? Math.round((totalOrders / totalAllAttempts) * 100) : 0;

    // Pertumbuhan Omzet (% vs periode sebelumnya)
    const now = new Date();
    const periodDays = period === "7days" ? 7 : period === "30days" ? 30 : 30;
    const prevPeriodTransactions = transactions.filter((tx) => {
      if (period === "all") return false;
      const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
      if (!txDate || isNaN(txDate.getTime())) return false;
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > periodDays && diffDays <= periodDays * 2;
    });

    const prevRevenue = prevPeriodTransactions
      .filter((tx) => tx.status === "PAID" || tx.status === "SETTLED")
      .reduce((sum, tx) => sum + (Number(tx.netAmount ?? tx.totalAmount) || 0), 0);

    let growthPct = 0;
    if (prevRevenue > 0) {
      growthPct = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    } else if (totalRevenue > 0) {
      growthPct = 100;
    }

    // Pembelian Berulang (Repeat Order Rate)
    const buyerTxsCount: { [buyer: string]: number } = {};
    paidTxs.forEach((tx) => {
      const bKey = tx.buyerId || tx.userId || tx.customerEmail || tx.buyerEmail || tx.buyerName || "cust";
      buyerTxsCount[bKey] = (buyerTxsCount[bKey] || 0) + 1;
    });
    const totalBuyers = Object.keys(buyerTxsCount).length;
    const repeatBuyers = Object.values(buyerTxsCount).filter((c) => c > 1).length;
    const repeatOrderRate = totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 100) : 0;

    // Rating (100% data riil)
    const hasReviews = (reviewStats.totalReviews || 0) > 0;
    const avgRating = hasReviews
      ? Number(reviewStats.ratingAvg || 0).toFixed(1)
      : shop?.rating
        ? Number(shop.rating).toFixed(1)
        : "0.0";

    const positiveReviews =
      (reviewStats.starCounts?.[5] || 0) + (reviewStats.starCounts?.[4] || 0);
    const positiveRate =
      hasReviews
        ? Math.round((positiveReviews / reviewStats.totalReviews) * 100)
        : 0;

    return {
      totalRevenue,
      growthPct,
      prevRevenue,
      totalOrders,
      totalUnitsSold,
      avgOrderValue,
      repeatOrderRate,
      pendingOrders: pendingTxs.length,
      cancelledOrders: cancelledTxs.length,
      completionRate,
      avgRating,
      totalReviews: reviewStats.totalReviews || 0,
      positiveRate,
    };
  }, [filteredTransactions, transactions, period, reviewStats, shop?.rating]);

  // Kalkulasi penghematan komisi
  const commissionMetrics = useMemo(() => {
    const rev = metrics.totalRevenue;
    const baseRate = 7.0; // Free
    const currentRate = subInfo.commissionRate;
    const savedPct = Math.max(0, baseRate - currentRate);
    const amountSaved = Math.round((rev * savedPct) / 100);
    const currentFee = Math.round((rev * currentRate) / 100);
    const potentialProSavings = Math.round((rev * (baseRate - 3.5)) / 100);

    return {
      baseRate,
      currentRate,
      amountSaved,
      currentFee,
      potentialProSavings,
    };
  }, [metrics.totalRevenue, subInfo.commissionRate]);

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

    const sortedFromTx = Object.values(productSalesMap)
      .filter((p) => p.unitsSold > 0 || p.ordersCount > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

    const limit = subInfo.hasAdvancedStats ? 10 : 3;

    return sortedFromTx.slice(0, limit).map((p, idx) => ({
      ...p,
      isTrending: idx === 0 && p.ordersCount > 0,
    }));
  }, [transactions, subInfo.hasAdvancedStats]);

  // Multi-format Export handler: CSV, Excel, Word, and PDF (via jsPDF - NOT window.print())
  const handleExport = async (format: "csv" | "excel" | "word" | "pdf") => {
    if (!canAccessAllTime) {
      openUpgradeModal(
        "Ekspor Laporan Khusus Plan Prime",
        `Toko Anda saat ini menggunakan Plan ${subInfo.planName}. Tingkatkan ke Plan Prime untuk mengunduh laporan pembukuan transaksi toko lengkap dalam format CSV, Excel, Word, atau PDF.`
      );
      return;
    }

    if (filteredTransactions.length === 0) {
      toast({
        title: "Tidak Ada Data Transaksi",
        description: "Belum ada transaksi pada periode yang dipilih untuk diekspor.",
      });
      return;
    }

    const periodLabel =
      period === "7days"
        ? "7 Hari Terakhir"
        : period === "30days"
          ? "30 Hari Terakhir"
          : period === "this_month"
            ? "Bulan Ini"
            : "Semua Waktu";

    const shopName = shop?.name || "Toko";
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const filenameBase = `laporan-transaksi-${(shop?.slug || "toko").toLowerCase().replace(/[^a-z0-9]/g, "_")}-${period}-${dateStr}`;

    if (format === "csv") {
      const headers = [
        "No",
        "ID Transaksi",
        "Tanggal & Waktu",
        "Nama Produk",
        "Kuantitas",
        "Total Nilai (IDR)",
        "Pendapatan Bersih (IDR)",
        "Status",
        "Metode Pembayaran",
        "Pembeli",
      ];

      const rows = filteredTransactions.map((tx, idx) => [
        idx + 1,
        `"${tx.id || tx.orderId || ""}"`,
        `"${tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : ""}"`,
        `"${(tx.productTitle || tx.productName || "Produk Digital").replace(/"/g, '""')}"`,
        tx.quantity || 1,
        Number(tx.totalAmount || 0),
        Number(tx.netAmount ?? tx.totalAmount ?? 0),
        `"${tx.status || ""}"`,
        `"${tx.paymentMethodName || tx.paymentCategory || "QRIS"}"`,
        `"${tx.buyerName || tx.customerName || tx.buyerEmail || "Pelanggan"}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filenameBase}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "File CSV Berhasil Diunduh",
        description: "Data transaksi toko telah diekspor ke file CSV.",
      });
    } else if (format === "excel") {
      const rowsHtml = filteredTransactions
        .map((tx, idx) => {
          const txDate = tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : "-";
          const prodName = (tx.productTitle || tx.productName || "Produk Digital").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const qty = tx.quantity || 1;
          const total = Number(tx.totalAmount || 0);
          const net = Number(tx.netAmount ?? tx.totalAmount ?? 0);
          const status = tx.status || "-";
          const method = tx.paymentMethodName || tx.paymentCategory || "QRIS";
          const buyer = (tx.buyerName || tx.customerName || tx.buyerEmail || "Pelanggan").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const isPaid = status === "PAID" || status === "SETTLED";
          const statusClass = isPaid ? "status-paid" : status === "PENDING" ? "status-pending" : "status-cancel";

          return `<tr>
            <td class="text-center">${idx + 1}</td>
            <td style="mso-number-format:'\\@';">${tx.id || tx.orderId || "-"}</td>
            <td>${txDate}</td>
            <td>${prodName}</td>
            <td class="text-center">${qty}</td>
            <td class="text-right">${total.toLocaleString("id-ID")}</td>
            <td class="text-right" style="font-weight:bold;color:#00AA5B;">${net.toLocaleString("id-ID")}</td>
            <td class="${statusClass}">${status}</td>
            <td>${method}</td>
            <td>${buyer}</td>
          </tr>`;
        })
        .join("\n");

      const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Laporan Transaksi</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    .title { font-size: 16pt; font-weight: bold; color: #00AA5B; }
    .subtitle { font-size: 10pt; color: #64748B; }
    .kpi-title { font-size: 9pt; color: #64748B; font-weight: bold; text-transform: uppercase; }
    .kpi-value { font-size: 14pt; color: #0F172A; font-weight: bold; }
    th { background-color: #00AA5B; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; }
    td { border: 1px solid #CBD5E1; padding: 6px 10px; font-size: 10pt; vertical-align: middle; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .status-paid { background-color: #DCFCE7; color: #166534; font-weight: bold; text-align: center; }
    .status-pending { background-color: #FEF3C7; color: #92400E; font-weight: bold; text-align: center; }
    .status-cancel { background-color: #FEE2E2; color: #991B1B; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="10" class="title">LAPORAN TRANSAKSI &amp; PEMBUKUAN TOKO</td></tr>
    <tr><td colspan="10" class="subtitle">Nama Toko: <b>${shopName}</b> &bull; Periode: <b>${periodLabel}</b> &bull; Waktu Ekspor: ${dateStr} ${timeStr}</td></tr>
    <tr><td colspan="10"></td></tr>
    <tr style="background-color: #F8FAFC;">
      <td colspan="2" style="border: 1px solid #CBD5E1; padding: 10px;">
        <div class="kpi-title">TOTAL OMZET</div>
        <div class="kpi-value">${formatRupiah(metrics.totalRevenue)}</div>
      </td>
      <td colspan="3" style="border: 1px solid #CBD5E1; padding: 10px;">
        <div class="kpi-title">TOTAL TRANSAKSI</div>
        <div class="kpi-value">${filteredTransactions.length} Pesanan</div>
      </td>
      <td colspan="2" style="border: 1px solid #CBD5E1; padding: 10px;">
        <div class="kpi-title">PRODUK TERJUAL</div>
        <div class="kpi-value">${metrics.totalUnitsSold} Unit</div>
      </td>
      <td colspan="3" style="border: 1px solid #CBD5E1; padding: 10px;">
        <div class="kpi-title">TINGKAT SUKSES</div>
        <div class="kpi-value">${metrics.completionRate}%</div>
      </td>
    </tr>
    <tr><td colspan="10"></td></tr>
    <tr>
      <th>No</th>
      <th>ID Transaksi</th>
      <th>Tanggal &amp; Waktu</th>
      <th>Nama Produk</th>
      <th>Qty</th>
      <th>Total Nilai (IDR)</th>
      <th>Pendapatan Bersih (IDR)</th>
      <th>Status</th>
      <th>Metode Pembayaran</th>
      <th>Pembeli</th>
    </tr>
    ${rowsHtml}
  </table>
</body>
</html>`;

      const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenameBase}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "File Excel Berhasil Diunduh",
        description: "Data transaksi telah diekspor ke Microsoft Excel (.xls).",
      });
    } else if (format === "word") {
      const rowsHtml = filteredTransactions
        .map((tx, idx) => {
          const txDate = tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : "-";
          const prodName = (tx.productTitle || tx.productName || "Produk Digital").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const qty = tx.quantity || 1;
          const total = Number(tx.totalAmount || 0);
          const net = Number(tx.netAmount ?? tx.totalAmount ?? 0);
          const status = tx.status || "-";
          const method = tx.paymentMethodName || tx.paymentCategory || "QRIS";
          const buyer = (tx.buyerName || tx.customerName || tx.buyerEmail || "Pelanggan").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const isPaid = status === "PAID" || status === "SETTLED";
          const badgeColor = isPaid ? "#166534; background-color: #DCFCE7;" : status === "PENDING" ? "#92400E; background-color: #FEF3C7;" : "#991B1B; background-color: #FEE2E2;";

          return `<tr>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-size: 8pt;">${tx.id || tx.orderId || "-"}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${txDate}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${prodName}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${qty}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Rp ${total.toLocaleString("id-ID")}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold; color: #00AA5B;">Rp ${net.toLocaleString("id-ID")}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;"><span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; color: ${badgeColor}">${status}</span></td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${method}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${buyer}</td>
          </tr>`;
        })
        .join("\n");

      const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Laporan Transaksi - ${shopName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 36pt; }
    div.Section1 { page: Section1; }
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; color: #1e293b; }
    h1 { font-size: 18pt; color: #00AA5B; margin: 0 0 4px 0; font-weight: bold; }
    p.subtitle { font-size: 9.5pt; color: #64748b; margin: 0 0 16px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #00AA5B; color: #ffffff; padding: 8px 6px; font-size: 8.5pt; border: 1px solid #cbd5e1; text-align: left; }
  </style>
</head>
<body>
  <div class="Section1">
    <h1>LAPORAN PEMBUKUAN &amp; TRANSAKSI TOKO</h1>
    <p class="subtitle">Nama Toko: <b>${shopName}</b> &bull; Periode: <b>${periodLabel}</b> &bull; Dicetak: ${dateStr} ${timeStr}</p>

    <table style="margin-bottom: 16px; border: 1px solid #e2e8f0; background-color: #f8fafc;">
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 8pt; color: #64748b; font-weight: bold;">TOTAL OMZET</div>
          <div style="font-size: 13pt; font-weight: bold; color: #0f172a;">${formatRupiah(metrics.totalRevenue)}</div>
        </td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 8pt; color: #64748b; font-weight: bold;">TOTAL TRANSAKSI</div>
          <div style="font-size: 13pt; font-weight: bold; color: #0f172a;">${filteredTransactions.length} Pesanan</div>
        </td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 8pt; color: #64748b; font-weight: bold;">PRODUK TERJUAL</div>
          <div style="font-size: 13pt; font-weight: bold; color: #0f172a;">${metrics.totalUnitsSold} Unit</div>
        </td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 8pt; color: #64748b; font-weight: bold;">TINGKAT PENYELESAIAN</div>
          <div style="font-size: 13pt; font-weight: bold; color: #00AA5B;">${metrics.completionRate}%</div>
        </td>
      </tr>
    </table>

    <table>
      <thead>
        <tr>
          <th style="width: 25px; text-align: center;">No</th>
          <th style="width: 80px;">ID Transaksi</th>
          <th style="width: 90px;">Tanggal &amp; Waktu</th>
          <th>Nama Produk</th>
          <th style="width: 35px; text-align: center;">Qty</th>
          <th style="width: 85px; text-align: right;">Total Nilai</th>
          <th style="width: 85px; text-align: right;">Pendapatan Bersih</th>
          <th style="width: 65px; text-align: center;">Status</th>
          <th style="width: 80px;">Metode Bayar</th>
          <th style="width: 85px;">Pembeli</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

      const blob = new Blob([wordHtml], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenameBase}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "File Word Berhasil Diunduh",
        description: "Data transaksi telah diekspor ke Microsoft Word (.doc).",
      });
    } else if (format === "pdf") {
      // Generate actual PDF document using jsPDF (DIRECT FILE DOWNLOAD - NEVER window.print())
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Top Decorative Green Accent Bar
      doc.setFillColor(0, 170, 91); // Emerald #00AA5B
      doc.rect(0, 0, pageWidth, 4, "F");

      // 2. Load Official MarketPoint Logo
      const logoBase64 = await loadLogoBase64();
      let brandTitleX = 36;

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", 36, 14, 28, 28);
          brandTitleX = 72;
        } catch (e) {
          console.warn("Could not add logo to PDF:", e);
        }
      }

      // Brand Title & Subtitle (Left Header)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 170, 91);
      doc.text("MarketPoint", brandTitleX, 26);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Seller Center  •  Laporan Resmi Pembukuan & Transaksi", brandTitleX, 38);

      // Store Info & Period Subheader (Right Header)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(shopName, pageWidth - 36, 26, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Periode: ${periodLabel}   |   Dicetak: ${dateStr} ${timeStr}`, pageWidth - 36, 38, { align: "right" });

      // Subtle Divider Line below Header
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(36, 49, pageWidth - 36, 49);

      // 3. KPI Summary Cards (y = 57 to 95, height = 38 pt)
      const kpiY = 57;
      const cardGap = 10;
      const totalWidth = pageWidth - 72;
      const cardWidth = (totalWidth - 3 * cardGap) / 4;
      const cardHeight = 38;

      const totalNetRevenue = filteredTransactions.reduce(
        (acc, tx) => acc + (Number(tx.netAmount ?? tx.totalAmount) || 0),
        0
      );

      const kpis = [
        { label: "TOTAL OMZET KOTOR", val: formatRupiah(metrics.totalRevenue), color: [15, 23, 42] as [number, number, number] },
        { label: "PENDAPATAN BERSIH", val: formatRupiah(totalNetRevenue), color: [0, 170, 91] as [number, number, number] },
        { label: "TOTAL PESANAN", val: `${filteredTransactions.length} Pesanan`, color: [15, 23, 42] as [number, number, number] },
        { label: "PRODUK TERJUAL", val: `${metrics.totalUnitsSold} Unit (${metrics.completionRate}% Sukses)`, color: [15, 23, 42] as [number, number, number] },
      ];

      kpis.forEach((kpi, idx) => {
        const cardX = 36 + idx * (cardWidth + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, kpiY, cardWidth, cardHeight, 4, 4, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, cardX + 9, kpiY + 14);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...kpi.color);
        doc.text(kpi.val, cardX + 9, kpiY + 29);
      });

      // 4. Transactions Table (Single-line, NO BREAKLINE, elegant styling)
      const tableHeaders = [
        [
          "No",
          "ID Transaksi",
          "Tanggal & Waktu",
          "Nama Produk",
          "Qty",
          "Total (IDR)",
          "Bersih (IDR)",
          "Status",
          "Metode Bayar",
          "Pembeli",
        ],
      ];

      const tableRows = filteredTransactions.map((tx, idx) => [
        String(idx + 1),
        tx.id || tx.orderId || "-",
        tx.createdAt ? new Date(tx.createdAt).toLocaleString("id-ID") : "-",
        tx.productTitle || tx.productName || "Produk Digital",
        String(tx.quantity || 1),
        Number(tx.totalAmount || 0).toLocaleString("id-ID"),
        Number(tx.netAmount ?? tx.totalAmount ?? 0).toLocaleString("id-ID"),
        tx.status || "-",
        tx.paymentMethodName || tx.paymentCategory || "QRIS",
        tx.buyerName || tx.customerName || tx.buyerEmail || "Pelanggan",
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 104,
        margin: { left: 36, right: 36, bottom: 35 },
        theme: "plain",
        styles: {
          font: "helvetica",
          overflow: "ellipsize", // NO BREAKLINE: truncate cleanly with ... on single line
          cellPadding: { top: 4.5, bottom: 4.5, left: 4.5, right: 4.5 },
          valign: "middle",
          lineWidth: 0.5,
          lineColor: [226, 232, 240], // subtle clean borders
          minCellHeight: 18,
        },
        headStyles: {
          fillColor: [0, 170, 91],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.5,
          overflow: "ellipsize",
          halign: "left",
          cellPadding: { top: 5.5, bottom: 5.5, left: 4.5, right: 4.5 },
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          overflow: "ellipsize", // NO BREAKLINE: guarantee all body text stays on 1 line
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center" },
          1: { cellWidth: 80 },
          2: { cellWidth: 80 },
          3: { cellWidth: 185 },
          4: { cellWidth: 26, halign: "center" },
          5: { cellWidth: 76, halign: "right" },
          6: { cellWidth: 76, halign: "right", fontStyle: "bold", textColor: [0, 170, 91] },
          7: { cellWidth: 62, halign: "center", fontStyle: "bold" },
          8: { cellWidth: 76 },
          9: { cellWidth: 84 },
        },
        didParseCell: (data) => {
          // Color badges for transaction status
          if (data.section === "body" && data.column.index === 7) {
            const status = String(data.cell.raw || "");
            if (status === "PAID" || status === "SETTLED") {
              data.cell.styles.textColor = [22, 101, 52]; // green-800
              data.cell.styles.fillColor = [220, 252, 231]; // green-100
            } else if (status === "PENDING") {
              data.cell.styles.textColor = [146, 64, 14]; // amber-800
              data.cell.styles.fillColor = [254, 243, 199]; // amber-100
            } else if (status === "CANCELLED" || status === "FAILED") {
              data.cell.styles.textColor = [153, 27, 27]; // red-800
              data.cell.styles.fillColor = [254, 226, 226]; // red-100
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const footerY = doc.internal.pageSize.getHeight() - 18;

          // Subtle divider line above footer
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(36, footerY - 8, pageWidth - 36, footerY - 8);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            "MarketPoint Official Seller Statement  •  Dokumen Rekapitulasi Pembukuan Toko Resmi",
            36,
            footerY
          );
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount}`,
            pageWidth - 36,
            footerY,
            { align: "right" }
          );
        },
      });

      // Direct PDF file download (ZERO window.print())
      doc.save(`${filenameBase}.pdf`);

      toast({
        title: "File PDF Berhasil Diunduh",
        description: "Laporan transaksi resmi telah diunduh sebagai dokumen PDF.",
      });
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Statistik & Analisis Bisnis
              </h1>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              Pantau omzet penjualan, konversi pesanan, dan tren performa toko Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-9 w-[160px] sm:w-[175px] rounded-xl border border-border bg-white text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-all">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border p-1">
                <SelectItem value="7days" className="text-xs font-medium cursor-pointer">
                  7 Hari Terakhir
                </SelectItem>
                <SelectItem value="30days" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>30 Hari Terakhir</span>
                    {!canAccess30Days && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200/80 px-1.5 py-0.2 rounded-md shrink-0">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        Pro
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="this_month" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>Bulan Ini</span>
                    {!canAccess30Days && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200/80 px-1.5 py-0.2 rounded-md shrink-0">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        Pro
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>Semua Waktu</span>
                    {!canAccessAllTime && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200/80 px-1.5 py-0.2 rounded-md shrink-0">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        Prime
                      </span>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {!canAccessAllTime ? (
              <Button
                variant="outline"
                onClick={() =>
                  openUpgradeModal(
                    "Ekspor Laporan Khusus Plan Prime",
                    `Toko Anda saat ini menggunakan Plan ${subInfo.planName}. Tingkatkan ke Plan Prime untuk mengunduh laporan pembukuan transaksi toko lengkap dalam format CSV, Excel, Word, atau PDF.`
                  )
                }
                className="h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/50 text-amber-800 gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Ekspor Laporan</span>
                <span className="text-[9px] font-bold bg-amber-200/60 text-amber-800 px-1.5 py-0.2 rounded-md">Prime</span>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 sm:px-3.5 rounded-xl text-xs font-semibold border border-border bg-white hover:bg-slate-50 text-slate-700 gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00AA5B]" />
                    <span className="hidden sm:inline">Ekspor Laporan</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl border-border p-1.5 shadow-lg">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2 py-1">
                    Pilih Format Ekspor
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleExport("csv")}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">CSV (.csv)</span>
                      <span className="text-[10px] text-muted-foreground">Spreadsheet & data tabular</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("excel")}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">Microsoft Excel (.xls)</span>
                      <span className="text-[10px] text-muted-foreground">Lembar kerja & formula rapi</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("word")}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800">Microsoft Word (.doc)</span>
                      <span className="text-[10px] text-muted-foreground">Dokumen laporan arsip toko</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-rose-50/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800">Dokumen PDF (.pdf)</span>
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-100/70 px-1 rounded">Unduh</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Unduh file PDF</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoadingData}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-border bg-white hover:bg-slate-50 text-slate-700 gap-2 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-muted-foreground", (isRefreshing || isLoadingData) && "animate-spin text-[#00AA5B]")} />
              <span className="hidden sm:inline">{isRefreshing ? "Menyinkronkan..." : "Perbarui"}</span>
            </Button>
          </div>
        </div>

        {/* 4 Key Performance Metrics Cards: Dasar & Lanjutan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Total Omzet */}
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
              {subInfo.hasAdvancedStats ? (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold">
                  {metrics.growthPct > 0 ? (
                    <span className="text-emerald-700 flex items-center font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> +{metrics.growthPct}%
                    </span>
                  ) : metrics.growthPct < 0 ? (
                    <span className="text-rose-600 flex items-center font-bold">
                      <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" /> {metrics.growthPct}%
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold">0% stabil</span>
                  )}
                  <span className="text-muted-foreground font-normal">vs periode lalu</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {metrics.totalOrders} order berhasil
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openUpgradeModal(
                        "Pertumbuhan Omzet Toko",
                        "Ketahui persentase pergerakan omzet bisnis Anda dibandingkan periode sebelumnya secara otomatis untuk mengevaluasi efektivitas penjualan."
                      )
                    }
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                    <span>% Tren (Pro)</span>
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Metric 2: Completed Orders */}
          <Card className="border-border border shadow-xs rounded-2xl bg-white overflow-hidden p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Pesanan
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalOrders}
              </p>
              {subInfo.hasAdvancedStats ? (
                <p className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                  Rata-rata: <strong className="text-slate-900 font-bold">{formatCompactRupiah(metrics.avgOrderValue)}</strong> / order
                </p>
              ) : (
                <div className="flex items-center justify-between gap-1 mt-1">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <span className="text-emerald-700 font-bold">{metrics.completionRate}%</span>
                    <span>sukses</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openUpgradeModal(
                        "Rata-Rata Nilai Pesanan (AOV)",
                        "Analisis rata-rata nominal belanja pembeli per transaksi (AOV) untuk membantu merancang strategi harga dan promo toko."
                      )
                    }
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                    <span>Rata-Rata (Pro)</span>
                  </button>
                </div>
              )}
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
              {subInfo.hasAdvancedStats ? (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                  <span className="text-emerald-700 font-bold">{metrics.repeatOrderRate}%</span>
                  <span>pembeli berulang</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    Total unit laku
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openUpgradeModal(
                        "Tingkat Pembelian Ulang (Repeat Order)",
                        "Lacak persentase pembeli setia yang melakukan order kembali di toko Anda untuk menganalisis retensi pelanggan."
                      )
                    }
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                    <span>% Repeat (Pro)</span>
                  </button>
                </div>
              )}
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
                {subInfo.hasAdvancedStats ? (
                  <>
                    <strong className="text-emerald-700 font-bold">{metrics.positiveRate}%</strong> ulasan positif ({metrics.totalReviews})
                  </>
                ) : (
                  `${metrics.totalReviews} ulasan diterima`
                )}
              </p>
            </div>
          </Card>
        </div>

        {/* Banner Penghematan Komisi Plan */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0 border border-emerald-100">
              <Percent className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-[#212121]">
                  Tarif Komisi Toko: {subInfo.commissionRate}%
                </span>
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 bg-emerald-50 text-emerald-800 px-2 py-0">
                  Plan {subInfo.planName}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {subInfo.planId === "prime" || subInfo.planId === "pro" || subInfo.planId === "plus"
                  ? `Dengan tarif komisi ${subInfo.commissionRate}%, toko Anda telah menghemat ${formatRupiah(commissionMetrics.amountSaved)} dibandingkan tarif Free 7.0%.`
                  : `Toko Anda menggunakan tarif Free 7.0%. Upgrade ke Pro (3.5%) atau Prime (2.0%) untuk memangkas potongan komisi hingga 70%!`}
              </p>
            </div>
          </div>

          <Link href="/my-shop/subscription" className="shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-slate-50 text-slate-800 shadow-2xs"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              Kelola Plan
            </Button>
          </Link>
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {p.title}
                          </p>
                          {p.isTrending && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0 gap-1 border-none shadow-2xs shrink-0">
                              <Flame className="w-2.5 h-2.5 fill-white" /> Trending
                            </Badge>
                          )}
                        </div>
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

          {/* Footer Notice if on Free / Plus plan */}
          {!subInfo.hasAdvancedStats && (
            <div className="p-3 bg-slate-50/70 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="text-[11px]">
                Menampilkan 3 produk teratas (Plan {subInfo.planName})
              </span>
              <button
                type="button"
                onClick={() =>
                  openUpgradeModal(
                    "Peringkat 10 Produk & Deteksi Produk Trending",
                    "Dapatkan wawasan performa hingga 10 produk terlaris lengkap dengan indikator produk yang sedang tren naik di toko Anda."
                  )
                }
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Buka Top 10 & Analisis Tren (Pro)</span>
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Dialog Upgrade Plan untuk Fitur Statistik Lanjutan */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-border shadow-xl">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-base font-extrabold text-[#212121]">
              {upgradeModalFeature.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
              {upgradeModalFeature.description}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 my-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Plan Toko Saat Ini:</span>
              <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                {subInfo.planName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Mulai Tersedia Pada:</span>
              <span className="font-extrabold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                {upgradeModalFeature.title.includes("Semua Waktu") || upgradeModalFeature.title.includes("Ekspor")
                  ? "Paket Prime"
                  : "Paket Pro atau Prime"}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="rounded-xl text-xs font-bold h-9 px-4"
            >
              Nanti Saja
            </Button>
            <Link href="/my-shop/subscription" onClick={() => setShowUpgradeModal(false)}>
              <Button
                type="button"
                className="w-full sm:w-auto rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-extrabold text-xs gap-1.5 shadow-md shadow-[#00AA5B]/20 h-9 px-4"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade Plan Toko
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
