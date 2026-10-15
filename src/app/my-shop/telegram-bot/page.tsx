"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Zap, 
  Settings2, 
  Bell, 
  ExternalLink, 
  Key, 
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MerchantTelegramBotPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSubmitting] = useState(false);

  const {
    shopId,
    shop: contextShop,
    loading: merchantLoading,
    isOwner,
  } = useMerchantShop();

  const activeShopId = shopId || user?.uid;

  const shopRef = useMemoFirebase(() => {
    if (!activeShopId) return null;
    return doc(db, "shops", activeShopId);
  }, [db, activeShopId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Subscription check
  const [subInfo, setSubInfo] = useState({
    planName: "Gratis",
    botAllowed: false,
  });

  useEffect(() => {
    if (!activeShopId) return;
    fetch(`/api/subscription?shopId=${encodeURIComponent(activeShopId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const planId = data.subscription?.planId || "free";
          const plansList = data.plans || [];
          const activePlan = plansList.find((p: any) => p.id === planId);
          setSubInfo({
            planName: data.subscription?.planName || planId,
            botAllowed: activePlan?.features?.telegramBot ?? (planId === "pro" || planId === "prime"),
          });
        }
      })
      .catch(() => {});
  }, [activeShopId]);

  // Form State
  const [botToken, setBotToken] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyPaid, setNotifyPaid] = useState(true);
  const [notifyDispute, setNotifyDispute] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (shop?.telegramBot) {
      setBotToken(shop.telegramBot.token || "");
      setIsEnabled(shop.telegramBot.isEnabled ?? false);
      setNotifyOrder(shop.telegramBot.notifyOrder ?? true);
      setNotifyPaid(shop.telegramBot.notifyPaid ?? true);
      setNotifyDispute(shop.telegramBot.notifyDispute ?? true);
    }
  }, [shop]);

  const handleSaveConfig = async () => {
    if (!user || !shopRef) return;
    if (!subInfo.botAllowed) {
      toast({
        variant: "destructive",
        title: "Upgrade Diperlukan",
        description: `Fitur Bot Telegram hanya tersedia untuk pengguna paket Pro atau Prime.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(shopRef, {
        telegramBot: {
          token: botToken.trim(),
          isEnabled,
          notifyOrder,
          notifyPaid,
          notifyDispute,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Konfigurasi Disimpan!",
        description: "Bot Telegram toko Anda telah diperbarui.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || shopLoading || merchantLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-screen-md mx-auto">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-screen-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#212121] flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-500" /> Manajemen Bot Telegram
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Otomatisasi notifikasi transaksi dan kelola bot toko Anda.
            </p>
          </div>
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving || !subInfo.botAllowed}
            className="h-9 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-sm transition-all"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings2 className="w-3.5 h-3.5" />}
            Simpan Konfigurasi
          </Button>
        </div>

        {/* Upgrade Card if not allowed */}
        {!subInfo.botAllowed && (
          <Card className="border-blue-200 bg-blue-50/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Fitur Premium Pro & Prime</h3>
                  <p className="text-xs text-blue-700 leading-relaxed mt-1">
                    Aktifkan bot otomatisasi Telegram untuk mendapatkan notifikasi pesanan masuk secara instan di HP Anda.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 shrink-0 shadow-sm">
                <Link href="/my-shop/subscription">Upgrade Paket Sekarang</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Config Card */}
        <Card className={cn(
          "border-border shadow-sm rounded-2xl bg-white overflow-hidden",
          !subInfo.botAllowed && "opacity-60 pointer-events-none"
        )}>
          <CardHeader className="p-5 border-b border-border/50 bg-[#F8FAFC]/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" /> API Token & Koneksi
              </CardTitle>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} className="data-[state=checked]:bg-blue-500" />
            </div>
            <CardDescription className="text-[11px]">
              Masukkan token bot dari <span className="font-bold">@BotFather</span> di Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Telegram Bot Token</Label>
              <Input
                type="password"
                placeholder="1234567890:ABCdefghIJKLmnopQRSTuvwXYZ..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="h-10 rounded-xl bg-muted/20 border-border font-mono text-[11px]"
              />
              <p className="text-[10px] text-muted-foreground">Token rahasia ini digunakan untuk menghubungkan platform dengan bot Telegram Anda.</p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold gap-1.5 border-border">
                <Zap className="w-3 h-3 text-amber-500" /> Tes Koneksi Bot
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">
                   Cara Buat Bot <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={cn(
          "border-border shadow-sm rounded-2xl bg-white overflow-hidden",
          (!subInfo.botAllowed || !isEnabled) && "opacity-60 pointer-events-none"
        )}>
          <CardHeader className="p-5 border-b border-border/50 bg-[#F8FAFC]/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Pengaturan Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <div className="p-5 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#212121]">Notifikasi Pesanan Baru</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Kirim pesan ke Telegram saat ada pembeli membuat tagihan baru.</p>
                </div>
                <Switch checked={notifyOrder} onCheckedChange={setNotifyOrder} className="data-[state=checked]:bg-[#00AA5B]" />
              </div>

              <div className="p-5 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#212121]">Notifikasi Pembayaran Lunas</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Kirim rincian pendapatan saat pesanan berhasil terbayar otomatis.</p>
                </div>
                <Switch checked={notifyPaid} onCheckedChange={setNotifyPaid} className="data-[state=checked]:bg-[#00AA5B]" />
              </div>

              <div className="p-5 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#212121]">Notifikasi Komplain & Dispute</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Peringatan cepat jika pembeli mengajukan komplain atau sengketa.</p>
                </div>
                <Switch checked={notifyDispute} onCheckedChange={setNotifyDispute} className="data-[state=checked]:bg-[#00AA5B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help / FAQ Card */}
        <Card className="border border-border/60 bg-white rounded-2xl p-5 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-slate-500" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">Cara Menghubungkan Bot:</h4>
              <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal pl-4">
                <li>Buka aplikasi Telegram dan cari <span className="font-bold text-blue-600">@BotFather</span></li>
                <li>Gunakan perintah <code className="bg-slate-100 px-1 rounded">/newbot</code> dan ikuti instruksinya untuk mendapatkan Token.</li>
                <li>Tempelkan Token di kolom atas dan <span className="font-bold">Simpan Konfigurasi</span>.</li>
                <li>Klik tombol <span className="font-bold">"Tes Koneksi"</span> lalu kirimkan perintah <code className="bg-slate-100 px-1 rounded">/start</code> ke bot Anda di Telegram.</li>
              </ol>
            </div>
          </div>
        </Card>

      </div>
    </main>
  );
}
