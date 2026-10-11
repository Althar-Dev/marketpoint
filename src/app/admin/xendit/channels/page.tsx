"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Store,
  Clock,
  Search,
  RefreshCw,
  Save,
  Loader2,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Settings,
  Percent,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PaymentChannel {
  id: string;
  name: string;
  category: "QRIS" | "VIRTUAL_ACCOUNT" | "EWALLET" | "RETAIL_OUTLET" | "PAYLATER" | "CREDIT_CARD";
  channelCode: string;
  isActive: boolean;
  standardFee: string;
  feeType: "fixed" | "percentage";
  customFee: number;
  minAmount: number;
  maxAmount: number;
  description: string;
}

export const DEFAULT_CHANNELS: PaymentChannel[] = [
  // QRIS
  {
    id: "qris",
    name: "QRIS All Payment",
    category: "QRIS",
    channelCode: "QRIS",
    isActive: true,
    standardFee: "0.7%",
    feeType: "percentage",
    customFee: 0.7,
    minAmount: 1,
    maxAmount: 10000000,
    description: "Scan QR fleksibel via semua m-banking & e-wallet berstandar QRIS",
  },

  // Virtual Accounts
  {
    id: "va_bni",
    name: "BNI Virtual Account",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "BNI",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "BNI Mobile Banking, ATM BNI, dan SMS Banking",
  },
  {
    id: "va_bri",
    name: "BRI Virtual Account (BRIVA)",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "BRI",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "BRImo Mobile, ATM BRI, dan Agen BRILink",
  },
  {
    id: "va_bsi",
    name: "BSI (Bank Syariah Indonesia)",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "BSI",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "BSI Mobile dan ATM Bank Syariah Indonesia",
  },
  {
    id: "va_bss",
    name: "Bank Sahabat Sampoerna (BSS)",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "BSS",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "Virtual account Bank Sahabat Sampoerna (BSS)",
  },
  {
    id: "va_cimb",
    name: "CIMB Niaga Virtual Account",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "CIMB",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "OCTO Mobile, OCTO Clicks, dan ATM CIMB Niaga",
  },
  {
    id: "va_mandiri",
    name: "Mandiri Virtual Account",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "MANDIRI",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "Livin' by Mandiri, ATM Mandiri, dan Internet Banking",
  },
  {
    id: "va_permata",
    name: "Permata Virtual Account",
    category: "VIRTUAL_ACCOUNT",
    channelCode: "PERMATA",
    isActive: true,
    standardFee: "Rp 4.000",
    feeType: "fixed",
    customFee: 4000,
    minAmount: 10000,
    maxAmount: 50000000,
    description: "PermataMobile X, PermataNet, dan Jaringan ATM Bersama/Prima",
  },

  // E-Wallets
  {
    id: "ewallet_astrapay",
    name: "AstraPay",
    category: "EWALLET",
    channelCode: "ASTRAPAY",
    isActive: true,
    standardFee: "1.5%",
    feeType: "percentage",
    customFee: 1.5,
    minAmount: 1000,
    maxAmount: 10000000,
    description: "Dompet digital dari grup Astra",
  },
  {
    id: "ewallet_linkaja",
    name: "LinkAja",
    category: "EWALLET",
    channelCode: "LINKAJA",
    isActive: true,
    standardFee: "1.5%",
    feeType: "percentage",
    customFee: 1.5,
    minAmount: 1000,
    maxAmount: 10000000,
    description: "Dompet digital LinkAja untuk pembayaran instan",
  },
  {
    id: "ewallet_ovo",
    name: "OVO",
    category: "EWALLET",
    channelCode: "OVO",
    isActive: true,
    standardFee: "1.5%",
    feeType: "percentage",
    customFee: 1.5,
    minAmount: 1000,
    maxAmount: 10000000,
    description: "Push notifikasi bayar instan ke nomor HP OVO terdaftar",
  },

  // Retail Outlets
  {
    id: "retail_alfamart",
    name: "Alfamart / Alfamidi",
    category: "RETAIL_OUTLET",
    channelCode: "ALFAMART",
    isActive: true,
    standardFee: "Rp 5.000",
    feeType: "fixed",
    customFee: 5000,
    minAmount: 10000,
    maxAmount: 5000000,
    description: "Bayar tunai di kasir gerai Alfamart, Alfamidi, Lawson & Dan+Dan",
  },
  {
    id: "retail_indomaret",
    name: "Indomaret",
    category: "RETAIL_OUTLET",
    channelCode: "INDOMARET",
    isActive: true,
    standardFee: "Rp 5.000",
    feeType: "fixed",
    customFee: 5000,
    minAmount: 10000,
    maxAmount: 5000000,
    description: "Bayar tunai di seluruh kasir gerai Indomaret dan Ceriamart",
  },

  // PayLater
  {
    id: "paylater_akulaku",
    name: "Akulaku PayLater",
    category: "PAYLATER",
    channelCode: "AKULAKU",
    isActive: true,
    standardFee: "2.0%",
    feeType: "percentage",
    customFee: 2.0,
    minAmount: 10000,
    maxAmount: 20000000,
    description: "Cicilan kredit online instan tanpa kartu kredit via Akulaku",
  },
];

const CATEGORIES = [
  { id: "ALL", label: "Semua", icon: SlidersHorizontal },
  { id: "QRIS", label: "QRIS", icon: QrCode },
  { id: "VIRTUAL_ACCOUNT", label: "Virtual Account", icon: Building2 },
  { id: "EWALLET", label: "E-Wallet", icon: Wallet },
  { id: "RETAIL_OUTLET", label: "Retail Outlet", icon: Store },
  { id: "PAYLATER", label: "PayLater", icon: Clock },
];

export default function AdminXenditChannelsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [channels, setChannels] = useState<PaymentChannel[]>(DEFAULT_CHANNELS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Firestore Document Binding
  const xenditDocRef = useMemoFirebase(() => doc(db, "settings", "xendit"), [db]);
  const { data: xenditData, loading: xenditLoading } = useDoc(xenditDocRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Merge saved channels from Firestore with defaults
  useEffect(() => {
    if (xenditData?.paymentChannels && Array.isArray(xenditData.paymentChannels) && xenditData.paymentChannels.length > 0) {
      const savedMap = new Map<string, PaymentChannel>(
        xenditData.paymentChannels.map((c: PaymentChannel) => [c.id, c])
      );
      // Merge with defaults so new channels are never lost
      const merged = DEFAULT_CHANNELS.map((def) => {
        const saved = savedMap.get(def.id);
        return saved ? { ...def, ...saved } : def;
      });
      setChannels(merged);
    }
  }, [xenditData]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      // Category filter
      if (selectedCategory !== "ALL" && ch.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === "ACTIVE" && !ch.isActive) return false;
      if (statusFilter === "INACTIVE" && ch.isActive) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.channelCode.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [channels, selectedCategory, statusFilter, searchQuery]);

  // Counts
  const stats = useMemo(() => {
    const total = channels.length;
    const active = channels.filter((c) => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [channels]);

  // Toggle active status
  const handleToggle = (id: string, value: boolean) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: value } : c))
    );
  };

  // Edit Channel Dialog States
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null);
  const [editName, setEditName] = useState("");
  const [editFeeType, setEditFeeType] = useState<"fixed" | "percentage">("fixed");
  const [editCustomFee, setEditCustomFee] = useState<number>(0);
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleOpenEdit = (ch: PaymentChannel) => {
    setEditingChannel(ch);
    setEditName(ch.name);
    setEditFeeType(ch.feeType || "fixed");
    setEditCustomFee(ch.customFee ?? 0);
    setEditDescription(ch.description || "");
    setEditIsActive(ch.isActive);
  };

  const handleSaveEditChannel = async () => {
    if (!editingChannel) return;

    setSavingEdit(true);
    const numFee = Number(editCustomFee) || 0;
    const standardFeeStr =
      editFeeType === "percentage"
        ? `${numFee}%`
        : `Rp ${numFee.toLocaleString("id-ID")}`;

    const updatedChannels = channels.map((c) => {
      if (c.id === editingChannel.id) {
        return {
          ...c,
          name: editName.trim() || c.name,
          feeType: editFeeType,
          customFee: numFee,
          standardFee: standardFeeStr,
          description: editDescription.trim(),
          isActive: editIsActive,
        };
      }
      return c;
    });

    setChannels(updatedChannels);

    try {
      await setDoc(
        xenditDocRef,
        {
          paymentChannels: updatedChannels,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({
        title: "Pengaturan Tersimpan!",
        description: `Pengaturan ${editName.trim() || editingChannel.name} berhasil diperbarui.`,
      });
      setEditingChannel(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message || "Gagal menyimpan ke Firestore.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Bulk toggle
  const handleBulkToggle = (active: boolean) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (selectedCategory !== "ALL" && c.category !== selectedCategory) {
          return c;
        }
        return { ...c, isActive: active };
      })
    );
    toast({
      title: active ? "Semua Saluran Diaktifkan" : "Semua Saluran Dinonaktifkan",
      description: selectedCategory !== "ALL" ? `Kategori ${selectedCategory} telah diperbarui.` : "Seluruh saluran telah diperbarui.",
    });
  };

  // Save changes to Firestore
  const handleSave = async () => {
    if (!mounted) return;
    setSaving(true);
    try {
      await setDoc(
        xenditDocRef,
        {
          paymentChannels: channels,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({
        title: "Tersimpan!",
        description: "Pengaturan Payment Channels Xendit berhasil disimpan ke database.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: err.message || "Gagal menyimpan perubahan ke Firestore.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Sync from Xendit API
  const handleSyncWithXendit = async () => {
    const secretKey = xenditData?.secretKey;
    if (!secretKey) {
      toast({
        variant: "destructive",
        title: "API Key Belum Ada",
        description: "Harap konfigurasikan Secret Key Xendit di menu Config terlebih dahulu.",
      });
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_xendit_channels",
          secretKey,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        // If Xendit returns channel codes
        const apiChannelCodes = new Set(
          data.channels.map((c: any) => (c.channel_code || c.code || "").toUpperCase())
        );

        setChannels((prev) =>
          prev.map((ch) => {
            if (apiChannelCodes.has(ch.channelCode.toUpperCase())) {
              return { ...ch, isActive: true };
            }
            return ch;
          })
        );

        toast({
          title: "Sinkronisasi Berhasil",
          description: `Berhasil sinkronkan saluran aktif langsung dari akun Xendit Anda!`,
        });
      } else {
        toast({
          title: "Info Xendit",
          description: data.message || "Akun Xendit terverifikasi. Gunakan toggle manual untuk menyesuaikan saluran yang Anda inginkan.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Sinkronisasi",
        description: err.message || "Gagal menghubungi API Xendit.",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Xendit</span>
            <span>/</span>
            <span className="text-[#00AA5B]">Payment Channels</span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" /> Saluran Pembayaran Xendit
          </h2>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Atur saluran pembayaran (QRIS, VA, E-Wallet, Retail, PayLater) yang aktif untuk transaksi checkout pembeli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncWithXendit}
            disabled={syncing}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-[10px] font-bold gap-2 shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            Sync dari Xendit
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || xenditLoading}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-[10px] font-bold gap-1.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border/50 shadow-sm rounded-xl bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Saluran</p>
            <p className="text-lg font-bold text-[#212121] mt-0.5">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <CreditCard className="w-4 h-4" />
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saluran Aktif</p>
            <p className="text-lg font-bold text-[#00AA5B] mt-0.5">{stats.active}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#00AA5B]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saluran Nonaktif</p>
            <p className="text-lg font-bold text-slate-500 mt-0.5">{stats.inactive}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <XCircle className="w-4 h-4" />
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl bg-white p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kategori Didukung</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">5 Kategori</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Filter and Category Bar */}
      <Card className="border-border/50 shadow-sm rounded-xl bg-white p-3 md:p-4 space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all",
                  isSelected
                    ? "bg-[#00AA5B] text-white shadow-sm"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted-foreground/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari channel (contoh: BCA, QRIS, DANA)..."
              className="h-8 pl-8 text-[11px] rounded-lg bg-slate-50/50 border-border/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  statusFilter === "ALL" ? "bg-white text-[#212121] shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  statusFilter === "ACTIVE" ? "bg-white text-[#00AA5B] shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Aktif
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  statusFilter === "INACTIVE" ? "bg-white text-slate-600 shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Nonaktif
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggle(true)}
              className="h-7 px-2.5 text-[9px] font-bold text-[#00AA5B] border-[#00AA5B]/30 hover:bg-green-50"
            >
              Aktifkan Semua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggle(false)}
              className="h-7 px-2.5 text-[9px] font-bold text-slate-600 border-border hover:bg-slate-50"
            >
              Nonaktifkan Semua
            </Button>
          </div>
        </div>
      </Card>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredChannels.map((channel) => {
          return (
            <Card
              key={channel.id}
              className={cn(
                "border transition-all duration-200 rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-sm",
                channel.isActive
                  ? "border-green-200/80 bg-white"
                  : "border-border/40 bg-slate-50/40 opacity-80"
              )}
            >
              <CardHeader className="p-3.5 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] font-bold px-1.5 py-0 uppercase tracking-wider rounded-md",
                        channel.category === "QRIS" && "border-purple-200 text-purple-700 bg-purple-50",
                        channel.category === "VIRTUAL_ACCOUNT" && "border-blue-200 text-blue-700 bg-blue-50",
                        channel.category === "EWALLET" && "border-emerald-200 text-emerald-700 bg-emerald-50",
                        channel.category === "RETAIL_OUTLET" && "border-amber-200 text-amber-700 bg-amber-50",
                        channel.category === "PAYLATER" && "border-indigo-200 text-indigo-700 bg-indigo-50",
                        channel.category === "CREDIT_CARD" && "border-rose-200 text-rose-700 bg-rose-50"
                      )}
                    >
                      {channel.category.replace("_", " ")}
                    </Badge>
                    <span className="text-[9px] font-mono font-bold text-muted-foreground bg-slate-100 px-1.5 py-0.2 rounded">
                      {channel.channelCode}
                    </span>
                  </div>
                  <CardTitle className="text-xs font-bold text-[#212121] leading-tight">
                    {channel.name}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(channel)}
                    className="h-7 w-7 text-slate-500 hover:text-[#00AA5B] hover:bg-green-50 rounded-lg transition-colors"
                    title="Atur Fee & Nama"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <Switch
                    checked={channel.isActive}
                    onCheckedChange={(val) => handleToggle(channel.id, val)}
                    className="data-[state=checked]:bg-[#00AA5B]"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-3.5 pt-1 space-y-3">
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {channel.description}
                </p>

                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[9px]">
                  <div className="bg-slate-50 p-2 rounded-lg border border-border/30">
                    <span className="text-muted-foreground block font-medium">Fee Xendit:</span>
                    <span className="font-bold text-[#212121] text-[10px]">{channel.standardFee}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-border/30">
                    <span className="text-muted-foreground block font-medium">Status Saluran:</span>
                    <span className={cn("font-bold text-[10px] flex items-center gap-1", channel.isActive ? "text-[#00AA5B]" : "text-slate-400")}>
                      {channel.isActive ? "Aktif di Checkout" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <div className="text-[9px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                  <span>Limit: Rp {channel.minAmount.toLocaleString("id-ID")} - Rp {channel.maxAmount.toLocaleString("id-ID")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border/60">
          <CreditCard className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Tidak ada saluran ditemukan</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Coba ubah kata kunci pencarian atau ganti filter kategori.
          </p>
        </div>
      )}

      {/* Quick Link Footer to Config */}
      <Card className="border-border/50 shadow-sm rounded-xl bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-[#212121]">Perlu Mengubah API Key Xendit?</h4>
            <p className="text-[9px] text-muted-foreground">Kunjungi halaman konfigurasi untuk memperbarui Secret API Key atau mengecek saldo.</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold gap-1 text-[#00AA5B] border-[#00AA5B]/30 hover:bg-green-50 shrink-0">
          <Link href="/admin/xendit/config">
            Buka Konfigurasi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </Card>

      {/* Modal / Dialog Pengaturan Channel (Edit Nama & Fee) */}
      <Dialog open={!!editingChannel} onOpenChange={(open) => !open && setEditingChannel(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-white">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 shrink-0 text-left pr-12">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-[#212121]">
              <div className="w-7 h-7 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center text-[#00AA5B] shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              Pengaturan Saluran Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Ubah nama tampilan, tipe biaya (persentase / harga tetap), dan nominal fee saluran ini.
            </DialogDescription>
          </DialogHeader>

          {editingChannel && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
              {/* Nama Saluran */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  Nama Saluran Pembayaran
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: BNI Virtual Account"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              {/* Tipe Biaya / Fee Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  Model Biaya Layanan / Fee
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFeeType("fixed")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      editFeeType === "fixed"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Harga Tetap (Rp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditFeeType("percentage")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      editFeeType === "percentage"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <Percent className="w-4 h-4" />
                    <span>Persentase (%)</span>
                  </button>
                </div>
              </div>

              {/* Input Nominal / Nilai Fee */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  {editFeeType === "percentage" ? "Persentase Biaya (%)" : "Nominal Biaya (Rp)"}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step={editFeeType === "percentage" ? "0.1" : "100"}
                    min="0"
                    value={editCustomFee}
                    onChange={(e) => setEditCustomFee(Number(e.target.value))}
                    placeholder={editFeeType === "percentage" ? "Contoh: 1.5" : "Contoh: 4000"}
                    className="h-9 text-xs rounded-lg pl-9"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {editFeeType === "percentage" ? "%" : "Rp"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Pratinjau Fee: <strong className="text-[#00AA5B]">
                    {editFeeType === "percentage" ? `${editCustomFee}% per transaksi` : `Rp ${Number(editCustomFee).toLocaleString("id-ID")} per transaksi`}
                  </strong>
                </p>
              </div>

              {/* Deskripsi Saluran */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  Deskripsi Saluran
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  placeholder="Keterangan singkat saluran pembayaran..."
                  className="text-xs rounded-lg resize-none min-h-[60px]"
                />
              </div>

              {/* Toggle Status Aktif */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/60">
                <div>
                  <p className="text-xs font-bold text-[#212121]">Status Saluran</p>
                  <p className="text-[10px] text-muted-foreground">Aktifkan agar dapat dipilih pembeli di checkout</p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-3.5 sm:p-4 border-t border-border/60 shrink-0 bg-slate-50/90 flex flex-row items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingChannel(null)}
              className="h-9 px-4 text-xs font-bold rounded-lg border-border hover:bg-slate-100"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={savingEdit}
              onClick={handleSaveEditChannel}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5 shadow-sm shadow-[#00AA5B]/20"
            >
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
