"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_ORDERS = [
  {
    id: "ORD-99120",
    product: "STSPay Payment Bridge V3 - Enterprise Edition",
    productImage: "https://picsum.photos/seed/o1/100/100",
    buyer: "Rian Hidayat",
    amount: 1250000,
    status: "COMPLETED",
    date: "2 jam lalu",
    paymentMethod: "QRIS"
  },
  {
    id: "ORD-99088",
    product: "PPOB H2H Engine V2 - Realtime Transaction",
    productImage: "https://picsum.photos/seed/o2/100/100",
    buyer: "Dewi Lestari",
    amount: 450000,
    status: "PROCESSING",
    date: "Kemarin",
    paymentMethod: "BCA Virtual Account"
  },
  {
    id: "ORD-98871",
    product: "WhatsApp Automation Bot - Multi Device",
    productImage: "https://picsum.photos/seed/o3/100/100",
    buyer: "Andrianto",
    amount: 250000,
    status: "PENDING",
    date: "2 hari lalu",
    paymentMethod: "E-Wallet"
  },
  {
    id: "ORD-98850",
    product: "Template Website Topup Game - NextJS v15",
    productImage: "https://picsum.photos/seed/o4/100/100",
    buyer: "Siska Putri",
    amount: 150000,
    status: "CANCELLED",
    date: "3 hari lalu",
    paymentMethod: "QRIS"
  }
];

export default function MerchantOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || authLoading || shopLoading) {
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
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Daftar Pesanan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola pesanan masuk dan pantau status pengiriman lisensi.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Icon icon="ph:file-arrow-down-bold" className="w-3.5 h-3.5" /> Ekspor Laporan
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pesanan Baru", value: "3", icon: "ph:shopping-bag-open", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Sedang Diproses", value: "1", icon: "ph:gear-six", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Berhasil Selesai", value: "1.240", icon: "ph:check-circle", color: "text-[#00AA5B]", bg: "bg-green-50" },
            { label: "Pesanan Batal", value: "12", icon: "ph:x-circle", color: "text-red-600", bg: "bg-red-50" },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden group">
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

        {/* Status Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button variant="secondary" className="h-8 rounded-lg text-[10px] font-bold bg-[#00AA5B]/10 text-[#00AA5B]">Semua</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Menunggu (3)</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Diproses (1)</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Selesai</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Dibatalkan</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-56">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Cari ID Pesanan atau Pembeli..." className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20" />
            </div>
            <Select defaultValue="newest">
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru</SelectItem>
                <SelectItem value="oldest" className="text-[10px] font-bold">Terlama</SelectItem>
                <SelectItem value="price-high" className="text-[10px] font-bold">Harga Tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">ID & Info Produk</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Pembeli</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Total Belanja</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ORDERS.map((order) => (
                <TableRow key={order.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border border-border shadow-sm overflow-hidden bg-muted relative shrink-0">
                        <Avatar className="h-full w-full rounded-none">
                          <AvatarImage src={order.productImage} className="object-cover" />
                          <AvatarFallback className="bg-muted text-[10px] font-bold">O</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-black text-[#00AA5B]">{order.id}</span>
                        <span className="text-[11px] font-black text-[#2E3137] truncate max-w-[200px]">{order.product}</span>
                        <span className="text-[9px] text-muted-foreground font-medium">{order.date}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-[#2E3137]">{order.buyer}</span>
                       <span className="text-[9px] text-muted-foreground font-medium">{order.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-black text-[#2E3137]">Rp {order.amount.toLocaleString('id-ID')}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                      order.status === 'COMPLETED' ? "bg-green-100 text-green-700" : 
                      order.status === 'PROCESSING' ? "bg-blue-100 text-blue-700" : 
                      order.status === 'PENDING' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    )}>
                      {order.status === 'COMPLETED' ? "SELESAI" : 
                       order.status === 'PROCESSING' ? "DIPROSES" : 
                       order.status === 'PENDING' ? "MENUNGGU" : "DIBATALKAN"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="h-7 px-3 rounded-lg text-[9px] font-black border-border hover:bg-white">
                        Detail
                      </Button>
                      {order.status === 'PROCESSING' && (
                        <Button size="sm" className="h-7 px-3 rounded-lg text-[9px] font-black bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-sm">
                          Selesaikan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/50 flex justify-between items-center bg-[#F8FAFC]/30">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2">Menampilkan 4 dari 1.252 Pesanan</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-left-bold" className="w-3 h-3" /></Button>
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-right-bold" className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>

        {/* Quick Tips for Seller */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="border-dashed border-border border-[1.5px] bg-[#F8FAFC] rounded-2xl p-5">
             <div className="flex items-start gap-3">
               <div className="h-8 w-8 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
                 <Icon icon="ph:lightning-bold" className="w-4 h-4 text-[#00AA5B]" />
               </div>
               <div>
                 <h3 className="text-[11px] font-black text-[#2E3137] uppercase tracking-wide">Tips Kecepatan</h3>
                 <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-relaxed">
                   Pesanan yang diproses dalam <span className="text-[#00AA5B] font-bold">kurang dari 1 jam</span> mendapatkan rating 5 bintang 40% lebih sering.
                 </p>
               </div>
             </div>
           </Card>
           <Card className="border-dashed border-border border-[1.5px] bg-[#F8FAFC] rounded-2xl p-5">
             <div className="flex items-start gap-3">
               <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                 <Icon icon="ph:shield-check-bold" className="w-4 h-4 text-[#8B5CF6]" />
               </div>
               <div>
                 <h3 className="text-[11px] font-black text-[#2E3137] uppercase tracking-wide">Keamanan Transaksi</h3>
                 <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-relaxed">
                   Selalu kirim lisensi melalui sistem MarketPoint untuk memastikan <span className="text-[#8B5CF6] font-bold">perlindungan saldo</span> otomatis.
                 </p>
               </div>
             </div>
           </Card>
        </div>

      </div>
    </main>
  );
}
