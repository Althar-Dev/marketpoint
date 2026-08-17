"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
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
  Users,
  MessageSquareWarning,
  HelpCircle,
  ScanLine,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isUpdating, setIsUpdating] = useState(false);

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <MarketHeader />

      <main className="flex-1 w-full pt-16 pb-24 lg:pb-16 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="px-4 py-4 flex items-center justify-between bg-white">
          <h1 className="text-lg font-bold">Akun</h1>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* User Info Section */}
        <div className="px-4 py-2 flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-muted text-foreground text-xl font-bold uppercase">
              {user.displayName?.substring(0, 1) || user.email?.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-base">{user.displayName || "Pengguna Baru"}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-4 h-4 bg-[#00AA5B] rounded-full flex items-center justify-center">
                  <Wallet className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span className="text-xs font-medium">Saldo Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div className="w-4 h-4 bg-[#FFC400] rounded-full flex items-center justify-center">
                  <Coins className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span className="text-xs font-medium">MarketPoint Coins Belum Aktif</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Promo Banner / Subscription */}
        <div className="px-4 py-4">
          <div className="bg-white border border-border rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#00AA5B]/10 p-1.5 rounded-md">
                <span className="text-[#00AA5B] text-[10px] font-black italic">PLUS</span>
              </div>
              <div>
                <p className="text-xs font-bold">Nikmati Gratis Ongkir tanpa batas!</p>
                <p className="text-[10px] text-muted-foreground">Min. belanja Rp0, bebas biaya aplikasi-</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Action Quick Buttons */}
        <div className="px-4 pb-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-10 rounded-xl justify-between px-4 font-bold text-xs border-border">
            Buka Toko <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Button>
          <Button variant="outline" className="h-10 rounded-xl justify-between px-4 font-bold text-xs border-border">
            Daftar Affiliate <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Button>
        </div>

        <div className="h-2 bg-muted/30 w-full" />

        {/* Menu Groups */}
        <div className="py-2">
          {[
            { label: "Daftar Transaksi", icon: ReceiptText },
            { label: "Ulasan", icon: Star },
            { label: "Beli lagi", icon: ShoppingBag },
            { label: "Wishlist", icon: Heart },
            { label: "Toko yang di-follow", icon: Store },
          ].map((item, idx) => (
            <button 
              key={idx}
              className="w-full px-5 h-14 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-foreground opacity-80" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
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
                <item.icon className={`w-5 h-5 ${item.color || 'text-foreground'} opacity-80`} />
                <span className={`text-sm font-medium ${item.color || 'text-foreground'}`}>{item.label}</span>
              </div>
            </button>
          ))}
        </div>

      </main>

      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}
