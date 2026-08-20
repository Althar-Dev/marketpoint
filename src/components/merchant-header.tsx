"use client";

import * as React from "react";
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronDown,
  Menu,
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
import Link from "next/link";

export function MerchantHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <header className="h-16 border-b border-border/50 bg-white sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="h-9 w-9 text-muted-foreground"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <div className="hidden md:flex items-center flex-1 max-w-md relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#00AA5B] transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <Input 
            placeholder="Cari pesanan, produk, atau bantuan..." 
            className="h-10 pl-10 pr-4 rounded-xl bg-muted/40 border-transparent focus:bg-white focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 border-r border-border/50 pr-2 md:pr-4">
          <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground relative">
            <MessageSquare className="w-4.5 h-4.5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
          <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
            <Bell className="w-4.5 h-4.5" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none group hover:bg-muted/30 p-1 rounded-xl transition-all">
              <Avatar className="h-8 w-8 rounded-lg border border-border shadow-sm">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "SE"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-bold truncate max-w-[100px]">{user?.displayName || "Seller"}</span>
                <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Pemilik Toko</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border p-2">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-bold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[10px] font-medium text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
              <Link href="/profile" className="flex items-center gap-2 text-xs font-bold">
                <UserIcon className="w-3.5 h-3.5 opacity-50" />
                Profil Marketplace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
              <Link href="/my-shop/setup" className="flex items-center gap-2 text-xs font-bold">
                <Settings className="w-3.5 h-3.5 opacity-50" />
                Pengaturan Toko
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-lg py-2 cursor-pointer focus:bg-destructive/5 text-destructive focus:text-destructive"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
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
