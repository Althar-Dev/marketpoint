"use client";

import Link from "next/link";
import { LegalHeader } from "@/components/legal-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Zap,
  Code2,
  CheckCircle2,
  Users,
  CreditCard,
  Sparkles,
  Smartphone,
  Lock,
  Headphones,
  ShoppingBag,
  Store,
  Layers,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Clock,
  Award,
  Globe,
  FileCode,
  Tag
} from "lucide-react";

const STATS = [
  { value: "50.000+", label: "Pesanan Digital Selesai", desc: "Diproses otomatis secara instan oleh sistem" },
  { value: "1.200+", label: "Mitra Penjual & Developer", desc: "Kreator digital aktif di seluruh Indonesia" },
  { value: "< 3 Detik", label: "Pengiriman Lisensi Otomatis", desc: "Kode serial langsung muncul setelah bayar" },
  { value: "99.9%", label: "Tingkat Keberhasilan Transaksi", desc: "Didukung Rekening Bersama (Escrow) terpercaya" },
];

const PRODUCTS_ECOSYSTEM = [
  {
    icon: KeyIcon,
    title: "Software & Lisensi Resmi",
    badge: "Lisensi Digital",
    description: "Pusat pembelian lisensi software original, sistem operasi, aplikasi produktivitas, utility, dan akun resmi dengan garansi aktivasi penuh.",
    points: [
      "Lisensi original siap aktivasi langsung",
      "Garansi penggantian jika lisensi bermasalah",
      "Pengiriman kode serial otomatis 24 jam nonstop"
    ]
  },
  {
    icon: FileCode,
    title: "Source Code & Script Developer",
    badge: "Karya Developer",
    description: "Koleksi source code aplikasi siap pakai berbasis Next.js, React, Laravel, Flutter, Android Studio, bot otomatisasi, dan API backend.",
    points: [
      "Diverifikasi langsung oleh tim teknis MarketPoint",
      "Dilengkapi panduan instalasi dan dokumentasi rapi",
      "Dukungan langsung dari pengembang pembuat script"
    ]
  },
  {
    icon: Smartphone,
    title: "Top Up Game & Tagihan PPOB",
    badge: "Isi Ulang Cepat",
    description: "Layanan pengisian pulsa, paket data internet seluruh operator, token listrik PLN, voucher streaming, dan mata uang game harga bersaing.",
    points: [
      "Jalur transaksi resmi terhubung ke provider tier-1",
      "Konfirmasi otomatis dalam hitungan detik",
      "Tersedia untuk ratusan game dan layanan digital"
    ]
  },
  {
    icon: Layers,
    title: "Aset Desain & Grafis Kreatif",
    badge: "Kreatif & Desain",
    description: "Template siap edit Canva & Figma, preset fotografi, aset 3D, icon pack, dan font komersial untuk menunjang kebutuhan desainer dan kreator.",
    points: [
      "Hak pakai komersial yang jelas",
      "File master beresolusi tinggi siap unduh",
      "Membantu kreator lokal memonetisasi karya desain"
    ]
  }
];

function KeyIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-1.5 1.5L13 10m-3-3L3.5 13.5a5 5 0 1 0 7 7L17 14l-2-2 2-2-2-2 2-2-2-2" />
    </svg>
  );
}

const PLATFORM_PILLARS = [
  {
    icon: Zap,
    title: "Pengiriman Otomatis (Instant Auto-Delivery)",
    desc: "Tidak perlu menunggu chat admin atau konfirmasi manual penjual. Kode lisensi dan link download file langsung dikirim oleh sistem otomatis ke akun Anda segera setelah transfer berhasil."
  },
  {
    icon: ShieldCheck,
    title: "Sistem Rekening Bersama (Escrow)",
    desc: "Uang pembayaran Anda ditahan aman oleh sistem MarketPoint dan baru diteruskan kepada penjual setelah Anda mengonfirmasi bahwa produk berfungsi dengan baik."
  },
  {
    icon: Store,
    title: "Buka Toko Gratis untuk Siapa Saja",
    desc: "Setiap pengguna dapat mengaktifkan Toko Saya secara gratis. Lengkap dengan dashboard analitik penjualan, manajemen stok lisensi otomatis, fitur flash sale, dan kupon voucher toko."
  },
  {
    icon: CreditCard,
    title: "Metode Pembayaran Nasional Lengkap",
    desc: "Mendukung QRIS instan seluruh e-wallet & m-banking di Indonesia, Virtual Account semua bank utama (BCA, Mandiri, BRI, BNI, BSI, Permata, CIMB, SeaBank), serta gerai retail."
  },
  {
    icon: MessageCircle,
    title: "Fitur Chat Langsung dengan Penjual",
    desc: "Fasilitas obrolan real-time terintegrasi di dalam platform untuk berkonsultasi seputar produk, menanyakan panduan instalasi, atau berdiskusi sebelum membeli."
  },
  {
    icon: Headphones,
    title: "Bantuan Pengguna MarketPoint Care",
    desc: "Tim layanan pelanggan yang responsif siap membantu proses mediasi, kendala transaksi, dan klaim garansi produk digital Anda."
  }
];

export default function AboutPage() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-[#212121] flex flex-col">
      {/* HEADER DESKTOP KHUSUS LEGAL & ABOUT */}
      {!isMobile && <LegalHeader title="Tentang Kami" badge="Mengenal MarketPoint" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Tentang MarketPoint</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            Profil
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto text-center space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Marketplace Produk Digital Terpercaya</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground max-w-3xl mx-auto leading-tight sm:leading-tight">
              Pusat Jual Beli <span className="text-[#00AA5B]">Produk Digital & Lisensi</span> Terbesar di Indonesia
            </h1>

            <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MarketPoint adalah platform e-commerce produk non-fisik yang mempertemukan kreator digital, pengembang software, dan jutaan pembeli dengan sistem transaksi otomatis, rekening bersama aman, dan serba instan.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs sm:text-sm h-11 px-6 shadow-md shadow-[#00AA5B]/20">
                <Link href="/">
                  Jelajahi Produk Digital <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-bold border-border/80 hover:bg-muted/50 text-foreground text-xs sm:text-sm h-11 px-6">
                <Link href="/register">
                  Buka Toko Gratis
                </Link>
              </Button>
            </div>
          </div>

          {/* Background Decorative Blur Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00AA5B]/5 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* STATS SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map((stat, idx) => (
              <Card key={idx} className="border border-border/70 shadow-sm bg-white rounded-2xl overflow-hidden hover:border-[#00AA5B]/50 transition-all p-4 sm:p-5">
                <CardContent className="p-0 space-y-1 text-center sm:text-left">
                  <div className="text-xl sm:text-3xl font-black text-[#00AA5B] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">
                    {stat.label}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                    {stat.desc}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* STORY & MISSION SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4">
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[11px] font-bold px-3 py-1">
                Latar Belakang & Visi
              </Badge>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-foreground leading-snug">
                Menghadirkan Rasa Aman dalam Setiap Transaksi Digital
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Selama bertahun-tahun, transaksi produk digital di Indonesia sering kali dibayangi risiko penipuan karena dilakukan melalui transfer langsung tanpa perantara yang memadai. Di sisi lain, ribuan programmer dan kreator digital berbakat kesulitan menemukan wadah yang tepat untuk memasarkan karya mereka secara profesional.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <strong>MarketPoint</strong> hadir sebagai jawaban atas tantangan tersebut. Kami membangun platform yang dirancang khusus untuk karakteristik produk non-fisik: sistem serah terima lisensi otomatis dalam hitungan detik, rekening bersama (*escrow*) yang mengunci dana sampai produk terbukti berfungsi, serta ekosistem toko mandiri yang mudah digunakan oleh siapa saja.
              </p>

              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                  <span>100% Produk Non-Fisik Bergaransi & Terverifikasi</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                  <span>Sistem Otomatisasi Terintegrasi untuk Pembeli & Penjual</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                  <span>Dukungan Komunitas Resmi Pedagang & Developer Indonesia</span>
                </div>
              </div>
            </div>

            {/* Vision & Mission Card */}
            <div className="space-y-4">
              <Card className="rounded-2xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Visi MarketPoint</h3>
                    <p className="text-xs text-muted-foreground">Menjadi pasar digital terbesar dan teraman di Indonesia.</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-13">
                  Menciptakan ekosistem ekonomi digital di mana setiap orang dapat dengan mudah membeli software berlisensi resmi, dan setiap pengembang software dapat hidup sejahtera dari karya yang mereka ciptakan.
                </p>
              </Card>

              <Card className="rounded-2xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Misi Kami</h3>
                    <p className="text-xs text-muted-foreground">Langkah nyata yang kami wujudkan setiap hari.</p>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 pl-13 list-disc">
                  <li>Memberikan proteksi transaksi tanpa celah melalui sistem Escrow otomatis.</li>
                  <li>Memangkas waktu tunggu pengiriman produk digital menjadi di bawah 3 detik.</li>
                  <li>Memberikan edukasi dan fasilitas jualan gratis tanpa biaya pendaftaran merchant.</li>
                  <li>Menyediakan metode pembayaran lokal terlengkap dengan verifikasi instan.</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* FOUNDER & ENGINEERING PHILOSOPHY SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
          <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
            {/* Top Accent Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-border/80 bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
                  <img
                    src="/assets/img/starvale.png"
                    alt="StarVale Technology Solution"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-[#00AA5B] uppercase tracking-wider">
                    StarVale Technology Solution
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Filosofi Rekayasa & Di Balik Layar MarketPoint
                  </h2>
                </div>
              </div>
              <Badge variant="outline" className="w-fit text-[11px] font-semibold px-3 py-1 rounded-full border-border bg-muted/30 text-muted-foreground self-start sm:self-auto">
                Technology Company
              </Badge>
            </div>

            {/* Narrative Body & Creator Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <p>
                  MarketPoint didirikan dan beroperasi di bawah naungan perusahaan <strong className="text-foreground">StarVale Technology Solution</strong>, yang dibangun oleh <strong className="text-foreground">Alhadi Adriano (AltharDev)</strong> sebagai pemilik dan pengembang tunggal.
                </p>
                <p>
                  Kami meyakini bahwa keunggulan sebuah platform perangkat lunak tidak diukur dari besarnya birokrasi, melainkan dari ketelitian rekayasa kode, efisiensi arsitektur, serta perhatian mendalam pada keamanan dan kenyamanan pengguna.
                </p>
                <p>
                  Sebagai platform yang dibangun secara mandiri oleh satu pengembang (<em>solo-engineered enterprise platform</em>), setiap komponen MarketPoint—mulai dari antarmuka pengguna yang bersih, bot automasi pengiriman lisensi, integrasi pembayaran digital, hingga skalabilitas database—dirancang secara utuh dari nol untuk menghadirkan pasar digital terpercaya di Indonesia.
                </p>
              </div>

              {/* Minimalist Profile Card */}
              <div className="p-5 rounded-2xl border border-border/70 bg-[#F8FAFC] space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#00AA5B] shadow-2xs shrink-0 bg-muted">
                    <img
                      src="/assets/img/althardev.png"
                      alt="Alhadi Adriano (AltharDev)"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">Alhadi Adriano</h3>
                    <p className="text-[11px] text-[#00AA5B] font-mono font-bold">@AltharDev</p>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                  <p className="font-semibold text-foreground">Pemilik & Pengembang Tunggal</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border/60 shrink-0 shadow-2xs">
                      <img
                        src="/assets/img/starvale.png"
                        alt="StarVale Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[#00AA5B] font-bold">StarVale Technology Solution</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <a
                    href="https://instagram.com/starvale.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00AA5B] hover:underline"
                  >
                    <span>Instagram @starvale.id</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3 Core Engineering Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/60">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" /> Arsitektur Ringan & Cepat
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dibangun dengan standar modern Next.js untuk performa responsif dan latensi rendah.
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" /> Automasi Sistem Mandiri
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Modul otomasi transaksi yang memproses dan menyerahkan lisensi dalam hitungan detik.
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" /> Pengembangan Tanggap
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Pengambilan keputusan teknis yang ramping (*lean*), memastikan fitur dan keamanan terus diperbarui.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS & CATALOG ECOSYSTEM */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[11px] font-bold px-3 py-1">
              Kategori Produk
            </Badge>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">
              Apa Saja yang Dapat Anda Temukan di MarketPoint?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jelajahi ribuan produk digital dari ratusan penjual dan kreator teknologi terverifikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {PRODUCTS_ECOSYSTEM.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <Card
                  key={idx}
                  className="rounded-2xl border border-border/70 bg-white hover:border-[#00AA5B]/40 hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-12 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-border/80 text-muted-foreground bg-muted/20">
                        {item.badge}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50">
                      {item.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs text-foreground/80 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CORE PLATFORM FEATURES */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[11px] font-bold px-3 py-1">
              Keunggulan Kami
            </Badge>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">
              Mengapa Berbelanja & Berjualan di MarketPoint?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Fitur-fitur terbaik yang dirancang untuk kenyamanan, kecepatan, dan rasa aman Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORM_PILLARS.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-border/60 bg-white hover:border-[#00AA5B]/40 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMMUNITY & SUPPORT SECTION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* WhatsApp Community Card */}
            <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Komunitas Resmi WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Bergabung dengan ribuan seller & buyer aktif</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dapatkan info flash sale terbaru, update stok lisensi, berdiskusi dengan sesama developer, dan konsultasi tips jualan langsung di grup komunitas resmi MarketPoint.
              </p>
              <Button asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 gap-1.5 shadow-xs">
                <a
                  href="https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gabung Grup WhatsApp <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </Card>

            {/* Customer Care Support Card */}
            <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-blue-50/70 via-white to-white p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">MarketPoint Care 24/7</h3>
                  <p className="text-xs text-muted-foreground">Layanan bantuan dan penanganan kendala</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mengalami kendala aktivasi lisensi atau butuh bantuan klaim garansi? Tim dukungan pelanggan kami siap membantu Anda dengan respon cepat.
              </p>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="rounded-xl font-bold border-border/80 text-foreground text-xs h-9 px-4">
                  <Link href="/terms">
                    Baca FAQ & Panduan
                  </Link>
                </Button>
                <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs h-9 px-4">
                  <a href="mailto:support@marketpoint.id">
                    Hubungi Email Support
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
          <div className="rounded-3xl bg-gradient-to-r from-[#00AA5B] via-[#008f4c] to-[#006e3a] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-lg shadow-[#00AA5B]/15 space-y-5">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight max-w-xl mx-auto leading-tight">
              Mulai Langkah Anda Bersama MarketPoint Hari Ini
            </h2>
            <p className="text-xs sm:text-sm text-white/90 max-w-lg mx-auto leading-relaxed">
              Temukan ribuan software berlisensi original atau buka toko digital Anda sendiri dan raih penghasilan tanpa batas.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="rounded-xl font-bold bg-white text-[#00AA5B] hover:bg-white/95 text-xs sm:text-sm h-11 px-6 shadow-sm cursor-pointer">
                <Link href="/register">
                  Buka Toko Gratis Sekarang
                </Link>
              </Button>
              <Button asChild className="rounded-xl font-bold bg-white/15 hover:bg-white/25 text-white border-2 border-white/90 text-xs sm:text-sm h-11 px-6 transition-all cursor-pointer">
                <Link href="/">
                  Jelajahi Katalog Marketplace
                </Link>
              </Button>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-xl pointer-events-none" />
          </div>
        </section>
      </main>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
