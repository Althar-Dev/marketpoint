"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
           <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
           <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">Memverifikasi Hak Akses</span>
        </div>
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
