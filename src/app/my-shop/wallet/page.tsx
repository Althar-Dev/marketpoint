"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldAlert,
  Eye,
  Copy,
  FileText,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMerchantShop } from "@/context/merchant-context";

export default function MerchantWalletPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  const {
    shopId,
    loading: merchantLoading,
    isOwner,
    isStaff,
    staffRole,
    staffPermissions,
  } = useMerchantShop();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTargetId = shopId || user?.uid;

  const walletRef = useMemoFirebase(() => {
    if (!activeTargetId) return null;
    return doc(db, "users", activeTargetId, "wallet", "info");
  }, [db, activeTargetId]);

  const transactionQuery = useMemoFirebase(() => {
    if (!activeTargetId) return null;
    return query(
      collection(db, "users", activeTargetId, "transactions"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [db, activeTargetId]);

  const ordersQuery = useMemoFirebase(() => {
    if (!activeTargetId || !db) return null;
    return query(collection(db, "shops", activeTargetId, "orders"));
  }, [db, activeTargetId]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: transactions, loading: transLoading } = useCollection(transactionQuery);
  const { data: rawOrders } = useCollection(ordersQuery);
  const [pgOrders, setPgOrders] = useState<any[]>([]);

  // Ambil transaksi toko dari PostgreSQL
  useEffect(() => {
    if (!activeTargetId) return;
    fetch(`/api/transactions?shopId=${activeTargetId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.transactions)) {
          setPgOrders(data.transactions);
        }
      })
      .catch((err) => console.warn("[WALLET PG ORDERS ERROR]", err));
  }, [activeTargetId]);

  // Durasi settlement saldo penjualan: 3 Hari (72 jam)
  const SETTLEMENT_DAYS = 3;
  const SETTLEMENT_MS = SETTLEMENT_DAYS * 24 * 60 * 60 * 1000;

  const totalWithdrawn = useMemo(() => {
    if (!transactions) return 0;
    return transactions
      .filter((t: any) => t.type === "WITHDRAWAL" && t.status === "SUCCESS")
      .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // Hitung Saldo Tertahan (Settlement 3 Hari) & Saldo Tersedia (Siap Ditarik)
  const { availableBalance, pendingBalance } = useMemo(() => {
    const all = [...(rawOrders || []), ...pgOrders];
    const seen = new Set();
    const now = Date.now();

    let readyAvailable = 0;
    let holdingPending = 0;

    for (const o of all) {
      const key = o.invoiceNumber || o.id;
      if (!seen.has(key)) {
        seen.add(key);

        // Nilai bersih penjualan riil (harga produk dikurangi diskon voucher, potongan flash sale, dan fee platform sesuai tier):
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
        const netSalesAmount = (!isNaN(parsedNet) && parsedNet > 0)
          ? parsedNet
          : Math.max(0, subtotal - discount - platformFee);

        if (o.status === "PENDING" || o.status === "PROCESSING") {
          holdingPending += netSalesAmount;
        } else if (o.status === "PAID" || o.status === "COMPLETED" || o.status === "SETTLED") {
          const orderDate = o.createdAt?.toDate
            ? o.createdAt.toDate().getTime()
            : (o.createdAt ? new Date(o.createdAt).getTime() : now);

          const isSettled = o.status === "SETTLED" || (now - orderDate >= SETTLEMENT_MS);

          if (isSettled) {
            readyAvailable += netSalesAmount;
          } else {
            // Masih dalam masa penahanan 3 hari untuk proteksi garansi & resolusi komplain
            holdingPending += netSalesAmount;
          }
        }
      }
    }

    return {
      availableBalance: Math.max(0, readyAvailable - totalWithdrawn),
      pendingBalance: holdingPending,
    };
  }, [rawOrders, pgOrders, totalWithdrawn]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const allTransactions = useMemo(() => {
    const list: any[] = [...(transactions || [])].map((t: any) => {
      const parsedNet = Number(t.netAmount !== undefined ? t.netAmount : t.amount);
      const gross = Number(t.originalPrice || t.grossAmount || t.amount || 0);
      const disc = Number(t.discount || t.discountAmount || 0);
      const fee = Number(t.platformFee || 0);
      const safeAmount = (!isNaN(parsedNet) && parsedNet > 0) ? parsedNet : Math.max(0, gross - disc - fee);

      return {
        ...t,
        productTitle: t.productTitle || t.description || "Transaksi Dompet",
        buyerName: t.buyerName || "-",
        grossAmount: gross,
        discountAmount: disc,
        platformFee: fee,
        platformFeeRate: Number(t.platformFeeRate || 0),
        shopTier: t.shopTier || "free",
        amount: safeAmount,
        status: t.status || "SUCCESS",
      };
    });

    const seen = new Set(list.map((t: any) => t.invoiceNumber || t.id));
    const allOrders = [...(rawOrders || []), ...pgOrders];

    for (const po of allOrders) {
      const key = po.invoiceNumber || po.id;
      if (!seen.has(key)) {
        seen.add(key);

        const subtotal = Number(
          po.itemsSubtotal ||
          (Number(po.unitPrice || 0) * Number(po.quantity || 1)) ||
          po.totalAmount ||
          po.amount ||
          0
        );
        const discount = Number(po.discount || 0) + Number(po.voucherDiscount || 0) + Number(po.flashSaleDiscount || 0);
        const platformFee = Number(po.platformFee || po.platform_fee || 0);
        const platformFeeRate = Number(po.platformFeeRate || po.platform_fee_rate || 0);
        const shopTier = po.shopTier || po.shop_tier || "free";
        const parsedNet = Number(po.netAmount);
        const netAmount = (!isNaN(parsedNet) && parsedNet > 0)
          ? parsedNet
          : Math.max(0, subtotal - discount - platformFee);

        const orderDate = po.createdAt?.toDate
          ? po.createdAt.toDate().getTime()
          : (po.createdAt ? new Date(po.createdAt).getTime() : Date.now());

        const isSettled = po.status === "SETTLED" || (Date.now() - orderDate >= SETTLEMENT_MS);
        const releaseDate = new Date(orderDate + SETTLEMENT_MS);

        list.push({
          id: po.id || key,
          invoiceNumber: po.invoiceNumber || key,
          type: "SALES",
          productTitle: po.productTitle || po.title || "Produk Digital",
          buyerName: po.buyerName || po.customerName || po.buyerEmail || "Pelanggan",
          buyerEmail: po.buyerEmail || po.customerEmail || po.email || "",
          paymentMethod: po.paymentMethod || "QRIS / Instant Pay",
          quantity: po.quantity || 1,
          grossAmount: subtotal,
          discountAmount: discount,
          platformFee: platformFee,
          platformFeeRate: platformFeeRate,
          shopTier: shopTier,
          amount: netAmount,
          description: `Penjualan #${po.invoiceNumber || key} - ${po.productTitle || "Produk Digital"}`,
          status: isSettled ? "SUCCESS" : "HOLD_3D",
          settlementDate: releaseDate.toISOString(),
          orderDate: new Date(orderDate).toISOString(),
          timestamp: po.createdAt?.seconds
            ? { seconds: po.createdAt.seconds }
            : po.createdAt?.toDate
            ? { seconds: Math.floor(po.createdAt.toDate().getTime() / 1000) }
            : (po.createdAt ? { seconds: Math.floor(new Date(po.createdAt).getTime() / 1000) } : undefined),
        });
      }
    }
    return list.sort((a, b) => {
      const tA = a.timestamp?.seconds || 0;
      const tB = b.timestamp?.seconds || 0;
      return tB - tA;
    });
  }, [transactions, rawOrders, pgOrders]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t: any) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchInv = t.invoiceNumber?.toLowerCase().includes(q);
        const matchId = t.id?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchProd = t.productTitle?.toLowerCase().includes(q);
        const matchBuyer = t.buyerName?.toLowerCase().includes(q);
        if (!matchInv && !matchId && !matchDesc && !matchProd && !matchBuyer) {
          return false;
        }
      }
      if (typeFilter !== "all" && t.type !== typeFilter) {
        return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "SUCCESS" && t.status !== "SUCCESS") return false;
        if (statusFilter === "HOLD_3D" && t.status !== "HOLD_3D" && t.status !== "PENDING_SETTLEMENT") return false;
      }
      return true;
    });
  }, [allTransactions, searchQuery, typeFilter, statusFilter]);

  const canAccessFinance = isOwner || staffRole === "CO_OWNER" || !!staffPermissions?.finance;

  if (!mounted || authLoading || walletLoading || merchantLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  // Permission guard: Only Owner, Co-Owner, or Staff with Finance permission
  if (isStaff && !canAccessFinance) {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full border border-border shadow-md rounded-2xl p-6 text-center space-y-4 bg-white">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Akses Saldo Dibatasi</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Halaman <b>Saldo & Keuangan Toko</b> hanya dapat diakses oleh <b>Pemilik Toko</b>, <b>Co-Owner</b>, atau staf dengan izin <b>Keuangan</b>.
            </p>
          </div>
          <Button asChild className="w-full bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-bold h-9 shadow-sm">
            <Link href="/my-shop">Kembali ke Dashboard Toko</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Saldo & Keuangan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Kelola pendapatan dan riwayat penarikan dana toko Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Download className="w-3.5 h-3.5" /> Unduh Laporan
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Tarik Dana
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm border-border">
                <DialogHeader>
                  <DialogTitle className="font-black text-lg">Tarik Saldo Penghasilan</DialogTitle>
                  <DialogDescription className="text-xs">
                    Dana akan dikirimkan ke rekening utama yang terdaftar.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-border flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Saldo Tersedia</span>
                    <span className="text-sm font-black text-[#00AA5B]">Rp {availableBalance.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground ml-1">NOMINAL PENARIKAN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                      <Input placeholder="0" className="h-10 pl-9 rounded-xl border-border font-black text-sm" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-dashed border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-foreground">BCA ••••• 8901</p>
                      <p className="text-[9px] text-muted-foreground truncate">a.n {user?.displayName || "Pemilik Toko"}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-xs">
                    Konfirmasi Penarikan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Balance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-24 h-24" />
            </div>
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold opacity-80 tracking-widest uppercase">Saldo Tersedia</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium">Rp</span>
                  <p className="text-xl font-bold tracking-tight">{availableBalance.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <p className="text-[9px] font-medium opacity-70 mt-2">Dapat ditarik ke rekening kapan saja.</p>
            </CardContent>
          </Card>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saldo Tertahan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-[#2E3137]">Rp</span>
                  <p className="text-xl font-bold tracking-tight text-[#2E3137]">{pendingBalance.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-amber-500" />
                <p className="text-[9px] font-medium text-muted-foreground">Settlement garansi 3 hari sebelum dana cair ke saldo tersedia.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Total Penarikan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-[#2E3137]">Rp</span>
                  <p className="text-xl font-bold tracking-tight text-[#2E3137]">{totalWithdrawn.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[#00AA5B]">
                <TrendingUp className="w-3 h-3" />
                <p className="text-[9px] font-medium">Akumulasi saldo yang berhasil dicairkan.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-border/50 bg-[#F8FAFC]/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                Riwayat Transaksi & Arus Kas
                <Badge variant="secondary" className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[9px] font-bold">Real-Time</Badge>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari invoice / produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-9 rounded-lg border-border text-[10px] w-[180px] sm:w-[200px] bg-white"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 rounded-lg border-border text-[10px] font-bold w-[110px] bg-white">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="all" className="text-[10px] font-bold">Semua Tipe</SelectItem>
                    <SelectItem value="SALES" className="text-[10px] font-bold">Penjualan</SelectItem>
                    <SelectItem value="WITHDRAWAL" className="text-[10px] font-bold">Penarikan</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 rounded-lg border-border text-[10px] font-bold w-[125px] bg-white">
                    <Clock className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="all" className="text-[10px] font-bold">Semua Status</SelectItem>
                    <SelectItem value="SUCCESS" className="text-[10px] font-bold">Tersedia (Cair)</SelectItem>
                    <SelectItem value="HOLD_3D" className="text-[10px] font-bold">Tertahan (3 Hari)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table className="w-full whitespace-nowrap min-w-[760px]">
              <TableHeader className="bg-[#F8FAFC]">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-4 whitespace-nowrap">Waktu & Invoice</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-4 whitespace-nowrap">Rincian Transaksi</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-4 text-center whitespace-nowrap">Metode</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-4 whitespace-nowrap">Status Settlement</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-4 whitespace-nowrap">Saldo Bersih (Net)</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-4 whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transLoading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="px-4 py-3.5 whitespace-nowrap"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t: any) => (
                    <TableRow key={t.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors">
                      {/* 1. Waktu & Invoice */}
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-[#2E3137]">
                            {t.timestamp?.seconds
                              ? new Date(t.timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                              : "Baru saja"}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9.5px] text-muted-foreground font-mono font-semibold">
                              #{t.invoiceNumber || t.id.substring(0, 8)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(t.invoiceNumber || t.id);
                                toast({ title: "Disalin", description: "Nomor invoice berhasil disalin ke clipboard." });
                              }}
                              className="text-muted-foreground/60 hover:text-foreground transition-colors"
                              title="Salin Invoice"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Rincian Transaksi */}
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            t.type === 'SALES' ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "bg-orange-500/10 text-orange-600"
                          )}>
                            {t.type === 'SALES' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col gap-0.5 max-w-[260px]">
                            <span className="text-xs font-bold text-[#2E3137] truncate">
                              {t.productTitle || t.description}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {t.type === 'SALES' ? (
                                <>Pembeli: <strong className="font-semibold text-foreground/80">{t.buyerName}</strong> {t.quantity ? `(x${t.quantity})` : ""}</>
                              ) : (
                                "Penarikan Dana ke Rekening"
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Metode Pembayaran */}
                      <TableCell className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge variant="outline" className="text-[9.5px] font-semibold px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-700">
                          {t.paymentMethod || "QRIS"}
                        </Badge>
                      </TableCell>

                      {/* 4. Status Settlement */}
                      <TableCell className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {t.status === 'SUCCESS' ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] whitespace-nowrap w-fit">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-black uppercase">Tersedia (Cair)</span>
                            </div>
                          ) : t.status === 'HOLD_3D' || t.status === 'PENDING_SETTLEMENT' ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 whitespace-nowrap w-fit">
                                <Clock className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-black uppercase">Tertahan (3 Hari)</span>
                              </div>
                              {t.settlementDate && (
                                <span className="text-[8.5px] text-muted-foreground mt-0.5 font-medium whitespace-nowrap">
                                  Cair: {new Date(t.settlementDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          ) : t.status === 'PENDING' ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 whitespace-nowrap w-fit">
                              <Clock className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-black uppercase">Proses</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 whitespace-nowrap w-fit">
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-black uppercase">Gagal</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 5. Saldo Bersih Masuk Toko */}
                      <TableCell className="text-right py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5">
                          {(Number(t.discountAmount || 0) > 0 || Number(t.platformFee || 0) > 0) && (
                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                              <span className="line-through">Rp {Number(t.grossAmount).toLocaleString('id-ID')}</span>
                              {Number(t.discountAmount || 0) > 0 && (
                                <span className="text-red-500 font-bold">-Rp {Number(t.discountAmount).toLocaleString('id-ID')}</span>
                              )}
                              {Number(t.platformFee || 0) > 0 && (
                                <span className="text-amber-600 font-semibold" title={`Komisi Platform: ${t.platformFeeRate || 0}%`}>
                                  -Fee: Rp {Number(t.platformFee).toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          )}
                          <span className={cn(
                            "text-xs font-black tracking-tight",
                            t.type === 'SALES' ? "text-[#00AA5B]" : "text-[#2E3137]"
                          )}>
                            {t.type === 'SALES' ? '+' : '-'} Rp {Number(t.amount || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </TableCell>

                      {/* 6. Aksi */}
                      <TableCell className="text-right py-3.5 px-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTx(t);
                            setDetailOpen(true);
                          }}
                          className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-border hover:bg-[#00AA5B] hover:text-white hover:border-[#00AA5B] transition-all gap-1"
                          title="Lihat Rincian Transaksi"
                        >
                          <Eye className="w-3 h-3" />
                          Rincian
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border border-border/50">
                          <Wallet className="w-8 h-8 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xs font-bold text-[#212121]">Tidak ada transaksi yang cocok</h3>
                        <p className="text-[10px] text-muted-foreground max-w-[240px] mt-1.5 font-medium">
                          Coba ubah kata kunci pencarian atau filter tipe dan status transaksi Anda.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Modal Dialog Rincian Lengkap Transaksi */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white border-border">
            <DialogHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    selectedTx?.type === "SALES" ? "bg-emerald-50 text-[#00AA5B]" : "bg-orange-50 text-orange-600"
                  )}>
                    {selectedTx?.type === "SALES" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold text-[#212121]">
                      {selectedTx?.type === "SALES" ? "Rincian Penjualan Toko" : "Rincian Penarikan Dana"}
                    </DialogTitle>
                    <DialogDescription className="text-[11px] text-muted-foreground font-mono">
                      #{selectedTx?.invoiceNumber || selectedTx?.id}
                    </DialogDescription>
                  </div>
                </div>
                <Badge className={cn(
                  "border-none text-[10px] font-bold px-2 py-0.5",
                  selectedTx?.status === "SUCCESS"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedTx?.status === "HOLD_3D"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-800"
                )}>
                  {selectedTx?.status === "SUCCESS" ? "Tersedia / Cair" : selectedTx?.status === "HOLD_3D" ? "Tertahan (3 Hari)" : "Diproses"}
                </Badge>
              </div>
            </DialogHeader>

            {selectedTx && (
              <div className="space-y-4 py-2 text-xs">
                {/* Info Pesanan & Pelanggan */}
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-border/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground font-medium text-[11px]">Item Pesanan:</span>
                    <span className="font-bold text-[#2E3137] text-right max-w-[220px]">
                      {selectedTx.productTitle} {selectedTx.quantity ? `(x${selectedTx.quantity})` : ""}
                    </span>
                  </div>
                  {selectedTx.buyerName && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                      <span className="text-muted-foreground font-medium text-[11px]">Pembeli:</span>
                      <span className="font-semibold text-[#2E3137]">{selectedTx.buyerName}</span>
                    </div>
                  )}
                  {selectedTx.paymentMethod && (
                    <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                      <span className="text-muted-foreground font-medium text-[11px]">Metode Bayar:</span>
                      <span className="font-semibold text-[#2E3137]">{selectedTx.paymentMethod}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground font-medium text-[11px]">Waktu Transaksi:</span>
                    <span className="font-medium text-[#2E3137]">
                      {selectedTx.timestamp?.seconds
                        ? new Date(selectedTx.timestamp.seconds * 1000).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                        : "Baru saja"}
                    </span>
                  </div>
                </div>

                {/* Rincian Arus Kas */}
                <div className="rounded-xl border border-border/60 p-3.5 space-y-2">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Rincian Arus Kas Toko</p>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Harga Produk (Kotor):</span>
                    <span className="font-semibold">Rp {Number(selectedTx.grossAmount || selectedTx.amount || 0).toLocaleString("id-ID")}</span>
                  </div>
                  {Number(selectedTx.discountAmount || 0) > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-[11px]">Potongan Voucher / Flash Sale:</span>
                      <span className="font-semibold">-Rp {Number(selectedTx.discountAmount).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {Number(selectedTx.platformFee || 0) > 0 ? (
                    <div className="flex justify-between items-center text-amber-700">
                      <span className="text-[11px]">
                        Biaya Layanan Platform ({selectedTx.platformFeeRate ?? 0}% - {(selectedTx.shopTier || "free").toUpperCase()}):
                      </span>
                      <span className="font-semibold">-Rp {Number(selectedTx.platformFee).toLocaleString("id-ID")}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-emerald-600">
                      <span className="text-[11px]">
                        Biaya Layanan Platform ({(selectedTx.shopTier || "free").toUpperCase()} - 0% Bebas Biaya):
                      </span>
                      <span className="font-semibold">Rp 0 (Bebas Komisi)</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border/60 font-black text-sm">
                    <span className="text-[#212121]">Saldo Bersih Toko (Net):</span>
                    <span className={selectedTx.type === "SALES" ? "text-[#00AA5B]" : "text-[#212121]"}>
                      {selectedTx.type === "SALES" ? "+" : "-"}Rp {Number(selectedTx.amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Status Settlement 3 Hari */}
                <div className={cn(
                  "rounded-xl p-3 border",
                  selectedTx.status === "HOLD_3D"
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                )}>
                  <div className="flex items-start gap-2">
                    {selectedTx.status === "HOLD_3D" ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-[11px]">
                      <p className="font-bold">
                        {selectedTx.status === "HOLD_3D" ? "Saldo Dalam Masa Settlement (3 Hari)" : "Dana Sudah Tersedia & Masuk Saldo"}
                      </p>
                      <p className="text-[10px] leading-relaxed opacity-90">
                        {selectedTx.status === "HOLD_3D"
                          ? `Dana hasil penjualan ini diamankan selama 3 hari kerja untuk garansi pesanan. Dijadwalkan otomatis cair ke saldo aktif pada ${new Date(selectedTx.settlementDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.`
                          : "Dana hasil transaksi ini telah berhasil diselesaikan dan sudah dapat Anda cairkan ke rekening bank kapan saja."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 border-t border-border/50">
              {selectedTx?.invoiceNumber && (
                <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[11px] font-bold border-border gap-1.5">
                  <Link href={`/transactions/${selectedTx.invoiceNumber}`} target="_blank">
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat Invoice
                  </Link>
                </Button>
              )}
              <Button
                onClick={() => setDetailOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-[11px] ml-auto"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </main>
  );
}
