"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  DollarSign,
  Activity,
  Globe,
  PieChart
} from "lucide-react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const REVENUE_DATA = [
  { month: "Jan", revenue: 4500000, users: 400 },
  { month: "Feb", revenue: 5200000, users: 550 },
  { month: "Mar", revenue: 4800000, users: 600 },
  { month: "Apr", revenue: 6100000, users: 800 },
  { month: "Mei", revenue: 7500000, users: 950 },
  { month: "Jun", revenue: 8900000, users: 1200 },
];

const CATEGORY_DATA = [
  { name: "API Bridge", value: 45, color: "#ef4444" },
  { name: "Source Code", value: 30, color: "#f87171" },
  { name: "Bot WhatsApp", value: 15, color: "#fca5a5" },
  { name: "Lainnya", value: 10, color: "#fee2e2" },
];

const chartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "#ef4444",
  },
  users: {
    label: "Pengguna Baru",
    color: "#71717a",
  },
} satisfies ChartConfig;

export default function AdminAnalytics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
           <h2 className="text-lg md:text-xl font-medium tracking-tight text-[#212121]">Analitik Platform</h2>
           <p className="text-[10px] md:text-[11px] text-muted-foreground">Laporan performa pertumbuhan ekonomi dan aktivitas pengguna global.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="h-8 md:h-9 w-36 md:w-40 rounded-xl border-border bg-white text-[10px] md:text-[11px] font-medium">
              <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="30days" className="text-[10px] md:text-[11px]">30 Hari Terakhir</SelectItem>
              <SelectItem value="6months" className="text-[10px] md:text-[11px]">6 Bulan Terakhir</SelectItem>
              <SelectItem value="year" className="text-[10px] md:text-[11px]">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 md:h-9 px-3 rounded-xl border-border bg-white text-[10px] md:text-[11px] font-medium gap-2">
            <Activity className="w-3 h-3" /> Eksport
          </Button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Volume GMV", value: "Rp 145.2M", change: "+14.2%", trend: "up", icon: DollarSign, bg: "bg-red-50", color: "text-red-600" },
          { label: "Total Transaksi", value: "12,480", change: "+8.1%", trend: "up", icon: ShoppingBag, bg: "bg-red-50", color: "text-red-600" },
          { label: "Retensi User", value: "72.4%", change: "-2.5%", trend: "down", icon: Users, bg: "bg-slate-50", color: "text-slate-600" },
          { label: "Aktifitas Sistem", value: "99.9%", change: "Stabil", trend: "up", icon: Activity, bg: "bg-emerald-50", color: "text-emerald-600" },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-3.5 md:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-medium",
                  stat.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-base md:text-xl font-bold text-[#212121] tracking-tight mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-4 md:p-6 pb-0">
            <CardTitle className="text-[11px] md:text-xs font-medium flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-red-600" />
              Tren Pertumbuhan Platform (GMV)
            </CardTitle>
            <CardDescription className="text-[9px] md:text-[10px] mt-1">Perbandingan bulanan antara volume transaksi dan pertumbuhan pengguna baru.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-8 md:pt-10">
            <ChartContainer config={chartConfig} className="h-[240px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }}
                  />
                  <Tooltip content={<ChartTooltipContent hideLabel />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 rounded-full bg-red-600"></div>
                <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground">Volume GMV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-0.5 rounded-full bg-slate-300"></div>
                <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground">Acquisition Target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Bar Chart */}
        <Card className="border-border shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-[11px] md:text-xs font-medium flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-red-600" />
              Kontribusi Kategori
            </CardTitle>
            <CardDescription className="text-[9px] md:text-[10px] mt-1">Distribusi volume transaksi berdasarkan kategori produk digital.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 flex flex-col justify-center h-full">
            <div className="space-y-5">
              {CATEGORY_DATA.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-[11px] font-medium text-[#2E3137]">{cat.name}</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-red-600">{cat.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-red-50/50 border border-red-100/50">
               <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-white border border-red-100 flex items-center justify-center shrink-0">
                     <Globe className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#2E3137]">Insight Global</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">
                      Kategori <span className="text-red-600 font-bold">API Bridge</span> mendominasi 45% total pendapatan bulan ini dengan pertumbuhan 12%.
                    </p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Activity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
         <Card className="border-border border-dashed bg-muted/10 rounded-xl md:rounded-2xl p-5 md:p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 md:h-11 md:w-11 rounded-full bg-white shadow-sm flex items-center justify-center border border-border group-hover:border-red-200 transition-colors">
                 <Activity className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              </div>
              <div>
                 <h3 className="text-[11px] md:text-[12px] font-medium">Laporan Audit Sistem</h3>
                 <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">Semua parameter infrastruktur dalam kondisi optimal.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[9px] md:text-[10px] font-medium text-red-600 hover:bg-white border border-transparent hover:border-red-100">
               Detail Log
            </Button>
         </Card>

         <Card className="border-border border-dashed bg-muted/10 rounded-xl md:rounded-2xl p-5 md:p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 md:h-11 md:w-11 rounded-full bg-white shadow-sm flex items-center justify-center border border-border group-hover:border-red-200 transition-colors">
                 <Users className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
              </div>
              <div>
                 <h3 className="text-[11px] md:text-[12px] font-medium">Analisa Cohort</h3>
                 <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">Tinjauan retensi merchant aktif selama 12 bulan.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[9px] md:text-[10px] font-medium text-red-600 hover:bg-white border border-transparent hover:border-red-100">
               Buka Analisa
            </Button>
         </Card>
      </div>
    </main>
  );
}
