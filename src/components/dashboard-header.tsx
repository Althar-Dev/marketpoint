"use client";

import * as React from "react";
import {
  ChevronDown,
  PanelLeft,
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  MessageCircle,
  ShoppingBag,
  Wallet,
  Home,
  ShieldCheck,
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
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useUserBalance } from "@/hooks/use-user-balance";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const rawPhoto = userData?.photoURL || user?.photoURL;
  const photoURL = rawPhoto === "/assets/avatar/duck.png" ? "/assets/avatar/duck.png" : (rawPhoto || undefined);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);
  const { data: wallet } = useDoc(walletRef);
  const { balance: pgBalance } = useUserBalance();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const getBreadcrumb = (path: string) => {
    switch (path) {
      case "/dashboard": return "Ringkasan";
      case "/dashboard/balance": return "Saldo & Keuangan";
      case "/dashboard/transactions": return "Riwayat Transaksi";
      case "/dashboard/products": return "Katalog Produk";
      case "/dashboard/products/add": return "Tambah Produk";
      case "/dashboard/services": return "Layanan PPOB";
      case "/dashboard/api-key": return "API Key";
      case "/transactions": return "Riwayat Pesanan";
      case "/wallet": return "Saldo & Keuangan";
      case "/wishlist": return "Wishlist Saya";
      case "/favorites": return "Toko Favorit";
      case "/settings": return "Pengaturan Profil";
      case "/support": return "Pusat Bantuan";
      case "/promo": return "Katalog Promo";
      default: return "Dashboard";
    }
  };

  return (
    <header className="h-14 md:h-16 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-muted-foreground shrink-0 hover:bg-slate-100"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex flex-col min-w-0">
          <h1 className="text-xs md:text-sm font-bold tracking-tight text-slate-800 truncate leading-tight">
            {getBreadcrumb(pathname)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        {/* Wallet Mini Display */}
        <Link href="/wallet" className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer">
          <div className="h-7 w-7 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center shrink-0 shadow-2xs border border-green-100">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Belanja</span>
            <span className="text-xs font-black text-slate-900 mt-0.5">
              Rp {(typeof pgBalance === "number" ? pgBalance : (wallet?.balance || 0)).toLocaleString("id-ID")}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50 transition-all" title="Notifikasi">
            <Bell className="w-4.5 h-4.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-green-50 transition-all" title="Bantuan">
            <MessageCircle className="w-4.5 h-4.5" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none group hover:bg-muted/30 p-1 rounded-xl transition-all cursor-pointer border border-transparent hover:border-border">
              <Avatar className="h-8 w-8 rounded-lg border border-border shadow-2xs">
                <AvatarImage src={photoURL} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-bold truncate max-w-[100px] text-slate-900">{user?.displayName || "Buyer"}</span>
                <span className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#00AA5B]" />
                  Verified
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-border p-2 shadow-xl">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-[11px] font-black text-slate-900 truncate">{user?.displayName}</p>
                <p className="text-[9px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl py-2 cursor-pointer focus:bg-[#00AA5B]/5">
              <Link href="/profile" className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                <UserIcon className="w-4 h-4 opacity-70" />
                Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl py-2 cursor-pointer focus:bg-[#00AA5B]/5">
              <Link href="/settings" className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                <Settings className="w-4 h-4 opacity-70" />
                Pengaturan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl py-2 cursor-pointer focus:bg-rose-50 text-rose-600 focus:text-rose-700"
            >
              <div className="flex items-center gap-2.5 text-xs font-black">
                <LogOut className="w-4 h-4 opacity-70" />
                Keluar Sesi
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
