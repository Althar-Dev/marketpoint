"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useMerchantShop } from "@/context/merchant-context";

interface OrderItem {
  id: string;
  invoiceNumber?: string;
  productTitle?: string;
  product?: string;
  productImage?: string;
  buyer?: string;
  buyerName?: string;
  amount?: number;
  totalAmount?: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "PAID" | "SETTLED";
  date?: string;
  createdAt?: any;
  paymentMethod?: string;
  paymentMethodName?: string;
}

export default function MerchantOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { shopId } = useMerchantShop();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "processing" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeShopTargetId = shopId || user?.uid;

  const shopRef = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return doc(db, "shops", activeShopTargetId);
  }, [db, activeShopTargetId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Query order nyata toko dari Firestore
  const ordersQuery = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return query(collection(db, "shops", activeShopTargetId, "orders"));
  }, [db, activeShopTargetId]);

  const { data: rawOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const orders: OrderItem[] = (rawOrders || []) as OrderItem[];

  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const processingCount = orders.filter(o => o.status === "PROCESSING").length;
  const completedCount = orders.filter(o => o.status === "COMPLETED" || o.status === "PAID" || o.status === "SETTLED").length;
  const cancelledCount = orders.filter(o => o.status === "CANCELLED").length;

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pending" && order.status !== "PENDING") return false;
    if (activeTab === "processing" && order.status !== "PROCESSING") return false;
    if (activeTab === "completed" && order.status !== "COMPLETED" && order.status !== "PAID" && order.status !== "SETTLED") return false;
    if (activeTab === "cancelled" && order.status !== "CANCELLED") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (order.invoiceNumber || order.id)?.toLowerCase().includes(q);
      const matchProduct = (order.productTitle || order.product)?.toLowerCase().includes(q);
      const matchBuyer = (order.buyerName || order.buyer)?.toLowerCase().includes(q);
      if (!matchId && !matchProduct && !matchBuyer) return false;
    }
    return true;
  }).sort((a, b) => {
    const valA = Number(a.totalAmount || a.amount || 0);
    const valB = Number(b.totalAmount || b.amount || 0);
    if (sortBy === "highest") return valB - valA;
    if (sortBy === "lowest") return valA - valB;
    return 0;
  });

  if (!mounted || authLoading || shopLoading || ordersLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Daftar Pesanan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Pantau dan kelola seluruh pesanan masuk dari pembeli toko Anda.
            </p>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pesanan Baru", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50", icon: "ph:clock-bold" },
            { label: "Perlu Diproses", value: processingCount, color: "text-blue-600", bg: "bg-blue-50", icon: "ph:gear-six-bold" },
            { label: "Pesanan Selesai", value: completedCount, color: "text-[#00AA5B]", bg: "bg-emerald-50", icon: "ph:check-circle-bold" },
            { label: "Dibatalkan", value: cancelledCount, color: "text-rose-600", bg: "bg-rose-50", icon: "ph:x-circle-bold" },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                    <Icon icon={stat.icon} className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                  <p className="text-xl font-black text-[#212121] tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button
              variant={activeTab === "all" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("all")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "all" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Semua ({orders.length})
            </Button>
            <Button
              variant={activeTab === "pending" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("pending")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "pending" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Menunggu ({pendingCount})
            </Button>
            <Button
              variant={activeTab === "processing" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("processing")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "processing" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Diproses ({processingCount})
            </Button>
            <Button
              variant={activeTab === "completed" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("completed")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "completed" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Selesai ({completedCount})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-56">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari Invoice, Produk, Pembeli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20"
              />
            </div>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru</SelectItem>
                <SelectItem value="highest" className="text-[10px] font-bold">Nominal Tertinggi</SelectItem>
                <SelectItem value="lowest" className="text-[10px] font-bold">Nominal Terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table / Clean Empty State */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-border/80 mb-3">
                <Icon icon="ph:shopping-bag" className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Pesanan Masuk</h3>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                {orders.length === 0
                  ? "Ketika pembeli memesan produk toko Anda, daftar pesanan akan muncul di sini secara realtime."
                  : "Tidak ada pesanan yang sesuai dengan filter yang Anda pilih."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Order ID & Produk</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Pembeli</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const totalVal = Number(order.totalAmount || order.amount || 0);
                    const prodName = order.productTitle || order.product || "Produk";
                    const buyerName = order.buyerName || order.buyer || "Pembeli";
                    const invNo = order.invoiceNumber || order.id;
                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50/50 group">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                              {order.productImage ? (
                                <img src={order.productImage} alt={prodName} className="h-full w-full object-cover" />
                              ) : (
                                <Icon icon="ph:package" className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-black text-slate-900 max-w-[280px] truncate">{prodName}</span>
                              <span className="text-[9px] text-muted-foreground font-mono">{invNo}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-[#2E3137]">{buyerName}</span>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {order.paymentMethodName || order.paymentMethod || "Pembayaran Online"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-black text-slate-900">
                            Rp {totalVal.toLocaleString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                            order.status === 'COMPLETED' || order.status === 'PAID' || order.status === 'SETTLED' ? "bg-emerald-100 text-emerald-700" :
                              order.status === 'PROCESSING' ? "bg-blue-100 text-blue-700" :
                                order.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {order.status === 'COMPLETED' || order.status === 'PAID' || order.status === 'SETTLED' ? "LUNAS / SELESAI" :
                              order.status === 'PROCESSING' ? "DIPROSES" :
                                order.status === 'PENDING' ? "MENUNGGU" : "DIBATALKAN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[9px] font-black border-border hover:bg-white">
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

      </div>
    </main>
  );
}
