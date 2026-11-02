"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  MessageCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MANUAL_PAYMENT_CHANNELS,
  ADMIN_CONTACT,
  ManualPaymentChannel,
} from "@/lib/manual-topup";
import { useUser } from "@/firebase";

interface ManualTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000, 500000, 1000000];

export function ManualTopUpDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManualTopUpDialogProps) {
  const { user } = useUser();

  // Step 1: Input / Selection
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("bca");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 2: Invoice / Payment View
  const [activeInvoice, setActiveInvoice] = useState<{
    invoiceNumber: string;
    totalAmount: number;
    nominal: number;
    channel: ManualPaymentChannel;
    whatsappUrl: string;
    expiresAt: string;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [copiedTotalAmount, setCopiedTotalAmount] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Countdown timer for 15 minutes expiration
  useEffect(() => {
    if (!activeInvoice?.expiresAt) return;

    const checkTime = () => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(activeInvoice.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remainingSeconds);
      if (remainingSeconds <= 0) {
        setIsExpired(true);
      }
    };

    checkTime();
    const intervalId = setInterval(checkTime, 1000);
    return () => clearInterval(intervalId);
  }, [activeInvoice?.expiresAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const activeChannel =
    MANUAL_PAYMENT_CHANNELS.find((c) => c.id === selectedChannelId) ||
    MANUAL_PAYMENT_CHANNELS[0];

  const currentNominal = customAmount ? Number(customAmount) || 0 : selectedAmount;

  const handleSelectQuickAmount = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount("");
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    setSelectedAmount(0);
    setErrorMsg(null);
  };

  const handleSubmitRequest = async () => {
    if (currentNominal < 10000) {
      setErrorMsg("Nominal pengisian minimal Rp 10.000.");
      return;
    }
    if (currentNominal > 50000000) {
      setErrorMsg("Nominal pengisian maksimal Rp 50.000.000.");
      return;
    }
    if (!user?.uid) {
      setErrorMsg("Anda harus masuk terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/wallet/topup/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          amount: currentNominal,
          channelId: selectedChannelId,
          buyerName: user.displayName || user.email?.split("@")[0] || "Pengguna",
          buyerEmail: user.email,
          buyerPhone: user.phoneNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal membuat pengajuan top up.");
      }

      const expiresAt = data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString();

      setActiveInvoice({
        invoiceNumber: data.transaction.invoiceNumber,
        totalAmount: data.totalAmount,
        nominal: currentNominal,
        channel: data.channel,
        whatsappUrl: data.whatsappUrl,
        expiresAt,
      });

      setIsExpired(false);
      setTimeLeft(15 * 60);

      // Buka otomatis WhatsApp ke admin
      if (data.whatsappUrl && typeof window !== "undefined") {
        window.open(data.whatsappUrl, "_blank");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kendala saat mengajukan top up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeInvoice || !user) return;
    setIsCancelling(true);
    setErrorMsg(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/wallet/topup/manual", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          invoiceNumber: activeInvoice.invoiceNumber,
          action: "cancel",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal membatalkan pengajuan.");
      }

      handleReset();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membatalkan pengajuan top up.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyTotal = () => {
    if (!activeInvoice?.totalAmount) return;
    navigator.clipboard.writeText(String(activeInvoice.totalAmount));
    setCopiedTotalAmount(true);
    setTimeout(() => setCopiedTotalAmount(false), 2000);
  };

  const handleCopyInvoiceNumber = () => {
    if (!activeInvoice?.invoiceNumber) return;
    navigator.clipboard.writeText(activeInvoice.invoiceNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleReset = () => {
    setActiveInvoice(null);
    setErrorMsg(null);
    setIsExpired(false);
    setTimeLeft(15 * 60);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-5 sm:p-6 bg-white border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* VIEW 1: FORM PENGAJUAN TOP UP */}
        {!activeInvoice ? (
          <>
            <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Top Up Saldo Manual
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Transfer langsung ke rekening resmi MarketPoint & konfirmasi via WhatsApp.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Pilihan Nominal Cepat */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Pilih Nominal Isi Ulang
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectQuickAmount(amt)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer",
                          isSelected
                            ? "border-[#00AA5B] bg-emerald-50/70 text-[#00AA5B] shadow-2xs"
                            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        Rp {amt.toLocaleString("id-ID")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Nominal Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Atau Masukkan Nominal Lain (Min. Rp 10.000)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <Input
                    type="text"
                    value={
                      customAmount
                        ? Number(customAmount).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={handleCustomAmountChange}
                    placeholder="Contoh: 75.000"
                    className="h-10 pl-10 text-xs font-bold rounded-xl border-slate-200 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
                  />
                </div>
              </div>

              {/* Pilihan Metode Pembayaran / Rekening Tujuan */}
              <div>
                <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                  Pilih Rekening Tujuan Transfer
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MANUAL_PAYMENT_CHANNELS.map((ch) => {
                    const isSelected = selectedChannelId === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedChannelId(ch.id)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer relative",
                          isSelected
                            ? "border-[#00AA5B] bg-emerald-50/40 ring-1 ring-[#00AA5B]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="h-5 w-14 relative flex items-center">
                            <Image
                              src={ch.logo}
                              alt={ch.label}
                              width={56}
                              height={20}
                              className="object-contain max-h-5"
                            />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00AA5B]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {ch.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Ringkasan Estimasi & Submit Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Nominal Top Up:</span>
                  <span className="font-bold text-slate-800">
                    Rp {currentNominal.toLocaleString("id-ID")}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting || currentNominal < 10000}
                  className="w-full h-10.5 rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white font-bold text-xs gap-2 cursor-pointer shadow-xs transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyiapkan Instruksi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut ke Pembayaran Manual</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* VIEW 2: RINCIAN INVOICE & INSTRUKSI TRANSFER */
          <>
            <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <Badge
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 border",
                    isExpired
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}
                >
                  {isExpired ? "Kadaluarsa (Expired)" : "Menunggu Transfer"}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-slate-900 pt-1">
                Instruksi Pembayaran Top Up
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Silakan lakukan transfer sesuai jumlah tepat di bawah ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Countdown Timer or Expired Alert */}
              {!isExpired ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Sisa Waktu Pembayaran:</span>
                  </div>
                  <span className="font-mono font-bold text-amber-900 text-sm tracking-wide">
                    {formatTimer(timeLeft)}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Batas Waktu Pembayaran Habis (Kadaluarsa)</span>
                  </div>
                  <p className="text-[11px] text-rose-600 leading-relaxed">
                    Batas waktu 15 menit telah terlewati. Tagihan ini telah otomatis dibatalkan / kadaluarsa.
                  </p>
                </div>
              )}

              {/* Invoice Number Header */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Nomor Tagihan:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                  <span>{activeInvoice.invoiceNumber}</span>
                  <button
                    type="button"
                    onClick={handleCopyInvoiceNumber}
                    title="Salin Nomor Invoice"
                    className="text-[#00AA5B] hover:opacity-80 cursor-pointer"
                  >
                    {copiedInvoice ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Total Transfer Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white border border-[#00AA5B]/30 text-center space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  TOTAL NOMINAL TRANSFER
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black text-slate-900 tracking-tight">
                    Rp {activeInvoice.totalAmount.toLocaleString("id-ID")}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTotal}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#00AA5B] text-[#00AA5B] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    {copiedTotalAmount ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[10px]">
                      {copiedTotalAmount ? "Tersalin" : "Salin"}
                    </span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Admin Destination Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-14 relative flex items-center">
                      <Image
                        src={activeInvoice.channel.logo}
                        alt={activeInvoice.channel.label}
                        width={56}
                        height={24}
                        className="object-contain max-h-6"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {activeInvoice.channel.label || activeInvoice.channel.name}
                    </span>
                  </div>
                  <Badge className="bg-emerald-50 text-[#00AA5B] border-emerald-200 text-[10px] font-semibold">
                    Admin Keuangan
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      WhatsApp Konfirmasi Top Up:
                    </span>
                    <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                      {ADMIN_CONTACT.displayPhone}
                    </span>
                    <span className="text-[11px] text-[#00AA5B] block font-semibold">
                      +{ADMIN_CONTACT.phone} ({ADMIN_CONTACT.name})
                    </span>
                  </div>

                  {!isExpired && (
                    <a
                      href={activeInvoice.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 px-3 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:bg-[#20BE5B] inline-flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Chat WA</span>
                    </a>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Nomor rekening resmi / barcode QRIS pembayaran akan diberikan langsung oleh Admin pada chat WhatsApp untuk keamanan transaksi Anda.
                </p>
              </div>

              {/* Petunjuk Singkat */}
              <div className="space-y-1 text-[11px] text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block">Langkah Konfirmasi:</span>
                <p>1. Klik tombol hijau di bawah untuk terhubung ke WhatsApp Admin ({ADMIN_CONTACT.displayPhone}).</p>
                <p>2. Format pesan berisi nomor invoice dan nominal sudah disiapkan secara otomatis.</p>
                <p>3. Admin akan memberikan rekening / QRIS resmi dan segera memproses pengisian saldo akun Anda.</p>
              </div>

              {/* Main Action Buttons */}
              <div className="space-y-2 pt-1">
                {isExpired ? (
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Buat Pengajuan Baru</span>
                  </Button>
                ) : (
                  <>
                    {/* 1. Open WhatsApp Button */}
                    <a
                      href={activeInvoice.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20BE5B] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Kirim Pesan ke WhatsApp ({ADMIN_CONTACT.displayPhone})</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    {/* 2. Cek Saldo / Selesai */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (onSuccess) onSuccess();
                        onOpenChange(false);
                      }}
                      className="w-full h-9.5 rounded-xl border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <span>Selesai & Cek Riwayat Saldo</span>
                    </Button>

                    {/* 3. Batalkan Pengajuan Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelRequest}
                      disabled={isCancelling}
                      className="w-full h-9.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      {isCancelling ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Membatalkan Pengajuan...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Batalkan Pengajuan Top Up</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
