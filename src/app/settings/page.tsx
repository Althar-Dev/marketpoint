"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
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
  MapPinned,
  Building2,
  CreditCard,
  Shield,
  Bell,
  Sun,
  LogOut,
  Info,
  FileText,
  Lock
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
  const auth = useAuth();
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
        description: "Terjadi gangguan pada sistem.",
      });
    }
  };

  if (authLoading || (user && walletLoading && !wallet)) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 max-w-2xl mx-auto">
          <div className="px-4 py-1.5 flex items-center justify-between">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="px-4 py-3 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-20" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <Skeleton className="h-3 w-24 ml-1" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex gap-4 items-center h-10 px-1">
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
        <div className="px-4 py-1.5 flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-1 hover:bg-muted rounded-full transition-colors text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold">Akun Saya</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* User Identity Section */}
        <section className="px-4 py-4 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-none shadow-sm ring-2 ring-muted/20">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-xl font-bold uppercase">
                  {displayName.substring(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0">
                {isEditing ? (
                  <div className="flex flex-col gap-1.5">
                    <Input 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-7 text-xs font-bold border-[#00AA5B]"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={handleUpdateProfile} disabled={updating} className="h-6 text-[9px] px-2 bg-[#00AA5B] hover:bg-[#00AA5B]/90">Simpan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 text-[9px] px-2">Batal</Button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-[15px] font-bold text-[#2E3137]">{displayName || "Pengguna Baru"}</h2>
                )}
                <p className="text-[10px] text-[#6C727C]">6288976577650</p>
                <p className="text-[10px] text-[#6C727C]">{user.email}</p>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-muted rounded-full border border-border shadow-sm transition-all text-[#6C727C]"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        </section>

        {/* Account Settings List */}
        <section className="pb-2">
          <h3 className="px-4 text-[12px] font-bold text-[#2E3137] mb-2">Pengaturan Akun</h3>
          <div className="divide-y divide-border/50">
            {[
              { title: "Daftar Alamat", desc: "Atur alamat pengiriman belanjaan", icon: MapPinned },
              { title: "Rekening Bank", desc: "Tarik Saldo MarketPoint ke rekening tujuan", icon: Building2 },
              { title: "Pembayaran Instan", desc: "E-Wallet, kartu kredit, & debit instan terdaftar", icon: CreditCard },
              { title: "Keamanan Akun", desc: "Kata sandi, PIN, & verifikasi data diri", icon: Shield },
              { title: "Notifikasi", desc: "Atur segala jenis pesan notifikasi", icon: Bell },
              { title: "Mode Tampilan", desc: "Aktifkan tampilan buta warna di MarketPoint", icon: Sun },
            ].map((menu, idx) => (
              <button 
                key={idx}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-muted/30 transition-all text-left active:bg-muted/50 group"
              >
                <div className="flex-shrink-0">
                  <menu.icon className="w-5 h-5 text-[#2E3137] opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#2E3137] leading-tight">{menu.title}</p>
                  <p className="text-[10px] text-[#6C727C] mt-0.5">{menu.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Seputar MarketPoint Dropdown */}
        <section className="border-t border-border mt-2 px-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="seputar" className="border-none">
              <AccordionTrigger className="hover:no-underline py-3.5 text-[12px] font-bold text-[#2E3137] focus:outline-none">
                Seputar MarketPoint
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-3">
                <div className="space-y-0.5">
                  {[
                    { title: "Kenali MarketPoint", icon: Info, href: "/about" },
                    { title: "Syarat & Ketentuan", icon: FileText, href: "/terms" },
                    { title: "Kebijakan Privasi", icon: Lock, href: "/privacy" },
                  ].map((item, idx) => (
                    <Link 
                      key={idx}
                      href={item.href}
                      className="flex items-center gap-4 py-2.5 px-1 hover:bg-muted/30 transition-all text-left active:bg-muted/50 rounded-lg group"
                    >
                      <item.icon className="w-4 h-4 text-[#6C727C] group-hover:text-primary transition-colors" />
                      <span className="text-[13px] font-medium text-[#2E3137]">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Logout Section */}
        <section className="border-t border-border mt-1">
          <button 
            onClick={handleLogout}
            className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-destructive/5 transition-all text-left active:bg-destructive/10"
          >
            <div className="flex-shrink-0">
              <LogOut className="w-5 h-5 text-destructive opacity-80" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-destructive leading-tight">Keluar Akun</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Keluar dari sesi MarketPoint saat ini</p>
            </div>
          </button>
        </section>
      </main>

      <MarketBottomNav />
    </div>
  );
}
