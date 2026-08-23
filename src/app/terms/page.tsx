"use client";

import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertCircle, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>
      
      <main className="flex-1 w-full pt-16 md:pt-24 pb-20">
        <div className="max-w-screen-md mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-8 space-y-3">
            <div className="h-12 w-12 bg-[#00AA5B]/10 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-[#00AA5B]" />
            </div>
            <h1 className="text-xl md:text-2xl font-black font-headline tracking-tight">Syarat & Ketentuan</h1>
            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Terakhir diperbarui: 24 Mei 2026</p>
          </div>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-8 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-sm md:text-base font-bold">1. Penerimaan Ketentuan</h2>
                </div>
                <div className="pl-10 space-y-2.5 text-[12px] md:text-[13px] leading-relaxed text-muted-foreground font-medium">
                  <p>Dengan mengakses atau menggunakan platform MarketPoint, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, Anda tidak diperbolehkan menggunakan layanan kami.</p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-sm md:text-base font-bold">2. Penggunaan Layanan</h2>
                </div>
                <div className="pl-10 space-y-2.5 text-[12px] md:text-[13px] leading-relaxed text-muted-foreground font-medium">
                  <p>Anda bertanggung jawab atas keamanan akun dan kata sandi Anda. MarketPoint tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Anda dalam menjaga kerahasiaan akun.</p>
                  <p>Penggunaan layanan API dan produk digital lainnya harus mematuhi kebijakan penggunaan wajar kami dan tidak boleh melanggar hukum yang berlaku di Indonesia.</p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-sm md:text-base font-bold">3. Pembatalan & Pengembalian</h2>
                </div>
                <div className="pl-10 space-y-2.5 text-[12px] md:text-[13px] leading-relaxed text-muted-foreground font-medium">
                  <p>Karena sifat produk digital (lisensi, source code, API), MarketPoint umumnya tidak menyediakan pengembalian dana setelah produk diakses atau lisensi diterbitkan, kecuali terjadi kegagalan sistem yang diverifikasi oleh tim teknis kami.</p>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Scale className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h2 className="text-sm md:text-base font-bold">4. Hukum yang Berlaku</h2>
                </div>
                <div className="pl-10 space-y-2.5 text-[12px] md:text-[13px] leading-relaxed text-muted-foreground font-medium">
                  <p>Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan melalui yurisdiksi pengadilan di Jakarta.</p>
                </div>
              </section>

              <div className="pt-6 border-t border-border mt-6">
                <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em]">
                  MarketPoint &copy; 2026 - Syarat & Ketentuan
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
