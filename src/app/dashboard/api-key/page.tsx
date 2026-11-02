"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Key,
  Copy,
  Check,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Terminal,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  Loader2,
  Zap,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ApiKeyData {
  apiKey: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string | null;
}

export default function DashboardApiKeyPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Rotation dialog & loading state
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Quick Start tab state: "ORDER" | "CATALOG"
  const [activeTab, setActiveTab] = useState<"ORDER" | "CATALOG">("ORDER");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Origin for base URL
  const [baseUrl, setBaseUrl] = useState("https://marketpoint.id");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Fetch real persistent API Key from server
  const fetchApiKey = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/reseller/api-key?userId=${encodeURIComponent(user.uid)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success && data.apiKey) {
        setApiKeyData({
          apiKey: data.apiKey,
          status: data.status || "ACTIVE",
          lastUsedAt: data.lastUsedAt || null,
          createdAt: data.createdAt || null,
        });
      } else {
        throw new Error(data.message || "Gagal memuat API Key.");
      }
    } catch (err: any) {
      console.error("Gagal fetch API Key:", err);
      toast({
        title: "Gagal Memuat API Key",
        description: err.message || "Terjadi kesalahan saat memuat kunci API Anda.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    if (user?.uid) {
      fetchApiKey();
    }
  }, [user?.uid, fetchApiKey]);

  // Copy API key to clipboard
  const handleCopyKey = () => {
    if (!apiKeyData?.apiKey) return;
    navigator.clipboard.writeText(apiKeyData.apiKey);
    setCopied(true);
    toast({
      title: "API Key Berhasil Disalin",
      description: "Gunakan kunci ini pada header Authorization: Bearer <API_KEY>.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Rotate API Key handler
  const handleRotateKey = async () => {
    if (!user?.uid) return;

    setIsRotating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reseller/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal melakukan rotasi API Key.");
      }

      setApiKeyData({
        apiKey: data.apiKey,
        status: data.status || "ACTIVE",
        lastUsedAt: data.lastUsedAt || null,
        createdAt: data.createdAt || new Date().toISOString(),
      });

      setIsRotateDialogOpen(false);
      toast({
        title: "API Key Berhasil Dirotasi",
        description: "Kunci rahasia baru telah aktif. Segera perbarui konfigurasi pada bot atau server Anda.",
      });
    } catch (err: any) {
      console.error("Gagal rotasi API Key:", err);
      toast({
        title: "Gagal Rotasi API Key",
        description: err.message || "Terjadi kesalahan saat merotasi kunci API.",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const currentKey = apiKeyData?.apiKey || "mp_live_********************************";

  // Code snippets for quickstart
  const orderCurl = `curl -X POST "${baseUrl}/api/reseller/order" \\
  -H "Authorization: Bearer ${showKey && apiKeyData?.apiKey ? apiKeyData.apiKey : "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "buyerSku": "KODE_PRODUK_ANDA",
    "refId": "ORDER-${Date.now().toString().slice(-6)}",
    "customerNo": "081234567890",
    "quantity": 1
  }'`;

  const catalogCurl = `curl -X GET "${baseUrl}/api/reseller/products" \\
  -H "Authorization: Bearer ${showKey && apiKeyData?.apiKey ? apiKeyData.apiKey : "YOUR_API_KEY"}"`;

  const activeSnippet = activeTab === "ORDER" ? orderCurl : catalogCurl;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedSnippet(true);
    toast({
      title: "Contoh Kode Disalin",
      description: "Snippet cURL berhasil disalin ke clipboard.",
    });
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Akses API & Integrasi H2H
            </h1>
            <Badge className="bg-emerald-50 text-[#00AA5B] border-emerald-200/80 text-[10px] font-bold py-0.5 px-2 rounded-md">
              Reseller API v1
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gunakan Secret Key ini untuk mengotentikasi bot Telegram, sistem otomatis, atau website Anda saat transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/products">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl border-slate-200 text-xs font-bold gap-1.5 hover:bg-slate-50"
            >
              <Zap className="w-3.5 h-3.5 text-[#00AA5B]" />
              Katalog Produk Saya
            </Button>
          </Link>
          <Link href="/documentations">
            <Button
              size="sm"
              className="h-9 px-3.5 rounded-xl bg-[#00AA5B] hover:bg-[#008f4c] text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Dokumentasi API
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Key Manager & Quick Start */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Secret Key */}
          <Card className="border-border border shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center border border-emerald-100/80">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Production Secret Key
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Kunci rahasia aktif Anda untuk semua permintaan H2H API.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold py-0.5 px-2 rounded-md">
                    AKTIF & VALID
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00AA5B]" />
                  <span className="text-xs font-medium">Mengambil API Key resmi dari server...</span>
                </div>
              ) : (
                <>
                  {/* Secret Key Input Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        SECRET KEY (BEARER TOKEN)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {showKey ? "Terbuka" : "Disembunyikan"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showKey ? "text" : "password"}
                          value={currentKey}
                          readOnly
                          className="h-10 rounded-xl bg-slate-50/70 border-slate-200 font-mono text-xs font-bold text-slate-800 pr-10 tracking-wider focus-visible:ring-[#00AA5B]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                          title={showKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <Button
                        onClick={handleCopyKey}
                        variant="outline"
                        className="h-10 px-3.5 rounded-xl gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 shadow-2xs shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span className="text-emerald-700">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Row: Dibuat Pada & Terakhir Digunakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          DIBUAT PADA
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {formatDate(apiKeyData?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          TERAKHIR DIGUNAKAN
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {apiKeyData?.lastUsedAt ? formatDate(apiKeyData.lastUsedAt) : "Belum pernah transaksi"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-900">
                        Kunci Rahasia (Keep Private)
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Secret Key ini bertindak sebagai otorisasi penuh atas saldo dan transaksi akun Anda. Jangan pernah mempublikasikannya di frontend atau repositori publik.
                      </p>
                    </div>
                  </div>

                  {/* Rotate Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setIsRotateDialogOpen(true)}
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold gap-1.5 rounded-xl h-9 px-3"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotasi Secret Key
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Start / Code Example Card */}
          <Card className="border-border border shadow-2xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#00AA5B]" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Contoh Request API (Quick Start)
                  </CardTitle>
                </div>

                {/* Tabs */}
                <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ORDER")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                      activeTab === "ORDER"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Order Transaksi (POST)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("CATALOG")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-md transition-all",
                      activeTab === "CATALOG"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Cek Katalog (GET)
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeTab === "ORDER" ? (
                  <>
                    Gunakan endpoint ini di script atau bot Telegram Anda untuk melakukan pembelian otomatis menggunakan kode SKU kustom yang sudah Anda atur.
                  </>
                ) : (
                  <>
                    Endpoint ini mengembalikan seluruh daftar produk beserta status, stok, dan harga terkini dari katalog Anda.
                  </>
                )}
              </p>

              {/* Code Snippet Box */}
              <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto shadow-inner group">
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Salin Kode cURL"
                >
                  {copiedSnippet ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <pre className="text-emerald-400 font-bold mb-1">
                  # {activeTab === "ORDER" ? "POST /api/reseller/order" : "GET /api/reseller/products"}
                </pre>
                <pre className="whitespace-pre">{activeSnippet}</pre>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" />
                  <span>Respon dalam format JSON standar</span>
                </div>

                <Link href="/documentations">
                  <Button variant="link" className="text-[#00AA5B] hover:text-[#008f4c] font-bold text-xs p-0 h-auto">
                    Dokumentasi Lengkap <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Bot Integration Guide */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Gateway Card */}
          <Card className="border-border border shadow-2xs rounded-2xl bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Gateway API H2H</h3>
                <p className="text-[11px] text-slate-500">High Availability Endpoint</p>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Server</span>
                <span className="font-bold text-[#00AA5B] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B]"></span>
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rata-rata Respon</span>
                <span className="font-bold text-slate-700">~110 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Protokol</span>
                <span className="font-bold text-slate-700">HTTPS / JSON</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rate Limit</span>
                <span className="font-bold text-slate-700">60 req / menit</span>
              </div>
            </div>
          </Card>

          {/* Integration Guide for Telegram Bot */}
          <Card className="border-border border shadow-2xs rounded-2xl bg-slate-50/70 p-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center text-[#00AA5B]">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Langkah Integrasi Bot / Script
              </h3>
            </div>

            <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside pl-0.5 leading-relaxed">
              <li>
                <span className="font-semibold text-slate-800">Atur Kode SKU:</span> Buka halaman <Link href="/dashboard/products" className="text-[#00AA5B] font-bold underline">Katalog Produk</Link> dan beri kode custom pada produk yang ingin dijual.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Pasang API Key:</span> Masukkan Secret Key ini ke file konfigurasi bot Anda (<code className="bg-slate-200/70 px-1 py-0.5 rounded text-[10px] font-mono">config.json</code>).
              </li>
              <li>
                <span className="font-semibold text-slate-800">Kirim Order:</span> Jalankan order via <code className="bg-slate-200/70 px-1 py-0.5 rounded text-[10px] font-mono">/api/reseller/order</code> saat pembeli di bot Anda melakukan checkout.
              </li>
            </ol>
          </Card>
        </div>
      </div>

      {/* 3. Modal Dialog: Konfirmasi Rotasi Secret Key */}
      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Konfirmasi Rotasi API Key
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Kunci rahasia lama Anda akan <b>langsung dinonaktifkan secara permanen</b>. Semua bot Telegram, skrip, atau aplikasi yang sedang menggunakan kunci lama akan berhenti berfungsi sampai Anda memperbarui konfigurasinya dengan kunci yang baru.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRotateDialogOpen(false)}
              disabled={isRotating}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRotateKey}
              disabled={isRotating}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              {isRotating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Merotasi Kunci...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Ya, Rotasi Kunci Sekarang</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
