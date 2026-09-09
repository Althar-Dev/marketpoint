"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopProfileSkeleton() {
  return (
    <main className="flex-1 w-full pt-14 md:pt-16 pb-20 lg:pb-0 bg-[#F8FAFC]">
      {/* Banner Section Skeleton */}
      <div className="relative h-32 sm:h-44 md:h-72 lg:h-[350px] w-full bg-muted overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Shop Info Card Skeleton */}
      <div className="max-w-screen-xl mx-auto px-4 -mt-10 md:-mt-20 relative z-20 mb-8">
        <Card className="border-border border-[1.5px] shadow-xl rounded-2xl bg-white overflow-hidden relative">
          <CardContent className="p-4 md:p-8 relative">
            <div className="flex flex-row items-start gap-4 md:gap-8">
              {/* Logo Skeleton */}
              <div className="relative shrink-0">
                <Skeleton className="h-16 w-16 md:h-32 md:w-32 rounded-2xl md:rounded-3xl border-[1.5px] border-border" />
              </div>

              {/* Info Container Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-6 md:h-8 w-44 md:w-64 rounded-lg" />
                    <Skeleton className="h-5 md:h-6 w-20 md:w-24 rounded-full" />
                  </div>

                  <Skeleton className="h-3.5 w-28 rounded-md" />

                  {/* Desktop Stats Skeleton */}
                  <div className="hidden md:flex flex-wrap items-center gap-6 mt-2">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>

                  {/* Mobile Stats Skeleton */}
                  <div className="flex md:hidden items-center gap-3 mt-1.5">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>

                {/* Desktop Action Buttons Skeleton */}
                <div className="hidden md:flex items-center gap-3 pt-6">
                  <Skeleton className="h-10 w-28 rounded-xl" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons Skeleton */}
            <div className="flex md:hidden items-center gap-2 mt-6 pt-4 border-t border-border/50">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 flex-1 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Content Grid Skeleton */}
      <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* Sidebar Business Profile Skeleton */}
        <aside className="lg:col-span-3 space-y-6">
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-5 border-b border-border bg-[#F8FAFC]">
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
            <CardContent className="p-5 space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-5 border-b border-border bg-[#F8FAFC]">
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <CardContent className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Main Products Grid Skeleton */}
        <main className="lg:col-span-9 space-y-6">
          {/* Tabs Bar Skeleton */}
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white p-2">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </Card>

          {/* Search & Filter Bar Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>

          {/* Product Cards Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3.5 space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-3 w-12 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </main>
  );
}
