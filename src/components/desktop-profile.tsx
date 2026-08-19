
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  ChevronRight, 
  Wallet, 
  Coins, 
  ReceiptText, 
  Star, 
  ShoppingBag, 
  Heart, 
  Store, 
  MessageSquareWarning, 
  HelpCircle, 
  ScanLine, 
  LogOut,
  User,
  Bell,
  CreditCard,
  MapPin,
  ShieldCheck,
  Activity,
  ArrowUpRight
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
    { label: "Dashboard Akun", icon: Activity, href: "/profile", active: true },
    { label: "Daftar Transaksi", icon: ReceiptText, href: "#" },
    { label: "Wishlist Saya", icon: Heart, href: "#" },
    { label: "Ulasan Produk", icon: Star, href: "#" },
    { label: "Toko Langganan", icon: Store, href: "#" },
    { label: "Keamanan Akun", icon: ShieldCheck, href: "/settings" },
    { label: "Pusat Notifikasi", icon: Bell, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F9] font-body text-[#212121]">
      <div className="max-w-screen-2xl mx-auto flex gap-10 p-10">
        {/* Sidebar Navigation */}
        <aside className="w-72 shrink-0 space-y-8">
          <div className="flex items-center gap-4 px-2">
            <Avatar className="h-14 w-14 border-2 border-white shadow-md">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-[#00AA5B] text-white font-black text-xl">
                {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-black font-headline text-base truncate tracking-tight">{user.displayName || "User MarketPoint"}</p>
              <Link href="/settings" className="flex items-center gap-1.5 text-[11px] text-[#00AA5B] hover:underline font-bold uppercase tracking-wider">
                <Settings className="w-3 h-3" /> Pengaturan
              </Link>
            </div>
          </div>

          <nav className="bg-white rounded-[20px] border border-border/40 p-3 shadow-sm">
            {sidebarMenu.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all group mb-1",
                  item.active 
                    ? "bg-[#00AA5B] text-white shadow-lg shadow-[#00AA5B]/20" 
                    : "hover:bg-[#F4F7F9] text-[#6C727C] hover:text-[#212121]"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4.5 h-4.5", item.active ? "text-white" : "opacity-70 group-hover:opacity-100")} />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                {item.active && <ArrowUpRight className="w-3 h-3 text-white/70" />}
              </Link>
            ))}
          </nav>

          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-7 h-12 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            <LogOut className="w-4.5 h-4.5" /> Keluar Sesi
          </Button>
        </aside>

        {/* Main Content Dashboard */}
        <main className="flex-1 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Identity Card */}
            <Card className="xl:col-span-2 border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-10 flex items-start justify-between">
                <div className="flex gap-8">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border-[6px] border-[#F4F7F9] shadow-xl">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-[#00AA5B] text-white text-3xl font-black uppercase">
                        {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-border">
                      <ShieldCheck className="w-5 h-5 text-[#00AA5B]" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black font-headline tracking-tighter">{user.displayName || "Pengguna Baru"}</h2>
                      <div className="bg-[#00AA5B]/10 px-3 py-1 rounded-full border border-[#00AA5B]/20">
                        <span className="text-[#00AA5B] text-[10px] font-black italic tracking-tighter">PLUS MEMBER</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#6C727C] font-medium flex items-center gap-2">
                      {user.email} <span className="w-1 h-1 bg-border rounded-full" /> Joined {new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex gap-4 mt-6">
                      <div className="text-center px-6 py-3 bg-[#F4F7F9] rounded-2xl">
                        <p className="text-[10px] font-black text-[#6C727C] uppercase tracking-widest">Transaksi</p>
                        <p className="text-lg font-black tracking-tight">0</p>
                      </div>
                      <div className="text-center px-6 py-3 bg-[#F4F7F9] rounded-2xl">
                        <p className="text-[10px] font-black text-[#6C727C] uppercase tracking-widest">Wishlist</p>
                        <p className="text-lg font-black tracking-tight">0</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-2xl border-border hover:bg-[#F4F7F9] font-black text-xs px-6 h-11 transition-all">
                  <Link href="/settings">EDIT PROFIL</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium Wallet Card */}
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1A1C1E] to-[#2E3137] text-white">
              <CardContent className="p-10 h-full flex flex-col justify-between relative">
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black tracking-[0.2em] opacity-50 uppercase">Dompet Digital</p>
                    <div className="w-10 h-6 bg-white/10 rounded-md backdrop-blur-md border border-white/10" />
                  </div>
                  <h3 className="text-4xl font-black font-headline tracking-tighter">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</h3>
                  <p className="text-[11px] text-white/40 font-bold">Terakhir diperbarui hari ini</p>
                </div>
                <div className="flex items-center justify-between mt-10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <Coins className="w-5 h-5 text-[#FFC400]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black opacity-50 uppercase">MarketPoints</p>
                      <p className="text-sm font-black">0 Pts</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
                {/* Abstract background decorations */}
                <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#00AA5B] rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Services */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Buka Toko", desc: "Mulai berjualan hari ini", icon: Store, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
              { label: "Bayar Tagihan", desc: "PPOB & Top-Up cepat", icon: CreditCard, color: "text-[#D97706]", bg: "bg-[#D97706]/10" },
              { label: "Manajemen Alamat", desc: "Atur pengiriman Anda", icon: MapPin, color: "text-[#DC2626]", bg: "bg-[#DC2626]/10" },
              { label: "Scan QR Pay", desc: "Bayar instan & aman", icon: ScanLine, color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
            ].map((item, idx) => (
              <button key={idx} className="bg-white border border-border/40 p-8 rounded-[28px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-4 group text-center">
                <div className={cn(item.bg, "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110")}>
                  <item.icon className={cn(item.color, "w-8 h-8")} />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-black tracking-tight">{item.label}</span>
                  <p className="text-[10px] text-[#6C727C] font-medium">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Recent Activity Table style section */}
          <div className="bg-white rounded-[32px] border border-border/40 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black font-headline tracking-tighter">Aktivitas Terakhir</h3>
              <Button variant="link" className="text-[#00AA5B] font-black text-xs tracking-widest uppercase">Lihat Semua Laporan</Button>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
              <div className="w-20 h-20 bg-[#F4F7F9] rounded-full flex items-center justify-center">
                <ReceiptText className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg tracking-tight">Belum ada aktivitas terekam</p>
                <p className="text-sm font-medium">Lakukan transaksi pertama Anda dan pantau pertumbuhannya di sini.</p>
              </div>
              <Button asChild className="mt-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 rounded-2xl px-12 h-12 font-black shadow-lg shadow-[#00AA5B]/20 transition-all active:scale-95">
                <Link href="/">Mulai Belanja Sekarang</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
