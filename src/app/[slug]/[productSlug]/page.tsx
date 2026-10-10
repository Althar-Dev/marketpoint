"use client";

import { useParams, notFound } from "next/navigation";
import ProductDetailPage from "@/app/products/[id]/page";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { ShopHeader } from "@/components/shop-header";

const RESERVED_PREFIXES = new Set([
  "admin",
  "api",
  "topup",
  "my-shop",
  "products",
  "search",
  "settings",
  "profile",
  "wallet",
  "terms",
  "privacy",
  "login",
  "register",
  "checkout",
  "assets",
  "favicon.ico"
]);

export default function ShopProductRoute() {
  const params = useParams();
  const slug = (params?.slug as string || "").toLowerCase();

  // If slug is a reserved route prefix (e.g. /admin/..., /api/...), immediately 404
  if (RESERVED_PREFIXES.has(slug)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      <div className="hidden lg:block">
        <MarketHeader />
      </div>
      <div className="lg:hidden">
        <ShopHeader />
      </div>
      <div className="flex-1">
        <ProductDetailPage />
      </div>
      <div className="hidden lg:block">
        <MarketFooter />
      </div>
    </div>
  );
}
