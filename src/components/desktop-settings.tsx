
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
  Phone
} from "lucide-react";
import Link from "next/link";

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
    { title: "Daftar Alamat", desc: "Atur alamat pengiriman belanjaan", icon: MapPinned },
    { title: "Rekening Bank", desc: "Tarik Saldo MarketPoint ke rekening tujuan", icon: Building2 },
    { title: "Pembayaran Instan", desc: "E-Wallet, kartu kredit, & debit instan terdaftar", icon: CreditCard },
    { title: "Keamanan Akun", desc: "Kata sandi, PIN, & verifikasi data diri", icon: Shield },
    { title: "Notifikasi", desc: "Atur segala jenis pesan notifikasi", icon: Bell },
    { title: "Mode Tampilan", desc: "Aktifkan tampilan buta warna di MarketPoint", icon: Sun },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-8 pb-12 px-4 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumbs / Back */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl h-9 hover:bg-white/50">
              <Link href="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" /> Kembali ke Profil
              </Link>
            </Button>
          </div>
          <h1 className="text-xl font-black font-headline tracking-tight">Akun Saya</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Personal Info Card */}
          <Card className="md:col-span-12 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-[#00AA5B]" /> Data Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32 border-4 border-[#F8F9FA] shadow-md ring-2 ring-[#00AA5B]/10">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-4xl font-bold uppercase">
                      {displayName.substring(0, 1) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 font-bold text-[10px] uppercase">
                    Ganti Foto
                  </Button>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nama Lengkap</label>
                      <div className="flex gap-2">
                        <Input 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={!isEditing}
                          className={`h-11 rounded-xl font-bold transition-all ${isEditing ? 'border-[#00AA5B] focus:ring-[#00AA5B]/5 bg-white' : 'border-transparent bg-muted/30'}`}
                        />
                        {!isEditing ? (
                          <Button onClick={() => setIsEditing(true)} variant="outline" className="h-11 rounded-xl px-4 font-bold text-xs border-border hover:bg-muted/50">Ubah</Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateProfile} disabled={updating} className="h-11 rounded-xl px-6 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs">Simpan</Button>
                            <Button onClick={() => setIsEditing(false)} variant="ghost" className="h-11 rounded-xl px-4 font-bold text-xs">Batal</Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nomor Handphone</label>
                      <div className="relative group">
                        <Input 
                          value="6288976577650" 
                          readOnly 
                          className="h-11 rounded-xl border-transparent bg-muted/30 font-bold pr-12"
                        />
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alamat Email</label>
                      <div className="relative">
                        <Input 
                          value={user.email} 
                          readOnly 
                          className="h-11 rounded-xl border-transparent bg-muted/30 font-bold pr-12"
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings List */}
          <Card className="md:col-span-8 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold">Layanan Akun</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {settingsMenu.map((menu, idx) => (
                  <button 
                    key={idx}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center group-hover:bg-[#00AA5B]/10 transition-colors">
                        <menu.icon className="w-5 h-5 text-[#2E3137] group-hover:text-[#00AA5B] transition-colors" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#2E3137] leading-tight">{menu.title}</p>
                        <p className="text-[10px] text-[#6C727C] mt-0.5">{menu.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support / Info */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Seputar MarketPoint</CardTitle>
               </CardHeader>
               <CardContent className="p-2 pt-0 space-y-1">
                 {[
                   { title: "Kenali MarketPoint", icon: Info },
                   { title: "Syarat & Ketentuan", icon: FileText },
                   { title: "Kebijakan Privasi", icon: Lock },
                 ].map((item, idx) => (
                   <button key={idx} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-all group">
                     <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                     <span className="text-xs font-bold text-[#2E3137]">{item.title}</span>
                   </button>
                 ))}
               </CardContent>
            </Card>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold flex items-center gap-3 shadow-sm"
            >
              <LogOut className="w-4.5 h-4.5" /> Keluar Akun
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
