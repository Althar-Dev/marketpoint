"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: error.message || "Terjadi kesalahan saat masuk dengan Google.",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-body">
      {/* Left Side: Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 -mt-48 relative bg-[#E8F4FD] items-center justify-center p-12 xl:p-20 overflow-hidden">
        <div className="relative w-full h-full max-w-lg transition-transform hover:scale-105 duration-700">
          <Image 
            src="/assets/img/auth.png" 
            alt="MarketPoint Auth Illustration" 
            fill 
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute bottom-32 left-12 right-12 xl:bottom-40 xl:left-20 xl:right-20 space-y-3 text-black">
          <h2 className="text-3xl xl:text-4xl font-black font-headline tracking-tighter">MarketPoint</h2>
          <p className="text-sm xl:text-base font-medium opacity-70 max-w-md leading-relaxed">
            Bangun solusi digital Anda dengan infrastruktur yang handal dan skalabel.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00AA5B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#00AA5B]/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-[400px] space-y-6 md:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/assets/img/logo.png" alt="MarketPoint Logo" className="h-8 md:h-9 w-auto" />
              <div className="h-5 w-px bg-border mx-1" />
              <span className="text-[10px] font-black tracking-widest text-muted-foreground/50">Daftar</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-foreground">Mulai Perjalanan</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">Buat akun MarketPoint sekarang secara gratis.</p>
          </div>
          
          <div className="space-y-5">
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold  tracking-wider text-muted-foreground/70">Nama Lengkap</Label>
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
                <Label htmlFor="email" className="text-[10px] font-bold  tracking-wider text-muted-foreground/70">Alamat Email</Label>
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
                <Label htmlFor="password" className="text-[10px] font-bold  tracking-wider text-muted-foreground/70">Kata Sandi</Label>
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
              <div className="relative flex justify-center text-[9px] font-bold  tracking-widest">
                <span className="bg-white px-3 text-muted-foreground">Atau Daftar Dengan</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-10 rounded-xl font-bold border-border hover:bg-muted/50 transition-all active:scale-95 flex items-center justify-center gap-2.5 text-sm" 
              onClick={handleGoogleSignIn}
            >
              <Icon icon="logos:google-icon" className="h-4 w-4" />
              Akun Google
            </Button>
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
