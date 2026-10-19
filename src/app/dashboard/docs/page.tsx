"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  BookOpen, 
  Terminal, 
  Code2, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function DashboardDocsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Dokumentasi Reseller</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Pelajari cara mengintegrasikan API MarketPointID ke dalam sistem Anda.</p>
        </div>
        <Button className="rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs h-9 px-5 gap-2 shadow-md shadow-[#00AA5B]/10">
          <BookOpen className="w-4 h-4" /> Buka Wiki Lengkap
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Guides Content */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00AA5B]" /> Memulai Integrasi
            </h3>
            <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4">
              <p>
                API MarketPointID dirancang untuk memudahkan para developer dan reseller melakukan pembelian produk digital secara otomatis melalui script atau aplikasi mereka. Kami menggunakan protokol RESTful dengan format respons JSON.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                 <Card className="border-border border shadow-none rounded-2xl bg-white p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-800">1. Dapatkan API Key</p>
                    <p className="text-[11px] leading-relaxed">Ambil kunci rahasia Anda pada menu API Key di dashboard ini.</p>
                 </Card>
                 <Card className="border-border border shadow-none rounded-2xl bg-white p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-800">2. Set Header Authorization</p>
                    <p className="text-[11px] leading-relaxed">Sertakan Bearer Token pada setiap permintaan API Anda.</p>
                 </Card>
              </div>
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
               <Terminal className="w-4 h-4 text-[#00AA5B]" /> Endpoint Utama
             </h3>
             <div className="space-y-3">
               {[
                 { method: "GET", path: "/v1/balance", desc: "Cek saldo aktif dompet belanja.", auth: "Required" },
                 { method: "GET", path: "/v1/products", desc: "Ambil daftar produk digital publik.", auth: "Optional" },
                 { method: "POST", path: "/v1/order", desc: "Buat pesanan baru secara otomatis.", auth: "Required" },
                 { method: "GET", path: "/v1/status/{invoice}", desc: "Cek status pesanan & ambil lisensi.", auth: "Required" },
               ].map((endpoint, i) => (
                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-border group hover:border-[#00AA5B]/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                       <Badge className={cn(
                         "text-[9px] font-black px-2 py-0.5 border-none",
                         endpoint.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                       )}>
                         {endpoint.method}
                       </Badge>
                       <code className="text-xs font-bold text-slate-800">{endpoint.path}</code>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 sm:mt-0">{endpoint.desc}</p>
                 </div>
               ))}
             </div>
          </section>
        </div>

        {/* Right: Resources */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="rounded-3xl border-border bg-white shadow-xs overflow-hidden">
             <CardHeader className="p-5 border-b border-border bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resources</CardTitle>
             </CardHeader>
             <CardContent className="p-2 space-y-1">
                {[
                  { label: "API References", icon: FileText },
                  { label: "Webhook Setup", icon: ShieldCheck },
                  { label: "Postman Collection", icon: Code2 },
                  { label: "PHP SDK", icon: ExternalLink },
                  { label: "Node.js Library", icon: ExternalLink },
                  { label: "Troubleshooting", icon: HelpCircle },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group text-left">
                    <div className="flex items-center gap-3">
                       <item.icon className="w-4 h-4 text-slate-400 group-hover:text-[#00AA5B] transition-colors" />
                       <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00AA5B] transition-all" />
                  </button>
                ))}
             </CardContent>
           </Card>

           <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 space-y-4">
              <h4 className="text-sm font-bold">Butuh bantuan teknis?</h4>
              <p className="text-[11px] text-blue-100 leading-relaxed">Tim engineering kami siap membantu proses integrasi sistem Anda kapan saja.</p>
              <Button variant="secondary" className="w-full rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-bold h-9">Hubungi Support</Button>
           </div>
        </div>
      </div>
    </main>
  );
}
