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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from "next/link";

const MOCK_PRODUCTS = [
  {
    id: "PROD-001",
    name: "STSPay Payment Bridge V3 - Enterprise Edition",
    category: "API Bridge",
    price: 1250000,
    stock: 99,
    status: "ACTIVE",
    sold: 1240,
    image: "https://picsum.photos/seed/p1/100/100"
  },
  {
    id: "PROD-002",
    name: "PPOB H2H Engine V2 - Realtime Transaction",
    category: "PPOB Engine",
    price: 450000,
    stock: 0,
    status: "OUT_OF_STOCK",
    sold: 856,
    image: "https://picsum.photos/seed/p2/100/100"
  },
  {
    id: "PROD-003",
    name: "WhatsApp Automation Bot - Multi Device",
    category: "Automation",
    price: 250000,
    stock: 12,
    status: "ACTIVE",
    sold: 342,
    image: "https://picsum.photos/seed/p3/100/100"
  },
  {
    id: "PROD-004",
    name: "Template Website Topup Game - NextJS v15",
    category: "Source Code",
    price: 150000,
    stock: 50,
    status: "ACTIVE",
    sold: 124,
    image: "https://picsum.photos/seed/p4/100/100"
  },
  {
    id: "PROD-005",
    name: "Legacy Auth Module - PHP Version",
    category: "Source Code",
    price: 45000,
    stock: 100,
    status: "INACTIVE",
    sold: 12,
    image: "https://picsum.photos/seed/p5/100/100"
  }
];

export default function MerchantProductsPage() {
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
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Manajemen Produk</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola inventaris, harga, dan ketersediaan produk digital Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10">
              <Icon icon="ph:plus-bold" className="w-3.5 h-3.5" /> Tambah Produk
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Semua Produk", value: "24", icon: "ph:package", color: "text-[#2E3137]", bg: "bg-gray-50" },
            { label: "Produk Aktif", value: "18", icon: "ph:check-circle", color: "text-[#00AA5B]", bg: "bg-green-50" },
            { label: "Stok Habis", value: "2", icon: "ph:warning-circle", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Diarsipkan", value: "4", icon: "ph:archive", color: "text-[#8B5CF6]", bg: "bg-purple-50" },
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button variant="secondary" className="h-8 rounded-lg text-[10px] font-bold bg-[#00AA5B]/10 text-[#00AA5B]">Semua</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Produk Aktif</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Perlu Update</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-56">
              <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Cari nama atau SKU..." className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20" />
            </div>
            <Select defaultValue="newest">
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru Dibuat</SelectItem>
                <SelectItem value="price-high" className="text-[10px] font-bold">Harga Tertinggi</SelectItem>
                <SelectItem value="price-low" className="text-[10px] font-bold">Harga Terendah</SelectItem>
                <SelectItem value="sold" className="text-[10px] font-bold">Paling Laris</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Table */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">Info Produk</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Harga</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Stok</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PRODUCTS.map((product) => (
                <TableRow key={product.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border border-border shadow-sm overflow-hidden bg-muted relative shrink-0">
                        <Avatar className="h-full w-full rounded-none">
                          <AvatarImage src={product.image} className="object-cover" />
                          <AvatarFallback className="bg-muted text-[10px] font-bold">P</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] font-black text-[#2E3137] truncate max-w-[200px]">{product.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{product.category}</span>
                          <span className="text-[8px] text-muted-foreground/30">|</span>
                          <span className="text-[9px] text-[#00AA5B] font-bold">{product.sold} Terjual</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-black text-[#2E3137]">Rp {product.price.toLocaleString('id-ID')}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[11px] font-black",
                      product.stock === 0 ? "text-red-500" : "text-[#2E3137]"
                    )}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                      product.status === 'ACTIVE' ? "bg-green-100 text-green-700" : 
                      product.status === 'OUT_OF_STOCK' ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {product.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icon icon="ph:dots-three-vertical-bold" className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border w-36">
                        <DropdownMenuItem className="text-[10px] font-bold gap-2 cursor-pointer">
                          <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" /> Edit Produk
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold gap-2 cursor-pointer">
                          <Icon icon="ph:copy-bold" className="w-3.5 h-3.5" /> Duplikat
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold gap-2 cursor-pointer text-red-500 focus:text-red-500">
                          <Icon icon="ph:trash-bold" className="w-3.5 h-3.5" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/50 flex justify-between items-center bg-[#F8FAFC]/30">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2">Menampilkan 5 dari 24 Produk</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-left-bold" className="w-3 h-3" /></Button>
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-right-bold" className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-dashed border-border border-[1.5px] bg-[#F8FAFC] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
                <Icon icon="ph:lightning-bold" className="w-4 h-4 text-[#00AA5B]" />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-[#2E3137] uppercase tracking-wide">Tips Penjualan</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-relaxed">
                  Produk dengan gambar berkualitas tinggi dan deskripsi lengkap cenderung mendapatkan <span className="text-[#00AA5B] font-bold">2.5x lebih banyak</span> pesanan.
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
                <h3 className="text-[11px] font-black text-[#2E3137] uppercase tracking-wide">Verifikasi Produk</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium leading-relaxed">
                  Aktifkan lisensi otomatis untuk memberikan pengalaman instan kepada pembeli Anda segera setelah pembayaran berhasil.
                </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </main>
  );
}
