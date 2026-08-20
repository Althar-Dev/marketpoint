
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TicketPercent, BadgeCheck, ReceiptText, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Beranda", icon: Home, href: "/" },
    { label: "Deals", icon: TicketPercent, href: "/feed" },
    { label: "Official", icon: BadgeCheck, href: "/mall" },
    { label: "Transaksi", icon: ReceiptText, href: "/transactions" },
    { label: "Akun", icon: CircleUser, href: "/profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-2 h-16 flex items-center justify-around pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.label} 
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all active:scale-95",
              isActive ? "text-[#00AA5B]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon 
              className={cn(
                "w-5 h-5 transition-colors duration-200", 
                isActive ? "text-[#00AA5B]" : "text-muted-foreground"
              )} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-tight transition-colors duration-200",
              isActive ? "text-[#00AA5B]" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
