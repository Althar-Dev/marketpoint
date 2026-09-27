"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Zap, 
  ShieldCheck, 
  Info, 
  Smartphone, 
  Gamepad2, 
  CheckCircle2,
  Clock,
  Wallet,
  ArrowRight,
  User,
  History,
  HelpCircle,
  MoreHorizontal,
  ShoppingBag
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function TopUpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  
  const categorySlug = params.category as string;
  const brandSlug = params.brand as string;
  
  const [mounted, setMounted] = useState(false);
  const [customerID, setCustomerID] = useState("");
  const [zoneID, setZoneID] = useState("");
  const [selectedSKU, setSelectedSKU] = useState<any>(null);
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const db = useFirestore();
  const visualsRef = useMemoFirebase(() => doc(db, "settings", "digiflazz_visuals"), [db]);
  const { data: visuals } = useDoc(visualsRef);

  useEffect(() => {
    setMounted(true);
    if (brandSlug) {
      fetchBrandSKUs();
    }
  }, [brandSlug]);

  const fetchBrandSKUs = async () => {
    setLoading(true);
    try {
      // Find the proper brand name from slug (Reverse slugify)
      const res = await fetch("/api/admin/digiflazz/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Filter SKUs that match the brand slug
        const matched = data.data.filter((item: any) => {
          const itemBrandSlug = item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return itemBrandSlug === brandSlug && item.buyer_product_status && item.seller_product_status;
        });
        
        // Sort by price ascending
        setSkus(matched.sort((a: any, b: any) => (a.price || 0) - (b.price || 0)));
        if (matched.length > 0 && matched[0]) {
           setSelectedSKU(matched[0]);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil SKU brand:", err);
    } finally {
      setLoading(false);
    }
  };

  const brandInfo = useMemo(() => {
    if (skus.length === 0) return null;
    const first = skus[0];
    return {
      name: first.brand,
      category: first.category,
      type: first.cmd_type || "prepaid"
    };
  }, [skus]);

  const visual = useMemo(() => {
    if (!brandInfo?.name || !visuals?.brands) return null;
    return visuals.brands[brandInfo.name.toUpperCase()];
  }, [brandInfo, visuals]);

  const isGame = categorySlug.includes("game");
  const isPln = categorySlug.includes("pln");

  const handleOrder = () => {
    if (!customerID) {
      toast({ variant: "destructive", title: "ID Kosong", description: "Silakan masukkan ID Pelanggan atau Nomor HP terlebih dahulu." });
      return;
    }
    if (!selectedSKU) {
      toast({ variant: "destructive", title: "Produk Belum Dipilih", description: "Silakan pilih nominal top up terlebih dahulu." });
      return;
    }
    
    toast({
      title: "Memproses Pesanan...",
      description: `Menyiapkan pengisian ${selectedSKU.product_name} ke ${customerID}.`
    });
    
    // Redirect to checkout with params
    router.push(`/checkout?sku=${selectedSKU.buyer_sku_code}&target=${customerID}${zoneID ? `&zone=${zoneID}` : ""}`);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Header Mobile & Desktop */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-4 py-3 h-16 flex items-center shadow-xs">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-full hover:bg-muted">
               <ChevronLeft className="w-5 h-5" />
             </Button>
             <h1 className="text-sm font-bold tracking-tight text-[#212121]">Top Up {brandInfo?.name || "Layanan"}</h1>
           </div>
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                <History className="w-4.5 h-4.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
                <HelpCircle className="w-4.5 h-4.5" />
              </Button>
           </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-12 lg:px-20 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Brand Info & Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border border-[1.5px] shadow-sm rounded-3xl bg-white overflow-hidden">
            <div 
               className="h-40 sm:h-48 flex items-center justify-center p-8 relative overflow-hidden"
               style={{ background: visual?.bgGradient || "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" }}
            >
               {visual?.iconUrl ? (
                 <div className="relative w-32 h-32 z-10 transition-transform hover:scale-105 duration-500">
                    <Image src={visual.iconUrl} alt={brandInfo?.name || "Logo"} fill className="object-contain filter drop-shadow-lg" />
                 </div>
               ) : (
                 <Gamepad2 className="w-16 h-16 text-muted-foreground/20" />
               )}
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#000 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }} />
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-[#212121]">{brandInfo?.name}</h2>
                  <Badge variant="secondary" className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                    {brandInfo?.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Layanan pengisian otomatis 24 jam. Saldo masuk dalam hitungan detik setelah pembayaran terverifikasi.
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                       <CheckCircle2 className="w-4 h-4 text-[#00AA5B]" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-[#2E3137]">Instan 1 Detik</p>
                       <p className="text-[10px] text-muted-foreground font-medium">Proses otomatis oleh sistem</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                       <ShieldCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-[#2E3137]">Bergaransi 100%</p>
                       <p className="text-[10px] text-muted-foreground font-medium">Dana aman dengan asuransi MarketPoint</p>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines info */}
          <Card className="border-dashed border-border border-[1.5px] bg-[#00AA5B]/5 rounded-3xl p-5 space-y-3">
             <div className="flex items-center gap-2 text-[#00AA5B]">
               <Info className="w-4 h-4" />
               <h3 className="text-[11px] font-black uppercase tracking-wider">Langkah Top Up</h3>
             </div>
             <ol className="space-y-2 text-[10px] sm:text-[11px] font-medium text-muted-foreground leading-relaxed">
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center shrink-0 font-bold">1</span>
                  <span>Masukkan ID Akun / Nomor tujuan dengan benar.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center shrink-0 font-bold">2</span>
                  <span>Pilih nominal produk yang Anda inginkan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center shrink-0 font-bold">3</span>
                  <span>Selesaikan pembayaran & pesanan diproses otomatis.</span>
                </li>
             </ol>
          </Card>
        </div>

        {/* Right Column: Order Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Input Account ID */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 ml-1">
               <div className="w-6 h-6 rounded-full bg-[#212121] text-white flex items-center justify-center text-[11px] font-bold">1</div>
               <h3 className="text-sm font-black tracking-tight text-[#212121]">Masukkan Data Akun</h3>
             </div>
             
             <Card className="border-border border-[1.5px] shadow-sm rounded-3xl bg-white p-5 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                        {isGame ? "USER ID / ID GAME" : isPln ? "ID PELANGGAN / NO. METER" : "NOMOR HANDPHONE"}
                      </label>
                      <div className="relative">
                         <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                           <User className="w-4.5 h-4.5" />
                         </div>
                         <Input 
                            value={customerID}
                            onChange={(e) => setCustomerID(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder={isGame ? "Contoh: 12345678" : isPln ? "11 digit ID Pelanggan" : "08xxxxxxxx"} 
                            className="h-12 pl-11 rounded-2xl bg-muted/20 border-border font-bold text-sm focus:ring-4 focus:ring-[#00AA5B]/5 focus:border-[#00AA5B] transition-all"
                         />
                      </div>
                   </div>

                   {isGame && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ZONE ID / SERVER</label>
                        <div className="relative">
                           <Input 
                              value={zoneID}
                              onChange={(e) => setZoneID(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="ID Zone" 
                              className="h-12 rounded-2xl bg-muted/20 border-border font-bold text-sm focus:ring-4 focus:ring-[#00AA5B]/5 focus:border-[#00AA5B] transition-all"
                           />
                        </div>
                     </div>
                   )}
                </div>
                <p className="mt-4 text-[10px] text-muted-foreground flex items-start gap-1.5 leading-relaxed font-medium">
                   <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                   {isGame 
                     ? "Pastikan ID Akun dan Zone ID Anda sudah benar untuk menghindari kesalahan pengiriman top up."
                     : "Masukkan nomor handphone tujuan dengan format 08xxxx atau 628xxxx tanpa spasi."}
                </p>
             </Card>
          </section>

          {/* Step 2: Select Items */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 ml-1">
               <div className="w-6 h-6 rounded-full bg-[#212121] text-white flex items-center justify-center text-[11px] font-bold">2</div>
               <h3 className="text-sm font-black tracking-tight text-[#212121]">Pilih Nominal Top Up</h3>
             </div>

             {loading ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {skus.map((item: any) => {
                    const isSelected = selectedSKU?.buyer_sku_code === item.buyer_sku_code;
                    return (
                      <button
                        key={item.buyer_sku_code}
                        onClick={() => setSelectedSKU(item)}
                        className={cn(
                          "relative group flex flex-col justify-between p-4 rounded-2xl border-[1.5px] transition-all duration-300 text-left min-h-[96px] shadow-2xs hover:shadow-md",
                          isSelected 
                            ? "bg-[#00AA5B]/5 border-[#00AA5B] ring-1 ring-[#00AA5B]/20" 
                            : "bg-white border-border/80 hover:border-[#00AA5B]/40"
                        )}
                      >
                         <div className="space-y-0.5">
                           <h4 className={cn(
                             "text-[11px] sm:text-[12px] font-black leading-tight line-clamp-2",
                             isSelected ? "text-[#00AA5B]" : "text-[#2E3137]"
                           )}>
                             {item.product_name}
                           </h4>
                         </div>
                         <div className="flex flex-col gap-0.5 mt-2">
                           <span className={cn(
                             "text-[12px] sm:text-[13px] font-black",
                             isSelected ? "text-[#00AA5B]" : "text-foreground"
                           )}>
                             Rp {item.price.toLocaleString('id-ID')}
                           </span>
                         </div>
                         {isSelected && (
                           <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#00AA5B] text-white flex items-center justify-center shadow-md">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                           </div>
                         )}
                      </button>
                    );
                  })}
               </div>
             )}
          </section>
        </div>
      </div>

      {/* Sticky Checkout Bar Mobile & Desktop Footer Style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3 pb-safe">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
           <div className="flex-1 min-w-0">
              <div className="hidden sm:block">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">Total Pembayaran</p>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-black text-[#212121]">
                       Rp {selectedSKU ? selectedSKU.price.toLocaleString('id-ID') : "0"}
                    </span>
                 </div>
              </div>
              <div className="sm:hidden flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Total</span>
                <span className="text-base font-black text-[#00AA5B]">Rp {selectedSKU ? selectedSKU.price.toLocaleString('id-ID') : "0"}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex h-11 px-4 rounded-2xl text-muted-foreground hover:text-[#00AA5B] font-bold text-xs gap-2">
                 <ShoppingBag className="w-4.5 h-4.5" /> Keranjang
              </Button>
              <Button 
                onClick={handleOrder}
                className="h-11 md:h-12 px-8 sm:px-12 rounded-2xl bg-[#00AA5B] hover:bg-[#009650] text-white font-black text-xs sm:text-sm shadow-lg shadow-[#00AA5B]/20 transition-all active:scale-[0.98] gap-2"
              >
                Beli Sekarang <ArrowRight className="w-4 h-4 ml-1 hidden sm:inline" />
              </Button>
           </div>
        </div>
      </div>
    </main>
  );
}
