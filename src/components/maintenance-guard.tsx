"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  Wrench,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowLeft,
  Headphones,
  ShoppingBag,
  Zap,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MaintenanceConfig {
  isEnabled: boolean;
  mode: "global" | "topup";
  title?: string;
  message?: string;
  estimatedEndTime?: string;
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check user admin status
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = userData?.admin === true;

  // Listen to maintenance config
  const maintenanceDocRef = useMemoFirebase(() => doc(db, "settings", "maintenance"), [db]);
  const { data: maintenanceData } = useDoc(maintenanceDocRef);

  // Always allow admin routes and login
  const isExcludedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (!mounted || isExcludedPath) {
    return <>{children}</>;
  }

  const isEnabled = maintenanceData?.isEnabled === true;
  const mode: "global" | "topup" = maintenanceData?.mode === "topup" ? "topup" : "global";
  const title = maintenanceData?.title || (mode === "global" ? "Sistem Sedang Dalam Pemeliharaan" : "Layanan Topup Sedang Pemeliharaan");
  const message =
    maintenanceData?.message ||
    (mode === "global"
      ? "Kami sedang melakukan pemeliharaan rutin dan peningkatan server untuk kenyamanan serta keamanan transaksi Anda. Mohon maaf atas ketidaknyamanannya."
      : "Layanan isi pulsa, kuota, e-wallet, dan voucher game sedang dalam pemeliharaan teknis berkala. Seluruh transaksi pasar dan toko fisik tetap berjalan normal.");
  const estimatedEndTime = maintenanceData?.estimatedEndTime;

  // If maintenance is enabled:
  if (isEnabled) {
    if (mode === "global") {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-body">
          <div className="max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Mascot Maintenance Illustration */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto mb-1 drop-shadow-md">
              <Image
                src="/assets/img/mt.png"
                alt="MarketPoint Sedang Dalam Pemeliharaan"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 320px, 400px"
              />
            </div>

            {/* Title & Description */}
            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#212121]">
                {title}
              </h1>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed px-2">
                {message}
              </p>
            </div>

            {/* Estimated time if set */}
            {estimatedEndTime && (
              <div className="p-3 bg-white rounded-xl border border-border/60 shadow-xs flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 max-w-sm mx-auto">
                <Clock className="w-4 h-4 text-[#00AA5B]" />
                <span>Estimasi Selesai: <strong className="text-[#00AA5B]">{estimatedEndTime}</strong></span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
              <Button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs font-bold gap-2 shadow-sm transition-transform active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
              </Button>
            </div>

            {/* Footer notice */}
            <p className="text-[10px] text-muted-foreground/60 pt-4">
              &copy; {new Date().getFullYear()} MarketPoint. Terima kasih atas kesabaran Anda.
            </p>
          </div>
        </div>
      );
    }

    // 2. TOPUP ONLY MAINTENANCE
    // Only block if on /topup routes
    if (mode === "topup" && pathname.startsWith("/topup")) {
      return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-body">
          <div className="max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Topup Mascot Maintenance Illustration */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-88 md:h-88 mx-auto mb-1 drop-shadow-md">
              <Image
                src="/assets/img/mt.png"
                alt="Topup Sedang Dalam Pemeliharaan"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 280px, 360px"
              />
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#212121]">
                {title}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                {message}
              </p>
            </div>

            {/* Estimated time */}
            {estimatedEndTime && (
              <div className="p-3 bg-white rounded-xl border border-border/60 shadow-xs flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 max-w-sm mx-auto">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Estimasi Selesai: <strong className="text-amber-700">{estimatedEndTime}</strong></span>
              </div>
            )}

            {/* Back to Market Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
              <Button asChild className="w-full sm:w-auto h-9 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs font-bold gap-2 shadow-sm transition-transform active:scale-95">
                <Link href="/">
                  <ShoppingBag className="w-3.5 h-3.5" /> Ke Halaman Pasar
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto h-9 px-4 rounded-xl border-border text-xs font-bold gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Cek Kembali
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
