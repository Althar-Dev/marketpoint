"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  History,
  Package,
  Store,
  Key,
  FileText,
  ArrowLeft,
  ChevronRight,
  LogOut,
  ShoppingBag
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const { state } = useSidebar();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  const menuGroups = [
    {
      label: "Dashboard",
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
      ]
    },
    {
      label: "Finance",
      items: [
        { label: "Balance", icon: Wallet, href: "/dashboard/balance" },
        { label: "Transactions", icon: History, href: "/dashboard/transactions" },
      ]
    },
    {
      label: "Marketplace",
      items: [
        { label: "Explore Product", icon: Package, href: "/dashboard/products" },
        { label: "Seller Center", icon: Store, href: "/dashboard/seller" },
      ]
    },
    {
      label: "Reseller Access",
      items: [
        { label: "API Key", icon: Key, href: "/dashboard/api-key" },
        { label: "Documentations", icon: FileText, href: "/documentations" },
      ]
    }
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00AA5B] text-white shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-[#00AA5B] leading-none uppercase tracking-widest">Dashboard</span>
              <span className="text-sm font-black tracking-tight truncate text-slate-900">MarketPointID</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 no-scrollbar">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {state !== "collapsed" && (
              <SidebarGroupLabel className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href} className={cn(
                          "flex items-center gap-2.5 px-3 py-2 transition-all duration-200",
                          isActive ? "text-[#00AA5B] bg-[#00AA5B]/5 font-bold" : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                        )}>
                          <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#00AA5B]" : "text-slate-400")} />
                          <span className="text-xs truncate">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Kembali ke Pasar">
              <Link href="/" className="flex items-center gap-2.5 px-3 py-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors">
                <ArrowLeft className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-bold">Kembali ke Beranda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span className="text-[11px] font-bold">Keluar Akun</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {state !== "collapsed" && user && (
          <div className="mt-4 p-2 rounded-xl bg-slate-50 border border-border flex items-center gap-2.5 shadow-2xs">
            <Avatar className="h-8 w-8 rounded-lg border border-white shadow-sm shrink-0">
               <AvatarImage src={user.photoURL || undefined} />
               <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                 {user.displayName?.substring(0, 2).toUpperCase() || "US"}
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-none">
                {user.displayName || "Buyer"}
              </p>
              <p className="text-[9px] text-muted-foreground truncate mt-1">Verified Member</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
