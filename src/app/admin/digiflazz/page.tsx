"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminDigiFlazzPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDigiFlazz, setSavingDigiFlazz] = useState(false);
  const [checkingDigiFlazz, setCheckingDigiFlazz] = useState(false);

  // Show/hide password states
  const [showDigiFlazzKey, setShowDigiFlazzKey] = useState(false);

  // Data States
  const [digiflazz, setDigiFlazz] = useState({
    mode: "development" as "development" | "production",
    username: "",
    apiKey: "",
    webhookSecret: "",
  });

  const [digiflazzStatus, setDigiFlazzStatus] = useState<{
    success: boolean;
    message: string;
    deposit?: number;
  }>({ success: false, message: "Belum diperiksa" });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Settings
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      if (res.ok && data.settings?.digiflazz) {
        setDigiFlazz(data.settings.digiflazz);
        if (data.digiflazzStatus) setDigiFlazzStatus(data.digiflazzStatus);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Gagal memuat pengaturan DigiFlazz" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Terjadi kesalahan koneksi ke server" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  // Handlers
  const handleSaveDigiFlazz = async () => {
    setSavingDigiFlazz(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_digiflazz",
          digiflazz,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Berhasil", description: "Pengaturan DigiFlazz berhasil disimpan!" });
        handleCheckDigiFlazzBalance();
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.error || "Gagal menyimpan DigiFlazz" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSavingDigiFlazz(false);
    }
  };

  const handleCheckDigiFlazzBalance = async () => {
    setCheckingDigiFlazz(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_digiflazz_balance",
          username: digiflazz.username,
          apiKey: digiflazz.apiKey,
        }),
      });
      const data = await res.json();
      setDigiFlazzStatus(data);
      if (data.success) {
        toast({ title: "Berhasil", description: "Saldo DigiFlazz berhasil diperbarui!" });
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.message || "Gagal cek saldo DigiFlazz" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal terhubung ke DigiFlazz API" });
    } finally {
      setCheckingDigiFlazz(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 hidden md:block">
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> DigiFlazz PPOB
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola kredensial API DigiFlazz dan pantau saldo deposit untuk produk pulsa, paket data, voucher & PPOB.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-[10px] font-bold gap-2 shadow-sm transition-transform active:scale-95"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-amber-600")} /> Refresh
          </Button>
          <Button
            onClick={handleSaveDigiFlazz}
            disabled={savingDigiFlazz}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            {savingDigiFlazz ? "Menyimpan..." : "Simpan DigiFlazz"}
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Live Deposit Balance Card */}
          <div className="lg:col-span-4">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden h-full">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2 text-[#212121]">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Status DigiFlazz
                </CardTitle>
                <Badge variant={digiflazzStatus.success ? "default" : "secondary"} className={cn("text-[8px] font-bold px-2 py-0.5", digiflazzStatus.success ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-slate-100 text-slate-600")}>
                  {digiflazzStatus.success ? "AKTIF" : "OFFLINE"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                <div className="p-3 rounded-xl bg-amber-50/30 border border-amber-100/60 space-y-2">
                  <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-amber-600" /> Saldo Deposit:
                  </span>
                  <div className="text-lg font-bold text-amber-700">
                    {digiflazzStatus.deposit !== undefined
                      ? `Rp ${digiflazzStatus.deposit.toLocaleString("id-ID")}`
                      : "Rp 0"}
                  </div>
                  <p className="text-[9px] text-muted-foreground bg-white p-2 rounded-lg border border-amber-100/60">
                    {digiflazzStatus.message}
                  </p>
                </div>

                <Button
                  onClick={handleCheckDigiFlazzBalance}
                  disabled={checkingDigiFlazz || !digiflazz.username || !digiflazz.apiKey}
                  variant="outline"
                  className="w-full h-8 text-[10px] font-bold border-border/60 hover:bg-slate-50 gap-2 transition-transform active:scale-95"
                >
                  <RefreshCw className={cn("w-3 h-3", checkingDigiFlazz && "animate-spin text-amber-600")} />
                  {checkingDigiFlazz ? "Memeriksa Saldo..." : "Cek Saldo Real-Time"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* DigiFlazz Config Form Card */}
          <div className="lg:col-span-8">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                <CardTitle className="text-[11px] md:text-[12px] font-medium text-[#212121]">Kredensial DigiFlazz PPOB</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-5">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Mode Environment</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      digiflazz.mode === "development" ? "border-amber-500 bg-amber-50/30 text-amber-950 font-bold" : "border-border/50 hover:border-border"
                    )}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="digiflazz_mode"
                          value="development"
                          checked={digiflazz.mode === "development"}
                          onChange={() => setDigiFlazz({ ...digiflazz, mode: "development" })}
                          className="accent-amber-600"
                        />
                        <span className="text-[11px]">Development / Testing</span>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      digiflazz.mode === "production" ? "border-green-500 bg-green-50/30 text-green-950 font-bold" : "border-border/50 hover:border-border"
                    )}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="digiflazz_mode"
                          value="production"
                          checked={digiflazz.mode === "production"}
                          onChange={() => setDigiFlazz({ ...digiflazz, mode: "production" })}
                          className="accent-[#00AA5B]"
                        />
                        <span className="text-[11px]">Production Live</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">DigiFlazz Username</Label>
                  <Input
                    type="text"
                    value={digiflazz.username}
                    onChange={(e) => setDigiFlazz({ ...digiflazz, username: e.target.value })}
                    placeholder="Username DigiFlazz"
                    className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-mono focus:ring-green-500/10"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">DigiFlazz API Key</Label>
                  <div className="relative">
                    <Input
                      type={showDigiFlazzKey ? "text" : "password"}
                      value={digiflazz.apiKey}
                      onChange={(e) => setDigiFlazz({ ...digiflazz, apiKey: e.target.value })}
                      placeholder="dev-api-key atau prod-api-key"
                      className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-mono pr-9 focus:ring-green-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDigiFlazzKey(!showDigiFlazzKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showDigiFlazzKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Webhook Secret Key (Opsional)</Label>
                  <Input
                    type="text"
                    value={digiflazz.webhookSecret}
                    onChange={(e) => setDigiFlazz({ ...digiflazz, webhookSecret: e.target.value })}
                    placeholder="Secret Key Webhook DigiFlazz"
                    className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-mono focus:ring-green-500/10"
                  />
                </div>

                {/* Webhook URL Helper */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-border/50 space-y-1">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">URL Webhook Callback:</span>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-border/30 text-[10px] font-mono text-[#212121]">
                    <span className="truncate">https://marketpoint.id/api/webhooks/digiflazz</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[9px] font-bold px-2 text-[#00AA5B] hover:text-[#00AA5B]/80"
                      onClick={() => {
                        navigator.clipboard.writeText("https://marketpoint.id/api/webhooks/digiflazz");
                        toast({ title: "Berhasil", description: "URL Webhook disalin!" });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
