"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const MOCK_DISPUTES = [
  {
    id: "DSP-8821",
    orderId: "ORD-99120",
    userName: "Rian Hidayat",
    reason: "Lisensi API tidak valid / sudah digunakan",
    status: "ACTIVE",
    priority: "HIGH",
    date: "1 jam lalu",
    deadline: "23 jam lagi",
    amount: 125000,
  },
  {
    id: "DSP-8815",
    orderId: "ORD-99088",
    userName: "Dewi Lestari",
    reason: "File source code corrupt saat di-extract",
    status: "PENDING_BUYER",
    priority: "MEDIUM",
    date: "Kemarin",
    deadline: "2 hari lagi",
    amount: 45000,
  },
  {
    id: "DSP-8790",
    orderId: "ORD-98871",
    userName: "Andrianto",
    reason: "Fitur tidak sesuai deskripsi produk",
    status: "RESOLVED",
    priority: "LOW",
    date: "3 hari lalu",
    deadline: null,
    amount: 250000,
  }
];

export default function MerchantDisputePage() {
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
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Komplain & Dispute</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola keluhan pelanggan dan selesaikan masalah transaksi.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Icon icon="ph:book-open" className="w-3.5 h-3.5" /> Panduan Seller
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Perlu Respon", value: "1", color: "text-orange-600", bg: "bg-orange-50", icon: "ph:warning-circle" },
            { label: "Menunggu Pembeli", value: "1", color: "text-blue-600", bg: "bg-blue-50", icon: "ph:hourglass" },
            { label: "Dalam Investigasi", value: "0", color: "text-[#8B5CF6]", bg: "bg-purple-50", icon: "ph:magnifying-glass" },
            { label: "Selesai (Bulan Ini)", value: "12", color: "text-[#00AA5B]", bg: "bg-green-50", icon: "ph:check-circle" },
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

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button variant="secondary" className="h-8 rounded-lg text-[10px] font-bold bg-[#00AA5B]/10 text-[#00AA5B]">Semua</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Aktif (2)</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Selesai</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold text-muted-foreground">Dibatalkan</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-48">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Cari Order ID..." className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20" />
            </div>
            <Select defaultValue="newest">
              <SelectTrigger className="h-8 w-28 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru</SelectItem>
                <SelectItem value="oldest" className="text-[10px] font-bold">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dispute List */}
        <div className="space-y-4 pb-20">
          {MOCK_DISPUTES.map((dispute) => (
            <Card key={dispute.id} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden hover:border-[#00AA5B]/30 transition-all group">
              <CardContent className="p-0">
                <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]/30">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-foreground">{dispute.id}</span>
                      <span className="text-[9px] text-muted-foreground font-bold">{dispute.orderId}</span>
                    </div>
                    <Badge className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-md border-none",
                      dispute.status === 'ACTIVE' ? "bg-orange-500 text-white" : 
                      dispute.status === 'PENDING_BUYER' ? "bg-blue-500 text-white" : "bg-[#00AA5B] text-white"
                    )}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Nominal Dispute</span>
                      <span className="text-[11px] font-black">Rp {dispute.amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                        <Icon icon="ph:user-circle" className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black">{dispute.userName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{dispute.date}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-border/50">
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1">Alasan Komplain</p>
                      <p className="text-[12px] font-medium text-[#2E3137]">"{dispute.reason}"</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 shrink-0">
                    {dispute.deadline && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 w-full justify-center">
                        <Icon icon="ph:clock-countdown" className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-[10px] font-black text-red-600">Batas Respon: {dispute.deadline}</span>
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" className="flex-1 h-9 rounded-xl text-[10px] font-black border-border hover:bg-white">
                        Detail Kasus
                      </Button>
                      {dispute.status !== 'RESOLVED' && (
                        <Button className="flex-1 h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-black shadow-sm">
                          Tanggapi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="border-dashed border-border border-[1.5px] bg-[#F8FAFC] rounded-2xl p-6 text-center">
          <Icon icon="ph:info-bold" className="w-6 h-6 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-xs font-black text-[#2E3137]">Selesaikan Komplain Dengan Cepat</h3>
          <p className="text-[10px] text-muted-foreground max-w-sm mx-auto mt-2 font-medium leading-relaxed">
            Menanggapi komplain di bawah 2 jam dapat meningkatkan reputasi toko Anda dan mempercepat pencairan saldo yang tertahan.
          </p>
        </Card>

      </div>
    </main>
  );
}
