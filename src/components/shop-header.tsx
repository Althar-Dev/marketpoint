
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Search, 
  ShoppingBag, 
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ShopHeader() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-14 md:h-16 flex items-center shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-3 md:gap-6 w-full">
        {/* Back & Title Section */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-xs font-black tracking-widest text-[#00AA5B] uppercase">TOKO</span>
          </div>
        </div>

        {/* Search Bar - Shop Context */}
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#00AA5B] transition-colors">
            <Search className="w-3.5 h-3.5" />
          </div>
          <Input 
            placeholder="Cari produk di toko ini..." 
            className="h-9 md:h-10 pl-9 rounded-xl bg-muted/40 border-border focus:bg-white focus:ring-1 focus:ring-[#00AA5B]/20 transition-all text-[11px] md:text-xs font-bold"
          />
        </div>

        {/* Shop Specific Actions */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
            <ShoppingBag className="w-4.5 h-4.5" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
            <Share2 className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
