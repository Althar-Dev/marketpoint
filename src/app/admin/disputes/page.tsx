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
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronRight,
  User,
  Store,
  MessageSquare,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dummy global disputes for Admin View
const GLOBAL_DISPUTES_DUMMY = [
  {
    id: "DSP-8821",
    orderId: "ORD-99120",
    user: "Rian Hidayat",
    shop: "AltharDev Studio",
    reason: "Lisensi API tidak valid",
    priority: "HIGH",
    status: "PENDING_ADMIN",
    date: "1 jam lalu"
  },
  {
    id: "DSP-8815",
    orderId: "ORD-99088",
    user: "Dewi Lestari",
    shop: "StarVale Labs",
    reason: "File corrupt / tidak lengkap",
    priority: "MEDIUM",
    status: "WAITING_MERCHANT",
    date: "Kemarin"
  },
  {
    id: "DSP-8790",
    orderId: "ORD-98871",
    user: "Andrianto",
    shop: "Cyber Node ID",
    reason: "Fitur tidak sesuai deskripsi",
    priority: "LOW",
    status: "RESOLVED",
    date: "3 hari lalu"
  },
  {
    id: "DSP-8785",
    orderId: "ORD-98840",
    user: "Siska Putri",
    shop: "DevX Studio",
    reason: "Permintaan Refund",
    priority: "HIGH",
    status: "IN_INVESTIGATION",
    date: "4 hari lalu"
  }
];

export default function AdminDisputesPage() {
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
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Pusat Resolusi Dispute</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Investigasi dan selesaikan sengketa transaksi di seluruh platform.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-8 px-4 rounded-lg bg-white border-border/50 text-[10px] font-medium gap-2">
             <Scale className="w-3 h-3" /> Kebijakan Refund
           </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Kasus", value: "24", icon: ShieldAlert, bg: "bg-red-50", color: "text-red-600" },
          { label: "Perlu Tindakan", value: "14", icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Prioritas Tinggi", value: "6", icon: Clock, bg: "bg-red-50", color: "text-red-600" },
          { label: "Berhasil Damai", value: "158", icon: CheckCircle2, bg: "bg-red-50", color: "text-red-600" },
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
            placeholder="Cari ID Dispute atau Order..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 rounded-lg bg-slate-50/50 border-border/50 text-[10px] md:text-[11px] focus:ring-red-500/10" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-28 md:w-32 rounded-lg border-border/50 bg-white text-[10px] font-medium">
              <AlertTriangle className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-[10px]">Semua Prioritas</SelectItem>
              <SelectItem value="HIGH" className="text-[10px]">Tinggi</SelectItem>
              <SelectItem value="MEDIUM" className="text-[10px]">Sedang</SelectItem>
              <SelectItem value="LOW" className="text-[10px]">Rendah</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border/50 text-[10px] font-medium gap-2 hover:bg-slate-50 transition-colors">
            Audit Kasus
          </Button>
        </div>
      </div>

      {/* Disputes Table */}
      <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest px-6 h-10">Waktu & ID</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Status & Prioritas</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Pihak Terlibat</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Alasan</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest text-right px-6 h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GLOBAL_DISPUTES_DUMMY.filter(d => 
                d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.orderId.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((d) => (
                <TableRow key={d.id} className="border-b border-border/30 hover:bg-slate-50/30 transition-colors group">
                  <TableCell className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-[#2E3137]">{d.date}</span>
                      <span className="text-[8px] text-muted-foreground font-mono uppercase">{d.id}</span>
                      <span className="text-[8px] text-red-600 font-bold mt-0.5">{d.orderId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-medium px-2 py-0 rounded-md border-none w-fit",
                        d.status === 'RESOLVED' ? "bg-green-50 text-green-700" : 
                        d.status === 'PENDING_ADMIN' ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {d.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1">
                         <div className={cn(
                           "h-1 w-1 rounded-full",
                           d.priority === 'HIGH' ? "bg-red-500" : d.priority === 'MEDIUM' ? "bg-orange-400" : "bg-blue-400"
                         )}></div>
                         <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight">{d.priority}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-[#2E3137]">{d.user}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-2.5 h-2.5 text-red-600 opacity-60" />
                        <span className="text-[9px] font-medium text-muted-foreground">ke {d.shop}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-medium text-[#2E3137] line-clamp-1 max-w-[180px]">"{d.reason}"</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50">
                          <MessageSquare className="w-3.5 h-3.5" />
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
            Menampilkan {GLOBAL_DISPUTES_DUMMY.length} Kasus
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" disabled className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium opacity-50">Sebelumnya</Button>
            <Button variant="outline" className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium hover:bg-slate-50 transition-colors">Berikutnya</Button>
          </div>
        </div>
      </Card>

      {/* Action Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50 shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-600 opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Intervensi Otomatis</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Sistem akan menutup sengketa secara otomatis dalam <b>24 jam</b> jika toko tidak memberikan respon valid terhadap klaim pembeli.
            </p>
          </div>
        </Card>
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-red-600 opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Pusat Bantuan Admin</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Gunakan mode <b>Mediator</b> untuk mengaktifkan obrolan tiga arah antara Admin, Pembeli, dan Toko guna mempercepat resolusi.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
