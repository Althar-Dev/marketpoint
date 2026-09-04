"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MerchantWalletPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const transactionQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: transactions, loading: transLoading } = useCollection(transactionQuery);

  if (!mounted || authLoading || walletLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
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
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Saldo & Keuangan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Kelola pendapatan dan riwayat penarikan dana toko Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 px-4 rounded-xl font-bold text-[11px] gap-2 border-border bg-white shadow-sm">
              <Download className="w-3.5 h-3.5" /> Unduh Laporan
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Tarik Dana
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm border-border">
                <DialogHeader>
                  <DialogTitle className="font-black text-lg">Tarik Saldo Penghasilan</DialogTitle>
                  <DialogDescription className="text-xs">
                    Dana akan dikirimkan ke rekening utama yang terdaftar.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-border flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Saldo Tersedia</span>
                    <span className="text-sm font-black text-[#00AA5B]">Rp {wallet?.balance?.toLocaleString('id-ID') || 0}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground ml-1">NOMINAL PENARIKAN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                      <Input placeholder="0" className="h-10 pl-9 rounded-xl border-border font-black text-sm" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-dashed border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-foreground">BCA ••••• 8901</p>
                      <p className="text-[9px] text-muted-foreground truncate">a.n {user?.displayName || "Pemilik Toko"}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-xs">
                    Konfirmasi Penarikan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Balance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-24 h-24" />
            </div>
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold opacity-80 tracking-widest uppercase">Saldo Tersedia</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium">Rp</span>
                  <p className="text-2xl font-black tracking-tighter">{wallet?.balance?.toLocaleString('id-ID') || 0}</p>
                </div>
              </div>
              <p className="text-[9px] font-medium opacity-70 mt-2">Dapat ditarik ke rekening kapan saja.</p>
            </CardContent>
          </Card>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Saldo Tertahan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-[#2E3137]">Rp</span>
                  <p className="text-2xl font-black tracking-tighter text-[#2E3137]">0</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-orange-500" />
                <p className="text-[9px] font-medium text-muted-foreground">Sedang dalam proses verifikasi transaksi.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Total Penarikan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-[#2E3137]">Rp</span>
                  <p className="text-2xl font-black tracking-tighter text-[#2E3137]">0</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[#00AA5B]">
                <TrendingUp className="w-3 h-3" />
                <p className="text-[9px] font-medium">Akumulasi saldo yang berhasil dicairkan.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Section */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-border/50 bg-[#F8FAFC]/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                Riwayat Transaksi
                <Badge variant="secondary" className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[9px] font-bold">Terbaru</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Cari transaksi..." className="h-8 pl-9 rounded-lg border-border text-[10px] w-[180px] bg-white" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="h-8 rounded-lg border-border text-[10px] font-bold w-[120px] bg-white">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="all" className="text-[10px] font-bold">Semua Tipe</SelectItem>
                    <SelectItem value="SALES" className="text-[10px] font-bold">Penjualan</SelectItem>
                    <SelectItem value="WITHDRAWAL" className="text-[10px] font-bold">Penarikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Waktu & ID</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Tipe & Deskripsi</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-b border-border/50">
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.map((t: any) => (
                  <TableRow key={t.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-[#2E3137]">
                          {new Date(t.timestamp?.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium uppercase">{t.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          t.type === 'SALES' ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "bg-orange-500/10 text-orange-600"
                        )}>
                          {t.type === 'SALES' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold">{t.type === 'SALES' ? 'Hasil Penjualan' : 'Penarikan Dana'}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {t.status === 'SUCCESS' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00AA5B]/10 text-[#00AA5B]">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-black uppercase">Berhasil</span>
                          </div>
                        ) : t.status === 'PENDING' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-black uppercase">Proses</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-black uppercase">Gagal</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-[12px] font-black",
                        t.type === 'SALES' ? "text-[#00AA5B]" : "text-[#2E3137]"
                      )}>
                        {t.type === 'SALES' ? '+' : '-'} Rp {t.amount?.toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border border-border/50">
                        <Wallet className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <h3 className="text-xs font-bold text-[#212121]">Belum ada transaksi</h3>
                      <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1.5 font-medium">
                        Riwayat pendapatan dan pengeluaran toko Anda akan muncul di sini.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {(transactions?.length || 0) > 0 && (
            <div className="p-4 border-t border-border/50 flex justify-center bg-[#F8FAFC]/30">
              <Button variant="ghost" className="text-[10px] font-bold text-[#00AA5B] hover:bg-white hover:text-[#00AA5B]">
                Lihat Semua Riwayat
              </Button>
            </div>
          )}
        </Card>

      </div>
    </main>
  );
}
