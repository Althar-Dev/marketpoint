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
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminXenditPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [savingXendit, setSavingXendit] = useState(false);
  const [testingXendit, setTestingXendit] = useState(false);

  const [showXenditKey, setShowXenditKey] = useState(false);

  // Firestore Document Binding
  const xenditDocRef = useMemoFirebase(() => doc(db, "settings", "xendit"), [db]);
  const { data: xenditData, loading: xenditLoading } = useDoc(xenditDocRef);

  const [secretKey, setSecretKey] = useState("");
  const [xenditStatus, setXenditStatus] = useState<{
    success: boolean;
    message: string;
    balance?: number;
  }>({ success: false, message: "Belum diperiksa" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (xenditData) {
      setSecretKey(xenditData.secretKey || "");
    }
  }, [xenditData]);

  const handleSaveXendit = async () => {
    if (!mounted) return;
    setSavingXendit(true);
    try {
      await setDoc(xenditDocRef, {
        secretKey,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Berhasil", description: "Secret Key disimpan ke Firestore!" });
      handleTestXendit();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan. Pastikan Anda memiliki akses Admin." });
    } finally {
      setSavingXendit(false);
    }
  };

  const handleTestXendit = async () => {
    if (!secretKey) return;
    setTestingXendit(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_xendit",
          secretKey: secretKey,
        }),
      });
      const data = await res.json();
      setXenditStatus(data);
      if (data.success) {
        toast({ title: "Berhasil", description: "Koneksi Xendit Terverifikasi!" });
      } else {
        toast({ variant: "destructive", title: "Gagal Verifikasi", description: data.message });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal tes koneksi API" });
    } finally {
      setTestingXendit(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 hidden md:block">
          <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" /> Gateway Xendit
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Kelola Secret API Key Xendit untuk pembayaran otomatis. Data disimpan aman di Firestore.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-[10px] font-bold gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button
            onClick={handleSaveXendit}
            disabled={savingXendit || xenditLoading}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm"
          >
            {savingXendit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan Konfigurasi
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          <div className="lg:col-span-4 space-y-5">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] md:text-[12px] font-bold flex items-center gap-2 text-[#212121]">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Status Koneksi
                </CardTitle>
                <Badge variant={xenditStatus.success ? "default" : "secondary"} className={cn("text-[8px] font-bold px-2 py-0.5", xenditStatus.success ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
                  {xenditStatus.success ? "AKTIF" : "OFFLINE"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-4">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Akses API:</span>
                    <span className="text-[9px] font-bold flex items-center gap-1">
                      {xenditStatus.success ? (
                        <><CheckCircle2 className="w-3 h-3 text-[#00AA5B]" /> Valid</>
                      ) : (
                        <><XCircle className="w-3 h-3 text-rose-500" /> Bermasalah</>
                      )}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium bg-white p-2 rounded-lg border border-border/30 leading-relaxed">
                    {xenditStatus.message}
                  </p>
                  {xenditStatus.balance !== undefined && (
                    <div className="pt-2 border-t border-border/30 flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Saldo Xendit:</span>
                      <span className="text-xs font-bold text-[#00AA5B]">
                        Rp {xenditStatus.balance.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleTestXendit}
                  disabled={testingXendit || !secretKey}
                  variant="outline"
                  className="w-full h-8 text-[10px] font-bold border-border/60 hover:bg-slate-50 gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", testingXendit && "animate-spin")} />
                  Tes Koneksi API
                </Button>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Penting: Izin API Key</p>
                  <p className="text-[9px] text-amber-700 leading-relaxed font-medium">
                    Pastikan API Key di Dashboard Xendit memiliki izin:
                    <br />• <b>Money In</b>: Write
                    <br />• <b>Balance</b>: Read
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-5 border-b border-border/30 bg-slate-50/30">
                <CardTitle className="text-[11px] md:text-[12px] font-bold text-[#212121]">Kredensial Xendit API</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Secret API Key</Label>
                  <div className="relative">
                    <Input
                      type={showXenditKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="xnd_development_... atau xnd_production_..."
                      className="h-10 rounded-xl bg-slate-50/50 border-border/50 text-[11px] font-mono pr-9"
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
                
                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl space-y-2">
                  <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                    Gunakan <b>Secret Key</b> (bukan Public Key). Kunci ini digunakan untuk membuat tagihan otomatis kepada pembeli dan memproses pembayaran langganan toko.
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