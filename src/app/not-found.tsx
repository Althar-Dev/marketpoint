"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  ArrowLeft,
  Search,
  Zap,
  ShoppingBag,
  HelpCircle,
  Compass
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-white to-slate-50 flex flex-col items-center justify-between font-body text-[#212121] px-4 py-6 md:py-10 select-none relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header / Logo */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4">
        <Link href="/" className="inline-flex items-center gap-2 group transition-transform active:scale-95">
          <img
            src="/assets/img/logo.png"
            alt="MarketPointID"
            className="h-8 md:h-9 w-auto object-contain"
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-muted-foreground hover:text-[#00AA5B] transition-colors flex items-center gap-1.5"
        >
          <Compass className="w-3.5 h-3.5" /> Jelajahi Pasar
        </Link>
      </header>

      {/* Central Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-xl w-full text-center my-4 animate-in fade-in zoom-in-95 duration-500">
        {/* 404 Mascot Image */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto mb-2 drop-shadow-md">
          <Image
            src="/assets/img/404.png"
            alt="404 Halaman Tidak Ditemukan"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 320px, 400px"
          />
        </div>

        {/* Text Details */}
        <div className="space-y-2.5 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#00AA5B] text-[11px] font-bold tracking-wide uppercase shadow-2xs">
            <span>404</span>
            <span className="opacity-40">•</span>
            <span>Halaman Tidak Ditemukan</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#212121]">
            Wah, Kamu Tersesat di Pasar!
          </h1>

          <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
            Halaman yang kamu tuju mungkin sudah dipindahkan, dihapus, atau link yang dimasukkan kurang tepat. Jangan bingung, yuk kembali ke jalan yang benar!
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-sm">
          <Button
            asChild
            className="w-full sm:w-auto h-10 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs font-bold gap-2 shadow-sm transition-transform active:scale-95"
          >
            <Link href="/">
              <Home className="w-4 h-4" /> Ke Beranda Utama
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto h-10 px-5 rounded-xl border-border/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold gap-2 shadow-2xs transition-transform active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </div>

        {/* Quick Shortcut Links */}
        <div className="pt-8 border-t border-border/40 mt-8 w-full max-w-md">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Atau Coba Akses Menu Populer:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/topup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#00AA5B] text-[11px] font-semibold text-slate-700 transition-colors border border-border/40"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Topup & Tagihan
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#00AA5B] text-[11px] font-semibold text-slate-700 transition-colors border border-border/40"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" /> Cari Produk
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#00AA5B] text-[11px] font-semibold text-slate-700 transition-colors border border-border/40"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#00AA5B]" /> Katalog Pasar
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center pt-4 text-[10px] text-muted-foreground/60">
        &copy; {new Date().getFullYear()} MarketPointID. Semua hak dilindungi.
      </footer>
    </div>
  );
}
