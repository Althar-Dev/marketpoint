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
  UserPlus, 
  MoreHorizontal, 
  Filter, 
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  Mail,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUsersPage() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const usersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), orderBy("lastLogin", "desc"), limit(50));
  }, [db]);

  const { data: users, loading } = useCollection(usersQuery);

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Manajemen Pengguna</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Pantau dan kelola hak akses seluruh basis pengguna platform.</p>
        </div>
        <Button className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-medium gap-2 shadow-sm shadow-green-100">
          <UserPlus className="w-3.5 h-3.5" /> Tambah User
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Pengguna", value: users?.length || "0", icon: UsersIcon, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Admin Aktif", value: users?.filter((u: any) => u.admin).length || "0", icon: ShieldCheck, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "User Terverifikasi", value: "84%", icon: UserCheck, bg: "bg-green-50", color: "text-[#00AA5B]" },
          { label: "Registrasi Baru", value: "+12", icon: UserPlus, bg: "bg-green-50", color: "text-[#00AA5B]" },
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
            placeholder="Cari nama atau email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 rounded-lg bg-slate-50/50 border-border/50 text-[10px] md:text-[11px] focus:ring-[#00AA5B]/10" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-28 md:w-32 rounded-lg border-border/50 bg-white text-[10px] font-medium">
              <Filter className="w-3 h-3 mr-2 opacity-50" />
              <SelectValue placeholder="Peran" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="all" className="text-[10px]">Semua Peran</SelectItem>
              <SelectItem value="admin" className="text-[10px]">Administrator</SelectItem>
              <SelectItem value="user" className="text-[10px]">Regular User</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border/50 text-[10px] font-medium gap-2 hover:bg-slate-50 transition-colors">
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest px-6 h-10">Pengguna</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Peran</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Status</TableHead>
                <TableHead className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest h-10">Login Terakhir</TableHead>
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
              ) : (
                users?.filter((u: any) => 
                  u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((u: any) => (
                  <TableRow key={u.id} className="border-b border-border/30 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg border border-border/40 shadow-sm shrink-0">
                          <AvatarImage src={u.photoURL} />
                          <AvatarFallback className="bg-green-50 text-[#00AA5B] text-[9px] font-medium uppercase">
                            {u.displayName?.substring(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-[#2E3137] truncate">{u.displayName || "Anonymous"}</span>
                          <span className="text-[9px] text-muted-foreground truncate font-medium">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-medium px-2 py-0 rounded-md border-none",
                        u.admin ? "bg-green-50 text-[#00AA5B]" : "bg-slate-100 text-slate-600"
                      )}>
                        {u.admin ? 'ADMIN' : 'USER'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] text-muted-foreground font-medium">Aktif</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {u.lastLogin ? new Date(u.lastLogin.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50">
                            <Mail className="w-3.5 h-3.5" />
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
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Info */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between bg-slate-50/20">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest px-2">
            Menampilkan {users?.length || 0} Pengguna
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" disabled className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium opacity-50">Sebelumnya</Button>
            <Button variant="outline" className="h-7 px-3 rounded-lg border-border/50 bg-white text-[9px] font-medium hover:bg-slate-50 transition-colors">Berikutnya</Button>
          </div>
        </div>
      </Card>

      {/* Bottom Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Kebijakan Keamanan</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Pastikan setiap pemberian hak akses administrator telah melalui verifikasi identitas resmi untuk menjaga integritas platform.
            </p>
          </div>
        </Card>
        <Card className="border-border/50 border-dashed bg-slate-50/30 rounded-xl md:rounded-2xl p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
            <Mail className="w-4 h-4 text-[#00AA5B] opacity-70" />
          </div>
          <div>
            <h3 className="text-[11px] font-medium text-[#2E3137]">Verifikasi Email</h3>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
              Sebanyak <span className="text-[#00AA5B]">84%</span> pengguna telah memverifikasi alamat email mereka. Kirim pengingat verifikasi secara massal?
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
