"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, User, Shield, Bell, HelpCircle, Info } from "lucide-react";
import Link from "next/link";

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
      // Update Auth Profile
      await updateProfile(user, { displayName });

      // Update Firestore User Doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Profil Diperbarui",
        description: "Nama Anda telah berhasil diubah.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: error.message || "Terjadi kesalahan saat memperbarui profil.",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 lg:pb-16 max-w-2xl mx-auto">
          <div className="px-4 py-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-border">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </main>
        <MarketBottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <main className="flex-1 w-full pb-24 lg:pb-16 max-w-2xl mx-auto">
        {/* Settings Header */}
        <div className="px-4 py-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-border">
          <Link href="/profile" className="p-1 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold">Pengaturan</h1>
        </div>

        <div className="p-4 space-y-8">
          {/* Account Information Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <User className="w-4 h-4 text-[#00AA5B]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informasi Akun</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Nama Lengkap</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="rounded-xl h-11 border-border bg-muted/20 focus:ring-[#00AA5B]/10 text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Alamat Email</Label>
                <Input
                  value={user.email || ""}
                  disabled
                  className="rounded-xl h-11 border-border bg-muted/50 text-muted-foreground text-sm font-medium cursor-not-allowed"
                />
                <p className="text-[9px] text-muted-foreground ml-1">Email tidak dapat diubah karena terhubung dengan akun Google.</p>
              </div>

              <Button 
                type="submit" 
                disabled={updating}
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs mt-2 transition-all active:scale-[0.98]"
              >
                {updating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </section>

          {/* Other Settings Groups */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1 mb-3">
              <Shield className="w-4 h-4 text-[#00AA5B]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Keamanan & Lainnya</h2>
            </div>

            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              {[
                { label: "Keamanan Akun", icon: Shield, desc: "Kata sandi & verifikasi dua langkah" },
                { label: "Notifikasi", icon: Bell, desc: "Atur pesan masuk & promo" },
                { label: "Pusat Bantuan", icon: HelpCircle, desc: "Hubungi MarketPoint Care" },
                { label: "Tentang MarketPoint", icon: Info, desc: "Versi aplikasi & informasi hukum" },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-all border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-foreground opacity-70" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-30 rotate-180" />
                </button>
              ))}
            </div>
          </section>

          <div className="pt-4 flex justify-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">MarketPoint v1.0.0-PRO</p>
          </div>
        </div>
      </main>

      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}