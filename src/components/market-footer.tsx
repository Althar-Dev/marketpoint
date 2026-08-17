"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function MarketFooter() {
  const footerLinks = {
    beli: [
      { label: "Kategori", href: "/market" },
      { label: "Top Up & Tagihan", href: "/market" },
      { label: "STS GenKit AI", href: "/ai" },
      { label: "Marketplace API", href: "/docs" },
    ],
    jual: [
      { label: "Pusat Seller", href: "/console" },
      { label: "Daftar Merchant", href: "/signup" },
      { label: "Syarat & Ketentuan Merchant", href: "/terms-of-service" },
    ],
    bantuan: [
      { label: "MarketPoint Care", href: "/support" },
      { label: "Syarat & Ketentuan", href: "/terms-of-service" },
      { label: "Kebijakan Privasi", href: "/privacy-policy" },
      { label: "Hubungi Kami", href: "/support" },
    ],
    market: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Karir", href: "/about" },
      { label: "Blog", href: "/about" },
      { label: "StarVale Solution", href: "/about" },
    ],
  };

  const socials = [
    { icon: "mdi:facebook", href: "#" },
    { icon: "mdi:twitter", href: "#" },
    { icon: "mdi:instagram", href: "https://instagram.com/starvale.id" },
    { icon: "mdi:linkedin", href: "#" },
  ];

  const paymentMethods = [
    { src: "/assets/bank/bca.png", alt: "BCA" },
    { src: "/assets/bank/mandiri.png", alt: "Mandiri" },
    { src: "/assets/bank/bri.png", alt: "BRI" },
    { src: "/assets/bank/bni.png", alt: "BNI" },
    { src: "/assets/bank/bsi-logo.svg", alt: "BSI" },
    { src: "/assets/bank/bss-logo.svg", alt: "BSS" },
    { src: "/assets/bank/permata-logo.svg", alt: "Permata" },
    { src: "/assets/bank/seabank.png", alt: "SeaBank" },
    { src: "/assets/bank/cimb.png", alt: "CIMB" },
    { src: "/assets/bank/bjb.png", alt: "BJB" },
    { src: "/assets/bank/indomaret.png", alt: "Indomaret" },
    { src: "/assets/bank/qris.png", alt: "QRIS" },
    { src: "/assets/bank/ovo.png", alt: "OVO" },
    { src: "/assets/bank/gopay.png", alt: "GOPAY" },
  ];

  return (
    <footer className="bg-white border-t border-border pt-16 pb-8 px-4 md:px-12 lg:px-20 w-full">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-16">
          {/* Column 1: Beli */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-foreground">Beli</h4>
            <ul className="space-y-2">
              {footerLinks.beli.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-muted-foreground hover:text-[#00AA5B] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Jual */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-foreground">Jual</h4>
            <ul className="space-y-2">
              {footerLinks.jual.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-muted-foreground hover:text-[#00AA5B] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Bantuan */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-foreground">Bantuan & Panduan</h4>
            <ul className="space-y-2">
              {footerLinks.bantuan.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-muted-foreground hover:text-[#00AA5B] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Market Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-foreground">MarketPoint Market</h4>
            <ul className="space-y-2">
              {footerLinks.market.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-xs text-muted-foreground hover:text-[#00AA5B] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Branding & App */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-6">
            <div className="space-y-4">
               <h4 className="font-bold text-sm text-foreground">Ikuti Kami</h4>
               <div className="flex gap-3">
                 {socials.map((social, i) => (
                   <a key={i} href={social.href} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-[#00AA5B] hover:text-white transition-all">
                     <Icon icon={social.icon} className="w-4 h-4" />
                   </a>
                 ))}
               </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-foreground">Unduh Aplikasi</h4>
              <div className="flex flex-col gap-2">
                 <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted transition-all">
                   <Icon icon="logos:google-play-icon" className="w-4 h-4" />
                   <div className="text-left">
                     <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">Get it on</p>
                     <p className="text-[10px] font-bold text-foreground leading-none mt-0.5">Google Play</p>
                   </div>
                 </button>
                 <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted transition-all">
                   <Icon icon="logos:apple-app-store" className="w-4 h-4" />
                   <div className="text-left">
                     <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">Download on the</p>
                     <p className="text-[10px] font-bold text-foreground leading-none mt-0.5">App Store</p>
                   </div>
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Payment Partners Marquee */}
        <div className="py-12 border-t border-border flex flex-col items-center gap-8 overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Metode Pembayaran</p>
          <div className="relative w-full max-w-5xl overflow-hidden group">
            {/* The Marquee Container */}
            <div className="flex animate-marquee gap-12 items-center py-2">
              {/* Double items for seamless scrolling */}
              {[...paymentMethods, ...paymentMethods].map((method, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-auto flex-shrink-0 transition-all duration-300 grayscale opacity-40 hover:grayscale-0 hover:opacity-100",
                    (method.alt === "BSS" || method.alt === "Permata") ? "h-6 mt-2" : "h-8 md:h-10"
                  )}
                >
                  <img 
                    src={method.src} 
                    className="h-full w-auto object-contain" 
                    alt={method.alt} 
                  />
                </div>
              ))}
            </div>

            {/* Fading Gradients */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
          </div>
        </div>

        {/* Copyright & Logo Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
            <img 
              src="/assets/img/logo.png" 
              alt="MarketPoint Logo" 
              className="h-8 w-auto object-contain"
            />
            <div className="h-6 w-px bg-border hidden md:block" />
            <p className="text-[10px] text-muted-foreground font-medium">© 2026 <strong>MarketPoint</strong>. All Rights Reserved.</p>
           </div>
           <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              <Link href="/terms-of-service" className="hover:text-[#00AA5B]">Syarat & Ketentuan</Link>
              <Link href="/privacy-policy" className="hover:text-[#00AA5B]">Kebijakan Privasi</Link>
           </div>
        </div>
      </div>
    </footer>
  );
}
