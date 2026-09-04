"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  MapPin, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Clock, 
  Loader2,
  Image as ImageIcon,
  Instagram,
  Facebook,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MerchantSettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState<{ type: 'logo' | 'banner' | null }>({ type: null });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Form states
  const [shopData, setShopData] = useState({
    name: "",
    slug: "",
    whatsapp: "",
    description: "",
    category: "digital-service",
    location: {
      province: "",
      city: "",
      district: "",
      address: "",
      postalCode: ""
    },
    socials: {
      instagram: "",
      facebook: ""
    },
    operational: {
      isAutoClose: false,
      schedule: [
        { day: "Senin", open: "08:00", close: "20:00", active: true },
        { day: "Selasa", open: "08:00", close: "20:00", active: true },
        { day: "Rabu", open: "08:00", close: "20:00", active: true },
        { day: "Kamis", open: "08:00", close: "20:00", active: true },
        { day: "Jumat", open: "08:00", close: "20:00", active: true },
        { day: "Sabtu", open: "09:00", close: "17:00", active: true },
        { day: "Minggu", open: "00:00", close: "00:00", active: false },
      ]
    },
    logoUrl: "",
    bannerUrl: ""
  });

  useEffect(() => {
    setMounted(true);
    if (shop) {
      setShopData({
        name: shop.name || "",
        slug: shop.slug || "",
        whatsapp: shop.whatsapp || "",
        description: shop.description || "",
        category: shop.category || "digital-service",
        location: {
          province: shop.location?.province || "",
          city: shop.location?.city || "",
          district: shop.location?.district || "",
          address: shop.location?.address || "",
          postalCode: shop.location?.postalCode || ""
        },
        socials: {
          instagram: shop.socials?.instagram || "",
          facebook: shop.socials?.facebook || ""
        },
        operational: shop.operational || shopData.operational,
        logoUrl: shop.logoUrl || "",
        bannerUrl: shop.bannerUrl || ""
      });
    }
  }, [shop]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ type });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok && data.url) {
        if (type === 'logo') setShopData(prev => ({ ...prev, logoUrl: data.url }));
        else setShopData(prev => ({ ...prev, bannerUrl: data.url }));
        
        toast({ title: "Berhasil", description: "Gambar berhasil diperbarui." });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Mengunggah", description: error.message });
    } finally {
      setUploading({ type: null });
      if (e.target) e.target.value = '';
    }
  };

  const handleUpdateShop = async () => {
    if (!user || !shopRef) return;
    setIsSubmitting(true);
    try {
      await updateDoc(shopRef, {
        ...shopData,
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
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola identitas, alamat, dan operasional bisnis Anda.</p>
          </div>
          <Button 
            onClick={handleUpdateShop} 
            disabled={isSubmitting}
            className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-[11px] gap-2 shadow-md shadow-[#00AA5B]/10"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Simpan Perubahan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Visual Identity Section */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <div className="relative h-28 bg-muted/30 group">
                {shopData.bannerUrl ? (
                  <Image src={shopData.bannerUrl} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploading.type === 'banner' ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </div>
              <CardContent className="p-5 pt-0 -mt-8 relative z-10">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-20 w-20 rounded-2xl bg-white border-[1.5px] border-border shadow-md overflow-hidden relative group">
                    {shopData.logoUrl ? (
                      <Image src={shopData.logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white uppercase">{shopData.name.substring(0, 1)}</span>
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {uploading.type === 'logo' ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2E3137]">{shopData.name}</h3>
                    <p className="text-[10px] text-[#00AA5B] font-bold">@{shopData.slug}</p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Tipe Toko</span>
                    <span className="text-[11px] font-black text-[#8B5CF6]">Official Store</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">Verifikasi</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
                      <span className="text-[11px] font-black text-[#00AA5B]">Terverifikasi</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-[#00AA5B]/5 p-4">
               <div className="flex items-start gap-3">
                 <AlertCircle className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-[#00AA5B] uppercase tracking-wider">Tips Branding</p>
                   <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">Gunakan logo dengan latar belakang transparan dan banner berukuran 1300x500px untuk hasil terbaik.</p>
                 </div>
               </div>
            </Card>
          </div>

          {/* Forms Section */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="profil" className="w-full">
              <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
                <TabsList className="w-full justify-start h-12 bg-[#F8FAFC] border-b border-border rounded-none px-4 gap-6">
                  <TabsTrigger value="profil" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px]">Profil Toko</TabsTrigger>
                  <TabsTrigger value="alamat" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px]">Alamat & Lokasi</TabsTrigger>
                  <TabsTrigger value="operasional" className="px-0 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px]">Operasional</TabsTrigger>
                </TabsList>

                <TabsContent value="profil" className="p-6 mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nama Toko</Label>
                      <Input value={shopData.name} onChange={(e) => setShopData({...shopData, name: e.target.value})} className="h-10 rounded-xl text-[12px] font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">WhatsApp Toko</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input value={shopData.whatsapp} onChange={(e) => setShopData({...shopData, whatsapp: e.target.value})} className="h-10 pl-9 rounded-xl text-[12px] font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Kategori Utama</Label>
                      <Select value={shopData.category} onValueChange={(val) => setShopData({...shopData, category: val})}>
                        <SelectTrigger className="h-10 rounded-xl text-[12px] font-bold">
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="digital-service" className="text-xs">Layanan Digital & API</SelectItem>
                          <SelectItem value="software" className="text-xs">Software & Script</SelectItem>
                          <SelectItem value="creative" className="text-xs">Desain Kreatif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">URL Toko</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input value={`marketpoint.id/${shopData.slug}`} disabled className="h-10 pl-9 rounded-xl bg-muted/30 text-[11px] font-medium italic" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Deskripsi Toko</Label>
                    <Textarea value={shopData.description} onChange={(e) => setShopData({...shopData, description: e.target.value})} placeholder="Ceritakan keunggulan toko Anda..." className="min-h-[100px] rounded-xl text-[11px] resize-none" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <h4 className="text-[10px] font-black text-[#2E3137] uppercase tracking-widest">Media Sosial</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="relative">
                         <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                         <Input placeholder="Username Instagram" value={shopData.socials.instagram} onChange={(e) => setShopData({...shopData, socials: {...shopData.socials, instagram: e.target.value}})} className="h-9 pl-9 rounded-xl text-[11px]" />
                       </div>
                       <div className="relative">
                         <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                         <Input placeholder="Username Facebook" value={shopData.socials.facebook} onChange={(e) => setShopData({...shopData, socials: {...shopData.socials, facebook: e.target.value}})} className="h-9 pl-9 rounded-xl text-[11px]" />
                       </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="alamat" className="p-6 mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Provinsi</Label>
                      <Input value={shopData.location.province} onChange={(e) => setShopData({...shopData, location: {...shopData.location, province: e.target.value}})} className="h-10 rounded-xl text-[11px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Kota / Kabupaten</Label>
                      <Input value={shopData.location.city} onChange={(e) => setShopData({...shopData, location: {...shopData.location, city: e.target.value}})} className="h-10 rounded-xl text-[11px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Kecamatan</Label>
                      <Input value={shopData.location.district} onChange={(e) => setShopData({...shopData, location: {...shopData.location, district: e.target.value}})} className="h-10 rounded-xl text-[11px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Kode Pos</Label>
                      <Input value={shopData.location.postalCode} onChange={(e) => setShopData({...shopData, location: {...shopData.location, postalCode: e.target.value}})} className="h-10 rounded-xl text-[11px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Alamat Lengkap (Patokan)</Label>
                    <Textarea value={shopData.location.address} onChange={(e) => setShopData({...shopData, location: {...shopData.location, address: e.target.value}})} className="min-h-[80px] rounded-xl text-[11px] resize-none" />
                  </div>
                </TabsContent>

                <TabsContent value="operasional" className="p-6 mt-0 space-y-6">
                   <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFC400]/5 border border-[#FFC400]/20">
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 rounded-xl bg-white border border-[#FFC400]/20 flex items-center justify-center">
                            <Clock className="w-4.5 h-4.5 text-[#FFC400]" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[11px] font-black text-[#2E3137]">Tutup Toko Otomatis</p>
                            <p className="text-[9px] text-muted-foreground font-medium">Nonaktifkan pesanan otomatis di luar jam operasional.</p>
                         </div>
                      </div>
                      <Switch 
                        checked={shopData.operational.isAutoClose} 
                        onCheckedChange={(val) => setShopData({...shopData, operational: {...shopData.operational, isAutoClose: val}})}
                      />
                   </div>

                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-[#2E3137] uppercase tracking-widest ml-1">Jadwal Mingguan</h4>
                      <div className="space-y-1">
                         {shopData.operational.schedule.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
                               <div className="flex items-center gap-4 w-24">
                                  <Switch 
                                    checked={item.active} 
                                    onCheckedChange={(val) => {
                                      const newSched = [...shopData.operational.schedule];
                                      newSched[idx].active = val;
                                      setShopData({...shopData, operational: {...shopData.operational, schedule: newSched}});
                                    }}
                                  />
                                  <span className={cn("text-[11px] font-bold", item.active ? "text-[#2E3137]" : "text-muted-foreground opacity-50")}>{item.day}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Input 
                                    type="time" 
                                    value={item.open} 
                                    disabled={!item.active}
                                    onChange={(e) => {
                                      const newSched = [...shopData.operational.schedule];
                                      newSched[idx].open = e.target.value;
                                      setShopData({...shopData, operational: {...shopData.operational, schedule: newSched}});
                                    }}
                                    className="h-8 w-24 rounded-lg text-[10px] font-black" 
                                  />
                                  <span className="text-[10px] text-muted-foreground font-bold">-</span>
                                  <Input 
                                    type="time" 
                                    value={item.close} 
                                    disabled={!item.active}
                                    onChange={(e) => {
                                      const newSched = [...shopData.operational.schedule];
                                      newSched[idx].close = e.target.value;
                                      setShopData({...shopData, operational: {...shopData.operational, schedule: newSched}});
                                    }}
                                    className="h-8 w-24 rounded-lg text-[10px] font-black" 
                                  />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </TabsContent>
              </Card>
            </Tabs>
          </div>
        </div>

      </div>
    </main>
  );
}
