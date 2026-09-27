"use client";

import React from "react";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";

export default function TopUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <MarketHeader />
      <div className="flex-1">
        {children}
      </div>
      <MarketFooter />
    </div>
  );
}
