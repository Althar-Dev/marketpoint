"use client";

import React from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Loader2, ShieldCheck } from "lucide-react";

export default function EmailAppLayout({
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
        router.push("/login?redirect=/email");
      } else if (userData && userData.admin !== true) {
        router.push("/");
      }
    }
  }, [user, userData, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-body">
        <div className="relative flex flex-col items-center">
          <div className="mb-4">
             <img src="/assets/img/logo.png" alt="MarketPoint" className="h-10 w-auto object-contain animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-700">
             <Loader2 className="w-4 h-4 animate-spin text-[#00AA5B]" />
             <span className="text-xs font-bold uppercase tracking-widest">Menyiapkan Webmail...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || userData?.admin !== true) return null;

  return (
    <div className="min-h-screen w-full bg-white flex flex-col overflow-hidden selection:bg-[#00AA5B]/10 selection:text-[#00AA5B]">
      {/* Global Email App Header */}
      <header className="h-14 border-b border-border bg-white px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/assets/img/logo.png" alt="Logo" className="h-7 w-auto transition-transform group-hover:scale-105" />
            <div className="h-4 w-px bg-border mx-1" />
            <span className="text-xs font-black tracking-tight text-foreground uppercase">Mail Service</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
            <ShieldCheck className="w-3 h-3 text-[#00AA5B]" />
            <span className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wide">Admin Verified</span>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground">
            <Link href="/admin">Dashboard Admin</Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
