"use client";

import React from "react";
import Link from "next/link";
import { Lock, Crown, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MerchantPlanLockProps {
  title: string;
  featureName: string;
  description: string;
  currentPlan: string;
  requiredPlans: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits?: string[];
}

export function MerchantPlanLock({
  title,
  featureName,
  description,
  currentPlan,
  requiredPlans,
  icon: FeatureIcon,
  benefits = [],
}: MerchantPlanLockProps) {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F9FAFB] min-h-[calc(100vh-64px)] flex items-center justify-center">
      <Card className="max-w-lg w-full border border-border shadow-md rounded-2xl bg-white overflow-hidden text-center p-6 sm:p-8 space-y-6">
        {/* Lock Icon Visual */}
        <div className="relative inline-flex mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-inner">
            <FeatureIcon className="w-8 h-8 text-slate-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Header Info */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Fitur Eksklusif Berlangganan
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#212121]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Plan Comparison Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-left space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">Plan Toko Anda Saat Ini:</span>
            <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
              {currentPlan}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">Mulai Terbuka Pada:</span>
            <span className="font-extrabold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
              Paket {requiredPlans}
            </span>
          </div>
        </div>

        {/* Benefits list if available */}
        {benefits.length > 0 && (
          <div className="text-left space-y-2 border-t border-border/60 pt-4">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Keuntungan Fitur {featureName}:
            </p>
            <div className="space-y-1.5">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Link href="/my-shop" className="w-full sm:w-1/2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Toko
            </Button>
          </Link>

          <Link href="/my-shop/subscription" className="w-full sm:w-1/2">
            <Button
              type="button"
              className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-extrabold text-xs gap-1.5 shadow-md shadow-[#00AA5B]/20"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade Plan Toko
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
