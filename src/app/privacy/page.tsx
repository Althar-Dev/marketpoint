"use client";

import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      
      <main className="flex-1 w-full pt-20 pb-20">
        <div className="max-w-screen-md mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10 space-y-4">
            <div className="h-16 w-16 bg-[#00AA5B]/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#00AA5B]" />
            </div>
            <h1 className="text-3xl font-black font-headline tracking-tight">Kebijakan Privasi</h1>
            <p className="text-muted-foreground text-sm font-medium">Terakhir diperbarui: 24 Mei 2026</p>
          </div>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-10 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">1. Informasi yang Kami Kumpulkan</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat membuat akun, menggunakan layanan kami, atau berkomunikasi dengan kami. Ini termasuk:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Nama lengkap dan informasi profil.</li>
                    <li>Alamat email dan nomor telepon.</li>
                    <li>Detail transaksi dan riwayat penggunaan API.</li>
                    <li>Informasi toko (jika Anda adalah penjual).</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">2. Penggunaan Informasi</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Informasi yang kami kumpulkan digunakan untuk:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Menyediakan, memelihara, dan meningkatkan layanan MarketPoint.</li>
                    <li>Memproses transaksi dan mengirimkan pemberitahuan terkait.</li>
                    <li>Melindungi keamanan akun Anda dan mencegah aktivitas penipuan.</li>
                    <li>Berkomunikasi dengan Anda mengenai produk, layanan, dan promo.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">3. Keamanan Data</h2>
                </div>
                <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
                  <p>Kami mengambil langkah-langkah teknis dan organisasi yang wajar untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi melalui internet yang 100% aman.</p>
                </div>
              </section>

              <div className="pt-8 border-t border-border mt-8">
                <p className="text-[11px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                  MarketPoint &copy; 2026 - Komitmen Kami pada Privasi Anda
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
