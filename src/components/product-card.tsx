"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PromoPriceBadge } from "@/components/promo-price-badge";
import { getProductActiveFlashSale, getProductUpcomingFlashSale } from "@/lib/flash-sale";
import { Star, Store, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  /** Raw product object from the API / Firestore-enriched data */
  product: {
    id: string | number;
    title: string;
    slug?: string;
    price?: number | string;
    /** Harga coret (normal price saat diskon) */
    discountPrice?: number | string;
    images?: { imageUrl: string }[];
    ratingAvg?: number | string;
    salesCount?: number | string;
    shopId?: string;
    shopSlug?: string;
    shopName?: string | { name?: string; shopName?: string };
    shopLogoUrl?: string;
    shopIsVerified?: boolean;
    shopIsOfficial?: boolean;
    shopFlashSales?: any[];
  };
  /** Current unix timestamp in ms — needed for flash sale countdown logic */
  nowTime: number;
  /** Whether to show upcoming flash sale badge if product is scheduled */
  showUpcomingBadge?: boolean;
}

export function ProductCard({ product, nowTime, showUpcomingBadge }: ProductCardProps) {
  const flashSaleInfo = getProductActiveFlashSale(
    String(product.id),
    product.shopFlashSales ?? [],
    nowTime
  );
  const isFlashSale = !!flashSaleInfo;

  const upcomingFsInfo =
    !isFlashSale && showUpcomingBadge
      ? getProductUpcomingFlashSale(
          String(product.id),
          product.shopFlashSales ?? [],
          nowTime
        )
      : null;

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].imageUrl
      : "https://cdn.marketpoint.id/marketpoint.png";

  const price = isFlashSale
    ? flashSaleInfo.discountPrice
    : upcomingFsInfo
      ? upcomingFsInfo.discountPrice
      : Number(product.price || 0);

  const originalPrice = isFlashSale
    ? flashSaleInfo.originalPrice
    : upcomingFsInfo
      ? upcomingFsInfo.originalPrice
      : product.discountPrice
        ? Number(product.discountPrice)
        : null;

  const discountPercent = isFlashSale
    ? `${flashSaleInfo.discountPercentage}%`
    : upcomingFsInfo
      ? `${upcomingFsInfo.discountPercentage}%`
      : originalPrice && originalPrice > price
        ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}%`
        : null;

  const rating =
    Number(product.ratingAvg || 0) > 0
      ? Number(product.ratingAvg).toFixed(1)
      : "0.0";

  const soldText = product.salesCount
    ? `${product.salesCount} terjual`
    : "0 terjual";

  const shopName =
    typeof product.shopName === "string"
      ? product.shopName
      : product.shopName && typeof product.shopName === "object"
        ? product.shopName.name || product.shopName.shopName || "Toko Seller"
        : "Toko Seller";

  const shopLogoUrl =
    typeof product.shopLogoUrl === "string" ? product.shopLogoUrl : "";

  const isVerified = Boolean(product.shopIsVerified);
  const isOfficial = Boolean(product.shopIsOfficial);

  const href = `/${product.shopSlug || "marketpoint"}/${product.slug || product.id}`;

  return (
    <Link href={href}>
      <Card className="group border-border/70 shadow-2xs rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border-[1px] h-full">
        <CardContent className="p-0 flex flex-col h-full">
          {/* ── Thumbnail ─────────────────────────────────────────── */}
          <div className="relative aspect-square w-full bg-muted/20 overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Flash sale badge */}
            {isFlashSale ? (
              <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-br-lg shadow-xs flex items-center gap-0.5 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/icon/fire.gif"
                  alt="Flash Sale"
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                {flashSaleInfo.discountPercentage}%
              </div>
            ) : upcomingFsInfo ? (
              <div className="absolute top-0 left-0 bg-[#00AA5B] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-xs z-10 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {upcomingFsInfo.discountPercentage}%
              </div>
            ) : discountPercent ? (
              <div className="absolute top-0 left-0 bg-[#FF5E5E] text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-xs z-10">
                {discountPercent}
              </div>
            ) : null}

            {/* Official Store badge overlay */}
            {isOfficial && (
              <div className="absolute top-1.5 right-1.5 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/badge/officials.png"
                  alt="Official Store"
                  className="w-4 h-4 object-contain drop-shadow"
                />
              </div>
            )}
          </div>

          {/* ── Info ──────────────────────────────────────────────── */}
          <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              {/* Title */}
              <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                {product.title}
              </h4>

              {/* Price */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  {isFlashSale ? (
                    <PromoPriceBadge price={price} />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-[#000000]">
                      Rp {price.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                {!isFlashSale && originalPrice && originalPrice > price && (
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                    Rp {originalPrice.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>

            {/* ── Rating & Shop ──────────────────────────────────── */}
            <div className="space-y-1 pt-1">
              {/* Rating row */}
              <div className="flex items-center gap-1">
                <Star
                  className={cn(
                    "w-2.5 h-2.5 sm:w-3 sm:h-3",
                    Number(rating) > 0
                      ? "text-[#FFC400] fill-[#FFC400]"
                      : "text-slate-300 fill-slate-200"
                  )}
                />
                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                  {rating} <span className="opacity-40">|</span> {soldText}
                </span>
              </div>

              {/* Shop row */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  {shopLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shopLogoUrl}
                      alt={shopName}
                      className="w-[18px] h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                    />
                  ) : (
                    <div className="w-[18px] h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                      <Store className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[70px] sm:max-w-[90px]">
                    {shopName}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isVerified && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/assets/badge/verified.png"
                        alt="Verified"
                        className="w-[17px] h-[17px] object-contain shrink-0"
                      />
                    )}
                    {isOfficial && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/assets/badge/officials.png"
                        alt="Official"
                        className="w-[17px] h-[17px] object-contain shrink-0"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
