"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Check,
} from "lucide-react";

type Step = "input_email" | "input_code" | "new_password" | "success";

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input_email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification Session states
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [authorizedToken, setAuthorizedToken] = useState("");

  // Loading & Timer states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // STEP 1: Check Email & Send Verification Code
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Alamat email tidak boleh kosong.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage("Format alamat email tidak valid.");
      return;
    }

    // Jika user sedang login, pastikan email cocok dengan akun yang sedang aktif
    if (user?.email && user.email.toLowerCase() !== cleanEmail) {
      setErrorMessage("Alamat email tidak sesuai dengan akun yang sedang login saat ini.");
      toast({
        variant: "destructive",
        title: "Email Tidak Sesuai",
        description: "Alamat email harus sesuai dengan akun MarketPointID Anda yang sedang aktif.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Kirim kode verifikasi via API no-reply@marketpoint.id
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirimkan kode verifikasi.");
      }

      setToken(data.token);
      setExpiresAt(data.expiresAt);
      setCountdown(60); // 60s cooldown for resend
      setStep("input_code");

      toast({
        title: "Kode Verifikasi Terkirim",
        description: `Kode keamanan telah dikirimkan ke ${cleanEmail}.`,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memeriksa email atau mengirim kode.");
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Kode",
        description: err.message || "Terjadi kesalahan jaringan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify Code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage("Harap masukkan 6 digit kode verifikasi dengan benar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          token,
          expiresAt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kode verifikasi salah atau telah kedaluwarsa.");
      }

      setAuthorizedToken(data.authorizedToken);
      setStep("new_password");
      toast({
        title: "Verifikasi Berhasil",
        description: "Silakan masukkan kata sandi baru untuk akun Anda.",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Kode verifikasi tidak valid.");
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: err.message || "Kode verifikasi salah atau kedaluwarsa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Save New Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Jika user sedang aktif login dengan akun yang sama
      if (user && user.email?.toLowerCase() === email.trim().toLowerCase()) {
        await updatePassword(user, newPassword);
        try {
          await updateDoc(doc(db, "users", user.uid), {
            hasPassword: true,
            passwordUpdatedAt: new Date().toISOString(),
          });
        } catch {}
      }

      setStep("success");

      // Kirim email notifikasi keamanan kata sandi via no-reply@marketpoint.id
      fetch("/api/auth/send-security-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          displayName: user?.displayName || "Pengguna",
          eventType: "password_changed",
        }),
      }).catch((alertErr) => {
        console.warn("Could not dispatch password change alert email:", alertErr);
      });

      toast({
        title: "Kata Sandi Berhasil Diperbarui",
        description: "Kata sandi akun MarketPointID Anda telah berhasil diganti.",
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setErrorMessage("Sesi keamanan Anda telah berakhir. Silakan login ulang terlebih dahulu demi keamanan akun.");
      } else {
        setErrorMessage(err.message || "Gagal memperbarui kata sandi. Silakan coba lagi.");
      }
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Kata Sandi",
        description: err.message || "Terjadi kesalahan saat menyimpan kata sandi baru.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormContent = () => (
    <>
      {/* Step Indicators */}
      {step !== "success" && (
        <div className="flex items-center justify-between mb-7 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === "input_email"
                  ? "bg-[#00AA5B] text-white shadow-xs"
                  : "bg-emerald-50 text-[#00AA5B] border border-emerald-200"
              }`}
            >
              {step !== "input_email" ? <Check className="w-3.5 h-3.5" /> : "1"}
            </div>
            <span
              className={`text-xs ${
                step === "input_email" ? "text-foreground font-bold" : "text-muted-foreground font-medium"
              }`}
            >
              Email
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-border/60 mx-2.5 sm:mx-3" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === "input_code"
                  ? "bg-[#00AA5B] text-white shadow-xs"
                  : step === "new_password"
                  ? "bg-emerald-50 text-[#00AA5B] border border-emerald-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step === "new_password" ? <Check className="w-3.5 h-3.5" /> : "2"}
            </div>
            <span
              className={`text-xs ${
                step === "input_code" ? "text-foreground font-bold" : "text-muted-foreground font-medium"
              }`}
            >
              Kode
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-border/60 mx-2.5 sm:mx-3" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === "new_password"
                  ? "bg-[#00AA5B] text-white shadow-xs"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              3
            </div>
            <span
              className={`text-xs ${
                step === "new_password" ? "text-foreground font-bold" : "text-muted-foreground font-medium"
              }`}
            >
              Sandi
            </span>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-red-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: INPUT EMAIL */}
      {step === "input_email" && (
        <div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Ubah Kata Sandi</h1>
          <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
            Masukkan alamat email akun MarketPointID Anda. Kami akan memeriksa ketersediaan akun dan mengirimkan kode verifikasi 6 digit.
          </p>

          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#212121]">
                Alamat Email Akun
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 pl-10 rounded-xl text-xs font-medium border-border/80 focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm shadow-[#00AA5B]/20 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memeriksa Email & Mengirim Kode...
                </>
              ) : (
                "Kirim Kode Verifikasi"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* STEP 2: INPUT VERIFICATION CODE */}
      {step === "input_code" && (
        <div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Masukkan Kode Verifikasi</h1>
          <p className="text-xs text-muted-foreground mt-1 mb-2 leading-relaxed">
            Kode verifikasi 6 digit telah dikirimkan ke:
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-foreground mb-6">
            <span>{email}</span>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold text-[#212121]">
                Kode Verifikasi (6 Digit)
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Contoh: 123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                required
                className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.3em] font-extrabold border-border/80 focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm shadow-[#00AA5B]/20 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Verifikasi & Lanjutkan"
              )}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("input_email");
                  setCode("");
                  setErrorMessage("");
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Ubah Email
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isSubmitting}
                onClick={() => handleSendCode()}
                className={`text-xs font-bold transition-colors ${
                  countdown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-[#00AA5B] hover:underline"
                }`}
              >
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : "Kirim Ulang Kode"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: CREATE NEW PASSWORD */}
      {step === "new_password" && (
        <div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Buat Kata Sandi Baru</h1>
          <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
            Masukkan kata sandi baru untuk akun Anda. Pastikan menggunakan minimal 6 karakter.
          </p>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-bold text-[#212121]">
                Kata Sandi Baru
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-10 pr-10 rounded-xl text-xs font-medium border-border/80 focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-[#212121]">
                Konfirmasi Kata Sandi Baru
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10 pr-10 rounded-xl text-xs font-medium border-border/80 focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm shadow-[#00AA5B]/20 transition-all active:scale-[0.99] mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan Kata Sandi...
                </>
              ) : (
                "Simpan Kata Sandi Baru"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === "success" && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#00AA5B] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Kata Sandi Berhasil Diubah!</h1>
          <p className="text-xs text-muted-foreground mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
            Kata sandi akun MarketPointID Anda telah berhasil diperbarui. Anda sekarang dapat menggunakan kata sandi baru ini untuk masuk ke akun Anda.
          </p>

          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => router.push("/settings/security")}
              className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shadow-sm shadow-[#00AA5B]/20"
            >
              Kembali ke Pengaturan Keamanan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full h-10 rounded-xl text-xs font-bold border-border/80"
            >
              Menuju Beranda
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 1. DEDICATED MOBILE VIEW (Tokopedia / Shopee Style App Bar, Full Width) */}
      <div className="block md:hidden min-h-screen bg-white font-body text-[#212121]">
        {/* Sticky Mobile Top App Bar */}
        <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white border-b border-border/50 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-[#212121]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Ubah Kata Sandi</h1>
        </header>

        {/* Mobile Page Content - Native Full Width, No Boxed Card */}
        <main className="p-5 max-w-md mx-auto">
          {renderFormContent()}
        </main>
      </div>

      {/* 2. DEDICATED DESKTOP VIEW (Centered Card, No Marketplace Header/Footer) */}
      <div className="hidden md:flex min-h-screen bg-[#F8FAFC] flex-col justify-center items-center p-6 font-body text-[#212121]">
        <div className="w-full max-w-md my-auto">
          {/* Brand Logo & Back navigation */}
          <div className="flex items-center justify-between mb-5 px-1">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <img src="/assets/img/logo.png" alt="MarketPointID Logo" className="h-7 w-auto object-contain" />
              <div className="h-4 w-px bg-border mx-0.5" />
              <span className="text-[11px] font-black tracking-widest text-muted-foreground/60 uppercase">KEAMANAN</span>
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#00AA5B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </button>
          </div>

          <Card className="border border-border/60 shadow-xs bg-white rounded-2xl overflow-hidden p-8">
            {renderFormContent()}
          </Card>
        </div>
      </div>
    </>
  );
}
