"use client";

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
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
import { 
  Search, 
  Filter, 
  Database,
  ShieldAlert,
  Zap,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Package,
  AlertTriangle,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

// Dummy global products for Admin View
const GLOBAL_PRODUCTS_DUMMY = [
  {
    id: "PROD-1020",
    name: "Premium API Gateway Bridge - Enterprise Edition",
    shop: "AltharDev Studio",
    price: 125000,
    stock: 99,
    category: "API Bridge",
    status: "ACTIVE",
    createdAt: "2 jam lalu"
  },
  {
    id: "PROD-1018",
    name: "Custom WhatsApp Bot Multi-Device - Official License",
    shop: "StarVale Labs",
    price: 85000,
    stock: 12,
    category: "Automation",
    status: "ACTIVE",
    createdAt: "5 jam lalu"
  },
  {
    id: "PROD-1015",
    name: "PPOB Realtime Engine Module - NextJS Ready",
    shop: "Cyber Node ID",
    price: 45000,
    stock: 0,
    category: "PPOB Module",
    status: "OUT_OF_STOCK",
    createdAt: "Kemarin"
  },
  {
    id: "PROD-1012",
    name: "Legacy Auth Module - PHP Version (Obsolete)",
    shop: "DevX Studio",
    price: 15000,
    stock: 100,
    category: "Source Code",
    status: "PENDING_REVIEW",
    createdAt: "2 hari lalu"
  }
];

export default function AdminProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Katalog Produk Global</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Monitoring seluruh aset digital dan kepatuhan katalog platform.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-8 px-4 rounded-lg bg-white border-border/50 text-[10px] font-medium gap-2">
             <Filter className="w-3 h-3" /> Filter Lanjutan
           </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Produk", value: "1,248", icon: Database, bg: "bg-red-50", color: "text-red-600" },
          { label: "Aktif", value: "1,120", icon: Zap, bg: "bg-red-50", color: "text-red-600" },
          { label: "Stok Habis", value: "84", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Tinjauan Keamanan", value: "12", icon: ShieldAlert, bg: "bg-red-50", color: "text-red-600" },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-3.5 md:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-sm md:text-lg font-medium text-[#212121] tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input 
            placeholder="Cari nama produk atau SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 rounded-lg bg-slate-50/50 border-border/50 text-[10px] md:text-[11px] focus:ring-red-500/10" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-28 md:w-32 rounded-lg border-border/50 bg-white text-[10px] font-medium">
              <Package className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Ketersediaan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-[10px]">Semua Stok</SelectItem>
              <SelectItem value="ready" className="text-[10px]">Tersedia</SelectItem>
              <SelectItem value="empty" className="text-[10px]">Stok Habis</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border/50 text-[10px] font-medium gap-2 hover:bg-slate-50 transition-colors">
            Audit Katalog
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest px-6 h-10">Info Produk & Pemilik</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Harga</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Status</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Stok</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest text-right px-6 h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GLOBAL_PRODUCTS_DUMMY.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((p) => (
                <TableRow key={p.id} className="border-b border-border/30 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                         <Package className="w-4 h-4 text-muted-foreground opacity-40" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-medium text-[#2E3137] truncate max-w-[220px]">{p.name}</span>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[9px] text-red-600 font-medium">{p.shop}</span>
                           <span className="text-[8px] text-muted-foreground/30">|</span>
                           <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{p.category}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-medium text-[#2E3137]">Rp {p.price.toLocaleString('id-ID')}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-medium px-2 py-0 rounded-md border-none",
                      p.status === 'ACTIVE' ? "bg-green-50 text-green-700" : 
                      p.status === 'OUT_OF_STOCK' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                    )}>
                      {p.status === 'ACTIVE' ? 'AKTIF' : p.status === 'OUT_OF_STOCK' ? 'HABIS' : 'AUDIT'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-medium",
                      p.stock === 0 ? "text-red-500" : "text-muted-foreground"
                    )}>{p.stock}</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50">
                          <Eye className="w-3.5 h-3.5" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50">
                          <ChevronRight className="w-3.5 h-3.5" />
                       </Button>
                    </div>
                    <div className="group-hover:hidden">
                       <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-30" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Info */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between bg-slate-50/20">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest px-2">
            Menampilkan {GLOBAL_PRODUCTS_DUMMY.length} Produk
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" disabled className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium opacity-50">Sebelumnya</Button>
            <Button variant="outline" className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium hover:bg-slate-50 transition-colors">Berikutnya</Button>
          </div>
        </div>
      </Card>

      {/* Compliance Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50 shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-600 opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Moderasi Keamanan</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Sistem mendeteksi <b>12 produk</b> dengan kredensial API yang mencurigakan. Tinjau untuk menjaga keamanan pengguna?
            </p>
          </div>
        </Card>
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50 shrink-0">
            <Zap className="w-4 h-4 text-red-600 opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Optimasi Katalog</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Kategori <b>API Bridge</b> menyumbang 65% total transaksi. Pastikan ketersediaan lisensi otomatis di semua produk kategori ini.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
