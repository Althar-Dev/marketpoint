"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const VALID_ADMIN_PATHS = new Set([
  "/admin",
  "/admin/analytics",
  "/admin/commissions",
  "/admin/digiflazz",
  "/admin/digiflazz/catalog",
  "/admin/digiflazz/config",
  "/admin/digiflazz/markup",
  "/admin/digiflazz/visuals",
  "/admin/disputes",
  "/admin/email",
  "/admin/gallery",
  "/admin/gallery/background",
  "/admin/gallery/badge",
  "/admin/gallery/banner",
  "/admin/gallery/icon",
  "/admin/products",
  "/admin/settings",
  "/admin/shops",
  "/admin/transactions",
  "/admin/users",
  "/admin/wa-bot",
  "/admin/xendit",
  "/admin/xendit/channels",
  "/admin/xendit/config",
]);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isValidAdminPath = VALID_ADMIN_PATHS.has(pathname);

  // If path is not a valid admin page (e.g. 404), bypass admin sidebar/header shell
  if (!isValidAdminPath) {
    return <>{children}</>;
  }

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
        {/* Subtil Background Grid - Green theme */}
        <div className="absolute inset-0 z-0 opacity-[0.02]" 
             style={{ backgroundImage: `radial-gradient(#00AA5B 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}>
        </div>
        
        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-4 animate-in fade-in zoom-in-95 duration-700">
             <img 
               src="/assets/img/logo.png" 
               alt="MarketPoint" 
               className="h-9 md:h-11 w-auto object-contain"
             />
          </div>
          
          {/* Custom Bouncing Underline - Green theme */}
          <div className="w-14 md:w-20 h-[2px] bg-[#00AA5B]/15 rounded-full overflow-hidden relative">
             <div className="absolute top-0 h-full bg-[#00AA5B] w-6 rounded-full animate-loading-bounce"></div>
          </div>
          
          {/* Micro Typography */}
          <div className="mt-5 flex flex-col items-center gap-1 opacity-40">
             <span className="text-[8px] md:text-[9px] tracking-[0.2em] text-[#2E3137] font-semibold uppercase">Verifikasi Admin</span>
          </div>
        </div>

        <style jsx global>{`
          @keyframes loading-bounce {
            0% {
              left: 0%;
              transform: translateX(0%);
            }
            100% {
              left: 100%;
              transform: translateX(-100%);
            }
          }
          .animate-loading-bounce {
            animation: loading-bounce 0.75s infinite alternate cubic-bezier(0.45, 0, 0.55, 1);
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
