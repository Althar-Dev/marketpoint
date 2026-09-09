"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Phone,
  Loader2,
  Globe,
  ChevronLeft,
  Store,
  ShieldCheck,
  MessageSquare,
  KeyRound,
  RefreshCw,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  const [description, setDescription] = useState("");
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

  // OTP & Community Verification States
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [communityLink, setCommunityLink] = useState("https://chat.whatsapp.com/MarketPointCommunity");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Resend Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpDialog && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtpDialog, resendTimer]);

  // References to check existing shop
  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!mounted || authLoading || userLoading || shopLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // If user already has a shop, redirect to my-shop dashboard
    if (userData?.hasShop === true || !!shop) {
      router.replace("/my-shop");
    }
  }, [user, authLoading, userData, userLoading, shop, shopLoading, router, mounted]);

  // Availability States for Name & Slug
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!shopName) return;
    const generatedSlug = shopName
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
    setSlug(generatedSlug);
  }, [shopName]);

  // Live Debounced Check for Shop Name
  useEffect(() => {
    const trimmed = shopName.trim();
    if (!trimmed || trimmed.length < 3) {
      setIsNameAvailable(null);
      setIsCheckingName(false);
      return;
    }

    setIsCheckingName(true);
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "shops"), where("name", "==", trimmed));
        const snap = await getDocs(q);
        setIsNameAvailable(snap.empty);
      } catch (err) {
        console.error("Error checking shop name availability:", err);
      } finally {
        setIsCheckingName(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [shopName, db]);

  // Live Debounced Check for Slug URL
  useEffect(() => {
    const trimmed = slug.trim();
    if (!trimmed || trimmed.length < 3) {
      setIsSlugAvailable(null);
      setIsCheckingSlug(false);
      return;
    }

    setIsCheckingSlug(true);
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, "shops"), where("slug", "==", trimmed));
        const snap = await getDocs(q);
        setIsSlugAvailable(snap.empty);
      } catch (err) {
        console.error("Error checking slug availability:", err);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, db]);

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
        title: "Gagal Mengunggah",
        description: error.message || "Gagal mengunggah gambar.",
      });
    } finally {
      if (e.target) e.target.value = '';
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  // Step 1: Initiate Shop Registration by Sending OTP via WhatsApp Bot
  const handleInitiateRegister = async () => {
    if (!user) return;

    const trimmedName = shopName.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName || trimmedName.length < 3) {
      toast({
        variant: "destructive",
        title: "Nama Toko Belum Diisi",
        description: "Masukkan nama toko yang valid (minimal 3 karakter).",
      });
      return;
    }

    if (!trimmedSlug || trimmedSlug.length < 3) {
      toast({
        variant: "destructive",
        title: "Slug Toko Tidak Valid",
        description: "Slug URL toko harus terdiri dari minimal 3 karakter.",
      });
      return;
    }

    if (!whatsapp || whatsapp.length < 9) {
      toast({
        variant: "destructive",
        title: "Nomor WhatsApp Tidak Valid",
        description: "Masukkan nomor WhatsApp aktif yang valid (minimal 9 digit).",
      });
      return;
    }

    setSendingOtp(true);
    try {
      // Pre-flight check: Name duplicate
      const nameQ = query(collection(db, "shops"), where("name", "==", trimmedName));
      const nameSnap = await getDocs(nameQ);
      if (!nameSnap.empty) {
        setIsNameAvailable(false);
        toast({
          variant: "destructive",
          title: "Nama Toko Sudah Terpakai",
          description: `Nama toko "${trimmedName}" sudah terdaftar di MarketPoint. Silakan gunakan nama toko lain.`,
        });
        setSendingOtp(false);
        return;
      }

      // Pre-flight check: Slug duplicate
      const slugQ = query(collection(db, "shops"), where("slug", "==", trimmedSlug));
      const slugSnap = await getDocs(slugQ);
      if (!slugSnap.empty) {
        setIsSlugAvailable(false);
        toast({
          variant: "destructive",
          title: "Slug URL Toko Sudah Terpakai",
          description: `URL toko "marketpoint.id/${trimmedSlug}" sudah terdaftar. Silakan buat slug URL yang berbeda.`,
        });
        setSendingOtp(false);
        return;
      }

      const res = await fetch("/api/wa-bot/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: whatsapp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresCommunityJoin) {
          setCommunityLink(data.communityLink || "https://chat.whatsapp.com/MarketPointCommunity");
          setShowCommunityDialog(true);
          return;
        }
        throw new Error(data.error || "Gagal mengirimkan kode OTP via WhatsApp.");
      }

      toast({
        title: "Kode OTP Terkirim",
        description: `Kode OTP telah dikirimkan ke WhatsApp ${whatsapp}. Tekan tombol 'Salin Kode' pada chat WhatsApp Anda.`,
      });

      setShowOtpDialog(true);
      setResendTimer(60);
      setCanResend(false);
      setOtpCode("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim OTP",
        description: error.message || "Gagal menghubungi Bot WhatsApp.",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || sendingOtp) return;
    await handleInitiateRegister();
  };

  // Step 2: Verify OTP and finalize Shop Creation
  const handleVerifyAndCreateShop = async () => {
    if (!user) return;

    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Kode OTP Belum Lengkap",
        description: "Masukkan 6 digit kode OTP yang telah dikirim ke WhatsApp Anda.",
      });
      return;
    }

    setVerifyingOtp(true);

    try {
      // 1. Verify OTP with WhatsApp Bot backend service
      const verifyRes = await fetch("/api/wa-bot/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: whatsapp, code: otpCode }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Kode OTP tidak valid.");
      }

      // 2. OTP verified! Now create shop record in Firestore
      setIsSubmitting(true);
      const shopRef = doc(db, "shops", user.uid);
      const userRef = doc(db, "users", user.uid);

      const defaultImageUrl = "https://cdn.marketpoint.id/marketpoint.png";
      const finalLogoUrl = logoUrl.trim() || defaultImageUrl;
      const finalBannerUrl = bannerUrl.trim() || defaultImageUrl;

      await setDoc(shopRef, {
        name: shopName,
        slug: slug,
        description: description,
        whatsapp: whatsapp,
        isWhatsappVerified: true,
        whatsappVerifiedAt: serverTimestamp(),
        location: {
          province,
          city,
          district,
          address,
          postalCode
        },
        logoUrl: finalLogoUrl,
        bannerUrl: finalBannerUrl,
        ownerId: user.uid,
        status: "ACTIVE",
        createdAt: serverTimestamp(),
      });

      await setDoc(userRef, {
        hasShop: true,
        shopSlug: slug
      }, { merge: true });

      // Send WhatsApp Shop Verification Success Notification via WA Bot
      try {
        await fetch("/api/wa-bot/shop-verified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: whatsapp,
            shopName,
            slug,
            city,
            province,
            logoUrl: finalLogoUrl,
            bannerUrl: finalBannerUrl,
            description,
          }),
        });
      } catch (waErr) {
        console.warn("Gagal mengirimkan notifikasi WA toko terverifikasi:", waErr);
      }

      setShowOtpDialog(false);

      toast({
        title: "🎉 Toko Berhasil Dibuka!",
        description: "Nomor WhatsApp berhasil diverifikasi dan toko Anda kini telah aktif.",
      });

      setTimeout(() => {
        router.replace("/my-shop");
      }, 500);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: error.message || "Kode OTP salah atau telah kadaluarsa.",
      });
    } finally {
      setVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || userLoading || shopLoading || !user || (userData?.hasShop || !!shop)) {
    return (
      <div className="p-3 md:p-6 lg:p-8">
        <div className="max-w-screen-md mx-auto space-y-5">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-body">
      <header className="bg-white border-b border-border/50 sticky top-0 z-30 px-4 md:px-8 py-3.5">
        <div className="max-w-screen-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-1.5 hover:bg-muted rounded-full transition-colors text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#00AA5B] flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight">Pendaftaran Toko</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#00AA5B] bg-[#00AA5B]/10 px-3 py-1 rounded-full">
            Buka Gratis
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-screen-md mx-auto space-y-5">
          <div className="space-y-1 text-center md:text-left mb-6">
            <h1 className="text-xl font-bold tracking-tight">Informasi Toko</h1>
            <p className="text-xs text-muted-foreground">Lengkapi informasi berikut untuk mulai berjualan solusi digital di MarketPoint.</p>
          </div>

          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-white">
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
                  className="absolute bottom-3 right-3 rounded-lg h-7 px-3 text-[10px] font-bold gap-1.5 shadow-md z-20 border border-border bg-white hover:bg-muted"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {uploadingBanner ? "Mengunggah..." : "Ganti Banner"}
                </Button>
              </div>
              <div className="px-4 pb-4 -mt-8 relative z-10">
                <div className="flex items-end gap-3">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white border-2 border-border shadow-md overflow-hidden relative group">
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
                    <p className="text-[11px] font-bold text-foreground">Logo Toko</p>
                    <p className="text-[9px] text-muted-foreground">{uploadingLogo ? 'Sedang mengunggah...' : 'Format .jpg atau .png'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm rounded-xl bg-white">
            <CardContent className="p-5 md:p-8 space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <h3 className="text-[12px] font-bold tracking-tight text-[#2E3137]">Identitas Bisnis</h3>
                </div>

                <div className="grid gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Nama Toko</Label>
                      {isCheckingName ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa...
                        </span>
                      ) : isNameAvailable === true ? (
                        <span className="text-[10px] text-[#00AA5B] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Nama toko tersedia
                        </span>
                      ) : isNameAvailable === false ? (
                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Nama toko sudah ada
                        </span>
                      ) : null}
                    </div>
                    <Input
                      placeholder="Contoh: Digital Solutions ID"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className={`h-10 rounded-xl bg-muted/20 border-border focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold ${isNameAvailable === false ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10 text-red-600" : ""
                        }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Slug Toko (URL)</Label>
                        {isCheckingSlug ? (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa...
                          </span>
                        ) : isSlugAvailable === true ? (
                          <span className="text-[10px] text-[#00AA5B] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> URL toko tersedia
                          </span>
                        ) : isSlugAvailable === false ? (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> URL toko sudah ada
                          </span>
                        ) : null}
                      </div>
                      <div className="relative">
                        <Input
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className={`h-10 rounded-xl bg-muted/20 border-border focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold pl-10 ${isSlugAvailable === false ? "border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500/10 text-red-600" : ""
                            }`}
                        />
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      </div>
                      <p className="text-[9px] text-muted-foreground ml-0.5">marketpoint.id/<span className="font-bold text-[#00AA5B]">{slug || 'username'}</span></p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Nomor WhatsApp Toko</Label>
                        <span className="text-[10px] text-[#00AA5B] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verifikasi OTP
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="08xxxxxxxx"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                          className="h-10 rounded-xl bg-muted/20 border-border focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all text-xs font-bold pl-10"
                        />
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      </div>
                      <p className="text-[9px] text-muted-foreground ml-0.5">Kode OTP akan dikirimkan ke nomor WhatsApp ini.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Deskripsi Toko (Opsional)</Label>
                    <Textarea
                      placeholder="Jelaskan mengenai produk digital, lisensi, atau jasa yang Anda tawarkan di toko ini..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[70px] rounded-xl bg-muted/20 border-border text-xs font-medium resize-none p-3 focus:border-[#00AA5B] focus:ring-4 focus:ring-[#00AA5B]/5 transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground ml-0.5">Deskripsi ini akan tampil di profil toko dan pengumuman komunitas.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <h3 className="text-[12px] font-bold tracking-tight text-[#2E3137]">Lokasi</h3>
                </div>

                <div className="grid gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Provinsi</Label>
                      <Input
                        placeholder="Kepulauan Riau"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="h-10 rounded-xl bg-muted/20 border-border text-[11px] font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Kota</Label>
                      <Input
                        placeholder="Batam"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-10 rounded-xl bg-muted/20 border-border text-[11px] font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Kecamatan</Label>
                      <Input
                        placeholder="Sekupang"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="h-10 rounded-xl bg-muted/20 border-border text-[11px] font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Alamat Lengkap</Label>
                      <Textarea
                        placeholder="Nama jalan, nomor rumah, RT/RW..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="min-h-[80px] rounded-xl bg-muted/20 border-border text-[11px] font-medium resize-none p-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-muted-foreground ml-0.5">Kode Pos</Label>
                      <Input
                        placeholder="29428"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/[^0-9]/g, ''))}
                        className="h-10 rounded-xl bg-muted/20 border-border text-[11px] font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  disabled={!shopName || !slug || !whatsapp || !address || isSubmitting || sendingOtp || uploadingLogo || uploadingBanner}
                  onClick={handleInitiateRegister}
                  className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-lg shadow-[#00AA5B]/10 transition-all active:scale-[0.98] gap-2"
                >
                  {sendingOtp ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan OTP WhatsApp...</span>
                    </div>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Verifikasi WhatsApp & Daftar Toko</span>
                    </>
                  )}
                </Button>
                <p className="text-[9px] text-center text-muted-foreground mt-4 leading-relaxed px-4">
                  Dengan mengklik daftar, Anda menyetujui <span className="text-[#00AA5B] font-bold cursor-pointer">Syarat & Ketentuan</span> yang berlaku bagi mitra seller MarketPoint.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal Dialog Verifikasi OTP WhatsApp */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="w-[92vw] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white border border-border shadow-2xl overflow-hidden"
        >
          <DialogHeader className="text-left space-y-0 pb-1 border-b border-border/40">
            <div className="flex items-center gap-3 pr-6 pb-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground tracking-tight leading-snug">
                  Verifikasi WhatsApp Toko
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Keamanan akun & verifikasi seller
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5 py-3">
            {/* WhatsApp Instruction Notice Box */}
            <div className="bg-[#00AA5B]/5 border border-[#00AA5B]/20 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-center space-y-1.5 shadow-sm">
              <p className="text-[10px] sm:text-xs font-bold text-[#00AA5B] flex items-center justify-center gap-1.5 leading-snug">
                <span>Tekan tombol <strong>"Salin Kode"</strong> pada pesan WhatsApp Anda</span>
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                Kode OTP 6 digit telah dikirimkan ke nomor WhatsApp <span className="font-extrabold text-foreground font-mono">+{whatsapp}</span>.
              </p>
            </div>

            {/* 6-Digit OTP Box Input Form */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between ml-0.5">
                <span>Kode OTP (6 Digit)</span>
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground/70" />
              </Label>

              <div className="relative flex items-center justify-center gap-2 sm:gap-3 py-1">
                {/* Transparent input overlay for native typing, paste & mobile keyboard support */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                    setOtpCode(val);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                  autoFocus
                />

                {Array.from({ length: 6 }).map((_, idx) => {
                  const digit = otpCode[idx] || "";
                  const isFocused = otpCode.length === idx || (otpCode.length === 6 && idx === 5);
                  const isFilled = Boolean(digit);

                  return (
                    <div
                      key={idx}
                      className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-mono font-black transition-all duration-200 select-none ${isFilled
                        ? "border-[#00AA5B] bg-[#00AA5B]/5 text-[#00AA5B] shadow-sm scale-[1.02]"
                        : isFocused
                          ? "border-[#00AA5B] bg-white ring-4 ring-[#00AA5B]/15 shadow-md scale-105"
                          : "border-border/80 bg-muted/20 text-muted-foreground/40"
                        }`}
                    >
                      {digit ? (
                        digit
                      ) : isFocused ? (
                        <span className="w-2 h-2 rounded-full bg-[#00AA5B] animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resend Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-0.5">
              <span className="text-muted-foreground text-[11px] sm:text-xs">
                {resendTimer > 0 ? (
                  <>Kirim ulang dalam <strong className="text-[#00AA5B] font-bold">{resendTimer} detik</strong></>
                ) : (
                  "Tidak menerima kode OTP?"
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canResend || sendingOtp}
                onClick={handleResendOtp}
                className="h-8 text-[11px] sm:text-xs font-bold text-[#00AA5B] hover:bg-[#00AA5B]/10 rounded-xl gap-1 px-2.5 self-start sm:self-auto"
              >
                {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Kirim Ulang
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              disabled={otpCode.length !== 6 || verifyingOtp || isSubmitting}
              onClick={handleVerifyAndCreateShop}
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#00AA5B]/15 transition-all active:scale-[0.98] gap-2"
            >
              {verifyingOtp || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi & Membuat Toko...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi & Buka Toko</span>
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOtpDialog(false)}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground font-medium rounded-xl transition-colors"
            >
              Ubah Informasi Toko
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Wajib Gabung Komunitas WhatsApp */}
      <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
        <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white border border-border shadow-2xl">
          <DialogHeader className="text-left space-y-2 pb-2 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                  Wajib Gabung Komunitas WA
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Syarat verifikasi pendaftaran seller MarketPoint
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs font-bold text-amber-700 leading-snug">
                Nomor WhatsApp Anda (+{whatsapp}) belum terdaftar di Komunitas WhatsApp MarketPoint.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sebelum mendapatkan kode OTP dan memverifikasi toko, Anda diwajibkan bergabung ke komunitas resmi seller MarketPoint terlebih dahulu.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                onClick={() => {
                  window.open(communityLink, "_blank");
                }}
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs shadow-md shadow-[#00AA5B]/15 gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>Gabung Komunitas WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  setShowCommunityDialog(false);
                  await handleInitiateRegister();
                }}
                className="w-full h-10 rounded-xl font-bold text-xs border-border hover:bg-muted"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Saya Sudah Gabung</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
