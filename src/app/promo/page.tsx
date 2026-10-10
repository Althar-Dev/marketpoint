"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tag,
  Percent,
  Sparkles,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  ShoppingBag,
  CreditCard,
  Code2,
  CheckCircle2,
  Search,
  X,
  ExternalLink,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoVoucher {
  id: string;
  code: string;
  title: string;
  discountBadge: string;
  category: "Semua" | "Pengguna Baru" | "Diskon & Cashback" | "Developer" | "Bebas Biaya Admin";
  minSpend: string;
  validUntil: string;
  quotaPercent: number;
  description: string;
  gradient: string;
}

const PROMO_VOUCHERS: PromoVoucher[] = [
  {
    id: "v-1",
    code: "NEWUSER50",
    title: "Voucher Sambutan Pengguna Baru",
    discountBadge: "Diskon 50%",
    category: "Pengguna Baru",
    minSpend: "Min. Belanja Rp 20.000",
    validUntil: "31 Des 2026",
    quotaPercent: 78,
    description: "Potongan harga 50% hingga maksimal Rp 25.000 untuk transaksi perdana akun Anda.",
    gradient: "from-emerald-600 to-teal-700"
  },
  {
    id: "v-2",
    code: "DEVHEMAT25",
    title: "Diskon Khusus Source Code & Script",
    discountBadge: "Potongan Rp 25.000",
    category: "Developer",
    minSpend: "Min. Belanja Rp 100.000",
    validUntil: "15 Nov 2026",
    quotaPercent: 62,
    description: "Berlaku untuk semua pembelian source code web, aplikasi mobile Flutter, dan template UI.",
    gradient: "from-blue-600 to-indigo-700"
  },
  {
    id: "v-3",
    code: "KEYCASHBACK",
    title: "Cashback Lisensi Software & OS",
    discountBadge: "Cashback 15%",
    category: "Diskon & Cashback",
    minSpend: "Min. Belanja Rp 50.000",
    validUntil: "30 Nov 2026",
    quotaPercent: 85,
    description: "Dapatkan cashback saldo hingga Rp 20.000 untuk pembelian serial key lisensi software original.",
    gradient: "from-purple-600 to-violet-700"
  },
  {
    id: "v-4",
    code: "BEBASADMIN",
    title: "Gratis Biaya Admin QRIS & Transfer",
    discountBadge: "Gratis Fee Admin",
    category: "Bebas Biaya Admin",
    minSpend: "Tanpa Min. Belanja",
    validUntil: "31 Des 2026",
    quotaPercent: 92,
    description: "Nikmati transaksi digital tanpa potongan biaya layanan gerbang pembayaran QRIS dan Virtual Account.",
    gradient: "from-amber-600 to-orange-700"
  },
  {
    id: "v-5",
    code: "SUPERWEEKEND",
    title: "Flash Promo Akhir Pekan",
    discountBadge: "Diskon 20%",
    category: "Diskon & Cashback",
    minSpend: "Min. Belanja Rp 75.000",
    validUntil: "Tiap Sabtu - Minggu",
    quotaPercent: 45,
    description: "Potongan langsung 20% berlaku setiap hari Sabtu dan Minggu untuk semua produk digital.",
    gradient: "from-rose-600 to-red-700"
  },
  {
    id: "v-6",
    code: "FULLPROTECTION",
    title: "Voucher Proteksi Escrow Prioritas",
    discountBadge: "Proteksi VIP",
    category: "Pengguna Baru",
    minSpend: "Tanpa Min. Belanja",
    validUntil: "31 Des 2026",
    quotaPercent: 99,
    description: "Jaminan respon pengembalian dana kilat dan mediasi prioritas 24 jam untuk transaksi Anda.",
    gradient: "from-teal-600 to-emerald-700"
  }
];

const CATEGORIES = [
  "Semua",
  "Pengguna Baru",
  "Diskon & Cashback",
  "Developer",
  "Bebas Biaya Admin"
];

export default function PromoPage() {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const filteredVouchers = PROMO_VOUCHERS.filter((v) => {
    const matchCategory =
      selectedCategory === "Semua" || v.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      v.code.toLowerCase().includes(q) ||
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q);

    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER MARKETPOINT */}
      <MarketHeader />

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-16 md:pt-16 pb-20 md:pb-16">

        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 pt-6 pb-12 md:pt-8 md:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pusat Promo & Penawaran Spesial Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Belanja Produk Digital Lebih Hemat di MarketPoint
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Klaim voucher diskon, potongan biaya admin, dan cashback spesial untuk source code, template website, serta lisensi software original.
            </p>

            {/* Quick Search Voucher Bar */}
            <div className="max-w-md mx-auto pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="promo-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode promo atau jenis diskon..."
                  className="h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl border-border/80 bg-white shadow-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CAMPAIGN HIGHLIGHT CARDS */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Flash Sale Banner Link */}
            <Card className="rounded-3xl border border-red-200 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-none text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Live Flash Sale</span>
                  </Badge>
                  <span className="text-xs text-white/90 font-medium">Diskon s/d 80%</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Pesta Flash Sale Produk Digital Kilat
                </h3>
                <p className="text-xs text-white/90 leading-relaxed max-w-md">
                  Dapatkan script aplikasi, tema web, dan lisensi software dengan harga diskon khusus yang berganti setiap sesi waktu.
                </p>
              </div>

              <div className="relative z-10 pt-2">
                <Button asChild className="rounded-xl font-bold bg-white text-red-600 hover:bg-white/95 text-xs h-9 px-4 shadow-xs">
                  <Link href="/deals" className="flex items-center gap-1.5">
                    <span>Lihat Produk Flash Sale</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* New User Welcome Banner */}
            <Card className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-[#00AA5B] via-emerald-600 to-teal-700 text-white p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-none text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                    <Gift className="w-3 h-3 text-emerald-200" />
                    <span>Pengguna Baru</span>
                  </Badge>
                  <span className="text-xs text-white/90 font-medium">Ekstra Hemat</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Klaim Diskon 50% untuk Transaksi Pertamamu
                </h3>
                <p className="text-xs text-white/90 leading-relaxed max-w-md">
                  Baru pertama kali belanja di MarketPoint? Gunakan kode voucher <code className="bg-white/25 px-1.5 py-0.5 rounded-md font-mono font-bold text-white">NEWUSER50</code> saat checkout.
                </p>
              </div>

              <div className="relative z-10 pt-2">
                <Button asChild className="rounded-xl font-bold bg-white text-[#00AA5B] hover:bg-white/95 text-xs h-9 px-4 shadow-xs">
                  <Link href="/search" className="flex items-center gap-1.5">
                    <span>Mulai Belanja Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* VOUCHER LIST SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00AA5B]" />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Daftar Voucher Tersedia
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Salin kode voucher dan masukkan pada formulir ringkasan pesanan di halaman checkout.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                    selectedCategory === cat
                      ? "bg-[#00AA5B] text-white shadow-xs"
                      : "bg-white border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* VOUCHER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVouchers.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-border p-6 space-y-2">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">Tidak Ada Voucher</p>
                <p className="text-xs text-muted-foreground">
                  Tidak ditemukan voucher untuk kata kunci "{searchQuery}".
                </p>
              </div>
            ) : (
              filteredVouchers.map((v) => {
                const isCopied = copiedCode === v.code;
                return (
                  <Card
                    key={v.id}
                    className="rounded-3xl border border-border/80 bg-white shadow-xs hover:shadow-md hover:border-[#00AA5B]/40 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Ticket Header */}
                    <div className={cn("p-5 text-white bg-gradient-to-r flex items-center justify-between", v.gradient)}>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                          {v.category}
                        </span>
                        <h3 className="text-lg font-black text-white">
                          {v.discountBadge}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] opacity-80 block">Min. Belanja</span>
                        <span className="text-xs font-bold text-white">{v.minSpend}</span>
                      </div>
                    </div>

                    {/* Middle Ticket Details */}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {v.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {v.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-border/60 text-xs">
                        {/* Quota bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Kuota Terpakai</span>
                            <span className="font-semibold text-foreground">{v.quotaPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-[#00AA5B] rounded-full transition-all"
                              style={{ width: `${v.quotaPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Berlaku s/d {v.validUntil}
                          </span>
                        </div>
                      </div>

                      {/* Code Pill & Copy Button */}
                      <div className="pt-2 flex items-center gap-2">
                        <div className="flex-1 bg-muted/40 border border-dashed border-border rounded-xl px-3 py-2 flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-foreground tracking-wider">
                            {v.code}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleCopyCode(v.code)}
                          className={cn(
                            "rounded-xl text-xs font-bold h-9 px-3.5 transition-all cursor-pointer shadow-xs",
                            isCopied
                              ? "bg-emerald-600 text-white"
                              : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white"
                          )}
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Tersalin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy className="w-3.5 h-3.5" /> Salin
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* HOW TO USE VOUCHER GUIDE */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1">
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
                Panduan Praktis
              </Badge>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Cara Menggunakan Kode Voucher di MarketPoint
              </h3>
              <p className="text-xs text-muted-foreground">
                Hanya butuh 3 langkah mudah untuk menikmati potongan harga.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Salin Kode Voucher
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pilih voucher yang sesuai dengan kategori produk Anda di halaman ini, lalu klik tombol <strong>Salin</strong>.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Pilih Produk & Checkout
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cari produk digital yang Anda inginkan, masukkan ke keranjang belanja atau klik <strong>Beli Sekarang</strong>.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[#F8FAFC] border border-border/60">
                <div className="w-8 h-8 rounded-lg bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Tempel Kode di Ringkasan
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pada kolom kupon/voucher saat checkout, tempel kode tersebut dan klik <strong>Gunakan</strong>. Total tagihan akan berkurang otomatis.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                Punya pertanyaan seputar klaim voucher? Hubungi customer care kami di Pusat Bantuan.
              </span>
              <Button asChild variant="outline" className="rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted/40 h-9">
                <Link href="/support">
                  Buka Pusat Bantuan
                </Link>
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
