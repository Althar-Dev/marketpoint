"use client";

import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertCircle, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      
      <main className="flex-1 w-full pt-20 pb-20">
        <div className="max-w-screen-md mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10 space-y-4">
            <div className="h-16 w-16 bg-[#00AA5B]/10 rounded-2xl flex items-center justify-center">
              <Scale className="w-8 h-8 text-[#00AA5B]" />
            </div>
            <h1 className="text-3xl font-black font-headline tracking-tight">Syarat & Ketentuan</h1>
            <p className="text-muted-foreground text-sm font-medium">Terakhir diperbarui: 24 Mei 2026</p>
          </div>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-10 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">1. Penerimaan Ketentuan</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Dengan mengakses atau menggunakan platform MarketPoint, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, Anda tidak diperbolehkan menggunakan layanan kami.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">2. Penggunaan Layanan</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Anda bertanggung jawab atas keamanan akun dan kata sandi Anda. MarketPoint tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Anda dalam menjaga kerahasiaan akun.</p>
                  <p>Penggunaan layanan API dan produk digital lainnya harus mematuhi kebijakan penggunaan wajar kami dan tidak boleh melanggar hukum yang berlaku di Indonesia.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">3. Pembatalan & Pengembalian</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Karena sifat produk digital (lisensi, source code, API), MarketPoint umumnya tidak menyediakan pengembalian dana setelah produk diakses atau lisensi diterbitkan, kecuali terjadi kegagalan sistem yang diverifikasi oleh tim teknis kami.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">4. Hukum yang Berlaku</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan melalui yurisdiksi pengadilan di Jakarta.</p>
                </div>
              </section>

              <div className="pt-8 border-t border-border mt-8">
                <p className="text-[11px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                  MarketPoint &copy; 2026 - Transparansi & Kepercayaan
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MarketFooter />
    </div>
  );
}
