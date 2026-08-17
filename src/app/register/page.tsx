
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      router.push("/client");
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
          <p className="text-sm font-medium opacity-90 max-w-sm">Daftar sekarang dan bergabunglah dengan ribuan pengembang yang membangun masa depan digital.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-muted/10">
        <Card className="w-full max-w-[400px] shadow-none border-border rounded-2xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="flex justify-center mb-4">
              <img src="/assets/img/logo.png" alt="MarketPoint Logo" className="h-10 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">Buat Akun Baru</CardTitle>
            <CardDescription>Bergabunglah dengan ekosistem infrastruktur digital terbaik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
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
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold mt-2"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-medium">Atau daftar dengan</span>
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
            Sudah punya akun?{" "}
            <Link href="/login" className="ml-1 font-bold text-[#00AA5B] hover:underline">
              Masuk
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
