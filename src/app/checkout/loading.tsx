"use client";

import React from "react";
import {
  ShieldCheck,
  User,
  Store,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function CheckoutLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* Top Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-2xs">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
            <Skeleton className="h-4 w-36 rounded hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 bg-emerald-50/70 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-[#00AA5B]/70 animate-pulse" />
            <Skeleton className="h-3.5 w-32 sm:w-44 rounded-full bg-emerald-100/80" />
          </div>
        </div>
      </header>

      {/* Main Skeleton Grid */}
      <main className="flex-1 max-w-screen-xl mx-auto px-4 py-6 md:py-8 w-full">
        {/* Animated Top Loading Bar Indicator */}
        <div className="mb-6 flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-border/70 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-[#00AA5B] animate-spin" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-[#212121]">Menyiapkan Checkout</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Memverifikasi ketersediaan produk dan saluran pembayaran resmi...
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-[#00AA5B] animate-ping" />
            <span className="text-[11px] font-bold text-[#00AA5B]">Sistem Siap</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: 8 COLS */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: DATA PEMBELI & DETAIL PESANAN SKELETON */}
            <Card className="border-border bg-white rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00AA5B]/70" />
                  <Skeleton className="h-4 w-48 rounded" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Rincian Toko & Produk */}
                <div className="space-y-3 pb-5 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#00AA5B]/70" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Thumbnail & Info Produk */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0" />
                      <div className="space-y-2 flex-1 pt-0.5">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-4 w-1/3 rounded" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                      </div>
                    </div>

                    {/* Quantity Selector Skeleton */}
                    <Skeleton className="w-24 h-9 rounded-xl shrink-0 self-end sm:self-center" />
                  </div>
                </div>

                {/* Form Kontak & Data Pembeli Skeleton */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-48 rounded" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-3 w-64 rounded" />
                  </div>

                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: PILIH METODE PEMBAYARAN SKELETON */}
            <Card className="border-border bg-white rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#00AA5B]/70" />
                  <Skeleton className="h-4 w-40 rounded" />
                </div>
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>

              <CardContent className="p-0 divide-y divide-border/50">
                {[
                  { icon: QrCode, count: 3 },
                  { icon: Building2, count: 4 },
                  { icon: Wallet, count: 2 },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-slate-300 shrink-0" />
                      <Skeleton className="h-4 w-36 sm:w-48 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: item.count }).map((_, i) => (
                          <Skeleton key={i} className="h-4 w-9 sm:w-11 rounded" />
                        ))}
                      </div>
                      <Skeleton className="h-4 w-4 rounded ml-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: 4 COLS (RINGKASAN PEMBAYARAN SKELETON) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="border-border bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50">
                <Skeleton className="h-4 w-36 rounded" />
              </div>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Kode Promo Skeleton */}
                <div className="space-y-2 pb-3.5 border-b border-border/60">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                    <Skeleton className="h-9 w-20 rounded-xl" />
                  </div>
                </div>

                {/* Price Breakdown Skeleton */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </div>
                  <div className="pt-3 border-t border-border/80 flex items-baseline justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-2.5 w-28 rounded" />
                    </div>
                    <Skeleton className="h-6 w-28 rounded" />
                  </div>
                </div>

                {/* Action Button Skeleton */}
                <Skeleton className="w-full h-12 rounded-xl mt-2 bg-[#00AA5B]/20 animate-pulse" />

                {/* Safe info */}
                <div className="pt-3 border-t border-border/50 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]/60" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                  <Skeleton className="h-2.5 w-28 rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Loading() {
  return <CheckoutLoadingSkeleton />;
}
