"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Camera, 
  MapPin, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MerchantSettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for file uploads
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Form states
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({
    city: "",
    province: "",
    address: ""
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    setMounted(true);
    if (shop) {
      setShopName(shop.name || "");
      setSlug(shop.slug || "");
      setWhatsapp(shop.whatsapp || "");
      setDescription(shop.description || "");
      setLocation({
        city: shop.location?.city || "",
        province: shop.location?.province || "",
        address: shop.location?.address || ""
      });
      setLogoUrl(shop.logoUrl || "");
      setBannerUrl(shop.bannerUrl || "");
    }
  }, [shop]);

  const handleUpdateShop = async () => {
    if (!user || !shopRef) return;
    setIsSubmitting(true);
    try {
      await updateDoc(shopRef, {
        name: shopName,
        whatsapp: whatsapp,
        description: description,
        location: location,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Berhasil Diperbarui",
        description: "Informasi toko Anda telah berhasil disimpan.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl" />
          <Skeleton className="lg:col-span-8 h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-screen-xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Pengaturan Toko</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola identitas, alamat, dan preferensi operasional toko Anda.</p>
          </div>
          <Button 
            onClick={handleUpdateShop} 
            disabled={isSubmitting}
            className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Identity */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="relative h-28 bg-muted/30">
                {bannerUrl ? (
                  <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <Button variant="secondary" size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-lg bg-white/80 backdrop-blur shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-foreground" />
                </Button>
              </div>
              <CardContent className="p-5 pt-0 -mt-8 relative z-10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-20 w-20 rounded-2xl bg-white border-[1.5px] border-border shadow-md overflow-hidden relative group">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white uppercase">{shopName.substring(0, 1)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2E3137]">{shopName}</h3>
                    <p className="text-[10px] text-[#00AA5B] font-bold">@{slug}</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Status Toko</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#00AA5B] animate-pulse"></div>
                      <span className="text-[11px] font-black text-[#2E3137]">Aktif</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Tipe Mitra</span>
                    <span className="text-[11px] font-black text-[#8B5CF6]">Official Store</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B]/5 p-4 flex items-start gap-3">
               <ShieldCheck className="w-5 h-5 text-[#00AA5B] shrink-0" />
               <div className="space-y-1">
                 <p className="text-[11px] font-black text-[#00AA5B] uppercase tracking-wide">Keamanan Akun</p>
                 <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Informasi identitas toko Anda dilindungi oleh enkripsi standar industri.</p>
               </div>
            </Card>
          </div>

          {/* Right Column: Detailed Forms */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="profil" className="w-full">
              <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
                <TabsList className="w-full justify-start h-12 bg-[#F8FAFC] border-b border-border rounded-none px-4 gap-6">
                  <TabsTrigger value="profil" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] text-muted-foreground">Profil Toko</TabsTrigger>
                  <TabsTrigger value="alamat" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] text-muted-foreground">Alamat & Lokasi</TabsTrigger>
                  <TabsTrigger value="operasional" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] text-muted-foreground">Operasional</TabsTrigger>
                </TabsList>

                <TabsContent value="profil" className="p-6 mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nama Toko</Label>
                      <Input 
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="h-10 rounded-xl border-border bg-[#F8FAFC]/50 font-bold text-[12px] focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nomor WhatsApp Toko</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input 
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="h-10 pl-9 rounded-xl border-border bg-[#F8FAFC]/50 font-bold text-[12px] focus:border-[#00AA5B] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Slogan / Deskripsi Singkat</Label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contoh: Solusi API & Infrastruktur Digital Terbaik"
                      className="min-h-[100px] rounded-xl border-border bg-[#F8FAFC]/50 font-medium text-[11px] resize-none focus:border-[#00AA5B] transition-all"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white border border-border flex items-center justify-center">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[#2E3137]">URL Toko Kustom</p>
                        <p className="text-[10px] text-muted-foreground">marketpoint.id/{slug}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black text-[#00AA5B] hover:bg-transparent">Ubah URL</Button>
                  </div>
                </TabsContent>

                <TabsContent value="alamat" className="p-6 mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Provinsi</Label>
                      <Input 
                        value={location.province}
                        onChange={(e) => setLocation({...location, province: e.target.value})}
                        className="h-10 rounded-xl border-border bg-[#F8FAFC]/50 font-bold text-[11px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Kota / Kabupaten</Label>
                      <Input 
                        value={location.city}
                        onChange={(e) => setLocation({...location, city: e.target.value})}
                        className="h-10 rounded-xl border-border bg-[#F8FAFC]/50 font-bold text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Alamat Lengkap</Label>
                    <Textarea 
                      value={location.address}
                      onChange={(e) => setLocation({...location, address: e.target.value})}
                      className="min-h-[80px] rounded-xl border-border bg-[#F8FAFC]/50 font-medium text-[11px] resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="operasional" className="p-8 mt-0 text-center space-y-4">
                   <div className="w-16 h-16 bg-[#FFC400]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-8 h-8 text-[#FFC400]" />
                   </div>
                   <h3 className="text-sm font-black text-[#2E3137]">Jadwal Operasional Toko</h3>
                   <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                     Fitur pengaturan jam buka-tutup otomatis dan pesan balasan instan sedang dalam tahap pengembangan teknis.
                   </p>
                </TabsContent>
              </Card>
            </Tabs>
          </div>
        </div>

      </div>
    </main>
  );
}
