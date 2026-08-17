
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/client");
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/client");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: error.message || "Terjadi kesalahan saat masuk dengan Google.",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Image (Desktop Only) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#F8F9FA]">
        <Image 
          src="/assets/img/auth.png" 
          alt="MarketPoint Auth" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white space-y-2">
          <h2 className="text-3xl font-black font-headline tracking-tighter">MarketPoint</h2>
          <p className="text-sm font-medium opacity-90 max-w-sm">Jelajahi ekosistem infrastruktur digital dan API terlengkap untuk kebutuhan bisnis Anda.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-muted/10">
        <Card className="w-full max-w-[400px] shadow-none border-border rounded-2xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="flex justify-center mb-4">
              <img src="/assets/img/logo.png" alt="MarketPoint Logo" className="h-10 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Selamat Datang</CardTitle>
            <CardDescription>Masuk ke akun MarketPoint Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-[#00AA5B] hover:underline">Lupa password?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-medium">Atau lanjutkan dengan</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-11 rounded-xl font-bold border-border" 
              onClick={handleGoogleSignIn}
            >
              <Icon icon="logos:google-icon" className="mr-2 h-4 w-4" />
              Google
            </Button>
          </CardContent>
          <CardFooter className="pb-8 flex justify-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="ml-1 font-bold text-[#00AA5B] hover:underline">
              Daftar
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
