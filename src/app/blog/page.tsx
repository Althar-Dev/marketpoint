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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Search,
  X,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Share2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Code2,
  Store,
  Layers,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Panduan Seller" | "Teknologi & Dev" | "Keamanan & Lisensi" | "Update Platform";
  date: string;
  readTime: string;
  author: string;
  coverGradient: string;
  icon: any;
  featured?: boolean;
  content: string[];
}

const ARTICLES: Article[] = [
  {
    id: "post-1",
    slug: "panduan-sukses-jualan-produk-digital",
    title: "Panduan Lengkap Membuka Toko Produk Digital dan Meraih Penjualan Pertama di MarketPoint",
    excerpt: "Langkah-langkah strategis bagi developer dan kreator lokal dalam mengunggah source code, mengatur stok lisensi otomatis, dan mengoptimalkan etalase toko agar dipercaya pembeli.",
    category: "Panduan Seller",
    date: "10 Okt 2026",
    readTime: "5 min baca",
    author: "Alhadi Adriano",
    coverGradient: "from-emerald-600 via-teal-600 to-[#00AA5B]",
    icon: Store,
    featured: true,
    content: [
      "Menjual produk digital seperti source code, template website, atau lisensi software memiliki potensi margin yang sangat tinggi karena tidak membutuhkan biaya ongkos kirim fisik dan tidak memiliki batasan stok gudang. Namun, bagaimana cara memulai dengan benar di MarketPoint agar toko Anda langsung dipercaya calon pembeli?",
      "1. Optimalkan Informasi Etalase dan Portofolio Produk: Cantumkan deskripsi yang jelas mengenai spesifikasi teknis (framework yang digunakan, versi dependensi, serta persyaratan sistem minimum). Sertakan screenshot antarmuka yang representatif atau link demo live jika memungkinkan.",
      "2. Manfaatkan Fitur Pengiriman Stok Otomatis: Di dashboard Toko Saya MarketPoint, Anda dapat memasukkan daftar serial key lisensi ke sistem. Ketika pembeli menyelesaikan pembayaran, sistem otomatis akan langsung mengirimkan lisensi tersebut tanpa perlu Anda balas secara manual.",
      "3. Berikan Dokumentasi Instalasi yang Rapi: Pembeli produk digital sangat menghargai kejelasan petunjuk. Sertakan file panduan 'README' atau dokumentasi PDF yang menjelaskan langkah instalasi langkah-demi-langkah.",
      "4. Berikan Respons Chat Cepat: Pembeli sering kali bertanya terlebih dahulu sebelum membeli. Toko dengan tingkat respons obrolan di bawah 1 jam memiliki rasio konversi penjualan 3 kali lipat lebih tinggi.",
      "Dengan menerapkan keempat pilar di atas, toko Anda akan lebih cepat meraih penjualan perdana dan mendapatkan ulasan bintang lima dari pembeli terverifikasi."
    ]
  },
  {
    id: "post-2",
    slug: "mengapa-transaksi-digital-wajib-escrow",
    title: "Mengenal Sistem Rekening Bersama (Escrow): Mengapa Transaksi Digital Wajib Memakainya?",
    excerpt: "Bagaimana sistem Escrow di MarketPoint mengunci dana pembayaran hingga produk terbukti berfungsi dan menghilangkan risiko penipuan transfer langsung.",
    category: "Keamanan & Lisensi",
    date: "08 Okt 2026",
    readTime: "4 min baca",
    author: "StarVale Editorial",
    coverGradient: "from-blue-600 via-indigo-600 to-cyan-600",
    icon: ShieldCheck,
    content: [
      "Transaksi produk digital di media sosial atau forum tanpa perantara sering kali menyisakan cerita buruk: uang sudah ditransfer tetapi file tidak dikirim, atau serial key yang diberikan ternyata sudah kadaluarsa (revoked).",
      "Sistem Rekening Bersama (Escrow) hadir sebagai jembatan kepercayaan. Mekanismenya sangat sederhana namun ampuh:",
      "1. Pembeli membayar ke gerbang pembayaran resmi MarketPoint.",
      "2. Dana ditahan secara aman di rekening penampungan sistem, belum diteruskan ke rekening penjual.",
      "3. Penjual (atau sistem otomatis) mengirimkan lisensi/source code kepada pembeli.",
      "4. Pembeli memiliki waktu proteksi (hingga 48 jam) untuk mencoba aktivasi. Setelah pembeli menekan konfirmasi pesanan selesai atau masa proteksi habis tanpa komplain, barulah dana dicairkan ke saldo penjual.",
      "Dengan mekanisme ini, pembeli terlindungi 100% dari penipuan, sementara penjual juga dijamin menerima uang begitu produk diserahterimakan dengan benar."
    ]
  },
  {
    id: "post-3",
    slug: "tips-memilih-source-code-siap-produksi",
    title: "Tips Memilih Template Source Code yang Bersih, Cepat, dan Siap Produksi",
    excerpt: "Kriteria penting dalam memilih script aplikasi web dan mobile: struktur folder, dependensi modern, keamanan input, dan kemudahan kustomisasi.",
    category: "Teknologi & Dev",
    date: "05 Okt 2026",
    readTime: "6 min baca",
    author: "Alhadi Adriano",
    coverGradient: "from-purple-600 via-violet-600 to-indigo-600",
    icon: Code2,
    content: [
      "Membeli source code aplikasi siap pakai adalah cara tercepat untuk meluncurkan produk perangkat lunak atau MVP startup tanpa harus membangun dari nol. Namun, tidak semua script dibuat dengan standar yang sama.",
      "Berikut adalah checklist yang wajib Anda perhatikan saat memilih source code:",
      "1. Framework Modern & Aktif: Pastikan proyek menggunakan teknologi terkini yang didukung komunitas luas, seperti Next.js App Router, React 19, Flutter 3, atau Tailwind CSS.",
      "2. Kode Bebas Obfuscation: Pastikan kode yang Anda beli bersih dan mudah dibaca (readable) agar Anda dapat melakukan kustomisasi di masa depan.",
      "3. Penanganan Keamanan & Enkripsi: Periksa bagaimana script menangani autentikasi pengguna, validasi input formulir (pencegahan SQL Injection / XSS), dan penyimpanan environment variables.",
      "4. Lisensi Komersial yang Jelas: Pastikan penjual memberikan hak cipta penggunaan komersial resmi sehingga aplikasi Anda aman dari tuntutan hukum di kemudian hari."
    ]
  },
  {
    id: "post-4",
    slug: "cara-melindungi-source-code-dari-pembajakan",
    title: "Cara Efektif Melindungi Source Code & Lisensi Software dari Pembajakan Ilegal",
    excerpt: "Teknik verifikasi remote license key, domain whitelist, dan strategi distribusi aman bagi para software engineer independen.",
    category: "Keamanan & Lisensi",
    date: "02 Okt 2026",
    readTime: "5 min baca",
    author: "StarVale Editorial",
    coverGradient: "from-amber-600 via-orange-600 to-red-600",
    icon: ShieldCheck,
    content: [
      "Salah satu kekhawatiran terbesar developer independen saat menjual perangkat lunak adalah risiko dibajak atau didistribusikan ulang tanpa izin (nulled).",
      "Beberapa teknik yang dapat diterapkan untuk meminimalisir risiko ini:",
      "1. Sistem Aktivasi API Berbasis Domain: Buat endpoint server otentikasi lisensi yang memverifikasi kecocokan domain atau Machine ID sebelum modul inti dijalankan.",
      "2. Pembagian Fitur Inti Berbasis Cloud: Pindahkan algoritma penting atau pemrosesan berat ke server API Anda, sehingga pembeli hanya menerima client SDK.",
      "3. Pemberian Watermark Unik per Pembeli: Sematkan metadata unik nomor invoice pada file unduhan sehingga jika terjadi kebocoran, sumbernya dapat dilacak dengan mudah.",
      "4. Penegakan Kebijakan Ketat di MarketPoint: Tim kami secara rutin memindai dan menghapus akun yang terindikasi mengunggah produk bajakan."
    ]
  },
  {
    id: "post-5",
    slug: "integrasi-qris-instan-e-commerce",
    title: "Integrasi Pembayaran QRIS Instan: Mempercepat Siklus Transaksi Digital Indonesia",
    excerpt: "Mengapa QRIS menjadi standar pembayaran nomor satu di MarketPoint dan bagaimana notifikasi webhook otomatis memangkas waktu tunggu pelanggan.",
    category: "Update Platform",
    date: "28 Sep 2026",
    readTime: "4 min baca",
    author: "Alhadi Adriano",
    coverGradient: "from-emerald-700 via-green-600 to-teal-700",
    icon: Sparkles,
    content: [
      "Quick Response Code Indonesian Standard (QRIS) dari Bank Indonesia telah merevolusi cara masyarakat berbelanja online. Di MarketPoint, lebih dari 75% transaksi produk digital kini diselesaikan menggunakan QRIS.",
      "Keunggulan utama QRIS di MarketPoint:",
      "1. Satu QR untuk Semua Aplikasi: Dapat dipindai menggunakan m-banking BCA, Mandiri, BRI, BNI maupun e-wallet seperti GoPay, OVO, Dana, dan ShopeePay.",
      "2. Verifikasi Real-Time Tanpa Bukti Transfer: Sistem webhook kami menerima notifikasi mutasi dalam hitungan milidetik sehingga pembeli tidak perlu mengunggah struk transfer bank.",
      "3. Pengurangan Human Error: Nominal transaksi tertera secara presisi tanpa risiko salah transfer ke nomor rekening lain."
    ]
  },
  {
    id: "post-6",
    slug: "strategi-menentukan-harga-lisensi-software",
    title: "Strategi Menentukan Harga Produk Digital: Menghindari Perang Harga yang Merugikan",
    excerpt: "Cara menentukan nilai produk digital berdasarkan penghematan waktu pelanggan (*value-based pricing*) alih-alih sekadar bersaing di harga murah.",
    category: "Panduan Seller",
    date: "24 Sep 2026",
    readTime: "4 min baca",
    author: "StarVale Editorial",
    coverGradient: "from-slate-700 via-gray-800 to-zinc-900",
    icon: TrendingUp,
    content: [
      "Banyak penjual pemula terjebak dalam perang harga murah demi mendapatkan penjualan cepat. Padahal, harga yang terlalu rendah sering kali membuat calon pembeli meragukan kualitas produk Anda.",
      "Gunakan pendekatan Value-Based Pricing:",
      "1. Hitung Waktu yang Dihemat Pembeli: Jika script Anda menghemat waktu pengerjaan proyek seorang programmer selama 2 minggu, harga Rp 250.000 - Rp 500.000 adalah investasi yang sangat murah bagi mereka.",
      "2. Sediakan Opsi Lisensi Berjenjang: Tawarkan Personal License (untuk 1 project) dan Extended/Commercial License (untuk penggunaan tanpa batas).",
      "3. Tonjolkan Kualitas Dukungan: Pembeli rela membayar lebih mahal jika penjual menjamin bantuan jika terjadi error saat instalasi."
    ]
  }
];

const CATEGORIES = [
  "Semua",
  "Panduan Seller",
  "Teknologi & Dev",
  "Keamanan & Lisensi",
  "Update Platform",
];

export default function BlogPage() {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = ARTICLES.filter((art) => {
    const matchCategory =
      selectedCategory === "Semua" || art.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.excerpt.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q);

    return matchCategory && matchSearch;
  });

  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & BLOG */}
      {!isMobile && <LegalHeader title="Blog" badge="Artikel & Panduan" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Blog MarketPoint</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            Artikel
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 py-10 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pusat Informasi, Edukasi & Rekayasa Teknologi</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Blog & Wawasan Digital MarketPoint
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Panduan pengembangan bisnis produk digital, wawasan arsitektur software, tips keamanan lisensi, dan berita pembaruan platform.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-md mx-auto pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="blog-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari artikel, topik, atau kata kunci..."
                  className="h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl border-border/80 bg-white shadow-xs focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus kata kunci pencarian"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY TABS & ARTICLES CONTAINER */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
          
          {/* CATEGORY PILLS */}
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[#00AA5B] text-white shadow-xs"
                    : "bg-white border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FEATURED ARTICLE (HANYA MUNCUL DI TAB "Semua" & TANPA PENCARIAN) */}
          {selectedCategory === "Semua" && !searchQuery && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#00AA5B]" />
                <span>Artikel Unggulan Pilihan</span>
              </div>

              <Card
                onClick={() => setSelectedArticle(featuredArticle)}
                className="rounded-3xl border border-border/80 bg-white shadow-xs hover:shadow-md hover:border-[#00AA5B]/40 transition-all overflow-hidden cursor-pointer group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left Gradient Cover */}
                  <div className={cn(
                    "lg:col-span-5 bg-gradient-to-br p-8 sm:p-10 text-white flex flex-col justify-between min-h-[220px]",
                    featuredArticle.coverGradient
                  )}>
                    <div className="space-y-3">
                      <Badge className="bg-white/20 text-white border-none text-[10px] font-bold backdrop-blur-xs">
                        {featuredArticle.category}
                      </Badge>
                      <h3 className="text-xl sm:text-2xl font-black leading-tight text-white group-hover:underline">
                        {featuredArticle.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-white/90 pt-6">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {featuredArticle.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {featuredArticle.readTime}
                      </span>
                    </div>
                  </div>

                  {/* Right Details */}
                  <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                      <div className="space-y-2 pt-2 border-t border-border/50 text-xs text-foreground/80 font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                          <span>Pengaturan stok kode lisensi otomatis 24 jam</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0" />
                          <span>Tips membangun deskripsi etalase terpercaya</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Penulis: <strong className="text-foreground">{featuredArticle.author}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00AA5B] group-hover:translate-x-1 transition-transform">
                        <span>Baca Selengkapnya</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ARTICLES GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {selectedCategory === "Semua" ? "Daftar Artikel Terbaru" : `Artikel: ${selectedCategory}`}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                {filteredArticles.length} artikel ditemukan
              </span>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-border p-6 space-y-2">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">Tidak Ada Artikel</p>
                <p className="text-xs text-muted-foreground">
                  Tidak ditemukan artikel untuk kata kunci "{searchQuery}".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredArticles.map((art) => {
                  const IconComp = art.icon;
                  return (
                    <Card
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="rounded-2xl border border-border/70 bg-white shadow-xs hover:shadow-md hover:border-[#00AA5B]/40 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
                    >
                      {/* Card Top Banner Accent */}
                      <div className={cn("h-3 bg-gradient-to-r", art.coverGradient)} />

                      <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold border-border bg-muted/20 text-muted-foreground">
                              {art.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {art.readTime}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-[#00AA5B] transition-colors line-clamp-2">
                            {art.title}
                          </h4>

                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {art.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {art.date}
                          </span>
                          <span className="font-bold text-[#00AA5B] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Baca</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* COMMUNITY & NEWSLETTER BANNER */}
          <div className="pt-8">
            <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-emerald-50/60 via-white to-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-base font-bold text-foreground">
                    Bergabung dengan Komunitas Diskusi Teknologi
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Dapatkan kabar rilis fitur MarketPoint terbaru, tips monetisasi script, dan sharing pengalaman langsung di grup WhatsApp resmi.
                  </p>
                </div>
              </div>

              <Button asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 px-6 shrink-0 shadow-xs">
                <a
                  href="https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <span>Gabung Grup WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ARTICLE READER MODAL */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white border border-border shadow-xl no-scrollbar">
          {selectedArticle && (
            <div className="space-y-5">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
                    {selectedArticle.category}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedArticle.readTime}
                  </span>
                </div>
                <DialogTitle className="text-lg sm:text-2xl font-black text-foreground leading-snug">
                  {selectedArticle.title}
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-b border-border/50 pb-3">
                  <span>Ditulis oleh: <strong className="text-foreground">{selectedArticle.author}</strong></span>
                  <span>•</span>
                  <span>{selectedArticle.date}</span>
                </div>
              </DialogHeader>

              {/* Article Content Paragraphs */}
              <div className="space-y-3.5 text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal">
                {selectedArticle.content.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  MarketPoint Blog © 2026
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSelectedArticle(null)}
                    className="rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white h-9 px-5"
                  >
                    Tutup Artikel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
