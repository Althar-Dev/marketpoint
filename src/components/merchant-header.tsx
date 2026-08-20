"use client";

import * as React from "react";
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronDown,
  PanelLeft,
  User as UserIcon,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth } from "@/firebase";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function MerchantHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const getPageInfo = (path: string) => {
    switch (path) {
      case "/my-shop": 
        return { title: "Dashboard" };
      case "/my-shop/setup": 
        return { title: "Pengaturan Profil Toko" };
      case "/my-shop/orders": 
        return { title: "Pesanan Toko" };
      case "/my-shop/products": 
        return { title: "Daftar Produk" };
      case "/my-shop/stats": 
        return { title: "Statistik Toko" };
      case "/my-shop/wallet": 
        return { title: "Saldo Toko" };
      case "/my-shop/chat": 
        return { title: "Chat Pembeli" };
      default: 
        return { title: "Seller Center" };
    }
  };

  const info = getPageInfo(pathname);

  return (
    <header className="h-16 border-b border-border bg-white sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="h-8 w-8 text-muted-foreground shrink-0"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-sm md:text-base font-bold tracking-tight text-[#212121] truncate leading-tight">
            {info.title}
          </h1>
        </div>

        <div className="hidden xl:flex items-center flex-1 max-w-xs relative group ml-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#00AA5B] transition-colors">
            <Search className="w-3.5 h-3.5" />
          </div>
          <Input 
            placeholder="Cari pesanan atau produk..." 
            className="h-9 pl-9 pr-4 rounded-lg bg-muted/40 border-transparent focus:bg-white focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-0.5 border-r border-border pr-2 md:pr-3">
          <Button size="icon" variant="ghost" className="rounded-lg h-8 w-8 text-muted-foreground relative">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </Button>
          <Button size="icon" variant="ghost" className="rounded-lg h-8 w-8 text-muted-foreground">
            <Bell className="w-4 h-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none group hover:bg-muted/30 p-1 rounded-lg transition-all">
              <Avatar className="h-8 w-8 rounded-md border border-border shadow-sm">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "SE"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-bold truncate max-w-[90px]">{user?.displayName || "Seller"}</span>
                <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Pemilik Toko</span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1.5 rounded-lg border-border p-1.5">
            <DropdownMenuLabel className="px-2 py-1">
              <div className="flex flex-col space-y-0.5">
                <p className="text-[11px] font-bold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[9px] font-medium text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-md py-1.5 cursor-pointer focus:bg-muted">
              <Link href="/profile" className="flex items-center gap-2 text-[11px] font-semibold">
                <UserIcon className="w-3.5 h-3.5 opacity-50" />
                Profil Pasar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-md py-1.5 cursor-pointer focus:bg-muted">
              <Link href="/my-shop/setup" className="flex items-center gap-2 text-[11px] font-semibold">
                <Settings className="w-3.5 h-3.5 opacity-50" />
                Pengaturan Toko
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-md py-1.5 cursor-pointer focus:bg-destructive/5 text-destructive focus:text-destructive"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <LogOut className="w-3.5 h-3.5 opacity-50" />
                Keluar
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
