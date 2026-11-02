
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword } from "firebase/auth";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  LogOut,
  Info,
  FileText,
  Lock,
  Loader2,
  UserCheck,
  Smartphone,
  Sliders,
  Link2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Password creation state for mobile
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);



  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
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

  const handleCreatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Kata sandi tidak cocok atau kosong.",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Kata sandi minimal 6 karakter.",
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(user!, newPassword);
      toast({
        title: "Berhasil",
        description: "Kata sandi telah dibuat.",
      });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Gagal membuat sandi.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPointID!",
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

  if (!mounted || authLoading || (user && (userLoading || walletLoading || shopLoading))) {
    return (
      <>
        <div className="hidden md:block">
          <DesktopProfileSkeleton />
        </div>
        <div className="block md:hidden min-h-screen bg-white flex flex-col font-body">
          <main className="flex-1 w-full pb-24 max-w-2xl mx-auto">
            <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </header>
            <div className="px-4 py-3 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-2 w-32" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
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
          </main>
        </div>
      </>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;
  const providers = user?.providerData?.map((p: any) => p.providerId) || [];
  const isGoogleUser = providers.includes('google.com');
  const hasPassword = providers.includes('password');
  const canCreatePassword = isGoogleUser && !hasPassword;

  return (
    <>
      <div className="hidden md:flex flex-col min-h-screen">
        <MarketHeader />
        <main className="flex-1 pt-16 bg-[#F8FAFC]">
          <DesktopSettings
            user={user}
            userData={userData}
            wallet={wallet}
            hasShop={hasShop}
            displayName={displayName}
            setDisplayName={setDisplayName}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleUpdateProfile={handleUpdateProfile}
            handleLogout={handleLogout}
            updating={updating}
          />
        </main>
        <MarketFooter />
      </div>

      <div className="block md:hidden min-h-screen bg-white flex flex-col font-body text-[#212121]">
        <main className="flex-1 w-full pb-24 max-w-2xl mx-auto bg-white min-h-screen">
          <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white sticky top-0 z-30">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95 cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-[#212121]" />
            </button>
            <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Akun Saya</h1>
          </header>

          <section className="px-4 py-3 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-none shadow-sm ring-2 ring-muted/20">
                  <AvatarImage
                    src={userData?.photoURL === "/assets/avatar/duck.png" ? "/assets/avatar/duck.png" : (userData?.photoURL || (user?.photoURL === "/assets/avatar/duck.png" ? "/assets/avatar/duck.png" : user?.photoURL) || undefined)}
                    referrerPolicy="no-referrer"
                  />
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
                    <h2 className="text-[14px] font-bold text-[#2E3137]">{displayName || "Pengguna Baru"}</h2>
                  )}
                  {(userData?.phoneNumber || userData?.phone || user.phoneNumber) && (
                    <p className="text-[10px] text-[#6C727C]">{userData?.phoneNumber || userData?.phone || user.phoneNumber}</p>
                  )}
                  <p className="text-[10px] text-[#6C727C]">{user.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-1">
            <h3 className="px-4 text-[11px] font-bold text-[#2E3137] mb-2">Pengaturan Akun</h3>
            <div className="space-y-0.5">
              {canCreatePassword && (
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full px-5 py-3 flex items-center gap-4 hover:bg-[#00AA5B]/5 transition-all text-left group">
                      <div className="flex-shrink-0">
                        <Lock className="w-4.5 h-4.5 text-[#00AA5B]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-[#00AA5B] leading-tight">Buat Kata Sandi Akun</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Tambahkan sandi untuk masuk via email</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#00AA5B] opacity-50" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-[90vw] mx-auto border-border">
                    <DialogHeader>
                      <DialogTitle className="font-bold text-lg">Buat Sandi</DialogTitle>
                      <DialogDescription className="text-xs">
                        Buat kata sandi baru untuk akun Google Anda.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">SANDI BARU</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">ULANGI SANDI</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreatePassword}
                        disabled={isPasswordLoading || !newPassword}
                        className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                      >
                        {isPasswordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                        Simpan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {[
                {
                  id: "profile",
                  title: "Profil & Identitas",
                  desc: "Biodata diri, nama lengkap, dan info kontak",
                  icon: UserCheck,
                  onClick: () => {
                    router.push("/settings/profile");
                  }
                },
                {
                  id: "security",
                  title: "Keamanan Akun",
                  desc: "Kata sandi, PIN, & autentikasi keamanan",
                  icon: Shield,
                  onClick: () => {
                    router.push("/settings/security");
                  }
                },
                {
                  id: "notifications",
                  title: "Notifikasi",
                  desc: "Atur email, push notifikasi, dan pesan aktivitas",
                  icon: Bell,
                  onClick: () => {
                    router.push("/settings/notifications");
                  }
                },
                {
                  id: "devices",
                  title: "Perangkat & Sesi",
                  desc: "Kelola sesi masuk dan riwayat perangkat",
                  icon: Smartphone,
                  onClick: () => {
                    router.push("/settings/devices");
                  }
                },
                {
                  id: "preferences",
                  title: "Preferensi",
                  desc: "Pilih tema aplikasi: Sistem, Light Mode, Dark Mode",
                  icon: Sliders,
                  onClick: () => {
                    router.push("/settings/preferences");
                  }
                },
                {
                  id: "connected",
                  title: "Akun Terhubung",
                  desc: "Kelola akun Google & layanan pihak ketiga",
                  icon: Link2,
                  onClick: () => {
                    router.push("/settings/connected");
                  }
                },
              ].map((menu) => (
                <button
                  key={menu.id}
                  onClick={menu.onClick}
                  className="w-full px-5 py-2.5 flex items-center gap-4 hover:bg-muted/30 transition-all text-left active:bg-muted/50 group"
                >
                  <div className="flex-shrink-0">
                    <menu.icon className={cn("w-4.5 h-4.5 opacity-80 group-hover:opacity-100 transition-opacity", (menu as any).color || "text-[#2E3137]")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[12px] font-bold leading-tight", (menu as any).color || "text-[#2E3137]")}>{menu.title}</p>
                    <p className="text-[9px] text-[#6C727C] mt-0.5 truncate">{menu.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30 group-hover:opacity-70 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </section>









          <section className="mt-1 px-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="seputar" className="border-none">
                <AccordionTrigger className="hover:no-underline py-3 text-[11px] font-bold text-[#2E3137] focus:outline-none">
                  Seputar MarketPointID
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-2">
                  <div className="space-y-0.5">
                    {[
                      { title: "Kenali MarketPointID", icon: Info, href: "/about" },
                      { title: "Syarat & Ketentuan", icon: FileText, href: "/terms" },
                      { title: "Kebijakan Privasi", icon: Lock, href: "/privacy" },
                    ].map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        className="flex items-center gap-4 py-2 px-1 hover:bg-muted/30 transition-all text-left active:bg-muted/50 rounded-lg group"
                      >
                        <item.icon className="w-3.5 h-3.5 text-[#6C727C] group-hover:text-primary transition-colors" />
                        <span className="text-[12px] font-medium text-[#2E3137]">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="mt-0.5">
            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 flex items-center gap-4 hover:bg-destructive/5 transition-all text-left active:bg-destructive/10"
            >
              <div className="flex-shrink-0">
                <LogOut className="w-4.5 h-4.5 text-destructive opacity-80" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-destructive leading-tight">Keluar Akun</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Keluar dari sesi MarketPointID saat ini</p>
              </div>
            </button>
          </section>
        </main>
      </div>
    </>
  );
}
