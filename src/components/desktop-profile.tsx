
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  ReceiptText, 
  Star, 
  Heart, 
  Store, 
  ShieldCheck, 
  Bell, 
  Activity,
  ArrowUpRight,
  Wallet,
  Coins,
  CreditCard,
  MapPin,
  ScanLine,
  LogOut,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DesktopProfileProps {
  user: any;
  wallet: any;
  handleLogout: () => void;
}

export function DesktopProfile({ user, wallet, handleLogout }: DesktopProfileProps) {
  const sidebarMenu = [
    { label: "Dashboard", icon: Activity, href: "/profile", active: true },
    { label: "Transaksi", icon: ReceiptText, href: "#" },
    { label: "Wishlist", icon: Heart, href: "#" },
    { label: "Ulasan", icon: Star, href: "#" },
    { label: "Toko Langganan", icon: Store, href: "#" },
    { label: "Keamanan", icon: ShieldCheck, href: "/settings" },
    { label: "Notifikasi", icon: Bell, href: "#" },
  ];

  return (
    <div className="bg-[#F8FAFC] font-body text-[#1E293B]">
      <div className="max-w-screen-xl mx-auto flex gap-6 p-8">
        {/* Sidebar Nav */}
        <aside className="w-60 shrink-0 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10 ring-1 ring-border">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-[#00AA5B] text-white font-bold text-sm">
                {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-[13px] truncate">{user.displayName || "User MarketPoint"}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">Pro Member</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarMenu.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all text-[12px] font-semibold",
                  item.active 
                    ? "bg-white text-[#00AA5B] shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:bg-white hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4", item.active ? "text-[#00AA5B]" : "opacity-70")} />
                  <span>{item.label}</span>
                </div>
                {item.active && <ArrowUpRight className="w-3 h-3 opacity-50" />}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-border/50">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 h-9 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg text-[12px] font-bold"
            >
              <LogOut className="w-4 h-4" /> Keluar Sesi
            </Button>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main className="flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border/50 shadow-sm bg-white rounded-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 ring-4 ring-[#F8FAFC]">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-2xl font-bold uppercase">
                      {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">{user.displayName || "Pengguna Baru"}</h2>
                    <p className="text-[12px] text-muted-foreground font-medium">{user.email}</p>
                    <div className="flex gap-4 mt-3">
                      <div className="text-left border-r border-border/50 pr-4">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Transaksi</p>
                        <p className="text-sm font-bold">0</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Wishlist</p>
                        <p className="text-sm font-bold">0</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="h-8 px-4 text-[11px] font-bold rounded-lg border-border/60">
                  <Link href="/settings">EDIT PROFIL</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/50 shadow-sm bg-[#1E293B] text-white rounded-xl">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saldo Digital</span>
                    <Wallet className="w-4 h-4 text-[#00AA5B]" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</h3>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#FFC400]" />
                    <span className="text-[11px] font-medium">0 Points</span>
                  </div>
                  <Link href="#" className="text-[10px] font-bold text-[#00AA5B] hover:text-[#00AA5B]/80 uppercase tracking-wider">Isi Saldo</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Buka Toko", desc: "Mulai Jualan", icon: Store, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Tagihan", desc: "PPOB & Top-Up", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Alamat", desc: "Atur Pengiriman", icon: MapPin, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Scan QR", desc: "Bayar Cepat", icon: ScanLine, color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((item, idx) => (
              <button key={idx} className="bg-white border border-border/50 p-4 rounded-xl shadow-sm hover:border-[#00AA5B]/30 hover:shadow-md transition-all flex items-center gap-4 text-left group">
                <div className={cn(item.bg, "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105")}>
                  <item.icon className={cn(item.color, "w-5 h-5")} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#0F172A] truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <Card className="border border-border/50 shadow-sm bg-white rounded-xl">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Aktivitas Terakhir</h3>
              <Link href="#" className="text-[11px] font-bold text-[#00AA5B] hover:underline uppercase tracking-wider">Semua Aktivitas</Link>
            </div>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center opacity-60">
              <ReceiptText className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-[12px] font-bold text-muted-foreground">Tidak ada riwayat transaksi</p>
              <p className="text-[10px] text-muted-foreground/80 mt-1">Transaksi yang Anda lakukan akan muncul di sini.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
