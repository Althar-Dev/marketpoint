"use client";

import React from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

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
      <div className="h-screen bg-white flex flex-col items-center justify-center font-body">
        <div className="relative flex flex-col items-center">
          <div className="mb-4">
             <img src="/assets/img/logo.png" alt="MarketPointID" className="h-10 w-auto object-contain animate-pulse" />
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
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden selection:bg-[#00AA5B]/10 selection:text-[#00AA5B]">
      {children}
    </div>
  );
}
