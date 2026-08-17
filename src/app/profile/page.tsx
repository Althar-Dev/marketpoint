"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  User as UserIcon, 
  Mail, 
  Wallet as WalletIcon, 
  Settings, 
  LogOut, 
  ShieldCheck,
  ChevronRight,
  BadgeCheck,
  CreditCard,
  Bell,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoize wallet reference
  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
      });
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda berhasil disimpan.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan sistem. Silakan coba lagi.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Sesi Berakhir",
        description: "Anda telah berhasil keluar dari akun.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Keluar",
        description: "Terjadi gangguan pada sistem autentikasi.",
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-[#00AA5B]/20 border-t-[#00AA5B] animate-spin" />
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Sinkronisasi Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-body selection:bg-[#00AA5B]/10 selection:text-[#00AA5B]">
      <MarketHeader />

      <main className="flex-1 w-full pt-20 pb-24 lg:pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Page Title & Breadcrumb (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <h1 className="text-2xl font-black font-headline tracking-tighter">Akun Saya</h1>
            <div className="h-4 w-px bg-border mx-2" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pengaturan & Profil</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR: User Card & Quick Nav */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#00AA5B] to-[#8B5CF6] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <Avatar className="h-28 w-28 border-[6px] border-white shadow-xl relative z-10">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[#00AA5B] to-[#008A4A] text-white text-3xl font-black uppercase">
                        {user.displayName?.substring(0, 2) || user.email?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg z-20">
                      <div className="bg-[#8B5CF6] text-white p-1 rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-1">
                    <h2 className="text-xl font-black font-headline tracking-tight text-foreground">{user.displayName || "Pengguna Baru"}</h2>
                    <div className="flex items-center justify-center gap-2">
                       <span className="px-2 py-0.5 rounded-full bg-muted text-[9px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                         Free Tier
                       </span>
                    </div>
                  </div>

                  <div className="w-full mt-8 p-6 rounded-2xl bg-muted/30 border border-border/50 grid grid-cols-2 gap-4">
                    <div className="text-center border-r border-border/50">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status Akun</p>
                      <p className="text-[10px] font-black text-[#00AA5B] uppercase">Aktif</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Member Sejak</p>
                      <p className="text-[10px] font-black text-foreground uppercase">2026</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Navigation Menu (Desktop) */}
              <div className="hidden lg:flex flex-col gap-2">
                <Button variant="ghost" className="justify-between rounded-2xl h-12 px-5 text-xs font-bold bg-white shadow-sm border border-border/50 hover:bg-[#00AA5B]/5 hover:text-[#00AA5B] hover:border-[#00AA5B]/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    <span>Keamanan Akun</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-20" />
                </Button>
                <Button variant="ghost" className="justify-between rounded-2xl h-12 px-5 text-xs font-bold bg-white shadow-sm border border-border/50 hover:bg-[#00AA5B]/5 hover:text-[#00AA5B] hover:border-[#00AA5B]/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    <span>Notifikasi</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-20" />
                </Button>
                <Button variant="ghost" className="justify-between rounded-2xl h-12 px-5 text-xs font-bold bg-white shadow-sm border border-border/50 hover:bg-[#00AA5B]/5 hover:text-[#00AA5B] hover:border-[#00AA5B]/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    <span>Metode Pembayaran</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-20" />
                </Button>
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full justify-start rounded-2xl h-12 px-5 text-xs font-bold gap-3 text-destructive hover:bg-destructive/5 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Keluar Akun
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT: Dashboard Info */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* WALLET CARD - PROFESSIONAL DESIGN */}
              <Card className="border-none shadow-[0_20px_50px_rgba(0,170,91,0.15)] rounded-[2.5rem] bg-gradient-to-br from-[#00AA5B] to-[#008A4A] text-white overflow-hidden relative group min-h-[180px] flex items-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 transition-transform group-hover:scale-125 duration-1000" />
                
                <CardContent className="p-10 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-white/10 w-fit backdrop-blur-md">
                      <WalletIcon className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Saldo Utama</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-5xl font-black font-headline tracking-tighter">
                        {walletLoading ? (
                          <div className="h-10 w-40 bg-white/20 animate-pulse rounded-lg" />
                        ) : (
                          `Rp ${wallet?.balance?.toLocaleString('id-ID') || 0}`
                        )}
                      </h3>
                      <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase">Tersedia untuk transaksi API & PPOB</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none rounded-2xl font-black text-xs h-14 px-8 bg-white text-[#00AA5B] hover:bg-white/95 shadow-xl shadow-black/10 active:scale-95 transition-all">
                      TOP UP SALDO
                    </Button>
                    <Button variant="ghost" className="rounded-2xl h-14 w-14 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/20">
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PROFILE FORM */}
              <Card className="border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] bg-white">
                <CardHeader className="p-8 pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black font-headline tracking-tight">Profil Publik</CardTitle>
                      <CardDescription className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-widest">Informasi Dasar & Kontak</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                       <UserIcon className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase ml-1">Nama Tampilan</Label>
                        <div className="relative group">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-[#00AA5B] transition-colors" />
                          <Input 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Contoh: John Doe"
                            className="h-14 pl-12 rounded-2xl bg-muted/20 border-transparent focus:border-[#00AA5B]/30 focus:bg-white focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm font-bold placeholder:font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase ml-1">Email Terdaftar</Label>
                        <div className="relative group opacity-80">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          <Input 
                            value={user.email || ""}
                            disabled
                            className="h-14 pl-12 rounded-2xl bg-muted/40 border-transparent cursor-not-allowed text-sm font-bold text-muted-foreground/70"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 mt-4">
                      <p className="text-[10px] text-muted-foreground font-medium italic">
                        *Nama tampilan akan muncul di setiap transaksi dan forum STS Market.
                      </p>
                      <Button 
                        type="submit"
                        disabled={isUpdating}
                        className="w-full sm:w-auto rounded-2xl px-10 bg-[#00AA5B] hover:bg-[#008A4A] font-black text-xs h-12 shadow-lg shadow-[#00AA5B]/10 active:scale-95 transition-all"
                      >
                        {isUpdating ? "Memproses..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* ADDITIONAL SETTINGS (MOBILE) */}
              <div className="lg:hidden space-y-4">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase px-2">Akun & Privasi</h3>
                <div className="grid grid-cols-1 gap-3">
                   {[
                     { label: 'Keamanan', desc: 'Sandi & Autentikasi', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
                     { label: 'Pengaturan', desc: 'Preferensi & Notifikasi', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-100' },
                     { label: 'Dompet', desc: 'Riwayat & Top Up', icon: WalletIcon, color: 'text-[#00AA5B]', bg: 'bg-[#00AA5B]/10' }
                   ].map((item, idx) => (
                    <button key={idx} className="w-full p-5 bg-white rounded-[1.5rem] border border-border shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.bg, item.color)}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </button>
                   ))}
                   
                   <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full h-16 rounded-[1.5rem] bg-destructive/5 text-destructive font-black text-xs mt-2 border border-destructive/10"
                   >
                     LOGOUT DARI SEMUA PERANGKAT
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}
