"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function AdminLayout({
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
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (userData && userData.admin !== true) {
        router.push("/");
      }
    }
  }, [user, userData, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden font-body">
        {/* Subtil Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
             style={{ backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }}>
        </div>
        
        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-5 animate-in fade-in zoom-in-95 duration-700">
             <img 
               src="/assets/img/logo.png" 
               alt="MarketPoint" 
               className="h-11 w-auto object-contain"
             />
          </div>
          
          {/* Custom Bouncing Underline */}
          <div className="w-16 h-[2px] bg-indigo-600/10 rounded-full overflow-hidden relative">
             <div className="absolute top-0 h-full bg-indigo-600 w-6 rounded-full animate-loading-bounce"></div>
          </div>
          
          {/* Micro Typography */}
          <div className="mt-6 flex flex-col items-center gap-1.5 opacity-40">
             <span className="text-[9px] tracking-[0.25em] text-[#2E3137] font-bold uppercase">Autentikasi</span>
          </div>
        </div>

        <style jsx global>{`
          @keyframes loading-bounce {
            0% { transform: translateX(0%); }
            100% { transform: translateX(166%); }
          }
          .animate-loading-bounce {
            animation: loading-bounce 0.6s infinite alternate cubic-bezier(0.45, 0, 0.55, 1);
          }
        `}</style>
      </div>
    );
  }

  if (!user || userData?.admin !== true) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#F9FAFB]">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <AdminHeader />
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
