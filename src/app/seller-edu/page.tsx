"use client";

import { useState } from "react";
import Link from "next/link";
import { LegalHeader } from "@/components/legal-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Store,
  Zap,
  Tag,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  HelpCircle,
  FileText,
  MessageCircle,
  Coins,
  ChevronRight,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SELLER_MODULES, DetailedModule } from "./modules-data";

const SELLER_BENEFITS = [
  {
    icon: Coins,
    title: "100% Gratis Tanpa Iuran Bulanan",
    desc: "Buka toko kapan saja tanpa biaya pendaftaran. Tidak ada biaya sewa atau langganan bulanan."
  },
  {
    icon: Zap,
    title: "Sistem Pengiriman Otomatis 24 Jam",
    desc: "Sistem bot kami mengirimkan lisensi kepada pembeli dalam hitungan detik meski Anda sedang tidur."
  },
  {
    icon: ShieldCheck,
    title: "Jaminan Pembayaran Aman (Escrow)",
    desc: "Dana pembeli terkunci di muka. Anda bebas dari risiko penipuan struk palsu atau pembeli kabur."
  },
  {
    icon: Store,
    title: "Etalase & Dashboard Toko Lengkap",
    desc: "Pantau analitik kunjungan, omset penjualan harian, kelola kupon diskon, dan kelola stok lisensi dalam satu layar."
  }
];

export default function SellerEduPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("Semua");

  const filteredModules = SELLER_MODULES.filter((mod) => {
    const matchLevel = selectedLevel === "Semua" || mod.level === selectedLevel;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      mod.title.toLowerCase().includes(q) ||
      mod.summary.toLowerCase().includes(q) ||
      mod.chapters.some((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));

    return matchLevel && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & SELLER EDU */}
      {!isMobile && <LegalHeader title="Pusat Edukasi Seller" badge="Seller Academy" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Edukasi Seller</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            Academy
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 py-10 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Akademi Resmi & Panduan Sukses Mitra Seller</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Kuasai Cara Berjualan Produk Digital di MarketPoint
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Panduan lengkap dari nol: cara upload produk, otomasi pengiriman lisensi, pembuatan kupon diskon, manajemen flash sale, hingga panduan pencairan saldo penjualan.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs sm:text-sm h-10 px-5 shadow-xs">
                <Link href="/register">
                  Buka Toko Sekarang <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-bold border-border text-foreground hover:bg-muted/40 text-xs sm:text-sm h-10 px-5">
                <a href="#modul-belajar">
                  Lihat Modul Belajar
                </a>
              </Button>
            </div>

            {/* Quick Search Bar */}
            <div className="max-w-md mx-auto pt-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="seller-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari materi (cth: auto-delivery, payout, diskon)..."
                  className="h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl border-border/80 bg-white shadow-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus kata kunci pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4 BENEFIT CARDS */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SELLER_BENEFITS.map((b, idx) => {
              const IconComp = b.icon;
              return (
                <Card
                  key={idx}
                  className="border border-border/70 shadow-xs bg-white rounded-2xl p-5 hover:border-[#00AA5B]/40 transition-all space-y-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {b.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {b.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* LEARNING MODULES SECTION */}
        <section id="modul-belajar" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
                Kurikulum Panduan
              </Badge>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Modul Pembelajaran Seller
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pilih topik sesuai tingkat kebutuhan toko digital Anda.
              </p>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
              {["Semua", "Pemula", "Menengah", "Mahir"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    selectedLevel === lvl
                      ? "bg-white text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* MODULES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-border p-6 space-y-2">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">Tidak Ada Modul</p>
                <p className="text-xs text-muted-foreground">
                  Tidak ditemukan panduan untuk kata kunci "{searchQuery}".
                </p>
              </div>
            ) : (
              filteredModules.map((mod, idx) => {
                return (
                  <Link
                    key={mod.slug}
                    href={`/seller-edu/${mod.slug}`}
                    className="rounded-2xl border border-border/70 bg-white shadow-xs hover:shadow-md hover:border-[#00AA5B]/40 transition-all flex flex-col justify-between p-5 sm:p-6 group space-y-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn("text-[10px] font-bold border", mod.levelBadgeColor)}>
                          Level: {mod.level}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {mod.readTime}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-black text-sm">
                          {idx + 1}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-[#00AA5B] transition-colors">
                          {mod.title}
                        </h3>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {mod.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-[#00AA5B]">
                      <span>Buka Panduan Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* CODE OF CONDUCT & RULES SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1">
              <Badge className="bg-red-50 text-red-600 border-none text-[10px] font-bold">
                Kebijakan Wajib
              </Badge>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Kode Etik & Standar Mutu Penjual di MarketPoint
              </h3>
              <p className="text-xs text-muted-foreground">
                Kepatuhan mutlak yang harus ditaati demi menjaga ekosistem pasar yang sehat dan aman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Larangan Produk Nulled & Bajakan
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Semua script, template, atau lisensi yang dijual wajib merupakan karya asli atau berlisensi komersial sah. Produk curian akan langsung dihapus dan saldo akun dibekukan.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Garansi Sesuai Deskripsi
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Penjual wajib menjamin bahwa produk yang dikirim dapat diaktivasi dan berjalan sesuai spesifikasi yang tertera pada deskripsi etalase produk.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Layanan Bantuan yang Responsif
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Penjual wajib menanggapi pertanyaan dan kendala pembeli di chat secara santun dan profesional maksimal dalam waktu 1x24 jam kerja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SELLER WHATSAPP COMMUNITY CTA BANNER */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="rounded-3xl bg-gradient-to-r from-[#00AA5B] via-[#008f4c] to-[#006e3a] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-lg shadow-[#00AA5B]/15 space-y-5">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight max-w-xl mx-auto leading-tight">
              Siap Memulai Perjalanan Sukses Toko Digital Anda?
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-lg mx-auto leading-relaxed">
              Daftarkan toko Anda hari ini secara gratis atau bergabunglah ke grup WhatsApp komunitas penjual untuk berdiskusi langsung dengan para top merchant.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="rounded-xl font-bold bg-white text-[#00AA5B] hover:bg-white/95 text-xs sm:text-sm h-11 px-6 shadow-sm cursor-pointer">
                <Link href="/register">
                  Buka Toko Gratis Sekarang
                </Link>
              </Button>
              <Button asChild className="rounded-xl font-bold bg-white/15 hover:bg-white/25 text-white border-2 border-white/90 text-xs sm:text-sm h-11 px-6 transition-all cursor-pointer">
                <a
                  href="https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Komunitas Seller WhatsApp</span>
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
