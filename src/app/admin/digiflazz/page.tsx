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
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Wallet,
  Loader2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminDigiFlazzPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [savingDigiFlazz, setSavingDigiFlazz] = useState(false);
  const [checkingDigiFlazz, setCheckingDigiFlazz] = useState(false);

  // Show/hide password state
  const [showDigiFlazzKey, setShowDigiFlazzKey] = useState(false);

  // Firestore Document Binding
  const digiflazzDocRef = useMemoFirebase(() => doc(db, "settings", "digiflazz"), [db]);
  const { data: digiflazzData, loading: digiflazzLoading } = useDoc(digiflazzDocRef);

  // Local Form States
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [digiflazzStatus, setDigiFlazzStatus] = useState<{
    success: boolean;
    message: string;
    deposit?: number;
  }>({ success: false, message: "Belum diperiksa" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (digiflazzData) {
      setUsername(digiflazzData.username || "");
      setApiKey(digiflazzData.apiKey || "");
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
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Berhasil", description: "Konfigurasi DigiFlazz disimpan ke Firestore!" });
      handleCheckDigiFlazzBalance();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan. Pastikan Anda memiliki akses Admin." });
    } finally {
      setSavingDigiFlazz(false);
    }
  };

  const handleCheckDigiFlazzBalance = async () => {
    if (!username || !apiKey) return;
    setCheckingDigiFlazz(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_digiflazz_balance",
          username,
          apiKey,
        }),
      });
      const data = await res.json();
      setDigiFlazzStatus(data);
      if (data.success) {
        toast({ title: "Berhasil", description: "Koneksi DigiFlazz Terverifikasi!" });
      } else {
        toast({ variant: "destructive", title: "Gagal Verifikasi", description: data.message });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghubungi API DigiFlazz" });
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
          <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> DigiFlazz PPOB
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola Username dan API Key DigiFlazz untuk produk pulsa, paket data, dan PPOB. Data disimpan di Firestore.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-[10px] font-bold gap-2 shadow-sm transition-transform active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button
            onClick={handleSaveDigiFlazz}
            disabled={savingDigiFlazz || digiflazzLoading}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            {savingDigiFlazz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan Konfigurasi
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Status & Deposit Balance Card */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] md:text-[12px] font-bold flex items-center gap-2 text-[#212121]">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Status DigiFlazz
                </CardTitle>
                <Badge variant={digiflazzStatus.success ? "default" : "secondary"} className={cn("text-[8px] font-bold px-2 py-0.5", digiflazzStatus.success ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : "bg-slate-100 text-slate-600")}>
                  {digiflazzStatus.success ? "AKTIF" : "OFFLINE"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                <div className="p-3 rounded-xl bg-amber-50/30 border border-amber-100/60 space-y-2">
                  <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-wider">
                    <Wallet className="w-3.5 h-3.5 text-amber-600" /> Saldo Deposit:
                  </span>
                  <div className="text-lg font-bold text-amber-700">
                    {digiflazzStatus.deposit !== undefined
                      ? `Rp ${digiflazzStatus.deposit.toLocaleString("id-ID")}`
                      : "Rp 0"}
                  </div>
                  <p className="text-[9px] text-muted-foreground bg-white p-2 rounded-lg border border-amber-100/60 leading-relaxed">
                    {digiflazzStatus.message}
                  </p>
                </div>

                <Button
                  onClick={handleCheckDigiFlazzBalance}
                  disabled={checkingDigiFlazz || !username || !apiKey}
                  variant="outline"
                  className="w-full h-8 text-[10px] font-bold border-border/60 hover:bg-slate-50 gap-2 transition-transform active:scale-95"
                >
                  <RefreshCw className={cn("w-3 h-3", checkingDigiFlazz && "animate-spin text-amber-600")} />
                  {checkingDigiFlazz ? "Memeriksa Saldo..." : "Cek Saldo Real-Time"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Informasi PPOB</p>
                  <p className="text-[9px] text-blue-700 leading-relaxed font-medium">
                    Kredensial ini digunakan untuk memproses transaksi pulsa dan tagihan secara otomatis melalui sistem H2H DigiFlazz.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Config Form Card */}
          <div className="lg:col-span-8">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                <CardTitle className="text-[11px] md:text-[12px] font-bold text-[#212121]">Kredensial DigiFlazz API</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">DigiFlazz Username</Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username akun DigiFlazz"
                    className="h-10 rounded-xl bg-slate-50/50 border-border/50 text-[11px] font-mono focus:ring-amber-500/10"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">DigiFlazz API Key</Label>
                  <div className="relative">
                    <Input
                      type={showDigiFlazzKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Masukkan Production/Development API Key"
                      className="h-10 rounded-xl bg-slate-50/50 border-border/50 text-[11px] font-mono pr-9 focus:ring-amber-500/10"
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

                <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl space-y-2">
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    Pastikan IP Server MarketPoint sudah didaftarkan di <b>Whitelist IP</b> pada Dashboard DigiFlazz agar koneksi API tidak ditolak.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
