"use client";

import * as React from "react";
import { 
  ChevronDown,
  PanelLeft,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function AdminHeader() {
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
      case "/admin": return "Dashboard";
      case "/admin/users": return "Manajemen Pengguna";
      case "/admin/shops": return "Manajemen Toko";
      case "/admin/analytics": return "Analitik Platform";
      case "/admin/transactions": return "Riwayat Transaksi Global";
      case "/admin/products": return "Katalog Produk Global";
      case "/admin/disputes": return "Pusat Resolusi Dispute";
      case "/admin/settings": return "Pengaturan";
      default: return "Admin Panel";
    }
  };

  return (
    <header className="h-14 md:h-16 border-b border-border bg-white sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="h-8 w-8 text-muted-foreground shrink-0"
        >
          <PanelLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-[13px] md:text-[15px] font-medium tracking-tight text-[#212121] truncate leading-tight">
            {getPageInfo(pathname)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.2 rounded-full bg-green-50 border border-green-100">
           <ShieldCheck className="w-2.5 h-2.5 text-[#00AA5B]" />
           <span className="text-[9px] font-medium text-[#00AA5B]">Sistem Aktif</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 outline-none group hover:bg-muted/30 p-1 rounded-lg transition-all">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 rounded-md border border-border shadow-sm">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white text-[9px] md:text-[10px] font-bold">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-medium truncate max-w-[100px]">{user?.displayName || "Administrator"}</span>
                <span className="text-[9px] text-muted-foreground mt-1">Super User</span>
              </div>
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1.5 rounded-xl border-border p-1.5">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-[11px] font-medium text-foreground truncate">{user?.displayName}</p>
                <p className="text-[9px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
              <Link href="/profile" className="flex items-center gap-2 text-[11px] font-medium">
                <UserIcon className="w-3.5 h-3.5 opacity-50" />
                Profil Personal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
              <Link href="/admin/settings" className="flex items-center gap-2 text-[11px] font-medium">
                <Settings className="w-3.5 h-3.5 opacity-50" />
                Pengaturan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-lg py-2 cursor-pointer focus:bg-destructive/5 text-destructive focus:text-destructive"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium">
                <LogOut className="w-3.5 h-3.5 opacity-50" />
                Keluar Panel
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
