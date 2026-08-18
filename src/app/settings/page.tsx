"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  Menu,
  Pencil,
  MapPin,
  Landmark,
  CreditCard,
  Shield,
  Bell,
  Sun
} from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async () => {
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
        description: "Nama profil Anda berhasil disimpan.",
      });
      setIsEditing(false);
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

  if (authLoading || (user && walletLoading && !wallet)) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 max-w-2xl mx-auto">
          <div className="px-4 py-3 flex items-center justify-between">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="px-4 py-6 space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </main>
        <MarketBottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-body text-[#212121]">
      <main className="flex-1 w-full pb-24 max-w-2xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-1 hover:bg-muted rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold">Akun Saya</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* User Identity Section */}
        <section className="px-4 py-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-none shadow-sm ring-2 ring-muted/20">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-3xl font-bold uppercase">
                  {displayName.substring(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-8 text-sm font-bold border-[#00AA5B]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdateProfile} disabled={updating} className="h-7 text-[10px] bg-[#00AA5B] hover:bg-[#00AA5B]/90">Simpan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-[10px]">Batal</Button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-[#2E3137]">{displayName || "Pengguna Baru"}</h2>
                )}
                <p className="text-xs text-[#6C727C]">6288976577650</p>
                <p className="text-xs text-[#6C727C]">{user.email}</p>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-muted rounded-full border border-border shadow-sm transition-all"
              >
                <Pencil className="w-4 h-4 text-[#6C727C]" />
              </button>
            )}
          </div>
        </section>

        {/* Account Settings List */}
        <section className="pb-8">
          <h3 className="px-4 text-base font-bold text-[#2E3137] mb-2">Pengaturan Akun</h3>
          <div className="divide-y divide-border/50">
            {[
              { title: "Daftar Alamat", desc: "Atur alamat pengiriman belanjaan", icon: MapPin },
              { title: "Rekening Bank", desc: "Tarik Saldo MarketPoint ke rekening tujuan", icon: Landmark },
              { title: "Pembayaran Instan", desc: "E-Wallet, kartu kredit, & debit instan terdaftar", icon: CreditCard },
              { title: "Keamanan Akun", desc: "Kata sandi, PIN, & verifikasi data diri", icon: Shield },
              { title: "Notifikasi", desc: "Atur segala jenis pesan notifikasi", icon: Bell },
              { title: "Mode Tampilan", desc: "Aktifkan tampilan buta warna di MarketPoint", icon: Sun },
            ].map((menu, idx) => (
              <button 
                key={idx}
                className="w-full px-4 py-4 flex items-center gap-4 hover:bg-muted/30 transition-all text-left active:bg-muted/50"
              >
                <div className="bg-white rounded-lg flex items-center justify-center">
                  <menu.icon className="w-6 h-6 text-[#2E3137]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#2E3137]">{menu.title}</p>
                  <p className="text-[11px] text-[#6C727C]">{menu.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* App Settings Accordion */}
        <section className="border-t border-border">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="app-settings" className="border-none">
              <AccordionTrigger className="px-4 py-4 hover:no-underline font-bold text-base text-[#2E3137]">
                Pengaturan Aplikasi
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-[#6C727C]">
                  <span>Versi Aplikasi</span>
                  <span className="font-medium">1.0.0 (Build 2026)</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#6C727C]">
                  <span>Bahasa</span>
                  <span className="font-medium">Bahasa Indonesia</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <MarketBottomNav />
    </div>
  );
}
