"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  Store,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function MerchantSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const { state } = useSidebar();

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop } = useDoc(shopRef);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/my-shop" },
    { label: "Pesanan", icon: ShoppingBag, href: "/my-shop/orders" },
    { label: "Produk Saya", icon: Package, href: "/my-shop/products" },
    { label: "Statistik", icon: TrendingUp, href: "/my-shop/stats" },
  ];

  const secondaryItems = [
    { label: "Saldo Toko", icon: Wallet, href: "/my-shop/wallet" },
    { label: "Chat Pembeli", icon: MessageSquare, href: "/my-shop/chat" },
    { label: "Pengaturan Toko", icon: Settings, href: "/my-shop/setup" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00AA5B] text-white shrink-0">
            <Store className="h-4 w-4" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] font-bold text-[#00AA5B] leading-none">Seller Center</span>
              <span className="text-sm font-bold tracking-tight truncate">MarketPoint</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[9px] font-bold text-muted-foreground/60">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 transition-colors",
                        isActive ? "text-[#00AA5B] bg-[#00AA5B]/5" : "text-muted-foreground hover:text-foreground"
                      )}>
                        <item.icon className={cn("h-4 w-4", isActive && "text-[#00AA5B]")} />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[9px] font-bold text-muted-foreground/60">Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 transition-colors",
                        isActive ? "text-[#00AA5B] bg-[#00AA5B]/5" : "text-muted-foreground hover:text-foreground"
                      )}>
                        <item.icon className={cn("h-4 w-4", isActive && "text-[#00AA5B]")} />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Kembali Ke Pasar">
              <Link href="/" className="flex items-center gap-2.5 px-3 py-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-semibold">Kembali Ke Pasar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {state !== "collapsed" && shop && (
          <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border flex items-center gap-2">
            <div className="h-7 w-7 rounded-md border border-white overflow-hidden relative shrink-0">
               {shop.logoUrl ? (
                 <Image src={shop.logoUrl} alt="Logo" fill className="object-cover" />
               ) : (
                 <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{shop.name?.substring(0, 1)}</span>
                 </div>
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate leading-tight">{shop.name}</p>
              <p className="text-[9px] text-muted-foreground truncate italic">@{shop.slug}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
