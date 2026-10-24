"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SecurityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Firestore References
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

  // States
  const [mounted, setMounted] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  // PIN Form States
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [isPinLoading, setIsPinLoading] = useState(false);

  const providers = user?.providerData?.map((p: any) => p.providerId) || [];
  const isGoogleUser = providers.includes("google.com");
  const hasPassword = providers.includes("password");
  const canCreatePassword = isGoogleUser && !hasPassword;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePinDigitChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);

    // Auto focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSavePin = async () => {
    const fullPin = pinDigits.join("");
    if (fullPin.length !== 6) {
      toast({
        variant: "destructive",
        title: "PIN Belum Lengkap",
        description: "Masukkan 6 digit angka untuk PIN MarketPoint.",
      });
      return;
    }

    setIsPinLoading(true);
    try {
      if (userRef) {
        await updateDoc(userRef, {
          hasPin: true,
          pinUpdatedAt: new Date().toISOString(),
        });

        // Kirim email notifikasi keamanan PIN via no-reply@marketpoint.id
        const targetEmail = userData?.email || user?.email;
        if (targetEmail) {
          fetch("/api/auth/send-security-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: targetEmail,
              displayName: userData?.displayName || user?.displayName || "Pengguna",
              eventType: "pin_changed",
            }),
          }).catch((err) => console.warn("Failed to dispatch PIN change alert:", err));
        }
      }

      toast({
        title: "PIN Berhasil Disimpan",
        description: "PIN MarketPoint Anda kini telah aktif untuk mengamankan transaksi dompet.",
      });
      setIsPinDialogOpen(false);
      setPinDigits(["", "", "", "", "", ""]);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan PIN",
        description: error.message || "Terjadi gangguan saat menyimpan PIN.",
      });
    } finally {
      setIsPinLoading(false);
    }
  };


  // Skeleton Loading
  if (!mounted || authLoading || (user && (userLoading || walletLoading || shopLoading))) {
    return (
      <>
        <div className="hidden md:block">
          <DesktopProfileSkeleton />
        </div>
        <div className="block md:hidden min-h-screen bg-white">
          <div className="px-4 py-3.5 flex items-center gap-4 bg-white">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;
  const hasPin = userData?.hasPin === true;
  const phoneNumber = userData?.phoneNumber || userData?.phone || user.phoneNumber || "";

  return (
    <>
      {/* Desktop Fallback */}
      <div className="hidden md:flex flex-col min-h-screen">
        <MarketHeader />
        <main className="flex-1 pt-16 bg-[#F8FAFC]">
          <DesktopSettings
            user={user}
            userData={userData}
            wallet={wallet}
            hasShop={hasShop}
            displayName={userData?.displayName || user.displayName || ""}
            setDisplayName={() => {}}
            isEditing={false}
            setIsEditing={() => {}}
            handleUpdateProfile={() => {}}
            handleLogout={() => auth.signOut().then(() => router.push("/login"))}
            updating={false}
            activeTab="keamanan"
          />
        </main>
        <MarketFooter />
      </div>

      {/* Dedicated Mobile View (Tokopedia/Shopee Style) */}
      <div className="block md:hidden min-h-screen bg-white font-body text-[#212121]">
        {/* Header */}
        <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white sticky top-0 z-30">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#212121]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Keamanan Akun</h1>
        </header>

        <main className="px-4 pb-16 space-y-5">


          {/* Section: Autentikasi & Sandi */}
          <section className="space-y-1">
            <div className="py-1">
              <h3 className="text-[13px] font-bold text-[#212121]">Autentikasi & Sandi</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Kelola kunci masuk dan kata sandi transaksi akun</p>
            </div>

            <div className="space-y-0.5">
              {/* Row: Kata Sandi */}
              <button
                type="button"
                onClick={() => router.push("/settings/security/change-password")}
                className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">Kata Sandi Akun</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {canCreatePassword ? "Belum dibuat (Masuk via Google)" : "Diperbarui secara berkala"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-[#00AA5B]">
                    {canCreatePassword ? "Buat Sandi" : "Ubah"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </button>

              {/* Row: PIN MarketPoint */}
              <button
                type="button"
                onClick={() => setIsPinDialogOpen(true)}
                className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">PIN MarketPoint (6 Digit)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {hasPin ? "PIN aktif untuk keamanan dompet & saldo" : "Belum diatur untuk proteksi transaksi"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-[#00AA5B]">
                    {hasPin ? "Ubah PIN" : "Atur PIN"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </button>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Section: Kontak Pemulihan */}
          <section className="space-y-1">
            <div className="py-1">
              <h3 className="text-[13px] font-bold text-[#212121]">Kontak Pemulihan</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Digunakan saat Anda lupa kata sandi atau butuh pemulihan akun</p>
            </div>

            <div className="space-y-0.5">
              {/* Row: Email */}
              <Link href="/settings/profile" className="w-full py-3.5 flex items-center justify-between hover:bg-slate-50/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">Email Akun</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{userData?.email || user.email || "Belum ditambahkan"}</p>
                  </div>
                </div>
                {(userData?.email || user.email) ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                    Tambah
                  </span>
                )}
              </Link>

              {/* Row: Nomor Handphone */}
              <div className="w-full py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#212121]">Nomor Handphone</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {phoneNumber || "Belum ditambahkan"}
                    </p>
                  </div>
                </div>
                {phoneNumber ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Terverifikasi
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/settings/profile")}
                    className="text-[11px] font-bold text-[#00AA5B] hover:underline shrink-0"
                  >
                    Tambah HP
                  </button>
                )}
              </div>
            </div>
          </section>


        </main>

        {/* Dialog Atur / Ubah PIN (6 Digit) */}
        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">
                {hasPin ? "Ubah PIN Transaksi" : "Atur PIN Transaksi"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                PIN 6-digit digunakan untuk otorisasi pembayaran dompet dan penarikan saldo.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Masukkan 6 Digit Angka</label>
              <div className="flex justify-between gap-2">
                {pinDigits.map((digit, idx) => (
                  <Input
                    key={idx}
                    id={`pin-digit-${idx}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    className="h-12 w-11 text-center font-bold text-base rounded-xl border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B] p-0"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Jangan gunakan kombinasi angka berurutan atau tanggal lahir Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPinDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSavePin}
                disabled={isPinLoading || pinDigits.some((d) => !d)}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isPinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan PIN
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
