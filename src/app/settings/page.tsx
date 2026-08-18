"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  User, 
  Shield, 
  Bell, 
  HelpCircle, 
  Info,
  Smartphone,
  CreditCard,
  Lock,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      await updateProfile(user, { displayName });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda berhasil disimpan.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 max-w-2xl mx-auto">
          <div className="px-4 py-4 flex items-center gap-4 border-b border-border">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-60 w-full rounded-2xl" />
          </div>
        </main>
        <MarketBottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-body">
      <main className="flex-1 w-full pb-24 max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
        {/* Settings Header */}
        <div className="px-4 py-5 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-border/60">
          <Link href="/profile" className="p-1.5 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Pengaturan</h1>
        </div>

        <div className="p-4 space-y-8">
          {/* Account Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Informasi Profil</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5 bg-white rounded-2xl border border-border/80 p-5 shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Nama Lengkap</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Anda"
                  className="rounded-xl h-11 border-border bg-muted/20 focus:bg-white focus:ring-[#00AA5B]/10 transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</Label>
                <div className="relative group">
                  <Input
                    value={user.email || ""}
                    disabled
                    className="rounded-xl h-11 border-border/50 bg-muted/40 text-muted-foreground/70 text-sm font-medium cursor-not-allowed pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                </div>
                <p className="text-[9px] text-muted-foreground/60 italic ml-1">Email dikelola oleh sistem Google Auth.</p>
              </div>

              <Button 
                type="submit" 
                disabled={updating}
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs transition-all active:scale-[0.97] shadow-lg shadow-[#00AA5B]/10"
              >
                {updating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </section>

          {/* Security & System Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Sistem & Keamanan</h2>
            </div>

            <div className="bg-white rounded-2xl border border-border/80 overflow-hidden shadow-sm">
              {[
                { label: "Keamanan Akun", icon: Shield, desc: "Verifikasi 2 langkah & kunci", badge: "Aman" },
                { label: "Notifikasi", icon: Bell, desc: "Push, email, & pesan promo" },
                { label: "Metode Pembayaran", icon: CreditCard, desc: "Kelola kartu & saldo digital" },
                { label: "Privasi Akun", icon: Lock, desc: "Kontrol data & visibilitas" },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-all border-b border-border/50 last:border-0 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-[#00AA5B]/10 transition-colors">
                      <item.icon className="w-4.5 h-4.5 text-foreground/70 group-hover:text-[#00AA5B] transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{item.label}</p>
                        {item.badge && <span className="text-[8px] bg-[#00AA5B]/10 text-[#00AA5B] px-1.5 py-0.5 rounded font-black uppercase">{item.badge}</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                </button>
              ))}
            </div>
          </section>

          {/* Support Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Dukungan</h2>
            </div>

            <div className="bg-white rounded-2xl border border-border/80 overflow-hidden shadow-sm">
              {[
                { label: "Pusat Bantuan", icon: HelpCircle, desc: "FAQ & Hubungi Kami" },
                { label: "Tentang MarketPoint", icon: Info, desc: "Ketentuan & Kebijakan Privasi" },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-all border-b border-border/50 last:border-0 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-[#00AA5B]/10 transition-colors">
                      <item.icon className="w-4.5 h-4.5 text-foreground/70 group-hover:text-[#00AA5B] transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground transition-all" />
                </button>
              ))}
            </div>
          </section>

          <div className="pt-10 pb-4 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-[0.3em]">MarketPoint PRO v1.0.0</p>
          </div>
        </div>
      </main>

      <MarketBottomNav />
    </div>
  );
}
