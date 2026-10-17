"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  PanelLeft,
  User as UserIcon,
  LogOut,
  Settings,
  Store,
  Check,
  Plus,
  ShieldCheck,
  Crown
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
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMerchantShop } from "@/context/merchant-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function MerchantHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { toast } = useToast();
  const {
    shop,
    shopId,
    isStaff,
    staffRoleLabel,
    availableShops,
    switchShop,
    isAdmin,
    activePlanId,
    switchShopPlan,
  } = useMerchantShop();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const rawPhoto = userData?.photoURL || user?.photoURL;
  const photoURL = rawPhoto === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : (rawPhoto || undefined);

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
      case "/my-shop/settings":
        return { title: "Pengaturan Toko" };
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
      case "/my-shop/subscription":
        return { title: "Langganan" };
      case "/my-shop/chat":
        return { title: "Chat Pembeli" };
      case "/my-shop/reviews":
        return { title: "Ulasan Pembeli" };
      case "/my-shop/disputes":
        return { title: "Komplain & Dispute" };
      case "/my-shop/customers":
        return { title: "Data Pelanggan" };
      case "/my-shop/vouchers":
        return { title: "Manajemen Voucher" };
      case "/my-shop/flash-sale":
        return { title: "Manajemen Flash Sale" };
      case "/my-shop/staff":
        return { title: "Kelola Staff Toko" };
      case "/my-shop/telegram-bot":
        return { title: "Bot Telegram" };
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
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Admin Plan Real Switcher Dropdown */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-amber-500/10 border-amber-500/30 text-amber-800 hover:bg-amber-500/20 transition-all outline-none cursor-pointer shadow-2xs group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline font-bold">
                  {activePlanId === "admin" ? "Admin: Full Unlock" : `Paket: ${activePlanId.toUpperCase()}`}
                </span>
                <span className="sm:hidden font-bold">
                  {activePlanId === "admin" ? "Admin" : activePlanId.toUpperCase()}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl border-border p-2 shadow-xl">
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold text-foreground">Ganti Paket Toko (Admin)</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Ubah paket langganan toko aktif secara langsung di database.
                </p>
              </div>
              <DropdownMenuSeparator />

              {/* Option 1: Admin Full Unlock */}
              <button
                onClick={async () => {
                  await switchShopPlan("admin");
                  toast({
                    title: "Paket Toko: Admin Full Unlock",
                    description: "Semua fitur dan kuota toko dibuka penuh di database.",
                  });
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group mb-1",
                  activePlanId === "admin"
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "hover:bg-muted/60 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Admin: Full Unlock
                      {activePlanId === "admin" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 font-semibold">Aktif</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Semua fitur & kuota tak terbatas</p>
                  </div>
                </div>
                {activePlanId === "admin" && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>

              <div className="px-2 pt-2 pb-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Paket Langganan Database
                </p>
              </div>

              {/* Plan Options: Prime, Pro, Plus, Free */}
              {[
                { id: "prime", name: "Prime", desc: "Unlimited produk, 15 voucher, 10 flash sale, Bot, Statistik Semua Waktu", color: "bg-purple-600" },
                { id: "pro", name: "Pro", desc: "40 produk, 5 voucher, 3 flash sale, Bot, Statistik 30 Hari", color: "bg-blue-600" },
                { id: "plus", name: "Plus", desc: "15 produk, 2 voucher, 1 flash sale", color: "bg-emerald-600" },
                { id: "free", name: "Free", desc: "5 produk, fitur promosi & bot nonaktif", color: "bg-slate-600" },
              ].map((p) => {
                const isSelected = activePlanId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={async () => {
                      await switchShopPlan(p.id as any);
                      toast({
                        title: `Paket Toko: ${p.name}`,
                        description: `Data paket langganan toko berhasil diperbarui ke ${p.name} di database.`,
                      });
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group mb-0.5",
                      isSelected
                        ? "bg-[#00AA5B]/10 border border-[#00AA5B]/30"
                        : "hover:bg-muted/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-7 w-7 rounded-lg text-white flex items-center justify-center text-xs font-bold shrink-0", p.color)}>
                        {p.id[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Paket {p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#00AA5B] shrink-0" />}
                  </button>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

          {/* Toko Switcher Dropdown */}
          {availableShops.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 border border-border bg-muted/20 hover:bg-muted/50 px-2.5 py-1.5 rounded-xl transition-all outline-none group cursor-pointer max-w-[210px] shadow-2xs">
                <div className="h-6 w-6 rounded-md bg-[#00AA5B] text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 border border-border">
                  {shop?.logoUrl ? (
                    <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{shop?.name?.substring(0, 1) || "T"}</span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none min-w-0 pr-0.5">
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[105px]">
                    {shop?.name || "Toko"}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
                    {isStaff ? (staffRoleLabel || "Staf") : "Pemilik"}
                  </span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border p-2 shadow-xl">
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Pilih Toko ({availableShops.length})
                </p>
                <p className="text-[10px] text-muted-foreground">Beralih ke toko yang Anda kelola</p>
              </div>
              <DropdownMenuSeparator />
              <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar py-1">
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
                      {isCurrent && <Check className="w-4 h-4 text-[#00AA5B] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {!availableShops.some((s) => s.isOwner) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl py-2 cursor-pointer focus:bg-[#00AA5B]/10">
                    <Link href="/my-shop/setup" className="flex items-center gap-2 text-xs font-bold text-[#00AA5B]">
                      <Plus className="w-3.5 h-3.5" />
                      Buka Toko Sendiri
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none group hover:bg-muted/30 p-1 rounded-lg transition-all">
              <Avatar className="h-8 w-8 rounded-md border border-border shadow-sm">
                <AvatarImage src={photoURL} referrerPolicy="no-referrer" />
                <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "SE"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-bold truncate max-w-[90px]">{user?.displayName || "Seller"}</span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {isStaff ? (staffRoleLabel || "Staf Toko") : "Pemilik Toko"}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1.5 rounded-lg border-border p-1.5">
            <DropdownMenuLabel className="px-2 py-1">
              <div className="flex flex-col space-y-0.5">
                <p className="text-[11px] font-bold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[10px] font-medium text-muted-foreground truncate">{user?.email}</p>
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
              <Link href="/my-shop/settings" className="flex items-center gap-2 text-[11px] font-semibold">
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
