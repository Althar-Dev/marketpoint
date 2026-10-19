"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Copy, 
  Check, 
  RotateCw, 
  ShieldCheck, 
  AlertTriangle,
  Code2,
  Terminal,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function DashboardApiKeyPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("mp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Real keys would be fetched from database here
    if (user) {
      const pseudoKey = `mp_live_${user.uid.slice(0, 10)}${Math.random().toString(36).substring(2, 20)}`;
      setApiKey(pseudoKey);
    }
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast({ title: "API Key Disalin", description: "Simpan kunci ini dengan aman di server Anda." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = () => {
    if (confirm("Apakah Anda yakin ingin melakukan rotasi API Key? Kunci lama tidak akan dapat digunakan lagi.")) {
      const newKey = `mp_live_${user?.uid.slice(0, 10)}${Math.random().toString(36).substring(2, 20)}`;
      setApiKey(newKey);
      toast({ title: "API Key Diperbarui", description: "Harap perbarui konfigurasi pada aplikasi Anda." });
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Akses API & Integrasi</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Kelola kunci rahasia untuk integrasi reseller MarketPointID.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border border shadow-sm rounded-3xl bg-white overflow-hidden">
             <CardHeader className="p-6 border-b border-border bg-slate-50/50">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Key className="w-4 h-4 text-[#00AA5B]" /> Production Secret Key
               </CardTitle>
               <CardDescription className="text-xs">Gunakan kunci ini untuk otentikasi permintaan API dari server Anda.</CardDescription>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">SECRET KEY</label>
                 <div className="flex items-center gap-2">
                   <div className="relative flex-1">
                     <Input 
                        type={showKey ? "text" : "password"}
                        value={apiKey} 
                        readOnly 
                        className="h-11 rounded-xl bg-slate-50 border-border font-mono text-xs pr-10" 
                     />
                     <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                     >
                       {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                   <Button onClick={handleCopy} variant="outline" className="h-11 px-4 rounded-xl gap-2 text-xs font-bold border-border shadow-2xs">
                     {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                     {copied ? "Tersalin" : "Salin"}
                   </Button>
                 </div>
               </div>

               <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                 <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                 <div className="space-y-1">
                   <p className="text-xs font-bold text-amber-900">Keamanan Kunci Sangat Penting</p>
                   <p className="text-[11px] text-amber-800 leading-relaxed">
                     Jangan pernah membagikan Secret Key kepada siapa pun atau menampilkannya di sisi klien (frontend). Jika kunci bocor, segera lakukan rotasi.
                   </p>
                 </div>
               </div>

               <div className="pt-4 flex justify-end">
                 <Button onClick={handleRotate} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold gap-2 rounded-xl">
                   <RotateCw className="w-3.5 h-3.5" /> Rotasi Secret Key
                 </Button>
               </div>
             </CardContent>
          </Card>

          <Card className="border-border border shadow-sm rounded-3xl bg-white overflow-hidden">
             <CardHeader className="p-6 border-b border-border">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-[#00AA5B]" /> Quick Start Guide
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <div className="space-y-4">
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Berikut adalah contoh header otentikasi menggunakan <b>Bearer Token</b> untuk berinteraksi dengan API MarketPointID.
                 </p>
                 <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed shadow-inner">
                   <p className="text-emerald-400"># Example Request Header</p>
                   <p>Authorization: Bearer <span className="text-amber-400">{showKey ? apiKey : "mp_live_********************"}</span></p>
                   <p>Content-Type: application/json</p>
                   <p className="mt-2 text-emerald-400"># GET Account Balance</p>
                   <p>curl -X GET https://api.marketpoint.id/v1/balance \</p>
                   <p className="ml-4">-H "Authorization: Bearer {showKey ? apiKey : "..."}"</p>
                 </div>
                 <div className="flex justify-center">
                    <Link href="/dashboard/docs">
                      <Button variant="link" className="text-[#00AA5B] font-bold text-xs">Lihat Dokumentasi Lengkap <ArrowRight className="w-3 h-3 ml-1" /></Button>
                    </Link>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border border shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">API Status</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Endpoint API beroperasi normal dengan waktu respons rata-rata 120ms.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#00AA5B]">
               <span className="w-2 h-2 rounded-full bg-[#00AA5B] animate-pulse"></span>
               SISTEM ONLINE
            </div>
          </Card>

          <Card className="border-border border shadow-sm rounded-3xl bg-[#00AA5B]/5 border-dashed p-6 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Code2 className="w-5 h-5 text-[#00AA5B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">SDK Reseller</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Gunakan SDK resmi kami untuk integrasi yang lebih cepat pada proyek Node.js atau Python Anda.</p>
            </div>
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-border bg-white h-9">Download SDK</Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
