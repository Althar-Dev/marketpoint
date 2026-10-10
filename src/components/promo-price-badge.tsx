import React from "react";
import { cn } from "@/lib/utils";

interface PromoPriceBadgeProps {
  price: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function CouponPriceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-3.5 h-3.5 shrink-0", className)}
      viewBox="0 0 20 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coupon ticket background with side cutouts */}
      <path
        d="M2 4C2 2.9 2.9 2 4 2H16C17.1 2 18 2.9 18 4V6C16.9 6 16 6.9 16 8C16 9.1 16.9 10 18 10V12C18 13.1 17.1 14 16 14H4C2.9 14 2 13.1 2 12V10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6V4Z"
        fill="#FF385C"
      />
      {/* Percentage % mark inside ticket */}
      <circle cx="7.2" cy="6" r="1.15" fill="white" />
      <circle cx="12.8" cy="10" r="1.15" fill="white" />
      <line
        x1="13"
        y1="5.6"
        x2="7"
        y2="10.4"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PromoPriceBadge({
  price,
  className,
  size = "md",
}: PromoPriceBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-[#FFF0F2] border border-[#FFCCD3] text-[#FF385C] font-bold tracking-tight",
        size === "xs" && "gap-1 px-1 py-0.5 rounded-[5px] text-[10px]",
        size === "sm" && "gap-1 px-1.5 py-0.5 rounded-[5px] text-xs",
        size === "md" && "gap-1 px-1.5 py-0.5 rounded-[6px] text-xs sm:text-sm",
        size === "lg" && "gap-1.5 px-2.5 py-1 rounded-lg text-xl sm:text-2xl",
        className
      )}
    >
      <CouponPriceIcon
        className={cn(
          size === "xs" && "w-3 h-3",
          size === "sm" && "w-3 h-3",
          size === "md" && "w-3.5 h-3.5",
          size === "lg" && "w-5 h-5 sm:w-6 sm:h-6"
        )}
      />
      <span className="leading-none select-none font-bold">
        Rp{Math.round(price).toLocaleString("id-ID")}
      </span>
    </div>
  );
}
