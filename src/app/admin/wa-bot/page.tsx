"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Phone,
  RefreshCw,
  Copy,
  Check,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Key,
  Smartphone,
  Bot,
  Server,
  CheckCircle2,
  Terminal,
  Radio,
  Unlink,
  Link as LinkIcon,
  Trash2,
  RotateCcw,
  X
} from "lucide-react";

interface LogEntry {
  id: string;
  time: string;
  timestamp: number;
  text: string;
  type: "info" | "success" | "warn" | "error";
}

export default function AdminWABotPage() {
  const { toast } = useToast();
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<string>("DISCONNECTED");
  const [userJid, setUserJid] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  // Pairing Code state
  const [pairPhone, setPairPhone] = useState<string>("6288976577650");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [requestingPair, setRequestingPair] = useState<boolean>(false);
  const [copiedPair, setCopiedPair] = useState<boolean>(false);
  const [showPairingForm, setShowPairingForm] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [hasSession, setHasSession] = useState<boolean>(false);

  // Test message state
  const [testPhone, setTestPhone] = useState<string>("");
  const [sendingTest, setSendingTest] = useState<boolean>(false);

  // Real log feed from backend API
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Bot Config State (backed by database/config.json)
  const [botConfig, setBotConfig] = useState({
    botName: "MarketPoint",
    otpExpiryMinutes: 5,
    otpCooldownSeconds: 60,
    communityLink: "https://chat.whatsapp.com/MarketPointCommunity",
    communityJid: "",
    checkCommunity: true,
    sessionDir: "bot-session",
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchBotConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/wa-bot/config");
      const data = await res.json();
      if (data.success && data.config) {
        setBotConfig(data.config);
      }
    } catch (err) {
      console.error("[FETCH CONFIG ERROR]", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/wa-bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(botConfig),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Konfigurasi Berhasil Disimpan",
          description: "Pengaturan Bot WA disimpan ke database/config.json.",
        });
      } else {
        throw new Error(data.error || "Gagal menyimpan konfigurasi.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message,
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCancelPairing = async () => {
    setPairingCode("");
    setShowPairingForm(false);
    setStatus("DISCONNECTED");

    try {
      await fetch("/api/wa-bot/pair", { method: "DELETE" });
      await fetchBotStatus();
    } catch (err) {
      console.error("[CANCEL PAIRING ERROR]", err);
    }

    toast({
      title: "Pairing Dibatalkan",
      description: "Permintaan kode pairing telah dibatalkan.",
    });
  };

  // Auto scroll log terminal to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchBotLogs = async () => {
    try {
      const res = await fetch("/api/wa-bot/logs");
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        const sortedLogs = [...data.logs].sort((a: LogEntry, b: LogEntry) => a.timestamp - b.timestamp);
        setLogs(sortedLogs);
      }
    } catch (err) {
      console.error("[FETCH LOGS ERROR]", err);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch("/api/wa-bot/logs", { method: "DELETE" });
      setLogs([]);
      toast({
        title: "Log Dibersihkan",
        description: "Seluruh catatan log telah dibersihkan.",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBotStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/wa-bot/status");
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status.status);
        setHasSession(!!data.status.hasSession);
        if (data.status.userJid) {
          setUserJid(data.status.userJid);
          const rawNum = data.status.userJid.split("@")[0].split(":")[0];
          setPairPhone(rawNum);
        }
        if (data.status.pairingCode) {
          setPairingCode(data.status.pairingCode);
        }
      }
      await fetchBotLogs();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Initial load and periodic 3-second live refresh
  useEffect(() => {
    fetchBotStatus();
    fetchBotConfig();
    const interval = setInterval(() => {
      fetchBotStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPairing = async () => {
    if (!pairPhone) {
      toast({
        variant: "destructive",
        title: "Nomor Kosong",
        description: "Masukkan nomor WhatsApp pengirim bot.",
      });
      return;
    }

    setRequestingPair(true);

    try {
      const res = await fetch("/api/wa-bot/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pairPhone }),
      });
      const data = await res.json();

      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        setStatus("PAIRING_CODE");
        toast({
          title: "Kode Pairing Berhasil Diberikan!",
          description: `Kode: ${data.pairingCode}`,
        });
      } else {
        throw new Error(data.error || "Gagal meminta kode pairing.");
      }
      await fetchBotLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Meminta Kode Pairing",
        description: error.message || "Terjadi kesalahan.",
      });
    } finally {
      setRequestingPair(false);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedPair(true);
    toast({
      title: "Tersalin!",
      description: "Kode pairing disalin ke clipboard.",
    });
    setTimeout(() => setCopiedPair(false), 2000);
  };

  const handleDisconnectSession = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/wa-bot/disconnect", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setStatus("DISCONNECTED");
        setHasSession(false);
        setUserJid("");
        setPairingCode("");
        setShowPairingForm(false);
        toast({
          title: "Sesi Dibersihkan",
          description: "Berkas sesi WhatsApp berhasil dihapus dari server.",
        });
      } else {
        throw new Error(data.error || "Gagal memutuskan sesi.");
      }
      await fetchBotLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memutuskan Sesi",
        description: error.message || "Terjadi kesalahan.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestOTP = async () => {
    if (!testPhone) {
      toast({
        variant: "destructive",
        title: "Nomor Kosong",
        description: "Masukkan nomor HP tujuan OTP.",
      });
      return;
    }

    setSendingTest(true);

    try {
      const res = await fetch("/api/wa-bot/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "🚀 OTP Uji Coba Terkirim!",
          description: data.message || "Pesan WhatsApp OTP berhasil dikirim.",
        });
      } else {
        throw new Error(data.error || "Gagal mengirim OTP.");
      }
      await fetchBotLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim OTP",
        description: error.message || "Terjadi gangguan pada bot.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Format JID for display
  const formattedJid = userJid ? userJid.split("@")[0].split(":")[0] : pairPhone;

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-screen-2xl mx-auto font-body text-[#212121] w-full overflow-hidden">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#00AA5B]/10 via-[#00AA5B]/5 to-emerald-500/10 border border-[#00AA5B]/20 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#00AA5B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#00AA5B] text-white flex items-center justify-center shadow-md shadow-[#00AA5B]/20 shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">WhatsApp Bot Manager</h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Kelola koneksi WhatsApp Bot.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Status Pulse Indicator */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-border/80 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "CONNECTED" ? "bg-emerald-400" : status === "PAIRING_CODE" ? "bg-amber-400" : "bg-red-400"
                  }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === "CONNECTED" ? "bg-[#00AA5B]" : status === "PAIRING_CODE" ? "bg-amber-500" : "bg-red-500"
                  }`} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {status === "CONNECTED" ? "Online" : status === "PAIRING_CODE" ? "Pairing Needed" : "Disconnected"}
              </span>
            </div>

            <Button
              onClick={fetchBotStatus}
              disabled={loadingStatus}
              variant="outline"
              className="h-8 sm:h-9 px-3 text-[11px] font-bold gap-1.5 rounded-xl bg-white hover:bg-muted border-border shadow-sm active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00AA5B] ${loadingStatus ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            {/* Disconnect Button in Header if connected */}
            {status === "CONNECTED" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={disconnecting}
                    className="h-8 sm:h-9 px-3 text-[11px] font-bold gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-95 transition-all"
                  >
                    {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                    <span>Putuskan Sesi</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border p-5 sm:p-6">
                  <AlertDialogHeader className="space-y-2">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-1">
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <AlertDialogTitle className="text-sm sm:text-base font-bold">
                      Putuskan & Hapus Sesi WhatsApp?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                      Tindakan ini akan mengeluarkan (*logout*) bot dari WhatsApp dan menghapus seluruh berkas autentikasi sesi di server. Anda harus menautkan ulang perangkat via kode pairing jika ingin menggunakannya kembali.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="pt-2 gap-2">
                    <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold">Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnectSession}
                      className="rounded-xl h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      Ya, Putuskan & Hapus Sesi
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row (3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-sm rounded-xl sm:rounded-2xl bg-white p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-[#00AA5B] flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status Service</p>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate">
              {status === "CONNECTED" ? "Aktif & Terhubung" : status === "PAIRING_CODE" ? "Menunggu Code" : "Terputus"}
            </p>
          </div>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-xl sm:rounded-2xl bg-white p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nomor Bot Aktif</p>
            <p className="text-xs sm:text-sm font-extrabold text-foreground font-mono truncate">
              {formattedJid && status === "CONNECTED" ? `+${formattedJid}` : "Belum Ditautkan"}
            </p>
          </div>
        </Card>

        <Card className="border border-border/80 shadow-sm rounded-xl sm:rounded-2xl bg-white p-3.5 sm:p-4 flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Socket Engine</p>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate">wa-socket v2.0</p>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Device Connection Status & Pairing Card */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">

          {/* If Bot is CONNECTED and admin is not explicitly requesting re-pairing */}
          {status === "CONNECTED" && !showPairingForm ? (
            <Card className="border border-[#00AA5B]/30 shadow-md rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-[#00AA5B]/10 bg-emerald-500/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#00AA5B] text-white flex items-center justify-center shadow-md shrink-0">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                        Perangkat Terhubung
                      </CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground">
                        Bot aktif.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-[#00AA5B] text-white font-bold text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nomor Pengirim Bot</p>
                      <p className="text-base sm:text-lg font-extrabold text-[#00AA5B] font-mono mt-0.5">
                        +{formattedJid}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status Socket</p>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#00AA5B]/10 text-[#00AA5B] mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00AA5B] animate-pulse" /> Connected
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-border/60 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Auto-Reply Command:</span>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#00AA5B]" /> !ping, !help, !otp
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPairingForm(true)}
                    className="h-8 sm:h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border-border gap-1.5 w-full sm:w-auto"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Tautkan Ulang / Ganti Perangkat
                  </Button>

                  {/* Disconnect & Delete Session Dialog */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={disconnecting}
                        className="h-8 sm:h-9 px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 w-full sm:w-auto"
                      >
                        {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                        Putuskan & Hapus Sesi
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border p-5 sm:p-6">
                      <AlertDialogHeader className="space-y-2">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-1">
                          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <AlertDialogTitle className="text-sm sm:text-base font-bold">
                          Putuskan & Hapus Sesi WhatsApp?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                          Tindakan ini akan mengeluarkan (*logout*) bot dari WhatsApp dan menghapus seluruh berkas autentikasi sesi di server. Anda harus menautkan ulang perangkat via kode pairing jika ingin menggunakannya kembali.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-2 gap-2">
                        <AlertDialogCancel className="rounded-xl h-9 text-xs font-bold">Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnectSession}
                          className="rounded-xl h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                        >
                          Ya, Putuskan & Hapus Sesi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Pairing Code Card when DISCONNECTED / PAIRING_CODE or Admin explicitly requests re-pair */
            <Card className="border border-border/80 shadow-sm rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-[#F8FAFC]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-xs sm:text-sm font-bold">Tautkan Perangkat WhatsApp</CardTitle>
                      <CardDescription className="text-[11px]">
                        Gunakan 8 karakter kode pairing untuk menyambungkan bot tanpa QR.
                      </CardDescription>
                    </div>
                  </div>
                  {hasSession && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={disconnecting}
                      onClick={handleDisconnectSession}
                      className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1 shrink-0"
                    >
                      {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Hapus Berkas Sesi
                    </Button>
                  )}
                  {status === "CONNECTED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPairingForm(false)}
                      className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-foreground ml-0.5">Nomor WhatsApp Pengirim Bot</label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={pairPhone}
                        onChange={(e) => setPairPhone(e.target.value)}
                        placeholder="Contoh: 6288976577650"
                        className="pl-9 h-9 sm:h-10 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all"
                      />
                    </div>
                    <Button
                      onClick={handleRequestPairing}
                      disabled={requestingPair}
                      className="h-9 sm:h-10 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shrink-0 shadow-md shadow-[#00AA5B]/10 active:scale-95 transition-all"
                    >
                      {requestingPair ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                      Minta Kode Pairing
                    </Button>
                  </div>
                </div>

                {/* Pairing Code Display Box */}
                {pairingCode ? (
                  <div className="p-4 rounded-xl sm:rounded-2xl bg-[#00AA5B]/5 border-2 border-[#00AA5B]/30 space-y-3 animate-in fade-in-50 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#00AA5B] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Kode Pairing Aktif
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyPairingCode}
                          className="h-7 text-xs font-bold text-[#00AA5B] hover:bg-[#00AA5B]/10 rounded-lg gap-1 px-2.5"
                        >
                          {copiedPair ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedPair ? "Tersalin!" : "Salin Kode"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelPairing}
                          className="h-7 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg gap-1 px-2"
                        >
                          <X className="w-3.5 h-3.5" />
                          Batal Pairing
                        </Button>
                      </div>
                    </div>

                    {/* Character formatted box */}
                    <div className="p-3 bg-white rounded-xl border border-[#00AA5B]/30 shadow-inner flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                      {pairingCode.split("").map((char, i) => (
                        <span
                          key={i}
                          className={`font-mono text-base sm:text-xl font-black rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 bg-muted/30 border border-border ${char === "-" ? "border-none bg-transparent text-muted-foreground px-1" : "text-[#00AA5B]"
                            }`}
                        >
                          {char}
                        </span>
                      ))}
                    </div>

                    {/* Steps */}
                    <div className="space-y-2 pt-2 border-t border-[#00AA5B]/10">
                      <p className="text-[10px] sm:text-[11px] font-bold text-foreground">Langkah Penautan di WhatsApp HP:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-border/60 flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span className="text-muted-foreground">Buka <strong>WhatsApp</strong> di HP nomor <span className="font-bold text-foreground">+{pairPhone}</span>.</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-border/60 flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span className="text-muted-foreground">Pilih <strong>Perangkat Tertaut</strong> ➔ <strong>Tautkan Perangkat</strong>.</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-border/60 flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span className="text-muted-foreground">Pilih <strong>"Tautkan dengan nomor telepon"</strong>.</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-border/60 flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#00AA5B]/10 text-[#00AA5B] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                          <span className="text-muted-foreground">Masukkan 8 digit kode pairing di atas.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-dashed border-border text-center space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Belum ada kode pairing yang diminta.
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      Klik tombol <strong>"Minta Kode Pairing"</strong> di atas untuk membuat kode baru.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Sandbox Card */}
          <Card className="border border-border/80 shadow-sm rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold">Uji Coba Pengiriman OTP</CardTitle>
                  <CardDescription className="text-[11px]">
                    Kirimkan OTP verifikasi uji coba ke nomor WhatsApp tujuan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground ml-0.5">Nomor HP Tujuan OTP</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Contoh: 082371818615"
                    className="pl-9 h-9 sm:h-10 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendTestOTP}
                disabled={sendingTest || !testPhone || status !== "CONNECTED"}
                className="w-full h-9 sm:h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-lg shadow-[#00AA5B]/10 active:scale-95 transition-all"
              >
                {sendingTest ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirimkan Pesan OTP...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesan OTP WhatsApp</span>
                  </>
                )}
              </Button>

              {status !== "CONNECTED" && (
                <p className="text-[10px] text-center text-amber-600 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Bot WhatsApp belum terhubung. Hubungkan terlebih dahulu via Kode Pairing.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Config JSON Storage Card */}
          <Card className="border border-border/80 shadow-sm rounded-2xl sm:rounded-3xl bg-white overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs sm:text-sm font-bold">Konfigurasi Bot (database/config.json)</CardTitle>
                    <CardDescription className="text-[11px]">
                      Pengaturan nama bot, link komunitas, dan validasi grup.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-border bg-white text-muted-foreground">
                  database/config.json
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground ml-0.5">Nama Bot</label>
                  <Input
                    value={botConfig.botName}
                    onChange={(e) => setBotConfig({ ...botConfig, botName: e.target.value })}
                    placeholder="MarketPoint"
                    className="h-9 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground ml-0.5">Link Komunitas WhatsApp</label>
                  <Input
                    value={botConfig.communityLink}
                    onChange={(e) => setBotConfig({ ...botConfig, communityLink: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="h-9 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground ml-0.5">Masa Berlaku OTP (Menit)</label>
                  <Input
                    type="number"
                    value={botConfig.otpExpiryMinutes}
                    onChange={(e) => setBotConfig({ ...botConfig, otpExpiryMinutes: Number(e.target.value) || 5 })}
                    className="h-9 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground ml-0.5">Cooldown Re-OTP (Detik)</label>
                  <Input
                    type="number"
                    value={botConfig.otpCooldownSeconds}
                    onChange={(e) => setBotConfig({ ...botConfig, otpCooldownSeconds: Number(e.target.value) || 60 })}
                    className="h-9 rounded-xl text-xs font-bold border-border bg-muted/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/80">
                <div className="space-y-0.5 pr-2">
                  <p className="text-xs font-bold text-foreground">Wajibkan Cek Komunitas WA</p>
                  <p className="text-[10px] text-muted-foreground">Pendaftar toko harus gabung grup/komunitas bot sebelum minta OTP</p>
                </div>
                <input
                  type="checkbox"
                  checked={botConfig.checkCommunity}
                  onChange={(e) => setBotConfig({ ...botConfig, checkCommunity: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#00AA5B] cursor-pointer"
                />
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig || loadingConfig}
                className="w-full h-9 sm:h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-md shadow-[#00AA5B]/10 active:scale-95 transition-all"
              >
                {savingConfig ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke config.json...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Pengaturan ke database/config.json</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Real Live Log Aktivitas Bot */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <Card className="border border-border/80 shadow-sm rounded-2xl sm:rounded-3xl bg-white overflow-hidden h-full flex flex-col">
            <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-[#F8FAFC]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#00AA5B]" />
                    Log Aktivitas Bot
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Log real-time.
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearLogs}
                  title="Bersihkan Log"
                  className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Bersihkan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 flex-1 flex flex-col min-h-0">
              <div ref={logContainerRef} className="flex-1 min-h-[320px] lg:min-h-[420px] overflow-y-auto font-mono text-[10px] sm:text-[11px] bg-slate-950 text-slate-200 rounded-xl p-3 sm:p-4 space-y-1.5 scrollbar-thin shadow-inner">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Belum ada aktivitas tercatat.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed border-b border-slate-900/60 pb-1 last:border-none">
                      <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                      <span className={
                        log.type === "success" ? "text-emerald-400 font-semibold" :
                          log.type === "warn" ? "text-amber-400 font-semibold" :
                            log.type === "error" ? "text-red-400 font-semibold" : "text-slate-300"
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
