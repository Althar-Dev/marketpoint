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
  { month: "Jan", revenue: 4500000 },
  { month: "Feb", revenue: 5200000 },
  { month: "Mar", revenue: 4800000 },
  { month: "Apr", revenue: 6100000 },
  { month: "Mei", revenue: 7500000 },
  { month: "Jun", revenue: 8900000 },
];

const CATEGORY_DATA = [
  { name: "API Bridge", value: 45, color: "#ef4444" },
  { name: "Source Code", value: 30, color: "#f87171" },
  { name: "Bot WhatsApp", value: 15, color: "#fca5a5" },
  { name: "Lainnya", value: 10, color: "#fee2e2" },
];

const chartConfig = {
  revenue: {
    label: "Volume GMV",
    color: "#ef4444",
  }
} satisfies ChartConfig;

export default function AdminAnalytics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6 md:space-y-8 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
           <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Analitik Platform</h2>
           <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Laporan performa pertumbuhan ekonomi dan aktivitas global.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="h-8 w-32 md:w-36 rounded-lg border-border bg-white text-[10px] font-medium">
              <Calendar className="w-3 h-3 mr-2 text-muted-foreground opacity-60" />
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="30days" className="text-[10px]">30 Hari</SelectItem>
              <SelectItem value="6months" className="text-[10px]">6 Bulan</SelectItem>
              <SelectItem value="year" className="text-[10px]">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-8 px-3 rounded-lg border-border bg-white text-[10px] font-medium gap-2 hover:bg-muted/50">
            <Activity className="w-3 h-3 opacity-60" /> Ekspor
          </Button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Volume GMV", value: "Rp145.2M", change: "+14.2%", trend: "up", icon: DollarSign },
          { label: "Transaksi", value: "12,480", change: "+8.1%", trend: "up", icon: ShoppingBag },
          { label: "Retensi", value: "72.4%", change: "-2.5%", trend: "down", icon: Users },
          { label: "Uptime", value: "99.9%", change: "Stabil", trend: "up", icon: Activity },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-3.5 md:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <stat.icon className="w-3.5 h-3.5 text-red-600 opacity-80" />
                </div>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-medium",
                  stat.trend === 'up' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
                  {stat.change}
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

      {/* Main Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-4 md:p-6 pb-0">
            <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-red-600" />
              Tren Pertumbuhan Platform (GMV)
            </CardTitle>
            <CardDescription className="text-[9px] md:text-[10px] mt-1 font-medium opacity-60">Visualisasi volume transaksi bulanan.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-6">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#999', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#999', fontWeight: 500 }}
                  />
                  <Tooltip content={<ChartTooltipContent hideLabel />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-5 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-0.5 rounded-full bg-red-600"></div>
                <span className="text-[9px] font-medium text-muted-foreground">Volume Transaksi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-0.5 rounded-full bg-slate-200"></div>
                <span className="text-[9px] font-medium text-muted-foreground">Target Proyeksi</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Bar Chart */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden flex flex-col">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-red-600" />
              Kontribusi Kategori
            </CardTitle>
            <CardDescription className="text-[9px] md:text-[10px] mt-1 font-medium opacity-60">Distribusi volume berdasarkan kategori produk.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              {CATEGORY_DATA.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#4B5563]">{cat.name}</span>
                    <span className="text-[9px] font-medium text-red-600 opacity-80">{cat.value}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-3 rounded-xl bg-red-50/40 border border-red-100/30">
               <div className="flex items-start gap-3">
                  <Globe className="w-3.5 h-3.5 text-red-600 opacity-60 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-medium text-[#2E3137]">Wawasan Sektoral</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
                      Kategori <span className="text-red-600">API Bridge</span> tumbuh 12% secara konsisten dalam kurun waktu 3 bulan terakhir.
                    </p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className="border-border/50 border-dashed bg-white rounded-xl md:rounded-2xl p-4 flex items-center justify-between group hover:border-red-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50">
                 <Activity className="w-3.5 h-3.5 text-red-600 opacity-70" />
              </div>
              <div>
                 <h3 className="text-[11px] font-medium text-[#2E3137]">Laporan Audit Infrastruktur</h3>
                 <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Parameter sistem dalam kondisi optimal.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[9px] font-medium text-red-600 hover:bg-red-50">
               Log Detail
            </Button>
         </Card>

         <Card className="border-border/50 border-dashed bg-white rounded-xl md:rounded-2xl p-4 flex items-center justify-between group hover:border-red-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50">
                 <Users className="w-3.5 h-3.5 text-red-600 opacity-70" />
              </div>
              <div>
                 <h3 className="text-[11px] font-medium text-[#2E3137]">Analisa Cohort Merchant</h3>
                 <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Tinjauan retensi merchant aktif platform.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[9px] font-medium text-red-600 hover:bg-red-50">
               Buka Analisa
            </Button>
         </Card>
      </div>
    </main>
  );
}
