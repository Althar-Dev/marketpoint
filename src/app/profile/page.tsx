"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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
  LogOut
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPoint!",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Keluar",
        description: "Terjadi gangguan pada sistem.",
      });
    }
  };

  if (authLoading || (user && walletLoading && !wallet)) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 lg:pb-16 max-w-2xl mx-auto">
          <div className="px-4 py-2 flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          
          <div className="px-4 py-2 flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="px-4 py-4">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>

          <div className="px-4 pb-6 grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="h-2 bg-muted/30 w-full" />
          
          <div className="py-2 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-5 h-14 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </main>
        <MarketBottomNav />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <main className="flex-1 w-full pb-24 lg:pb-16 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="px-4 py-2 flex items-center justify-between bg-white sticky top-0 z-30">
          <h1 className="text-lg font-bold">Akun</h1>
          <Link href="/settings" className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </Link>
        </div>

        {/* User Info Section */}
        <div className="px-4 py-2 flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border shadow-sm">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-[#00AA5B] text-white text-xl font-bold uppercase">
              {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-base">{user.displayName || "Pengguna Baru"}</span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#00AA5B] rounded-full flex items-center justify-center">
                  <Wallet className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span className="text-xs font-bold text-foreground">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#FFC400] rounded-full flex items-center justify-center">
                  <Coins className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">0 MarketPoint Coins</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground opacity-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Plus Banner */}
        <div className="px-4 py-4">
          <div className="bg-white border border-border rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#00AA5B]/10 px-2 py-1 rounded-md">
                <span className="text-[#00AA5B] text-[10px] font-black italic tracking-tighter">PLUS</span>
              </div>
              <div>
                <p className="text-xs font-bold">Gabung MarketPoint Plus!</p>
                <p className="text-[10px] text-muted-foreground">Bebas biaya aplikasi & gratis ongkir sepuasnya.</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-10 rounded-xl justify-between px-4 font-bold text-[11px] border-border hover:bg-muted/50">
            Buka Toko Gratis <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Button>
          <Button variant="outline" className="h-10 rounded-xl justify-between px-4 font-bold text-[11px] border-border hover:bg-muted/50">
            Daftar Affiliate <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Button>
        </div>

        <div className="h-2 bg-muted/30 w-full" />

        {/* Menu Groups */}
        <div className="py-2">
          {[
            { label: "Daftar Transaksi", icon: ReceiptText },
            { label: "Ulasan", icon: Star },
            { label: "Beli Lagi", icon: ShoppingBag },
            { label: "Wishlist", icon: Heart },
            { label: "Toko yang Di-follow", icon: Store },
          ].map((item, idx) => (
            <button 
              key={idx}
              className="w-full px-5 h-14 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-foreground opacity-70" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30" />
            </button>
          ))}
        </div>

        <div className="h-2 bg-muted/30 w-full" />

        <div className="py-2">
          {[
            { label: "Pesanan Dikomplain", icon: MessageSquareWarning },
            { label: "Bantuan MarketPoint Care", icon: HelpCircle },
            { label: "Scan Kode QR", icon: ScanLine },
            { label: "Keluar Akun", icon: LogOut, onClick: handleLogout, color: 'text-destructive' },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.onClick}
              className="w-full px-5 h-14 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${item.color || 'text-foreground'} opacity-70`} />
                <span className={`text-sm font-medium ${item.color || 'text-foreground'}`}>{item.label}</span>
              </div>
              {!item.onClick && <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30" />}
            </button>
          ))}
        </div>
      </main>

      <MarketBottomNav />
    </div>
  );
}
