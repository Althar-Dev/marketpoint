"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft,
  LayoutGrid,
  Coins,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function MerchantSetupPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleCreateShop = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const shopRef = doc(db, "shops", user.uid);
      await setDoc(shopRef, {
        name: shopName,
        category: category,
        description: description,
        ownerId: user.uid,
        status: "ACTIVE",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Toko Berhasil Dibuka",
        description: "Selamat! Toko Anda kini sudah aktif di MarketPoint.",
      });
      router.push("/profile");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Membuka Toko",
        description: "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body flex flex-col text-[#212121]">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>

      <main className="flex-1 pt-6 lg:pt-24 pb-20">
        <div className="max-w-screen-md mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/profile" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </Link>
            <div className="h-3 w-px bg-border mx-1" />
            <span className="text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase">Pendaftaran Merchant</span>
          </div>

          <div className="mb-8 space-y-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">Buka Toko Gratis</h1>
            <p className="text-xs text-muted-foreground">Isi informasi di bawah ini untuk mulai berjualan solusi digital Anda.</p>
          </div>

          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="grid gap-6">
                {/* Section 1: Nama Toko */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Nama Toko</Label>
                  <Input 
                    placeholder="Contoh: STS Digital Solutions"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all font-medium text-sm"
                  />
                  <p className="text-[9px] text-muted-foreground px-1">Gunakan nama yang profesional dan mudah diingat oleh pembeli.</p>
                </div>

                {/* Section 2: Kategori */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Kategori Solusi Digital</Label>
                  <Select onValueChange={setCategory}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm">
                      <SelectValue placeholder="Pilih Kategori..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="api" className="text-xs">API & SDK Bridge</SelectItem>
                      <SelectItem value="source" className="text-xs">Source Code & Template</SelectItem>
                      <SelectItem value="bot" className="text-xs">Bot & Automations</SelectItem>
                      <SelectItem value="ai" className="text-xs">AI & GenKit Modules</SelectItem>
                      <SelectItem value="tools" className="text-xs">Dev Tools & Plugins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Section 3: Deskripsi */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Deskripsi Toko</Label>
                  <Textarea 
                    placeholder="Jelaskan secara singkat jenis solusi digital atau keunggulan API yang Anda tawarkan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all font-medium text-sm resize-none"
                  />
                </div>
              </div>

              {/* Terms Checkbox Card */}
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                 <div className="space-y-1">
                    <p className="text-[11px] font-bold text-[#166534]">Verifikasi & Keamanan Merchant</p>
                    <p className="text-[10px] text-[#166534]/70 leading-relaxed">
                      Dengan membuka toko, Anda setuju untuk mematuhi kebijakan merchant MarketPoint. Pastikan semua produk digital Anda aman, legal, dan memiliki dokumentasi yang jelas.
                    </p>
                 </div>
              </div>

              <Button 
                disabled={!shopName || !category || !description || isSubmitting}
                onClick={handleCreateShop}
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm shadow-lg shadow-[#00AA5B]/10 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? "Sedang Memproses..." : "Aktifkan Toko Saya Sekarang"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
