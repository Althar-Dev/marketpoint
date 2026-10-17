"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData, loading: docLoading } = useDoc(userDocRef);

  const isLoading = authLoading || docLoading;

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center font-body">
        <div className="relative flex flex-col items-center">
          <div className="mb-4">
             <img src="/assets/img/logo.png" alt="MarketPointID" className="h-10 w-auto object-contain animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-700">
             <Loader2 className="w-4 h-4 animate-spin text-[#00AA5B]" />
             <span className="text-xs font-bold uppercase tracking-widest text-[#00AA5B]">Menyiapkan Dashboard...</span>
          </div>
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
