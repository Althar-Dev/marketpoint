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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Scale,
  FileText,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  CreditCard,
  Lock,
  Headphones,
  Store,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "terms" | "tos" | "faq";

const TERMS_SECTIONS = [
  {
    id: "tc-1",
    title: "1. Penerimaan & Ketentuan Penggunaan",
    icon: CheckCircle2,
    content: [
      "Dengan mendaftar, mengakses, atau menggunakan seluruh layanan di MarketPointID (termasuk situs web, API, dan aplikasi terkait), Anda menyatakan bahwa Anda telah berusia minimal 18 tahun atau memiliki persetujuan wali hukum yang sah, serta setuju untuk terikat oleh seluruh Syarat & Ketentuan ini.",
      "Jika Anda tidak menyetujui salah satu klausul dalam dokumen ini, Anda diwajibkan untuk segera menghentikan penggunaan platform MarketPointID."
    ]
  },
  {
    id: "tc-2",
    title: "2. Akun Pengguna & Keamanan Kredensial",
    icon: Lock,
    content: [
      "Pengguna wajib memberikan data identitas yang valid, akurat, dan dapat dipertanggungjawabkan saat melakukan registrasi akun.",
      "Anda bertanggung jawab penuh atas kerahasiaan kata sandi, kode OTP, dan seluruh aktivitas yang terjadi di bawah akun Anda. MarketPointID tidak bertanggung jawab atas kerugian finansial yang diakibatkan oleh kelalaian atau penyerahan kredensial kepada pihak ketiga.",
      "Setiap indikasi akses tanpa izin atau penyusupan keamanan harus segera dilaporkan kepada tim MarketPointID Care."
    ]
  },
  {
    id: "tc-3",
    title: "3. Transaksi Produk Digital & Hak Lisensi",
    icon: Layers,
    content: [
      "Produk digital yang diperjualbelikan (lisensi software, serial key, source code aplikasi, file desain, voucher, dan akun layanan) bersifat non-fisik dan diserahterimakan secara instan melalui sistem otomatis atau dashboard akun.",
      "Pembelian produk digital memberikan hak penggunaan (Right to Use) sesuai jenis lisensi yang ditetapkan penjual (misalnya Single Domain, Commercial Use, atau Personal License). Pembeli dilarang mendistribusikan ulang, menjual kembali, atau membajak source code tanpa izin tertulis dari pemilik hak cipta.",
      "MarketPointID bertindak sebagai penyedia platform pasar digital yang memfasilitasi transaksi aman antara pembeli dan merchant."
    ]
  },
  {
    id: "tc-4",
    title: "4. Dompet Saldo, Pembayaran & Transaksi",
    icon: CreditCard,
    content: [
      "Seluruh transaksi pembayaran diproses melalui gerbang pembayaran resmi MarketPointID (QRIS, Virtual Account bank, E-Wallet, dan transfer saldo) dengan verifikasi otomatis.",
      "Saldo dompet akun MarketPointID dapat digunakan untuk pembelian produk, pembayaran tagihan PPOB, atau ditarik ke rekening bank terdaftar sesuai batas minimum penarikan yang berlaku.",
      "MarketPointID berhak menahan sementara transaksi atau saldo yang terindikasi mencurigakan, pencucian uang, atau manipulasi sistem hingga proses investigasi selesai."
    ]
  },
  {
    id: "tc-5",
    title: "5. Kebijakan Garansi & Pengembalian Dana (Refund)",
    icon: ShieldCheck,
    content: [
      "Mengingat sifat produk digital yang tidak dapat dikembalikan secara fisik, transaksi yang telah berhasil umumnya bersifat final dan tidak dapat dibatalkan.",
      "Pengembalian dana (refund) atau penggantian lisensi HANYA dapat diberikan dalam kondisi berikut:",
      "a. Lisensi/kunci serial terbukti cacat, kadaluarsa saat diterima, atau tidak dapat diaktivasi dan penjual tidak mampu memberikan penggantian dalam waktu 1x24 jam.",
      "b. Terjadi kegagalan sistem pengiriman otomatis setelah pembayaran terverifikasi sukses.",
      "c. Produk yang dikirimkan berbeda secara substansial dari deskripsi etalase toko penjual.",
      "Klaim garansi wajib diajukan dalam waktu maksimal 48 jam sejak transaksi diselesaikan."
    ]
  },
  {
    id: "tc-6",
    title: "6. Larangan Penggunaan & Pembatasan Konten",
    icon: AlertCircle,
    content: [
      "Pengguna dilarang keras memperjualbelikan:",
      "a. Perangkat lunak berbahaya (malware, ransomware, trojan, keylogger, dsb).",
      "b. Lisensi atau akun hasil peretasan (cracked, stolen credentials, phising).",
      "c. Konten yang melanggar hak cipta, pornografi, ujaran kebencian, atau melanggar hukum Republik Indonesia.",
      "Pelanggaran terhadap ketentuan ini akan mengakibatkan pemblokiran akun permanen, penyitaan saldo, dan pelaporan kepada pihak berwajib."
    ]
  },
  {
    id: "tc-7",
    title: "7. Batasan Tanggung Jawab & Hukum yang Berlaku",
    icon: Scale,
    content: [
      "MarketPointID tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan bisnis, atau gangguan data yang disebabkan oleh penggunaan produk digital pihak ketiga.",
      "Syarat dan Ketentuan ini tunduk pada dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap perselisihan yang tidak dapat diselesaikan melalui musyawarah mufakat akan diselesaikan di yurisdiksi pengadilan yang berwenang di Indonesia."
    ]
  }
];

const TOS_SECTIONS = [
  {
    id: "tos-1",
    title: "1. Ketentuan Pendaftaran Mitra Merchant / Seller",
    icon: Store,
    content: [
      "Setiap pengguna yang ingin menjual produk digital wajib mengaktifkan Toko Saya dan melengkapi verifikasi identitas (KYC) toko yang disyaratkan oleh tim verifikasi MarketPointID.",
      "Merchant bertanggung jawab penuh atas keabsahan, keaslian, kepemilikan hak cipta, dan fungsionalitas produk digital yang diunggah ke etalase platform."
    ]
  },
  {
    id: "tos-2",
    title: "2. Kualitas Produk, File & Deskripsi Etalase",
    icon: FileText,
    content: [
      "Merchant wajib mencantumkan deskripsi yang jelas, jujur, dan terperinci mengenai spesifikasi, versi perangkat lunak, persyaratan sistem, dan batas garansi produk.",
      "File yang diunggah harus bebas dari kode jahat (clean of virus/backdoor). File source code harus dilengkapi dengan dokumentasi instalasi atau panduan penggunaan yang layak.",
      "Untuk produk bertipe lisensi/serial, merchant wajib menjaga ketersediaan stok lisensi aktif yang valid."
    ]
  },
  {
    id: "tos-3",
    title: "3. Kebijakan Komisi Platform & Penarikan Dana (Payout)",
    icon: CreditCard,
    content: [
      "MarketPointID membebankan biaya komisi layanan yang kompetitif (antara 1% hingga 5% tergantung kategori produk dan status merchant) pada setiap transaksi yang berhasil diselesaikan.",
      "Dana hasil penjualan akan masuk ke Saldo Penghasilan Merchant setelah pesanan diselesaikan oleh pembeli atau otomatis selesai setelah periode proteksi garansi berakhir.",
      "Merchant dapat melakukan penarikan saldo (Payout) ke rekening bank atau e-wallet kapan saja dengan waktu proses pencairan instan hingga 1x24 jam kerja."
    ]
  },
  {
    id: "tos-4",
    title: "4. Service Level Agreement (SLA) & Dukungan Pembeli",
    icon: Headphones,
    content: [
      "Merchant berkewajiban merespons pesan obrolan (Chat) dari calon pembeli atau komplain pelanggan dalam waktu maksimal 24 jam.",
      "Toko yang memiliki tingkat komplain tinggi, keterlambatan pengiriman lisensi manual, atau terbukti mengabaikan pembeli akan dikenakan penalti poin performa toko."
    ]
  },
  {
    id: "tos-5",
    title: "5. Penalti & Penangguhan Toko (Suspension)",
    icon: AlertCircle,
    content: [
      "MarketPointID berhak menonaktifkan produk, menurunkan ranking pencarian, atau membekukan akun toko secara sepihak jika ditemukan:",
      "a. Penjualan lisensi ilegal / revoke berulang kali.",
      "b. Praktik manipulasi ulasan atau transaksi palsu (fake order).",
      "c. Pengalihan transaksi di luar sistem resmi MarketPointID (transaksi langsung via WhatsApp/kontak pribadi untuk menghindari proteksi escrow)."
    ]
  }
];

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "Bagaimana cara membeli lisensi atau produk digital di MarketPointID?",
    answer: "Pilih produk digital yang Anda inginkan di katalog, klik tombol 'Beli Sekarang' atau '+ Keranjang', lalu pilih metode pembayaran yang tersedia (QRIS instan, Virtual Account bank, atau Saldo Akun). Setelah pembayaran terverifikasi otomatis, link download atau kode lisensi akan langsung muncul di halaman detail pesanan Anda."
  },
  {
    id: "faq-2",
    question: "Berapa lama proses pengiriman produk digital setelah pembayaran?",
    answer: "Untuk produk bertipe 'Pengiriman Otomatis' (instant license key / auto download), produk akan terkirim dalam hitungan detik setelah pembayaran berhasil. Untuk produk kustom yang memerlukan konfigurasi khusus oleh penjual, waktu pengerjaan akan disesuaikan dengan estimasi yang tertera pada etalase toko."
  },
  {
    id: "faq-3",
    question: "Apakah transaksi di MarketPointID bergaransi?",
    answer: "Ya, 100%! Seluruh transaksi dilindungi oleh sistem Rekening Bersama (Escrow System). Dana pembayaran tidak langsung diteruskan ke penjual sampai Anda memastikan lisensi atau produk digital tersebut berfungsi dengan baik sesuai deskripsi."
  },
  {
    id: "faq-4",
    question: "Bagaimana jika lisensi yang saya beli tidak dapat diaktivasi?",
    answer: "Anda dapat langsung menghubungi penjual melalui fitur Chat Toko atau mengajukan komplain pesanan di riwayat pembelian Anda. Penjual memiliki waktu 1x24 jam untuk memberikan lisensi pengganti yang valid. Jika penjual tidak dapat menyelesaikan kendala, dana Anda akan dikembalikan 100% oleh sistem MarketPointID."
  },
  {
    id: "faq-5",
    question: "Metode pembayaran apa saja yang didukung oleh MarketPointID?",
    answer: "Kami mendukung QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay), Virtual Account semua bank utama nasional, gerai Indomaret/Alfamart, dan Saldo Dompet Akun MarketPointID."
  },
  {
    id: "faq-6",
    question: "Bagaimana cara mendaftar menjadi penjual / merchant?",
    answer: "Cukup masuk ke akun Anda, klik menu 'Buka Toko' atau navigasi ke '/register', lengkapi data toko Anda (nama toko, domain slug, dan rekening pencairan), lalu Anda bisa langsung mulai mengunggah katalog produk digital Anda."
  },
  {
    id: "faq-7",
    question: "Berapa biaya komisi untuk penjual?",
    answer: "Biaya komisi platform sangat terjangkau, yaitu mulai dari 1% per transaksi sukses, tanpa biaya langganan bulanan tersembunyi. Anda hanya membayar saat produk Anda berhasil terjual."
  },
  {
    id: "faq-8",
    question: "Apakah saya bisa menjual source code aplikasi buatan saya sendiri?",
    answer: "Tentu saja! Kami sangat mendukung kreator dan pengembang software lokal untuk menjual source code aplikasi web, mobile (Flutter/React Native), script backend, dan UI Kit desain mereka kepada ribuan pembeli di MarketPointID."
  }
];

export default function TermsPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>("terms");
  const [searchQuery, setSearchQuery] = useState("");

  const filterText = searchQuery.toLowerCase().trim();

  const filteredTerms = TERMS_SECTIONS.filter((sec) => {
    if (!filterText) return true;
    return (
      sec.title.toLowerCase().includes(filterText) ||
      sec.content.some((c) => c.toLowerCase().includes(filterText))
    );
  });

  const filteredTos = TOS_SECTIONS.filter((sec) => {
    if (!filterText) return true;
    return (
      sec.title.toLowerCase().includes(filterText) ||
      sec.content.some((c) => c.toLowerCase().includes(filterText))
    );
  });

  const filteredFaq = FAQ_ITEMS.filter((item) => {
    if (!filterText) return true;
    return (
      item.question.toLowerCase().includes(filterText) ||
      item.answer.toLowerCase().includes(filterText)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & POLICY (BUKAN HEADER MARKET) */}
      {!isMobile && <LegalHeader title="Syarat & Ketentuan" badge="Legal & Policy" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Pusat Kebijakan & Ketentuan</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            Legal
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 py-10 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>Transparansi & Keamanan Ekosistem MarketPointID</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Pusat Kebijakan, Ketentuan Layanan & FAQ
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Panduan lengkap mengenai hak dan kewajiban pengguna, pedoman mitra merchant, jaminan transaksi, serta jawaban pertanyaan yang sering diajukan.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-md mx-auto pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="terms-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari topik ketentuan atau pertanyaan..."
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

            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pt-1">
              Terakhir Diperbarui: 10 Oktober 2026
            </p>
          </div>
        </section>

        {/* TAB CONTROLS & CONTENT CONTAINER */}
        <section className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
          {/* TAB BUTTONS (SEGMENTED CONTROL) */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 bg-muted/60 rounded-2xl border border-border/60 max-w-full overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
                  activeTab === "terms"
                    ? "bg-white text-foreground shadow-xs text-[#00AA5B]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-4 h-4" />
                <span>Terms & Conditions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tos")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
                  activeTab === "tos"
                    ? "bg-white text-foreground shadow-xs text-[#00AA5B]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Store className="w-4 h-4" />
                <span>Terms of Service</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("faq")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
                  activeTab === "faq"
                    ? "bg-white text-foreground shadow-xs text-[#00AA5B]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HelpCircle className="w-4 h-4" />
                <span>FAQ (Tanya Jawab)</span>
                <Badge className="bg-[#00AA5B] text-white text-[9px] px-1.5 py-0 border-none font-bold ml-0.5">
                  8
                </Badge>
              </button>
            </div>
          </div>

          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00AA5B] shrink-0 mt-0.5" />
                <div className="text-xs text-foreground/90 space-y-0.5">
                  <p className="font-bold text-foreground">Syarat & Ketentuan Umum Pengguna</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Klausul di bawah ini mengatur hak, kewajiban, dan tata cara transaksi produk digital antara pembeli dan platform MarketPointID.
                  </p>
                </div>
              </div>

              {filteredTerms.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border p-6 space-y-2">
                  <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-bold text-foreground">Tidak Ada Hasil Ditemukan</p>
                  <p className="text-xs text-muted-foreground">Tidak ada klausul yang cocok dengan pencarian "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTerms.map((sec) => {
                    const IconComp = sec.icon;
                    return (
                      <Card key={sec.id} className="border border-border/70 shadow-xs bg-white rounded-2xl overflow-hidden hover:border-[#00AA5B]/40 transition-all">
                        <CardContent className="p-4 sm:p-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground">
                              {sec.title}
                            </h3>
                          </div>
                          <div className="pl-11 space-y-2 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                            {sec.content.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE (MERCHANT / SELLER) */}
          {activeTab === "tos" && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-4 flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground/90 space-y-0.5">
                  <p className="font-bold text-foreground">Ketentuan Layanan Khusus Merchant & Penjual</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Pedoman operasional, standar file, bagi hasil komisi, dan SLA yang wajib ditaati oleh seluruh pemilik toko digital di platform.
                  </p>
                </div>
              </div>

              {filteredTos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border p-6 space-y-2">
                  <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-bold text-foreground">Tidak Ada Hasil Ditemukan</p>
                  <p className="text-xs text-muted-foreground">Tidak ada ketentuan yang cocok dengan pencarian "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTos.map((sec) => {
                    const IconComp = sec.icon;
                    return (
                      <Card key={sec.id} className="border border-border/70 shadow-xs bg-white rounded-2xl overflow-hidden hover:border-blue-400/40 transition-all">
                        <CardContent className="p-4 sm:p-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground">
                              {sec.title}
                            </h3>
                          </div>
                          <div className="pl-11 space-y-2 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                            {sec.content.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAQ (FREQUENTLY ASKED QUESTIONS) */}
          {activeTab === "faq" && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground/90 space-y-0.5">
                  <p className="font-bold text-foreground">Pertanyaan yang Sering Diajukan (FAQ)</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Jawaban cepat seputar cara pembelian lisensi, pengiriman otomatis, garansi dana, dan pencairan saldo.
                  </p>
                </div>
              </div>

              {filteredFaq.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border p-6 space-y-2">
                  <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-bold text-foreground">Tidak Ada Hasil Ditemukan</p>
                  <p className="text-xs text-muted-foreground">Tidak ada FAQ yang cocok dengan pencarian "{searchQuery}".</p>
                </div>
              ) : (
                <Card className="border border-border/70 shadow-xs bg-white rounded-2xl overflow-hidden p-4 sm:p-6">
                  <Accordion type="single" collapsible defaultValue="faq-1" className="w-full">
                    {filteredFaq.map((item) => (
                      <AccordionItem key={item.id} value={item.id} className="border-border/60 py-1">
                        <AccordionTrigger className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00AA5B] hover:no-underline text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed pt-1 pb-3 pl-1">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              )}
            </div>
          )}

          {/* NEED MORE HELP CARD */}
          <div className="pt-6">
            <div className="p-6 rounded-2xl border border-border/70 bg-gradient-to-r from-white to-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-11 h-11 rounded-2xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Memiliki Pertanyaan Lain?</h4>
                  <p className="text-xs text-muted-foreground">
                    Tim Customer Support MarketPointID Care siap membantu kendala Anda 24/7.
                  </p>
                </div>
              </div>

              <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs h-9 px-5 shrink-0 shadow-xs">
                <Link href="/support">
                  Hubungi Bantuan <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
