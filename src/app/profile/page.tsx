"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettings } from "@/components/desktop-settings";
import Link from "next/link";
import { 
  Settings, 
  ChevronRight, 
  ReceiptText,
  Star,
  ShoppingBag,
  Heart,
  Store,
  MessageSquareWarning,
  HelpCircle,
  ScanLine,
  LogOut,
  Camera,
  Loader2
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user, authLoading, router]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const avatarUrl = data.url;

      // Update Firebase Auth Profile
      await updateProfile(user, { photoURL: avatarUrl });
      
      // Update Firestore User Document
      if (userRef) {
        await updateDoc(userRef, {
          photoURL: avatarUrl,
          updatedAt: new Date().toISOString(),
        });
      }

      toast({
        title: "Avatar Diperbarui",
        description: "Foto profil Anda berhasil diunggah.",
      });
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: error.message || "Terjadi kesalahan saat mengunggah foto.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateProfile(user, { displayName });
      if (userRef) {
        await updateDoc(userRef, {
          displayName,
          updatedAt: new Date().toISOString(),
        });
      }
      toast({
        title: "Profil Diperbarui",
        description: "Nama profil Anda berhasil disimpan.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setUpdating(false);
    }
  };

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

  if (!mounted || authLoading || (user && (walletLoading || userLoading || shopLoading))) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-body">
        <main className="flex-1 w-full pb-24 max-w-2xl mx-auto">
          <div className="px-4 py-1.5 flex items-center justify-between">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="px-4 py-2 flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-muted/20 w-full" />
          <div className="py-1 space-y-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-5 h-11 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-md" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-3" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;

  if (!isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <MarketHeader />
        <main className="flex-1 pt-16 bg-[#F8FAFC]">
          <DesktopSettings 
            user={user} 
            wallet={wallet} 
            hasShop={hasShop}
            displayName={displayName}
            setDisplayName={setDisplayName}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleUpdateProfile={handleUpdateProfile}
            handleLogout={handleLogout}
            updating={updating}
            onAvatarUpload={handleAvatarUpload}
            uploadingAvatar={uploadingAvatar}
          />
        </main>
        <MarketFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-body text-[#212121]">
      <main className="flex-1 w-full pb-24 lg:pb-16 max-w-2xl mx-auto">
        <div className="px-4 py-1.5 flex items-center justify-between bg-white sticky top-0 z-30 border-b border-border/50">
          <h1 className="text-base font-bold">Akun</h1>
          <Link href="/settings" className="p-1.5 hover:bg-muted rounded-full transition-colors text-foreground">
            <Settings className="w-4.5 h-4.5" />
          </Link>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => mobileFileInputRef.current?.click()}>
            <Avatar className="h-14 w-14 border-none shadow-sm ring-2 ring-muted/20 relative">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-[#00AA5B] text-white text-lg font-bold uppercase">
                {displayName?.substring(0, 1) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-1 shadow-md border border-border">
              {uploadingAvatar ? <Loader2 className="w-3 h-3 text-[#00AA5B] animate-spin" /> : <Camera className="w-3 h-3 text-[#00AA5B]" />}
            </div>
            <input 
              type="file" 
              ref={mobileFileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px]">{displayName || "Pengguna Baru"}</span>
            </div>
            <Link href="/wallet" className="mt-0.5 block space-y-0.5 hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-[#00AA5B] rounded-full flex items-center justify-center overflow-hidden p-0.5">
                  <img src="/assets/icon/wallet.png" className="w-full h-full object-contain" alt="Wallet" />
                </div>
                <span className="text-[11px] font-bold text-foreground">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</span>
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-[#FFC400] rounded-full flex items-center justify-center overflow-hidden p-0.5">
                  <img src="/assets/icon/mcoins.png" className="w-full h-full object-contain" alt="MCoins" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">0 MCoins</span>
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground opacity-40" />
              </div>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3 grid grid-cols-2 gap-3 mt-4">
          <Button asChild variant="outline" className="h-8 rounded-xl justify-between px-3.5 font-bold text-[10px] border-border hover:bg-muted/50">
            <Link href={hasShop ? "/my-shop" : "/my-shop/setup"}>
              {hasShop ? "Kelola Toko" : "Buka Toko Gratis"} <ChevronRight className="w-3 h-3 opacity-40" />
            </Link>
          </Button>
          <Button variant="outline" className="h-8 rounded-xl justify-between px-3.5 font-bold text-[10px] border-border hover:bg-muted/50">
            Daftar Affiliate <ChevronRight className="w-3 h-3 opacity-40" />
          </Button>
        </div>

        <div className="h-1.5 bg-muted/20 w-full" />

        <div className="py-1">
          {[
            { label: "Daftar Transaksi", icon: ReceiptText },
            { label: "Ulasan", icon: Star },
            { label: "Beli Lagi", icon: ShoppingBag },
            { label: "Wishlist", icon: Heart },
            { label: "Toko yang Di-follow", icon: Store },
          ].map((item, idx) => (
            <button 
              key={idx}
              className="w-full px-5 h-11 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-foreground opacity-70" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30" />
            </button>
          ))}
        </div>

        <div className="h-1.5 bg-muted/20 w-full" />

        <div className="py-1">
          {[
            { label: "Pesanan Dikomplain", icon: MessageSquareWarning },
            { label: "Bantuan MarketPoint Care", icon: HelpCircle },
            { label: "Scan Kode QR", icon: ScanLine },
            { label: "Keluar Akun", icon: LogOut, onClick: handleLogout, color: 'text-destructive' },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.onClick}
              className="w-full px-5 h-11 flex items-center justify-between hover:bg-muted/30 transition-all active:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color || 'text-foreground'} opacity-70`} />
                <span className={`text-sm font-medium ${item.color || 'text-foreground'}`}>{item.label}</span>
              </div>
              {!item.onClick && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30" />}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
