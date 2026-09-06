"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  MousePointer2,
  Package,
  Star
} from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const PERFORMANCE_DATA = [
  { day: "Sen", visits: 120, orders: 12 },
  { day: "Sel", visits: 150, orders: 18 },
  { day: "Rab", visits: 180, orders: 22 },
  { day: "Kam", visits: 140, orders: 15 },
  { day: "Jum", visits: 220, orders: 30 },
  { day: "Sab", visits: 310, orders: 45 },
  { day: "Min", visits: 280, orders: 38 },
];

const chartConfig = {
  visits: {
    label: "Kunjungan",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Pesanan",
    color: "#00AA5B",
  },
} satisfies ChartConfig;

export default function MerchantStatsPage() {
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
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Statistik Bisnis</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Analisis mendalam performa toko dan perilaku pelanggan.</p>
          </div>
          <Select defaultValue="7days">
            <SelectTrigger className="h-9 w-[160px] rounded-xl border-border bg-white text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="today" className="text-[11px] font-bold">Hari Ini</SelectItem>
              <SelectItem value="7days" className="text-[11px] font-bold">7 Hari Terakhir</SelectItem>
              <SelectItem value="30days" className="text-[11px] font-bold">30 Hari Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pengunjung", value: "1.240", change: "+12%", icon: Eye, color: "text-[#2E3137]" },
            { label: "Pesanan Masuk", value: "180", change: "+8%", icon: ShoppingBag, color: "text-[#00AA5B]" },
            { label: "Konversi", value: "4.5%", change: "-2%", icon: MousePointer2, color: "text-[#8B5CF6]" },
            { label: "Rating Toko", value: "4.9", change: "Stabil", icon: Star, color: "text-[#FFC400]" },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg bg-muted/30", stat.color.replace('text', 'bg-opacity-10 text'))}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                    stat.change.startsWith('+') ? "bg-green-100 text-green-700" : 
                    stat.change.startsWith('-') ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {stat.change.startsWith('+') && <ArrowUp className="w-2 h-2" />}
                    {stat.change.startsWith('-') && <ArrowDown className="w-2 h-2" />}
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                  <p className="text-xl font-black text-[#212121] tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border border-[1.5px] shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-sm font-bold">Tren Performa Mingguan</CardTitle>
              <CardDescription className="text-[10px] font-medium">Visualisasi gelombang kunjungan dan pesanan yang berhasil.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-6">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00AA5B" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#00AA5B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Area 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVisits)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#00AA5B" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorOrders)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-0.5 rounded-full bg-primary border-t-2 border-primary"></div>
                  <span className="text-[10px] font-bold text-muted-foreground">Kunjungan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-0.5 rounded-full bg-[#00AA5B] border-t-2 border-[#00AA5B]"></div>
                  <span className="text-[10px] font-bold text-muted-foreground">Pesanan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Stats Column */}
          <div className="space-y-6">
            {/* Top Categories Card */}
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-[12px] font-bold">Kategori Terlaris</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-4">
                {[
                  { name: "API Gateway", percent: 65, color: "bg-[#00AA5B]" },
                  { name: "Source Code", percent: 20, color: "bg-[#8B5CF6]" },
                  { name: "Cloud Infrastructure", percent: 15, color: "bg-[#FFC400]" },
                ].map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="text-[#2E3137]">{cat.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", cat.color)} 
                        style={{ width: `${cat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Insights Card */}
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#F8FAFC]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#00AA5B]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#2E3137]">Insight Performa</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 font-medium">
                      Pesanan Anda meningkat <span className="text-[#00AA5B] font-bold">8%</span> berdasarkan tren gelombang terbaru.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-8 rounded-xl text-[10px] font-black border-border bg-white hover:bg-white hover:text-[#00AA5B]">
                  Lihat Tips Optimasi
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Product Performance Table (Empty State) */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Performa Produk</CardTitle>
              <CardDescription className="text-[10px] font-medium">Detail konversi per produk.</CardDescription>
            </div>
            <Button variant="ghost" className="text-[10px] font-bold text-[#00AA5B] hover:bg-transparent">
              Lihat Detail Semua Produk
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4 border border-border/50">
              <Package className="w-8 h-8 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xs font-bold text-[#212121]">Belum Ada Data Produk Cukup</h3>
            <p className="text-[10px] text-muted-foreground max-w-[280px] mt-1.5 leading-relaxed font-medium">
              Data analitik per produk akan muncul secara otomatis setelah mendapatkan minimal 10 kunjungan unik.
            </p>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
