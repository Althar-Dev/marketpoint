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
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Headphones,
  Search,
  X,
  CreditCard,
  KeyRound,
  Store,
  ShieldCheck,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  {
    icon: CreditCard,
    title: "Kendala Pembayaran & Transaksi",
    desc: "Bantuan seputar verifikasi QRIS, Virtual Account, batas waktu transfer, dan rekonsiliasi pembayaran tertunda.",
    actionQuery: "pembayaran"
  },
  {
    icon: KeyRound,
    title: "Aktivasi Lisensi & Unduh File",
    desc: "Panduan mengambil serial key, cara download source code, dan garansi penggantian lisensi 48 jam.",
    actionQuery: "lisensi"
  },
  {
    icon: Store,
    title: "Panduan Merchant & Toko",
    desc: "Cara membuka toko gratis, penarikan saldo (Payout), pengaturan stok otomatis, dan promo flash sale.",
    actionQuery: "toko"
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Akun & Pengembalian Dana",
    desc: "Bantuan klaim garansi escrow, kebijakan refund, lupa password, dan verifikasi OTP WhatsApp.",
    actionQuery: "refund"
  }
];

const FAQS = [
  {
    id: "faq-s-1",
    question: "Berapa lama proses verifikasi pembayaran QRIS dan Virtual Account?",
    answer: "Pembayaran melalui QRIS dan Virtual Account diverifikasi secara otomatis oleh sistem dalam hitungan 5 hingga 30 detik setelah transfer sukses dilakukan dari aplikasi bank atau e-wallet Anda."
  },
  {
    id: "faq-s-2",
    question: "Bagaimana cara mengakses kode lisensi atau link download yang baru saja saya beli?",
    answer: "Setelah pembayaran berhasil, buka menu 'Profil' > 'Pesanan Saya' atau buka halaman detail transaksi terkait. Kode lisensi dan tombol unduh file digital akan langsung tersedia di sana."
  },
  {
    id: "faq-s-3",
    question: "Apa yang harus saya lakukan jika lisensi tidak dapat diaktivasi?",
    answer: "Pertama, hubungi penjual melalui fitur Chat di halaman pesanan untuk meminta panduan atau lisensi pengganti (penjual memiliki waktu 1x24 jam). Jika penjual tidak merespons, Anda dapat mengajukan komplain atau menghubungi tim MarketPoint Care untuk proses pengembalian dana 100%."
  },
  {
    id: "faq-s-4",
    question: "Kapan dana hasil penjualan saya dapat ditarik ke rekening bank?",
    answer: "Saldo penjualan dapat ditarik kapan saja setelah pesanan selesai dan melewati masa garansi proteksi pembeli. Proses pencairan dana (Payout) memakan waktu instan hingga maksimal 1x24 jam kerja."
  },
  {
    id: "faq-s-5",
    question: "Apakah ada biaya langganan bulanan untuk membuka toko di MarketPoint?",
    answer: "Tidak ada sama sekali! Buka toko di MarketPoint 100% gratis tanpa biaya pendaftaran maupun iuran bulanan. Sistem hanya memotong fee komisi kecil ketika produk Anda berhasil terjual."
  }
];

export default function SupportPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [category, setCategory] = useState("Pembayaran & Transaksi");
  const [message, setMessage] = useState("");

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    // Simulasi pengiriman tiket bantuan
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketSubmitted(true);
    }, 800);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & SUPPORT */}
      {!isMobile && <LegalHeader title="Pusat Bantuan" badge="MarketPoint Care" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold leading-tight">Pusat Bantuan</h1>
          </div>
          <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
            Care 24/7
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-0 pb-20 md:pb-16">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-white via-white to-[#F8FAFC] border-b border-border/60 py-10 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00AA5B]/10 border border-[#00AA5B]/20 text-[#00AA5B] text-xs font-bold">
              <Headphones className="w-3.5 h-3.5" />
              <span>Layanan Pelanggan MarketPoint Care</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              Bagaimana Kami Dapat Membantu Anda Hari Ini?
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Temukan solusi kendala transaksi, panduan klaim garansi lisensi, panduan membuka toko, atau hubungi tim customer care kami.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-md mx-auto pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="support-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kendala, lisensi, atau pertanyaan..."
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

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
              <span className="text-muted-foreground font-semibold">Paling sering dicari:</span>
              {["QRIS", "Aktivasi Lisensi", "Refund", "Buka Toko", "Payout"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-0.5 rounded-full border border-border/70 bg-white text-muted-foreground hover:text-[#00AA5B] hover:border-[#00AA5B]/40 transition-all font-medium cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TOPICS CARDS */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOPICS.map((tpc, idx) => {
              const IconComp = tpc.icon;
              return (
                <Card
                  key={idx}
                  onClick={() => setSearchQuery(tpc.actionQuery)}
                  className="border border-border/70 shadow-xs bg-white rounded-2xl overflow-hidden hover:border-[#00AA5B]/50 hover:shadow-sm transition-all p-5 cursor-pointer group"
                >
                  <CardContent className="p-0 space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#00AA5B] transition-colors">
                      {tpc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tpc.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* OFFICIAL CONTACT CHANNELS */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Saluran Bantuan Langsung
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih jalur komunikasi yang paling nyaman bagi Anda untuk terhubung dengan kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Community */}
            <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 space-y-4 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Komunitas Resmi WhatsApp</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tanya jawab langsung bersama komunitas pengguna, penjual, dan developer.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 w-full shadow-xs">
                <a
                  href="https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5"
                >
                  <span>Gabung Grup WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </Card>

            {/* Email Support */}
            <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-blue-50/60 via-white to-white p-5 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Email Customer Care</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kirimkan detail kendala transaksi, bukti transfer, atau keluhan resmi.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 w-full shadow-xs">
                <a href="mailto:support@marketpoint.id" className="flex items-center justify-center gap-1.5">
                  <span>support@marketpoint.id</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </Card>

            {/* Terms & Guide */}
            <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-amber-50/60 via-white to-white p-5 space-y-4 hover:border-amber-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Pusat Kebijakan & ToS</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pelajari aturan garansi escrow, hak cipta lisensi, dan ketentuan toko.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-xl font-bold border-border text-foreground hover:bg-muted/50 text-xs h-9 w-full">
                <Link href="/terms" className="flex items-center justify-center gap-1.5">
                  <span>Buka Syarat & Ketentuan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* TICKET FORM & FAQ CONTAINER */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: TICKET SUBMISSION FORM (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold">
                  Kirim Pesan
                </Badge>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Formulir Kendala & Pertanyaan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Isi formulir di bawah ini dan tim MarketPoint Care akan membalas ke email Anda secepatnya.
                </p>
              </div>

              <Card className="border border-border/70 rounded-2xl bg-white p-5 sm:p-7 shadow-xs">
                {ticketSubmitted ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-foreground">Pesan Berhasil Terkirim!</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Terima kasih telah menghubungi kami. Tiket bantuan Anda telah diterima dan tim kami akan segera menindaklanjutinya ke alamat email <strong>{email}</strong>.
                    </p>
                    <Button
                      onClick={() => {
                        setTicketSubmitted(false);
                        setMessage("");
                        setOrderId("");
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-bold mt-2"
                    >
                      Kirim Pesan Lain
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Masukkan nama Anda"
                          required
                          className="h-9.5 text-xs rounded-xl border-border/80 focus-visible:ring-[#00AA5B]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Alamat Email Aktif <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@email.com"
                          required
                          className="h-9.5 text-xs rounded-xl border-border/80 focus-visible:ring-[#00AA5B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Kategori Kendala <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs rounded-xl border border-border/80 bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[#00AA5B]"
                        >
                          <option value="Pembayaran & Transaksi">Pembayaran & Transaksi</option>
                          <option value="Aktivasi Lisensi / Produk">Aktivasi Lisensi / Produk</option>
                          <option value="Klaim Pengembalian Dana (Refund)">Klaim Pengembalian Dana (Refund)</option>
                          <option value="Akun & Keamanan">Akun & Keamanan</option>
                          <option value="Toko & Mitra Merchant">Toko & Mitra Merchant</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Nomor Pesanan / Invoice <span className="text-muted-foreground font-normal">(Opsional)</span>
                        </label>
                        <Input
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          placeholder="Contoh: MP-202610-001"
                          className="h-9.5 text-xs rounded-xl border-border/80 focus-visible:ring-[#00AA5B]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Detail Pesan & Kendala <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Jelaskan kendala yang Anda alami secara detail..."
                        rows={4}
                        required
                        className="text-xs rounded-xl border-border/80 focus-visible:ring-[#00AA5B]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs h-10 shadow-xs cursor-pointer gap-1.5"
                    >
                      {isSubmitting ? (
                        <span>Mengirimkan Pesan...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Pesan Bantuan</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* RIGHT: QUICK FAQS & OPERATIONAL HOURS (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] font-bold">
                  Jawaban Cepat
                </Badge>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Pertanyaan Sering Diajukan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Jawaban instan untuk pertanyaan umum seputar pesanan Anda.
                </p>
              </div>

              <Card className="border border-border/70 rounded-2xl bg-white p-4 sm:p-5 shadow-xs">
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Tidak ditemukan FAQ untuk "{searchQuery}".
                  </p>
                ) : (
                  <Accordion type="single" collapsible defaultValue="faq-s-1" className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border-border/60 py-0.5">
                        <AccordionTrigger className="text-xs font-bold text-foreground hover:text-[#00AA5B] hover:no-underline text-left py-3">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </Card>

              {/* OPERATIONAL HOURS CARD */}
              <Card className="border border-border/70 rounded-2xl bg-gradient-to-r from-emerald-50/40 to-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4.5 h-4.5 text-[#00AA5B]" />
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    Jam Operasional Layanan
                  </h4>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Sistem Transaksi Otomatis:</span>
                    <span className="font-bold text-[#00AA5B]">24 Jam Nonstop</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tim Respon Bantuan:</span>
                    <span className="font-bold text-foreground">08:00 - 22:00 WIB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hari Kerja:</span>
                    <span className="font-bold text-foreground">Setiap Hari (Senin - Minggu)</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
