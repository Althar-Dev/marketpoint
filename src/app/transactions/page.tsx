"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TransactionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke profil atau beranda — halaman daftar transaksi ada di /profile
    router.replace("/profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#00AA5B] animate-spin mb-3" />
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Membuka Profil...
      </p>
    </div>
  );
}
