"use client";

import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DesktopProfileSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-body text-[#212121]">
      <MarketHeader />
      <main className="flex-1 pt-16 bg-[#F8FAFC]">
        <div className="max-w-screen-xl mx-auto flex gap-6 p-6 items-start">
          {/* Sidebar Skeleton */}
          <aside className="w-[260px] shrink-0 space-y-4 sticky top-20">
            <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden p-4 space-y-5">
              {/* User Profile info */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-2.5 w-16 rounded-md" />
                </div>
              </div>

              {/* Toko Saya & Saldo links */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
                <div className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>

              {/* Sidebar Menu Accordions */}
              <div className="space-y-4 pt-3 border-t border-border/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                      </div>
                      <Skeleton className="w-3 h-3 rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Logout button */}
              <div className="pt-4 border-t border-border/50">
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </Card>
          </aside>

          {/* Main Content Area Skeleton */}
          <main className="flex-1 min-w-0">
            <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden">
              {/* Header Title */}
              <div className="p-5 border-b border-border/50 flex items-center gap-2.5">
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>

              {/* Tabs Bar */}
              <div className="px-5 border-b border-border/50 bg-white">
                <div className="flex gap-6 py-3.5">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Avatar Upload Card */}
                  <div className="md:col-span-4 space-y-4">
                    <Card className="p-5 border border-border/50 shadow-none bg-white rounded-xl flex flex-col items-center gap-4">
                      <Skeleton className="h-40 w-40 rounded-xl" />
                      <Skeleton className="h-9 w-full rounded-lg" />
                      <Skeleton className="h-3 w-3/4 rounded-md" />
                    </Card>
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>

                  {/* Biodata & Contact Fields */}
                  <div className="md:col-span-8 space-y-8">
                    {/* Section 1: Biodata */}
                    <div className="space-y-5">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="grid grid-cols-12 items-center gap-3">
                            <div className="col-span-3">
                              <Skeleton className="h-3 w-20 rounded-md" />
                            </div>
                            <div className="col-span-9 flex items-center justify-between">
                              <Skeleton className="h-3.5 w-32 rounded-md" />
                              <Skeleton className="h-3 w-10 rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Contact */}
                    <div className="space-y-5 pt-5 border-t border-border/50">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="grid grid-cols-12 items-center gap-3">
                            <div className="col-span-3">
                              <Skeleton className="h-3 w-20 rounded-md" />
                            </div>
                            <div className="col-span-9 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-3.5 w-36 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-md" />
                              </div>
                              <Skeleton className="h-3 w-10 rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </main>
      <MarketFooter />
    </div>
  );
}
