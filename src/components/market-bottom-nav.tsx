
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function MarketBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { 
      label: "Beranda", 
      icon: "ph:house", 
      activeIcon: "ph:house-fill", 
      href: "/" 
    },
    { 
      label: "Deals", 
      icon: "ph:ticket", 
      activeIcon: "ph:ticket-fill", 
      href: "/feed" 
    },
    { 
      label: "Official", 
      icon: "ph:seal-check", 
      activeIcon: "ph:seal-check-fill", 
      href: "/mall" 
    },
    { 
      label: "Transaksi", 
      icon: "ph:receipt", 
      activeIcon: "ph:receipt-fill", 
      href: "/transactions" 
    },
    { 
      label: "Akun", 
      icon: "ph:user-circle", 
      activeIcon: "ph:user-circle-fill", 
      href: "/profile" 
    },
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
            <div className="relative flex items-center justify-center">
              <Icon 
                icon={isActive ? item.activeIcon : item.icon}
                className={cn(
                  "w-6 h-6 transition-all duration-300 ease-out", 
                  isActive ? "text-[#00AA5B] scale-110" : "text-muted-foreground"
                )} 
              />
            </div>
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
