"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  unlink,
  getAuth,
  signInWithCredential,
  deleteUser,
  linkWithCredential,
} from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopSettings } from "@/components/desktop-settings";
import { DesktopProfileSkeleton } from "@/components/desktop-profile-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Link2,
  Unlink,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConnectedAccount {
  id: "google" | "apple" | "facebook";
  name: string;
  description: string;
  connectedIdentifier?: string;
  isConnected: boolean;
  canDisconnect: boolean;
  isDisabled?: boolean;
}

export default function ConnectedAccountsPage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [actionType, setActionType] = useState<"connect" | "disconnect">("connect");
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const [connectedState, setConnectedState] = useState<Record<string, boolean>>({
    google: true,
    apple: false,
    facebook: false,
  });

  const authMethodsRef = useMemoFirebase(() => doc(db, "settings", "auth_methods"), [db]);
  const { data: authMethodsData } = useDoc(authMethodsRef);

  const isGoogleLoginEnabled = authMethodsData ? (authMethodsData.googleLoginEnabled ?? true) : true;
  const isFacebookLoginEnabled = authMethodsData ? (authMethodsData.facebookLoginEnabled ?? true) : true;

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: userData, loading: userLoading } = useDoc(userRef);
  const { data: wallet, loading: walletLoading } = useDoc(walletRef);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const isGoogle =
        user.providerData?.some(
          (p) => p.providerId === "google.com"
        ) || !!userData?.connectedAccounts?.google;

      const isFacebook =
        user.providerData?.some((p) => p.providerId === "facebook.com") ||
        !!userData?.connectedAccounts?.facebook;

      const isApple =
        user.providerData?.some((p) => p.providerId === "apple.com") ||
        !!userData?.connectedAccounts?.apple;

      setConnectedState((prev) => ({
        ...prev,
        google: isGoogle,
        facebook: isFacebook,
        apple: isApple,
        ...(userData?.connectedAccounts || {}),
      }));
    }
  }, [user, authLoading, router, userData]);

  const handleConfirmAction = async () => {
    if (!selectedAccount || !user) return;

    setIsLoadingAction(true);

    try {
      if (selectedAccount.id === "google") {
        if (actionType === "connect") {
          if (!isGoogleLoginEnabled) {
            toast({
              variant: "destructive",
              title: "Metode Dinonaktifkan",
              description: "Penghubungan akun Google sedang dinonaktifkan oleh Administrator.",
            });
            setIsLoadingAction(false);
            setSelectedAccount(null);
            return;
          }

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });

          let googleDisplayName: string | null = null;
          let googleEmail: string | null = null;

          try {
            const result = await linkWithPopup(user, provider);
            const gUser = result.user;
            const gData = gUser.providerData.find((p) => p.providerId === "google.com");
            googleDisplayName = gData?.displayName || gUser.displayName || null;
            googleEmail = gData?.email || gUser.email || null;
          } catch (linkError: any) {
            console.warn("Direct linkWithPopup Google caught:", linkError);
            if (
              linkError.code === "auth/credential-already-in-use" ||
              linkError.code === "auth/email-already-in-use"
            ) {
              throw new Error("Akun Google ini sudah terhubung ke akun MarketPoint lain.");
            } else if (linkError.code === "auth/popup-closed-by-user") {
              setIsLoadingAction(false);
              setSelectedAccount(null);
              return;
            } else if (linkError.code === "auth/unauthorized-domain") {
              throw new Error("Domain ini belum diizinkan di Firebase Authentication (Authorized Domains).");
            } else {
              throw linkError;
            }
          }

          const updated = {
            ...connectedState,
            google: true,
          };
          setConnectedState(updated);

          if (userRef) {
            await updateDoc(userRef, {
              "connectedAccounts.google": true,
              googleEmail: googleEmail || user.email || null,
              googleName: googleDisplayName || user.displayName || null,
              updatedAt: new Date().toISOString(),
            });
          }

          toast({
            title: "Google Berhasil Terhubung",
            description: "Akun Google berhasil ditautkan ke akun MarketPointID Anda.",
          });
        } else {
          // Unlink Google Provider
          const hasOtherProvider =
            user.providerData.some((p) => p.providerId !== "google.com") ||
            !!userData?.hasPassword ||
            !!userData?.connectedAccounts?.facebook;

          if (!hasOtherProvider && user.providerData.length <= 1) {
            toast({
              variant: "destructive",
              title: "Tidak Dapat Memutuskan",
              description:
                "Anda harus memiliki metode login lain (seperti Kata Sandi atau Akun Facebook) sebelum memutuskan Google.",
            });
            setIsLoadingAction(false);
            setSelectedAccount(null);
            return;
          }

          try {
            await unlink(user, "google.com");
          } catch (e: any) {
            console.warn("Unlink Google provider warning:", e);
          }

          const updated = {
            ...connectedState,
            google: false,
          };
          setConnectedState(updated);

          if (userRef) {
            await updateDoc(userRef, {
              "connectedAccounts.google": false,
              googleEmail: null,
              googleName: null,
              updatedAt: new Date().toISOString(),
            });
          }

          toast({
            title: "Koneksi Google Diputuskan",
            description: "Akun Google berhasil diputuskan dari MarketPointID Anda.",
          });
        }
      } else if (selectedAccount.id === "facebook") {
        if (actionType === "connect") {
          if (!isFacebookLoginEnabled) {
            toast({
              variant: "destructive",
              title: "Metode Dinonaktifkan",
              description: "Penghubungan akun Facebook sedang dinonaktifkan oleh Administrator.",
            });
            setIsLoadingAction(false);
            setSelectedAccount(null);
            return;
          }
          // Link Facebook Provider with Popup
          const provider = new FacebookAuthProvider();
          provider.addScope("email");
          provider.addScope("public_profile");
          provider.setCustomParameters({
            display: "popup",
          });

          let fbDisplayName: string | null = null;
          let fbEmail: string | null = null;

          try {
            const result = await linkWithPopup(user, provider);
            const fbUser = result.user;
            const fbData = fbUser.providerData.find((p) => p.providerId === "facebook.com");
            fbDisplayName = fbData?.displayName || null;
            fbEmail = fbData?.email || null;
          } catch (linkError: any) {
            console.warn("Direct linkWithPopup caught:", linkError);
            if (
              linkError.code === "auth/credential-already-in-use" ||
              linkError.code === "auth/email-already-in-use"
            ) {
              const cred = FacebookAuthProvider.credentialFromError(linkError);
              if (cred) {
                let tempApp: any = null;
                try {
                  tempApp = initializeApp(firebaseConfig, "temp-linker-" + Date.now());
                  const tempAuth = getAuth(tempApp);
                  const oldUserCred = await signInWithCredential(tempAuth, cred);
                  if (oldUserCred?.user && oldUserCred.user.uid !== user.uid) {
                    await deleteUser(oldUserCred.user);
                  }
                } catch (delErr) {
                  console.warn("Could not delete orphaned user in temp auth:", delErr);
                } finally {
                  if (tempApp) {
                    try {
                      await deleteApp(tempApp);
                    } catch (_) {}
                  }
                }

                // Link to current user now that the orphaned account is removed
                const linkResult = await linkWithCredential(user, cred);
                const fbData = linkResult.user.providerData.find((p) => p.providerId === "facebook.com");
                fbDisplayName = fbData?.displayName || null;
                fbEmail = fbData?.email || null;
              } else {
                throw linkError;
              }
            } else {
              throw linkError;
            }
          }

          const updated = {
            ...connectedState,
            facebook: true,
          };
          setConnectedState(updated);

          if (userRef) {
            await updateDoc(userRef, {
              "connectedAccounts.facebook": true,
              facebookName: fbDisplayName || user.displayName || null,
              facebookEmail: fbEmail || user.email || null,
              updatedAt: new Date().toISOString(),
            });
          }

          toast({
            title: "Facebook Berhasil Terhubung",
            description: `Akun Facebook berhasil ditautkan! Anda kini dapat masuk ke akun ini menggunakan Facebook maupun Google.`,
          });
        } else {
          // Unlink Facebook Provider
          const hasOtherProvider =
            user.providerData.some((p) => p.providerId !== "facebook.com") ||
            !!userData?.hasPassword ||
            !!user.email;

          if (!hasOtherProvider && user.providerData.length <= 1) {
            toast({
              variant: "destructive",
              title: "Tidak Dapat Memutuskan",
              description:
                "Anda harus memiliki metode login lain (seperti Kata Sandi atau Akun Google) sebelum memutuskan Facebook.",
            });
            setIsLoadingAction(false);
            setSelectedAccount(null);
            return;
          }

          try {
            await unlink(user, "facebook.com");
          } catch (e: any) {
            console.warn("Unlink provider warning:", e);
          }

          const updated = {
            ...connectedState,
            facebook: false,
          };
          setConnectedState(updated);

          if (userRef) {
            await updateDoc(userRef, {
              "connectedAccounts.facebook": false,
              facebookName: null,
              facebookEmail: null,
              updatedAt: new Date().toISOString(),
            });
          }

          toast({
            title: "Koneksi Facebook Diputuskan",
            description: "Akun Facebook berhasil diputuskan dari MarketPointID Anda.",
          });
        }
      } else {
        // Fallback for other accounts (e.g. Google / Apple)
        const newStatus = actionType === "connect";
        const updated = {
          ...connectedState,
          [selectedAccount.id]: newStatus,
        };
        setConnectedState(updated);

        if (userRef) {
          await updateDoc(userRef, {
            connectedAccounts: updated,
            updatedAt: new Date().toISOString(),
          });
        }

        toast({
          title: newStatus ? "Akun Berhasil Dihubungkan" : "Koneksi Akun Diputuskan",
          description: newStatus
            ? `Akun ${selectedAccount.name} kini terhubung dengan MarketPointID Anda.`
            : `Akun ${selectedAccount.name} telah berhasil diputuskan.`,
        });
      }
    } catch (error: any) {
      console.error("Action account error:", error);
      let errorMsg = "Terjadi gangguan saat memproses akun. Silakan coba lagi.";
      if (error.code === "auth/credential-already-in-use") {
        errorMsg = `Akun ${selectedAccount?.name || "ini"} sudah terhubung ke akun MarketPoint lain.`;
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMsg = "Jendela penghubungan ditutup sebelum selesai.";
      } else if (error.code === "auth/provider-already-linked") {
        errorMsg = `Akun ${selectedAccount?.name || "ini"} sudah terhubung sebelumnya.`;
      } else if (error.code === "auth/unauthorized-domain") {
        errorMsg = "Domain ini belum diizinkan di Firebase Authentication (Authorized Domains).";
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast({
        variant: "destructive",
        title: "Gagal Memproses Akun",
        description: errorMsg,
      });
    } finally {
      setIsLoadingAction(false);
      setSelectedAccount(null);
    }
  };

  if (!mounted || authLoading || (user && (userLoading || walletLoading || shopLoading))) {
    return (
      <>
        <div className="hidden md:block">
          <DesktopProfileSkeleton />
        </div>
        <div className="block md:hidden min-h-screen bg-white">
          <div className="px-4 py-3.5 flex items-center gap-4 bg-white">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const hasShop = userData?.hasShop === true || !!shop;

  // Extract Facebook user details if available
  const fbData = user.providerData?.find((p) => p.providerId === "facebook.com");
  const fbIdentifier =
    fbData?.displayName ||
    fbData?.email ||
    userData?.facebookName ||
    userData?.facebookEmail ||
    "Akun Facebook terhubung";

  const googleIdentifier =
    userData?.googleEmail ||
    user.providerData?.find((p) => p.providerId === "google.com")?.email ||
    (connectedState.google ? user.email : null) ||
    "Akun Google terhubung";

  const socialAccounts: ConnectedAccount[] = [
    {
      id: "google",
      name: "Google",
      description: connectedState.google
        ? googleIdentifier
        : !isGoogleLoginEnabled
        ? "Metode Google dinonaktifkan oleh Admin"
        : "Masuk lebih cepat dengan sekali klik",
      connectedIdentifier: connectedState.google ? googleIdentifier : undefined,
      isConnected: !!connectedState.google,
      canDisconnect: true,
      isDisabled: !connectedState.google && !isGoogleLoginEnabled,
    },
    {
      id: "apple",
      name: "Apple",
      description: connectedState.apple
        ? "Terhubung dengan Apple ID"
        : "Gunakan Apple ID untuk masuk secara aman",
      isConnected: !!connectedState.apple,
      canDisconnect: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      description: connectedState.facebook
        ? fbIdentifier
        : !isFacebookLoginEnabled
        ? "Metode Facebook dinonaktifkan oleh Admin"
        : "Hubungkan akun Facebook untuk akses cepat",
      connectedIdentifier: connectedState.facebook ? fbIdentifier : undefined,
      isConnected: !!connectedState.facebook,
      canDisconnect: true,
      isDisabled: !connectedState.facebook && !isFacebookLoginEnabled,
    },
  ];

  return (
    <>
      {/* Desktop Fallback */}
      <div className="hidden md:flex flex-col min-h-screen">
        <MarketHeader />
        <main className="flex-1 pt-16 bg-[#F8FAFC]">
          <DesktopSettings
            user={user}
            userData={userData}
            wallet={wallet}
            hasShop={hasShop}
            displayName={userData?.displayName || user.displayName || ""}
            setDisplayName={() => { }}
            isEditing={false}
            setIsEditing={() => { }}
            handleUpdateProfile={() => { }}
            handleLogout={() => auth.signOut().then(() => router.push("/login"))}
            updating={false}
            activeTab="akun-terhubung"
          />
        </main>
        <MarketFooter />
      </div>

      {/* Dedicated Mobile View (Tokopedia Style) */}
      <div className="block md:hidden min-h-screen bg-white font-body text-[#212121]">
        {/* Header - No bottom border */}
        <header className="px-4 py-3.5 flex items-center gap-3.5 bg-white sticky top-0 z-30">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 -ml-1 text-[#212121] hover:bg-muted/50 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#212121]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#212121] tracking-tight">Akun Terhubung</h1>
        </header>

        <main className="px-4 pb-16 space-y-6">
          {/* Section: Akun Sosial & Login */}
          <section className="space-y-3">
            <div className="py-0.5">
              <h3 className="text-[13px] font-bold text-[#212121]">Akun Sosial & Login</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Masuk ke MarketPoint dengan layanan pihak ketiga
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
              {socialAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 flex items-center justify-between gap-3 bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                      {acc.id === "google" && (
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      {acc.id === "apple" && (
                        <svg className="w-4.5 h-4.5 fill-slate-900" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                      )}
                      {acc.id === "facebook" && (
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                          <path
                            fill="#1877F2"
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#212121]">{acc.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {acc.description}
                      </p>
                    </div>
                  </div>

                    <div className="shrink-0">
                    {acc.isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Terhubung
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAccount(acc);
                            setActionType("disconnect");
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Putuskan"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : acc.isDisabled ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200/80">
                        Nonaktif
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(acc);
                          setActionType("connect");
                        }}
                        className="h-7.5 px-3 rounded-xl text-[11px] font-bold border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10 active:scale-95 transition-all"
                      >
                        Hubungkan
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tips Info Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Memutuskan akun sosial tidak akan menghapus riwayat pesanan Anda di MarketPointID. Pastikan Anda memiliki kata sandi atau email terdaftar agar tetap dapat masuk ke akun.
            </p>
          </div>
        </main>

        {/* Dialog Konfirmasi Hubungkan / Putuskan */}
        <Dialog
          open={!!selectedAccount}
          onOpenChange={(open) => !open && !isLoadingAction && setSelectedAccount(null)}
        >
          <DialogContent className="rounded-3xl max-w-[360px] w-[92vw] p-5 sm:p-6 mx-auto border-border/60 shadow-xl bg-white">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-[#212121]">
                {actionType === "connect"
                  ? `Hubungkan ${selectedAccount?.name}?`
                  : `Putuskan ${selectedAccount?.name}?`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {actionType === "connect"
                  ? `Anda akan diarahkan untuk mengautentikasi akun ${selectedAccount?.name} agar dapat digunakan untuk login cepat di MarketPoint.`
                  : `Anda yakin ingin memutuskan akun ${selectedAccount?.name}? Anda tidak dapat lagi menggunakan akun ini untuk login otomatis sampai dihubungkan kembali.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingAction}
                onClick={() => setSelectedAccount(null)}
                className="h-10 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={isLoadingAction}
                onClick={handleConfirmAction}
                className={cn(
                  "h-10 rounded-xl font-bold text-white text-xs",
                  actionType === "connect"
                    ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isLoadingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                {actionType === "connect" ? "Ya, Hubungkan" : "Ya, Putuskan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
