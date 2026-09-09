"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  Clock,
  PackageCheck,
  Star,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const BILLING_HISTORY = [
  {
    id: "INV-2024-001",
    plan: "Premium Monthly",
    amount: 150000,
    status: "SUCCESS",
    date: "12 Mei 2024",
    method: "Saldo Wallet"
  },
  {
    id: "INV-2024-002",
    plan: "Premium Monthly",
    amount: 150000,
    status: "SUCCESS",
    date: "12 Apr 2024",
    method: "QRIS"
  },
  {
    id: "INV-2024-003",
    plan: "Basic Plan",
    amount: 0,
    status: "SUCCESS",
    date: "12 Mar 2024",
    method: "Free"
  }
];

const PLAN_FEATURES = [
  "Buka 50+ Produk Digital",
  "Akses Full API Bridge",
  "WhatsApp Bot Automation",
  "Custom Voucher & Promo",
  "Prioritas MarketPoint Support",
  "Laporan Analitik Mendalam",
  "Label Toko Official Verified"
];

export default function MerchantSubscriptionPage() {
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
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="lg:col-span-1 h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Subscription & Billing</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola paket layanan dan pantau riwayat tagihan toko Anda.</p>
          </div>
          <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10">
            <Zap className="w-3.5 h-3.5" /> Ganti Paket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Plan Card */}
          <Card className="lg:col-span-2 border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between bg-gradient-to-r from-[#00AA5B]/5 to-transparent">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#00AA5B]" />
                  Paket Saat Ini
                </CardTitle>
                <CardDescription className="text-[10px] font-medium">Informasi detail mengenai langganan aktif Anda.</CardDescription>
              </div>
              <Badge className="bg-[#00AA5B] text-white font-black text-[9px] px-2 py-0.5 border-none">ACTIVE</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-[#212121] tracking-tight">Premium Monthly</h3>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">Sangat cocok untuk bisnis infrastruktur digital menengah.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pembaruan Berikutnya</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#00AA5B]" />
                        <span className="text-[12px] font-black text-[#2E3137]">12 Juni 2024</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Biaya Berlangganan</p>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#00AA5B]" />
                        <span className="text-[12px] font-black text-[#2E3137]">Rp 150.000 / Bulan</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" className="h-10 px-8 rounded-xl font-black text-[11px] border-border hover:bg-[#F8FAFC]">
                    Tarik Tagihan
                  </Button>
                  <Button variant="ghost" className="h-10 px-8 rounded-xl font-black text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50">
                    Batalkan Langganan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features Card */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                Keuntungan Paket
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {PLAN_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />
                  <span className="text-[11px] font-bold text-[#2E3137]">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Billing History Table */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00AA5B]" />
              Riwayat Pembayaran
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">Invoice ID</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Paket & Tanggal</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Metode</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BILLING_HISTORY.map((bill) => (
                <TableRow key={bill.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/30 transition-colors">
                  <TableCell className="px-6 py-4">
                    <span className="text-[11px] font-black text-[#00AA5B]">{bill.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-[#2E3137]">{bill.plan}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{bill.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-bold text-[#2E3137]">{bill.method}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#00AA5B]" />
                      <span className="text-[10px] font-black text-[#00AA5B]">SUKSES</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <span className="text-[11px] font-black text-[#2E3137]">Rp {bill.amount.toLocaleString('id-ID')}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/50 flex justify-center bg-[#F8FAFC]/30">
            <Button variant="ghost" className="text-[10px] font-black text-[#00AA5B] hover:bg-transparent">Tampilkan lebih banyak riwayat</Button>
          </div>
        </Card>

        {/* Upgrade Promotion Banner */}
        <Card className="border-none bg-gradient-to-br from-[#212121] to-[#2E3137] text-white rounded-3xl p-8 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Star className="w-64 h-64 text-white fill-current" />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                 <h3 className="text-xl font-black tracking-tight">Butuh performa lebih maksimal?</h3>
                 <p className="text-[11px] text-white/70 max-w-md leading-relaxed font-medium">
                   Upgrade ke <strong>Enterprise Plan</strong> dan nikmati infrastruktur dedicated, komisi transaksi 0%, serta manajer akun khusus untuk pertumbuhan toko Anda.
                 </p>
                 <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5">
                       <Info className="w-3.5 h-3.5 text-[#FFC400]" />
                       <span className="text-[10px] font-bold text-[#FFC400]">Hemat 20% dengan paket tahunan</span>
                    </div>
                 </div>
              </div>
              <Button className="h-11 px-8 rounded-xl bg-white hover:bg-white/90 text-[#212121] font-black text-[11px] gap-2 shadow-xl shadow-black/20 group-hover:translate-x-1 transition-all">
                Cek Enterprise Plan <ArrowUpRight className="w-4 h-4" />
              </Button>
           </div>
        </Card>

      </div>
    </main>
  );
}
