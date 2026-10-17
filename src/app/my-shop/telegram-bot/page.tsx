"use client";

import { useState, useEffect, useMemo } from "react";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Bot,
    Send,
    Zap,
    Settings2,
    Bell,
    ExternalLink,
    Key,
    HelpCircle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Copy,
    Check,
    Crown,
    ShoppingBag,
    CreditCard,
    MessageSquareWarning,
    Star,
    RefreshCw,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MerchantPlanLock } from "@/components/merchant-plan-lock";

export default function MerchantTelegramBotPage() {
    const { user, loading: authLoading } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [verifiedBot, setVerifiedBot] = useState<{
        username?: string;
        firstName?: string;
    } | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const {
        shopId,
        shop: contextShop,
        loading: merchantLoading,
        effectiveFeatures,
        isAdmin,
    } = useMerchantShop();

    const activeShopId = shopId || user?.uid;

    const shopRef = useMemoFirebase(() => {
        if (!activeShopId) return null;
        return doc(db, "shops", activeShopId);
    }, [db, activeShopId]);

    const { data: shop, loading: shopLoading } = useDoc(shopRef);

    // Subscription check dynamically derived from Merchant Context
    const subInfo = useMemo(
        () => ({
            planName: effectiveFeatures.planName,
            botAllowed: effectiveFeatures.telegramBot,
        }),
        [effectiveFeatures]
    );

    // Form State
    const [botToken, setBotToken] = useState("");
    const [chatId, setChatId] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [notifyOrder, setNotifyOrder] = useState(true);
    const [notifyPaid, setNotifyPaid] = useState(true);
    const [notifyDispute, setNotifyDispute] = useState(true);
    const [notifyReview, setNotifyReview] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (shop?.telegramBot) {
            setBotToken(shop.telegramBot.token || "");
            setChatId(shop.telegramBot.chatId || "");
            setIsEnabled(shop.telegramBot.isEnabled ?? false);
            setNotifyOrder(shop.telegramBot.notifyOrder ?? true);
            setNotifyPaid(shop.telegramBot.notifyPaid ?? true);
            setNotifyDispute(shop.telegramBot.notifyDispute ?? true);
            setNotifyReview(shop.telegramBot.notifyReview ?? true);

            if (shop.telegramBot.botUsername) {
                setVerifiedBot({
                    username: shop.telegramBot.botUsername,
                    firstName: shop.telegramBot.botFirstName || "Telegram Bot",
                });
            }
        }
    }, [shop]);

    const handleCopyCommand = (cmd: string) => {
        navigator.clipboard.writeText(cmd);
        toast({
            title: "Perintah Disalin!",
            description: `"${cmd}" disalin ke papan klip.`,
        });
    };

    const handleTestConnection = async () => {
        if (!botToken.trim()) {
            toast({
                variant: "destructive",
                title: "Token Belum Diisi",
                description: "Silakan masukkan Token Bot Telegram terlebih dahulu.",
            });
            return;
        }

        setIsTesting(true);
        try {
            const res = await fetch("/api/telegram/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: botToken.trim(),
                    chatId: chatId.trim() || undefined,
                    shopName: shop?.name || contextShop?.name || "Toko Saya",
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Gagal melakukan tes koneksi bot.");
            }

            setVerifiedBot(data.bot);

            if (data.messageSent) {
                toast({
                    title: "Koneksi Berhasil & Pesan Terkirim! 🎉",
                    description: `Bot @${data.bot.username} berhasil mengirimkan pesan tes ke Chat ID Anda.`,
                });
            } else if (data.messageError) {
                toast({
                    variant: "destructive",
                    title: `Bot @${data.bot.username} Terverifikasi`,
                    description: data.messageError,
                });
            } else {
                toast({
                    title: "Token Valid!",
                    description: `Bot terdeteksi: @${data.bot.username}. Isi Chat ID untuk menerima tes pesan langsung.`,
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Tes Koneksi Gagal",
                description: err.message || "Pastikan token yang Anda masukkan benar.",
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!user || !shopRef) return;
        if (!subInfo.botAllowed) {
            toast({
                variant: "destructive",
                title: "Upgrade Diperlukan",
                description: "Fitur Bot Telegram hanya tersedia untuk merchant paket Pro atau Prime.",
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateDoc(shopRef, {
                telegramBot: {
                    token: botToken.trim(),
                    chatId: chatId.trim(),
                    isEnabled,
                    notifyOrder,
                    notifyPaid,
                    notifyDispute,
                    notifyReview,
                    botUsername: verifiedBot?.username || shop?.telegramBot?.botUsername || null,
                    botFirstName: verifiedBot?.firstName || shop?.telegramBot?.botFirstName || null,
                    updatedAt: new Date().toISOString(),
                },
                updatedAt: serverTimestamp(),
            });

            toast({
                title: "Konfigurasi Disimpan!",
                description: "Pengaturan notifikasi bot Telegram toko Anda telah diperbarui.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Gagal Menyimpan",
                description: err.message || "Terjadi kesalahan sistem.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted || authLoading || shopLoading || merchantLoading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Skeleton className="lg:col-span-8 h-80 rounded-2xl" />
                    <Skeleton className="lg:col-span-4 h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    // Jika paket tidak mengizinkan bot telegram (misal paket Free atau Plus)
    if (!subInfo.botAllowed) {
        return (
            <MerchantPlanLock
                title="Fitur Bot Telegram Terkunci"
                featureName="Bot Telegram Toko"
                description="Fitur Bot Notifikasi Telegram belum aktif pada paket langganan toko Anda saat ini. Tingkatkan paket toko Anda ke Pro atau Prime untuk menerima notifikasi pesanan dan komplain seketika."
                currentPlan={subInfo.planName}
                requiredPlans="Pro atau Prime"
                icon={Bot}
                benefits={[
                    "Notifikasi instan pesanan masuk & status pembayaran lunas",
                    "Pemberitahuan komplain dan dispute pembeli langsung ke ponsel",
                    "Kelola toko secara real-time tanpa perlu selalu membuka web dashboard",
                    "Koneksi aman langsung menggunakan token resmi Telegram Anda",
                ]}
            />
        );
    }

    const isConfigured = Boolean(botToken.trim() && chatId.trim());
    const isActive = isEnabled && isConfigured;

    return (
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 bg-[#F9FAFB] min-h-screen">
            <div className="max-w-5xl mx-auto space-y-3.5 sm:space-y-4">

                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                                    Bot Telegram
                                </h1>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0",
                                        isActive
                                            ? "bg-emerald-50 text-[#00AA5B] border-emerald-200"
                                            : "bg-slate-100 text-slate-500 border-slate-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            isActive ? "bg-[#00AA5B] animate-pulse" : "bg-slate-400"
                                        )}
                                    />
                                    {isActive ? "Aktif & Terhubung" : "Nonaktif"}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate sm:whitespace-normal">
                                Terima rincian pesanan baru, pembayaran lunas, dan komplain langsung di Telegram Anda.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                        <Button
                            onClick={handleSaveConfig}
                            disabled={isSaving || !subInfo.botAllowed}
                            className="h-8 px-3.5 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-[11px] gap-1.5 shadow-xs transition-all w-full sm:w-auto justify-center"
                        >
                            {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Settings2 className="w-3 h-3" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </div>
                </div>

                {/* Upgrade Card if plan does not permit */}
                {!subInfo.botAllowed && (
                    <div className="relative overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/60 p-3.5 sm:p-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                    <Crown className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                            Fitur Khusus Plan Pro & Prime
                                        </h3>
                                        <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 text-[9px] font-bold px-1.5 py-0">
                                            Plan Saat Ini: {subInfo.planName}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-slate-600 leading-relaxed max-w-xl">
                                        Dapatkan notifikasi otomatis pesanan dan pembayaran toko seketika ke akun Telegram Anda tanpa perlu selalu membuka browser.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowUpgradeModal(true)}
                                className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8 px-3.5 shrink-0 shadow-xs gap-1.5 w-full sm:w-auto justify-center"
                            >
                                Upgrade Plan <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">

                    {/* Main Config Column (8 Cols) */}
                    <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">

                        {/* Connection Credentials Card */}
                        <Card
                            className={cn(
                                "border-border/70 shadow-2xs rounded-xl bg-white overflow-hidden transition-opacity",
                                !subInfo.botAllowed && "opacity-60 pointer-events-none"
                            )}
                        >
                            <CardHeader className="p-3.5 sm:p-4 border-b border-border/50 bg-[#F8FAFC]/60">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                            <Key className="w-3.5 h-3.5 text-sky-600 shrink-0" /> Kredensial & Status Koneksi Bot
                                        </CardTitle>
                                        <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                                            Koneksikan bot Telegram menggunakan token resmi dari @BotFather.
                                        </CardDescription>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs shrink-0">
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                                            Aktifkan
                                        </span>
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={setIsEnabled}
                                            className="scale-75 sm:scale-90 data-[state=checked]:bg-[#00AA5B]"
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-3.5 sm:p-4 space-y-3.5">

                                {/* Bot Token Field */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            Telegram Bot Token <span className="text-rose-500">*</span>
                                        </Label>
                                        <a
                                            href="https://t.me/BotFather"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] sm:text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
                                        >
                                            Buka @BotFather <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            type={showToken ? "text" : "password"}
                                            placeholder="1234567890:ABCdefghIJKLmnopQRSTuvwXYZ..."
                                            value={botToken}
                                            onChange={(e) => setBotToken(e.target.value)}
                                            className="h-8.5 sm:h-9 pr-16 rounded-lg bg-slate-50/70 border-border/80 font-mono text-[11px] sm:text-xs focus:bg-white transition-all"
                                        />
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                                                title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                                            >
                                                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(botToken);
                                                    setCopiedToken(true);
                                                    setTimeout(() => setCopiedToken(false), 2000);
                                                }}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                                                title="Salin Token"
                                            >
                                                {copiedToken ? (
                                                    <Check className="w-3 h-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        Token rahasia yang diperoleh dari BotFather saat Anda membuat bot baru.
                                    </p>
                                </div>

                                {/* Telegram Chat ID Field */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                            Target Chat ID / ID User Penerima <span className="text-rose-500">*</span>
                                        </Label>
                                        <a
                                            href="https://t.me/userinfobot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] sm:text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
                                        >
                                            Cari Chat ID via @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>

                                    <Input
                                        type="text"
                                        placeholder="Contoh: 123456789 atau -1001234567890"
                                        value={chatId}
                                        onChange={(e) => setChatId(e.target.value)}
                                        className="h-8.5 sm:h-9 rounded-lg bg-slate-50/70 border-border/80 font-mono text-[11px] sm:text-xs focus:bg-white transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        ID unik obrolan pribadi Anda atau grup Telegram toko tujuan pengiriman notifikasi.
                                    </p>
                                </div>

                                {/* Verified Bot Info Banner if detected */}
                                {verifiedBot && (
                                    <div className="p-2.5 sm:p-3 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-md bg-sky-500 text-white flex items-center justify-center shrink-0">
                                                <Bot className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-bold text-slate-800 truncate">
                                                        {verifiedBot.firstName || "Telegram Bot"}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1 py-0.2 rounded shrink-0">
                                                        @{verifiedBot.username}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    Bot terverifikasi oleh server Telegram.
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://t.me/${verifiedBot.username}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] sm:text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline shrink-0"
                                        >
                                            Buka Bot <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                )}

                                {/* Actions: Test Connection */}
                                <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTestConnection}
                                        disabled={isTesting || !botToken.trim()}
                                        className="h-8 px-3 rounded-lg text-xs font-bold gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all w-full sm:w-auto justify-center"
                                    >
                                        {isTesting ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                                        ) : (
                                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        )}
                                        Tes Koneksi & Kirim Pesan Uji Coba
                                    </Button>

                                    <span className="text-[10px] text-muted-foreground font-medium text-center sm:text-left">
                                        {verifiedBot ? "✓ Bot siap digunakan" : "Pastikan bot sudah di-klik /start di Telegram."}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notification Types Config */}
                        <Card
                            className={cn(
                                "border-border/70 shadow-2xs rounded-xl bg-white overflow-hidden transition-opacity",
                                (!subInfo.botAllowed || !isEnabled) && "opacity-60 pointer-events-none"
                            )}
                        >
                            <CardHeader className="p-3.5 sm:p-4 border-b border-border/50 bg-[#F8FAFC]/60">
                                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                    <Bell className="w-3.5 h-3.5 text-amber-500" /> Pengaturan Pemicu Notifikasi
                                </CardTitle>
                                <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground">
                                    Pilih peristiwa transaksi yang otomatis diteruskan ke Telegram Anda.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">

                                    {/* Notify Order */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="text-xs font-bold text-slate-800">
                                                    Notifikasi Pesanan Baru (Invoice Masuk)
                                                </p>
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal">
                                                    Dapatkan pesan seketika saat pembeli membuat pesanan dan memilih metode pembayaran.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={notifyOrder}
                                            onCheckedChange={setNotifyOrder}
                                            className="scale-75 sm:scale-90 data-[state=checked]:bg-[#00AA5B] shrink-0"
                                        />
                                    </div>

                                    {/* Notify Paid */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0 border border-emerald-100">
                                                <CreditCard className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="text-xs font-bold text-slate-800">
                                                    Notifikasi Pembayaran Lunas (Pesanan Diproses)
                                                </p>
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal">
                                                    Terima rincian pendapatan bersih toko saat tagihan berhasil diverifikasi dan terbayar.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={notifyPaid}
                                            onCheckedChange={setNotifyPaid}
                                            className="scale-75 sm:scale-90 data-[state=checked]:bg-[#00AA5B] shrink-0"
                                        />
                                    </div>

                                    {/* Notify Dispute */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                                                <MessageSquareWarning className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="text-xs font-bold text-slate-800">
                                                    Notifikasi Komplain & Dispute
                                                </p>
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal">
                                                    Peringatan prioritas tinggi jika ada pembeli yang mengajukan keluhan atau kendala produk.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={notifyDispute}
                                            onCheckedChange={setNotifyDispute}
                                            className="scale-75 sm:scale-90 data-[state=checked]:bg-[#00AA5B] shrink-0"
                                        />
                                    </div>

                                    {/* Notify Review */}
                                    <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                                <Star className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="text-xs font-bold text-slate-800">
                                                    Notifikasi Ulasan & Rating Baru
                                                </p>
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal">
                                                    Ketahui respon ulasan bintang dan testimoni pembeli segera setelah transaksi selesai.
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={notifyReview}
                                            onCheckedChange={setNotifyReview}
                                            className="scale-75 sm:scale-90 data-[state=checked]:bg-[#00AA5B] shrink-0"
                                        />
                                    </div>

                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Help & Guide Column (4 Cols) */}
                    <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">

                        {/* Step-by-Step Guide Card */}
                        <Card className="border border-border/70 bg-white rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                <HelpCircle className="w-3.5 h-3.5 text-sky-500" /> Panduan Pengaturan (4 Langkah)
                            </div>

                            <div className="space-y-3 text-xs">
                                {/* Step 1 */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">Buat Bot di @BotFather</p>
                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">
                                            Buka Telegram, cari <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 hover:underline">@BotFather</a> dan kirimkan perintah:
                                        </p>
                                        <div
                                            onClick={() => handleCopyCommand("/newbot")}
                                            className="cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200/80 font-mono text-[9px] text-slate-800 font-bold border border-slate-200 transition-colors"
                                            title="Klik untuk menyalin"
                                        >
                                            <code>/newbot</code> <Copy className="w-2.5 h-2.5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">Dapatkan API Token</p>
                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">
                                            Beri nama bot Anda (misal: <i>{shop?.name || "Toko"} Bot</i>). BotFather akan membalas dengan Token API. Salin ke kolom token di kiri.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">Dapatkan Chat ID Anda</p>
                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">
                                            Kirim pesan apa saja ke <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold text-sky-600 hover:underline">@userinfobot</a> untuk melihat angka <b>Id</b> Anda. Masukkan ke kolom Target Chat ID.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        4
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">Tekan Start pada Bot Anda</p>
                                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">
                                            Cari bot Anda sendiri di Telegram, klik tombol <b>Start</b> (<code className="font-mono bg-slate-100 px-1 rounded text-[9px]">/start</code>), lalu kembali ke sini dan klik tombol <b>Tes Koneksi</b>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Token Security Notice */}
                        <Card className="border border-amber-200/80 bg-amber-50/50 rounded-xl p-3 sm:p-3.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                Keamanan & Kerahasiaan Kunci
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-amber-800/90 leading-normal font-medium">
                                Token bot hanya digunakan oleh sistem MarketPointID untuk mengirim notifikasi pesanan ke akun Anda. Jangan pernah membagikan token ini kepada orang lain.
                            </p>
                        </Card>

                        {/* Quick Links Card */}
                        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-border/70 shadow-2xs space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                Tautan Resmi Telegram
                            </span>
                            <div className="space-y-1">
                                <a
                                    href="https://t.me/BotFather"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-sky-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5 text-sky-500" /> Telegram BotFather
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>

                                <a
                                    href="https://t.me/userinfobot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-sky-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5 text-sky-500" /> UserInfoBot (Cari Chat ID)
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* Dialog Upgrade Plan Telegram Bot */}
            <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
                    <DialogHeader className="space-y-2">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                            <Crown className="w-6 h-6 text-sky-600" />
                        </div>
                        <DialogTitle className="text-base font-black text-[#212121]">
                            Upgrade ke Paket Pro atau Prime
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            Fitur Bot Notifikasi Telegram khusus tersedia untuk toko dengan paket <strong className="text-slate-800">Pro</strong> dan <strong className="text-slate-800">Prime</strong>. Dapatkan update pesanan baru, pembayaran lunas, dan kendala komplain seketika langsung di aplikasi Telegram Anda.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5 my-1">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Plan Toko Saat Ini:</span>
                            <span className="font-bold text-slate-800">{subInfo.planName}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Akses Bot Telegram:</span>
                            <span className="font-bold text-rose-600">Terkunci (Belum Tersedia)</span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowUpgradeModal(false)}
                            className="rounded-xl text-xs font-bold h-9"
                        >
                            Nanti Saja
                        </Button>
                        <Link href="/my-shop/subscription" onClick={() => setShowUpgradeModal(false)}>
                            <Button
                                className="w-full sm:w-auto rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-1.5 shadow-sm h-9"
                            >
                                <Crown className="w-3.5 h-3.5" />
                                Lihat Pilihan Plan
                            </Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}