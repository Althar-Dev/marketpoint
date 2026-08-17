"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const triggerGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Gagal Masuk Google",
          description: error.message || "Terjadi kesalahan saat masuk.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: error.message || "Email atau password salah.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-body">
      <div className="hidden lg:flex lg:w-1/2 -mt-32 relative bg-[#E8F4FD] items-center justify-center p-12 overflow-hidden">
        <div className="relative w-full h-full max-w-lg transition-transform hover:scale-105 duration-700">
          <Image 
            src="/assets/img/auth.png" 
            alt="MarketPoint Auth Illustration" 
            fill 
            className="object-contain"
            priority
            data-ai-hint="auth illustration"
          />
        </div>
        <div className="absolute bottom-12 left-12 right-12 xl:bottom-20 xl:left-20 xl:right-20 space-y-3 text-black">
          <h2 className="text-3xl xl:text-4xl font-black font-headline tracking-tighter">MarketPoint</h2>
          <p className="text-sm xl:text-base font-medium opacity-70 max-w-md leading-relaxed">
            Jelajahi ekosistem infrastruktur digital dan API terlengkap untuk pertumbuhan bisnis Anda.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/assets/img/logo.png" alt="MarketPoint Logo" className="h-8 w-auto" />
              <div className="h-5 w-px bg-border mx-1" />
              <span className="text-[10px] font-black tracking-widest text-muted-foreground/50">MASUK</span>
            </div>
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">Selamat Datang</h1>
            <p className="text-muted-foreground text-xs font-medium">Masuk ke dashboard MarketPoint Anda sekarang.</p>
          </div>
          
          <div className="space-y-5">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold tracking-wider text-muted-foreground/70">ALAMAT EMAIL</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@perusahaan.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-10 bg-muted/30 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold tracking-wider text-muted-foreground/70">KATA SANDI</Label>
                  <Link href="#" className="text-[10px] text-[#00AA5B] font-bold hover:underline">Lupa Sandi?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-10 bg-muted/30 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[#00AA5B]/10 mt-2"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk Sekarang"}
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[9px] font-bold tracking-widest">
                <span className="bg-white px-3 text-muted-foreground">ATAU</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={triggerGoogleSignIn}
              disabled={loading}
              className="w-full h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-border hover:bg-muted/50 transition-all active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Masuk Dengan Google
            </Button>
          </div>
          
          <div className="pt-5 border-t border-border flex justify-center">
            <p className="text-xs text-muted-foreground font-medium">
              Baru di MarketPoint?{" "}
              <Link href="/register" className="font-bold text-[#00AA5B] hover:underline">
                Daftar Akun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
