
"use client";

import React from "react";
import { ShopHeader } from "@/components/shop-header";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { MarketBottomNav } from "@/components/market-bottom-nav";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>
      <div className="lg:hidden">
        <ShopHeader />
      </div>
      <div className="flex-1">
        {children}
      </div>
      <MarketFooter />
      <MarketBottomNav />
    </div>
  );
}
