"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Store, ChevronLeft, Home } from "lucide-react";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TopUpHeader() {
  const pathname = usePathname() || "";
  const { user } = useUser();
  const segments = pathname.split("/").filter(Boolean);
  const isDetailPage = pathname.startsWith("/topup/") && segments.length >= 3;
  const brandSlug = isDetailPage ? segments[2] : "";
  const brandTitle = brandSlug ? decodeURIComponent(brandSlug).replace(/-/g, " ") : "";

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border/60 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Name on Detail Page OR Back to Home & MarketPointID TopUp on Hub Page */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isDetailPage ? (
            <div className="flex items-center gap-2">
              <Link href="/topup">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 text-xs font-semibold gap-1 rounded-xl px-2 sm:px-2.5">
                  <ChevronLeft className="h-4 w-4 text-[#00AA5B]" />
                  <span>Katalog</span>
                </Button>
              </Link>
              <div className="h-4 w-[1px] bg-slate-200" />
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize">
                {brandTitle}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" title="Kembali ke Beranda Utama">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-2 sm:px-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="h-4 w-4 text-[#00AA5B]" />
                  <span>Beranda</span>
                </Button>
              </Link>
              <div className="h-4 w-[1px] bg-slate-200" />
              <Link href="/topup" className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  MarketPointID <span className="text-[#00AA5B]">TopUp</span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Right: Marketplace Button & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" title="Kembali ke Beranda Utama">
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 text-slate-700 hover:text-[#00AA5B] text-xs font-semibold gap-1.5 rounded-xl px-2.5 sm:px-3 border-border/80 bg-slate-50/80 hover:bg-slate-100 shadow-2xs"
            >
              <Home className="w-4 h-4 text-[#00AA5B]" />
              <span className="hidden sm:inline">Beranda</span>
            </Button>
          </Link>

          {user ? (
            <Link href="/profile">
              <Avatar className="w-8 h-8 border border-border/80 hover:border-[#00AA5B] transition-colors">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-green-50 text-[#00AA5B] text-xs font-medium">
                  {user.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 px-3 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-medium text-xs shadow-xs">
                Masuk
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
