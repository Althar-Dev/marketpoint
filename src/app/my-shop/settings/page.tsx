"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
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
  AlertCircle,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Mail,
  Send,
  Youtube,
  Twitter,
  Headphones,
  Sparkles,
  FileText,
  Store,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMerchantShop } from "@/context/merchant-context";

export default function MerchantSettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState<{ type: 'logo' | 'banner' | null }>({ type: null });

  const {
    shopId,
    isOwner,
    isStaff,
    staffRole,
    loading: merchantLoading
  } = useMerchantShop();

  const activeShopId = shopId || user?.uid;

  // Slug checking states
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const shopRef = useMemoFirebase(() => {
    if (!activeShopId) return null;
    return doc(db, "shops", activeShopId);
  }, [db, activeShopId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Form states
  const [shopData, setShopData] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    warrantyPolicy: "",
    whatsapp: "",
    email: "",
    website: "",
    location: {
      province: "",
      city: "",
      district: "",
      address: "",
      postalCode: ""
    },
    socials: {
      instagram: "",
      facebook: "",
      tiktok: "",
      youtube: "",
      telegram: "",
      twitter: ""
    },
    operational: {
      isAutoClose: false,
      supportNote: "",
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
        tagline: shop.tagline || "",
        description: shop.description || "",
        warrantyPolicy: shop.warrantyPolicy || "",
        whatsapp: shop.whatsapp || "",
        email: shop.email || "",
        website: shop.website || "",
        location: {
          province: shop.location?.province || "",
          city: shop.location?.city || "",
          district: shop.location?.district || "",
          address: shop.location?.address || "",
          postalCode: shop.location?.postalCode || ""
        },
        socials: {
          instagram: shop.socials?.instagram || "",
          facebook: shop.socials?.facebook || "",
          tiktok: shop.socials?.tiktok || "",
          youtube: shop.socials?.youtube || "",
          telegram: shop.socials?.telegram || "",
          twitter: shop.socials?.twitter || ""
        },
        operational: {
          isAutoClose: shop.operational?.isAutoClose ?? false,
          supportNote: shop.operational?.supportNote || "",
          schedule: shop.operational?.schedule && Array.isArray(shop.operational.schedule) && shop.operational.schedule.length > 0
            ? shop.operational.schedule
            : [
              { day: "Senin", open: "08:00", close: "20:00", active: true },
              { day: "Selasa", open: "08:00", close: "20:00", active: true },
              { day: "Rabu", open: "08:00", close: "20:00", active: true },
              { day: "Kamis", open: "08:00", close: "20:00", active: true },
              { day: "Jumat", open: "08:00", close: "20:00", active: true },
              { day: "Sabtu", open: "09:00", close: "17:00", active: true },
              { day: "Minggu", open: "00:00", close: "00:00", active: false },
            ]
        },
        logoUrl: shop.logoUrl || "",
        bannerUrl: shop.bannerUrl || ""
      });
    }
  }, [shop]);

  // Debounced Slug Check
  useEffect(() => {
    if (!mounted || !shopData.slug) {
      setIsSlugAvailable(null);
      return;
    }

    // Don't check if it's the current slug
    if (shopData.slug === shop?.slug) {
      setIsSlugAvailable(true);
      return;
    }

    const checkSlug = async () => {
      setIsCheckingSlug(true);
      try {
        const q = query(collection(db, "shops"), where("slug", "==", shopData.slug));
        const querySnapshot = await getDocs(q);
        setIsSlugAvailable(querySnapshot.empty);
      } catch (error) {
        console.error("Error checking slug:", error);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timeoutId = setTimeout(checkSlug, 600);
    return () => clearTimeout(timeoutId);
  }, [shopData.slug, shop?.slug, db, mounted]);

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
    if (!user || !shopRef || isSlugAvailable === false) return;
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
        description: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setShopData({ ...shopData, slug: val });
  };

  // Quick schedule presets
  const handleSetAll24Hours = () => {
    const newSched = shopData.operational.schedule.map(item => ({
      ...item,
      active: true,
      open: "00:00",
      close: "23:59"
    }));
    setShopData(prev => ({
      ...prev,
      operational: { ...prev.operational, schedule: newSched }
    }));
    toast({ title: "Jadwal Diperbarui", description: "Semua hari diatur buka 24 jam nonstop." });
  };

  const handleSetStandardHours = () => {
    const newSched = shopData.operational.schedule.map(item => ({
      ...item,
      active: item.day !== "Minggu",
      open: "08:00",
      close: "20:00"
    }));
    setShopData(prev => ({
      ...prev,
      operational: { ...prev.operational, schedule: newSched }
    }));
    toast({ title: "Jadwal Diperbarui", description: "Senin - Sabtu (08:00 - 20:00), Minggu libur." });
  };

  const handleSetWeekdaysOnly = () => {
    const newSched = shopData.operational.schedule.map(item => ({
      ...item,
      active: item.day !== "Sabtu" && item.day !== "Minggu",
      open: "09:00",
      close: "17:00"
    }));
    setShopData(prev => ({
      ...prev,
      operational: { ...prev.operational, schedule: newSched }
    }));
    toast({ title: "Jadwal Diperbarui", description: "Senin - Jumat (09:00 - 17:00), akhir pekan libur." });
  };

  if (!mounted || authLoading || shopLoading || merchantLoading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-[300px] rounded-2xl" />
          <Skeleton className="lg:col-span-8 h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Permission guard: Only Owner & Co-Owner can change shop settings
  if (isStaff && staffRole !== "CO_OWNER") {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full border border-border shadow-md rounded-2xl p-6 text-center space-y-4 bg-white">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Akses Pengaturan Dibatasi</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Halaman <b>Pengaturan Toko</b> hanya dapat diakses oleh <b>Pemilik Toko</b> dan <b>Co-Owner</b>.
            </p>
          </div>
          <Button asChild className="w-full bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-bold h-9 shadow-sm">
            <Link href="/my-shop">Kembali ke Dashboard Toko</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-6 lg:p-8 bg-[#F8FAFC] pb-24 sm:pb-8">
      <div className="max-w-screen-xl mx-auto space-y-4 sm:space-y-6">

        {/* Top Header Bar (Responsive Column on Mobile, Row on Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#212121]">Pengaturan Toko</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
              Kelola profil, deskripsi, jam operasional, kontak media sosial, dan alamat toko Anda.
            </p>
          </div>
          <Button
            onClick={handleUpdateShop}
            disabled={isSubmitting || isCheckingSlug || isSlugAvailable === false}
            className="h-9 px-5 sm:px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-black text-white text-xs sm:text-[11px] gap-2 shadow-sm shadow-[#00AA5B]/10 disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0 w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Simpan Perubahan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">

          {/* Visual Identity Section */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:sticky lg:top-24">
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              {/* Banner Area */}
              <div className="relative h-28 bg-muted/30 group">
                {shopData.bannerUrl ? (
                  <Image src={shopData.bannerUrl} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                {/* Desktop Hover Overlay */}
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center cursor-pointer"
                  onClick={() => bannerInputRef.current?.click()}
                  title="Ganti Banner Toko"
                >
                  {uploading.type === 'banner' ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
                {/* Mobile Touch Button for Banner */}
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="sm:hidden absolute top-2 right-2 bg-black/60 active:bg-black/80 text-white rounded-lg px-2 py-1 text-[10px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <Camera className="w-3 h-3" />
                  <span>{uploading.type === 'banner' ? "Mengunggah..." : "Ganti Banner"}</span>
                </button>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
              </div>

              {/* Card Avatar & Detail */}
              <CardContent className="p-4 sm:p-5 pt-0 -mt-8 relative z-10">
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-white border-2 border-border shadow-md overflow-hidden relative group">
                    {shopData.logoUrl ? (
                      <Image src={shopData.logoUrl} alt="Logo" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00AA5B] flex items-center justify-center">
                        <span className="text-2xl font-bold text-white uppercase">{shopData.name.substring(0, 1) || "T"}</span>
                      </div>
                    )}
                    {/* Desktop Hover Overlay */}
                    <div
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center cursor-pointer"
                      onClick={() => logoInputRef.current?.click()}
                      title="Ganti Logo Toko"
                    >
                      {uploading.type === 'logo' ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    </div>
                    {/* Mobile Touch Indicator */}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="sm:hidden absolute bottom-1 right-1 bg-[#00AA5B] text-white rounded-md p-1 shadow-sm"
                      title="Ganti Logo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-[#2E3137] truncate max-w-[200px]">{shopData.name || "Nama Toko"}</h3>
                    <p className="text-[10px] text-[#00AA5B] font-bold">@{shopData.slug || "slug"}</p>
                    {shopData.tagline && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic font-medium">
                        "{shopData.tagline}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Tautan Toko</span>
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-[10px] font-bold text-[#00AA5B] hover:text-[#00AA5B]">
                    <Link href={`/${shopData.slug || shop?.slug || ''}`} target="_blank">
                      Lihat Toko <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Branding Tip Card (Compact on mobile) */}
            <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-emerald-50/50 p-3.5 sm:p-4 border-emerald-100">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#00AA5B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-[#00AA5B] uppercase tracking-wider">Tips Banner & Logo</p>
                  <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                    Logo minimal <b>300x300px</b> dan banner ideal <b>1920x737px</b> agar tajam di desktop & HP.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Forms Section */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="profil" className="w-full">
              <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
                {/* Scrollable Tabs Header Bar */}
                <TabsList className="w-full justify-start h-12 bg-[#F8FAFC] border-b border-border rounded-none px-3 sm:px-4 gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="profil" className="px-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] whitespace-nowrap shrink-0">
                    Profil & Deskripsi
                  </TabsTrigger>
                  <TabsTrigger value="operasional" className="px-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] whitespace-nowrap shrink-0">
                    Jam Operasional & Support
                  </TabsTrigger>
                  <TabsTrigger value="kontak" className="px-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] whitespace-nowrap shrink-0">
                    Kontak & Media Sosial
                  </TabsTrigger>
                  <TabsTrigger value="alamat" className="px-2 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[11px] whitespace-nowrap shrink-0">
                    Alamat & Lokasi
                  </TabsTrigger>
                </TabsList>

                {/* ========================================================================= */}
                {/* TAB 1: PROFIL & DESKRIPSI                                                */}
                {/* ========================================================================= */}
                <TabsContent value="profil" className="p-4 sm:p-6 mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Nama Toko
                      </Label>
                      <Input
                        value={shopData.name}
                        onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                        placeholder="Contoh: Digital Prima Store"
                        className="h-10 rounded-xl text-[12px] font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Slogan / Tagline Toko
                      </Label>
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={shopData.tagline}
                          onChange={(e) => setShopData({ ...shopData, tagline: e.target.value })}
                          placeholder="Contoh: Lisensi Resmi 100% & Aktivasi Instan 24 Jam"
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slug input */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Slug Toko (URL Halaman)
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        value={shopData.slug}
                        onChange={handleSlugChange}
                        placeholder="nama-toko"
                        className={cn(
                          "h-10 pl-9 rounded-xl text-[12px] font-bold transition-all",
                          isSlugAvailable === true && shopData.slug !== shop?.slug && "border-green-500 focus:ring-green-500/20",
                          isSlugAvailable === false && "border-red-500 focus:ring-red-500/20"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isCheckingSlug && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
                        {isSlugAvailable === true && shopData.slug !== shop?.slug && !isCheckingSlug && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                        {isSlugAvailable === false && !isCheckingSlug && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between min-h-[14px] flex-wrap gap-1">
                      <p className="text-[9px] text-muted-foreground ml-1 break-all">
                        Tautan Halaman: <span className="font-semibold text-slate-700">marketpoint.id/{shopData.slug || '...'}</span>
                      </p>
                      {isSlugAvailable === false && !isCheckingSlug && (
                        <p className="text-[9px] font-bold text-red-500">Slug sudah digunakan.</p>
                      )}
                      {isSlugAvailable === true && shopData.slug !== shop?.slug && !isCheckingSlug && (
                        <p className="text-[9px] font-bold text-green-500">Slug tersedia!</p>
                      )}
                    </div>
                  </div>

                  {/* Complete Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Deskripsi Lengkap Toko
                      </Label>
                      <span className="text-[9px] text-muted-foreground hidden sm:inline">Ditampilkan di tab "Tentang Toko"</span>
                    </div>
                    <Textarea
                      value={shopData.description}
                      onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                      placeholder="Ceritakan spesialisasi toko Anda, keaslian lisensi produk, jam respon pelayanan, dan keuntungan berbelanja di toko Anda..."
                      className="min-h-[110px] rounded-xl text-[12px] leading-relaxed resize-y"
                    />
                  </div>

                  {/* Warranty & Store Policy */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
                        Kebijakan & Ketentuan Garansi Toko (Opsional)
                      </Label>
                      <span className="text-[9px] text-muted-foreground hidden sm:inline">Tampil di Tentang Toko</span>
                    </div>
                    <Textarea
                      value={shopData.warrantyPolicy}
                      onChange={(e) => setShopData({ ...shopData, warrantyPolicy: e.target.value })}
                      placeholder="Contoh: Garansi replace baru 30 hari jika lisensi mengalami kendala. Panduan instalasi didampingi tim hingga berhasil. Refund berlaku bila kode tidak dapat diaktivasi."
                      className="min-h-[85px] rounded-xl text-[12px] leading-relaxed resize-y"
                    />
                  </div>
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 2: JAM OPERASIONAL & SUPPORT                                         */}
                {/* ========================================================================= */}
                <TabsContent value="operasional" className="p-4 sm:p-6 mt-0 space-y-5">
                  {/* Auto Close Setting */}
                  <div className="flex items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Clock className="w-4.5 h-4.5 text-amber-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-[#2E3137]">Tutup Toko Otomatis</p>
                        <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
                          Nonaktifkan pesanan secara otomatis di luar jadwal operasional.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={shopData.operational.isAutoClose}
                      onCheckedChange={(val) =>
                        setShopData({
                          ...shopData,
                          operational: { ...shopData.operational, isAutoClose: val }
                        })
                      }
                      className="shrink-0 mt-0.5 sm:mt-0"
                    />
                  </div>

                  {/* Support Response Note */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-[#00AA5B]" />
                        Catatan Layanan Dukungan & Jam Respon Chat
                      </Label>
                    </div>
                    <Textarea
                      value={shopData.operational.supportNote}
                      onChange={(e) =>
                        setShopData({
                          ...shopData,
                          operational: { ...shopData.operational, supportNote: e.target.value }
                        })
                      }
                      placeholder="Contoh: Pengiriman pesanan instan 24 jam. Layanan chat aktif setiap hari pukul 08:00 - 22:00 WIB (Respon < 10 menit)."
                      className="min-h-[80px] rounded-xl text-[12px] leading-relaxed resize-y"
                    />
                  </div>

                  {/* Weekly Schedule Section (Fully Responsive on Mobile) */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <h4 className="text-[10px] font-black text-[#2E3137] uppercase tracking-widest ml-1">
                          Jadwal Mingguan Toko
                        </h4>
                        <p className="text-[9px] text-muted-foreground ml-1">
                          Atur hari aktif dan jam operasional toko Anda.
                        </p>
                      </div>

                      {/* Quick preset buttons (Horizontal scrollable on mobile) */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSetAll24Hours}
                          className="h-7 text-[10px] font-bold rounded-lg border-emerald-200 text-[#00AA5B] hover:bg-emerald-50 cursor-pointer shrink-0"
                        >
                          Buka 24 Jam
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSetStandardHours}
                          className="h-7 text-[10px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                        >
                          Senin-Sabtu (08-20)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSetWeekdaysOnly}
                          className="h-7 text-[10px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                        >
                          Senin-Jumat (09-17)
                        </Button>
                      </div>
                    </div>

                    {/* Responsive Day Rows */}
                    <div className="space-y-2 pt-1">
                      {shopData.operational.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-xl border transition-colors space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between",
                            item.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/60"
                          )}
                        >
                          {/* Top part on Mobile: Switch + Day Name + Status badge */}
                          <div className="flex items-center justify-between sm:justify-start gap-3">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={item.active}
                                onCheckedChange={(val) => {
                                  const newSched = [...shopData.operational.schedule];
                                  newSched[idx].active = val;
                                  setShopData({
                                    ...shopData,
                                    operational: { ...shopData.operational, schedule: newSched }
                                  });
                                }}
                              />
                              <div>
                                <span
                                  className={cn(
                                    "text-xs font-bold",
                                    item.active ? "text-[#2E3137]" : "text-muted-foreground line-through opacity-60"
                                  )}
                                >
                                  {item.day}
                                </span>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-md sm:hidden",
                              item.active ? "bg-emerald-50 text-[#00AA5B]" : "bg-slate-100 text-slate-400"
                            )}>
                              {item.active ? "Buka" : "Libur"}
                            </span>
                          </div>

                          {/* Bottom part on Mobile: Time Inputs cleanly side-by-side */}
                          <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                              <span className="text-[10px] text-muted-foreground font-semibold">Buka</span>
                              <Input
                                type="time"
                                value={item.open}
                                disabled={!item.active}
                                onChange={(e) => {
                                  const newSched = [...shopData.operational.schedule];
                                  newSched[idx].open = e.target.value;
                                  setShopData({
                                    ...shopData,
                                    operational: { ...shopData.operational, schedule: newSched }
                                  });
                                }}
                                className="h-8 w-full sm:w-24 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">-</span>
                            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                              <span className="text-[10px] text-muted-foreground font-semibold">Tutup</span>
                              <Input
                                type="time"
                                value={item.close}
                                disabled={!item.active}
                                onChange={(e) => {
                                  const newSched = [...shopData.operational.schedule];
                                  newSched[idx].close = e.target.value;
                                  setShopData({
                                    ...shopData,
                                    operational: { ...shopData.operational, schedule: newSched }
                                  });
                                }}
                                className="h-8 w-full sm:w-24 rounded-lg text-[11px] font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 3: KONTAK & MEDIA SOSIAL                                             */}
                {/* ========================================================================= */}
                <TabsContent value="kontak" className="p-4 sm:p-6 mt-0 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Saluran Komunikasi Langsung
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Kontak resmi yang dapat dihubungi oleh pembeli untuk konsultasi teknis atau konfirmasi pesanan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                        WhatsApp Toko / CS
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#25D366]" />
                        <Input
                          placeholder="081234567890 atau 6281234567890"
                          value={shopData.whatsapp}
                          onChange={(e) => setShopData({ ...shopData, whatsapp: e.target.value })}
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* Email Support */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#EA4335]" />
                        Email Bisnis / Dukungan
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#EA4335]" />
                        <Input
                          placeholder="support@namatoko.com"
                          value={shopData.email}
                          onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#00AA5B]" />
                        Website / Linktree Toko
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00AA5B]" />
                        <Input
                          placeholder="https://tokosaya.com atau linktr.ee/..."
                          value={shopData.website}
                          onChange={(e) => setShopData({ ...shopData, website: e.target.value })}
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* Telegram */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                        Telegram (Username atau Channel)
                      </Label>
                      <div className="relative">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#229ED9]" />
                        <Input
                          placeholder="@tokosaya atau link t.me/..."
                          value={shopData.socials.telegram}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, telegram: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-border/50">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Akun Media Sosial
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Hubungkan media sosial resmi untuk membagikan promo produk digital Anda.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* Instagram */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
                        Instagram
                      </Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#E4405F]" />
                        <Input
                          placeholder="Username Instagram (contoh: tokoku_id)"
                          value={shopData.socials.instagram}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, instagram: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                        Facebook Page / Profil
                      </Label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1877F2]" />
                        <Input
                          placeholder="Username atau Link Facebook"
                          value={shopData.socials.facebook}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, facebook: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 flex items-center justify-center font-black text-slate-800 text-[10px]">TT</span>
                        TikTok
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">@</span>
                        <Input
                          placeholder="Username TikTok (contoh: tokoku_official)"
                          value={shopData.socials.tiktok}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, tiktok: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* YouTube */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
                        YouTube Channel
                      </Label>
                      <div className="relative">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#FF0000]" />
                        <Input
                          placeholder="Link Channel atau @Handle YouTube"
                          value={shopData.socials.youtube}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, youtube: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>

                    {/* Twitter / X */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Twitter className="w-3.5 h-3.5 text-slate-800" />
                        X (Twitter)
                      </Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-800" />
                        <Input
                          placeholder="Username X / Twitter (contoh: tokoku_id)"
                          value={shopData.socials.twitter}
                          onChange={(e) =>
                            setShopData({
                              ...shopData,
                              socials: { ...shopData.socials, twitter: e.target.value }
                            })
                          }
                          className="h-10 pl-9 rounded-xl text-[12px] font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 4: ALAMAT & LOKASI                                                   */}
                {/* ========================================================================= */}
                <TabsContent value="alamat" className="p-4 sm:p-6 mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Provinsi
                      </Label>
                      <Input
                        value={shopData.location.province}
                        onChange={(e) =>
                          setShopData({
                            ...shopData,
                            location: { ...shopData.location, province: e.target.value }
                          })
                        }
                        placeholder="Contoh: DKI Jakarta"
                        className="h-10 rounded-xl text-[12px] font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Kota / Kabupaten
                      </Label>
                      <Input
                        value={shopData.location.city}
                        onChange={(e) =>
                          setShopData({
                            ...shopData,
                            location: { ...shopData.location, city: e.target.value }
                          })
                        }
                        placeholder="Contoh: Jakarta Selatan"
                        className="h-10 rounded-xl text-[12px] font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Kecamatan
                      </Label>
                      <Input
                        value={shopData.location.district}
                        onChange={(e) =>
                          setShopData({
                            ...shopData,
                            location: { ...shopData.location, district: e.target.value }
                          })
                        }
                        placeholder="Contoh: Tebet"
                        className="h-10 rounded-xl text-[12px] font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                        Kode Pos
                      </Label>
                      <Input
                        value={shopData.location.postalCode}
                        onChange={(e) =>
                          setShopData({
                            ...shopData,
                            location: { ...shopData.location, postalCode: e.target.value }
                          })
                        }
                        placeholder="Contoh: 12810"
                        className="h-10 rounded-xl text-[12px] font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      Alamat Lengkap / Patokan
                    </Label>
                    <Textarea
                      value={shopData.location.address}
                      onChange={(e) =>
                        setShopData({
                          ...shopData,
                          location: { ...shopData.location, address: e.target.value }
                        })
                      }
                      placeholder="Jalan, nomor gedung, patokan alamat toko..."
                      className="min-h-[80px] rounded-xl text-[12px] resize-y"
                    />
                  </div>
                </TabsContent>
              </Card>
            </Tabs>
          </div>
        </div>

      </div>

      {/* Floating Save Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 sm:hidden flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">Pengaturan Toko</p>
          <p className="text-[10px] text-slate-400">Simpan perubahan Anda</p>
        </div>
        <Button
          onClick={handleUpdateShop}
          disabled={isSubmitting || isCheckingSlug || isSlugAvailable === false}
          className="h-9 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-1.5 shadow-sm shrink-0 cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Simpan
        </Button>
      </div>
    </main>
  );
}
