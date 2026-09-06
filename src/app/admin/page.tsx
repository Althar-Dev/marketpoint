"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Activity,
  Globe,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    { 
      label: "Total Pengguna", 
      value: "12,480", 
      change: "+12.5%", 
      trend: "up", 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Merchant Aktif", 
      value: "842", 
      change: "+4.2%", 
      trend: "up", 
      icon: Store, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50" 
    },
    { 
      label: "Volume Transaksi", 
      value: "Rp 1.45M", 
      change: "-2.1%", 
      trend: "down", 
      icon: ShoppingBag, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "Dispute Aktif", 
      value: "14", 
      change: "-5", 
      trend: "up", // In disputes, 'up' might mean more cases, but let's just show trend
      icon: ShieldAlert, 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
  ];

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
           <h2 className="text-xl font-medium tracking-tight text-[#212121]">Dashboard Platform</h2>
           <p className="text-[11px] text-muted-foreground">Ringkasan performa dan kesehatan ekosistem MarketPoint hari ini.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {stats.map((stat, idx) => (
             <Card key={idx} className="border-border shadow-sm rounded-2xl bg-white overflow-hidden group">
               <CardContent className="p-5 flex flex-col justify-between h-full">
                 <div className="flex items-center justify-between mb-4">
                   <div className={cn("p-2 rounded-xl", stat.bg)}>
                     <stat.icon className={cn("w-4 h-4", stat.color)} />
                   </div>
                   <div className={cn(
                     "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium",
                     stat.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                   )}>
                     {stat.trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                     {stat.change}
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-bold text-[#212121] tracking-tighter mt-1">{stat.value}</p>
                 </div>
               </CardContent>
             </Card>
           ))}
        </div>

        {/* Middle Section: System Status & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* System Health (Left) */}
          <div className="lg:col-span-4">
             <Card className="h-full border-border shadow-sm rounded-2xl bg-white">
                <CardHeader className="p-5 border-b border-border/50">
                   <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      Status Infrastruktur
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                   {[
                     { name: "API Gateway Cluster", status: "Operational", uptime: "99.99%", color: "bg-green-500" },
                     { name: "Payment Processor", status: "Operational", uptime: "100%", color: "bg-green-500" },
                     { name: "Merchant DB", status: "Optimal", uptime: "99.95%", color: "bg-green-500" },
                     { name: "File Storage (R2)", status: "Optimal", uptime: "100%", color: "bg-green-500" },
                   ].map((sys, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="space-y-0.5">
                           <p className="text-[11px] font-medium text-[#2E3137]">{sys.name}</p>
                           <p className="text-[9px] text-muted-foreground">Uptime: {sys.uptime}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-medium text-muted-foreground">{sys.status}</span>
                           <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", sys.color)}></div>
                        </div>
                     </div>
                   ))}
                </CardContent>
             </Card>
          </div>

          {/* Quick Actions & Recent Users (Right) */}
          <div className="lg:col-span-8">
             <Card className="h-full border-border shadow-sm rounded-2xl bg-white">
                <CardHeader className="p-5 border-b border-border/50 flex flex-row items-center justify-between">
                   <CardTitle className="text-xs font-medium flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      Pendaftaran Merchant Terbaru
                   </CardTitle>
                   <button className="text-[10px] font-medium text-indigo-600 hover:underline">Lihat Semua</button>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-border/50">
                      {[
                        { name: "DevX Studio", slug: "devx-studio", date: "5 menit lalu", status: "PENDING_VERIF" },
                        { name: "Althar Soft", slug: "althar-soft", date: "1 jam lalu", status: "ACTIVE" },
                        { name: "Cyber Node ID", slug: "cybernode", date: "3 jam lalu", status: "ACTIVE" },
                        { name: "STS Labs Global", slug: "stslabs", date: "Kemarin", status: "ACTIVE" },
                      ].map((shop, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                 <Store className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-medium text-[#2E3137]">{shop.name}</p>
                                 <p className="text-[9px] text-muted-foreground">@{shop.slug}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-[9px] text-muted-foreground">{shop.date}</span>
                              <div className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-medium",
                                shop.status === 'ACTIVE' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                              )}>
                                 {shop.status === 'ACTIVE' ? 'AKTIF' : 'PENDING'}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Global Catalog Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="border-border border-dashed bg-muted/20 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-border">
                 <Database className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-[12px] font-medium">Monitoring Katalog Global</h3>
              <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                 Pantau semua aset digital yang diunggah oleh merchant untuk memastikan kepatuhan terhadap kebijakan platform.
              </p>
              <button className="text-[10px] font-medium text-indigo-600 px-4 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 transition-all">
                 Review Produk Baru
              </button>
           </Card>

           <Card className="border-border border-dashed bg-muted/20 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-border">
                 <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-[12px] font-medium">Resolusi Sengketa</h3>
              <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                 Terdapat <span className="text-orange-600 font-bold">14 kasus</span> yang membutuhkan intervensi admin untuk mempercepat proses pencairan dana.
              </p>
              <button className="text-[10px] font-medium text-indigo-600 px-4 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 transition-all">
                 Buka Pusat Resolusi
              </button>
           </Card>
        </div>

      </div>
    </main>
  );
}
