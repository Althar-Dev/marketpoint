
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

  // Reference ke dokumen user di Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  // Ambil data user untuk cek status admin
  const { data: userData, loading: docLoading } = useDoc(userDocRef);

  const isLoading = authLoading || docLoading;

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Jika belum login, lempar ke halaman login
        router.push("/login");
      } else if (userData && userData.admin !== true) {
        // Jika login tapi bukan admin, kembalikan ke beranda
        router.push("/");
      }
    }
  }, [user, userData, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Sleek Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-50">
           <div className="h-full bg-indigo-600 w-1/3 animate-[loading-progress_1.5s_infinite_ease-in-out]"></div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5 opacity-40 animate-pulse">
             <span className="text-[11px] font-medium text-[#2E3137]">memverifikasi akses</span>
          </div>
        </div>

        <style jsx global>{`
          @keyframes loading-progress {
            0% { transform: translateX(-100%); width: 30%; }
            50% { transform: translateX(100%); width: 60%; }
            100% { transform: translateX(400%); width: 30%; }
          }
        `}</style>
      </div>
    );
  }

  // Hanya tampilkan konten jika user ada dan memiliki role admin
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
