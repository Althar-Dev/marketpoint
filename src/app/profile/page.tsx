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
  BadgeCheck
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
        description: "Nama tampilan Anda berhasil disimpan.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPoint!",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Keluar",
        description: "Gagal melakukan proses keluar.",
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-[#00AA5B]/20 border-t-[#00AA5B] animate-spin" />
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Memuat Profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-body">
      <MarketHeader />

      <main className="flex-1 w-full pt-20 pb-24 lg:pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Profil */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-2xl font-black uppercase">
                      {user.displayName?.substring(0, 2) || user.email?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-[#00AA5B] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-1">
                  <h2 className="text-xl font-black font-headline tracking-tight">{user.displayName || "User MarketPoint"}</h2>
                  <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                </div>

                <div className="w-full mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saldo</p>
                    <p className="text-sm font-black text-[#00AA5B]">
                      {walletLoading ? "..." : `Rp ${wallet?.balance?.toLocaleString('id-ID') || 0}`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                    <p className="text-[10px] font-black text-[#8B5CF6] uppercase">PRO DEVELOPER</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="hidden lg:block space-y-2">
              <Button variant="ghost" className="w-full justify-start rounded-xl h-11 px-4 text-xs font-bold gap-3 hover:bg-white hover:shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary/40" /> Keamanan Akun
              </Button>
              <Button variant="ghost" className="w-full justify-start rounded-xl h-11 px-4 text-xs font-bold gap-3 hover:bg-white hover:shadow-sm">
                <Settings className="w-4 h-4 text-primary/40" /> Pengaturan
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start rounded-xl h-11 px-4 text-xs font-bold gap-3 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <LogOut className="w-4 h-4" /> Keluar dari Akun
              </Button>
            </div>
          </div>

          {/* Konten Utama */}
          <div className="lg:col-span-8 space-y-6">
            {/* Wallet Quick Info */}
            <Card className="border-border shadow-sm rounded-2xl bg-[#00AA5B] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
              <CardContent className="p-6 flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 opacity-80">
                    <WalletIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Saldo Dompet</span>
                  </div>
                  <h3 className="text-3xl font-black font-headline tracking-tighter">
                    Rp {walletLoading ? "..." : (wallet?.balance?.toLocaleString('id-ID') || 0)}
                  </h3>
                </div>
                <Button variant="secondary" className="rounded-xl font-bold text-xs h-10 px-6 bg-white text-[#00AA5B] hover:bg-white/90 shadow-lg shadow-black/5">
                  Top Up
                </Button>
              </CardContent>
            </Card>

            {/* Edit Profil Form */}
            <Card className="border-border shadow-sm rounded-2xl bg-white">
              <CardHeader className="p-6 pb-0">
                <CardTitle className="text-lg font-black font-headline tracking-tight">Informasi Pribadi</CardTitle>
                <CardDescription className="text-xs font-medium">Perbarui informasi profil Anda untuk keamanan dan kenyamanan.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Nama Lengkap</Label>
                      <div className="relative group">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#00AA5B] transition-colors" />
                        <Input 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nama Anda"
                          className="h-11 pl-10 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:bg-white transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Alamat Email</Label>
                      <div className="relative opacity-60">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          value={user.email || ""}
                          disabled
                          className="h-11 pl-10 rounded-xl bg-muted/20 border-transparent cursor-not-allowed text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button 
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-xl px-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs h-10 shadow-lg shadow-[#00AA5B]/10 active:scale-95 transition-all"
                    >
                      {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Menu Tambahan Mobile */}
            <div className="lg:hidden space-y-3">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase px-2">Akun & Keamanan</h3>
              <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F4FD] flex items-center justify-center text-[#3B82F6]">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">Keamanan</p>
                      <p className="text-[9px] text-muted-foreground">Kata sandi & 2FA</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <Settings className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold">Pengaturan</p>
                      <p className="text-[9px] text-muted-foreground">Preferensi notifikasi</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                      <LogOut className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-destructive">Keluar</p>
                      <p className="text-[9px] text-destructive/60">Keluar dari sesi ini</p>
                    </div>
                  </div>
                </button>
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
