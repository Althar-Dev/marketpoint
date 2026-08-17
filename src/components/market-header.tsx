
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Search, 
  ShoppingBag, 
  ChevronDown,
  Bell,
  MessageCircle,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MarketHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { title: "API Bridge", href: "/market?cat=api" },
    { title: "Source Code", href: "/market?cat=source" },
    { title: "Bot Automation", href: "/market?cat=bot" },
    { title: "AI GenKit", href: "/market?cat=ai" },
  ];

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center",
      "bg-background border-b border-border shadow-sm"
    )}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center gap-4 md:gap-8 w-full">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/assets/img/logo.png" 
            alt="MarketPoint Logo" 
            className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col leading-none hidden sm:flex">
            <span className="text-[8px] font-bold uppercase tracking-widest text-primary/40">Market</span>
            <span className="font-headline font-bold text-base md:text-lg tracking-tighter">Point</span>
          </div>
        </Link>

        <div className="hidden lg:block">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-wider">
                Kategori <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 rounded-xl border-border" align="start">
              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.title} 
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-xs font-bold transition-all"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-primary/40" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Bar - Stretches to fill space */}
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <Input 
            placeholder="Cari solusi infrastruktur atau API..." 
            className="h-10 pl-10 pr-4 rounded-xl bg-muted/40 border-border focus:bg-background focus:ring-primary/5 transition-all text-xs"
          />
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-1">
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <ShoppingBag className="w-4.5 h-4.5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <Bell className="w-4.5 h-4.5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <MessageCircle className="w-4.5 h-4.5" />
            </Button>
          </div>

          <div className="flex items-center">
            <Button asChild size="sm" className="h-9 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg bg-[#00AA5B] shadow-[#00AA5B]/10 hover:bg-[#00AA5B]/90 transition-all">
              <Link href="/signin">Masuk</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}