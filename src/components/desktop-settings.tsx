
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  MapPinned, 
  Building2, 
  CreditCard, 
  Shield, 
  Bell, 
  Sun, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  Lock,
  Mail,
  Phone,
  Camera,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DesktopSettingsProps {
  user: any;
  displayName: string;
  setDisplayName: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  handleUpdateProfile: () => void;
  handleLogout: () => void;
  updating: boolean;
}

export function DesktopSettings({
  user,
  displayName,
  setDisplayName,
  isEditing,
  setIsEditing,
  handleUpdateProfile,
  handleLogout,
  updating
}: DesktopSettingsProps) {
  const settingsMenu = [
    { title: "Manajemen Alamat", desc: "Atur alamat pengiriman prioritas Anda", icon: MapPinned },
    { title: "Rekening & Saldo", desc: "Kelola penarikan dana ke rekening bank", icon: Building2 },
    { title: "Metode Pembayaran", desc: "Kartu kredit, debit, dan e-wallet aktif", icon: CreditCard },
    { title: "Keamanan & Privasi", desc: "Autentikasi dua faktor dan enkripsi data", icon: Shield },
    { title: "Preferensi Notifikasi", desc: "Personalisasi pemberitahuan transaksi", icon: Bell },
    { title: "Pengaturan Tampilan", desc: "Kustomisasi tema dan aksesibilitas visual", icon: Sun },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-body text-[#212121]">
      <div className="max-w-screen-xl mx-auto p-10 space-y-10">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="rounded-2xl h-12 w-12 p-0 hover:bg-white shadow-sm border border-border/20 transition-all">
              <Link href="/profile">
                <ChevronLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black font-headline tracking-tighter">Pengaturan Akun</h1>
              <p className="text-xs text-[#6C727C] font-bold uppercase tracking-[0.2em]">Personalisasi & Keamanan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-border/40 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#00AA5B]" />
            <span className="text-[11px] font-black tracking-widest uppercase">Verified Account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Configuration Card */}
          <Card className="lg:col-span-8 border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black font-headline tracking-tight flex items-center gap-3">
                <User className="w-5 h-5 text-[#00AA5B]" /> Data Identitas
              </CardTitle>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl h-10 px-6 font-black text-xs border-border/60 hover:bg-[#F4F7F9] transition-all">
                  UBAH DATA
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              <div className="flex flex-col md:flex-row items-start gap-12">
                <div className="relative group">
                  <Avatar className="h-40 w-40 border-[8px] border-[#F4F7F9] shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-5xl font-black uppercase">
                      {displayName.substring(0, 1) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-2 right-2 bg-white h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl border border-border hover:bg-[#F4F7F9] transition-all">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 w-full space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-[#6C727C] uppercase tracking-[0.3em] ml-1">Nama Lengkap Anda</label>
                      <div className="relative group">
                        <Input 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={!isEditing}
                          className={cn(
                            "h-14 rounded-2xl font-black text-base px-6 transition-all duration-300",
                            isEditing 
                              ? "border-[#00AA5B] ring-4 ring-[#00AA5B]/5 bg-white" 
                              : "border-transparent bg-[#F4F7F9] text-[#212121]/70"
                          )}
                        />
                        {isEditing && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                            <Button onClick={handleUpdateProfile} disabled={updating} className="h-9 px-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-xs rounded-xl shadow-lg shadow-[#00AA5B]/20">SIMPAN</Button>
                            <Button onClick={() => setIsEditing(false)} variant="ghost" className="h-9 px-4 font-black text-xs rounded-xl">BATAL</Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-[#6C727C] uppercase tracking-[0.3em] ml-1">E-mail Terdaftar</label>
                        <div className="relative group">
                          <Input 
                            value={user.email} 
                            readOnly 
                            className="h-14 rounded-2xl border-transparent bg-[#F4F7F9] font-bold text-sm px-6 text-[#212121]/50 cursor-not-allowed"
                          />
                          <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C727C] opacity-30" />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-[#6C727C] uppercase tracking-[0.3em] ml-1">Nomor Seluler</label>
                        <div className="relative group">
                          <Input 
                            value="6288976577650" 
                            readOnly 
                            className="h-14 rounded-2xl border-transparent bg-[#F4F7F9] font-bold text-sm px-6 text-[#212121]/50 cursor-not-allowed"
                          />
                          <Phone className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C727C] opacity-30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Services List */}
              <div className="pt-10 border-t border-border/40 space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6C727C] ml-1">Konfigurasi Layanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingsMenu.map((menu, idx) => (
                    <button 
                      key={idx}
                      className="group p-6 rounded-[24px] border border-border/40 hover:border-[#00AA5B]/30 hover:bg-[#00AA5B]/5 transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#F4F7F9] flex items-center justify-center group-hover:bg-[#00AA5B] group-hover:text-white transition-all duration-300">
                          <menu.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">{menu.title}</p>
                          <p className="text-[10px] text-[#6C727C] font-medium group-hover:text-[#212121] transition-colors">{menu.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6C727C] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Auxiliary Card */}
          <aside className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6C727C]">Legal & Support</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {[
                  { title: "Mengenai MarketPoint", icon: Info },
                  { title: "Syarat & Ketentuan Layanan", icon: FileText },
                  { title: "Kebijakan Privasi Global", icon: Lock },
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-[#F4F7F9] transition-all group">
                    <div className="flex items-center gap-4">
                      <item.icon className="w-4.5 h-4.5 text-[#6C727C] group-hover:text-[#212121] transition-colors" />
                      <span className="text-xs font-black tracking-tight">{item.title}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#6C727C] opacity-20 group-hover:opacity-50" />
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-[#00AA5B]/5 border border-[#00AA5B]/10">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 bg-[#00AA5B] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00AA5B]/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black tracking-tight">Butuh Bantuan?</h4>
                  <p className="text-xs text-[#6C727C] font-medium leading-relaxed">Tim ahli kami siap membantu Anda 24/7 untuk masalah teknis atau akun.</p>
                </div>
                <Button className="w-full bg-[#212121] hover:bg-[#000] text-white rounded-xl h-11 font-black text-[10px] tracking-widest uppercase">
                   HUBUNGI CARE
                </Button>
              </CardContent>
            </Card>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full h-14 rounded-[28px] border-destructive/20 text-destructive hover:bg-destructive/5 font-black text-xs tracking-[0.2em] uppercase transition-all active:scale-95 flex items-center gap-3 shadow-sm"
            >
              <LogOut className="w-5 h-5" /> KELUAR AKUN
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
