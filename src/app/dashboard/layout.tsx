"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3.5">
          <img
            src="/assets/img/logo.png"
            alt="MarketPoint"
            className="h-8 w-auto object-contain"
          />
          <div className="w-5 h-5 border-2 border-slate-200 border-t-[#00AA5B] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col min-w-0 flex-1 bg-[#F8FAFC]">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F8FAFC]">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
