"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Scale,
  Shield,
  FileText,
  Info,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  LogIn
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalHeaderProps {
  title?: string;
  badge?: string;
}

export function LegalHeader({ title, badge = "Legal & Policies" }: LegalHeaderProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const navLinks = [
    { label: "Blog", href: "/blog", active: pathname === "/blog" },
    { label: "Tentang Kami", href: "/about", active: pathname === "/about" },
    { label: "Syarat & Ketentuan", href: "/terms", active: pathname === "/terms" },
    { label: "Kebijakan Privasi", href: "/privacy", active: pathname === "/privacy" },
    { label: "Pusat Bantuan", href: "/support", active: pathname === "/support" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border/70 shadow-2xs">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Context Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/assets/img/logo.png"
              alt="MarketPointID Logo"
              className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-1.5 select-none leading-none">
              <div className="flex flex-col justify-center leading-none">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 leading-none mb-0.5">
                  Market
                </span>
                <span className="font-headline font-bold text-base md:text-[17px] tracking-tight text-foreground leading-none">
                  Point
                </span>
              </div>
              <span className="font-headline font-black text-2xl md:text-3xl text-[#00AA5B] tracking-tight leading-none">
                ID
              </span>
            </div>
          </Link>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          <Badge
            variant="outline"
            className="text-[10px] font-bold text-muted-foreground border-border/80 hidden sm:inline-flex bg-muted/30"
          >
            {badge}
          </Badge>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                link.active
                  ? "bg-[#00AA5B]/10 text-[#00AA5B]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs font-bold border-border/80 text-foreground hover:bg-muted/50 gap-1.5 shadow-xs"
          >
            <Link href="/">
              <ShoppingBag className="w-3.5 h-3.5 text-[#00AA5B]" />
              <span className="hidden sm:inline">Ke Marketplace</span>
              <span className="sm:hidden">Market</span>
            </Link>
          </Button>

          {user ? (
            <Link href="/profile" className="flex items-center gap-2" title="Profil Saya">
              <Avatar className="h-8 w-8 rounded-xl border border-border/80">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-xs font-bold">
                  {(user.displayName || user.email || "U").substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button
              asChild
              size="sm"
              className="h-9 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5 shadow-xs"
            >
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
