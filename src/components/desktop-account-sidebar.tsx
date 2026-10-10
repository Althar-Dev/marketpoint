"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Inbox, 
  ShoppingBag, 
  UserCircle, 
  Store, 
  LogOut,
  MessageCircle,
  Star,
  BellRing,
  Clock,
  ReceiptText,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DesktopAccountSidebarProps {
  user: any;
  wallet?: any;
  hasShop?: boolean;
  displayName?: string;
  activeItem?: "inbox-chat" | "inbox-reviews" | "inbox-updates" | "pembelian-pending" | "pembelian-transactions" | "profile-settings" | "profile-wishlist" | "profile-favorites";
  handleLogout: () => void;
}

export function DesktopAccountSidebar({
  user,
  wallet,
  hasShop = false,
  displayName,
  activeItem = "profile-settings",
  handleLogout,
}: DesktopAccountSidebarProps) {
  const pathname = usePathname();

  // Tentukan accordion mana yang terbuka berdasarkan activeItem atau pathname
  const defaultAccordion = activeItem.startsWith("inbox") 
    ? "inbox" 
    : activeItem.startsWith("pembelian") 
    ? "pembelian" 
    : "profil";

  const rawPhoto = user?.photoURL;
  const photoURL = rawPhoto === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : (rawPhoto || undefined);

  return (
    <aside className="w-[260px] shrink-0 space-y-4 sticky top-20">
      <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden p-4 h-auto">
        {/* User Mini Profile Header */}
        <div className="flex items-center gap-3 mb-5">
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarImage 
              src={photoURL} 
              referrerPolicy="no-referrer" 
            />
            <AvatarFallback className="bg-[#00AA5B] text-white font-bold text-[12px]">
              {displayName?.substring(0, 1) || user?.email?.substring(0, 1)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-[12px] truncate">{displayName || user?.displayName || "Pengguna MarketPoint"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Quick Links: Toko & Saldo */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <Link 
            href={hasShop ? "/my-shop" : "/my-shop/setup"} 
            className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-1 -mx-1 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border group-hover:border-[#00AA5B]/30">
                <Store className="w-2.5 h-2.5 text-muted-foreground group-hover:text-[#00AA5B]" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Toko Saya</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold",
              hasShop ? "text-muted-foreground" : "text-[#00AA5B]"
            )}>
              {hasShop ? "Kelola" : "Buka Gratis"}
            </span>
          </Link>
          
          <Link 
            href="/wallet" 
            className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-1 -mx-1 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <img src="/assets/icon/w&c.png" className="w-full h-full object-contain" alt="Wallet" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Saldo & MCoins</span>
            </div>
            <span className="text-[11px] font-bold">Rp {wallet?.balance?.toLocaleString('id-ID') || 0}</span>
          </Link>
        </div>

        {/* Accordion Menu Group */}
        <div className="mt-6 pt-3 border-t border-border/50">
          <Accordion type="single" collapsible defaultValue={defaultAccordion} className="w-full">
            
            {/* KOTAK MASUK */}
            <AccordionItem value="inbox" className="border-none">
              <AccordionTrigger className={cn(
                "hover:no-underline py-2 text-[12px] font-bold focus:outline-none transition-colors",
                activeItem.startsWith("inbox") ? "text-[#00AA5B]" : "text-foreground"
              )}>
                <div className="flex items-center gap-2.5">
                  <Inbox className={cn("w-3.5 h-3.5", activeItem.startsWith("inbox") ? "text-[#00AA5B]" : "text-muted-foreground")} />
                  Kotak Masuk
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pl-6 space-y-0.5">
                <Link 
                  href="/chat"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "inbox-chat" || pathname?.startsWith("/chat")
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Chat</span>
                </Link>

                <Link 
                  href="/inbox/reviews"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "inbox-reviews" || pathname === "/inbox/reviews" || pathname === "/reviews"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Ulasan</span>
                </Link>

                <Link 
                  href="/inbox/updates"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "inbox-updates" || pathname === "/inbox/updates" || pathname === "/updates"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Update</span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            {/* PEMBELIAN */}
            <AccordionItem value="pembelian" className="border-none">
              <AccordionTrigger className={cn(
                "hover:no-underline py-2 text-[12px] font-bold focus:outline-none transition-colors",
                activeItem.startsWith("pembelian") ? "text-[#00AA5B]" : "text-foreground"
              )}>
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className={cn("w-3.5 h-3.5", activeItem.startsWith("pembelian") ? "text-[#00AA5B]" : "text-muted-foreground")} />
                  Pembelian
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pl-6 space-y-0.5">
                <Link 
                  href="/transactions?status=pending"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "pembelian-pending"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Menunggu Pembayaran</span>
                </Link>

                <Link 
                  href="/transactions"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "pembelian-transactions" || pathname === "/transactions"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Daftar Transaksi</span>
                </Link>
              </AccordionContent>
            </AccordionItem>

            {/* PROFIL SAYA */}
            <AccordionItem value="profil" className="border-none">
              <AccordionTrigger className={cn(
                "hover:no-underline py-2 text-[12px] font-bold focus:outline-none transition-colors",
                activeItem.startsWith("profile") ? "text-[#00AA5B]" : "text-foreground"
              )}>
                <div className="flex items-center gap-2.5">
                  <UserCircle className={cn("w-3.5 h-3.5", activeItem.startsWith("profile") ? "text-[#00AA5B]" : "text-muted-foreground")} />
                  Profil Saya
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pl-6 space-y-0.5">
                <Link 
                  href="/settings"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "profile-settings" || pathname === "/settings"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Pengaturan</span>
                </Link>

                <Link 
                  href="/wishlist"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "profile-wishlist" || pathname === "/wishlist"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Wishlist</span>
                </Link>

                <Link 
                  href="/favorites"
                  className={cn(
                    "flex items-center justify-between text-[11px] py-1 px-2 rounded-lg transition-colors",
                    activeItem === "profile-favorites" || pathname === "/favorites"
                      ? "text-[#00AA5B] font-bold bg-[#00AA5B]/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>Toko Favorit</span>
                </Link>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start gap-2.5 mt-6 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg text-[11px] font-bold h-9 px-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Keluar Akun
        </Button>
      </Card>
    </aside>
  );
}
