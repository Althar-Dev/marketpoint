"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalHeader } from "@/components/legal-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { SELLER_MODULES } from "../modules-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Share2,
  BookOpen,
  Sparkles,
  ChevronRight,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SellerModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const isMobile = useIsMobile();

  const currentModule = SELLER_MODULES.find((m) => m.slug === slug);
  if (!currentModule) {
    notFound();
  }

  const currentIndex = SELLER_MODULES.findIndex((m) => m.slug === slug);
  const prevModule = currentIndex > 0 ? SELLER_MODULES[currentIndex - 1] : null;
  const nextModule =
    currentIndex < SELLER_MODULES.length - 1
      ? SELLER_MODULES[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* HEADER DESKTOP KHUSUS LEGAL & SELLER EDU */}
      {!isMobile && <LegalHeader title="Pusat Edukasi Seller" badge="Seller Academy" />}

      {/* MOBILE APP BAR */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-white border-b border-border/60 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/seller-edu"
              className="p-1 -ml-1 rounded-full hover:bg-muted text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-bold truncate max-w-[220px]">
              {currentModule.title}
            </h1>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-bold border", currentModule.levelBadgeColor)}>
            {currentModule.level}
          </Badge>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full pt-4 pb-20 md:pb-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* BREADCRUMBS & TOP NAV */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto no-scrollbar py-2">
            <Link href="/" className="hover:text-foreground shrink-0">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/seller-edu" className="hover:text-foreground shrink-0">
              Pusat Edukasi Seller
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-foreground font-semibold truncate shrink-0 max-w-[200px] sm:max-w-none">
              {currentModule.title}
            </span>
          </nav>

          {/* TWO COLUMNS LAYOUT: LEFT CONTENT (8 COLS), RIGHT SIDEBAR (4 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ARTICLE CONTENT (8 COLS) */}
            <article className="lg:col-span-8 space-y-8">
              
              {/* HEADER HERO CARD */}
              <Card className="rounded-3xl border border-border/70 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs font-bold border px-3 py-1", currentModule.levelBadgeColor)}>
                      Tingkat: {currentModule.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {currentModule.readTime}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Diperbarui {currentModule.updatedAt}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                  {currentModule.title}
                </h1>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed border-l-2 border-[#00AA5B] pl-4 py-1 italic bg-[#F8FAFC] rounded-r-xl">
                  {currentModule.summary}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                  <span>Penyusun: <strong className="text-foreground">{currentModule.author}</strong></span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: currentModule.title,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link modul berhasil disalin!");
                        }
                      }}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* CHAPTERS BREAKDOWN */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-[#00AA5B]" />
                  <span>Materi & Panduan Praktik</span>
                </div>

                {currentModule.chapters.map((ch, idx) => (
                  <Card key={idx} className="rounded-2xl border border-border/70 bg-white p-6 shadow-xs space-y-4">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      {ch.title}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal">
                      {ch.description}
                    </p>

                    {ch.tips && (
                      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-amber-800">Tips Praktik Terbaik (*Pro Tip*):</p>
                          <p className="leading-relaxed text-amber-900/90">{ch.tips}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* KEY TAKEAWAYS CARD */}
              <Card className="rounded-2xl border border-[#00AA5B]/30 bg-emerald-50/40 p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00AA5B] text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Poin Kunci yang Harus Anda Ingat (*Key Takeaways*)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentModule.keyTakeaways.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* MODULE FAQS */}
              {currentModule.faqs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-[#00AA5B]" />
                    <span>Pertanyaan Umum Terkait Modul Ini</span>
                  </div>

                  <Card className="rounded-2xl border border-border/70 bg-white p-5 shadow-xs">
                    <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
                      {currentModule.faqs.map((faq, fIdx) => (
                        <AccordionItem key={fIdx} value={`faq-${fIdx}`} className="border-border/60">
                          <AccordionTrigger className="text-xs font-bold text-foreground hover:text-[#00AA5B] hover:no-underline text-left py-3">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Card>
                </div>
              )}

              {/* CALL TO ACTION BUTTON */}
              <Card className="rounded-3xl border border-border/80 bg-gradient-to-r from-emerald-50 via-white to-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-base font-bold text-foreground">
                    Siap Menerapkan Materi Ini pada Toko Anda?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Terapkan strategi sekarang dan rasakan peningkatan performa penjualan produk digital Anda.
                  </p>
                </div>

                <Button asChild className="rounded-xl font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs h-10 px-5 shrink-0 shadow-xs">
                  <Link href={currentModule.ctaLink}>
                    {currentModule.ctaText} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </Card>

              {/* PREV & NEXT NAVIGATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/70">
                {prevModule ? (
                  <Link
                    href={`/seller-edu/${prevModule.slug}`}
                    className="p-4 rounded-2xl border border-border/70 bg-white hover:border-[#00AA5B]/50 transition-all space-y-1 text-left group"
                  >
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Modul Sebelumnya
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#00AA5B] transition-colors truncate">
                      {prevModule.title}
                    </p>
                  </Link>
                ) : <div />}

                {nextModule ? (
                  <Link
                    href={`/seller-edu/${nextModule.slug}`}
                    className="p-4 rounded-2xl border border-border/70 bg-white hover:border-[#00AA5B]/50 transition-all space-y-1 text-right group"
                  >
                    <span className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 font-semibold">
                      Modul Selanjutnya <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#00AA5B] transition-colors truncate">
                      {nextModule.title}
                    </p>
                  </Link>
                ) : <div />}
              </div>
            </article>

            {/* SIDEBAR NAVIGATION (4 COLS) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
              
              {/* ALL MODULES LIST */}
              <Card className="rounded-2xl border border-border/70 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#00AA5B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Kurikulum Modul
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {SELLER_MODULES.length} Modul
                  </span>
                </div>

                <div className="space-y-1.5">
                  {SELLER_MODULES.map((mod, idx) => {
                    const isCurrent = mod.slug === currentModule.slug;
                    return (
                      <Link
                        key={mod.slug}
                        href={`/seller-edu/${mod.slug}`}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl text-xs transition-all group",
                          isCurrent
                            ? "bg-[#00AA5B]/10 text-[#00AA5B] font-bold border border-[#00AA5B]/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                            isCurrent ? "bg-[#00AA5B] text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{mod.title}</span>
                        </div>
                        <ChevronRight className={cn(
                          "w-3.5 h-3.5 shrink-0 transition-transform",
                          isCurrent ? "text-[#00AA5B]" : "text-muted-foreground group-hover:translate-x-0.5"
                        )} />
                      </Link>
                    );
                  })}
                </div>
              </Card>

              {/* SELLER COMMUNITY WIDGET */}
              <Card className="rounded-2xl border border-border/70 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Diskusi Bersama Seller</h4>
                    <p className="text-[11px] text-muted-foreground">Komunitas WhatsApp Resmi</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Punya pertanyaan seputar materi modul ini? Bergabunglah ke grup komunitas seller untuk berdiskusi langsung.
                </p>
                <Button asChild className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 w-full shadow-xs">
                  <a
                    href="https://chat.whatsapp.com/DkdmJDYp3fr080QP3G4Xju"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span>Gabung Komunitas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </Card>

              {/* BACK TO OVERVIEW */}
              <div className="text-center">
                <Button asChild variant="outline" className="rounded-xl text-xs font-bold border-border text-muted-foreground hover:text-foreground w-full h-9">
                  <Link href="/seller-edu">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali ke Indeks Edukasi
                  </Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* FOOTER & BOTTOM NAV */}
      {!isMobile ? <MarketFooter /> : <MarketBottomNav />}
    </div>
  );
}
