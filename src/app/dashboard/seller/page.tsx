"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Coins,
  TrendingUp,
  Award
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardSellerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userRef);
  const hasShop = userData?.hasShop === true;

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Pusat Kemitraan Seller</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Jadilah bagian dari ekosistem kreator digital terbesar di Indonesia.</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-96 h-96 bg-[#00AA5B]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="bg-[#00AA5B] text-white border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1">Join the revolution</Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Punya Produk Digital? <br />
              <span className="text-[#00AA5B]">Jual di Sini.</span>
            </h1>
            <p className="text-sm md:text-lg text-slate-400 leading-relaxed max-w-lg">
              MarketPointID memberikan wadah bagi developer, desainer, dan penulis untuk menjangkau puluhan ribu pembeli aktif setiap harinya.
            </p>
            <div className="flex items-center gap-4 pt-4">
              {hasShop ? (
                <Link href="/my-shop">
                  <Button className="h-12 px-8 rounded-2xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-sm gap-2 shadow-xl shadow-[#00AA5B]/20">
                    <Store className="w-5 h-5" /> Kelola Toko Saya
                  </Button>
                </Link>
              ) : (
                <Link href="/my-shop/setup">
                  <Button className="h-12 px-8 rounded-2xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-sm gap-2 shadow-xl shadow-[#00AA5B]/20">
                    <Plus className="w-5 h-5" /> Buka Toko Gratis
                  </Button>
                </Link>
              )}
              <Link href="/about">
                <Button variant="ghost" className="h-12 px-6 rounded-2xl text-white hover:bg-white/10 font-bold text-sm gap-2 border border-white/10 backdrop-blur-md">
                  Pelajari Skema Bagi Hasil
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative aspect-square w-full max-w-md mx-auto">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#00AA5B] to-emerald-500 rounded-3xl rotate-6 opacity-20"></div>
             <img src="/assets/img/auth.png" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" alt="" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "100% Gratis", title: "Tanpa Biaya Daftar", desc: "Buka toko & upload produk tanpa biaya pendaftaran.", icon: Coins },
          { label: "Instan", title: "Otomasi Lisensi", desc: "Sistem pengiriman otomatis 24 jam nonstop.", icon: Zap },
          { label: "Aman", title: "Sistem Escrow", desc: "Dana ditahan aman sampai produk diterima pembeli.", icon: ShieldCheck },
          { label: "Handal", title: "Dashboard Analitik", desc: "Pantau performa penjualan secara real-time.", icon: TrendingUp },
        ].map((item, idx) => (
          <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-3xl bg-white p-6 space-y-4 hover:border-[#00AA5B]/40 transition-all group">
             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#00AA5B]/10 group-hover:text-[#00AA5B] transition-all">
                <item.icon className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wider">{item.label}</p>
                <h3 className="text-base font-black text-slate-900 mt-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
             </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2.5rem] border border-[#00AA5B]/20 bg-emerald-50/50 p-8 sm:p-12 overflow-hidden relative">
         <div className="absolute left-0 top-0 w-32 h-32 bg-[#00AA5B]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
         <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-[2rem] bg-white shadow-lg flex items-center justify-center border border-border">
               <Award className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Siap Raih Penghasilan Pasif?</h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
               Gunakan waktu luangmu untuk membangun aset digital. Puluhan ribu pembeli menanti solusi terbaik yang kamu ciptakan.
            </p>
            <Button asChild size="lg" className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-10 gap-2 shadow-xl shadow-slate-900/20">
               <Link href="/register">Mulai Buka Toko <ArrowRight className="w-4 h-4" /></Link>
            </Button>
         </div>
      </Card>
    </main>
  );
}

function Plus({ className, ...props }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}

function Badge({ children, className }: any) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>{children}</span>;
}
