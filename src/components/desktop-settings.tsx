
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
    { title: "Manajemen Alamat", desc: "Atur alamat pengiriman prioritas", icon: MapPinned },
    { title: "Rekening & Saldo", desc: "Kelola penarikan dana bank", icon: Building2 },
    { title: "Metode Pembayaran", desc: "Kartu kredit & e-wallet aktif", icon: CreditCard },
    { title: "Keamanan & Privasi", desc: "Autentikasi & enkripsi data", icon: Shield },
    { title: "Preferensi Notifikasi", desc: "Personalisasi pemberitahuan", icon: Bell },
    { title: "Pengaturan Tampilan", desc: "Kustomisasi tema & visual", icon: Sun },
  ];

  return (
    <div className="bg-[#F8FAFC] font-body text-[#1E293B]">
      <div className="max-w-screen-xl mx-auto p-8 space-y-6">
        {/* Nav Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-white border border-border/30">
              <Link href="/profile">
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Pengaturan Akun</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Informasi Personal & Keamanan</p>
            </div>
          </div>
          <div className="bg-white border border-[#00AA5B]/20 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" />
            <span className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wider">Akun Terverifikasi</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Card */}
          <Card className="lg:col-span-8 border border-border/50 shadow-sm bg-white rounded-xl">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#00AA5B]" />
                <h3 className="text-[13px] font-bold">Data Identitas</h3>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="h-8 px-4 text-[11px] font-bold rounded-lg border-border/60">
                  UBAH DATA
                </Button>
              )}
            </div>
            
            <CardContent className="p-8 space-y-10">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="relative group shrink-0">
                  <Avatar className="h-32 w-32 ring-4 ring-[#F8FAFC] transition-transform group-hover:scale-[1.02]">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-4xl font-bold uppercase">
                      {displayName.substring(0, 1) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-1 right-1 bg-white h-9 w-9 rounded-lg flex items-center justify-center shadow-lg border border-border hover:bg-[#F8FAFC]">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nama Lengkap</label>
                    <div className="relative">
                      <Input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
                        className={cn(
                          "h-10 text-[13px] font-bold px-4 rounded-lg transition-all",
                          isEditing 
                            ? "border-[#00AA5B] ring-2 ring-[#00AA5B]/5 bg-white" 
                            : "border-transparent bg-[#F8FAFC] text-foreground/70"
                        )}
                      />
                      {isEditing && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button onClick={handleUpdateProfile} disabled={updating} size="sm" className="h-7 px-3 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-[10px] font-bold rounded-md">SIMPAN</Button>
                          <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold rounded-md">BATAL</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                      <div className="relative">
                        <Input 
                          value={user.email} 
                          readOnly 
                          className="h-10 text-[12px] px-4 rounded-lg border-transparent bg-[#F8FAFC] text-foreground/40 font-semibold cursor-not-allowed"
                        />
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Telepon</label>
                      <div className="relative">
                        <Input 
                          value="6288976577650" 
                          readOnly 
                          className="h-10 text-[12px] px-4 rounded-lg border-transparent bg-[#F8FAFC] text-foreground/40 font-semibold cursor-not-allowed"
                        />
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50 space-y-4">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Konfigurasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settingsMenu.map((menu, idx) => (
                    <button 
                      key={idx}
                      className="group p-4 rounded-xl border border-border/50 hover:border-[#00AA5B]/30 hover:bg-[#F8FAFC] transition-all flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] flex items-center justify-center group-hover:bg-[#00AA5B] group-hover:text-white transition-all">
                          <menu.icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold">{menu.title}</p>
                          <p className="text-[10px] text-muted-foreground group-hover:text-foreground/70">{menu.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="lg:col-span-4 space-y-6">
            <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bantuan & Legal</h4>
              </div>
              <div className="p-1.5 space-y-1">
                {[
                  { title: "Mengenai Kami", icon: Info },
                  { title: "Syarat & Ketentuan", icon: FileText },
                  { title: "Kebijakan Privasi", icon: Lock },
                ].map((item, idx) => (
                  <button key={idx} className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[#F8FAFC] transition-all group">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      <span className="text-[12px] font-bold">{item.title}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-20 group-hover:opacity-50" />
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border-none shadow-sm bg-[#00AA5B]/5 border border-[#00AA5B]/10 rounded-xl">
              <CardContent className="p-6 space-y-4">
                <div className="w-10 h-10 bg-[#00AA5B] rounded-lg flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold">MarketPoint Care</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">Butuh bantuan teknis? Tim kami siap melayani Anda 24/7.</p>
                </div>
                <Button className="w-full bg-[#1E293B] hover:bg-black text-white rounded-lg h-9 text-[10px] font-bold tracking-wider uppercase">
                   HUBUNGI KAMI
                </Button>
              </CardContent>
            </Card>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full h-10 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <LogOut className="w-4 h-4" /> KELUAR AKUN
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
