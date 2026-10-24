"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  MessageSquare,
  Truck,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationConfig {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderUpdates: boolean;
  deliveryUpdates: boolean;
  disputeUpdates: boolean;
  securityAlerts: boolean;
  promotions: boolean;
  productRecommendations: boolean;
  newsletter: boolean;
  sellerNewOrders: boolean;
  sellerChat: boolean;
  sellerReviews: boolean;
}

const DEFAULT_SETTINGS: NotificationConfig = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: true,
  orderUpdates: true,
  deliveryUpdates: true,
  disputeUpdates: true,
  securityAlerts: true,
  promotions: true,
  productRecommendations: true,
  newsletter: false,
  sellerNewOrders: true,
  sellerChat: true,
  sellerReviews: true,
};

export default function NotificationsSettingsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<NotificationConfig>(DEFAULT_SETTINGS);

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (userData?.notificationSettings) {
      setSettings((prev) => ({
        ...prev,
        ...userData.notificationSettings,
      }));
    }
  }, [user, authLoading, router, userData]);

  const handleToggle = async (key: keyof NotificationConfig, value: boolean) => {
    if (key === "securityAlerts") {
      // Keamanan wajib aktif
      toast({
        title: "Notifikasi Wajib",
        description: "Notifikasi keamanan akun wajib aktif untuk melindungi akun Anda.",
      });
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (userRef) {
      try {
        await updateDoc(userRef, {
          notificationSettings: newSettings,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Pengaturan Disimpan",
          description: "Preferensi notifikasi berhasil diperbarui.",
        });
      } catch (err) {
        console.error("Gagal menyimpan preferensi notifikasi:", err);
      }
    }
  };

  if (!mounted || authLoading || (user && (userLoading || walletLoading || shopLoading))) {
    return (
      <>
        <div className="hidden md:block">
          <DesktopProfileSkeleton />
        </div>
        <div className="block md:hidden min-h-screen bg-white">
          <div className="px-4 py-3.5 flex items-center gap-4 bg-white">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full shrink-0" />
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;

  return (
    <>
      {/* Desktop Fallback */}
      <div className="hidden md:flex flex-col min-h-screen">
        <MarketHeader />
        <main className="flex-1 pt-16 bg-[#F8FAFC]">
          <DesktopSettings
            user={user}
            userData={userData}
            wallet={wallet}
            hasShop={hasShop}
            displayName={userData?.displayName || user.displayName || ""}
            setDisplayName={() => { }}
            isEditing={false}
            setIsEditing={() => { }}
            handleUpdateProfile={() => { }}
            handleLogout={() => auth.signOut().then(() => router.push("/login"))}
            updating={false}
            activeTab="notifikasi"
          />
        </main>
        <MarketFooter />
      </div>

      {/* Dedicated Mobile View (Tokopedia Style) */}
      <div className="block md:hidden min-h-screen bg-white font-body text-[#212121]">
        {/* Header - No bottom border */}
        <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white sticky top-0 z-30">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#212121]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Notifikasi</h1>
        </header>

        <main className="px-4 pb-16 space-y-6">


          {/* Section: Saluran Notifikasi */}
          <section className="space-y-3">
            <div className="py-0.5">
              <h3 className="text-[13px] font-bold text-[#212121]">Saluran Notifikasi</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Media yang digunakan untuk mengirim pemberitahuan
              </p>
            </div>

            <div className="space-y-2">
              {/* Push Notifikasi */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4.5 h-4.5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">Push Notifikasi</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pemberitahuan pop-up langsung</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(val) => handleToggle("pushEnabled", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              {/* Email Notifikasi */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">Email Notifikasi</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Kirim invoice & ringkasan ke {user?.email || "email Anda"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(val) => handleToggle("emailEnabled", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              {/* SMS & WhatsApp */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4.5 h-4.5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">SMS & WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Kode verifikasi & notifikasi status darurat</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(val) => handleToggle("smsEnabled", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>
            </div>
          </section>

          {/* Section: Transaksi & Pesanan */}
          <section className="space-y-3 pt-1">
            <div className="py-0.5">
              <h3 className="text-[13px] font-bold text-[#212121]">Transaksi & Pesanan</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Pemberitahuan seputar belanjaan dan riwayat pembayaran
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Status Pembayaran</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Konfirmasi pembayaran berhasil, gagal, atau kadaluwarsa</p>
                </div>
                <Switch
                  checked={settings.orderUpdates}
                  onCheckedChange={(val) => handleToggle("orderUpdates", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Update Pengiriman & Kurir</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Paket dikirim, dalam perjalanan, dan pesanan tiba</p>
                </div>
                <Switch
                  checked={settings.deliveryUpdates}
                  onCheckedChange={(val) => handleToggle("deliveryUpdates", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Komplain & Pengembalian</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pembaruan diskusi komplain dan pengembalian dana</p>
                </div>
                <Switch
                  checked={settings.disputeUpdates}
                  onCheckedChange={(val) => handleToggle("disputeUpdates", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>
            </div>
          </section>

          {/* Section: Keamanan Akun */}
          <section className="space-y-3 pt-1">
            <div className="py-0.5">
              <h3 className="text-[13px] font-bold text-[#212121]">Keamanan Akun</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Perlindungan dan aktivitas krusial akun MarketPointID
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#212121]">Peringatan Keamanan</p>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Wajib
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  Pemberitahuan login perangkat baru, perubahan sandi, PIN, atau data profil sensitif.
                </p>
              </div>
              <Switch
                checked={settings.securityAlerts}
                disabled
                className="data-[state=checked]:bg-[#00AA5B] opacity-80 cursor-not-allowed"
              />
            </div>
          </section>

          {/* Section: Promo & Aktivitas */}
          <section className="space-y-3 pt-1">
            <div className="py-0.5">
              <h3 className="text-[13px] font-bold text-[#212121]">Promo & Penawaran</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Voucher diskon, flash sale, dan rekomendasi spesial
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Flash Sale & Diskon Spesial</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Kabar promo diskon kilat, festival belanja, & kupon cashback</p>
                </div>
                <Switch
                  checked={settings.promotions}
                  onCheckedChange={(val) => handleToggle("promotions", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Rekomendasi Produk</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Rekomendasi barang berdasarkan produk yang Anda sukai</p>
                </div>
                <Switch
                  checked={settings.productRecommendations}
                  onCheckedChange={(val) => handleToggle("productRecommendations", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#212121]">Newsletter & Berita MarketPoint</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Artikel panduan, tren belanja, dan pembaruan aplikasi</p>
                </div>
                <Switch
                  checked={settings.newsletter}
                  onCheckedChange={(val) => handleToggle("newsletter", val)}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>
            </div>
          </section>

          {/* Section: Toko Saya (Khusus Penjual) */}
          {hasShop && (
            <section className="space-y-3 pt-1">
              <div className="py-0.5">
                <h3 className="text-[13px] font-bold text-[#212121]">Aktivitas Toko</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Notifikasi penjualan untuk kelancaran operasional toko Anda
                </p>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">Pesanan Baru Masuk</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Notifikasi instan saat pembeli melakukan checkout & bayar</p>
                  </div>
                  <Switch
                    checked={settings.sellerNewOrders}
                    onCheckedChange={(val) => handleToggle("sellerNewOrders", val)}
                    className="data-[state=checked]:bg-[#00AA5B]"
                  />
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">Chat & Pertanyaan Pembeli</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pesan baru masuk dari calon pembeli</p>
                  </div>
                  <Switch
                    checked={settings.sellerChat}
                    onCheckedChange={(val) => handleToggle("sellerChat", val)}
                    className="data-[state=checked]:bg-[#00AA5B]"
                  />
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121]">Ulasan & Penilaian Baru</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pemberitahuan saat pembeli memberi bintang dan ulasan</p>
                  </div>
                  <Switch
                    checked={settings.sellerReviews}
                    onCheckedChange={(val) => handleToggle("sellerReviews", val)}
                    className="data-[state=checked]:bg-[#00AA5B]"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Privacy Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Anda dapat mengubah preferensi notifikasi ini kapan saja. Notifikasi verifikasi keamanan dan tagihan penting akan tetap dikirimkan demi keamanan akun Anda.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
