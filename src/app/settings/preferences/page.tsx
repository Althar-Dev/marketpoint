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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = "system" | "light" | "dark";

interface ThemeItem {
  id: ThemeOption;
  title: string;
  description: string;
  isBeta?: boolean;
}

const THEME_OPTIONS: ThemeItem[] = [
  {
    id: "system",
    title: "Gunakan Pengaturan HP-mu",
    description: "Sesuaikan tampilan dengan mengikuti pengaturan di HP kamu.",
    isBeta: true,
  },
  {
    id: "light",
    title: "Light Mode",
    description: "Tampilan warna standar yang saat ini sudah tersedia di MarketPoint.",
    isBeta: false,
  },
  {
    id: "dark",
    title: "Dark Mode",
    description: "Tampilan warna gelap yang saat ini sudah tersedia di MarketPoint.",
    isBeta: true,
  },
];

export default function PreferencesPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("light");

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

  // Apply theme class to document
  const applyTheme = (theme: ThemeOption) => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Load saved theme from user profile or localStorage
    const savedTheme = (userData?.preferences?.theme || localStorage.getItem("app_theme") || "light") as ThemeOption;
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, [user, authLoading, router, userData]);

  const handleSelectTheme = async (theme: ThemeOption) => {
    setSelectedTheme(theme);
    applyTheme(theme);

    if (typeof window !== "undefined") {
      localStorage.setItem("app_theme", theme);
    }

    if (userRef) {
      try {
        await updateDoc(userRef, {
          "preferences.theme": theme,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Gagal menyimpan tema:", err);
      }
    }

    const themeName =
      theme === "system" ? "Pengaturan HP-mu" : theme === "light" ? "Light Mode" : "Dark Mode";

    toast({
      title: "Tema Diperbarui",
      description: `Tampilan aplikasi berhasil diubah ke ${themeName}.`,
    });
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
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
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
            activeTab="preferensi"
          />
        </main>
        <MarketFooter />
      </div>

      {/* Dedicated Mobile View (Tokopedia Exact Style) */}
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
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Preferensi</h1>
        </header>

        {/* Theme Radio List (Exact Match to Tokopedia) */}
        <main className="divide-y divide-slate-100 bg-white">
          {THEME_OPTIONS.map((item) => {
            const isSelected = selectedTheme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTheme(item.id)}
                className="w-full py-4 px-4 flex items-center justify-between text-left active:bg-slate-50 transition-colors group"
              >
                <div className="pr-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#212121]">
                      {item.title}
                    </span>
                    {item.isBeta && (
                      <span className="bg-[#E02947] text-white text-[8px] font-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider leading-none">
                        BETA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6C727C] mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>

                {/* Tokopedia Radio Button */}
                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#00AA5B] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00AA5B]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-400 bg-white group-hover:border-slate-500" />
                  )}
                </div>
              </button>
            );
          })}
        </main>
      </div>
    </>
  );
}
