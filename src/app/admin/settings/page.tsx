"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Lock, 
  Bell, 
  Globe, 
  Database,
  Mail,
  Smartphone,
  Save,
  AlertTriangle,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Pengaturan Platform</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Konfigurasi parameter operasional dan kebijakan keamanan.</p>
        </div>
        <Button className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-2 shadow-sm transition-transform active:scale-95">
           <Save className="w-3.5 h-3.5" /> Simpan
        </Button>
      </div>

      <div className="max-w-screen-lg">
        <Tabs defaultValue="umum" className="w-full space-y-5">
           {/* Refined Tabs List */}
           <div className="w-full overflow-x-auto no-scrollbar pb-1">
             <TabsList className="bg-slate-100/50 p-1 h-10 rounded-xl w-fit flex gap-1 border border-border/20 shadow-none">
                <TabsTrigger 
                  value="umum" 
                  className="rounded-lg text-[10px] font-bold px-5 h-full data-[state=active]:bg-green-50 data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-none border-none transition-all duration-200"
                >
                  Umum
                </TabsTrigger>
                <TabsTrigger 
                  value="keamanan" 
                  className="rounded-lg text-[10px] font-bold px-5 h-full data-[state=active]:bg-green-50 data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-none border-none transition-all duration-200"
                >
                  Keamanan
                </TabsTrigger>
                <TabsTrigger 
                  value="notifikasi" 
                  className="rounded-lg text-[10px] font-bold px-5 h-full data-[state=active]:bg-green-50 data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-none border-none transition-all duration-200"
                >
                  Notifikasi
                </TabsTrigger>
                <TabsTrigger 
                  value="sistem" 
                  className="rounded-lg text-[10px] font-bold px-5 h-full data-[state=active]:bg-green-50 data-[state=active]:text-[#00AA5B] data-[state=active]:shadow-none border-none transition-all duration-200"
                >
                  Infrastruktur
                </TabsTrigger>
             </TabsList>
           </div>

           {/* Tab: Umum */}
           <TabsContent value="umum" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                 <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                    <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2">
                       <Globe className="w-3.5 h-3.5 text-[#00AA5B] opacity-70" />
                       Identitas & Branding
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 md:p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Nama Platform</Label>
                          <Input defaultValue="MarketPoint" className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-medium focus:ring-green-500/10" />
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Support Email</Label>
                          <Input defaultValue="support@marketpoint.id" className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-medium focus:ring-green-500/10" />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Meta Deskripsi (SEO)</Label>
                       <Input defaultValue="Pasar Infrastruktur Digital & API Terpercaya" className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-medium focus:ring-green-500/10" />
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                 <CardContent className="p-4 md:p-5 space-y-5">
                    <div className="flex items-center justify-between group">
                       <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-[#2E3137]">Mode Pemeliharaan</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Tampilkan halaman maintenance untuk seluruh pengguna umum.</p>
                       </div>
                       <Switch />
                    </div>
                    <div className="h-px bg-border/30 w-full" />
                    <div className="flex items-center justify-between group">
                       <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-[#2E3137]">Registrasi Pengguna Baru</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Izinkan pengunjung baru untuk membuat akun di platform.</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                 </CardContent>
              </Card>
           </TabsContent>

           {/* Tab: Keamanan */}
           <TabsContent value="keamanan" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                 <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                    <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2">
                       <Lock className="w-3.5 h-3.5 text-[#00AA5B] opacity-70" />
                       Otentikasi & Keamanan Akses
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 md:p-5 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-[#2E3137]">Wajib Verifikasi Email</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Pengguna harus memverifikasi email sebelum melakukan transaksi.</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                    <div className="h-px bg-border/30 w-full" />
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-[#2E3137]">Two-Factor Authentication (2FA)</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Aktifkan lapisan keamanan tambahan untuk seluruh akun administrator.</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                    <div className="pt-2">
                       <Button variant="outline" className="h-8 px-4 rounded-lg border-red-100 text-red-600 text-[10px] font-bold hover:bg-red-50 hover:text-red-700 transition-colors">
                          Reset Seluruh Sesi Login
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </TabsContent>

           {/* Tab: Notifikasi */}
           <TabsContent value="notifikasi" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                 <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                    <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2">
                       <Bell className="w-3.5 h-3.5 text-[#00AA5B] opacity-70" />
                       Saluran Pengiriman Pesan
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 md:p-5 space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100/50">
                             <Mail className="w-4 h-4 text-[#00AA5B] opacity-60" />
                          </div>
                          <div>
                             <p className="text-[11px] font-medium text-[#2E3137]">Layanan Email (SendGrid)</p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1 w-1 rounded-full bg-[#00AA5B]"></div>
                                <p className="text-[9px] text-muted-foreground font-medium">Status: <span className="text-[#00AA5B] font-bold">Terhubung</span></p>
                             </div>
                          </div>
                       </div>
                       <Button variant="ghost" className="h-7 px-3 text-[10px] font-bold text-[#00AA5B] hover:bg-green-50">Konfigurasi</Button>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center border border-border/50">
                             <Smartphone className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                             <p className="text-[11px] font-medium text-[#2E3137]">WhatsApp Gateway (Official)</p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                <p className="text-[9px] text-muted-foreground font-medium">Status: <span className="text-slate-500 font-bold">Terputus</span></p>
                             </div>
                          </div>
                       </div>
                       <Button variant="ghost" className="h-7 px-3 text-[10px] font-bold text-[#00AA5B] hover:bg-green-50">Hubungkan</Button>
                    </div>
                 </CardContent>
              </Card>
           </TabsContent>

           {/* Tab: Sistem */}
           <TabsContent value="sistem" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="grid grid-cols-2 gap-4">
                 <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-4 md:p-6 space-y-4 text-center">
                       <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100/50">
                          <RefreshCw className="w-4.5 h-4.5 text-[#00AA5B] opacity-60" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[#2E3137]">Cache Sistem</p>
                          <p className="text-[9px] text-muted-foreground max-w-[160px] mx-auto leading-relaxed font-medium">Bersihkan data sementara untuk penyegaran platform.</p>
                       </div>
                       <Button variant="outline" className="w-full h-8 rounded-lg border-border/50 text-[10px] font-bold hover:bg-slate-50 transition-all">Eksekusi</Button>
                    </CardContent>
                 </Card>

                 <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                    <CardContent className="p-4 md:p-6 space-y-4 text-center">
                       <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100/50">
                          <Database className="w-4.5 h-4.5 text-[#00AA5B] opacity-60" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[#2E3137]">Database Backup</p>
                          <p className="text-[9px] text-muted-foreground max-w-[160px] mx-auto leading-relaxed font-medium">Amankan seluruh data transaksi secara manual hari ini.</p>
                       </div>
                       <Button variant="outline" className="w-full h-8 rounded-lg border-border/50 text-[10px] font-bold hover:bg-slate-50 transition-all">Backup</Button>
                    </CardContent>
                 </Card>
              </div>

              <Card className="border-border/40 border-dashed bg-orange-50/10 rounded-xl md:rounded-2xl p-5 flex items-start gap-4">
                 <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100/50 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-orange-600 opacity-70" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-[11px] font-bold text-[#2E3137]">Peringatan Infrastruktur</h3>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                       Pengaturan di tab ini berdampak langsung pada stabilitas server. Perubahan yang salah dapat mengakibatkan layanan terhenti secara global. Pastikan untuk selalu melakukan verifikasi ganda.
                    </p>
                 </div>
              </Card>
           </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}