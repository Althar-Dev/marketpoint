"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  Inbox,
  ShoppingBag,
  UserCircle,
  LogOut,
  Store,
  Loader2,
  Camera,
  Lock,
  Check,
  KeyRound,
  Smartphone,
  Mail,
  Bell,
  Laptop,
  Globe,
  Sliders,
  Link2,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Sparkles,
  Truck,
  MessageSquare
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { updatePassword, FacebookAuthProvider, linkWithPopup, updateEmail } from "firebase/auth";
import { doc, updateDoc, collection } from "firebase/firestore";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  registerOrUpdateDevice,
  revokeDevice,
  revokeAllOtherDevices,
  getOrCreateDeviceId,
  parseClientDevice,
  formatLastActive,
  DeviceSession,
} from "@/lib/device-service";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const SETTINGS_TABS = [
  { id: "biodata", label: "Biodata Diri" },
  { id: "keamanan", label: "Keamanan" },
  { id: "notifikasi", label: "Notifikasi" },
  { id: "perangkat", label: "Perangkat" },
  { id: "preferensi", label: "Preferensi" },
  { id: "akun-terhubung", label: "Akun Terhubung" },
];

function parseBirthDate(dateStr: string) {
  if (!dateStr) return { day: "", month: "", year: "" };
  const parts = dateStr.trim().split(/[\s-]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return {
        year: parts[0],
        month: String(parseInt(parts[1], 10)),
        day: String(parseInt(parts[2], 10))
      };
    }
    const d = parts[0];
    const mStr = parts[1].toLowerCase();
    const y = parts[2];
    const mIdx = MONTHS.findIndex((m) => m.toLowerCase().startsWith(mStr));
    return {
      day: String(parseInt(d, 10)),
      month: mIdx !== -1 ? String(mIdx + 1) : "",
      year: y
    };
  }
  return { day: "", month: "", year: "" };
}

type ThemeOption = "system" | "light" | "dark";

interface DesktopProfileSettingsProps {
  user: any;
  userData?: any;
  wallet: any;
  hasShop?: boolean;
  displayName: string;
  setDisplayName: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  handleUpdateProfile: () => void;
  handleLogout: () => void;
  updating: boolean;
  onAvatarUpload?: (file: File) => Promise<void>;
  uploadingAvatar?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DesktopSettings({
  user,
  userData,
  wallet,
  hasShop,
  displayName,
  setDisplayName,
  isEditing,
  setIsEditing,
  handleUpdateProfile,
  handleLogout,
  updating,
  onAvatarUpload,
  uploadingAvatar,
  activeTab = "biodata",
  onTabChange
}: DesktopProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [currentTab, setCurrentTab] = useState(activeTab || "biodata");

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleTabSelect = (tabId: string) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
    const routeMap: Record<string, string> = {
      biodata: "/settings/profile",
      keamanan: "/settings/security",
      notifikasi: "/settings/notifications",
      perangkat: "/settings/devices",
      preferensi: "/settings/preferences",
      "akun-terhubung": "/settings/connected",
    };
    if (typeof window !== "undefined" && routeMap[tabId]) {
      window.history.pushState(null, "", routeMap[tabId]);
    }
  };

  // Auth Methods Config from Admin
  const authMethodsRef = useMemoFirebase(() => doc(db, "settings", "auth_methods"), [db]);
  const { data: authMethodsData } = useDoc(authMethodsRef);
  const isGoogleLoginEnabled = authMethodsData ? (authMethodsData.googleLoginEnabled ?? true) : true;
  const isFacebookLoginEnabled = authMethodsData ? (authMethodsData.facebookLoginEnabled ?? true) : true;

  // PIN States
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const hasPin = userData?.hasPin === true;

  // Notifications State
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    orderUpdates: true,
    deliveryUpdates: true,
    disputeUpdates: true,
    securityAlerts: true,
    promotions: true,
    sellerNewOrders: true,
    sellerChat: true,
  });

  useEffect(() => {
    if (userData?.notificationSettings) {
      setNotificationSettings((prev) => ({
        ...prev,
        ...userData.notificationSettings,
      }));
    }
  }, [userData]);

  // Real Devices State & Management
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const dId = getOrCreateDeviceId();
      setCurrentDeviceId(dId);
      registerOrUpdateDevice(db, user);
    }
  }, [user, db]);

  const devicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "devices");
  }, [db, user]);

  const { data: devicesList, loading: devicesLoading } = useCollection<DeviceSession>(devicesQuery as any);

  const fallbackDevice = parseClientDevice();
  const currentDeviceData = devicesList?.find((d) => d.id === currentDeviceId) || {
    id: currentDeviceId,
    name: fallbackDevice.name,
    browser: fallbackDevice.browser,
    os: fallbackDevice.os,
    deviceType: fallbackDevice.deviceType,
    location: fallbackDevice.location,
    lastActiveAt: new Date(),
  };

  const otherSessions = (devicesList || []).filter(
    (d) => d.id !== currentDeviceId && d.status !== "revoked"
  );
  const [isLogoutOtherDialogOpen, setIsLogoutOtherDialogOpen] = useState(false);

  const handleRevokeSingle = async (deviceId: string, deviceName: string) => {
    if (!user) return;
    const ok = await revokeDevice(db, user.uid, deviceId);
    if (ok) {
      toast({
        title: "Perangkat Dikeluarkan",
        description: `Sesi ${deviceName} telah berhasil diakhiri.`,
      });
    }
  };

  const handleRevokeAllOther = async () => {
    if (!user) return;
    const ok = await revokeAllOtherDevices(db, user.uid, currentDeviceId);
    setIsLogoutOtherDialogOpen(false);
    if (ok) {
      toast({
        title: "Sesi Lain Dikeluarkan",
        description: "Seluruh perangkat lain telah berhasil dikeluarkan dari akun Anda.",
      });
    }
  };

  // Preferences / Theme State
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = (userData?.preferences?.theme || localStorage.getItem("app_theme") || "light") as ThemeOption;
      setSelectedTheme(saved);
    }
  }, [userData]);

  const applyTheme = (theme: ThemeOption) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  const handleSelectTheme = async (theme: ThemeOption) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme", theme);
    }
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          "preferences.theme": theme,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Gagal menyimpan tema:", err);
      }
    }
    const themeName = theme === "system" ? "Sistem" : theme === "light" ? "Light Mode" : "Dark Mode";
    toast({
      title: "Tema Diperbarui",
      description: `Tampilan aplikasi berhasil diubah ke ${themeName}.`,
    });
  };

  // Dialog & Temp States for Biodata
  const [isBirthDialogOpen, setIsBirthDialogOpen] = useState(false);
  const [isGenderDialogOpen, setIsGenderDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [tempDay, setTempDay] = useState("");
  const [tempMonth, setTempMonth] = useState("");
  const [tempYear, setTempYear] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [isSavingField, setIsSavingField] = useState(false);

  // Email Add & Verify Dialog States
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailToken, setEmailToken] = useState("");
  const [emailExpiresAt, setEmailExpiresAt] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  const handleOpenEmailDialog = () => {
    setEmailInput(userData?.email || user?.email || "");
    setEmailVerificationCode("");
    setEmailStep("input");
    setEmailCountdown(0);
    setEmailToken("");
    setEmailExpiresAt(0);
    setIsEmailDialogOpen(true);
  };

  const handleSendEmailVerificationCode = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      toast({
        variant: "destructive",
        title: "Format Email Tidak Valid",
        description: "Masukkan format email yang valid (contoh: user@marketpoint.id).",
      });
      return;
    }

    setIsSendingEmailCode(true);
    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type: "add_email" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirimkan kode verifikasi.");
      }

      setEmailToken(data.token);
      setEmailExpiresAt(data.expiresAt);
      setEmailStep("verify");
      setEmailCountdown(60);
      toast({
        title: "Kode Verifikasi Terkirim",
        description: `Kode 6 digit telah dikirimkan dari no-reply@marketpoint.id ke ${cleanEmail}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Kode",
        description: err.message || "Terjadi gangguan saat mengirimkan kode verifikasi.",
      });
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleConfirmVerifyEmail = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanCode = emailVerificationCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Kode Tidak Lengkap",
        description: "Silakan masukkan 6 digit kode verifikasi yang Anda terima.",
      });
      return;
    }

    setIsVerifyingEmailCode(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          token: emailToken,
          expiresAt: emailExpiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kode verifikasi tidak valid atau telah kedaluwarsa.");
      }

      if (user) {
        // 1. Update Firestore user document
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          email: cleanEmail,
          emailVerified: true,
          emailUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 2. Try to update Firebase Auth user email if supported
        try {
          await updateEmail(user, cleanEmail);
        } catch (authErr) {
          console.warn("Could not update auth user email directly:", authErr);
        }
      }

      toast({
        title: "Email Berhasil Ditambahkan",
        description: `Alamat email ${cleanEmail} telah diverifikasi dan tersimpan pada akun Anda.`,
      });
      setIsEmailDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: err.message || "Gagal memverifikasi kode verifikasi.",
      });
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  const handleSaveField = async (field: string, value: string) => {
    if (!user) return;
    setIsSavingField(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        [field]: value,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Perubahan Disimpan",
        description: "Informasi profil berhasil diperbarui.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setIsSavingField(false);
    }
  };

  const providers = user?.providerData?.map((p: any) => p.providerId) || [];
  const isGoogleUser = providers.includes("google.com");
  const isFacebookUser = providers.includes("facebook.com") || userData?.connectedAccounts?.facebook === true;
  const hasPassword = providers.includes("password");
  const canCreatePassword = isGoogleUser && !hasPassword;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      await onAvatarUpload(file);
    }
  };

  const handlePinDigitChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);

    if (digit && index < 5) {
      const nextInput = document.getElementById(`pin-digit-desk-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-desk-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSavePin = async () => {
    const fullPin = pinDigits.join("");
    if (fullPin.length !== 6) {
      toast({
        variant: "destructive",
        title: "PIN Belum Lengkap",
        description: "Masukkan 6 digit angka untuk PIN MarketPoint.",
      });
      return;
    }

    setIsPinLoading(true);
    try {
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          hasPin: true,
          pinUpdatedAt: new Date().toISOString(),
        });
      }
      toast({
        title: "PIN Berhasil Disimpan",
        description: "PIN MarketPoint Anda kini telah aktif untuk mengamankan transaksi dompet.",
      });
      setIsPinDialogOpen(false);
      setPinDigits(["", "", "", "", "", ""]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan PIN",
        description: error.message || "Terjadi gangguan saat menyimpan PIN.",
      });
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    if (key === "securityAlerts") {
      toast({
        title: "Notifikasi Wajib",
        description: "Notifikasi keamanan akun wajib aktif untuk melindungi akun Anda.",
      });
      return;
    }

    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          notificationSettings: updated,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Pengaturan Disimpan",
          description: "Preferensi notifikasi berhasil diperbarui.",
        });
      } catch (err) {
        console.error("Gagal update notifikasi:", err);
      }
    }
  };

  // Connected Accounts handlers
  const handleConnectFacebook = async () => {
    if (!isFacebookLoginEnabled) {
      toast({
        variant: "destructive",
        title: "Metode Dinonaktifkan",
        description: "Metode login Facebook sedang dinonaktifkan oleh Administrator.",
      });
      return;
    }
    if (!user) return;
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope("email");
      provider.addScope("public_profile");
      const result = await linkWithPopup(user, provider);
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          "connectedAccounts.facebook": true,
          facebookName: result.user.displayName || null,
          facebookEmail: result.user.email || null,
          updatedAt: new Date().toISOString(),
        });
      }
      toast({
        title: "Akun Terhubung",
        description: "Akun Facebook Anda berhasil dihubungkan.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal Menghubungkan",
        description: error.message || "Terjadi kesalahan saat menghubungkan Facebook.",
      });
    }
  };

  const fbIdentifier =
    userData?.facebookName ||
    userData?.facebookEmail ||
    user?.providerData?.find((p: any) => p.providerId === "facebook.com")?.displayName ||
    "Akun Facebook Terhubung";

  return (
    <div className="bg-[#F8FAFC] font-body text-[#212121] min-h-[calc(100vh-64px)]">
      <div className="max-w-screen-xl mx-auto flex gap-6 p-6 items-start">

        <DesktopAccountSidebar
          user={user}
          wallet={wallet}
          hasShop={hasShop}
          displayName={displayName}
          activeItem="profile-settings"
          handleLogout={handleLogout}
        />

        <main className="flex-1 min-w-0">
          <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden h-auto">
            <div className="p-5 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCircle className="w-4.5 h-4.5 text-muted-foreground" />
                <h1 className="text-base font-bold tracking-tight">{displayName || "Profil"}</h1>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                MarketPointID Account
              </span>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabSelect} className="w-full">
              <div className="px-5 border-b border-border/50 bg-white overflow-x-auto scrollbar-none">
                <TabsList className="bg-transparent h-12 p-0 w-full justify-start gap-6 rounded-none border-none">
                  {SETTINGS_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="px-0 rounded-none h-full border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[12px] text-muted-foreground transition-all cursor-pointer shrink-0"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* TAB 1: BIODATA DIRI */}
              <TabsContent value="biodata" className="p-6 mt-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-4 space-y-4">
                    <Card className="p-5 border border-border/50 shadow-none bg-white rounded-xl flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-40 w-40 ring-2 ring-[#F8FAFC] rounded-xl overflow-hidden shadow-sm">
                          <AvatarImage
                            src={user.photoURL === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : (user.photoURL || undefined)}
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback className="bg-[#00AA5B] text-white text-4xl font-bold rounded-none">
                            {displayName?.substring(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="w-full text-xs font-bold border-border/60 hover:bg-[#F8FAFC] transition-colors rounded-xl h-9"
                      >
                        <Camera className="w-3.5 h-3.5 mr-2" />
                        Pilih Foto
                      </Button>
                      <div className="space-y-1 text-center">
                        <p className="text-[11px] text-muted-foreground">Besar file: maks. 10MB</p>
                        <p className="text-[11px] text-muted-foreground">Format gambar: .JPEG, .PNG</p>
                      </div>
                    </Card>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/settings/security/change-password")}
                      className="w-full text-xs font-bold border-border/60 hover:bg-[#F8FAFC] transition-colors rounded-xl h-9"
                    >
                      <Lock className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      {canCreatePassword ? "Buat Kata Sandi Akun" : "Ubah Kata Sandi"}
                    </Button>
                  </div>

                  <div className="md:col-span-8 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-4">Ubah Biodata Diri</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Nama</div>
                          <div className="col-span-9 flex items-center justify-between">
                            {isEditing ? (
                              <div className="flex gap-2 flex-1">
                                <Input
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="h-8 text-xs font-semibold rounded-xl bg-slate-50 border-slate-200"
                                />
                                <Button
                                  onClick={handleUpdateProfile}
                                  disabled={updating}
                                  className="h-8 px-3 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                                >
                                  {updating ? "Simpan..." : "Simpan"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setIsEditing(false)}
                                  className="h-8 px-3 rounded-xl text-xs font-semibold"
                                >
                                  Batal
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[12px] font-bold">{displayName || "Belum diatur"}</span>
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                                >
                                  Ubah
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Tanggal Lahir</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <span className="text-[12px] font-bold">{userData?.birthDate || "Belum diatur"}</span>
                            <button
                              onClick={() => {
                                const parsed = parseBirthDate(userData?.birthDate || "");
                                setTempDay(parsed.day);
                                setTempMonth(parsed.month);
                                setTempYear(parsed.year);
                                setIsBirthDialogOpen(true);
                              }}
                              className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                            >
                              {userData?.birthDate ? "Ubah" : "Tambah"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Jenis Kelamin</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <span className="text-[12px] font-bold">
                              {userData?.gender === "L" ? "Laki-laki" : userData?.gender === "P" ? "Perempuan" : "Belum diatur"}
                            </span>
                            <button
                              onClick={() => {
                                setTempGender(userData?.gender || "");
                                setIsGenderDialogOpen(true);
                              }}
                              className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                            >
                              {userData?.gender ? "Ubah" : "Tambah"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <h3 className="text-sm font-bold text-foreground mb-4">Ubah Kontak</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Email</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold">{userData?.email || user?.email || "Belum terdaftar"}</span>
                              {(userData?.email || user?.email) ? (
                                <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded">Terverifikasi</div>
                              ) : (
                                <div className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">Belum Terdaftar</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenEmailDialog}
                              className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                            >
                              {userData?.email || user?.email ? "Ubah" : "Tambah"}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Nomor HP</div>
                          <div className="col-span-9 flex items-center justify-between">
                            {(userData?.phoneNumber || userData?.phone || user?.phoneNumber) ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold">{userData?.phoneNumber || userData?.phone || user?.phoneNumber}</span>
                                  <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded">Terverifikasi</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setTempPhone(userData?.phoneNumber || userData?.phone || user?.phoneNumber || "");
                                    setIsPhoneDialogOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                                >
                                  Ubah
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setTempPhone("");
                                  setIsPhoneDialogOpen(true);
                                }}
                                className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all"
                              >
                                Tambah nomor HP
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: KEAMANAN */}
              <TabsContent value="keamanan" className="p-6 mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Autentikasi & Sandi</h3>
                  <p className="text-xs text-muted-foreground mb-4">Kelola kunci masuk dan kata sandi transaksi akun MarketPoint Anda.</p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <KeyRound className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Kata Sandi Akun</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {canCreatePassword ? "Belum dibuat (Masuk via Google)" : "Diperbarui secara berkala"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/settings/security/change-password")}
                        className="h-8 px-3 rounded-xl text-xs font-bold text-[#00AA5B] border-[#00AA5B]/40 hover:bg-[#00AA5B]/10"
                      >
                        {canCreatePassword ? "Buat Sandi" : "Ubah Sandi"}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                          <Lock className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">PIN MarketPoint (6 Digit)</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {hasPin ? "PIN aktif untuk keamanan dompet & saldo" : "Belum diatur untuk proteksi transaksi"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPinDialogOpen(true)}
                        className="h-8 px-3 rounded-xl text-xs font-bold text-[#00AA5B] border-[#00AA5B]/40 hover:bg-[#00AA5B]/10"
                      >
                        {hasPin ? "Ubah PIN" : "Atur PIN"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-1">Kontak Pemulihan</h3>
                  <p className="text-xs text-muted-foreground mb-4">Digunakan saat Anda lupa kata sandi atau butuh verifikasi pemulihan akun.</p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Email Utama</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{userData?.email || user?.email || "Belum ada"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {(userData?.email || user?.email) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Belum Ada
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenEmailDialog}
                          className="h-8 px-2.5 text-xs font-bold text-[#00AA5B] hover:bg-[#00AA5B]/10 hover:text-[#00AA5B]"
                        >
                          {userData?.email || user?.email ? "Ubah" : "Tambah"}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Nomor Handphone</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {userData?.phoneNumber || userData?.phone || user?.phoneNumber || "Belum diatur"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTempPhone(userData?.phoneNumber || userData?.phone || user?.phoneNumber || "");
                          setIsPhoneDialogOpen(true);
                        }}
                        className="text-xs font-bold text-[#00AA5B] hover:bg-[#00AA5B]/10 rounded-xl h-8 px-3"
                      >
                        {userData?.phoneNumber ? "Ubah" : "Tambah"}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: NOTIFIKASI */}
              <TabsContent value="notifikasi" className="p-6 mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Saluran & Aktivitas Notifikasi</h3>
                  <p className="text-xs text-muted-foreground mb-4">Pilih jenis informasi yang ingin Anda terima dari MarketPointID.</p>

                  <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-white overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Bell className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Push Notification</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Dapatkan pemberitahuan langsung di browser atau perangkat Anda.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.pushEnabled}
                        onCheckedChange={(val) => handleToggleNotification("pushEnabled", val)}
                        className="data-[state=checked]:bg-[#00AA5B]"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Email Notifikasi</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Kirim ringkasan transaksi dan invoice langsung ke email terdaftar.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.emailEnabled}
                        onCheckedChange={(val) => handleToggleNotification("emailEnabled", val)}
                        className="data-[state=checked]:bg-[#00AA5B]"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <ShoppingBag className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Update Pesanan & Transaksi</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Pemberitahuan ketika pembayaran berhasil dan pesanan diproses.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.orderUpdates}
                        onCheckedChange={(val) => handleToggleNotification("orderUpdates", val)}
                        className="data-[state=checked]:bg-[#00AA5B]"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Truck className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Update Pengiriman & Resi</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Info nomor resi pengiriman dan status barang tiba.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.deliveryUpdates}
                        onCheckedChange={(val) => handleToggleNotification("deliveryUpdates", val)}
                        className="data-[state=checked]:bg-[#00AA5B]"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#212121]">Peringatan Keamanan Akun</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Wajib Aktif</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Notifikasi jika ada aktivitas login mencurigakan atau ganti kata sandi.</p>
                        </div>
                      </div>
                      <Switch
                        checked={true}
                        disabled
                        className="data-[state=checked]:bg-[#00AA5B] opacity-70"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Promosi & Diskon Eksklusif</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Voucher belanja, cashback, dan promo flash sale MarketPointID.</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.promotions}
                        onCheckedChange={(val) => handleToggleNotification("promotions", val)}
                        className="data-[state=checked]:bg-[#00AA5B]"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: PERANGKAT */}
              <TabsContent value="perangkat" className="p-6 mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Perangkat Saat Ini</h3>
                  <p className="text-xs text-muted-foreground mb-4">Perangkat yang sedang Anda gunakan saat ini untuk mengakses akun.</p>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0">
                        {currentDeviceData.deviceType === "mobile" ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#212121]">{currentDeviceData.name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00AA5B] text-white">
                            Sedang Digunakan
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {currentDeviceData.location} • Sesi Aktif Sekarang
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Sesi di Perangkat Lain</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Daftar perangkat lain yang memiliki akses ke akun Anda.</p>
                    </div>
                    {otherSessions.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLogoutOtherDialogOpen(true)}
                        className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-8 px-3"
                      >
                        Keluarkan Semua
                      </Button>
                    )}
                  </div>

                  {devicesLoading ? (
                    <div className="space-y-2">
                      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                  ) : otherSessions.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-border bg-slate-50/50">
                      <CheckCircle2 className="w-8 h-8 text-[#00AA5B] mx-auto mb-2" />
                      <p className="text-xs font-bold text-[#212121]">Tidak ada sesi lain yang aktif</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Akun Anda saat ini hanya aktif di perangkat ini. Tidak ada perangkat lain yang terhubung.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-white overflow-hidden">
                      {otherSessions.map((session) => (
                        <div key={session.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                              {session.deviceType === "mobile" ? <Smartphone className="w-4.5 h-4.5" /> : <Laptop className="w-4.5 h-4.5" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#212121]">{session.name}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {session.location} • {formatLastActive(session.lastActiveAt)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSingle(session.id, session.name)}
                            className="text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-xl h-8 px-3"
                          >
                            Keluarkan
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 5: PREFERENSI */}
              <TabsContent value="preferensi" className="p-6 mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Tema Tampilan</h3>
                  <p className="text-xs text-muted-foreground mb-4">Pilih tampilan antarmuka yang paling nyaman untuk Anda.</p>

                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSelectTheme("light")}
                      className={cn(
                        "p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer",
                        selectedTheme === "light"
                          ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-1 ring-[#00AA5B]"
                          : "border-border/60 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Sun className={cn("w-5 h-5", selectedTheme === "light" ? "text-[#00AA5B]" : "text-slate-600")} />
                        {selectedTheme === "light" && <Check className="w-4 h-4 text-[#00AA5B]" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#212121]">Light Mode</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Tampilan terang standar</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTheme("dark")}
                      className={cn(
                        "p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer",
                        selectedTheme === "dark"
                          ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-1 ring-[#00AA5B]"
                          : "border-border/60 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Moon className={cn("w-5 h-5", selectedTheme === "dark" ? "text-[#00AA5B]" : "text-slate-600")} />
                        {selectedTheme === "dark" && <Check className="w-4 h-4 text-[#00AA5B]" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#212121]">Dark Mode</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Warna gelap ramah mata</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTheme("system")}
                      className={cn(
                        "p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer",
                        selectedTheme === "system"
                          ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-1 ring-[#00AA5B]"
                          : "border-border/60 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Monitor className={cn("w-5 h-5", selectedTheme === "system" ? "text-[#00AA5B]" : "text-slate-600")} />
                        {selectedTheme === "system" && <Check className="w-4 h-4 text-[#00AA5B]" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#212121]">Pengaturan Sistem</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Otomatis ikuti tema OS</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-bold text-foreground mb-1">Bahasa & Wilayah</h3>
                  <p className="text-xs text-muted-foreground mb-4">Pengaturan bahasa dan format mata uang lokal.</p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Globe className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Bahasa Aplikasi</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Bahasa Indonesia (Standar)</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                        Indonesia
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Sliders className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Mata Uang Transaksi</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">IDR • Rupiah Indonesia (Rp)</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                        IDR (Rp)
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 6: AKUN TERHUBUNG */}
              <TabsContent value="akun-terhubung" className="p-6 mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Akun Sosial & Login Cepat</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Hubungkan akun sosial Anda untuk kemudahan masuk ke MarketPointID dengan sekali klik.
                  </p>

                  <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-white overflow-hidden">
                    {/* GOOGLE */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#212121]">Google</p>
                            {!isGoogleLoginEnabled && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                Dinonaktifkan Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {user?.email || "Masuk cepat dengan akun Google"}
                          </p>
                        </div>
                      </div>
                      <div>
                        {isGoogleUser ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Terhubung
                          </span>
                        ) : !isGoogleLoginEnabled ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-slate-100 text-slate-400">
                            Nonaktif
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-xl text-xs font-bold border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10"
                          >
                            Hubungkan
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* FACEBOOK */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#212121]">Facebook</p>
                            {!isFacebookLoginEnabled && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                                Dinonaktifkan Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isFacebookUser
                              ? fbIdentifier
                              : !isFacebookLoginEnabled
                                ? "Metode Facebook dinonaktifkan oleh Admin"
                                : "Hubungkan akun Facebook untuk akses cepat"}
                          </p>
                        </div>
                      </div>
                      <div>
                        {isFacebookUser ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Terhubung
                          </span>
                        ) : !isFacebookLoginEnabled ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-slate-100 text-slate-400">
                            Nonaktif
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleConnectFacebook}
                            className="h-8 px-3 rounded-xl text-xs font-bold border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10"
                          >
                            Hubungkan
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* APPLE */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 fill-slate-900" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#212121]">Apple ID</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Gunakan Apple ID untuk masuk secara aman.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                      >
                        Segera Hadir
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>

      {/* Dialog PIN MarketPoint 6 Digit */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm p-6 border-border bg-white text-center">
          <DialogHeader className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#00AA5B] flex items-center justify-center mx-auto mb-1">
              <Lock className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#212121]">
              {hasPin ? "Ubah PIN MarketPoint" : "Atur PIN MarketPoint"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Masukkan 6 digit angka rahasia untuk memproteksi penarikan saldo dan transaksi dompet.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5 flex justify-center gap-2">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-digit-desk-${idx}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(idx, e)}
                className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPinDialogOpen(false);
                setPinDigits(["", "", "", "", "", ""]);
              }}
              className="h-9 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSavePin}
              disabled={isPinLoading || pinDigits.some((d) => !d)}
              className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
            >
              {isPinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Simpan PIN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Keluarkan Sesi Lain */}
      <Dialog open={isLogoutOtherDialogOpen} onOpenChange={setIsLogoutOtherDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm p-6 border-border bg-white text-center">
          <DialogHeader className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-1">
              <LogOut className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#212121]">
              Keluarkan Semua Perangkat Lain?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Seluruh sesi login selain perangkat ini akan diputus dan harus login ulang.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutOtherDialogOpen(false)}
              className="h-9 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleRevokeAllOther}
              className="h-9 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white text-xs"
            >
              Ya, Keluarkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Tanggal Lahir (Desktop) */}
      <Dialog open={isBirthDialogOpen} onOpenChange={setIsBirthDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm p-6 border-border bg-white">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-[#212121]">Pilih Tanggal Lahir</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tanggal lahir digunakan untuk promo hari ulang tahun khusus pengguna.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-[11px] font-semibold text-slate-600">Tanggal Lahir</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={tempDay}
                onChange={(e) => setTempDay(e.target.value)}
                className="h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] cursor-pointer"
              >
                <option value="">Hari</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={tempMonth}
                onChange={(e) => setTempMonth(e.target.value)}
                className="h-10 px-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] cursor-pointer"
              >
                <option value="">Bulan</option>
                {MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {m.substring(0, 3)}
                  </option>
                ))}
              </select>

              <select
                value={tempYear}
                onChange={(e) => setTempYear(e.target.value)}
                className="h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00AA5B] cursor-pointer"
              >
                <option value="">Tahun</option>
                {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 10 - i).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBirthDialogOpen(false)}
              className="h-9 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!tempDay || !tempMonth || !tempYear) {
                  toast({
                    variant: "destructive",
                    title: "Lengkapi Tanggal",
                    description: "Silakan pilih hari, bulan, dan tahun lahir Anda.",
                  });
                  return;
                }
                const formatted = `${tempDay} ${MONTHS[parseInt(tempMonth, 10) - 1]} ${tempYear}`;
                await handleSaveField("birthDate", formatted);
                setIsBirthDialogOpen(false);
              }}
              disabled={isSavingField}
              className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
            >
              {isSavingField ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Jenis Kelamin (Desktop) */}
      <Dialog open={isGenderDialogOpen} onOpenChange={setIsGenderDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm p-6 border-border bg-white">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-[#212121]">Pilih Jenis Kelamin</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih jenis kelamin untuk rekomendasi promo yang lebih relevan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTempGender(item.value)}
                className={cn(
                  "w-full h-11 px-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all",
                  tempGender === item.value
                    ? "border-[#00AA5B] bg-[#00AA5B]/5 text-[#00AA5B]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                )}
              >
                <span>{item.label}</span>
                {tempGender === item.value && <Check className="w-4 h-4 text-[#00AA5B]" />}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenderDialogOpen(false)}
              className="h-9 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await handleSaveField("gender", tempGender);
                setIsGenderDialogOpen(false);
              }}
              disabled={isSavingField || !tempGender}
              className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
            >
              {isSavingField ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Nomor HP (Desktop) */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm p-6 border-border bg-white">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-[#212121]">Nomor Handphone</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nomor HP digunakan untuk notifikasi pesanan dan pengiriman barang.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Nomor HP</label>
            <Input
              type="tel"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              placeholder="081234567890"
              className="h-10 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPhoneDialogOpen(false)}
              className="h-9 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await handleSaveField("phoneNumber", tempPhone.trim());
                setIsPhoneDialogOpen(false);
              }}
              disabled={isSavingField}
              className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
            >
              {isSavingField ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog Tambah / Ubah Email & Verifikasi (Desktop) */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md p-6 border-border bg-white shadow-xl">
          <DialogHeader className="text-left space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center mb-1">
              <Mail className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-[#212121]">
              {emailStep === "input"
                ? (userData?.email || user?.email ? "Ubah Alamat Email" : "Tambah Alamat Email")
                : "Verifikasi Kode Email"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {emailStep === "input"
                ? "Email wajib diverifikasi. Kami akan mengirimkan kode 6 digit melalui no-reply@marketpoint.id untuk memastikan kepemilikan akun Anda."
                : `Masukkan 6 digit kode keamanan yang telah dikirimkan oleh no-reply@marketpoint.id ke ${emailInput}.`}
            </DialogDescription>
          </DialogHeader>

          {emailStep === "input" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Alamat Email Baru</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nama@email.com"
                    className="h-10 pl-9 rounded-xl text-xs font-semibold border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-normal">
                  Pastikan email dapat diakses. Anda wajib memasukkan kode OTP yang dikirim ke email tersebut sebelum disimpan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(false)}
                  className="h-9 rounded-xl font-bold text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSendEmailVerificationCode}
                  disabled={isSendingEmailCode || !emailInput.trim()}
                  className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                >
                  {isSendingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Kirim Kode
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">Kode Verifikasi 6 Digit</label>
                  <button
                    type="button"
                    onClick={() => setEmailStep("input")}
                    className="text-[11px] text-[#00AA5B] font-bold hover:underline"
                  >
                    Ganti Email
                  </button>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="------"
                  className="h-12 rounded-xl text-center text-lg font-bold tracking-[0.4em] border-slate-200 bg-slate-50 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-muted-foreground">Tidak menerima email?</span>
                {emailCountdown > 0 ? (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Kirim ulang dalam <span className="font-bold text-[#00AA5B]">{emailCountdown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailVerificationCode}
                    disabled={isSendingEmailCode}
                    className="text-[11px] font-bold text-[#00AA5B] hover:underline"
                  >
                    Kirim Ulang Kode
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailStep("input")}
                  className="h-9 rounded-xl font-bold text-xs"
                >
                  Kembali
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmVerifyEmail}
                  disabled={isVerifyingEmailCode || emailVerificationCode.length !== 6}
                  className="h-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                >
                  {isVerifyingEmailCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Verifikasi & Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
