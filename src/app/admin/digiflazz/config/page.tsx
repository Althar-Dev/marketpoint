"use client";

import React, { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Save,
  Eye,
  EyeOff,
  Wallet,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Settings2,
  RefreshCw,
  Palette
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DigiFlazzConfigPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [savingDigiFlazz, setSavingDigiFlazz] = useState(false);
  const [checkingDigiFlazz, setCheckingDigiFlazz] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Show/hide password state
  const [showDigiFlazzKey, setShowDigiFlazzKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Firestore Document Binding for Credentials
  const digiflazzDocRef = useMemoFirebase(() => doc(db, "settings", "digiflazz"), [db]);
  const { data: digiflazzData, loading: digiflazzLoading } = useDoc(digiflazzDocRef);

  // Local Form States
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const mode = "production";
  const [webhookSecret, setWebhookSecret] = useState("");

  const [digiflazzStatus, setDigiFlazzStatus] = useState<{
    success: boolean;
    message: string;
    deposit?: number;
  }>({ success: false, message: "Belum diperiksa" });

  useEffect(() => {
    setMounted(true);
    fetchInitialConfig();
  }, []);

  const fetchInitialConfig = async () => {
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      if (data.settings?.digiflazz) {
        setUsername((prev) => prev || data.settings.digiflazz.username || "");
        setApiKey((prev) => prev || data.settings.digiflazz.apiKey || "");
        setWebhookSecret((prev) => prev || data.settings.digiflazz.webhookSecret || "");
      }
      if (data.digiflazzStatus) {
        setDigiFlazzStatus(data.digiflazzStatus);
      }
    } catch (e) {
      console.warn("Gagal memuat status integrasi DigiFlazz:", e);
    }
  };

  useEffect(() => {
    if (digiflazzData) {
      const u = digiflazzData.username || "";
      const k = digiflazzData.apiKey || "";
      setUsername(u);
      setApiKey(k);
      setWebhookSecret(digiflazzData.webhookSecret || "");

      if (u && k && !digiflazzStatus.success) {
        handleCheckDigiFlazzBalance(u, k, true);
      }
    }
  }, [digiflazzData]);

  // Handlers
  const handleSaveDigiFlazz = async () => {
    if (!mounted) return;
    setSavingDigiFlazz(true);
    try {
      await setDoc(digiflazzDocRef, {
        username,
        apiKey,
        mode,
        webhookSecret,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Also update backend platform settings
      await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_digiflazz",
          digiflazz: { username, apiKey, mode, webhookSecret },
        }),
      });

      toast({ title: "Berhasil", description: "Konfigurasi DigiFlazz berhasil disimpan!" });
      handleCheckDigiFlazzBalance(username, apiKey, false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan konfigurasi DigiFlazz." });
    } finally {
      setSavingDigiFlazz(false);
    }
  };

  const handleCheckDigiFlazzBalance = async (customUser?: string, customKey?: string, silent: boolean = false) => {
    const targetUser = customUser || username;
    const targetKey = customKey || apiKey;
    if (!targetUser || !targetKey) return;

    setCheckingDigiFlazz(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_digiflazz_balance",
          username: targetUser,
          apiKey: targetKey,
        }),
      });
      const data = await res.json();
      setDigiFlazzStatus(data);
      if (!silent) {
        if (data.success) {
          toast({ title: "Berhasil Verifikasi", description: "Koneksi & Kredensial DigiFlazz Terverifikasi!" });
        } else {
          toast({ variant: "destructive", title: "Gagal Verifikasi", description: data.message });
        }
      }
    } catch (err: any) {
      if (!silent) {
        toast({ variant: "destructive", title: "Gagal", description: "Gagal menghubungi API DigiFlazz" });
      }
    } finally {
      setCheckingDigiFlazz(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhooks/digiflazz`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    toast({ title: "Tersalin!", description: "URL Webhook Callback berhasil disalin ke clipboard." });
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#00AA5B]" /> DigiFlazz Config & Integrasi
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola Username, API Key, Webhook Secret, dan pantau saldo deposit DigiFlazz PPOB.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards (2 cards per row on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
        {/* Status Koneksi */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 shrink-0" /> Status API
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 shrink-0",
                  digiflazzStatus.success
                    ? "border-green-200 text-green-700 bg-green-50"
                    : "border-amber-200 text-amber-700 bg-amber-50"
                )}
              >
                {digiflazzStatus.success ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs sm:text-sm md:text-base font-bold text-slate-800 truncate">
                {digiflazzStatus.success ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="truncate">Terverifikasi</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[10px] sm:text-xs truncate">{digiflazzStatus.message}</span>
                  </>
                )}
              </div>
              <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate mt-0.5">
                Kredensial DigiFlazz
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Realtime Balance */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <Wallet className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#00AA5B] shrink-0" /> Saldo Deposit
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCheckDigiFlazzBalance(username, apiKey, false)}
                disabled={checkingDigiFlazz || !username || !apiKey}
                className="h-5 sm:h-6 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-bold text-[#00AA5B] hover:bg-green-50 shrink-0"
              >
                {checkingDigiFlazz ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5 mr-0.5" />}
                Cek Saldo
              </Button>
            </div>
            <div>
              <div className="text-xs sm:text-base md:text-xl font-black text-[#00AA5B] tracking-tight truncate">
                {digiflazzStatus.deposit !== undefined
                  ? `Rp ${digiflazzStatus.deposit.toLocaleString("id-ID")}`
                  : "Rp 0"}
              </div>
              <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate mt-0.5">
                Saldo aktif reseller
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Endpoint */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600 shrink-0" /> Webhook Callback
              </span>
              <button
                onClick={copyWebhookUrl}
                className="text-[8px] sm:text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors shrink-0"
              >
                {copiedWebhook ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                {copiedWebhook ? "Tersalin" : "Salin URL"}
              </button>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 truncate">
                /api/webhooks/digiflazz
              </div>
              <p className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate mt-0.5">
                Webhook status transaksi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Config Form & Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* Left: Credential Form */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-bold text-[#212121] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Kredensial DigiFlazz API
              </CardTitle>
              <Button
                onClick={handleSaveDigiFlazz}
                disabled={savingDigiFlazz || digiflazzLoading}
                size="sm"
                className="h-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-lg text-xs gap-1.5"
              >
                {savingDigiFlazz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Simpan Konfigurasi
              </Button>
            </CardHeader>

            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Username DigiFlazz</Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username akun DigiFlazz"
                  className="h-9 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium focus:ring-[#00AA5B]/20"
                />
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Production API Key</Label>
                <div className="relative">
                  <Input
                    type={showDigiFlazzKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan Production API Key DigiFlazz"
                    className="h-9 pr-10 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium focus:ring-[#00AA5B]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDigiFlazzKey(!showDigiFlazzKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showDigiFlazzKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Webhook Secret Key (Opsional)</Label>
                <div className="relative">
                  <Input
                    type={showWebhookSecret ? "text" : "password"}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Masukkan Webhook Secret Key dari dashboard DigiFlazz"
                    className="h-9 pr-10 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium focus:ring-[#00AA5B]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* API Mode Indicator */}
              <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
                <span className="font-bold text-slate-600">Mode API Aktif</span>
                <Badge className="bg-green-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  Production Mode
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Info & Guide */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-[#00AA5B] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  VISUAL STYLE
                </Badge>
                <Palette className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Icon & Background Produk</h4>
                <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
                  Atur skema warna gradient background, logo icon provider/game (Telkomsel, XL, PLN, MLBB, dll), dan badge promo.
                </p>
              </div>
              <Button asChild size="sm" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl h-9">
                <Link href="/admin/digiflazz/visuals">
                  Buka Pengaturan Visual
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-border/30 bg-slate-50/30">
              <CardTitle className="text-xs md:text-sm font-bold text-[#212121]">
                Petunjuk Integrasi Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                1. Buka dashboard mitra DigiFlazz pada menu <strong>Pengaturan &gt; Webhook</strong>.
              </p>
              <p>
                2. Tempelkan URL webhook callback berikut:
              </p>
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-800 break-all select-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/digiflazz
              </div>
              <p>
                3. Salin <strong>Secret Key</strong> yang diberikan oleh DigiFlazz lalu simpan pada formulir di samping untuk memverifikasi autentikasi signature data transaksi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
