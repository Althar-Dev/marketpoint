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
  MessageSquare,
  Star,
  AlertTriangle,
  Users,
  Ticket,
  Zap,
  CreditCard,
  UserCog,
  ChevronsUpDown,
  Check,
  Lock,
  Bot
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useMerchantShop } from "@/context/merchant-context";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export function MerchantSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { state } = useSidebar();
  const { toast } = useToast();
  const {
    shop,
    shopId,
    isOwner,
    isStaff,
    staffRole,
    staffRoleLabel,
    staffPermissions,
    availableShops,
    switchShop
  } = useMerchantShop();

  const checkItemAccess = (href: string) => {
    if (isOwner || staffRole === "CO_OWNER") return true;

    switch (href) {
      case "/my-shop":
        return true;
      case "/my-shop/wallet":
      case "/my-shop/stats":
        return !!staffPermissions?.finance;
      case "/my-shop/subscription":
        return false;
      case "/my-shop/products":
      case "/my-shop/vouchers":
      case "/my-shop/flash-sale":
        return !!staffPermissions?.products;
      case "/my-shop/chat":
      case "/my-shop/disputes":
      case "/my-shop/customers":
      case "/my-shop/telegram-bot":
        return !!staffPermissions?.chat;
      case "/my-shop/reviews":
        return !!staffPermissions?.products || !!staffPermissions?.chat;
      case "/my-shop/orders":
        return !!staffPermissions?.products || !!staffPermissions?.finance;
      case "/my-shop/staff":
      case "/my-shop/settings":
        return false;
      default:
        return true;
    }
  };

  const groups = [
    {
      label: "General",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/my-shop" },
        { label: "Saldo", icon: Wallet, href: "/my-shop/wallet" },
        { label: "Subscription", icon: CreditCard, href: "/my-shop/subscription" },
        { label: "Statistik", icon: TrendingUp, href: "/my-shop/stats" },
      ]
    },
    {
      label: "Promosi",
      items: [
        { label: "Voucher Toko", icon: Ticket, href: "/my-shop/vouchers" },
        { label: "Flash Sale", icon: Zap, href: "/my-shop/flash-sale" },
      ]
    },
    {
      label: "Inbox",
      items: [
        { label: "Chat", icon: MessageSquare, href: "/my-shop/chat" },
        { label: "Ulasan", icon: Star, href: "/my-shop/reviews" },
        { label: "Dispute", icon: AlertTriangle, href: "/my-shop/disputes" },
      ]
    },
    {
      label: "Management",
      items: [
        { label: "Staff", icon: UserCog, href: "/my-shop/staff" },
        { label: "Pelanggan", icon: Users, href: "/my-shop/customers" },
        { label: "Bot Telegram", icon: Bot, href: "/my-shop/telegram-bot" },
        { label: "Produk Saya", icon: Package, href: "/my-shop/products" },
        { label: "Pesanan", icon: ShoppingBag, href: "/my-shop/orders" },
      ]
    },
    {
      label: "Lainnya",
      items: [
        { label: "Pengaturan Toko", icon: Settings, href: "/my-shop/settings" },
      ]
    }
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
              <span className="text-[10px] font-bold text-[#00AA5B] leading-none">Seller Center</span>
              <span className="text-sm font-bold tracking-tight truncate">MarketPointID</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const hasAccess = checkItemAccess(item.href);

                  if (!hasAccess) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          tooltip={`${item.label} (Akses Dibatasi)`}
                          onClick={() => {
                            toast({
                              title: "Akses Menu Dibatasi",
                              description: `Peran ${staffRoleLabel || "Staf"} tidak memiliki izin untuk fitur ${item.label}. Hubungi Pemilik Toko untuk meminta akses.`,
                              variant: "destructive"
                            });
                          }}
                          className="flex items-center justify-between px-3 py-1.5 opacity-40 cursor-not-allowed select-none text-muted-foreground hover:bg-transparent"
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="h-4 w-4 text-muted-foreground/80" />
                            <span className="text-[11px] font-medium">{item.label}</span>
                          </div>
                          <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href} className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 transition-colors",
                          isActive ? "text-[#00AA5B] bg-[#00AA5B]/5" : "text-muted-foreground hover:text-foreground"
                        )}>
                          <item.icon className={cn("h-4 w-4", isActive && "text-[#00AA5B]")} />
                          <span className="text-[11px] font-semibold">{item.label}</span>
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
              <Link href="/" className="flex items-center gap-2.5 px-3 py-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-[11px] font-semibold">Kembali ke Pasar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {state !== "collapsed" && shop && (
          availableShops.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="mt-3 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border flex items-center gap-2 cursor-pointer transition-all group">
                  <div className="h-7 w-7 rounded-md border border-white overflow-hidden relative shrink-0">
                    {shop.logoUrl ? (
                      <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{shop.name?.substring(0, 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate leading-tight group-hover:text-[#00AA5B] transition-colors">{shop.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate italic">
                      {isStaff && staffRoleLabel ? `${staffRoleLabel} • @${shop.slug}` : `Pemilik • @${shop.slug}`}
                    </p>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-64 rounded-2xl border-border p-2 shadow-xl mb-1">
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Pilih Toko ({availableShops.length})
                  </p>
                  <p className="text-[10px] text-muted-foreground">Beralih ke toko yang Anda kelola</p>
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar py-1">
                  {availableShops.map((s) => {
                    const isCurrent = s.shopId === shopId;
                    return (
                      <button
                        key={s.shopId}
                        onClick={() => {
                          if (!isCurrent) {
                            switchShop(s.shopId);
                            toast({
                              title: "Beralih Toko",
                              description: `Sekarang beralih ke toko ${s.name} (${s.roleLabel}).`,
                            });
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer group",
                          isCurrent ? "bg-[#00AA5B]/10 border border-[#00AA5B]/30" : "hover:bg-muted/60 border border-transparent"
                        )}
                      >
                        <div className="h-8 w-8 rounded-lg bg-[#00AA5B] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 border border-border">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                          ) : (
                            <span>{s.name.substring(0, 1)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {s.roleLabel} • @{s.slug}
                          </p>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border flex items-center gap-2">
              <div className="h-7 w-7 rounded-md border border-white overflow-hidden relative shrink-0">
                {shop.logoUrl ? (
                  <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{shop.name?.substring(0, 1)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold truncate leading-tight">{shop.name}</p>
                <p className="text-[10px] text-muted-foreground truncate italic">
                  {isStaff && staffRoleLabel ? `${staffRoleLabel} • @${shop.slug}` : `@${shop.slug}`}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
            </div>
          )
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
