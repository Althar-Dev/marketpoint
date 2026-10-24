"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
   Zap,
   Wrench,
   CheckCircle2,
   Clock,
   Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
   const { toast } = useToast();
   const db = useFirestore();
   const [mounted, setMounted] = useState(false);

   // Firestore Maintenance Binding
   const maintenanceDocRef = useMemoFirebase(() => doc(db, "settings", "maintenance"), [db]);
   const { data: maintenanceData, loading: maintenanceLoading } = useDoc(maintenanceDocRef);

   const [isMaintenanceEnabled, setIsMaintenanceEnabled] = useState(false);
   const [maintenanceMode, setMaintenanceMode] = useState<"global" | "topup">("global");
   const [maintenanceTitle, setMaintenanceTitle] = useState("");
   const [maintenanceMessage, setMaintenanceMessage] = useState("");
   const [estimatedEndTime, setEstimatedEndTime] = useState("");
   const [savingMaintenance, setSavingMaintenance] = useState(false);

   // Firestore Auth Methods Binding
   const authMethodsDocRef = useMemoFirebase(() => doc(db, "settings", "auth_methods"), [db]);
   const { data: authMethodsData, loading: authMethodsLoading } = useDoc(authMethodsDocRef);

   const [isGoogleLoginEnabled, setIsGoogleLoginEnabled] = useState(true);
   const [isFacebookLoginEnabled, setIsFacebookLoginEnabled] = useState(true);
   const [savingAuthMethods, setSavingAuthMethods] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   useEffect(() => {
      if (maintenanceData) {
         setIsMaintenanceEnabled(maintenanceData.isEnabled ?? false);
         setMaintenanceMode(maintenanceData.mode ?? "global");
         setMaintenanceTitle(maintenanceData.title ?? "");
         setMaintenanceMessage(maintenanceData.message ?? "");
         setEstimatedEndTime(maintenanceData.estimatedEndTime ?? "");
      }
   }, [maintenanceData]);

   useEffect(() => {
      if (authMethodsData) {
         setIsGoogleLoginEnabled(authMethodsData.googleLoginEnabled ?? true);
         setIsFacebookLoginEnabled(authMethodsData.facebookLoginEnabled ?? true);
      }
   }, [authMethodsData]);

   const handleSaveAuthMethods = async () => {
      setSavingAuthMethods(true);
      try {
         await setDoc(
            authMethodsDocRef,
            {
               googleLoginEnabled: isGoogleLoginEnabled,
               facebookLoginEnabled: isFacebookLoginEnabled,
               updatedAt: serverTimestamp(),
            },
            { merge: true }
         );
         toast({
            title: "Pengaturan Autentikasi Disimpan",
            description: `Metode login: Google (${isGoogleLoginEnabled ? "Aktif" : "Nonaktif"}), Facebook (${isFacebookLoginEnabled ? "Aktif" : "Nonaktif"}).`,
         });
      } catch (err: any) {
         toast({
            variant: "destructive",
            title: "Gagal Menyimpan",
            description: err.message || "Gagal memperbarui pengaturan autentikasi.",
         });
      } finally {
         setSavingAuthMethods(false);
      }
   };

   const handleSaveMaintenance = async () => {
      setSavingMaintenance(true);
      try {
         await setDoc(
            maintenanceDocRef,
            {
               isEnabled: isMaintenanceEnabled,
               mode: maintenanceMode,
               title: maintenanceTitle.trim() || (maintenanceMode === "global" ? "Sistem Sedang Dalam Pemeliharaan" : "Layanan Topup Sedang Pemeliharaan"),
               message: maintenanceMessage.trim() || (maintenanceMode === "global"
                  ? "Kami sedang melakukan pemeliharaan rutin dan peningkatan performa server. Silakan coba beberapa saat lagi."
                  : "Layanan isi pulsa, kuota, e-wallet, dan voucher game sedang dalam pemeliharaan teknis berkala. Transaksi pasar produk toko tetap normal."),
               estimatedEndTime: estimatedEndTime.trim(),
               updatedAt: serverTimestamp(),
            },
            { merge: true }
         );
         toast({
            title: "Berhasil Disimpan!",
            description: isMaintenanceEnabled
               ? `Mode Maintenance (${maintenanceMode === "global" ? "Global Platform" : "Hanya Topup"}) telah diaktifkan!`
               : "Mode Maintenance telah dinonaktifkan. Sistem beroperasi normal.",
         });
      } catch (err: any) {
         toast({
            variant: "destructive",
            title: "Gagal Menyimpan",
            description: err.message || "Gagal memperbarui pengaturan pemeliharaan.",
         });
      } finally {
         setSavingMaintenance(false);
      }
   };



   if (!mounted) return null;

   return (
      <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
         {/* Header Section */}
         <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 hidden md:block">
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
                              <Input defaultValue="MarketPointID" className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-medium focus:ring-green-500/10" />
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

                  {/* Card: Mode Pemeliharaan (Maintenance) */}
                  <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                     <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                        <CardTitle className="text-[11px] md:text-[12px] font-bold flex items-center gap-2 text-[#212121]">
                           <Wrench className="w-3.5 h-3.5 text-amber-600" />
                           Mode Pemeliharaan (Maintenance)
                        </CardTitle>
                        <Badge
                           variant="outline"
                           className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5",
                              !isMaintenanceEnabled && "border-green-200 bg-green-50 text-[#00AA5B]",
                              isMaintenanceEnabled && maintenanceMode === "global" && "border-rose-200 bg-rose-50 text-rose-700 animate-pulse",
                              isMaintenanceEnabled && maintenanceMode === "topup" && "border-amber-200 bg-amber-50 text-amber-800"
                           )}
                        >
                           {!isMaintenanceEnabled && "🟢 Normal / Nonaktif"}
                           {isMaintenanceEnabled && maintenanceMode === "global" && "🔴 Global Maintenance Aktif"}
                           {isMaintenanceEnabled && maintenanceMode === "topup" && "🟡 Hanya Topup Maintenance"}
                        </Badge>
                     </CardHeader>
                     <CardContent className="p-4 md:p-5 space-y-5">
                        {/* Master Switch */}
                        <div className="flex items-center justify-between group p-3 rounded-xl bg-slate-50/60 border border-border/40">
                           <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-[#212121]">Aktifkan Pemeliharaan</p>
                              <p className="text-[9px] text-muted-foreground font-medium">
                                 Aktifkan untuk membatasi akses pengguna umum saat sistem sedang diperbaiki.
                              </p>
                           </div>
                           <Switch
                              checked={isMaintenanceEnabled}
                              onCheckedChange={setIsMaintenanceEnabled}
                              className="data-[state=checked]:bg-[#00AA5B]"
                           />
                        </div>

                        {/* Lingkup Pemeliharaan (2 Opsi: Global atau Hanya Topup) */}
                        <div className="space-y-2">
                           <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                              Pilih Lingkup Pemeliharaan
                           </Label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Option 1: Global */}
                              <div
                                 onClick={() => setMaintenanceMode("global")}
                                 className={cn(
                                    "p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 relative",
                                    maintenanceMode === "global"
                                       ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400 shadow-xs"
                                       : "border-border/50 bg-white hover:border-slate-300"
                                 )}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <div className={cn("p-1.5 rounded-lg", maintenanceMode === "global" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>
                                          <Globe className="w-3.5 h-3.5" />
                                       </div>
                                       <p className="text-[11px] font-bold text-[#212121]">Global Platform</p>
                                    </div>
                                    <span className={cn("w-3.5 h-3.5 rounded-full border flex items-center justify-center", maintenanceMode === "global" ? "border-rose-600 bg-rose-600" : "border-slate-300")}>
                                       {maintenanceMode === "global" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                 </div>
                                 <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                                    Menutup <b>seluruh website</b> untuk pengunjung umum. Pengunjung akan melihat layar pemeliharaan sistem. Hanya Administrator yang dapat login & mengakses situs.
                                 </p>
                              </div>

                              {/* Option 2: Hanya Topup */}
                              <div
                                 onClick={() => setMaintenanceMode("topup")}
                                 className={cn(
                                    "p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 relative",
                                    maintenanceMode === "topup"
                                       ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400 shadow-xs"
                                       : "border-border/50 bg-white hover:border-slate-300"
                                 )}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <div className={cn("p-1.5 rounded-lg", maintenanceMode === "topup" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600")}>
                                          <Zap className="w-3.5 h-3.5" />
                                       </div>
                                       <p className="text-[11px] font-bold text-[#212121]">Hanya Topup</p>
                                    </div>
                                    <span className={cn("w-3.5 h-3.5 rounded-full border flex items-center justify-center", maintenanceMode === "topup" ? "border-amber-600 bg-amber-600" : "border-slate-300")}>
                                       {maintenanceMode === "topup" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                 </div>
                                 <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                                    Hanya menutup halaman & transaksi <b>Topup & Produk Digital</b>. Seluruh transaksi pasar, toko, dan keranjang belanja fisik tetap berjalan normal.
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Detail Informasi Pesan */}
                        <div className="space-y-3 pt-1 border-t border-border/30">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                                 Judul Pemberitahuan (Opsional)
                              </Label>
                              <Input
                                 value={maintenanceTitle}
                                 onChange={(e) => setMaintenanceTitle(e.target.value)}
                                 placeholder={maintenanceMode === "global" ? "Sistem Sedang Dalam Pemeliharaan" : "Layanan Topup Sedang Pemeliharaan"}
                                 className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px]"
                              />
                           </div>

                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                                 Pesan / Alasan Pemeliharaan
                              </Label>
                              <Textarea
                                 value={maintenanceMessage}
                                 onChange={(e) => setMaintenanceMessage(e.target.value)}
                                 placeholder="Tuliskan pesan penjelasan yang akan tampil kepada pengunjung..."
                                 rows={3}
                                 className="rounded-lg bg-slate-50/50 border-border/50 text-[11px] leading-relaxed resize-none"
                              />
                           </div>

                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider ml-0.5 flex items-center gap-1">
                                 <Clock className="w-3 h-3 text-muted-foreground" />
                                 Estimasi Waktu Selesai (Opsional)
                              </Label>
                              <Input
                                 value={estimatedEndTime}
                                 onChange={(e) => setEstimatedEndTime(e.target.value)}
                                 placeholder="Contoh: 15:00 WIB atau 30 Menit Lagi"
                                 className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px]"
                              />
                           </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2 flex justify-end">
                           <Button
                              onClick={handleSaveMaintenance}
                              disabled={savingMaintenance || maintenanceLoading}
                              className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm"
                           >
                              {savingMaintenance ? (
                                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                 <Save className="w-3.5 h-3.5" />
                              )}
                              Simpan Pengaturan Maintenance
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                  {/* Card: Registrasi Pengguna Baru */}
                  <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                     <CardContent className="p-4 md:p-5">
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
                  {/* Card: Metode Login Sosial (Google & Facebook) */}
                  <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
                     <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                        <CardTitle className="text-[11px] md:text-[12px] font-bold flex items-center gap-2 text-[#212121]">
                           <ShieldCheck className="w-4 h-4 text-[#00AA5B]" />
                           Metode Login Sosial (OAuth)
                        </CardTitle>
                        <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-[#00AA5B]/30 bg-green-50 text-[#00AA5B]">
                           Realtime Sync
                        </Badge>
                     </CardHeader>
                     <CardContent className="p-4 md:p-5 space-y-4">
                        {/* Switch: Google Login */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-border/40 hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center border border-border/60 shadow-xs shrink-0">
                                 <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                 </svg>
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold text-[#2E3137]">Login dengan Google</p>
                                    <Badge className={cn("text-[8px] font-bold px-1.5 py-0", isGoogleLoginEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200")}>
                                       {isGoogleLoginEnabled ? "Aktif" : "Nonaktif"}
                                    </Badge>
                                 </div>
                                 <p className="text-[9px] text-muted-foreground mt-0.5">Tampilkan tombol Masuk & Daftar cepat dengan akun Google di halaman auth.</p>
                              </div>
                           </div>
                           <Switch
                              checked={isGoogleLoginEnabled}
                              onCheckedChange={setIsGoogleLoginEnabled}
                           />
                        </div>

                        {/* Switch: Facebook Login */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-border/40 hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-xs shrink-0">
                                 <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                       fill="#1877F2"
                                       d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                    />
                                 </svg>
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold text-[#2E3137]">Login dengan Facebook</p>
                                    <Badge className={cn("text-[8px] font-bold px-1.5 py-0", isFacebookLoginEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200")}>
                                       {isFacebookLoginEnabled ? "Aktif" : "Nonaktif"}
                                    </Badge>
                                 </div>
                                 <p className="text-[9px] text-muted-foreground mt-0.5">Tampilkan tombol Masuk & Daftar cepat dengan akun Facebook di halaman auth.</p>
                              </div>
                           </div>
                           <Switch
                              checked={isFacebookLoginEnabled}
                              onCheckedChange={setIsFacebookLoginEnabled}
                           />
                        </div>

                        {/* Save Button for Auth Methods */}
                        <div className="pt-2 flex justify-end">
                           <Button
                              onClick={handleSaveAuthMethods}
                              disabled={savingAuthMethods || authMethodsLoading}
                              className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm transition-transform active:scale-95"
                           >
                              {savingAuthMethods ? (
                                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                 <Save className="w-3.5 h-3.5" />
                              )}
                              Simpan Metode Login
                           </Button>
                        </div>
                     </CardContent>
                  </Card>

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