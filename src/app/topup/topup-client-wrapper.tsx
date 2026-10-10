"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopUpHeader } from "@/components/topup-header";
import { MarketFooter } from "@/components/market-footer";

export function TopUpClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <TopUpHeader />
      <div className="flex-1">
        {children}
      </div>
      <MarketFooter />
    </div>
  );
}
