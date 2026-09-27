"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ChevronRight, 
  History, 
  Star, 
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TOPUP_CATEGORIES = [
  { id: "pulsa", label: "Pulsa & Data", icon: "/assets/icons/pulsadata.png", color: "bg-blue-50" },
  { id: "game", label: "Game", icon: "/assets/icons/game.png", color: "bg-purple-50" },
  { id: "ewallet", label: "E-Wallet", icon: "/assets/icons/ewallet.png", color: "bg-emerald-50" },
  { id: "pln", label: "Listrik PLN", icon: "/assets/icons/listrik.png", color: "bg-amber-50" },
  { id: "pdam", label: "Air PDAM", icon: "/assets/icons/pdam.png", color: "bg-cyan-50" },
  { id: "tv", label: "TV Kabel", icon: "/assets/icons/tv.png", color: "bg-indigo-50" },
  { id: "stream", label: "Streaming", icon: "/assets/icons/stream.png", color: "bg-rose-50" },
  { id: "voucher", label: "Voucher", icon: "/assets/icons/voucher.png", color: "bg-orange-50" },
];

const RECENT_TRANSACTIONS = [
  { id: 1, label: "Pulsa Telkomsel 50rb", target: "081234567890", date: "2 hari lalu" },
  { id: 2, label: "Mobile Legends 86 DM", target: "12345678 (2001)", date: "5 hari lalu" },
];

export default function TopUpHubPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredCategories = TOPUP_CATEGORIES.filter(cat => 
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 w-full pt-20 pb-24 md:pb-12 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 space-y-8">
        
        {/* Search Header */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#212121]">Top Up & Tagihan</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Layanan digital lengkap untuk kebutuhan harian Anda.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari layanan digital..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10 rounded-2xl bg-muted/30 border-transparent focus:bg-white focus:border-[#00AA5B] transition-all font-bold text-xs"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-6">
          {filteredCategories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/search?q=${encodeURIComponent(cat.label)}`}
              className="group flex flex-col items-center gap-3 transition-all active:scale-95"
            >
              <div className={cn(
                "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border border-border/40 shadow-2xs group-hover:shadow-md group-hover:border-[#00AA5B]/30 transition-all",
                cat.color
              )}>
                <Image 
                  src={cat.icon} 
                  alt={cat.label} 
                  width={36} 
                  height={36} 
                  className="object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <span className="text-[10px] md:text-[11px] font-black text-[#2E3137] text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </section>

        {/* Promo & Recent Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Left: Recent Transactions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-[#2E3137] uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-[#00AA5B]" /> Beli Lagi
              </h2>
              <button className="text-[10px] font-bold text-[#00AA5B] hover:underline">Lihat Semua</button>
            </div>
            
            <div className="space-y-3">
              {RECENT_TRANSACTIONS.map((item) => (
                <Card key={item.id} className="border-border border-[1px] shadow-2xs rounded-2xl hover:border-[#00AA5B]/30 cursor-pointer transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted/40 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[#00AA5B]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-[#2E3137]">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{item.target} • {item.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Featured Promos */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-[#2E3137] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00AA5B]" /> Promo Spesial
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative h-40 rounded-3xl overflow-hidden bg-gradient-to-br from-[#00AA5B] to-[#009650] group cursor-pointer shadow-md">
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 text-white">
                  <Badge className="w-fit bg-white/20 text-white border-none font-bold text-[9px]">CASHBACK 10%</Badge>
                  <div>
                    <h3 className="text-base font-black leading-tight">Top Up Game Pakai MarketBalance</h3>
                    <p className="text-[10px] opacity-80 mt-1 font-medium">Khusus pengguna Pro & Prime.</p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:scale-110 transition-transform duration-700">
                   <Image src="https://picsum.photos/seed/promo1/300/300" alt="Promo" fill className="object-cover" />
                </div>
              </div>

              <div className="relative h-40 rounded-3xl overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] group cursor-pointer shadow-md">
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 text-white">
                  <Badge className="w-fit bg-white/20 text-white border-none font-bold text-[9px]">NEW USER</Badge>
                  <div>
                    <h3 className="text-base font-black leading-tight">Potongan Rp 5.000 Transaksi Pertama</h3>
                    <p className="text-[10px] opacity-80 mt-1 font-medium">Berlaku untuk semua tagihan.</p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:scale-110 transition-transform duration-700">
                   <Image src="https://picsum.photos/seed/promo2/300/300" alt="Promo" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Reliability Info */}
        <section className="pt-8 border-t border-border/60">
           <Card className="bg-[#F8FAFC] border-none rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-[#00AA5B]" />
              </div>
              <div className="space-y-2 flex-1">
                 <h3 className="text-base md:text-lg font-black text-[#2E3137]">Transaksi Aman & Instan 24 Jam</h3>
                 <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                    Semua transaksi Top Up dan Tagihan di MarketPoint diproses secara otomatis dalam hitungan detik. Saldo Anda akan terlindungi oleh sistem rekber kami yang menjamin dana kembali jika transaksi gagal.
                 </p>
              </div>
              <Button variant="outline" className="h-10 px-8 rounded-xl border-border bg-white text-xs font-bold hover:bg-white hover:text-[#00AA5B] hover:border-[#00AA5B] transition-all shrink-0">
                 Bantuan Center
              </Button>
           </Card>
        </section>

      </div>
    </main>
  );
}
