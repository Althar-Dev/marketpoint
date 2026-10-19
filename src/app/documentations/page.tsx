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
import { cn } from "@/lib/utils";

export default function DocumentationsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 pt-20 md:pt-24 space-y-8 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#212121]">Dokumentasi Reseller</h2>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">Pelajari cara mengintegrasikan API MarketPointID ke dalam sistem Anda secara otomatis.</p>
        </div>
        <Button className="rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs h-10 px-6 gap-2 shadow-md shadow-[#00AA5B]/10 transition-all active:scale-95">
          <BookOpen className="w-4 h-4" /> Buka Wiki Lengkap
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Guides Content */}
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00AA5B]" /> Memulai Integrasi
            </h3>
            <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4">
              <p className="text-sm sm:text-base leading-relaxed">
                API MarketPointID dirancang untuk memudahkan para developer dan reseller melakukan pembelian produk digital secara otomatis melalui script atau aplikasi mereka. Kami menggunakan protokol RESTful dengan format respons JSON yang standar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                 <Card className="border-border border shadow-none rounded-2xl bg-white p-5 space-y-2 hover:border-[#00AA5B]/40 transition-colors">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
                      Dapatkan API Key
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Ambil kunci rahasia Anda pada menu API Key di dashboard buyer untuk melakukan otentikasi.</p>
                 </Card>
                 <Card className="border-border border shadow-none rounded-2xl bg-white p-5 space-y-2 hover:border-[#00AA5B]/40 transition-colors">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
                      Set Header Authorization
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Sertakan Bearer Token pada setiap permintaan API Anda agar server dapat mengenali identitas akun.</p>
                 </Card>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4">
             <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
               <Terminal className="w-5 h-5 text-[#00AA5B]" /> Endpoint Utama
             </h3>
             <div className="space-y-3">
               {[
                 { method: "GET", path: "/v1/balance", desc: "Cek saldo aktif dompet belanja Anda secara real-time.", auth: "Required" },
                 { method: "GET", path: "/v1/products", desc: "Ambil daftar katalog produk digital publik beserta harga reseller.", auth: "Optional" },
                 { method: "POST", path: "/v1/order", desc: "Buat pesanan baru secara otomatis menggunakan saldo akun.", auth: "Required" },
                 { method: "GET", path: "/v1/status/{invoice}", desc: "Cek status pesanan & ambil data lisensi produk.", auth: "Required" },
               ].map((endpoint, i) => (
                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-border group hover:border-[#00AA5B]/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                       <Badge className={cn(
                         "text-[9px] font-black px-2 py-0.5 border-none",
                         endpoint.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                       )}>
                         {endpoint.method}
                       </Badge>
                       <code className="text-xs font-bold text-slate-800 font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 sm:mt-0 font-medium">{endpoint.desc}</p>
                 </div>
               ))}
             </div>
          </section>
        </div>

        {/* Right: Resources */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="rounded-3xl border-border bg-white shadow-xs overflow-hidden">
             <CardHeader className="p-5 border-b border-border bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resources & Tools</CardTitle>
             </CardHeader>
             <CardContent className="p-2 space-y-0.5">
                {[
                  { label: "API References", icon: FileText },
                  { label: "Webhook Setup", icon: ShieldCheck },
                  { label: "Postman Collection", icon: Code2 },
                  { label: "PHP SDK (Official)", icon: ExternalLink },
                  { label: "Node.js Library", icon: ExternalLink },
                  { label: "Troubleshooting", icon: HelpCircle },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group text-left">
                    <div className="flex items-center gap-3">
                       <item.icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-[#00AA5B] transition-colors" />
                       <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#00AA5B] transition-all" />
                  </button>
                ))}
             </CardContent>
           </Card>

           <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 space-y-3">
                <h4 className="text-sm font-bold">Butuh bantuan teknis?</h4>
                <p className="text-[11px] text-blue-100 leading-relaxed font-medium">Tim engineering MarketPointID siap membantu proses integrasi sistem Anda kapan saja via tiket atau email.</p>
                <Button variant="secondary" className="w-full rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-bold h-9">
                  Hubungi Technical Support
                </Button>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
