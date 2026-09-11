"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Percent,
  RefreshCw,
  Save,
  Crown,
  Sparkles,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminCommissionsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingCommissions, setSavingCommissions] = useState(false);

  // Data States
  const [commissions, setCommissions] = useState({
    free: 5.0,
    plus: 3.0,
    pro: 1.5,
    prime: 0.0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Settings
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();
      if (res.ok && data.settings?.commissions) {
        setCommissions(data.settings.commissions);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Gagal memuat pengaturan komisi" });
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
  const handleSaveCommissions = async () => {
    setSavingCommissions(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_commissions",
          commissions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Berhasil", description: "Potongan komisi berhasil diperbarui!" });
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.error || "Gagal menyimpan komisi" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setSavingCommissions(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 hidden md:block">
          <h2 className="text-base md:text-lg font-medium tracking-tight text-[#212121] flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#00AA5B]" /> Komisi Penjual
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola tarif persentase potongan komisi platform berdasarkan level paket berlangganan toko.
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
            onClick={handleSaveCommissions}
            disabled={savingCommissions}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            {savingCommissions ? "Menyimpan..." : "Simpan Komisi"}
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl space-y-4">
        <div className="p-4 bg-white rounded-xl border border-border/50 shadow-sm flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-[#2E3137]">Tarif Komisi Otomatis per Level Toko</p>
            <p className="text-[9px] text-muted-foreground font-medium">
              Persentase komisi ini dipotong secara otomatis dari total nilai transaksi saat penjual menyelesaikan pesanan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Free Tier */}
          <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-border/30 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold text-[8px] px-2 py-0.5">
                  FREE TIER
                </Badge>
                <span className="text-[9px] text-muted-foreground font-medium">Gratis 0/bln</span>
              </div>
              <CardTitle className="text-[11px] md:text-[12px] font-medium text-[#212121] mt-2">
                Toko Regular
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Potongan Komisi (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissions.free}
                    onChange={(e) => setCommissions({ ...commissions, free: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg bg-slate-50/50 border-border/50 text-[11px] font-bold pr-7 text-[#212121] focus:ring-green-500/10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Simulasi Transaksi Rp 100rb</p>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Komisi Admin:</span>
                  <span className="font-bold text-rose-600">Rp {(100000 * (commissions.free / 100)).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Diterima Toko:</span>
                  <span className="font-bold text-[#00AA5B]">Rp {(100000 * (1 - commissions.free / 100)).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plus Tier */}
          <Card className="border-blue-100 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-blue-50 bg-blue-50/20">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-bold text-[8px] px-2 py-0.5">
                  PLUS TIER
                </Badge>
                <span className="text-[9px] font-bold text-blue-600">Rp 29rb/bln</span>
              </div>
              <CardTitle className="text-[11px] md:text-[12px] font-medium text-blue-950 mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Fitur Plus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Potongan Komisi (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissions.plus}
                    onChange={(e) => setCommissions({ ...commissions, plus: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg bg-blue-50/20 border-blue-200 text-[11px] font-bold pr-7 text-blue-900 focus:ring-blue-500/10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 space-y-1">
                <p className="text-[8px] font-medium text-blue-700 uppercase tracking-wider">Simulasi Transaksi Rp 100rb</p>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Komisi Admin:</span>
                  <span className="font-bold text-rose-600">Rp {(100000 * (commissions.plus / 100)).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Diterima Toko:</span>
                  <span className="font-bold text-[#00AA5B]">Rp {(100000 * (1 - commissions.plus / 100)).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="border-purple-100 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-purple-50 bg-purple-50/20">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 font-bold text-[8px] px-2 py-0.5">
                  PRO TIER
                </Badge>
                <span className="text-[9px] font-bold text-purple-600">Rp 49rb/bln</span>
              </div>
              <CardTitle className="text-[11px] md:text-[12px] font-medium text-purple-950 mt-2 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-purple-500" /> Paket Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Potongan Komisi (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissions.pro}
                    onChange={(e) => setCommissions({ ...commissions, pro: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg bg-purple-50/20 border-purple-200 text-[11px] font-bold pr-7 text-purple-900 focus:ring-purple-500/10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/60 space-y-1">
                <p className="text-[8px] font-medium text-purple-700 uppercase tracking-wider">Simulasi Transaksi Rp 100rb</p>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Komisi Admin:</span>
                  <span className="font-bold text-rose-600">Rp {(100000 * (commissions.pro / 100)).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Diterima Toko:</span>
                  <span className="font-bold text-[#00AA5B]">Rp {(100000 * (1 - commissions.pro / 100)).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prime Tier */}
          <Card className="border-amber-200 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-amber-100 bg-amber-50/30">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500 text-white font-bold text-[8px] px-2 py-0.5">
                  PRIME TIER
                </Badge>
                <span className="text-[9px] font-bold text-amber-700">Rp 149rb/bln</span>
              </div>
              <CardTitle className="text-[11px] md:text-[12px] font-medium text-amber-950 mt-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Paket Prime
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Potongan Komisi (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissions.prime}
                    onChange={(e) => setCommissions({ ...commissions, prime: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg bg-amber-50/20 border-amber-200 text-[11px] font-bold pr-7 text-amber-950 focus:ring-amber-500/10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                <p className="text-[8px] font-medium text-amber-800 uppercase tracking-wider">Simulasi Transaksi Rp 100rb</p>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Komisi Admin:</span>
                  <span className="font-bold text-rose-600">Rp {(100000 * (commissions.prime / 100)).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-muted-foreground">Diterima Toko:</span>
                  <span className="font-bold text-[#00AA5B]">Rp {(100000 * (1 - commissions.prime / 100)).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
