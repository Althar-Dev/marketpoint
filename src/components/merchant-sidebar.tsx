"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AA5B] text-white">
            <Store className="h-5 w-5" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black uppercase tracking-widest text-[#00AA5B] leading-none">SELLER</span>
              <span className="text-sm font-bold tracking-tight truncate">MarketPoint</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest opacity-50">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-3 px-4 py-2 transition-colors",
                        isActive ? "text-[#00AA5B] bg-[#00AA5B]/5" : "text-muted-foreground hover:text-foreground"
                      )}>
                        <item.icon className={cn("h-4.5 w-4.5", isActive && "text-[#00AA5B]")} />
                        <span className="text-sm font-bold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest opacity-50">Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-3 px-4 py-2 transition-colors",
                        isActive ? "text-[#00AA5B] bg-[#00AA5B]/5" : "text-muted-foreground hover:text-foreground"
                      )}>
                        <item.icon className={cn("h-4.5 w-4.5", isActive && "text-[#00AA5B]")} />
                        <span className="text-sm font-bold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Kembali ke Pasar">
              <Link href="/" className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4.5 w-4.5" />
                <span className="text-sm font-bold">Kembali ke Pasar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {state !== "collapsed" && shop && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg border border-white">
              <AvatarImage src={shop.logoUrl} />
              <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                {shop.name?.substring(0, 1) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{shop.name}</p>
              <p className="text-[10px] text-muted-foreground truncate italic">@{shop.slug}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
