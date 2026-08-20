"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MerchantSidebar } from "@/components/merchant-sidebar";
import { MerchantHeader } from "@/components/merchant-header";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <MerchantSidebar />
        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <MerchantHeader />
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
