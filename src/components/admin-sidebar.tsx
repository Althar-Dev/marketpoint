"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingBag, 
  ShieldAlert, 
  Settings, 
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Database,
  History,
  ShieldCheck
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
import { useUser } from "@/firebase";

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { state } = useSidebar();

  const adminGroups = [
    {
      label: "Platform Overview",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { label: "Analitik Platform", icon: BarChart3, href: "/admin/analytics" },
        { label: "Log Sistem", icon: History, href: "/admin/logs" },
      ]
    },
    {
      label: "Management",
      items: [
        { label: "Manajemen User", icon: Users, href: "/admin/users" },
        { label: "Daftar Merchant", icon: Store, href: "/admin/shops" },
        { label: "Katalog Produk", icon: Database, href: "/admin/products" },
      ]
    },
    {
      label: "Finance & Disputes",
      items: [
        { label: "Semua Transaksi", icon: ShoppingBag, href: "/admin/transactions" },
        { label: "Resolusi Dispute", icon: ShieldAlert, href: "/admin/disputes" },
      ]
    },
    {
      label: "System",
      items: [
        { label: "Pengaturan Global", icon: Settings, href: "/admin/settings" },
      ]
    }
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-medium text-indigo-600 leading-none">Admin Control</span>
              <span className="text-sm font-bold tracking-tight truncate">MarketPoint</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {adminGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-3 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href} className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 transition-colors",
                          isActive ? "text-indigo-600 bg-indigo-50/50" : "text-muted-foreground hover:text-foreground"
                        )}>
                          <item.icon className={cn("h-4 w-4", isActive && "text-indigo-600")} />
                          <span className="text-[11px] font-medium">{item.label}</span>
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
            <SidebarMenuButton asChild tooltip="Ke Halaman Pasar">
              <Link href="/" className="flex items-center gap-2.5 px-3 py-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-[11px] font-medium">Halaman Utama</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {state !== "collapsed" && user && (
          <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
               <span className="text-[10px] font-bold text-indigo-600">{user.displayName?.substring(0, 1) || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate leading-tight">{user.displayName || "Admin"}</p>
              <p className="text-[9px] text-muted-foreground truncate">Super Admin</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
