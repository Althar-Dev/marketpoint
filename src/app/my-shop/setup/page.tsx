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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Store, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft,
  LayoutGrid,
  Coins
} from "lucide-react";
import Link from "next/link";

export default function MerchantSetupPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState("");
  const [shopDomain, setShopDomain] = useState("");
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
        domain: shopDomain.toLowerCase(),
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
      <MarketHeader />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-screen-md mx-auto px-4">
          {/* Top Breadcrumb & Nav */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/profile" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </Link>
            <div className="h-3 w-px bg-border mx-1" />
            <span className="text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase">Merchant Onboarding</span>
          </div>

          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground">Buka Toko Gratis</h1>
              <p className="text-xs text-muted-foreground">Lengkapi data di bawah untuk mulai berjualan solusi digital Anda.</p>
            </div>
            
            {/* Progress Stepper */}
            <div className="flex items-center gap-2">
               {[1, 2].map((s) => (
                 <div key={s} className="flex items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                      step >= s ? "bg-[#00AA5B] border-[#00AA5B] text-white" : "bg-white border-border text-muted-foreground"
                    )}>
                      {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                    </div>
                    {s === 1 && <div className={cn("w-10 h-0.5 mx-1", step > 1 ? "bg-[#00AA5B]" : "bg-border")} />}
                 </div>
               ))}
            </div>
          </div>

          <Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-8 md:p-10">
              {step === 1 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-6">
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

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Domain / URL Toko</Label>
                      <div className="relative">
                        <Input 
                          placeholder="sts-digital"
                          value={shopDomain}
                          onChange={(e) => setShopDomain(e.target.value.replace(/\s+/g, '-'))}
                          className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all font-medium text-sm pr-[120px]"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground pointer-events-none">
                          .marketpoint.id
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground px-1">Domain ini akan menjadi alamat unik toko Anda.</p>
                    </div>
                  </div>

                  <Button 
                    disabled={!shopName || !shopDomain}
                    onClick={() => setStep(2)}
                    className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm shadow-lg shadow-[#00AA5B]/10 group"
                  >
                    Lanjut ke Informasi Detail <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Deskripsi Toko</Label>
                      <Textarea 
                        placeholder="Jelaskan jenis solusi digital atau API yang Anda tawarkan..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[120px] rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-start gap-3">
                       <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                       <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#166534]">Syarat & Ketentuan Merchant</p>
                          <p className="text-[10px] text-[#166534]/70 leading-relaxed">
                            Dengan menekan tombol di bawah, Anda setuju dengan kebijakan penjual MarketPoint. Pastikan produk digital Anda legal dan memiliki lisensi yang tepat.
                          </p>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setStep(1)}
                      className="h-11 rounded-xl font-bold text-sm order-2 md:order-1"
                    >
                      Kembali
                    </Button>
                    <Button 
                      disabled={!description || isSubmitting}
                      onClick={handleCreateShop}
                      className="flex-1 h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm shadow-lg shadow-[#00AA5B]/10 order-1 md:order-2"
                    >
                      {isSubmitting ? "Sedang Memproses..." : "Aktifkan Toko Sekarang"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { title: "Komisi Rendah", desc: "Nikmati potongan biaya admin terkecil di industri.", icon: Coins },
               { title: "Dashboard Intuitif", desc: "Kelola pesanan dan inventaris dengan sangat mudah.", icon: LayoutGrid },
               { title: "Jangkauan Luas", desc: "Hubungkan produk Anda ke ribuan pembeli aktif.", icon: MapPin },
             ].map((item, i) => (
               <div key={i} className="flex flex-col items-center text-center space-y-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#00AA5B]" />
                  </div>
                  <h3 className="text-[12px] font-bold">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
