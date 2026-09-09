"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Star, 
  Rocket, 
  Crown,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "plus",
    name: "Plus",
    description: "Ideal untuk penjual baru yang ingin mulai berkembang.",
    price: 49000,
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    btnVariant: "outline" as const,
    features: [
      "Hingga 20 Produk Digital",
      "Statistik Penjualan Dasar",
      "Komisi Transaksi 2%",
      "Penarikan Dana Manual",
      "Badge Toko Standard"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pilihan terpopuler untuk merchant profesional.",
    price: 149000,
    icon: Rocket,
    color: "text-[#00AA5B]",
    bgColor: "bg-[#00AA5B]/5",
    borderColor: "border-[#00AA5B]/20",
    btnVariant: "default" as const,
    popular: true,
    features: [
      "Hingga 100 Produk Digital",
      "Statistik Penjualan Mendalam",
      "Komisi Transaksi 1%",
      "WhatsApp Bot Automation",
      "Badge Official Verified",
      "Custom Voucher Toko"
    ]
  },
  {
    id: "prime",
    name: "Prime",
    description: "Solusi enterprise dengan kontrol penuh dan prioritas.",
    price: 499000,
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    btnVariant: "outline" as const,
    features: [
      "Unlimited Produk Digital",
      "Dedicated Account Manager",
      "Komisi Transaksi 0%",
      "API Custom Integration",
      "Prioritas Support 24/7",
      "Whitelist IP Address",
      "Akses Fitur Beta"
    ]
  }
];

export default function MerchantSubscriptionPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Dummy active plan for UI demonstration
  const activePlanId = "pro";

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-screen-xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-[#212121]">Pilih Paket Layanan</h2>
          <p className="text-sm text-muted-foreground font-medium">
            Tingkatkan kapabilitas toko Anda dengan fitur eksklusif yang dirancang untuk mempercepat pertumbuhan bisnis digital Anda.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border shadow-sm">
              <span className="text-[10px] font-bold text-foreground">Bulanan</span>
              <div className="w-8 h-4 rounded-full bg-[#00AA5B] relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">Tahunan</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-600 border-none text-[8px] font-black h-4 px-1.5 ml-1">HEMAT 20%</Badge>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isActive = plan.id === activePlanId;
            const PlanIcon = plan.icon;

            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative flex flex-col border-[1.5px] transition-all duration-300 rounded-[2rem] overflow-hidden group hover:shadow-xl",
                  isActive ? "border-[#00AA5B] shadow-lg shadow-[#00AA5B]/10 ring-4 ring-[#00AA5B]/5" : "border-border hover:border-[#00AA5B]/30"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-[#00AA5B] text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl">
                      POPULER
                    </div>
                  </div>
                )}

                <CardHeader className="p-8 pb-0 space-y-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", plan.bgColor, plan.color)}>
                    <PlanIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-black">{plan.name}</CardTitle>
                    <CardDescription className="text-xs font-medium leading-relaxed">{plan.description}</CardDescription>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-muted-foreground">Rp</span>
                      <span className="text-3xl font-black tracking-tighter">{plan.price.toLocaleString('id-ID')}</span>
                      <span className="text-xs font-bold text-muted-foreground">/bulan</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8 flex-1">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fitur Unggulan:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", isActive ? "text-[#00AA5B]" : "text-muted-foreground/40")} />
                          <span className="text-[11px] font-bold text-[#2E3137] leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 mt-auto">
                  <Button 
                    className={cn(
                      "w-full h-11 rounded-2xl font-black text-xs transition-all",
                      isActive 
                        ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-default" 
                        : "bg-white hover:bg-[#00AA5B] hover:text-white border-border text-[#212121]"
                    )}
                    variant={plan.btnVariant}
                    disabled={isActive}
                  >
                    {isActive ? "Paket Anda Saat Ini" : `Pilih Paket ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Comparison Section & FAQ Link */}
        <div className="pt-6 border-t border-border/50">
          <Card className="border-none bg-white/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#212121] flex items-center gap-2 justify-center md:justify-start">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                Keamanan & Transparansi
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium max-w-md">
                Tidak ada biaya tersembunyi. Anda dapat mengganti atau membatalkan langganan kapan saja melalui panel ini.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" className="text-[11px] font-black text-muted-foreground hover:text-[#00AA5B]">Bantuan</Button>
              <Button variant="ghost" className="text-[11px] font-black text-[#00AA5B] gap-2">
                Lihat Semua Detail Fitur <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Small Note */}
        <div className="text-center pb-10">
          <p className="text-[9px] text-muted-foreground font-medium">
            Harga belum termasuk PPN 11%. Dengan berlangganan, Anda menyetujui <span className="underline cursor-pointer">Ketentuan Layanan Merchant</span> kami.
          </p>
        </div>

      </div>
    </main>
  );
}
