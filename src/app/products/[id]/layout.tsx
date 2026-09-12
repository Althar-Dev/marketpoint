"use client";

import React from "react";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { ShopHeader } from "@/components/shop-header";

export default function ProductDetailLayout({
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
      <div className="hidden lg:block">
        <MarketFooter />
      </div>
    </div>
  );
}
