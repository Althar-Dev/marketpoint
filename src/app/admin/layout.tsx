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
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center relative overflow-hidden font-body">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
             style={{ backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}>
        </div>
        
        {/* Top Progress Bar - Very Slim */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white z-50 overflow-hidden">
           <div className="h-full bg-indigo-600 w-full animate-loading-slide origin-left"></div>
        </div>
        
        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Minimalist Visual Indicator */}
          <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
             <div className="absolute inset-0 border-[1.5px] border-indigo-600/10 rounded-full"></div>
             <div className="absolute inset-0 border-t-[1.5px] border-indigo-600 rounded-full animate-spin"></div>
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
             <span className="text-[11px] tracking-[0.2em] text-[#2E3137] font-medium opacity-60 uppercase">autentikasi sistem</span>
             <div className="flex gap-1">
                <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce"></div>
             </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes loading-slide {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); opacity: 0; }
          }
          .animate-loading-slide {
            animation: loading-slide 2.5s infinite cubic-bezier(0.65, 0, 0.35, 1);
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
