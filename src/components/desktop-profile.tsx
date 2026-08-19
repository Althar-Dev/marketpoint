
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
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

interface DesktopProfileProps {
  user: any;
  wallet: any;
  handleLogout: () => void;
}

export function DesktopProfile({ user, wallet, handleLogout }: DesktopProfileProps) {
  const sidebarMenu = [
    { label: "Profil Saya", icon: User, href: "/profile", active: true },
    { label: "Daftar Transaksi", icon: ReceiptText, href: "#" },
    { label: "Wishlist", icon: Heart, href: "#" },
    { label: "Ulasan", icon: Star, href: "#" },
    { label: "Toko yang Di-follow", icon: Store, href: "#" },
    { label: "Keamanan Akun", icon: ShieldCheck, href: "/settings" },
    { label: "Notifikasi", icon: Bell, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-8 pb-12 px-4 md:px-12 lg:px-20">
      <div className="max-w-screen-2xl mx-auto flex gap-8">
        {/* Sidebar Nav */}
        <aside className="w-64 shrink-0 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-[#00AA5B] text-white font-bold">
                {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.displayName || "User MarketPoint"}</p>
              <Link href="/settings" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-[#00AA5B] font-medium">
                <Settings className="w-2.5 h-2.5" /> Ubah Profil
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border/50 p-2 shadow-sm">
            {sidebarMenu.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${item.active ? 'bg-[#00AA5B]/5 text-[#00AA5B]' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
              >
                <item.icon className={`w-4.5 h-4.5 ${item.active ? 'text-[#00AA5B]' : 'opacity-70 group-hover:opacity-100'}`} />
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            ))}
          </div>

          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-6 h-11 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl font-bold text-xs"
          >
            <LogOut className="w-4.5 h-4.5" /> Keluar Akun
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-8 flex items-start justify-between">
                <div className="flex gap-6">
                  <Avatar className="h-20 w-20 border-4 border-[#F8F9FA] shadow-md">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#00AA5B] text-white text-2xl font-bold uppercase">
                      {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5 pt-1">
                    <h2 className="text-2xl font-black font-headline tracking-tight">{user.displayName || "Pengguna Baru"}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="bg-[#00AA5B]/10 px-3 py-1 rounded-full border border-[#00AA5B]/20">
                        <span className="text-[#00AA5B] text-[10px] font-black italic">MEMBER PLUS</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold">Bergabung sejak {new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-xl border-border hover:bg-muted/50 font-bold text-xs">
                  <Link href="/settings">Edit Profil</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Wallet Card */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-[#00AA5B] text-white">
              <CardContent className="p-8 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black tracking-widest opacity-80">SALDO MARKETPOINT</p>
                  <h3 className="text-3xl font-black font-headline">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</h3>
                </div>
                <div className="flex items-center justify-between mt-8 relative z-10">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-white/70" />
                    <span className="text-xs font-bold">0 Coins</span>
                  </div>
                  <Button variant="ghost" className="text-white hover:bg-white/10 p-2 h-auto rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                {/* Decoration */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Buka Toko", icon: Store, color: "bg-blue-500" },
              { label: "Bayar Tagihan", icon: CreditCard, color: "bg-orange-500" },
              { label: "Cari Alamat", icon: MapPin, color: "bg-red-500" },
              { label: "Scan QR", icon: ScanLine, color: "bg-purple-500" },
            ].map((item, idx) => (
              <button key={idx} className="bg-white border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group">
                <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/5 transition-transform group-hover:scale-110`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Activity Section */}
          <div className="bg-white rounded-2xl border border-border/50 p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Aktivitas Terakhir</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <ReceiptText className="w-12 h-12" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Belum Ada Transaksi</p>
                <p className="text-xs">Mulai jelajahi marketplace dan temukan solusi API terbaik.</p>
              </div>
              <Button asChild className="mt-4 bg-[#00AA5B] hover:bg-[#00AA5B]/90 rounded-xl px-8">
                <Link href="/">Belanja Sekarang</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
