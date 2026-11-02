"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail } from "firebase/auth";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Mail,
  Shield
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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function parseBirthDate(dateStr: string) {
  if (!dateStr) return { day: "", month: "", year: "" };
  const parts = dateStr.trim().split(/[\s-]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return {
        year: parts[0],
        month: String(parseInt(parts[1], 10)),
        day: String(parseInt(parts[2], 10))
      };
    }
    const d = parts[0];
    const mStr = parts[1].toLowerCase();
    const y = parts[2];
    const mIdx = MONTHS.findIndex((m) => m.toLowerCase().startsWith(mStr));
    return {
      day: String(parseInt(d, 10)),
      month: mIdx !== -1 ? String(mIdx + 1) : "",
      year: y
    };
  }
  return { day: "", month: "", year: "" };
}

export default function ProfileIdentityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dialog States
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isBirthDialogOpen, setIsBirthDialogOpen] = useState(false);
  const [isGenderDialogOpen, setIsGenderDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Temp form values for dialogs
  const [tempName, setTempName] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [tempBirthDate, setTempBirthDate] = useState("");
  const [tempDay, setTempDay] = useState("");
  const [tempMonth, setTempMonth] = useState("");
  const [tempYear, setTempYear] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempPhone, setTempPhone] = useState("");

  // Email Add & Verify Dialog States
  const [emailInput, setEmailInput] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailToken, setEmailToken] = useState("");
  const [emailExpiresAt, setEmailExpiresAt] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  const handleOpenEmailDialog = () => {
    if (userData?.email || user?.email) return;
    setEmailInput("");
    setEmailVerificationCode("");
    setEmailStep("input");
    setEmailCountdown(0);
    setEmailToken("");
    setEmailExpiresAt(0);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmailVerificationCode = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      toast({
        variant: "destructive",
        title: "Format Email Tidak Valid",
        description: "Masukkan format email yang valid (contoh: user@marketpoint.id).",
      });
      return;
    }

    setIsSendingEmailCode(true);
    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type: "add_email" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirimkan kode verifikasi.");
      }

      setEmailToken(data.token);
      setEmailExpiresAt(data.expiresAt);
      setEmailStep("verify");
      setEmailCountdown(60);
      toast({
        title: "Kode Verifikasi Terkirim",
        description: `Kode 6 digit telah dikirimkan ke ${cleanEmail}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Kode",
        description: err.message || "Terjadi gangguan saat mengirimkan kode verifikasi.",
      });
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleConfirmVerifyEmail = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanCode = emailVerificationCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Kode Tidak Lengkap",
        description: "Silakan masukkan 6 digit kode verifikasi yang Anda terima.",
      });
      return;
    }

    setIsVerifyingEmailCode(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          token: emailToken,
          expiresAt: emailExpiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kode verifikasi tidak valid atau telah kedaluwarsa.");
      }

      if (user) {
        const uDocRef = doc(db, "users", user.uid);
        await updateDoc(uDocRef, {
          email: cleanEmail,
          emailVerified: true,
          emailUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        try {
          await updateEmail(user, cleanEmail);
        } catch (authErr) {
          console.warn("Could not update auth user email directly:", authErr);
        }
      }

      toast({
        title: "Email Berhasil Ditambahkan",
        description: `Alamat email ${cleanEmail} telah diverifikasi dan tersimpan pada akun Anda.`,
      });
      setIsEmailDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: err.message || "Gagal memverifikasi kode verifikasi.",
      });
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      const name = userData?.displayName || user.displayName || "";
      const uUsername = userData?.username || "";
      const uBirth = userData?.birthDate || "";
      const uGender = userData?.gender || "";
      const uPhone = userData?.phoneNumber || userData?.phone || user.phoneNumber || "";

      setDisplayName(name);
      setUsername(uUsername);
      setBirthDate(uBirth);
      setGender(uGender);
      setPhoneNumber(uPhone);

      setTempName(name);
      setTempUsername(uUsername);
      setTempBirthDate(uBirth);
      setTempGender(uGender);
      setTempPhone(uPhone);
    }
  }, [user, userData]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Terlalu Besar",
        description: "Ukuran maksimal foto profil adalah 10MB.",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto profil");

      const avatarUrl = data.url;

      await updateProfile(user, { photoURL: avatarUrl });
      if (userRef) {
        await updateDoc(userRef, {
          photoURL: avatarUrl,
          updatedAt: new Date().toISOString(),
        });
      }

      toast({
        title: "Foto Berhasil Diperbarui",
        description: "Foto profil Anda telah disimpan.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: error.message || "Terjadi kesalahan saat mengunggah foto.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveField = async (field: string, value: string) => {
    if (!user || !userRef) return;
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        [field]: value,
        updatedAt: new Date().toISOString(),
      };

      if (field === "displayName") {
        await updateProfile(user, { displayName: value });
      }

      await updateDoc(userRef, payload);

      if (field === "displayName") setDisplayName(value);
      if (field === "username") setUsername(value);
      if (field === "birthDate") setBirthDate(value);
      if (field === "gender") setGender(value);
      if (field === "phoneNumber" || field === "phone") {
        setPhoneNumber(value);
        const targetEmail = userData?.email || user.email;
        if (targetEmail) {
          fetch("/api/auth/send-security-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: targetEmail,
              displayName: userData?.displayName || user.displayName || "Pengguna",
              eventType: "phone_changed",
              newValue: value,
            }),
          }).catch((err) => console.warn("Failed to dispatch phone change alert:", err));
        }
      }

      toast({
        title: "Perubahan Disimpan",
        description: "Informasi berhasil diperbarui.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    toast({
      title: "User ID Disalin",
      description: user.uid,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  // Skeleton loading
  if (!mounted || authLoading || (user && (userLoading || walletLoading || shopLoading))) {
    return (
      <>
        <div className="hidden md:block">
          <DesktopProfileSkeleton />
        </div>
        <div className="block md:hidden min-h-screen bg-white">
          <div className="px-4 py-3 flex items-center gap-4 bg-white border-b border-border/40">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex flex-col items-center py-6 gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="px-5 py-3 space-y-5">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;
  const rawPhoto = userData?.photoURL || user?.photoURL;
  const photoURL = rawPhoto === "/assets/avatar/duck.png" ? "/assets/avatar/duck.png" : (rawPhoto || undefined);
  const userIdDisplay = user.uid;

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
            displayName={displayName}
            setDisplayName={setDisplayName}
            isEditing={false}
            setIsEditing={() => { }}
            handleUpdateProfile={() => { }}
            handleLogout={handleLogout}
            updating={false}
            onAvatarUpload={handleAvatarUpload}
            uploadingAvatar={uploadingAvatar}
            activeTab="biodata"
          />
        </main>
        <MarketFooter />
      </div>

      {/* Dedicated Mobile View (Tokopedia Style) */}
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
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Ubah Profil</h1>
        </header>

        <main className="pb-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center pt-3 pb-5">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-20 w-20 ring-1 ring-border/40 shadow-xs">
                <AvatarImage src={photoURL} className="object-cover" referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-[#00AA5B] text-white text-2xl font-bold uppercase">
                  {displayName?.substring(0, 1) || user?.email?.substring(0, 1)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-3 text-[13px] font-bold text-[#00AA5B] hover:opacity-85 transition-opacity"
            >
              {uploadingAvatar ? "Mengunggah..." : "Ubah Foto Profil"}
            </button>
          </div>

          {/* Section: Info profil */}
          <section className="pt-2">
            <div className="px-5 py-2 flex items-center gap-1.5">
              <h2 className="text-[15px] font-bold text-[#212121]">Info profil</h2>
              <Info className="w-4 h-4 text-muted-foreground/60" />
            </div>

            <div className="space-y-0.5">
              {/* Row: Nama */}
              <button
                type="button"
                onClick={() => {
                  setTempName(displayName);
                  setIsNameDialogOpen(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <span className="w-28 text-[13px] text-[#6C727C]">Nama</span>
                <span className="flex-1 text-[13px] text-[#212121] font-normal truncate pr-2">
                  {displayName || "Belum diatur"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>

              {/* Row: Username */}
              <button
                type="button"
                onClick={() => {
                  setTempUsername(username);
                  setIsUsernameDialogOpen(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <span className="w-28 text-[13px] text-[#6C727C]">Username</span>
                <span
                  className={cn(
                    "flex-1 text-[13px] truncate pr-2 font-normal",
                    username ? "text-[#212121]" : "text-[#8D96A0]"
                  )}
                >
                  {username || "Buat username yang unik"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-slate-100 my-2" />

          {/* Section: Info pribadi */}
          <section className="pt-2">
            <div className="px-5 py-2 flex items-center gap-1.5">
              <h2 className="text-[15px] font-bold text-[#212121]">Info pribadi</h2>
              <Info className="w-4 h-4 text-muted-foreground/60" />
            </div>

            <div className="space-y-0.5">
              {/* Row: User ID */}
              <div className="w-full px-5 py-3 flex items-center justify-between">
                <span className="w-28 text-[13px] text-[#6C727C]">User ID</span>
                <span className="flex-1 text-[13px] text-[#212121] font-normal truncate pr-2 tracking-tight">
                  {userIdDisplay}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="p-1 -mr-1 hover:bg-slate-100 rounded-md transition-colors text-muted-foreground/70 hover:text-foreground shrink-0 active:scale-95"
                  title="Salin User ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#00AA5B]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Row: Email */}
              {(userData?.email || user.email) ? (
                <div className="w-full px-5 py-3 flex items-center justify-between text-left">
                  <span className="w-28 text-[13px] text-[#6C727C]">Email</span>
                  <span className="flex-1 text-[13px] truncate pr-2 font-normal text-[#212121]">
                    {userData?.email || user.email}
                  </span>
                  <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                    Terverifikasi
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEmailDialog}
                  className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
                >
                  <span className="w-28 text-[13px] text-[#6C727C]">Email</span>
                  <span className="flex-1 text-[13px] truncate pr-2 font-semibold text-[#00AA5B]">
                    Tambah Email
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </button>
              )}

              {/* Row: Nomor HP */}
              <button
                type="button"
                onClick={() => {
                  setTempPhone(phoneNumber);
                  setIsPhoneDialogOpen(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <span className="w-28 text-[13px] text-[#6C727C]">Nomor HP</span>
                <span
                  className={cn(
                    "flex-1 text-[13px] truncate pr-2 font-normal",
                    phoneNumber ? "text-[#212121]" : "text-[#8D96A0]"
                  )}
                >
                  {phoneNumber || "Tambah Nomor HP"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>

              {/* Row: Jenis Kelamin */}
              <button
                type="button"
                onClick={() => {
                  setTempGender(gender);
                  setIsGenderDialogOpen(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <span className="w-28 text-[13px] text-[#6C727C]">Jenis Kelamin</span>
                <span
                  className={cn(
                    "flex-1 text-[13px] truncate pr-2 font-normal",
                    gender ? "text-[#212121]" : "text-[#8D96A0]"
                  )}
                >
                  {gender === "L"
                    ? "Laki-laki"
                    : gender === "P"
                      ? "Perempuan"
                      : gender || "Pilih Jenis Kelamin"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>

              {/* Row: Tanggal Lahir */}
              <button
                type="button"
                onClick={() => {
                  const p = parseBirthDate(birthDate);
                  setTempDay(p.day);
                  setTempMonth(p.month);
                  setTempYear(p.year);
                  setIsBirthDialogOpen(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50/70 active:bg-slate-100/70 transition-colors"
              >
                <span className="w-28 text-[13px] text-[#6C727C]">Tanggal Lahir</span>
                <span
                  className={cn(
                    "flex-1 text-[13px] truncate pr-2 font-normal",
                    birthDate ? "text-[#212121]" : "text-[#8D96A0]"
                  )}
                >
                  {birthDate || "Pilih Tanggal Lahir"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>
            </div>
          </section>

          {/* Tutup Akun Button */}
          <div className="pt-10 pb-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-[13px] font-bold text-[#00AA5B] hover:underline transition-all active:scale-95"
            >
              Tutup Akun
            </button>
          </div>
        </main>

        {/* Dialog Ubah Nama */}
        <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Ubah Nama Lengkap</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Nama ini akan terlihat pada profil dan nota transaksi belanja Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Nama Lengkap</label>
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="h-11 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B] focus-visible:border-[#00AA5B] transition-all"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNameDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!tempName.trim()) {
                    toast({ variant: "destructive", title: "Nama tidak boleh kosong" });
                    return;
                  }
                  await handleSaveField("displayName", tempName.trim());
                  setIsNameDialogOpen(false);
                }}
                disabled={isSaving}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Ubah Username */}
        <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Ubah Username</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Username bersifat unik dan dapat digunakan untuk menemukan akun Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Username</label>
              <Input
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                placeholder="username_anda"
                className="h-11 rounded-xl text-xs font-semibold font-mono border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B] focus-visible:border-[#00AA5B] transition-all"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground ml-0.5">Gunakan huruf kecil, angka, titik, atau garis bawah.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUsernameDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await handleSaveField("username", tempUsername.trim());
                  setIsUsernameDialogOpen(false);
                }}
                disabled={isSaving}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Email Tambah / Ubah & Verifikasi */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[380px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <div className="w-9 h-9 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center mb-1">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <DialogTitle className="text-base font-bold text-[#212121]">
                {emailStep === "input" ? "Tambah Alamat Email" : "Verifikasi Kode Email"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {emailStep === "input"
                  ? "Email wajib diverifikasi. Kami akan mengirimkan kode 6 digit untuk memastikan kepemilikan akun Anda."
                  : `Masukkan 6 digit kode keamanan yang telah dikirimkan ke ${emailInput}.`}
              </DialogDescription>
            </DialogHeader>

            {emailStep === "input" ? (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="nama@email.com"
                      className="h-10 pl-9 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Kode verifikasi 6 digit akan dikirimkan langsung ke email ini untuk memvalidasi kepemilikan.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEmailDialogOpen(false)}
                    className="h-10 rounded-xl font-bold text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendEmailVerificationCode}
                    disabled={isSendingEmailCode || !emailInput.trim()}
                    className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                  >
                    {isSendingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Kirim Kode
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700">Kode Verifikasi 6 Digit</label>
                    <button
                      type="button"
                      onClick={() => setEmailStep("input")}
                      className="text-[11px] text-[#00AA5B] font-bold hover:underline"
                    >
                      Ganti Email
                    </button>
                  </div>
                  <Input
                    type="text"
                    maxLength={6}
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="------"
                    className="h-12 rounded-xl text-center text-lg font-bold tracking-[0.4em] border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-muted-foreground">Tidak menerima email?</span>
                  {emailCountdown > 0 ? (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Kirim ulang dalam <span className="font-bold text-[#00AA5B]">{emailCountdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailVerificationCode}
                      disabled={isSendingEmailCode}
                      className="text-[11px] font-bold text-[#00AA5B] hover:underline"
                    >
                      Kirim Ulang Kode
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmailStep("input")}
                    className="h-10 rounded-xl font-bold text-xs"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmVerifyEmail}
                    disabled={isVerifyingEmailCode || emailVerificationCode.length !== 6}
                    className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                  >
                    {isVerifyingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Verifikasi & Simpan
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Ubah Nomor HP */}
        <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Nomor Handphone</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Nomor ini digunakan untuk konfirmasi pesanan belanja & pengiriman kurir.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Nomor HP</label>
              <Input
                type="tel"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                placeholder="0889-7657-7650"
                className="h-11 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50/70 focus-visible:ring-1 focus-visible:ring-[#00AA5B] focus-visible:border-[#00AA5B] transition-all"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhoneDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await handleSaveField("phoneNumber", tempPhone.trim());
                  setIsPhoneDialogOpen(false);
                }}
                disabled={isSaving}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Ubah Jenis Kelamin */}
        <Dialog open={isGenderDialogOpen} onOpenChange={setIsGenderDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Pilih Jenis Kelamin</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Sesuaikan jenis kelamin untuk rekomendasi promo yang lebih tepat.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-2">
              {[
                { value: "L", label: "Laki-laki" },
                { value: "P", label: "Perempuan" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTempGender(item.value)}
                  className={cn(
                    "w-full h-12 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all",
                    tempGender === item.value
                      ? "border-[#00AA5B] bg-[#00AA5B]/5 text-[#00AA5B] shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/50"
                  )}
                >
                  <span>{item.label}</span>
                  {tempGender === item.value && <Check className="w-4 h-4 text-[#00AA5B]" />}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenderDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  await handleSaveField("gender", tempGender);
                  setIsGenderDialogOpen(false);
                }}
                disabled={isSaving || !tempGender}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Ubah Tanggal Lahir */}
        <Dialog open={isBirthDialogOpen} onOpenChange={setIsBirthDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Pilih Tanggal Lahir</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Tanggal lahir digunakan untuk promo hari ulang tahun khusus pembeli.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 ml-0.5">Tanggal Lahir</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={tempDay}
                  onChange={(e) => setTempDay(e.target.value)}
                  className="h-11 px-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] focus:ring-1 focus:ring-[#00AA5B] transition-all cursor-pointer"
                >
                  <option value="">Hari</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={String(d)}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={tempMonth}
                  onChange={(e) => setTempMonth(e.target.value)}
                  className="h-11 px-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] focus:ring-1 focus:ring-[#00AA5B] transition-all cursor-pointer"
                >
                  <option value="">Bulan</option>
                  {MONTHS.map((m, idx) => (
                    <option key={idx + 1} value={String(idx + 1)}>
                      {m.substring(0, 3)}
                    </option>
                  ))}
                </select>

                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(e.target.value)}
                  className="h-11 px-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] focus:ring-1 focus:ring-[#00AA5B] transition-all cursor-pointer"
                >
                  <option value="">Tahun</option>
                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 10 - i).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBirthDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!tempDay || !tempMonth || !tempYear) {
                    toast({
                      variant: "destructive",
                      title: "Lengkapi Tanggal",
                      description: "Silakan pilih hari, bulan, dan tahun lahir Anda.",
                    });
                    return;
                  }
                  const formatted = `${tempDay} ${MONTHS[parseInt(tempMonth, 10) - 1]} ${tempYear}`;
                  await handleSaveField("birthDate", formatted);
                  setIsBirthDialogOpen(false);
                }}
                disabled={isSaving}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Tutup Akun */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="font-bold text-base flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                Penutupan Akun
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Pengajuan penutupan akun MarketPointID secara permanen.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2.5 my-1">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <p className="font-bold">Perhatian Penting:</p>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  Penutupan akun bersifat permanen. Seluruh saldo dompet, riwayat pesanan, dan lisensi produk Anda tidak akan dapat dipulihkan kembali.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  toast({
                    title: "Permintaan Diajukan",
                    description: "Tim bantuan akan memverifikasi permohonan tutup akun Anda dalam 1x24 jam.",
                  });
                }}
                className="h-10 rounded-xl font-bold text-xs"
              >
                Tutup Akun
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
