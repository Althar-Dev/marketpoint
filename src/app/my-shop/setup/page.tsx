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
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
  Phone,
  Loader2,
  Globe
} from "lucide-react";
import Image from "next/image";

export default function MerchantSetupPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
          description: "Gambar berhasil diunggah.",
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengunggah",
        description: error.message || "Gagal mengunggah gambar.",
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
        title: "Toko berhasil dibuka",
        description: "Selamat! Toko Anda kini sudah aktif.",
      });
      
      setTimeout(() => {
        router.replace("/my-shop");
      }, 500);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal membuka toko",
        description: "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading) return null;

  return (
    <div className="p-3 md:p-6 lg:p-8">
      <div className="max-w-screen-md mx-auto">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Pengaturan profil toko</h1>
          <p className="text-[11px] text-muted-foreground">Lengkapi identitas dan lokasi toko untuk mulai berjualan.</p>
        </div>

        <div className="space-y-5">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="relative h-28 md:h-36 bg-muted/30 group">
                {bannerUrl ? (
                  <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <ImageIcon className="w-7 h-7" />
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
                  className="absolute bottom-3 right-3 rounded-lg h-7 px-3 text-[10px] font-bold gap-1.5 shadow-md z-20"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {uploadingBanner ? "Mengunggah..." : "Ganti banner"}
                </Button>
              </div>
              <div className="px-4 pb-4 -mt-8 relative z-10">
                <div className="flex items-end gap-3">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden relative group">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-muted/10 flex items-center justify-center opacity-20">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-20"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {uploadingLogo ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </div>
                  <div className="pb-0.5">
                     <p className="text-[10px] font-bold text-foreground tracking-wide">Logo toko</p>
                     <p className="text-[8px] text-muted-foreground">{uploadingLogo ? 'Sedang mengunggah...' : 'Klik untuk ubah logo'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="p-5 md:p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" />
                  <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground/80">Identitas toko</h3>
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Nama toko</Label>
                    <Input 
                      placeholder="Contoh: Digital Solutions ID"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Slug toko (url)</Label>
                      <div className="relative">
                        <Input 
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold pl-9"
                        />
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      </div>
                      <p className="text-[8px] text-muted-foreground ml-0.5">marketpoint.id/<span className="font-bold text-primary">{slug || 'username'}</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Nomor whatsapp</Label>
                      <div className="relative">
                        <Input 
                          placeholder="08xxxxxxxx"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold pl-9"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                  <MapPin className="w-3.5 h-3.5 text-[#00AA5B]" />
                  <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground/80">Lokasi pengiriman</h3>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Provinsi</Label>
                      <Input 
                        placeholder="Jawa Barat"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Kota</Label>
                      <Input 
                        placeholder="Bandung"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Kecamatan</Label>
                      <Input 
                        placeholder="Cibiru"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Alamat lengkap</Label>
                      <Textarea 
                        placeholder="Nama jalan, nomor rumah, RT/RW..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="min-h-[70px] rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px] resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5">Kode pos</Label>
                      <Input 
                        placeholder="40614"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-9 rounded-lg bg-muted/10 border-transparent focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  disabled={!shopName || !slug || !whatsapp || !address || isSubmitting || uploadingLogo || uploadingBanner}
                  onClick={handleCreateShop}
                  className="w-full h-10 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Sedang menyimpan..." : "Simpan profil toko"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
