"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const MOCK_FLASH_SALES = [
  {
    id: "FS-101",
    name: "Promo Weekend Seru",
    startTime: "Sabtu, 10:00",
    endTime: "Sabtu, 12:00",
    products: 5,
    status: "ONGOING",
    engagement: "1.2k Klik"
  },
  {
    id: "FS-102",
    name: "Midnight Sale API",
    startTime: "Minggu, 00:00",
    endTime: "Minggu, 03:00",
    products: 12,
    status: "UPCOMING",
    engagement: "0 Klik"
  }
];

export default function MerchantFlashSalePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Flash Sale Toko</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Dongkrak trafik dan penjualan dengan penawaran waktu terbatas.</p>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md">
              <Icon icon="ph:lightning-bold" className="w-3.5 h-3.5" /> Daftar Flash Sale
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-none bg-[#00AA5B] text-white rounded-2xl p-6 relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Icon icon="ph:lightning-fill" className="w-32 h-32" />
           </div>
           <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                 <h3 className="text-lg font-black tracking-tight">Tingkatkan Penjualan Hingga 300%!</h3>
                 <p className="text-[11px] opacity-90 max-w-lg leading-relaxed">Flash Sale membantu produk Anda tampil di barisan depan beranda pembeli. Pastikan stok cukup sebelum memulai sesi.</p>
              </div>
              <Button variant="secondary" className="h-8 rounded-lg bg-white text-[#00AA5B] font-bold text-[10px] hover:bg-white/90">Pelajari Caranya</Button>
           </div>
        </Card>

        {/* Sessions List */}
        <div className="grid grid-cols-1 gap-4">
          <div className="px-1">
             <h3 className="text-xs font-black text-[#2E3137] uppercase tracking-widest">Sesi Kampanye</h3>
          </div>
          {MOCK_FLASH_SALES.map((fs) => (
            <Card key={fs.id} className="border-border border-[1.5px] shadow-sm rounded-2xl overflow-hidden bg-white hover:border-[#00AA5B]/30 transition-all">
               <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                     <div className={cn(
                       "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                       fs.status === 'ONGOING' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                     )}>
                        <Icon icon={fs.status === 'ONGOING' ? "ph:timer-bold" : "ph:calendar-bold"} className="w-6 h-6" />
                     </div>
                     <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                           <h4 className="text-sm font-black text-[#2E3137]">{fs.name}</h4>
                           <Badge className={cn(
                             "text-[8px] font-black px-1.5 py-0 rounded-md border-none",
                             fs.status === 'ONGOING' ? "bg-[#FF5E5E] text-white" : "bg-blue-500 text-white"
                           )}>
                              {fs.status}
                           </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">{fs.startTime} - {fs.endTime}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-10 md:px-10 border-x-0 md:border-x border-border/50">
                     <div className="text-center">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Produk</p>
                        <p className="text-sm font-black">{fs.products}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Trafik</p>
                        <p className="text-sm font-black">{fs.engagement}</p>
                     </div>
                  </div>

                  <div className="flex gap-2">
                     <Button variant="outline" className="h-9 px-5 rounded-xl text-[10px] font-black border-border">Atur Produk</Button>
                     <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Icon icon="ph:caret-right-bold" className="w-4 h-4" /></Button>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </main>
  );
}
