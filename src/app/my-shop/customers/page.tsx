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

const MOCK_CUSTOMERS = [
  {
    id: "CUST-001",
    name: "Rian Hidayat",
    email: "rian.h@example.com",
    avatar: "",
    totalOrders: 12,
    totalSpent: 1250000,
    lastOrder: "2 jam lalu",
    status: "LOYAL",
    joinDate: "12 Jan 2024"
  },
  {
    id: "CUST-002",
    name: "Dewi Lestari",
    email: "dewi.l@example.com",
    avatar: "",
    totalOrders: 5,
    totalSpent: 450000,
    lastOrder: "Kemarin",
    status: "ACTIVE",
    joinDate: "05 Feb 2024"
  },
  {
    id: "CUST-003",
    name: "Andrianto",
    email: "andri@dev.id",
    avatar: "",
    totalOrders: 28,
    totalSpent: 4850000,
    lastOrder: "3 hari lalu",
    status: "VIP",
    joinDate: "20 Nov 2023"
  },
  {
    id: "CUST-004",
    name: "Siska Putri",
    email: "siska.p@gmail.com",
    avatar: "",
    totalOrders: 1,
    totalSpent: 25000,
    lastOrder: "1 minggu lalu",
    status: "NEW",
    joinDate: "15 Mei 2024"
  }
];

export default function MerchantCustomersPage() {
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
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Manajemen Pelanggan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Lihat profil pembeli dan analisis riwayat belanja mereka.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Icon icon="ph:export-bold" className="w-3.5 h-3.5" /> Ekspor Data
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Pelanggan", value: "1.240", icon: "ph:users-four", color: "text-[#2E3137]", bg: "bg-gray-50" },
            { label: "Pelanggan Aktif", value: "856", icon: "ph:user-circle-check", color: "text-[#00AA5B]", bg: "bg-green-50" },
            { label: "Pelanggan Baru", value: "124", icon: "ph:user-plus", color: "text-[#8B5CF6]", bg: "bg-purple-50" },
            { label: "Tingkat Retensi", value: "68%", icon: "ph:arrows-counter-clockwise", color: "text-[#FFC400]", bg: "bg-yellow-50" },
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
            <Button variant="secondary" className="h-8 rounded-lg text-[10px] font-bold bg-[#00AA5B]/10 text-[#00AA5B]">Semua Pelanggan</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">VIP / Top Spender</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Pelanggan Baru</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-56">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Cari nama atau email..." className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20" />
            </div>
            <Select defaultValue="spent">
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="spent" className="text-[10px] font-bold">Total Belanja</SelectItem>
                <SelectItem value="orders" className="text-[10px] font-bold">Jumlah Order</SelectItem>
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru Daftar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customer Table */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">Pelanggan</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Total Belanja</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Order</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CUSTOMERS.map((customer) => (
                <TableRow key={customer.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg border border-border shadow-sm">
                        <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-[10px] font-black">
                          {customer.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-black text-[#2E3137]">{customer.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{customer.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                      customer.status === 'VIP' ? "bg-[#FFC400] text-black" : 
                      customer.status === 'LOYAL' ? "bg-[#8B5CF6] text-white" : 
                      customer.status === 'ACTIVE' ? "bg-[#00AA5B] text-white" : "bg-gray-400 text-white"
                    )}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-black text-[#2E3137]">Rp {customer.totalSpent.toLocaleString('id-ID')}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#2E3137]">{customer.totalOrders}x</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Terakhir: {customer.lastOrder}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#00AA5B]/10 hover:text-[#00AA5B]">
                      <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/50 flex justify-between items-center bg-[#F8FAFC]/30">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2">Menampilkan 4 dari 1.240 Pelanggan</p>
            <div className="flex gap-2">
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-left-bold" className="w-3 h-3" /></Button>
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-border bg-white"><Icon icon="ph:caret-right-bold" className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>

      </div>
    </main>
  );
}
