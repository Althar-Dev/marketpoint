"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search, 
  History, 
  ChevronRight, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_TABS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Menunggu" },
  { id: "success", label: "Berhasil" },
  { id: "failed", label: "Gagal/Batal" },
];

export default function DashboardTransactionsPage() {
  const { user, loading: authLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTransactions = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions(user.uid);
    }
  }, [user]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = !searchQuery.trim() || 
        t.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.productTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = activeTab === "all" || 
        (activeTab === "pending" && t.status === "PENDING") ||
        (activeTab === "success" && ["PAID", "SETTLED", "SUCCESS"].includes(t.status)) ||
        (activeTab === "failed" && ["FAILED", "CANCELLED", "EXPIRED"].includes(t.status));

      return matchSearch && matchStatus;
    });
  }, [transactions, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "SETTLED":
      case "SUCCESS":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">Berhasil</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">Menunggu</Badge>;
      case "CANCELLED":
      case "FAILED":
      case "EXPIRED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">Gagal/Batal</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] font-bold">{status}</Badge>;
    }
  };

  if (!mounted || authLoading) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Riwayat Transaksi</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Kelola seluruh pembelian produk digital dan layanan Anda.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-3 rounded-2xl border border-border shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-8 px-4 rounded-xl text-[11px] font-bold transition-all shrink-0",
                activeTab === tab.id ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Cari invoice atau produk..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 rounded-xl bg-slate-50/50 border-border text-xs" 
          />
        </div>
      </div>

      <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-border/60">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Belum ada pesanan</h3>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px]">
              {searchQuery ? "Pencarian tidak menemukan hasil." : "Seluruh riwayat pembelian Anda akan muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-border">
                <TableRow>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase px-6 h-10">Produk & Invoice</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Total Bayar</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Waktu</TableHead>
                  <TableHead className="text-right px-6 h-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                          {tx.productImage ? <img src={tx.productImage} className="object-cover w-full h-full" alt="" /> : <Package className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{tx.productTitle || "Produk Digital"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">#{tx.invoiceNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-black text-slate-900">Rp {Number(tx.totalAmount).toLocaleString('id-ID')}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Link href={`/transactions/${tx.invoiceNumber}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[#00AA5B] hover:bg-emerald-50">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </main>
  );
}
