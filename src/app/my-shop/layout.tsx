"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MerchantSidebar } from "@/components/merchant-sidebar";
import { MerchantHeader } from "@/components/merchant-header";
import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#00AA5B] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Seller Center</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <MerchantSidebar />
        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <MerchantHeader />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
