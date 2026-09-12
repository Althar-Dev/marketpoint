"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Rocket,
  Crown,
  Loader2,
  Check,
  Sparkles,
  ChevronLeft,
  CreditCard,
  Wallet,
  ArrowRight,
  Landmark,
  QrCode,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PlanItem {
  id: "plus" | "pro" | "prime";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
  features: string[];
}

const PLANS: PlanItem[] = [
  {
    id: "plus",
    name: "Plus",
    description: "Ideal untuk penjual berkembang yang ingin kuota lebih besar dan fitur promo.",
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    icon: Zap,
    color: "text-[#00AA5B]",
    bgColor: "bg-green-50",
    borderColor: "border-border/50",
    features: [
      "Hingga 50 produk",
      "Komisi rendah",
      "Voucher toko",
      "Flash sale"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Paling populer untuk merchant profesional dengan bot otomatisasi Telegram.",
    monthlyPrice: 49000,
    yearlyPrice: 490000,
    icon: Rocket,
    color: "text-[#00AA5B]",
    bgColor: "bg-green-50",
    borderColor: "border-border/50",
    popular: true,
    features: [
      "Hingga 100 produk",
      "Komisi lebih rendah",
      "Voucher toko",
      "Flash sale",
      "Badge verified",
      "Bot Telegram"
    ]
  },
  {
    id: "prime",
    name: "Prime",
    description: "Solusi tanpa batas untuk merchant skala besar, API reseller dan prioritas support.",
    monthlyPrice: 149000,
    yearlyPrice: 1490000,
    icon: Crown,
    color: "text-[#00AA5B]",
    bgColor: "bg-green-50",
    borderColor: "border-border/50",
    features: [
      "Unlimited produk",
      "Komisi sangat rendah",
      "Voucher toko",
      "Flash sale",
      "Badge official",
      "Bot Telegram",
      "API reseller",
      "Prioritas support"
    ]
  }
];

const PAYMENT_CATEGORIES = [
  {
    id: "bank_transfer",
    label: "BANK TRANSFER",
    icon: Landmark,
    logos: ["bsi", "bca", "bni", "bri", "mandiri", "permata", "bjb", "cimb", "bss"],
    previewCount: 3
  },
  {
    id: "retail_outlet",
    label: "RETAIL OUTLET",
    icon: Store,
    logos: ["alfamart", "indomaret"],
    previewCount: 2
  },
  {
    id: "e_wallet",
    label: "E-WALLET",
    icon: Wallet,
    logos: ["gopay", "ovo", "linkaja"],
    previewCount: 2
  },
  {
    id: "qr_payments",
    label: "QR PAYMENTS",
    icon: QrCode,
    logos: ["qris"],
    previewCount: 1
  }
];

export default function MerchantSubscriptionPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"plans" | "checkout">("plans");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  const activeSubscription = shop?.subscription || {
    planId: "free",
    planName: "Gratis",
    billingCycle: "monthly",
    maxProducts: 10,
    status: "ACTIVE"
  };

  const handleSelectPlan = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setView("checkout");
  };

  const handleConfirmSubscription = async () => {
    if (!user || !selectedPlan) return;

    if (!selectedMethod) {
      toast({ variant: "destructive", title: "Pilih Pembayaran", description: "Silakan pilih salah satu metode pembayaran terlebih dahulu." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: user.uid,
          planId: selectedPlan.id,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses paket berlangganan.");
      }

      toast({
        title: "Berlangganan berhasil",
        description: `Toko Anda kini aktif pada paket ${selectedPlan.name} (${billingCycle === "yearly" ? "tahunan" : "bulanan"}).`,
      });

      setView("plans");
      setSelectedPlan(null);
      setSelectedMethod(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal berlangganan",
        description: err.message || "Terjadi kesalahan saat memproses.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-3 md:p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <Skeleton className="h-6 w-36 rounded-lg mx-auto" />
          <Skeleton className="h-4 w-56 rounded-md mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (view === "checkout" && selectedPlan) {
    const priceDisplay = billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
    
    return (
      <main className="p-3 md:p-6 lg:p-8 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-4xl mx-auto space-y-5 md:space-y-6">
          <button 
            onClick={() => setView("plans")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-[#00AA5B] transition-colors text-[10px] md:text-[11px] font-bold group"
          >
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Kembali pilih paket
          </button>

          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121]">Checkout Berlangganan</h2>
            <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">Selesaikan pembayaran untuk mengaktifkan fitur toko Anda.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
            <div className="lg:col-span-7 space-y-5">
               <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl overflow-hidden bg-white">
                 <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/30">
                    <CardTitle className="text-[11px] md:text-[12px] font-bold">Pilih Metode Pembayaran</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {/* Saldo MarketPoint (Internal) */}
                      <AccordionItem value="wallet" className="border-b border-border/40 px-4 md:px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3">
                            <Wallet className="w-4 h-4 text-[#8B5CF6]" />
                            <span className="text-[10px] font-black tracking-wider text-[#2E3137]">SALDO MARKETPOINT</span>
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                             <span className="text-[9px] font-bold text-muted-foreground">Rp 0</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                           <div className="p-4 rounded-xl border border-dashed border-border bg-slate-50/50 text-center">
                              <p className="text-[10px] text-muted-foreground font-medium">Saldo Anda tidak mencukupi untuk melakukan transaksi ini.</p>
                           </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Payment Categories from Design */}
                      {PAYMENT_CATEGORIES.map((cat) => (
                        <AccordionItem key={cat.id} value={cat.id} className="border-b border-border/40 px-4 md:px-6 last:border-0">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3">
                              <cat.icon className="w-4 h-4 text-[#8B5CF6]" />
                              <span className="text-[10px] font-black tracking-wider text-[#2E3137]">{cat.label}</span>
                            </div>
                            <div className="flex items-center gap-2.5 mr-2 ml-auto overflow-hidden">
                               {cat.logos.slice(0, cat.previewCount).map((logo) => (
                                 <img key={logo} src={`/assets/payments/${logo}.png`} alt={logo} className="h-4 w-auto object-contain opacity-80" />
                               ))}
                               {cat.logos.length > cat.previewCount && (
                                 <span className="text-[9px] font-bold text-muted-foreground">+{cat.logos.length - cat.previewCount}</span>
                               )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5">
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {cat.logos.map((logo) => (
                                  <button 
                                    key={logo} 
                                    onClick={() => setSelectedMethod(logo)}
                                    className={cn(
                                      "p-3 border rounded-xl flex items-center justify-center transition-all hover:bg-slate-50 group relative",
                                      selectedMethod === logo ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-2 ring-[#00AA5B]/10" : "border-border/60"
                                    )}
                                  >
                                    <img src={`/assets/payments/${logo}.png`} alt={logo} className="h-7 sm:h-8 w-auto object-contain" />
                                    {selectedMethod === logo && (
                                      <div className="absolute -top-1 -right-1 bg-[#00AA5B] text-white rounded-full p-0.5">
                                        <Check className="w-2 h-2 stroke-[4]" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                             </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                 </CardContent>
                 <CardFooter className="p-4 md:p-5 border-t border-border/40 bg-slate-50/20">
                    <Button 
                      onClick={handleConfirmSubscription}
                      disabled={isSubmitting || !selectedMethod}
                      className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10 transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Bayar dan Aktifkan Sekarang
                    </Button>
                 </CardFooter>
               </Card>

               <div className="p-4 rounded-xl md:rounded-2xl bg-[#FFC400]/5 border border-[#FFC400]/20 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#FFC400] shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Paket akan langsung aktif setelah konfirmasi pembayaran berhasil dilakukan secara otomatis oleh sistem kami.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/30">
                  <CardTitle className="text-[11px] md:text-[12px] font-bold">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-5 space-y-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0 border border-green-100">
                      <selectedPlan.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#212121]">Paket {selectedPlan.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Aktif untuk {billingCycle === "yearly" ? "1 tahun" : "1 bulan"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-bold text-[#00AA5B]">Rp {priceDisplay.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-5 border-t border-border/40">
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                      <span>Harga paket</span>
                      <span className="text-[#212121] font-bold">Rp {priceDisplay.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                      <span>Pajak layanan</span>
                      <span className="text-[#212121] font-bold">Rp 0</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/40">
                      <span className="text-[11px] font-bold text-[#212121]">Total pembayaran</span>
                      <span className="text-base font-black text-[#00AA5B]">Rp {priceDisplay.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="bg-white border-border/50 text-[#00AA5B] font-medium text-[9px] md:text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3 mr-1 text-[#00AA5B]" />
            Paket berlangganan toko
          </Badge>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121]">Pilih paket fitur toko Anda</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Tingkatkan batas produk, aktifkan voucher toko, flash sale, hingga otomatisasi bot Telegram dan API reseller.
          </p>

          <div className="flex items-center justify-center pt-3">
            <div className="bg-white p-1 rounded-xl border border-border/50 shadow-sm flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-[#00AA5B] text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-medium transition-all flex items-center gap-1.5",
                  billingCycle === "yearly"
                    ? "bg-[#00AA5B] text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Tahunan</span>
                <span className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                  billingCycle === "yearly" ? "bg-white text-[#00AA5B]" : "bg-green-100 text-green-800"
                )}>
                  HEMAT 2 BULAN
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-stretch">
          {PLANS.map((plan) => {
            const isActive = activeSubscription.planId === plan.id;
            const priceDisplay = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const PlanIcon = plan.icon;

            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative flex flex-col border-border/50 transition-all duration-200 rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-sm",
                  plan.popular ? "border-[#00AA5B]/50 ring-1 ring-[#00AA5B]/20" : "hover:border-border"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#00AA5B] text-white text-[8px] md:text-[9px] font-bold px-3 py-1 rounded-bl-xl">
                      Populer
                    </div>
                  </div>
                )}

                <CardHeader className="p-5 pb-0 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                      <PlanIcon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm md:text-base font-medium text-[#212121]">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-[9px] md:text-[10px] text-muted-foreground font-medium min-h-[32px]">{plan.description}</CardDescription>
                  <div className="pt-2 border-b border-border/40 pb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Rp</span>
                      <span className="text-lg md:text-xl font-bold tracking-tight text-[#212121]">{priceDisplay.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground">/{billingCycle === "yearly" ? "tahun" : "bulan"}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-[8px] md:text-[9px] font-medium text-[#00AA5B] mt-0.5">
                        Setara Rp {Math.round(plan.yearlyPrice / 12).toLocaleString('id-ID')}/bulan
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex-1 space-y-3">
                  <p className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Fitur paket {plan.name}:</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-[#00AA5B] stroke-[3]" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-medium text-[#2E3137]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto">
                  <Button 
                    onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      "w-full h-8 rounded-lg font-bold text-[10px] md:text-[11px] transition-all shadow-sm",
                      isActive 
                        ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-default hover:bg-slate-100" 
                        : plan.popular
                        ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-sm"
                        : "bg-white hover:bg-slate-50 border border-border/60 text-[#212121]"
                    )}
                    disabled={isActive}
                  >
                    {isActive ? "Paket toko aktif" : `Pilih paket ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="pt-2">
          <Card className="border border-border/50 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[11px] md:text-[12px] font-medium text-[#212121]">Aman dan transparan</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5">
                    Tidak ada biaya tambahan tersembunyi. Akses fitur langsung aktif begitu proses konfirmasi selesai.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="rounded-lg text-[10px] font-medium h-8 px-3 border-border/50 bg-white">
                  Butuh bantuan?
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
