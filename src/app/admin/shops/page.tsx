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
  Plus, 
  MoreHorizontal, 
  Filter, 
  Store,
  ShieldCheck,
  Zap,
  Globe,
  ChevronRight,
  ExternalLink
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

export default function AdminShopsPage() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopsQuery = useMemoFirebase(() => {
    return query(collection(db, "shops"), orderBy("createdAt", "desc"), limit(50));
  }, [db]);

  const { data: shops, loading } = useCollection(shopsQuery);

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Manajemen Toko</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Pantau profil dan status operasional seluruh merchant platform.</p>
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
          { label: "Total Toko", value: shops?.length || "0", icon: Store, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Toko Aktif", value: shops?.filter((s: any) => s.status === 'ACTIVE').length || "0", icon: Zap, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Pendaftaran Baru", value: "+2", icon: Plus, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Official Verified", value: "12", icon: ShieldCheck, bg: "bg-green-50", color: "text-[#00AA5B]" },
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
            placeholder="Cari nama toko atau slug..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 rounded-lg bg-slate-50/50 border-border/50 text-[10px] md:text-[11px] focus:ring-[#00AA5B]/10" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-28 md:w-32 rounded-lg border-border/50 bg-white text-[10px] font-medium">
              <Globe className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-[10px]">Semua Status</SelectItem>
              <SelectItem value="active" className="text-[10px]">Aktif</SelectItem>
              <SelectItem value="suspended" className="text-[10px]">Ditangguhkan</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border/50 text-[10px] font-medium gap-2 hover:bg-slate-50 transition-colors">
            Ekspor Data
          </Button>
        </div>
      </div>

      {/* Shops Table */}
      <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest px-6 h-10">Toko & Identitas</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Status</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Lokasi</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Terdaftar</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest text-right px-6 h-10">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="border-b border-border/30">
                    <TableCell className="px-6 py-4"><Skeleton className="h-8 w-40 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-7 w-7 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : shops?.filter((s: any) => 
                  s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  s.slug?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((s: any) => (
                  <TableRow key={s.id} className="border-b border-border/30 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg border border-border/40 shadow-sm shrink-0">
                          <AvatarImage src={s.logoUrl} />
                          <AvatarFallback className="bg-green-50 text-[#00AA5B] text-[9px] font-medium uppercase">
                            {s.name?.substring(0, 1) || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-[#2E3137] truncate">{s.name}</span>
                          <span className="text-[9px] text-muted-foreground truncate font-medium">@{s.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-medium px-2 py-0 rounded-md border-none",
                        s.status === 'ACTIVE' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {s.status === 'ACTIVE' ? 'AKTIF' : 'SUSPEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">{s.location?.city || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50">
                            <Link href={`/${s.slug}`} target="_blank">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                         </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50">
                            <ChevronRight className="w-3.5 h-3.5" />
                         </Button>
                      </div>
                      <div className="group-hover:hidden">
                         <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-30" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Info */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between bg-slate-50/20">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest px-2">
            Menampilkan {shops?.length || 0} Toko
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" disabled className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium opacity-50">Sebelumnya</Button>
            <Button variant="outline" className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium hover:bg-slate-50 transition-colors">Berikutnya</Button>
          </div>
        </div>
      </Card>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Verifikasi Toko Resmi</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Toko dengan label <b>Official</b> memiliki tingkat kepercayaan 4x lebih tinggi. Tinjau permintaan verifikasi tertunda?
            </p>
          </div>
        </Card>
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <Zap className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Analisa Pertumbuhan</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Rata-rata pembuatan toko baru meningkat <span className="text-[#00AA5B]">12%</span> di bulan ini dibandingkan bulan lalu.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
