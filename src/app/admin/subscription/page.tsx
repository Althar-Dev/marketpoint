"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Crown,
  Percent,
  Sparkles,
  Zap,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  Users,
  Store,
  Layers,
  Calculator,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Ticket,
  Flame,
  Bot,
  Code2,
  Headphones,
  Search,
  Edit3,
  Check,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PlanConfigItem, DEFAULT_PLANS_CONFIG } from "@/lib/subscription-plans";

interface ShopSubRow {
  shopId: string;
  planId: string;
  planName: string;
  billingCycle: string;
  maxProducts: number;
  commissionRate: number;
  status: string;
  subscribedAt: string;
  expiresAt: string;
  shopName?: string;
}

export default function AdminSubscriptionPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions" | "calculator">("plans");

  // Plans Config State
  const [plans, setPlans] = useState<PlanConfigItem[]>(DEFAULT_PLANS_CONFIG);
  const [subscriptions, setSubscriptions] = useState<ShopSubRow[]>([]);
  const [searchSub, setSearchSub] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(100000);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Settings & Subscriptions
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscription");
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.settings?.plans && Array.isArray(data.settings.plans) && data.settings.plans.length > 0) {
          setPlans(data.settings.plans);
        } else {
          setPlans(DEFAULT_PLANS_CONFIG);
        }
        if (Array.isArray(data.subscriptions)) {
          setSubscriptions(data.subscriptions);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Gagal memuat data",
          description: data.error || "Terjadi kesalahan saat memuat konfigurasi.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Koneksi Error",
        description: "Gagal terhubung ke server untuk mengambil data subscription.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  // Handle Plan Field Changes
  const handleUpdatePlan = (id: string, field: keyof PlanConfigItem, value: any) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleUpdateFeature = (id: string, featureKey: keyof PlanConfigItem["features"], value: boolean) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          features: {
            ...p.features,
            [featureKey]: value,
          },
        };
      })
    );
  };

  const handleAddCustomFeature = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          customFeatures: [...(p.customFeatures || []), "Fitur baru"],
        };
      })
    );
  };

  const handleUpdateCustomFeature = (id: string, index: number, value: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = [...(p.customFeatures || [])];
        updated[index] = value;
        return { ...p, customFeatures: updated };
      })
    );
  };

  const handleRemoveCustomFeature = (id: string, index: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = (p.customFeatures || []).filter((_, i) => i !== index);
        return { ...p, customFeatures: updated };
      })
    );
  };

  // Modal Edit Plan State
  const [editingPlan, setEditingPlan] = useState<PlanConfigItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingModal, setSavingModal] = useState(false);

  const openEditModal = (plan: PlanConfigItem) => {
    const def = DEFAULT_PLANS_CONFIG.find((d) => d.id === plan.id);
    const planCopy = JSON.parse(JSON.stringify(plan));
    if (planCopy.maxVouchers === undefined) {
      planCopy.maxVouchers = def?.maxVouchers ?? 0;
    }
    if (planCopy.maxFlashSaleProducts === undefined) {
      planCopy.maxFlashSaleProducts = def?.maxFlashSaleProducts ?? 0;
    }
    setEditingPlan(planCopy);
    setIsModalOpen(true);
  };

  const handleModalFieldChange = (field: keyof PlanConfigItem, value: any) => {
    if (!editingPlan) return;
    setEditingPlan((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleModalFeatureToggle = (featureKey: keyof PlanConfigItem["features"], value: boolean) => {
    if (!editingPlan) return;
    setEditingPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: value,
        },
      };
    });
  };

  const handleAddModalCustomFeature = () => {
    if (!editingPlan) return;
    setEditingPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        customFeatures: [...(prev.customFeatures || []), "Fitur baru"],
      };
    });
  };

  const handleUpdateModalCustomFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    setEditingPlan((prev) => {
      if (!prev) return null;
      const list = [...(prev.customFeatures || [])];
      list[index] = value;
      return { ...prev, customFeatures: list };
    });
  };

  const handleRemoveModalCustomFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan((prev) => {
      if (!prev) return null;
      const list = (prev.customFeatures || []).filter((_, i) => i !== index);
      return { ...prev, customFeatures: list };
    });
  };

  const handleSaveModal = async () => {
    if (!editingPlan) return;
    setSavingModal(true);
    try {
      const updatedPlans = plans.map((p) => (p.id === editingPlan.id ? editingPlan : p));
      setPlans(updatedPlans);

      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_plans",
          plans: updatedPlans,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Berhasil Disimpan",
          description: `Konfigurasi plan ${editingPlan.name} berhasil diperbarui!`,
        });
        if (data.settings?.plans) {
          setPlans(data.settings.plans);
        }
        setIsModalOpen(false);
        setEditingPlan(null);
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: data.error || "Gagal menyimpan perubahan ke database.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan jaringan.",
      });
    } finally {
      setSavingModal(false);
    }
  };

  // Save All Plans & Commissions
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_plans",
          plans,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Berhasil Disimpan",
          description: "Pengaturan plan langganan dan tarif komisi berhasil diperbarui!",
        });
        if (data.settings?.plans) {
          setPlans(data.settings.plans);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: data.error || "Terjadi kesalahan saat menyimpan pengaturan.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan jaringan.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to Default
  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan seluruh plan ke pengaturan standar sistem?")) {
      setPlans(DEFAULT_PLANS_CONFIG);
      toast({
        title: "Reset Berhasil",
        description: "Klik 'Simpan Perubahan' untuk menerapkan pengaturan standar ke database.",
      });
    }
  };

  // Cancel Shop Subscription Action
  const handleCancelShopSub = async (shopId: string) => {
    if (!confirm(`Batalkan status berlangganan untuk toko ${shopId}?`)) return;
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_shop_subscription",
          shopId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Berhasil", description: data.message });
        loadData();
      } else {
        toast({ variant: "destructive", title: "Gagal", description: data.error });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  // Filtered Subscriptions
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch = s.shopId.toLowerCase().includes(searchSub.toLowerCase()) ||
        (s.shopName && s.shopName.toLowerCase().includes(searchSub.toLowerCase()));
      const matchPlan = filterPlan === "all" || s.planId.toLowerCase() === filterPlan.toLowerCase();
      return matchSearch && matchPlan;
    });
  }, [subscriptions, searchSub, filterPlan]);

  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const plusCount = subscriptions.filter((s) => s.planId === "plus" && s.status === "ACTIVE").length;
  const proCount = subscriptions.filter((s) => s.planId === "pro" && s.status === "ACTIVE").length;
  const primeCount = subscriptions.filter((s) => s.planId === "prime" && s.status === "ACTIVE").length;

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#212121] flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Manajemen Plan & Komisi Toko
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Atur tarif komisi, batas produk, harga plan, dan fitur eksklusif untuk setiap level toko.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-[#00AA5B]")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="h-8 px-3 rounded-lg border-border/60 bg-white hover:bg-slate-50 text-xs font-bold gap-1.5 shadow-2xs text-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs font-bold gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-5">
        <TabsList className="bg-white border border-border/60 p-1 rounded-xl shadow-2xs h-auto">
          <TabsTrigger value="plans" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00AA5B] data-[state=active]:text-white gap-2 py-1.5 px-3">
            <Layers className="w-3.5 h-3.5" /> Konfigurasi 4 Plan
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00AA5B] data-[state=active]:text-white gap-2 py-1.5 px-3">
            <Users className="w-3.5 h-3.5" /> Toko Berlangganan
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {subscriptions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00AA5B] data-[state=active]:text-white gap-2 py-1.5 px-3">
            <Calculator className="w-3.5 h-3.5" /> Kalkulator Komisi
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: PLANS CONFIG ────────────────────────────────────────────── */}
        <TabsContent value="plans" className="space-y-5">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-border/60 shadow-2xs bg-white rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Free Tier</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {plans.find((p) => p.id === "free")?.commissionRate ?? 7}% Komisi
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 shadow-2xs bg-white rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Plan Plus</p>
                  <p className="text-sm font-bold text-blue-950 mt-0.5">
                    {plans.find((p) => p.id === "plus")?.commissionRate ?? 5}% Komisi
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 shadow-2xs bg-white rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Plan Pro</p>
                  <p className="text-sm font-bold text-emerald-950 mt-0.5">
                    {plans.find((p) => p.id === "pro")?.commissionRate ?? 3.5}% Komisi
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/60 shadow-2xs bg-white rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Plan Prime</p>
                  <p className="text-sm font-bold text-amber-950 mt-0.5">
                    {plans.find((p) => p.id === "prime")?.commissionRate ?? 2}% Komisi
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* 4 Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 items-stretch">
            {plans.map((plan) => {
              const isFree = plan.id === "free";
              const isPlus = plan.id === "plus";
              const isPro = plan.id === "pro";
              const isPrime = plan.id === "prime";
              const activeFeaturesCount = Object.values(plan.features || {}).filter(Boolean).length;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "border shadow-2xs rounded-2xl bg-white overflow-hidden flex flex-col justify-between transition-all hover:shadow-md",
                    isPrime && "border-amber-300 ring-1 ring-amber-300/30",
                    isPro && "border-emerald-300 ring-1 ring-emerald-300/30",
                    isPlus && "border-blue-200",
                    isFree && "border-slate-200"
                  )}
                >
                  {/* Card Header */}
                  <div>
                    <CardHeader
                      className={cn(
                        "p-4 border-b space-y-2.5",
                        isPrime && "bg-amber-50/40 border-amber-100",
                        isPro && "bg-emerald-50/40 border-emerald-100",
                        isPlus && "bg-blue-50/30 border-blue-100",
                        isFree && "bg-slate-50/50 border-slate-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider",
                            isPrime && "bg-amber-100 text-amber-800",
                            isPro && "bg-emerald-100 text-emerald-800",
                            isPlus && "bg-blue-100 text-blue-800",
                            isFree && "bg-slate-200 text-slate-800"
                          )}
                        >
                          {plan.id} Tier
                        </Badge>

                        {plan.popular && (
                          <span className="text-[10px] font-bold text-[#00AA5B] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ⭐ Populer
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                            isPrime && "bg-amber-100 text-amber-600",
                            isPro && "bg-emerald-100 text-emerald-600",
                            isPlus && "bg-blue-100 text-blue-600",
                            isFree && "bg-slate-100 text-slate-600"
                          )}
                        >
                          {isPrime && <Crown className="w-5 h-5" />}
                          {isPro && <Rocket className="w-5 h-5" />}
                          {isPlus && <Zap className="w-5 h-5" />}
                          {isFree && <Store className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-[#212121] truncate">{plan.name}</h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {plan.description || "Tidak ada deskripsi"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Card Body Summary */}
                    <CardContent className="p-4 space-y-4">
                      {/* Price Box */}
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block tracking-wider">
                          Biaya Langganan
                        </span>
                        {isFree ? (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-extrabold text-[#212121]">Free</span>
                              <span className="text-xs text-muted-foreground font-medium">Selamanya</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              Rp 0 / tahun (Akses Dasar)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-extrabold text-[#00AA5B]">
                                Rp {Number(plan.monthlyPrice || 0).toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">/ bln</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              Rp {Number(plan.yearlyPrice || 0).toLocaleString("id-ID")} / tahun
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Key Metrics Grid (2x2 Balanced & Uniform) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-[60px] p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block truncate">
                            Komisi Toko
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 block truncate">
                            {plan.commissionRate}%
                          </span>
                        </div>

                        <div className="h-[60px] p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block truncate">
                            Batas Produk
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 block truncate">
                            {plan.maxProducts === -1 ? (
                              <span className="text-[#00AA5B] font-extrabold">Unlimited</span>
                            ) : (
                              `${plan.maxProducts} Item`
                            )}
                          </span>
                        </div>

                        <div className="h-[60px] p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block truncate" title="Voucher Toko">
                            Voucher Toko
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 block truncate">
                            {(() => {
                              const def = DEFAULT_PLANS_CONFIG.find((d) => d.id === plan.id);
                              const val = plan.maxVouchers !== undefined ? plan.maxVouchers : (def?.maxVouchers ?? 0);
                              if (val === -1) return <span className="text-[#00AA5B] font-extrabold">Unlimited</span>;
                              if (val === 0) return <span className="text-slate-400 font-semibold text-xs">Nonaktif</span>;
                              return `${val} Kupon`;
                            })()}
                          </span>
                        </div>

                        <div className="h-[60px] p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block truncate" title="Flash Sale">
                            Flash Sale
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 block truncate">
                            {(() => {
                              const def = DEFAULT_PLANS_CONFIG.find((d) => d.id === plan.id);
                              const val = plan.maxFlashSaleProducts !== undefined ? plan.maxFlashSaleProducts : (def?.maxFlashSaleProducts ?? 0);
                              if (val === -1) return <span className="text-[#00AA5B] font-extrabold">Unlimited</span>;
                              if (val === 0) return <span className="text-slate-400 font-semibold text-xs">Nonaktif</span>;
                              return `${val} Produk`;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Special Features Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                            Fitur Khusus
                          </span>
                          <span className="text-[10px] font-bold text-[#00AA5B]">
                            {activeFeaturesCount} Aktif
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {plan.features?.voucherToko && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-md">
                              <Ticket className="w-3 h-3 text-amber-500" /> Voucher
                            </span>
                          )}
                          {plan.features?.flashSale && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200/60 px-2 py-0.5 rounded-md">
                              <Flame className="w-3 h-3 text-red-500" /> Flash Sale
                            </span>
                          )}
                          {plan.features?.badgeVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-blue-500" /> Verified
                            </span>
                          )}
                          {plan.features?.badgeOfficial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-md">
                              <Crown className="w-3 h-3 text-amber-500" /> Official
                            </span>
                          )}
                          {plan.features?.telegramBot && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded-md">
                              <Bot className="w-3 h-3 text-sky-500" /> Bot WA/TG
                            </span>
                          )}
                          {plan.features?.resellerApi && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-md">
                              <Code2 className="w-3 h-3 text-purple-500" /> API Reseller
                            </span>
                          )}
                          {plan.features?.prioritySupport && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              <Headphones className="w-3 h-3 text-emerald-500" /> VIP Support
                            </span>
                          )}
                          {activeFeaturesCount === 0 && (
                            <span className="text-[11px] text-muted-foreground italic">
                              Hanya fitur dasar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bullet points display */}
                      <div className="space-y-1.5 pt-2 border-t border-border/40">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                          Poin Tampilan ({plan.customFeatures?.length || 0})
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {(plan.customFeatures || []).slice(0, 4).map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-[#00AA5B] shrink-0" />
                              <span className="truncate">{feat}</span>
                            </li>
                          ))}
                          {(plan.customFeatures || []).length > 4 && (
                            <li className="text-[10px] text-muted-foreground pl-5 italic">
                              + {(plan.customFeatures || []).length - 4} poin lainnya...
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Action */}
                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => openEditModal(plan)}
                      variant="outline"
                      className="w-full h-9 rounded-xl border-border/80 hover:border-[#00AA5B] hover:bg-[#00AA5B]/5 hover:text-[#00AA5B] font-bold text-xs gap-1.5 transition-all shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00AA5B]" /> Edit Plan
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── MODAL EDIT KONFIGURASI PLAN ───────────────────────────────── */}
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
              setIsModalOpen(false);
              setEditingPlan(null);
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-0 rounded-2xl border-border/80 shadow-2xl bg-white">
              {editingPlan && (
                <div>
                  {/* Modal Header */}
                  <DialogHeader className="p-5 border-b bg-slate-50/70 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center justify-between pr-6">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider",
                            editingPlan.id === "prime" && "bg-amber-100 text-amber-800",
                            editingPlan.id === "pro" && "bg-emerald-100 text-emerald-800",
                            editingPlan.id === "plus" && "bg-blue-100 text-blue-800",
                            editingPlan.id === "free" && "bg-slate-200 text-slate-800"
                          )}
                        >
                          {editingPlan.id} Tier
                        </Badge>
                        {editingPlan.popular && (
                          <span className="text-[10px] font-bold text-[#00AA5B] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ⭐ Populer
                          </span>
                        )}
                      </div>
                    </div>
                    <DialogTitle className="text-lg font-extrabold text-[#212121] mt-1.5">
                      Edit Konfigurasi Plan: {editingPlan.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Sesuaikan nama, tarif komisi, batas produk, harga, fitur khusus, dan poin tampilan kartu.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Modal Body */}
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* 1. Informasi Dasar */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#00AA5B]" /> 1. Informasi Dasar
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Nama Plan</Label>
                          <Input
                            value={editingPlan.name}
                            onChange={(e) => handleModalFieldChange("name", e.target.value)}
                            placeholder="Contoh: Pro, Plus..."
                            className="h-9 text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Tandai Populer</Label>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                            <span className="text-xs text-slate-600 font-medium">⭐ Badge Rekomendasi</span>
                            <Switch
                              checked={Boolean(editingPlan.popular)}
                              onCheckedChange={(val) => handleModalFieldChange("popular", val)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</Label>
                        <Input
                          value={editingPlan.description}
                          onChange={(e) => handleModalFieldChange("description", e.target.value)}
                          placeholder="Deskripsi singkat yang tampil di kartu harga..."
                          className="h-9 text-xs rounded-lg"
                        />
                      </div>
                    </div>

                    {/* 2. Tarif Komisi & Batasan Produk & Fitur */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-[#00AA5B]" /> 2. Tarif Komisi & Batasan Kuota
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Komisi Platform (%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editingPlan.commissionRate}
                              onChange={(e) =>
                                handleModalFieldChange("commissionRate", parseFloat(e.target.value) || 0)
                              }
                              className="h-9 text-xs font-bold pr-8 rounded-lg"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              %
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Potongan komisi otomatis saat pesanan toko berstatus selesai.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Batas Maksimal Produk</Label>
                          <Input
                            type="number"
                            value={editingPlan.maxProducts}
                            onChange={(e) =>
                              handleModalFieldChange("maxProducts", parseInt(e.target.value) || 0)
                            }
                            className="h-9 text-xs font-bold rounded-lg"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Masukkan <span className="font-semibold text-slate-800">-1</span> untuk kuota tanpa batas (Unlimited).
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-amber-500" /> Limit Voucher Toko
                          </Label>
                          <Input
                            type="number"
                            value={
                              editingPlan.maxVouchers !== undefined
                                ? editingPlan.maxVouchers
                                : (DEFAULT_PLANS_CONFIG.find((d) => d.id === editingPlan.id)?.maxVouchers ?? 0)
                            }
                            onChange={(e) =>
                              handleModalFieldChange("maxVouchers", parseInt(e.target.value) || 0)
                            }
                            className="h-9 text-xs font-bold rounded-lg"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Batas voucher aktif (<span className="font-semibold text-slate-800">-1</span> = Unlimited, <span className="font-semibold text-slate-800">0</span> = Nonaktif).
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-red-500" /> Limit Produk Flash Sale
                          </Label>
                          <Input
                            type="number"
                            value={
                              editingPlan.maxFlashSaleProducts !== undefined
                                ? editingPlan.maxFlashSaleProducts
                                : (DEFAULT_PLANS_CONFIG.find((d) => d.id === editingPlan.id)?.maxFlashSaleProducts ?? 0)
                            }
                            onChange={(e) =>
                              handleModalFieldChange("maxFlashSaleProducts", parseInt(e.target.value) || 0)
                            }
                            className="h-9 text-xs font-bold rounded-lg"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Maksimal produk ikut flash sale (<span className="font-semibold text-slate-800">-1</span> = Unlimited, <span className="font-semibold text-slate-800">0</span> = Nonaktif).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Harga Berlangganan (Bulanan & Tahunan) */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#00AA5B]" /> 3. Biaya Berlangganan
                      </h4>
                      {editingPlan.id === "free" ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                          Tier Gratis (<span className="font-semibold">Free</span>) bersifat gratis permanen untuk semua toko baru (Rp 0).
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Harga Bulanan (Rp)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={editingPlan.monthlyPrice}
                              onChange={(e) =>
                                handleModalFieldChange("monthlyPrice", parseInt(e.target.value) || 0)
                              }
                              className="h-9 text-xs font-bold rounded-lg"
                            />
                            <p className="text-[11px] font-bold text-[#00AA5B]">
                              Rp {Number(editingPlan.monthlyPrice || 0).toLocaleString("id-ID")} / bulan
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Harga Tahunan (Rp)</Label>
                            <Input
                              type="number"
                              step="1000"
                              value={editingPlan.yearlyPrice}
                              onChange={(e) =>
                                handleModalFieldChange("yearlyPrice", parseInt(e.target.value) || 0)
                              }
                              className="h-9 text-xs font-bold rounded-lg"
                            />
                            <p className="text-[11px] font-bold text-[#00AA5B]">
                              Rp {Number(editingPlan.yearlyPrice || 0).toLocaleString("id-ID")} / tahun
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Akses Fitur Eksklusif */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" /> 4. Akses Fitur Khusus
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Voucher Toko</p>
                              <p className="text-[10px] text-muted-foreground">Buat kupon promo diskon toko</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.voucherToko)}
                            onCheckedChange={(val) => handleModalFeatureToggle("voucherToko", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-red-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Ikut Flash Sale</p>
                              <p className="text-[10px] text-muted-foreground">Daftarkan produk ke event flash sale</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.flashSale)}
                            onCheckedChange={(val) => handleModalFeatureToggle("flashSale", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Badge Verified</p>
                              <p className="text-[10px] text-muted-foreground">Centang biru toko terverifikasi</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.badgeVerified)}
                            onCheckedChange={(val) => handleModalFeatureToggle("badgeVerified", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Badge Official</p>
                              <p className="text-[10px] text-muted-foreground">Label toko resmi (Official Store)</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.badgeOfficial)}
                            onCheckedChange={(val) => handleModalFeatureToggle("badgeOfficial", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-sky-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Bot Telegram</p>
                              <p className="text-[10px] text-muted-foreground">Otomatisasi notifikasi & bot toko</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.telegramBot)}
                            onCheckedChange={(val) => handleModalFeatureToggle("telegramBot", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-purple-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">API Reseller</p>
                              <p className="text-[10px] text-muted-foreground">Integrasi API untuk reseller</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.resellerApi)}
                            onCheckedChange={(val) => handleModalFeatureToggle("resellerApi", val)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <Headphones className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">Prioritas Support</p>
                              <p className="text-[10px] text-muted-foreground">Dukungan teknis VIP dan respon cepat</p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(editingPlan.features?.prioritySupport)}
                            onCheckedChange={(val) => handleModalFeatureToggle("prioritySupport", val)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. Poin Keunggulan Tampilan Kartu */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#00AA5B]" /> 5. Poin Tampilan Kartu
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Daftar poin yang tampil di kartu penawaran Plan calon merchant.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddModalCustomFeature}
                          className="h-7 text-xs font-bold text-[#00AA5B] border-[#00AA5B]/40 hover:bg-[#00AA5B]/10 gap-1 rounded-lg"
                        >
                          <Plus className="w-3 h-3" /> Tambah Poin
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(editingPlan.customFeatures || []).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={feat}
                              onChange={(e) => handleUpdateModalCustomFeature(idx, e.target.value)}
                              className="h-8 text-xs rounded-lg"
                              placeholder="Poin keunggulan Plan..."
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveModalCustomFeature(idx)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {(editingPlan.customFeatures || []).length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-2">
                            Belum ada poin keunggulan. Klik &quot;Tambah Poin&quot; untuk menambahkan.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <DialogFooter className="p-4 border-t bg-slate-50/70 sticky bottom-0 z-10 backdrop-blur-md flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingPlan(null);
                      }}
                      disabled={savingModal}
                      className="h-9 px-4 text-xs font-bold rounded-xl"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveModal}
                      disabled={savingModal}
                      className="h-9 px-5 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
                    >
                      {savingModal ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── TAB 2: SUBSCRIBED SHOPS ────────────────────────────────────────── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-border/60 shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Cari ID Toko..."
                  value={searchSub}
                  onChange={(e) => setSearchSub(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-lg bg-slate-50 border-border/60"
                />
              </div>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="h-8 px-2.5 text-xs font-bold rounded-lg border border-border/60 bg-white"
              >
                <option value="all">Semua Plan</option>
                <option value="plus">Plan Plus</option>
                <option value="pro">Plan Pro</option>
                <option value="prime">Plan Prime</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span>Total Aktif: <strong className="text-[#00AA5B]">{activeCount}</strong></span>
              <span>•</span>
              <span>Plus: <strong>{plusCount}</strong></span>
              <span>•</span>
              <span>Pro: <strong>{proCount}</strong></span>
              <span>•</span>
              <span>Prime: <strong>{primeCount}</strong></span>
            </div>
          </div>

          <Card className="border-border/60 shadow-2xs rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border/60 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Toko (ID)</th>
                    <th className="py-3 px-4">Paket Langganan</th>
                    <th className="py-3 px-4">Siklus</th>
                    <th className="py-3 px-4">Tarif Komisi</th>
                    <th className="py-3 px-4">Batas Produk</th>
                    <th className="py-3 px-4">Masa Aktif</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground italic text-xs">
                        Tidak ada toko yang cocok dengan pencarian / belum ada yang berlangganan.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => {
                      const isExpired = sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now();
                      const isActive = sub.status === "ACTIVE" && !isExpired;

                      return (
                        <tr key={sub.shopId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">
                            {sub.shopId}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "font-bold text-[9px] px-2 py-0.5 capitalize",
                                sub.planId === "prime" && "bg-amber-100 text-amber-800 hover:bg-amber-100",
                                sub.planId === "pro" && "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
                                sub.planId === "plus" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                sub.planId === "free" && "bg-slate-100 text-slate-700 hover:bg-slate-100"
                              )}
                            >
                              {sub.planName || sub.planId}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-600 font-semibold text-[11px]">
                            {sub.billingCycle === "yearly" ? "Tahunan" : "Bulanan"}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#00AA5B]">
                            {sub.commissionRate}%
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {sub.maxProducts === -1 ? "Unlimited" : `${sub.maxProducts} produk`}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-muted-foreground">
                            {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold py-0.5 px-2",
                                isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {isActive ? "AKTIF" : isExpired ? "KEDALUWARSA" : sub.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelShopSub(sub.shopId)}
                                className="h-7 px-2.5 rounded-md text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 font-bold"
                              >
                                Batalkan
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── TAB 3: CALCULATOR ──────────────────────────────────────────────── */}
        <TabsContent value="calculator" className="space-y-4">
          <Card className="border-border/60 shadow-2xs rounded-xl bg-white p-5 max-w-xl mx-auto space-y-4">
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-bold text-[#212121] flex items-center justify-center gap-2">
                <Calculator className="w-4 h-4 text-[#00AA5B]" /> Simulasi Potongan Komisi Penjual
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                Kalkulasi perbandingan komisi platform vs pendapatan bersih toko untuk transaksi tertentu.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-muted-foreground">Nominal Transaksi (Rp)</Label>
              <Input
                type="number"
                step="10000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-10 text-sm font-bold rounded-xl bg-slate-50 border-border/60"
              />
              <p className="text-xs font-bold text-[#00AA5B] text-right">
                Rp {calcAmount.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-border/40">
              {plans.map((p) => {
                const adminFee = Math.round(calcAmount * (p.commissionRate / 100));
                const sellerNet = Math.max(0, calcAmount - adminFee);

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-border/60 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#212121]">Plan {p.name}</span>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 h-4">
                          {p.commissionRate}%
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Komisi Platform: <strong className="text-rose-600">Rp {adminFee.toLocaleString("id-ID")}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block font-medium">Diterima Toko:</span>
                      <span className="text-xs font-black text-[#00AA5B]">
                        Rp {sellerNet.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
