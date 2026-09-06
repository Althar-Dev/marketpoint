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
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_VOUCHERS = [
  {
    id: "VCH-001",
    code: "GAKNYESEL",
    type: "Diskon Persentase",
    value: "10%",
    quota: 100,
    used: 45,
    status: "ACTIVE",
    expiry: "24 Des 2026"
  },
  {
    id: "VCH-002",
    code: "AWALTAHUN",
    type: "Diskon Flat",
    value: "Rp 25.000",
    quota: 50,
    used: 12,
    status: "ACTIVE",
    expiry: "01 Jan 2027"
  },
  {
    id: "VCH-003",
    code: "PROMOAKHIR",
    type: "Diskon Persentase",
    value: "5%",
    quota: 200,
    used: 200,
    status: "EXPIRED",
    expiry: "20 Nov 2025"
  }
];

export default function MerchantVouchersPage() {
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
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Voucher Toko</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Buat promo diskon menarik untuk menarik lebih banyak pembeli.</p>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md">
              <Icon icon="ph:plus-bold" className="w-3.5 h-3.5" /> Buat Voucher
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Voucher", value: "12", icon: "ph:ticket", color: "text-[#2E3137]", bg: "bg-gray-50" },
            { label: "Voucher Aktif", value: "8", icon: "ph:check-circle", color: "text-[#00AA5B]", bg: "bg-green-50" },
            { label: "Total Digunakan", value: "452", icon: "ph:users-three", color: "text-[#8B5CF6]", bg: "bg-purple-50" },
            { label: "Estimasi Hemat", value: "Rp 4.5M", icon: "ph:wallet", color: "text-[#FFC400]", bg: "bg-yellow-50" },
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

        {/* List Section */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-4 border-b border-border bg-[#F8FAFC]">
             <h3 className="text-xs font-black text-[#2E3137] uppercase tracking-wider">Daftar Voucher</h3>
          </div>
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">Kode & Tipe</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Nilai</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Kuota</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_VOUCHERS.map((v) => (
                <TableRow key={v.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-black text-[#00AA5B]">{v.code}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{v.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-black text-[#2E3137]">{v.value}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#2E3137]">{v.used} / {v.quota}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">Berakhir: {v.expiry}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                      v.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Icon icon="ph:dots-three-vertical-bold" className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>
    </main>
  );
}
