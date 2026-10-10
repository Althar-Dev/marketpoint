"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminXenditRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/xendit/config");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B]" />
      <p className="text-xs font-medium">Mengarahkan ke Konfigurasi Xendit...</p>
    </div>
  );
}