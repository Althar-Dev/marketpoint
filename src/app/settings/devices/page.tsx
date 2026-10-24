"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Smartphone,
  Laptop,
  ShieldCheck,
  MapPin,
  Clock,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  registerOrUpdateDevice,
  revokeDevice,
  revokeAllOtherDevices,
  getOrCreateDeviceId,
  parseClientDevice,
  formatLastActive,
  getDeviceSignature,
  groupAndDeduplicateOtherDevices,
  DeviceSession,
} from "@/lib/device-service";

export default function DevicesPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [isLogoutOtherDialogOpen, setIsLogoutOtherDialogOpen] = useState(false);
  const [selectedDeviceToLogout, setSelectedDeviceToLogout] = useState<DeviceSession | null>(null);

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

    if (typeof window !== "undefined" && user) {
      const dId = getOrCreateDeviceId();
      setCurrentDeviceId(dId);
      registerOrUpdateDevice(db, user);
    }
  }, [user, authLoading, router, db]);

  const devicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "devices");
  }, [db, user]);

  const { data: devicesList, loading: devicesLoading } = useCollection<DeviceSession>(devicesQuery as any);

  const fallbackDevice = parseClientDevice();
  const currentDeviceSig = getDeviceSignature(fallbackDevice);
  const currentDeviceData = devicesList?.find(
    (d) => d.id === currentDeviceId || getDeviceSignature(d) === currentDeviceSig
  ) || {
    id: currentDeviceId,
    name: fallbackDevice.name,
    browser: fallbackDevice.browser,
    os: fallbackDevice.os,
    deviceType: fallbackDevice.deviceType,
    location: fallbackDevice.location,
    lastActiveAt: new Date(),
  };

  const otherDevices = groupAndDeduplicateOtherDevices(
    devicesList || [],
    currentDeviceId,
    fallbackDevice
  );

  const handleLogoutOtherDevices = async () => {
    if (!user) return;
    const ok = await revokeAllOtherDevices(db, user.uid, currentDeviceId, fallbackDevice);
    setIsLogoutOtherDialogOpen(false);
    if (ok) {
      toast({
        title: "Sesi Lain Dikeluarkan",
        description: "Seluruh perangkat lain telah berhasil dikeluarkan dari akun Anda.",
      });
    }
  };

  const handleLogoutSingleDevice = async (device: DeviceSession) => {
    if (!user) return;
    const ok = await revokeDevice(db, user.uid, device.allIds || device.id);
    setSelectedDeviceToLogout(null);
    if (ok) {
      toast({
        title: "Sesi Dikeluarkan",
        description: `Perangkat ${device.name} berhasil dikeluarkan.`,
      });
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
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            {/* Current Device Card Skeleton */}
            <div className="p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />

            <div className="space-y-1 pt-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-14 rounded-lg" />
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
            setDisplayName={() => {}}
            isEditing={false}
            setIsEditing={() => {}}
            handleUpdateProfile={() => {}}
            handleLogout={() => auth.signOut().then(() => router.push("/login"))}
            updating={false}
            activeTab="perangkat"
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
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Perangkat & Sesi</h1>
        </header>

        <main className="px-4 pb-16 space-y-5">


          {/* Section: Aktivitas & Perangkat Masuk */}
          <section className="space-y-2">
            <div className="py-1">
              <h3 className="text-[13px] font-bold text-[#212121]">Aktivitas & Perangkat Masuk</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sesi login aktif pada akun MarketPointID Anda</p>
            </div>

            {/* Current Device Card */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {currentDeviceData.deviceType === "mobile" ? (
                    <Smartphone className="w-4.5 h-4.5 text-[#00AA5B]" />
                  ) : (
                    <Laptop className="w-4.5 h-4.5 text-[#00AA5B]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#212121]">Perangkat Saat Ini</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {currentDeviceData.name} • {currentDeviceData.location}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                Online
              </span>
            </div>

            {/* Logout Other Devices Button */}
            {otherDevices.length > 0 && (
              <button
                type="button"
                onClick={() => setIsLogoutOtherDialogOpen(true)}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-98"
              >
                Keluar dari Semua Perangkat Lain
              </button>
            )}
          </section>

          {/* Section: Sesi Perangkat Lain */}
          <section className="space-y-2.5 pt-1">
            <div className="py-1">
              <h3 className="text-[13px] font-bold text-[#212121]">Perangkat Lain Terhubung</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Daftar browser atau ponsel yang pernah login menggunakan akun ini
              </p>
            </div>

            {devicesLoading ? (
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="h-10 bg-slate-200/60 rounded-lg animate-pulse" />
              </div>
            ) : otherDevices.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-[#212121]">Tidak Ada Perangkat Lain</p>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                  Akun Anda saat ini hanya aktif di perangkat ini. Tidak ada sesi lain yang terhubung.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {otherDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {dev.deviceType === "mobile" ? (
                          <Smartphone className="w-4.5 h-4.5 text-slate-600" />
                        ) : (
                          <Laptop className="w-4.5 h-4.5 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#212121] truncate">{dev.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {dev.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            {formatLastActive(dev.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDeviceToLogout(dev)}
                      className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                    >
                      Keluar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Security Advice Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#00AA5B]" />
              <h4 className="text-xs font-bold text-[#212121]">Tips Keamanan Sesi</h4>
            </div>
            <ul className="text-[10px] text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed pl-1">
              <li>Jangan biarkan akun Anda login di komputer umum atau perangkat orang lain tanpa pengawasan.</li>
              <li>Jika Anda merasa curiga terhadap aktivitas akun, segera tekan tombol <strong>Keluar dari Semua Perangkat Lain</strong> dan ubah kata sandi di menu Keamanan Akun.</li>
            </ul>
          </div>
        </main>

        {/* Dialog Konfirmasi Keluar dari Semua Perangkat Lain */}
        <Dialog open={isLogoutOtherDialogOpen} onOpenChange={setIsLogoutOtherDialogOpen}>
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Keluar Semua Perangkat?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Akun Anda akan otomatis keluar dari semua browser dan aplikasi di ponsel lain, kecuali perangkat ini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLogoutOtherDialogOpen(false)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleLogoutOtherDevices}
                className="h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
              >
                Ya, Keluar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Konfirmasi Keluar Satu Perangkat */}
        <Dialog
          open={!!selectedDeviceToLogout}
          onOpenChange={(open) => !open && setSelectedDeviceToLogout(null)}
        >
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">Keluarkan Perangkat?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Anda yakin ingin mengeluarkan sesi dari{" "}
                <span className="font-bold text-slate-800">{selectedDeviceToLogout?.name}</span>? Pengguna pada perangkat tersebut harus login ulang.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDeviceToLogout(null)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => selectedDeviceToLogout && handleLogoutSingleDevice(selectedDeviceToLogout)}
                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white text-xs"
              >
                Ya, Keluarkan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
