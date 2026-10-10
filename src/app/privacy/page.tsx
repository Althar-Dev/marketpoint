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
  Shield,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  Share2,
  Trash2,
  Cookie,
  AlertTriangle,
  Mail,
  Search,
  X,
  CheckCircle2,
  ArrowRight,
  Database,
  KeyRound,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIVACY_SECTIONS = [
  {
    id: "p-1",
    title: "1. Pendahuluan & Komitmen Privasi",
    icon: Shield,
    badge: "Komitmen",
    summary: "Landasan hukum perlindungan data pribadi dan komitmen transparansi MarketPoint.",
    content: [
      "Selamat datang di Kebijakan Privasi MarketPoint (dioperasikan oleh MarketPoint Indonesia). Kami berkomitmen tinggi untuk melindungi dan menghormati hak privasi serta kerahasiaan data pribadi setiap pengguna, pembeli, mitra merchant, dan pengembang yang mengakses platform kami.",
      "Kebijakan ini disusun berdasarkan Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) serta standar perlindungan privasi internasional yang relevan.",
      "Dengan mendaftar, mengakses, atau bertransaksi di situs web dan layanan API MarketPoint, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh tata cara pemrosesan data pribadi sebagaimana tercantum dalam dokumen ini."
    ]
  },
  {
    id: "p-2",
    title: "2. Data Pribadi yang Kami Kumpulkan",
    icon: Database,
    badge: "Pengumpulan Data",
    summary: "Rincian kategori data yang diserahkan langsung oleh pengguna maupun dikumpulkan secara otomatis.",
    content: [
      "Kami mengumpulkan data pribadi yang Anda berikan secara sukarela maupun yang tercatat secara otomatis oleh sistem saat Anda menggunakan platform:",
      "a. Data Identitas Akun: Nama lengkap, username/slug, alamat email aktif, nomor WhatsApp/telepon seluler, kata sandi terenkripsi, dan foto profil avatar.",
      "b. Data Verifikasi Penjual (KYC Merchant): Nomor Induk Kependudukan (NIK/KTP), nama toko, rekening bank atau nomor e-wallet untuk pencairan dana, serta dokumen legalitas usaha (khusus merchant resmi).",
      "c. Data Transaksi & Finansial: Riwayat pembelian produk digital, nominal transaksi, metode pembayaran yang dipilih (QRIS/Virtual Account), status pembayaran, saldo dompet internal, dan riwayat penarikan dana (kami TIDAK PERNAH menyimpan nomor kartu kredit lengkap Anda).",
      "d. Data Teknis & Penggunaan Otomatis: Alamat Protokol Internet (IP Address), jenis peramban (browser), sistem operasi, pengidentifikasi perangkat, log akses API, cookies penjelajahan, dan riwayat klik halaman."
    ]
  },
  {
    id: "p-3",
    title: "3. Tujuan & Dasar Hukum Pemrosesan Data",
    icon: UserCheck,
    badge: "Pemrosesan",
    summary: "Alasan mengapa data pribadi Anda diperlukan dalam ekosistem layanan kami.",
    content: [
      "MarketPoint memproses data pribadi Anda hanya untuk tujuan yang sah dan terdefinisi secara jelas, antara lain:",
      "a. Memfasilitasi Transaksi: Memverifikasi pembayaran, menerbitkan lisensi perangkat lunak otomatis, menyerahkan file source code, dan mengelola saldo dompet digital Anda.",
      "b. Keamanan & Pencegahan Penipuan: Memantau aktivitas transaksi mencurigakan, mencegah pencucian uang, melindungi akun dari peretasan (brute-force), dan menegakkan aturan anti-pembajakan.",
      "c. Komunikasi Layanan: Mengirimkan faktur digital, notifikasi status pesanan, notifikasi keamanan akun, dan balasan tiket bantuan MarketPoint Care.",
      "d. Peningkatan Platform: Menganalisis kinerja teknis, mempercepat latensi API, dan menyempurnakan antarmuka pengguna agar semakin optimal.",
      "e. Kepatuhan Hukum: Memenuhi kewajiban perpajakan, peraturan Bank Indonesia, dan instruksi penegak hukum yang sah di wilayah Republik Indonesia."
    ]
  },
  {
    id: "p-4",
    title: "4. Pembagian Data Kepada Pihak Ketiga",
    icon: Share2,
    badge: "Pihak Ketiga",
    summary: "Batasan ketat pembagian data hanya kepada mitra berlisensi resmi.",
    content: [
      "MarketPoint TIDAK PERNAH dan TIDAK AKAN PERNAH menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk kepentingan periklanan tanpa persetujuan eksplisit Anda.",
      "Data Anda hanya dibagikan kepada pihak ketiga terpercaya dalam lingkup operasional berikut:",
      "a. Mitra Gerbang Pembayaran (Payment Gateway): Penyedia lisensi QRIS, bank nasional, dan switching pembayaran resmi untuk memverifikasi keabsahan transfer dana Anda.",
      "b. Agregator Provider PPOB & Telekomunikasi: Nomor tujuan pulsa, token listrik PLN, atau ID game yang Anda masukkan hanya diteruskan ke provider terkait untuk menyelesaikan pesanan.",
      "c. Mitra Merchant / Penjual: Nama penerima dan detail pesanan diteruskan kepada merchant terkait apabila produk memerlukan konfigurasi atau pengiriman lisensi manual.",
      "d. Infrastruktur Cloud & Keamanan: Penyedia server cloud terenkripsi (AWS Cloud / Firebase) yang terikat perjanjian kerahasiaan data (Data Processing Agreement) ketat."
    ]
  },
  {
    id: "p-5",
    title: "5. Standar Keamanan & Perlindungan Data",
    icon: Lock,
    badge: "Keamanan Enkripsi",
    summary: "Protokol keamanan teknis berlapis untuk melindungi data dari penyusupan.",
    content: [
      "Kami menerapkan standar keamanan teknis dan organisasional berstandar industri modern untuk melindungi data pribadi Anda dari akses tidak sah, kebocoran, atau perusakan:",
      "a. Enkripsi Data Saat Transit: Seluruh pertukaran data antara browser Anda dan server kami dienkripsi menggunakan protokol Transport Layer Security (TLS 1.3 / SSL 256-bit).",
      "b. Enkripsi Data Saat Istirahat: Kata sandi akun disimpan menggunakan algoritma hashing salted satu arah (bcrypt/argon2) yang tidak dapat dibaca bahkan oleh staf internal.",
      "c. Isolasi Database & Akses Terbatas: Akses ke basis data produksi hanya diberikan kepada personel teknis berwenang melalui autentikasi multi-faktor (MFA) dan audit log ketat.",
      "d. Pemantauan 24/7 & Firewall: Sistem kami dilindungi oleh firewall aplikasi web (WAF) dan pencegahan DDoS otomatis dari Cloudflare."
    ]
  },
  {
    id: "p-6",
    title: "6. Retensi & Penyimpanan Data",
    icon: Server,
    badge: "Retensi Data",
    summary: "Jangka waktu kami menyimpan data pribadi Anda dalam sistem.",
    content: [
      "Kami menyimpan data pribadi Anda selama akun Anda aktif dan terdaftar di MarketPoint, atau selama diperlukan untuk memenuhi tujuan pengumpulannya.",
      "Data transaksi keuangan dan catatan pembayaran akan disimpan sekurang-kurangnya selama 5 (lima) tahun sesuai dengan peraturan pembukuan dan perpajakan di Indonesia.",
      "Setelah periode retensi yang diwajibkan oleh hukum berakhir, data pribadi Anda akan dihapus secara permanen atau dianonimkan agar tidak dapat lagi dikaitkan dengan identitas Anda."
    ]
  },
  {
    id: "p-7",
    title: "7. Hak-Hak Anda sebagai Pemilik Data Pribadi",
    icon: KeyRound,
    badge: "Hak Pengguna",
    summary: "Kewenangan penuh Anda atas data pribadi sesuai UU PDP No. 27/2022.",
    content: [
      "Sesuai regulasi UU Pelindungan Data Pribadi, Anda memiliki hak-hak penting berikut:",
      "a. Hak Akses & Portabilitas: Anda berhak melihat, meminta salinan, dan mengunduh seluruh data riwayat profil serta transaksi Anda.",
      "b. Hak Pembetulan (Rektifikasi): Anda berhak memperbarui data profil yang tidak akurat kapan saja melalui menu Pengaturan Akun.",
      "c. Hak Penghapusan (Right to be Forgotten): Anda berhak mengajukan penutupan akun permanen dan penghapusan data pribadi Anda, sepanjang tidak bertentangan dengan kewajiban retensi hukum perpajakan/transaksi.",
      "d. Hak Menarik Persetujuan: Anda dapat menarik persetujuan langganan email promosi/newsletter melalui tombol unsubscribe kapan saja.",
      "Untuk mengajukan permohonan pemenuhan hak data pribadi, Anda dapat menghubungi tim kepatuhan kami melalui formulir kontak atau email DPO."
    ]
  },
  {
    id: "p-8",
    title: "8. Kebijakan Cookie & Teknologi Pelacakan",
    icon: Cookie,
    badge: "Cookie Policy",
    summary: "Bagaimana kami menggunakan cookie untuk menjaga sesi login dan preferensi Anda.",
    content: [
      "MarketPoint menggunakan cookie dan teknologi serupa (seperti LocalStorage) untuk:",
      "a. Menjaga sesi login Anda tetap aktif dan aman tanpa perlu berulang kali memasukkan kredensial.",
      "b. Menyimpan preferensi tema (Dark/Light mode) dan isi keranjang belanja sementara.",
      "c. Menganalisis lalu lintas anonim untuk mencegah serangan bot dan aktivitas scraping ilegal.",
      "Anda memiliki opsi untuk mematikan cookie melalui pengaturan peramban (browser) Anda, namun beberapa fungsi penting platform mungkin tidak dapat beroperasi secara optimal."
    ]
  },
  {
    id: "p-9",
    title: "9. Pembaruan Kebijakan & Kontak Petugas Privasi (DPO)",
    icon: Mail,
    badge: "Kontak DPO",
    summary: "Saluran resmi untuk pertanyaan, masukan, dan pengaduan privasi.",
    content: [
      "MarketPoint dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk menyesuaikan dengan perkembangan teknologi dan regulasi pemerintah yang baru.",
      "Setiap perubahan substansial akan diumumkan melalui notifikasi di platform atau melalui email terdaftar sebelum perubahan tersebut mulai berlaku efektif.",
      "Jika Anda memiliki pertanyaan, keberatan, atau ingin mengajukan permohonan terkait data pribadi Anda, silakan hubungi Pejabat Perlindungan Data kami:",
      "• Email Khusus Privasi: privacy@marketpoint.id / dpo@marketpoint.id",
      "• Pusat Layanan: MarketPoint Care (Support Center 24/7)",
      "• Alamat Operasional: Gedung MarketPoint Center, Indonesia."
    ]
  }
];

export default function PrivacyPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const filterText = searchQuery.toLowerCase().trim();

  const filteredSections = PRIVACY_SECTIONS.filter((sec) => {
    if (!filterText) return true;
    return (
      sec.title.toLowerCase().includes(filterText) ||
      sec.summary.toLowerCase().includes(filterText) ||
      sec.content.some((c) => c.toLowerCase().includes(filterText))
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & POLICY (BUKAN HEADER MARKET) */}
      {!isMobile && <LegalHeader title="Kebijakan Privasi" badge="Privacy & Data Protection" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Kebijakan Privasi</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            UU PDP No. 27/2022
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO BANNER SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 py-10 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Standar Kepatuhan UU PDP No. 27 Tahun 2022</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Kebijakan Privasi & Perlindungan Data Pribadi
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Komitmen penuh MarketPoint untuk menjaga transparansi, mengamankan identitas digital, dan menghormati hak data pribadi seluruh pengguna platform.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-md mx-auto pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="privacy-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari klausul privasi (cth: enkripsi, refund, cookie)..."
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

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1 text-[#00AA5B]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terenkripsi TLS 1.3
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#00AA5B]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Anti Penjualan Data
              </span>
              <span>•</span>
              <span>Diperbarui: 10 Oktober 2026</span>
            </div>
          </div>
        </section>

        {/* PRIVACY CONTENT CLAUSES */}
        <section className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border p-6 space-y-2">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">Tidak Ada Klausul yang Cocok</p>
              <p className="text-xs text-muted-foreground">Tidak ditemukan pasal privasi dengan kata kunci "{searchQuery}".</p>
            </div>
          ) : (
            filteredSections.map((sec) => {
              const IconComp = sec.icon;
              return (
                <Card
                  key={sec.id}
                  id={sec.id}
                  className="border border-border/70 shadow-xs bg-white rounded-2xl overflow-hidden hover:border-[#00AA5B]/40 transition-all"
                >
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <h2 className="text-sm sm:text-base font-bold text-foreground">
                          {sec.title}
                        </h2>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-border/80 text-muted-foreground self-start sm:self-auto bg-muted/20">
                        {sec.badge}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#00AA5B] font-semibold italic pl-0 sm:pl-12">
                      {sec.summary}
                    </p>

                    <div className="pl-0 sm:pl-12 space-y-2.5 text-xs sm:text-[13px] text-muted-foreground leading-relaxed pt-1">
                      {sec.content.map((p, pIdx) => (
                        <p key={pIdx} className="leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* DPO CONTACT & DATA REQUEST CARD */}
          <div className="pt-6">
            <div className="p-6 rounded-2xl border border-border/70 bg-gradient-to-r from-emerald-50/50 via-white to-white flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Ajukan Permohonan Akses / Penghapusan Data Pribadi
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sesuai hak Anda di UU PDP, Anda dapat mengajukan salinan data atau penutupan akun permanen kepada tim Data Protection Officer (DPO).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs h-9 px-5 shadow-xs">
                  <Link href="mailto:privacy@marketpoint.id">
                    Hubungi DPO <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
