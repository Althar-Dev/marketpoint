"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Palette,
  TrendingUp,
  Gamepad2,
  Server,
  Smartphone,
  Search,
  Layers,
  Info,
  RotateCcw,
  CheckCheck
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DigiFlazzConfigPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("credentials");

  // Credentials States
  const [savingDigiFlazz, setSavingDigiFlazz] = useState(false);
  const [checkingDigiFlazz, setCheckingDigiFlazz] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showDigiFlazzKey, setShowDigiFlazzKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Firestore Document Binding for Credentials
  const digiflazzDocRef = useMemoFirebase(() => doc(db, "settings", "digiflazz"), [db]);
  const { data: digiflazzData, loading: digiflazzLoading } = useDoc(digiflazzDocRef);

  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const mode = "production";
  const [webhookSecret, setWebhookSecret] = useState("");

  const [digiflazzStatus, setDigiFlazzStatus] = useState<{
    success: boolean;
    message: string;
    deposit?: number;
  }>({ success: false, message: "Belum diperiksa" });

  // Product Input Configuration States
  const [visualsConfig, setVisualsConfig] = useState<any>({ brands: {} });
  const [brandsList, setBrandsList] = useState<{ brand: string; category: string; count: number }[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [savingProductConfig, setSavingProductConfig] = useState(false);

  // Selected Brand & Form States
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [targetType, setTargetType] = useState<"id_only" | "id_server" | "phone_only" | "meter_only" | "auto">("auto");

  useEffect(() => {
    setMounted(true);
    fetchInitialConfig();
    fetchBrandsAndVisuals();
  }, []);

  const fetchBrandsAndVisuals = async () => {
    setLoadingBrands(true);
    try {
      const [visRes, markupRes] = await Promise.all([
        fetch("/api/admin/digiflazz/visuals"),
        fetch("/api/admin/digiflazz/markup"),
      ]);
      const visData = await visRes.json();
      if (visData.success && visData.data) {
        setVisualsConfig(visData.data);
      }
      const markupData = await markupRes.json();
      if (markupData.success && Array.isArray(markupData.brands)) {
        setBrandsList(markupData.brands);
        // Default select first game if none selected
        if (markupData.brands.length > 0 && !selectedBrand) {
          const firstGame = markupData.brands.find((b: any) =>
            b.category.toLowerCase().includes("game")
          ) || markupData.brands[0];
          handleSelectBrand(firstGame.brand, visData.data);
        }
      }
    } catch (e) {
      console.warn("Gagal memuat data visual & brand:", e);
    } finally {
      setLoadingBrands(false);
    }
  };

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

  const handleSelectBrand = (brandName: string, customVisuals?: any) => {
    setSelectedBrand(brandName);
    const vis = customVisuals || visualsConfig;
    const cfg = vis?.brands?.[brandName] || {};

    if (cfg.targetType) {
      setTargetType(cfg.targetType);
    } else {
      const bLower = brandName.toLowerCase();
      const matchedBrandObj = brandsList.find((b) => b.brand.toLowerCase() === bLower);
      const catLower = (matchedBrandObj?.category || "").toLowerCase();

      if (
        bLower.includes("mobile legend") ||
        bLower.includes("lifeafter") ||
        bLower.includes("genshin") ||
        bLower.includes("ragnarok") ||
        bLower.includes("point blank")
      ) {
        setTargetType("id_server");
      } else if (
        catLower.includes("game") ||
        catLower.includes("voucher") ||
        bLower.includes("free fire") ||
        bLower.includes("pubg") ||
        bLower.includes("valorant")
      ) {
        setTargetType("id_only");
      } else if (catLower.includes("pln") || bLower.includes("pln")) {
        setTargetType("meter_only");
      } else {
        setTargetType("phone_only");
      }
    }
  };

  const handleSaveProductConfig = async () => {
    if (!selectedBrand) {
      toast({
        variant: "destructive",
        title: "Pilih Brand",
        description: "Silakan pilih salah satu produk / brand terlebih dahulu.",
      });
      return;
    }

    setSavingProductConfig(true);
    try {
      const currentBrandCfg = visualsConfig.brands?.[selectedBrand] || {};
      const updatedBrands = {
        ...(visualsConfig.brands || {}),
        [selectedBrand]: {
          ...currentBrandCfg,
          targetType: targetType === "auto" ? undefined : targetType,
          updatedAt: new Date().toISOString(),
        },
      };

      const cleanBrandObj = Object.fromEntries(
        Object.entries(updatedBrands[selectedBrand]).filter(([_, v]) => v !== undefined)
      );
      updatedBrands[selectedBrand] = cleanBrandObj;

      const payload = {
        ...visualsConfig,
        brands: updatedBrands,
      };

      const res = await fetch("/api/admin/digiflazz/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setVisualsConfig(payload);
        toast({
          title: "Berhasil Disimpan",
          description: `Format input "${selectedBrand}" berhasil diperbarui.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: data.error || "Gagal menyimpan konfigurasi produk.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menghubungi server.",
      });
    } finally {
      setSavingProductConfig(false);
    }
  };

  const handleResetProductConfig = async (brandName: string) => {
    if (!brandName) return;
    setSavingProductConfig(true);
    try {
      const currentBrandCfg = visualsConfig.brands?.[brandName] || {};
      const {
        targetType: _t,
        idLabel: _il,
        idPlaceholder: _ip,
        serverLabel: _sl,
        serverPlaceholder: _sp,
        helperText: _ht,
        ...restBrandCfg
      } = currentBrandCfg;

      const updatedBrands = {
        ...(visualsConfig.brands || {}),
        [brandName]: restBrandCfg,
      };

      const payload = {
        ...visualsConfig,
        brands: updatedBrands,
      };

      const res = await fetch("/api/admin/digiflazz/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setVisualsConfig(payload);
        if (selectedBrand === brandName) {
          setTargetType("auto");
        }
        toast({
          title: "Format Direset",
          description: `Format input "${brandName}" dikembalikan ke default otomatis.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Reset",
        description: err.message || "Gagal mengembalikan pengaturan.",
      });
    } finally {
      setSavingProductConfig(false);
    }
  };

  // Filtered Brands for the Master List
  const filteredBrands = useMemo(() => {
    let list = brandsList;

    if (categoryFilter === "games") {
      list = list.filter((b) => b.category.toLowerCase().includes("game") || b.category.toLowerCase().includes("voucher"));
    } else if (categoryFilter === "pulsa") {
      list = list.filter((b) => b.category.toLowerCase().includes("pulsa") || b.category.toLowerCase().includes("data"));
    } else if (categoryFilter === "pln") {
      list = list.filter((b) => b.category.toLowerCase().includes("pln") || b.brand.toLowerCase().includes("pln"));
    } else if (categoryFilter === "configured") {
      list = list.filter((b) => visualsConfig?.brands?.[b.brand]?.targetType);
    }

    if (brandSearchQuery.trim()) {
      const q = brandSearchQuery.toLowerCase();
      list = list.filter((b) => b.brand.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    }

    return list;
  }, [brandsList, categoryFilter, brandSearchQuery, visualsConfig]);

  const configuredCount = useMemo(() => {
    if (!visualsConfig?.brands) return 0;
    return Object.values(visualsConfig.brands).filter((b: any) => b && b.targetType).length;
  }, [visualsConfig]);

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#212121] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#00AA5B]" /> Konfigurasi DigiFlazz
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola integrasi kredensial API, webhook callback, dan format input checkout produk.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl h-10 inline-flex">
          <TabsTrigger
            value="credentials"
            className="rounded-lg text-xs font-semibold px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
            Kredensial & Integrasi API
          </TabsTrigger>
          <TabsTrigger
            value="product_inputs"
            className="rounded-lg text-xs font-semibold px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-blue-600" />
            Format Input Produk & Game
            {configuredCount > 0 && (
              <Badge className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 h-4 rounded-full border-0">
                {configuredCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: KREDENSIAL API */}
        <TabsContent value="credentials" className="space-y-5 focus-visible:outline-none">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Card className="border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Status API
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-semibold px-2 py-0.5",
                      digiflazzStatus.success
                        ? "border-green-200 text-green-700 bg-green-50"
                        : "border-amber-200 text-amber-700 bg-amber-50"
                    )}
                  >
                    {digiflazzStatus.success ? "VERIFIED" : "UNVERIFIED"}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-slate-800 truncate">
                    {digiflazzStatus.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span>Terverifikasi</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs truncate">{digiflazzStatus.message}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Kredensial DigiFlazz
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" /> Saldo Deposit
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCheckDigiFlazzBalance(username, apiKey, false)}
                    disabled={checkingDigiFlazz || !username || !apiKey}
                    className="h-6 px-2 text-[10px] font-semibold text-[#00AA5B] hover:bg-green-50"
                  >
                    {checkingDigiFlazz ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Cek Saldo
                  </Button>
                </div>
                <div>
                  <div className="text-base sm:text-xl font-black text-[#00AA5B] tracking-tight truncate">
                    {digiflazzStatus.deposit !== undefined
                      ? `Rp ${digiflazzStatus.deposit.toLocaleString("id-ID")}`
                      : "Rp 0"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Saldo aktif reseller
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm rounded-xl bg-white overflow-hidden col-span-2 lg:col-span-1">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Webhook Callback
                  </span>
                  <button
                    onClick={copyWebhookUrl}
                    className="text-[9px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                  >
                    {copiedWebhook ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedWebhook ? "Tersalin" : "Salin URL"}
                  </button>
                </div>
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-700 truncate">
                    /api/webhooks/digiflazz
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Webhook update status transaksi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form & Guides */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <Card className="border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/40 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs md:text-sm font-semibold text-[#212121] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Kredensial DigiFlazz API
                  </CardTitle>
                  <Button
                    onClick={handleSaveDigiFlazz}
                    disabled={savingDigiFlazz || digiflazzLoading}
                    size="sm"
                    className="h-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-medium rounded-lg text-xs gap-1.5"
                  >
                    {savingDigiFlazz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Simpan Konfigurasi
                  </Button>
                </CardHeader>

                <CardContent className="p-4 md:p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Username DigiFlazz</Label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username akun DigiFlazz"
                      className="h-9 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Production API Key</Label>
                    <div className="relative">
                      <Input
                        type={showDigiFlazzKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Masukkan Production API Key DigiFlazz"
                        className="h-9 pr-10 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium"
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Webhook Secret Key (Opsional)</Label>
                    <div className="relative">
                      <Input
                        type={showWebhookSecret ? "text" : "password"}
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="Masukkan Webhook Secret Key dari dashboard DigiFlazz"
                        className="h-9 pr-10 rounded-xl bg-slate-50/50 border-border/60 text-xs font-medium"
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

                  <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
                    <span className="font-medium text-slate-600">Mode API Aktif</span>
                    <Badge className="bg-green-600 text-white font-medium text-[10px] px-2.5 py-0.5 rounded-full">
                      Production Mode
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <Card className="border-border/50 shadow-sm rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#00AA5B] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                      MARGIN & MARKUP
                    </Badge>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Markup Harga & Keuntungan</h4>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Atur margin keuntungan per kategori, per brand, atau global produk.
                  </p>
                  <Button asChild size="sm" className="w-full bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-semibold text-xs rounded-lg h-8">
                    <Link href="/admin/digiflazz/markup">Buka Pengaturan Markup</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm rounded-xl bg-white overflow-hidden">
                <CardHeader className="p-4 border-b border-border/30 bg-slate-50/30">
                  <CardTitle className="text-xs font-semibold text-[#212121]">
                    Petunjuk Webhook DigiFlazz
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <p>1. Buka dashboard mitra DigiFlazz pada menu <strong>Pengaturan &gt; Webhook</strong>.</p>
                  <p>2. Salin URL berikut dan tempelkan pada kolom webhook:</p>
                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-800 select-all">
                    {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/digiflazz
                  </div>
                  <p>3. Masukkan Secret Key ke formulir di samping untuk verifikasi signature.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: FORMAT INPUT PRODUK & GAME (MASTER-DETAIL LAYOUT) */}
        <TabsContent value="product_inputs" className="space-y-4 focus-visible:outline-none">
          {/* Master-Detail Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT: BRAND LIST (4 Cols) */}
            <Card className="lg:col-span-4 border-border/60 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="p-3.5 border-b border-border/40 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00AA5B]" />
                    Pilih Produk / Brand
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {filteredBrands.length} Brand
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={brandSearchQuery}
                    onChange={(e) => setBrandSearchQuery(e.target.value)}
                    placeholder="Cari brand (MLBB, FF, PLN)..."
                    className="h-8 pl-8 rounded-lg bg-white border-border/60 text-xs font-normal"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "all", label: "Semua" },
                    { id: "games", label: "Games" },
                    { id: "pulsa", label: "Pulsa" },
                    { id: "pln", label: "PLN" },
                    { id: "configured", label: "Kustom" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCategoryFilter(f.id)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors",
                        categoryFilter === f.id
                          ? "bg-slate-800 text-white font-semibold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </CardHeader>

              {/* Scrollable Brand List */}
              <div className="max-h-[580px] overflow-y-auto divide-y divide-border/30">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((b) => {
                    const isSelected = selectedBrand.toLowerCase() === b.brand.toLowerCase();
                    const cfg = visualsConfig?.brands?.[b.brand];
                    const customType = cfg?.targetType;

                    return (
                      <button
                        key={`${b.brand}-${b.category}`}
                        type="button"
                        onClick={() => handleSelectBrand(b.brand)}
                        className={cn(
                          "w-full text-left p-3 transition-colors flex items-center justify-between gap-2",
                          isSelected
                            ? "bg-emerald-50/80 border-l-4 border-l-[#00AA5B]"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs truncate", isSelected ? "font-bold text-emerald-900" : "font-medium text-slate-800")}>
                            {b.brand}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {b.category || "Umum"}
                          </p>
                        </div>

                        {/* Format Pill */}
                        <div className="shrink-0 text-right">
                          {customType ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-semibold px-1.5 py-0 h-4 rounded-md border",
                                customType === "id_server"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : customType === "id_only"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : customType === "meter_only"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {customType === "id_server"
                                ? "ID + Server"
                                : customType === "id_only"
                                  ? "ID Saja"
                                  : customType === "meter_only"
                                    ? "PLN"
                                    : "No HP"}
                            </Badge>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-normal">
                              Auto
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Tidak ada brand yang sesuai.
                  </div>
                )}
              </div>
            </Card>

            {/* RIGHT: BRAND CONFIGURATION PANEL (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedBrand ? (
                <Card className="border-border/60 shadow-sm rounded-xl bg-white overflow-hidden">
                  <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/40 flex flex-row items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm md:text-base font-bold text-slate-900">
                          {selectedBrand}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-medium text-slate-600 bg-white">
                          {brandsList.find((b) => b.brand.toLowerCase() === selectedBrand.toLowerCase())?.category || "Produk"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tentukan kolom formulir yang harus diisi pembeli saat memesan {selectedBrand}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {visualsConfig?.brands?.[selectedBrand]?.targetType && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetProductConfig(selectedBrand)}
                          disabled={savingProductConfig}
                          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </Button>
                      )}
                      <Button
                        onClick={handleSaveProductConfig}
                        disabled={savingProductConfig}
                        size="sm"
                        className="h-8 px-3.5 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-medium text-xs rounded-lg gap-1.5 shadow-xs"
                      >
                        {savingProductConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Format
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 md:p-6 space-y-5">
                    {/* FORMAT SELECTION: 4 COMPACT RADIO TILES */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700">
                        Format Input Pembeli
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* 1: Hanya ID */}
                        <div
                          onClick={() => setTargetType("id_only")}
                          className={cn(
                            "cursor-pointer p-3 rounded-xl border transition-all flex items-start justify-between gap-2",
                            targetType === "id_only"
                              ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/30"
                              : "bg-white border-border/70 hover:bg-slate-50"
                          )}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Gamepad2 className="w-4 h-4 text-blue-600 shrink-0" />
                              Hanya User ID (1 Input)
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Free Fire, PUBG, Valorant, Point Blank.
                            </p>
                          </div>
                          {targetType === "id_only" && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* 2: ID & Server */}
                        <div
                          onClick={() => setTargetType("id_server")}
                          className={cn(
                            "cursor-pointer p-3 rounded-xl border transition-all flex items-start justify-between gap-2",
                            targetType === "id_server"
                              ? "bg-purple-50/60 border-purple-500 ring-1 ring-purple-500/30"
                              : "bg-white border-border/70 hover:bg-slate-50"
                          )}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Server className="w-4 h-4 text-purple-600 shrink-0" />
                              User ID & Server ID (2 Input)
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Mobile Legends, Genshin Impact, LifeAfter.
                            </p>
                          </div>
                          {targetType === "id_server" && (
                            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* 3: Nomor HP */}
                        <div
                          onClick={() => setTargetType("phone_only")}
                          className={cn(
                            "cursor-pointer p-3 rounded-xl border transition-all flex items-start justify-between gap-2",
                            targetType === "phone_only"
                              ? "bg-emerald-50/60 border-emerald-500 ring-1 ring-emerald-500/30"
                              : "bg-white border-border/70 hover:bg-slate-50"
                          )}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                              Nomor HP / Seluler (1 Input)
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Pulsa Reguler, Paket Data, Kuota Internet.
                            </p>
                          </div>
                          {targetType === "phone_only" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* 4: No. Meter PLN */}
                        <div
                          onClick={() => setTargetType("meter_only")}
                          className={cn(
                            "cursor-pointer p-3 rounded-xl border transition-all flex items-start justify-between gap-2",
                            targetType === "meter_only"
                              ? "bg-amber-50/60 border-amber-500 ring-1 ring-amber-500/30"
                              : "bg-white border-border/70 hover:bg-slate-50"
                          )}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                              No. Meter PLN (1 Input)
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              Token Listrik PLN & Tagihan Listrik.
                            </p>
                          </div>
                          {targetType === "meter_only" && (
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Default Auto Option */}
                      <button
                        type="button"
                        onClick={() => setTargetType("auto")}
                        className={cn(
                          "w-full px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between",
                          targetType === "auto"
                            ? "bg-slate-100 border-slate-400 text-slate-800"
                            : "bg-slate-50 border-border/60 text-muted-foreground hover:bg-slate-100"
                        )}
                      >
                        <span className="text-[11px]">Gunakan Otomatis Sistem (Deteksi bawaan sistem berdasarkan kategori)</span>
                        {targetType === "auto" && <Check className="w-3.5 h-3.5 text-slate-700" />}
                      </button>
                    </div>

                    {/* LIVE CUSTOMER PREVIEW BOX */}
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#00AA5B]" />
                          Pratinjau Tampilan Pembeli (Step 1)
                        </Label>
                        <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Live Preview
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border/70 bg-slate-50/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#00AA5B] text-white flex items-center justify-center text-[10px] font-bold">
                            1
                          </div>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {targetType === "id_server"
                              ? "Masukkan Data Akun & Server Game"
                              : targetType === "id_only"
                                ? "Masukkan User ID Akun Game"
                                : targetType === "meter_only"
                                  ? "Masukkan Nomor Meter / ID PLN"
                                  : "Masukkan Nomor HP Tujuan"}
                          </span>
                        </div>

                        <div className={cn(targetType === "id_server" ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "w-full space-y-1")}>
                          <div className="space-y-1 w-full">
                            <span className="text-[10px] font-medium text-slate-600 block">
                              {targetType === "meter_only"
                                ? "ID Pelanggan PLN / No. Meter"
                                : targetType === "phone_only"
                                  ? "Nomor HP"
                                  : "User ID / Game ID"}
                            </span>
                            <div className="h-8 px-3 rounded-lg bg-white border border-border/70 text-xs text-muted-foreground flex items-center w-full">
                              {targetType === "meter_only"
                                ? "11 Digit ID Pelanggan"
                                : targetType === "phone_only"
                                  ? "Contoh: 08123456789"
                                  : "Contoh: 12345678"}
                            </div>
                          </div>

                          {targetType === "id_server" && (
                            <div className="space-y-1 w-full">
                              <span className="text-[10px] font-medium text-slate-600 block">
                                Zone ID / Server
                              </span>
                              <div className="h-8 px-3 rounded-lg bg-white border border-border/70 text-xs text-muted-foreground flex items-center w-full">
                                Zone ID (Contoh: 1234)
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                          <Info className="w-3 h-3 text-[#00AA5B] shrink-0" />
                          <span className="truncate">
                            {targetType === "id_server"
                              ? "User ID & Zone ID / Server dapat dilihat pada profil akun game Anda."
                              : targetType === "id_only"
                                ? "User ID dapat dilihat pada menu profil game Anda."
                                : targetType === "meter_only"
                                  ? "Pastikan No. Meter atau ID Pelanggan PLN sudah benar."
                                  : "Pastikan nomor tujuan pengisian sudah benar dan aktif."}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-12 border border-dashed border-border/80 rounded-xl bg-white text-center space-y-2">
                  <Gamepad2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Pilih Brand di Sebelah Kiri</p>
                  <p className="text-[11px] text-muted-foreground">
                    Klik nama brand dari daftar sebelah kiri untuk mengatur format input produk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
