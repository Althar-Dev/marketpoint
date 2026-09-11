"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminXenditPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingXendit, setSavingXendit] = useState(false);
  const [testingXendit, setTestingXendit] = useState(false);

  // Show/hide password states
  const [showXenditKey, setShowXenditKey] = useState(false);

  // Data States
  const [xendit, setXendit] = useState({
    secretKey: "",
    webhookToken: "",
  });

  const [xenditStatus, setXenditStatus] = useState<{
    success: boolean;
    message: string;
    balance?: number;
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
      if (res.ok && data.settings?.xendit) {
        setXendit(data.settings.xendit);
        if (data.xenditStatus) setXenditStatus(data.xenditStatus);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Gagal memuat pengaturan Xendit" });
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
  const handleSaveXendit = async () => {
    setSavingXendit(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_xendit",
          xendit,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Berhasil", description: "Pengaturan Xendit berhasil disimpan!" });
        handleTestXendit();
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.error || "Gagal menyimpan Xendit" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSavingXendit(false);
    }
  };

  const handleTestXendit = async () => {
    setTestingXendit(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_xendit",
          secretKey: xendit.secretKey,
        }),
      });
      const data = await res.json();
      setXenditStatus(data);
      if (data.success) {
        toast({ title: "Berhasil", description: "Koneksi Xendit Terverifikasi!" });
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.message || "Gagal verifikasi Xendit" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal tes koneksi Xendit" });
    } finally {
      setTestingXendit(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 hidden md:block">
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" /> Gateway Xendit
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola kredensial Secret API Key Xendit dan token webhook callback untuk pembayaran transaksi & berlangganan toko.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-[10px] font-bold gap-2 shadow-sm transition-transform active:scale-95"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#00AA5B]")} /> Refresh
          </Button>
          <Button
            onClick={handleSaveXendit}
            disabled={savingXendit}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            {savingXendit ? "Menyimpan..." : "Simpan Xendit"}
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Status Card */}
          <div className="lg:col-span-4">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden h-full">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] md:text-[12px] font-medium flex items-center gap-2 text-[#212121]">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Status Gateway
                </CardTitle>
                <Badge variant={xenditStatus.success ? "default" : "secondary"} className={cn("text-[8px] font-bold px-2 py-0.5", xenditStatus.success ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600")}>
                  {xenditStatus.success ? "CONNECTED" : "OFFLINE"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground font-medium">Akses API Key:</span>
                    <span className="text-[9px] font-medium flex items-center gap-1">
                      {xenditStatus.success ? (
                        <><CheckCircle2 className="w-3 h-3 text-[#00AA5B]" /> Valid</>
                      ) : (
                        <><XCircle className="w-3 h-3 text-rose-500" /> Belum Terhubung</>
                      )}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono bg-white p-2 rounded-lg border border-border/30 break-all">
                    {xenditStatus.message}
                  </p>
                  {xenditStatus.balance !== undefined && (
                    <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground font-medium">Saldo Active Xendit:</span>
                      <span className="text-xs font-bold text-[#00AA5B]">
                        Rp {xenditStatus.balance.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleTestXendit}
                  disabled={testingXendit || !xendit.secretKey}
                  variant="outline"
                  className="w-full h-8 text-[10px] font-bold border-border/60 hover:bg-slate-50 gap-2 transition-transform active:scale-95"
                >
                  <RefreshCw className={cn("w-3 h-3", testingXendit && "animate-spin text-[#00AA5B]")} />
                  {testingXendit ? "Memeriksa API..." : "Tes Koneksi API"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Config Form Card */}
          <div className="lg:col-span-8">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                <CardTitle className="text-[11px] md:text-[12px] font-medium text-[#212121]">Kredensial Xendit API</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-5">
                {/* Secret Key */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Xendit Secret API Key</Label>
                  <div className="relative">
                    <Input
                      type={showXenditKey ? "text" : "password"}
                      value={xendit.secretKey}
                      onChange={(e) => setXendit({ ...xendit, secretKey: e.target.value })}
                      placeholder="xnd_development_... atau xnd_production_..."
                      className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-mono pr-9 focus:ring-green-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowXenditKey(!showXenditKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showXenditKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Webhook Token */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Webhook Verification Token</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={xendit.webhookToken}
                      onChange={(e) => setXendit({ ...xendit, webhookToken: e.target.value })}
                      placeholder="Token callback dari dashboard Xendit"
                      className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-mono pr-9 focus:ring-green-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (xendit.webhookToken) {
                          navigator.clipboard.writeText(xendit.webhookToken);
                          toast({ title: "Berhasil", description: "Webhook Token disalin!" });
                        }
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Webhook URL Helper */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-border/50 space-y-1">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">URL Webhook Callback:</span>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-border/30 text-[10px] font-mono text-[#212121]">
                    <span className="truncate">https://marketpoint.id/api/webhooks/xendit</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[9px] font-bold px-2 text-[#00AA5B] hover:text-[#00AA5B]/80"
                      onClick={() => {
                        navigator.clipboard.writeText("https://marketpoint.id/api/webhooks/xendit");
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
