"use client";

import { useState, useEffect } from "react";
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
import { 
  Search, 
  Filter, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Activity,
  MoreHorizontal,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dummy global transactions for Admin View
const GLOBAL_TRANSACTIONS_DUMMY = [
  {
    id: "TRX-990120",
    user: "Budi Santoso",
    shop: "AltharDev Studio",
    amount: 125000,
    type: "GATEWAY",
    status: "SUCCESS",
    date: "10 menit lalu",
    method: "QRIS"
  },
  {
    id: "TRX-990118",
    user: "Dewi Lestari",
    shop: "StarVale Labs",
    amount: 45000,
    type: "PPOB",
    status: "SUCCESS",
    date: "25 menit lalu",
    method: "SALDO"
  },
  {
    id: "TRX-990115",
    user: "Andrianto",
    shop: "Cyber Node ID",
    amount: 250000,
    type: "TOPUP",
    status: "PENDING",
    date: "1 jam lalu",
    method: "VA BCA"
  },
  {
    id: "TRX-990110",
    user: "Siska Putri",
    shop: "DevX Studio",
    amount: 15000,
    type: "PPOB",
    status: "FAILED",
    date: "3 jam lalu",
    method: "SALDO"
  }
];

export default function AdminTransactionsPage() {
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
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Transaksi Global</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Buku besar seluruh aktivitas keuangan di dalam ekosistem platform.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-8 px-4 rounded-lg bg-white border-border/50 text-[10px] font-medium gap-2">
             <Download className="w-3 h-3" /> Ekspor Laporan
           </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Volume GMV", value: "Rp14.2M", icon: DollarSign, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Trx Sukses", value: "8,420", icon: CheckCircle2, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Trx Proses", value: "142", icon: Clock, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Gagal/Sengketa", value: "24", icon: AlertCircle, bg: "bg-green-50", color: "text-[#00AA5B]" },
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
            placeholder="Cari ID transaksi atau nama..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 rounded-lg bg-slate-50/50 border-border/50 text-[10px] md:text-[11px] focus:ring-[#00AA5B]/10" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-28 md:w-32 rounded-lg border-border/50 bg-white text-[10px] font-medium">
              <Activity className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-[10px]">Semua Tipe</SelectItem>
              <SelectItem value="PPOB" className="text-[10px]">PPOB & Pulsa</SelectItem>
              <SelectItem value="GATEWAY" className="text-[10px]">Gateway Bridge</SelectItem>
              <SelectItem value="TOPUP" className="text-[10px]">Top-Up Saldo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border/50 text-[10px] font-medium gap-2 hover:bg-slate-50 transition-colors">
            Audit Ledger
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest px-6 h-10">Waktu & ID</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Pengguna & Toko</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Nominal</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Status</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest text-right px-6 h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GLOBAL_TRANSACTIONS_DUMMY.filter(t => 
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.user.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((t) => (
                <TableRow key={t.id} className="border-b border-border/30 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="px-6 py-3.5">
                    <div className="flex flex-col min-w-[100px]">
                      <span className="text-[10px] font-medium text-[#2E3137]">{t.date}</span>
                      <span className="text-[8px] text-muted-foreground font-mono uppercase">{t.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col min-w-[140px]">
                      <span className="text-[10px] font-medium text-[#2E3137]">{t.user}</span>
                      <div className="flex items-center gap-1">
                         <span className="text-[8px] text-[#00AA5B] font-medium">ke {t.shop}</span>
                         <span className="text-[8px] text-muted-foreground/30">•</span>
                         <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter">{t.type}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-medium text-[#2E3137]">Rp {t.amount.toLocaleString('id-ID')}</span>
                       <span className="text-[8px] text-muted-foreground font-medium uppercase">{t.method}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-medium px-2 py-0 rounded-md border-none",
                      t.status === 'SUCCESS' ? "bg-green-50 text-green-700" : 
                      t.status === 'PENDING' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                    )}>
                      {t.status === 'SUCCESS' ? 'BERHASIL' : t.status === 'PENDING' ? 'PROSES' : 'GAGAL'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50">
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
            Menampilkan {GLOBAL_TRANSACTIONS_DUMMY.length} Transaksi
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" disabled className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium opacity-50">Sebelumnya</Button>
            <Button variant="outline" className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium hover:bg-slate-50 transition-colors">Berikutnya</Button>
          </div>
        </div>
      </Card>

      {/* Insights Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <Activity className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Analisa Gateway</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Metode pembayaran <b>QRIS</b> mendominasi 72% total transaksi bulan ini dengan rata-rata nominal Rp45.000.
            </p>
          </div>
        </Card>
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <AlertCircle className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Peringatan Sistem</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Terdapat <b>3 penarikan dana</b> yang memerlukan verifikasi manual karena melebihi limit harian standar (Hard Limit).
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
