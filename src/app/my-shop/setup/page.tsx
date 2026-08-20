"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
  Phone,
  Loader2,
  Globe
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MerchantSetupPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // File Input Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  // URL States (Uploaded to R2)
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  
  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Handle slug auto-generation
  useEffect(() => {
    const generatedSlug = shopName
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
    setSlug(generatedSlug);
  }, [shopName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok && data.url) {
        if (type === 'logo') {
          setLogoUrl(data.url);
        } else {
          setBannerUrl(data.url);
        }
        
        toast({
          title: "Berhasil",
          description: `${type === 'logo' ? 'Logo' : 'Banner'} berhasil diunggah.`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: error.message || "Pastikan konfigurasi R2 sudah benar.",
      });
    } finally {
      if (e.target) e.target.value = '';
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleCreateShop = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const shopRef = doc(db, "shops", user.uid);
      const userRef = doc(db, "users", user.uid);

      await setDoc(shopRef, {
        name: shopName,
        slug: slug,
        whatsapp: whatsapp,
        location: {
          province,
          city,
          district,
          address,
          postalCode
        },
        logoUrl,
        bannerUrl,
        ownerId: user.uid,
        status: "ACTIVE",
        createdAt: serverTimestamp(),
      });

      await setDoc(userRef, {
        hasShop: true,
        shopSlug: slug
      }, { merge: true });

      toast({
        title: "Toko Berhasil Dibuka",
        description: "Selamat! Toko Anda kini sudah aktif di MarketPoint.",
      });
      
      setTimeout(() => {
        router.replace("/my-shop");
      }, 500);
      
    } catch (error: any) {
      console.error("Gagal Buka Toko:", error);
      toast({
        variant: "destructive",
        title: "Gagal Membuka Toko",
        description: "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-md mx-auto">
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Profil Toko</h1>
          <p className="text-xs text-muted-foreground">Lengkapi identitas dan lokasi toko Anda untuk mulai berjualan.</p>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="relative h-32 md:h-44 bg-muted/30 group">
                {bannerUrl ? (
                  <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={bannerInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner')}
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute bottom-4 right-4 rounded-full h-9 px-4 text-[11px] font-bold gap-2 shadow-lg z-20"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {uploadingBanner ? "Mengunggah..." : "Ganti Banner"}
                </Button>
              </div>
              <div className="px-6 pb-6 -mt-10 relative z-10">
                <div className="flex items-end gap-4">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden relative group">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-muted/20 flex items-center justify-center opacity-40">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-20"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {uploadingLogo ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </div>
                  <div className="pb-1">
                     <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Logo Toko</p>
                     <p className="text-[9px] text-muted-foreground">{uploadingLogo ? 'Sedang mengunggah...' : 'Klik untuk ubah logo'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <CheckCircle2 className="w-4 h-4 text-[#00AA5B]" />
                  <h3 className="text-[13px] font-black uppercase tracking-widest">Identitas Toko</h3>
                </div>
                
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Nama Toko</Label>
                    <Input 
                      placeholder="Contoh: Digital Solutions ID"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Slug Toko (URL)</Label>
                      <div className="relative">
                        <Input 
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm font-bold pl-10"
                        />
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      </div>
                      <p className="text-[9px] text-muted-foreground ml-1">marketpoint.id/<span className="font-bold text-primary">{slug || 'username'}</span></p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">WhatsApp Toko</Label>
                      <div className="relative">
                        <Input 
                          placeholder="08xxxxxxxx"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-sm font-bold pl-10"
                        />
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <MapPin className="w-4 h-4 text-[#00AA5B]" />
                  <h3 className="text-[13px] font-black uppercase tracking-widest">Lokasi Pengiriman</h3>
                </div>
                
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Provinsi</Label>
                      <Input 
                        placeholder="Jawa Barat"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Kota</Label>
                      <Input 
                        placeholder="Bandung"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Kecamatan</Label>
                      <Input 
                        placeholder="Cibiru"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Alamat Lengkap</Label>
                      <Textarea 
                        placeholder="Nama jalan, nomor rumah, RT/RW..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="min-h-[90px] rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Kode Pos</Label>
                      <Input 
                        placeholder="40614"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  disabled={!shopName || !slug || !whatsapp || !address || isSubmitting || uploadingLogo || uploadingBanner}
                  onClick={handleCreateShop}
                  className="w-full h-12 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-sm shadow-lg shadow-[#00AA5B]/20 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Sedang Menyimpan..." : "Simpan Perubahan Toko"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
