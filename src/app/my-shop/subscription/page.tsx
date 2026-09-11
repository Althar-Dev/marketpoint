"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  Rocket,
  Crown,
  Loader2,
  Check,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    description: "Ideal untuk penjual berkembang yang ingin kuota lebih besar & fitur promo.",
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    icon: Zap,
    color: "text-[#00AA5B]",
    bgColor: "bg-green-50",
    borderColor: "border-border/50",
    features: [
      "Hingga 50 Produk",
      "Komisi Rendah",
      "Voucher Toko",
      "Flash Sale"
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
      "Hingga 100 Produk",
      "Komisi Lebih Rendah",
      "Voucher Toko",
      "Flash Sale",
      "Badge Verified",
      "Bot Telegram"
    ]
  },
  {
    id: "prime",
    name: "Prime",
    description: "Solusi tanpa batas untuk merchant skala besar, API reseller & prioritas support.",
    monthlyPrice: 149000,
    yearlyPrice: 1490000,
    icon: Crown,
    color: "text-[#00AA5B]",
    bgColor: "bg-green-50",
    borderColor: "border-border/50",
    features: [
      "Unlimited Produk",
      "Komisi Sangat Rendah",
      "Voucher Toko",
      "Flash Sale",
      "Badge Official",
      "Bot Telegram",
      "API Reseller",
      "Prioritas Support"
    ]
  }
];

export default function MerchantSubscriptionPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleOpenUpgradeModal = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirmSubscription = async () => {
    if (!user || !selectedPlan) return;

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
        title: "Berlangganan Berhasil!",
        description: `Toko Anda kini aktif pada Paket ${selectedPlan.name} (${billingCycle === "yearly" ? "Tahunan" : "Bulanan"}).`,
      });

      setShowConfirmModal(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Berlangganan",
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

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="bg-white border-border/50 text-[#00AA5B] font-medium text-[9px] md:text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3 mr-1 text-[#00AA5B]" />
            Paket Berlangganan Toko
          </Badge>
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121]">Pilih Paket Fitur Toko Anda</h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Tingkatkan batas produk, aktifkan voucher toko, flash sale, hingga otomatisasi Bot Telegram & API Reseller.
          </p>

          {/* Billing Cycle Toggle */}
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

        {/* Pricing Cards Grid */}
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
                      POPULER
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
                  <p className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Fitur Paket {plan.name}:</p>
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
                    onClick={() => handleOpenUpgradeModal(plan)}
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
                    {isActive ? "Paket Toko Aktif" : `Pilih Paket ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Info Guarantee Section */}
        <div className="pt-2">
          <Card className="border border-border/50 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[11px] md:text-[12px] font-medium text-[#212121]">Aman & Transparan</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5">
                    Tidak ada biaya tambahan tersembunyi. Akses fitur langsung aktif begitu proses konfirmasi selesai.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="rounded-lg text-[10px] font-medium h-8 px-3 border-border/50 bg-white">
                  Butuh Bantuan?
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Modal Dialog Konfirmasi Upgrade / Berlangganan */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md rounded-xl md:rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xs md:text-sm font-medium text-[#212121]">
              Konfirmasi Paket {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription className="text-[9px] md:text-[10px] text-muted-foreground font-medium">
              Aktifkan paket berlangganan toko Anda untuk menikmati fitur pilihan.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-border/50 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-medium">
                  <span className="text-muted-foreground">Paket Pilihan:</span>
                  <span className="text-[#212121] font-bold">Paket {selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-medium">
                  <span className="text-muted-foreground">Siklus Penagihan:</span>
                  <span className="text-[#00AA5B] font-bold">
                    {billingCycle === "yearly" ? "Tahunan (Hemat 2 Bulan)" : "Bulanan"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-medium pt-2 border-t border-border/40">
                  <span className="text-[#212121] font-bold">Total Biaya:</span>
                  <span className="text-sm font-bold text-[#00AA5B]">
                    Rp {(billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Fitur yang akan diaktifkan:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedPlan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-medium text-[#2E3137]">
                      <Check className="w-3 h-3 text-[#00AA5B] shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="rounded-lg text-[10px] font-medium h-8 px-3 border-border/50">
              Batal
            </Button>
            <Button
              onClick={handleConfirmSubscription}
              disabled={isSubmitting}
              className="rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-[10px] h-8 px-3 gap-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Aktifkan Berlangganan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
