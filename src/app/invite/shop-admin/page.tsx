"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCheck,
  Store,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Package,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Mail,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const shopId = searchParams.get("shopId");
  const adminId = searchParams.get("adminId");

  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<any>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      if (!shopId || !adminId) {
        setErrorMsg("Tautan undangan tidak lengkap atau tidak valid.");
        setLoading(false);
        return;
      }

      if (!db) return;

      try {
        setLoading(true);
        // 1. Fetch Shop Info
        const shopRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopRef);
        if (!shopSnap.exists()) {
          setErrorMsg("Toko pengundang tidak ditemukan.");
          setLoading(false);
          return;
        }
        setShopData(shopSnap.data());

        // 2. Fetch Admin Invitation Info
        const adminRef = doc(db, "shops", shopId, "admins", adminId);
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          setErrorMsg("Data undangan staf tidak ditemukan atau telah dibatalkan oleh pemilik toko.");
          setLoading(false);
          return;
        }

        const aData = adminSnap.data();
        setInviteData(aData);

        // Pre-fill name if available or user logged in
        if (aData.name) {
          setFullName(aData.name);
        } else if (user?.displayName) {
          setFullName(user.displayName);
        }

        if (aData.phone) {
          setPhoneNumber(aData.phone);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Gagal memuat informasi undangan.");
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [shopId, adminId, db, user]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: "Nama Lengkap Wajib Diisi",
        description: "Silakan masukkan nama lengkap Anda untuk ditampilkan pada sistem toko.",
        variant: "destructive"
      });
      return;
    }

    if (!db || !shopId || !adminId) return;

    setIsSubmitting(true);
    try {
      let userAvatar = user?.photoURL || inviteData?.avatar || "";
      if (user && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data()?.photoURL) {
            userAvatar = userDoc.data().photoURL;
          }
        } catch (_) {}
      }
      if (!userAvatar && inviteData?.email) {
        const seed = inviteData.email.trim().toLowerCase();
        const defaultAvatars = ["/assets/avatar/hawk.png", "/assets/avatar/duck.jpg"];
        const charSum = seed.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        userAvatar = defaultAvatars[charSum % defaultAvatars.length];
      }
      if (userAvatar === "/assets/avatar/duck.png") {
        userAvatar = "/assets/avatar/duck.jpg";
      }

      const adminRef = doc(db, "shops", shopId, "admins", adminId);
      await updateDoc(adminRef, {
        name: fullName.trim(),
        phone: phoneNumber.trim() || inviteData?.phone || "",
        avatar: userAvatar,
        userId: user?.uid || null,
        status: "ACTIVE",
        acceptedAt: serverTimestamp(),
        lastActive: "Sedang Aktif",
        updatedAt: serverTimestamp(),
      });

      // Save staff link into the accepting user's profile
      if (user && db) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            hasShop: true,
            isStaff: true,
            staffShopId: shopId,
            activeShopId: shopId,
            staffRole: inviteData?.role || "PRODUK",
            staffRoleLabel: inviteData?.roleLabel || "Staf Toko",
            staffPermissions: inviteData?.permissions || null,
            updatedAt: serverTimestamp(),
          });
        } catch (_) {}
      }

      // Write Audit Log to shop
      const logsCol = collection(db, "shops", shopId, "audit_logs");
      await addDoc(logsCol, {
        adminName: fullName.trim(),
        adminRole: inviteData?.roleLabel || "Staf Toko",
        action: "Menyetujui Undangan Staf",
        target: `${fullName.trim()} (${inviteData?.email}) resmi bergabung ke tim`,
        module: "ADMIN",
        timestamp: "Baru saja",
        dateObj: new Date().toISOString().replace("T", " ").substring(0, 16),
        ip: "127.0.0.1",
        status: "SUCCESS",
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      toast({
        title: "Undangan Disetujui! 🎉",
        description: `Selamat datang di tim toko ${shopData?.name || "Toko"}!`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Menyetujui Undangan",
        description: err.message || "Terjadi kesalahan saat memproses persetujuan.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border border-border shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border border-border shadow-xs text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Undangan Tidak Valid</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{errorMsg}</p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="rounded-xl text-xs font-semibold h-9"
          >
            Kembali ke Beranda
          </Button>
        </Card>
      </div>
    );
  }

  // Already accepted view
  if (inviteData?.status === "ACTIVE" && !isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border border-border shadow-xs p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-[#00AA5B] flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Undangan Sudah Aktif</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Akun <b>{inviteData.name || inviteData.email}</b> sudah berstatus aktif sebagai{" "}
              <b>{inviteData.roleLabel}</b> di toko <b>{shopData?.name}</b>.
            </p>
          </div>
          <Button
            onClick={async () => {
              if (user && db && shopId) {
                try {
                  await updateDoc(doc(db, "users", user.uid), {
                    hasShop: true,
                    isStaff: true,
                    staffShopId: shopId,
                    activeShopId: shopId,
                    updatedAt: serverTimestamp(),
                  });
                } catch (_) {}
              }
              router.push("/my-shop");
            }}
            className="w-full bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-semibold h-9"
          >
            Buka Seller Center <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Card>
      </div>
    );
  }

  // Success view after submitting
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl border border-border shadow-xs p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold px-2.5 py-0.5">
              Persetujuan Berhasil
            </Badge>
            <h2 className="text-lg font-bold text-foreground mt-2">Selamat Bergabung!</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Halo <b>{fullName}</b>, Anda kini resmi terdaftar sebagai staf <b>{inviteData?.roleLabel}</b> untuk{" "}
              <b>{shopData?.name}</b>. Nama Anda kini telah muncul di manajemen admin toko.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toko:</span>
              <span className="font-semibold text-foreground">{shopData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peran:</span>
              <span className="font-semibold text-[#00AA5B]">{inviteData?.roleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-[11px] text-foreground">{inviteData?.email}</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/my-shop")}
            className="w-full bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-semibold h-9"
          >
            Masuk ke Seller Center <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Card>
      </div>
    );
  }

  // Main Invitation Acceptance Form
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#00AA5B] to-[#00924c] p-5 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white/40 shadow-sm bg-white/20">
              <AvatarImage src={shopData?.logoUrl} alt={shopData?.name} />
              <AvatarFallback className="bg-white text-[#00AA5B] font-bold text-sm">
                <Store className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">
                Undangan Admin Toko
              </span>
              <h1 className="text-base font-bold leading-tight drop-shadow-xs">
                {shopData?.name || "Toko Marketpoint"}
              </h1>
              <p className="text-[11px] text-white/80 mt-0.5">
                Mengundang Anda untuk bergabung ke dalam tim toko
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Role & Permissions Card */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Peran Staf:</span>
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-xs font-bold px-2 py-0.5">
                {inviteData?.roleLabel || "Staf Toko"}
              </Badge>
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/60">
              <span className="font-semibold text-foreground block text-[11px]">Hak Akses Diberikan:</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {inviteData?.permissions?.finance && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-medium">
                    <DollarSign className="h-2.5 w-2.5 text-emerald-600" /> Keuangan & Saldo
                  </span>
                )}
                {inviteData?.permissions?.products && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded font-medium">
                    <Package className="h-2.5 w-2.5 text-amber-600" /> Katalog & Produk
                  </span>
                )}
                {inviteData?.permissions?.chat && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded font-medium">
                    <MessageSquare className="h-2.5 w-2.5 text-blue-600" /> Customer Service & Chat
                  </span>
                )}
              </div>
            </div>

            <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/60">
              <Mail className="h-3 w-3 text-muted-foreground/70" />
              <span>Email Terundang:</span>
              <span className="font-mono font-medium text-foreground">{inviteData?.email}</span>
            </div>
          </div>

          {/* Form to enter staff name */}
          <form onSubmit={handleAcceptInvite} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Nama Lengkap Anda *
              </Label>
              <Input
                placeholder="Contoh: Rina Amelia"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-9 rounded-xl text-xs"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">
                Nama ini akan otomatis ditampilkan di daftar admin toko dan log aktivitas.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                No. Telepon / WhatsApp (Opsional)
              </Label>
              <Input
                placeholder="08123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="rounded-xl text-xs h-9 flex-1 order-2 sm:order-1"
              >
                Tolak Undangan
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-bold h-9 flex-1 shadow-sm order-1 sm:order-2"
              >
                {isSubmitting ? "Memproses..." : "Setujui & Gabung Toko"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShopAdminInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
