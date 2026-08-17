"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

declare global {
  interface Window {
    google: any;
  }
}

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.initialize({
        client_id: "393407803323-3s0pbm02sn3k9hiigo3o97k88efi69gd.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-btn"),
        { 
          theme: "outline", 
          size: "large", 
          width: "400", 
          text: "signup_with",
          shape: "rectangular"
        }
      );
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(response.credential);
      await signInWithCredential(auth, credential);
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Daftar Google",
        description: error.message || "Terjadi kesalahan saat mendaftar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({
        title: "Akun Berhasil Dibuat",
        description: "Selamat bergabung di MarketPoint!",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mendaftar",
        description: error.message || "Terjadi kesalahan saat membuat akun.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-body">
      <div className="hidden lg:flex lg:w-1/2 -mt-56 relative bg-[#E8F4FD] items-center justify-center p-12 overflow-hidden">
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
        <div className="absolute bottom-32 left-12 right-12 xl:bottom-40 xl:left-20 xl:right-20 space-y-3 text-black">
          <h2 className="text-3xl xl:text-4xl font-black font-headline tracking-tighter">MarketPoint</h2>
          <p className="text-sm xl:text-base font-medium opacity-70 max-w-md leading-relaxed">
            Bangun solusi digital Anda dengan infrastruktur yang handal dan skalabel.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/assets/img/logo.png" alt="MarketPoint Logo" className="h-8 w-auto" />
              <div className="h-5 w-px bg-border mx-1" />
              <span className="text-[10px] font-black tracking-widest text-muted-foreground/50">DAFTAR</span>
            </div>
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">Mulai Perjalanan</h1>
            <p className="text-muted-foreground text-xs font-medium">Buat akun MarketPoint sekarang secara gratis.</p>
          </div>
          
          <div className="space-y-5">
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold tracking-wider text-muted-foreground/70">NAMA LENGKAP</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-10 bg-muted/30 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm"
                />
              </div>
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
                <Label htmlFor="password" className="text-[10px] font-bold tracking-wider text-muted-foreground/70">KATA SANDI</Label>
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
                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[#00AA5B]/10 mt-3"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar Akun Gratis"}
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[9px] font-bold tracking-widest">
                <span className="bg-white px-3 text-muted-foreground">ATAU DAFTAR DENGAN</span>
              </div>
            </div>

            <div id="google-signup-btn" className="w-full min-h-[40px] flex justify-center overflow-hidden rounded-xl"></div>
          </div>
          
          <div className="pt-5 border-t border-border flex justify-center">
            <p className="text-xs text-muted-foreground font-medium">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-[#00AA5B] hover:underline">
                Masuk Disini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}