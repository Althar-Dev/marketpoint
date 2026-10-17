"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Zap,
  Plus,
  Flame,
  Clock,
  Calendar,
  Package,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  AlertCircle,
  Percent,
  Coins,
  ShoppingBag,
  Loader2,
  Check,
  ChevronRight,
  Eye,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MerchantPlanLock } from "@/components/merchant-plan-lock";
import { useMerchantShop } from "@/context/merchant-context";

export interface FlashSaleProductItem {
  productId: string;
  title: string;
  imageUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  quota: number;
  sold: number;
}

export interface FlashSaleSession {
  id: string;
  name: string;
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string;   // YYYY-MM-DDTHH:mm
  status: "ACTIVE" | "INACTIVE";
  products: FlashSaleProductItem[];
  createdAt: string;
  updatedAt?: string;
}

// Sanitizer to eliminate undefined values for Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

// Helper: Format countdown mm:ss or hh:mm:ss
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MerchantFlashSalePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Live timer tick for real-time countdown
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Shop Document Ref
  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  const { effectiveFeatures, isAdmin } = useMerchantShop();

  // Subscription Info derived dynamically from Merchant Context
  const subInfo = useMemo(
    () => ({
      planId: effectiveFeatures.planId,
      planName: effectiveFeatures.planName,
      maxFlashSaleProducts: effectiveFeatures.maxFlashSaleProducts,
      flashSaleAllowed: effectiveFeatures.flashSale,
    }),
    [effectiveFeatures]
  );

  // Shop Products (for selecting in Flash Sale)
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchShopProducts(user.uid);
    }
  }, [user]);

  const fetchShopProducts = async (sId: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?shopId=${sId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setShopProducts(data.products);
      }
    } catch (e) {
      console.warn("Gagal mengambil produk toko:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Sessions list derived from shop doc
  const sessions: FlashSaleSession[] = useMemo(() => {
    if (Array.isArray(shop?.flashSales)) {
      return (shop.flashSales as FlashSaleSession[]).sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeB - timeA;
      });
    }
    return [];
  }, [shop?.flashSales]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONGOING" | "UPCOMING" | "ENDED">("ALL");

  // Helper to get session status
  const getSessionState = (session: FlashSaleSession) => {
    if (session.status === "INACTIVE") {
      return {
        status: "INACTIVE",
        label: "Dinonaktifkan",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
        countdownText: "-",
        countdownLabel: "Status Nonaktif",
      };
    }

    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();

    if (nowTime < startMs) {
      const diffSec = Math.max(0, Math.floor((startMs - nowTime) / 1000));
      return {
        status: "UPCOMING",
        label: "Akan Datang",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        countdownText: formatDuration(diffSec),
        countdownLabel: "Mulai Dalam",
      };
    }

    if (nowTime >= startMs && nowTime <= endMs) {
      const diffSec = Math.max(0, Math.floor((endMs - nowTime) / 1000));
      return {
        status: "ONGOING",
        label: "Sedang Berjalan",
        badgeClass: "bg-rose-50 text-rose-600 border-rose-200 animate-pulse",
        countdownText: formatDuration(diffSec),
        countdownLabel: "Berakhir Dalam",
      };
    }

    return {
      status: "ENDED",
      label: "Selesai",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      countdownText: "Selesai",
      countdownLabel: "Waktu Habis",
    };
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const state = getSessionState(s);
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      if (statusFilter === "ONGOING") return state.status === "ONGOING";
      if (statusFilter === "UPCOMING") return state.status === "UPCOMING";
      if (statusFilter === "ENDED") return state.status === "ENDED";
      return true;
    });
  }, [sessions, searchQuery, statusFilter, nowTime]);

  // Statistics calculation
  const stats = useMemo(() => {
    let ongoingCount = 0;
    let totalItems = 0;
    let totalSold = 0;

    sessions.forEach((s) => {
      const state = getSessionState(s);
      if (state.status === "ONGOING") ongoingCount++;
      if (Array.isArray(s.products)) {
        totalItems += s.products.length;
        s.products.forEach((p) => {
          totalSold += p.sold || 0;
        });
      }
    });

    return {
      total: sessions.length,
      ongoing: ongoingCount,
      totalItems,
      totalSold,
    };
  }, [sessions, nowTime]);

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<FlashSaleSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<FlashSaleProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Delete Dialog state
  const [deletingSession, setDeletingSession] = useState<FlashSaleSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal State (View products in session)
  const [viewingSession, setViewingSession] = useState<FlashSaleSession | null>(null);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMsg, setUpgradeModalMsg] = useState("");

  // Helper to format ISO to datetime-local input string
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!subInfo.flashSaleAllowed || subInfo.maxFlashSaleProducts === 0) {
      setUpgradeModalMsg(
        `Paket ${subInfo.planName} belum mengaktifkan fitur Flash Sale Toko. Upgrade ke paket Plus, Pro, atau Prime untuk mulai membuat promo flash sale produk.`
      );
      setShowUpgradeModal(true);
      return;
    }

    setEditingSession(null);
    setFormName("Flash Sale Toko");

    // Start now, end in 3 hours
    const start = new Date();
    const end = new Date();
    end.setHours(end.getHours() + 3);

    setFormStartTime(toLocalInput(start));
    setFormEndTime(toLocalInput(end));
    setFormIsActive(true);
    setSelectedProducts([]);
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s: FlashSaleSession) => {
    setEditingSession(s);
    setFormName(s.name);
    setFormStartTime(s.startTime);
    setFormEndTime(s.endTime);
    setFormIsActive(s.status === "ACTIVE");
    setSelectedProducts(Array.isArray(s.products) ? [...s.products] : []);
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Add / Remove Product from selection
  const handleToggleProduct = (prod: any) => {
    const prodId = String(prod.id);
    const exists = selectedProducts.some((p) => p.productId === prodId);

    if (exists) {
      setSelectedProducts((prev) => prev.filter((p) => p.productId !== prodId));
    } else {
      if (
        subInfo.maxFlashSaleProducts !== -1 &&
        selectedProducts.length >= subInfo.maxFlashSaleProducts
      ) {
        setUpgradeModalMsg(
          `Paket ${subInfo.planName} Anda dibatasi maksimal ${subInfo.maxFlashSaleProducts} produk per event flash sale. Tingkatkan paket toko Anda (Pro atau Prime) untuk menambahkan lebih banyak produk flash sale.`
        );
        setShowUpgradeModal(true);
        return;
      }

      const origPrice = Number(prod.price || 5000);
      const discountPct = 20; // default 20%
      const discPrice = Math.max(100, Math.round(origPrice * (1 - discountPct / 100)));

      const newItem: FlashSaleProductItem = {
        productId: prodId,
        title: prod.title,
        imageUrl: prod.images?.[0]?.imageUrl || "/assets/img/logo.png",
        originalPrice: origPrice,
        discountPrice: discPrice,
        discountPercentage: discountPct,
        quota: 10,
        sold: 0,
      };
      setSelectedProducts((prev) => [...prev, newItem]);
    }
  };

  // Update specific selected product (price or quota)
  const handleUpdateProduct = (
    productId: string,
    field: "discountPercentage" | "discountPrice" | "quota",
    value: number
  ) => {
    setSelectedProducts((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        if (field === "discountPercentage") {
          const pct = Math.min(99, Math.max(1, value || 1));
          const newPrice = Math.max(100, Math.round(item.originalPrice * (1 - pct / 100)));
          return { ...item, discountPercentage: pct, discountPrice: newPrice };
        }

        if (field === "discountPrice") {
          const pr = Math.max(1, Math.min(item.originalPrice - 1, value || 1));
          const newPct = Math.round(((item.originalPrice - pr) / item.originalPrice) * 100);
          return { ...item, discountPrice: pr, discountPercentage: Math.max(1, newPct) };
        }

        if (field === "quota") {
          return { ...item, quota: Math.max(1, value || 1) };
        }

        return item;
      })
    );
  };

  // Save Flash Sale Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shopRef) return;

    const trimmedName = formName.trim();
    if (!trimmedName) {
      toast({
        variant: "destructive",
        title: "Nama Sesi Wajib Diisi",
        description: "Masukkan nama kampanye Flash Sale Anda.",
      });
      return;
    }

    if (!formStartTime || !formEndTime) {
      toast({
        variant: "destructive",
        title: "Jadwal Belum Lengkap",
        description: "Tentukan waktu mulai dan waktu berakhir sesi Flash Sale.",
      });
      return;
    }

    const startMs = new Date(formStartTime).getTime();
    const endMs = new Date(formEndTime).getTime();
    if (endMs <= startMs) {
      toast({
        variant: "destructive",
        title: "Jadwal Tidak Valid",
        description: "Waktu selesai harus lebih besar dari waktu mulai.",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Pilih Minimal 1 Produk",
        description: "Pilih minimal 1 produk toko untuk diikutsertakan dalam Flash Sale.",
      });
      return;
    }

    if (!subInfo.flashSaleAllowed || subInfo.maxFlashSaleProducts === 0) {
      toast({
        variant: "destructive",
        title: "Fitur Belum Tersedia",
        description: `Paket ${subInfo.planName} belum mendukung fitur Flash Sale Toko.`,
      });
      return;
    }

    if (subInfo.maxFlashSaleProducts !== -1 && selectedProducts.length > subInfo.maxFlashSaleProducts) {
      toast({
        variant: "destructive",
        title: "Melebihi Batas Produk Flash Sale",
        description: `Paket ${subInfo.planName} maksimal mengizinkan ${subInfo.maxFlashSaleProducts} produk per event flash sale.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionId = editingSession ? editingSession.id : `fs_${Date.now()}`;
      const newSession: FlashSaleSession = {
        id: sessionId,
        name: trimmedName,
        startTime: formStartTime,
        endTime: formEndTime,
        status: formIsActive ? "ACTIVE" : "INACTIVE",
        products: selectedProducts,
        createdAt: editingSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const currentList: FlashSaleSession[] = Array.isArray(shop?.flashSales) ? [...shop.flashSales] : [];
      let updatedList: FlashSaleSession[] = [];
      if (editingSession) {
        updatedList = currentList.map((item) => (item.id === editingSession.id ? newSession : item));
      } else {
        updatedList = [newSession, ...currentList];
      }

      await updateDoc(shopRef, {
        flashSales: sanitizeForFirestore(updatedList),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: editingSession ? "Sesi Diperbarui!" : "Sesi Flash Sale Dibuat!",
        description: `Kampanye "${trimmedName}" berhasil dijadwalkan dengan ${selectedProducts.length} produk.`,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan Flash Sale",
        description: err.message || "Terjadi kesalahan sistem.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Session Active / Inactive
  const handleToggleStatus = async (s: FlashSaleSession) => {
    if (!user || !shopRef) return;
    const newStatus = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const currentList: FlashSaleSession[] = Array.isArray(shop?.flashSales) ? [...shop.flashSales] : [];
      const updatedList = currentList.map((item) =>
        item.id === s.id ? { ...item, status: newStatus as any, updatedAt: new Date().toISOString() } : item
      );

      await updateDoc(shopRef, {
        flashSales: sanitizeForFirestore(updatedList),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: newStatus === "ACTIVE" ? "Flash Sale Diaktifkan" : "Flash Sale Dinonaktifkan",
        description: `Status kampanye "${s.name}" berhasil diubah.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Status",
        description: err.message,
      });
    }
  };

  // Delete Session
  const handleConfirmDelete = async () => {
    if (!user || !deletingSession || !shopRef) return;
    setIsDeleting(true);
    try {
      const currentList: FlashSaleSession[] = Array.isArray(shop?.flashSales) ? [...shop.flashSales] : [];
      const updatedList = currentList.filter((item) => item.id !== deletingSession.id);

      await updateDoc(shopRef, {
        flashSales: sanitizeForFirestore(updatedList),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Sesi Dihapus",
        description: `Kampanye "${deletingSession.name}" berhasil dihapus.`,
      });
      setDeletingSession(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Sesi",
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Shop Products in picker
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearch.trim()) return shopProducts;
    const q = productSearch.toLowerCase().trim();
    return shopProducts.filter((p) => p.title?.toLowerCase().includes(q));
  }, [shopProducts, productSearch]);

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  // Jika paket tidak mengizinkan flash sale (misal paket Free atau kuota 0)
  if (!subInfo.flashSaleAllowed || subInfo.maxFlashSaleProducts === 0) {
    return (
      <MerchantPlanLock
        title="Fitur Flash Sale Toko Terkunci"
        featureName="Flash Sale Toko"
        description="Fitur Flash Sale Toko belum aktif pada paket langganan toko Anda saat ini. Tingkatkan paket toko Anda untuk mulai menjadwalkan promo harga coret waktu terbatas."
        currentPlan={subInfo.planName}
        requiredPlans="Plus, Pro, atau Prime"
        icon={Zap}
        benefits={[
          "Jadwalkan promo diskon harga coret otomatis dengan hitung mundur",
          "Atur alokasi kuota stok promo khusus per produk",
          "Mendongkrak traffic pengunjung dan penjualan kilat toko Anda",
          "Tampil menonjol di etalase toko dengan badge flash sale eksklusif",
        ]}
      />
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-[#212121] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Flash Sale Toko
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Dongkrak transaksi dan trafik toko dengan promo harga coret waktu terbatas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-border/60 text-xs font-semibold text-slate-700 shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Batas Produk:</span>
              <span className="font-extrabold text-[#00AA5B]">
                {subInfo.maxFlashSaleProducts === -1
                  ? "Unlimited"
                  : subInfo.maxFlashSaleProducts === 0
                    ? "Nonaktif (Paket Free)"
                    : `${subInfo.maxFlashSaleProducts} Produk / Sesi`}
              </span>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="h-10 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-extrabold text-white text-xs gap-2 shadow-md shadow-[#00AA5B]/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Buat Flash Sale Baru
            </Button>
          </div>
        </div>

        {/* Upgrade Alert Banner if flash sale feature not allowed or 0 limit */}
        {(!subInfo.flashSaleAllowed || subInfo.maxFlashSaleProducts === 0) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Toko Anda saat ini menggunakan paket <strong>{subInfo.planName}</strong> yang belum mendukung event Flash Sale toko.
              </span>
            </div>
            <a
              href="/my-shop/subscription"
              className="shrink-0 font-bold text-amber-800 hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" /> Upgrade Plan
            </a>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: "Total Sesi",
              value: stats.total,
              icon: Zap,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "Sedang Berjalan",
              value: stats.ongoing,
              icon: Flame,
              color: "text-rose-600",
              bg: "bg-rose-50",
            },
            {
              label: "Produk Promo",
              value: `${stats.totalItems} Produk`,
              icon: Package,
              color: "text-[#00AA5B]",
              bg: "bg-emerald-50",
            },
            {
              label: "Total Terjual",
              value: `${stats.totalSold} Item`,
              icon: ShoppingBag,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat, idx) => (
            <Card
              key={idx}
              className="border-border border-[1.5px] shadow-2xs rounded-2xl bg-white overflow-hidden"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase whitespace-nowrap truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-xl font-black text-[#212121] tracking-tight mt-0.5 whitespace-nowrap truncate">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List Section (Search, Filter, & Table integrated into single Card) */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/70 bg-[#F8FAFC]/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h2 className="text-xs sm:text-sm font-extrabold text-[#2E3137]">
                  Daftar Sesi Flash Sale ({filteredSessions.length})
                </h2>
              </div>
              {filteredSessions.length > 0 && (
                <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                  Kelola jadwal promo, kuota stok, dan diskon flash sale toko
                </span>
              )}
            </div>

            {/* Integrated Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari sesi flash sale..."
                  className="h-9 pl-9 text-xs rounded-xl bg-white border-border shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
                {(
                  [
                    { id: "ALL", label: "Semua" },
                    { id: "ONGOING", label: "Sedang Berjalan" },
                    { id: "UPCOMING", label: "Akan Datang" },
                    { id: "ENDED", label: "Selesai" },
                  ] as const
                ).map((filter) => (
                  <Button
                    key={filter.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap",
                      statusFilter === filter.id
                        ? "bg-[#00AA5B] text-white hover:bg-[#00AA5B]/90 hover:text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-200/70"
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Zap className="w-7 h-7 fill-amber-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#212121]">Belum Ada Sesi Flash Sale</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Tidak ada sesi yang cocok dengan pencarian atau filter saat ini."
                    : "Mulai jadwalkan sesi Flash Sale pertama toko Anda untuk menarik pembeli dengan promo waktu terbatas."}
                </p>
              </div>
              {!searchQuery && statusFilter === "ALL" && (
                <Button
                  onClick={handleOpenCreate}
                  size="sm"
                  className="mt-2 h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs text-white gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Buat Flash Sale Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full scrollbar-thin">
              <Table className="min-w-[760px] w-full whitespace-nowrap">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-5 whitespace-nowrap">
                      Kampanye & Jadwal
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Status & Timer
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Produk Promo
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Total Terjual
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 text-center whitespace-nowrap">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 text-right px-5 whitespace-nowrap">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s) => {
                    const state = getSessionState(s);
                    const prodCount = s.products?.length || 0;
                    const totalSold = s.products?.reduce((acc, p) => acc + (p.sold || 0), 0) || 0;
                    const totalQuota = s.products?.reduce((acc, p) => acc + (p.quota || 0), 0) || 0;

                    return (
                      <TableRow
                        key={s.id}
                        className="border-b border-border/50 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Kampanye & Jadwal */}
                        <TableCell className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                              <Zap className="w-4 h-4 fill-amber-500" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-black text-[#212121] whitespace-nowrap">
                                {s.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-0.5 whitespace-nowrap">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>{s.startTime.replace("T", " ")} s/d {s.endTime.replace("T", " ")}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Status & Timer */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1 whitespace-nowrap">
                            <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border", state.badgeClass)}>
                              {state.label}
                            </Badge>
                            {state.status === "ONGOING" && (
                              <div className="flex items-center gap-1 text-[11px] font-mono font-extrabold text-rose-600 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                <span>{state.countdownText}</span>
                              </div>
                            )}
                            {state.status === "UPCOMING" && (
                              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-600 whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                <span>{state.countdownText}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Produk Promo */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewingSession(s)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#00AA5B] hover:underline whitespace-nowrap"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>{prodCount} Produk Terdaftar</span>
                            <Eye className="w-3 h-3 ml-0.5 opacity-70" />
                          </button>
                        </TableCell>

                        {/* Total Terjual */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1 w-28 whitespace-nowrap">
                            <div className="flex items-center justify-between text-[11px] font-bold whitespace-nowrap">
                              <span className="text-[#212121]">{totalSold} terjual</span>
                              <span className="text-muted-foreground">/ {totalQuota}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-rose-500 transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((totalSold / Math.max(1, totalQuota)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Status Toggle */}
                        <TableCell className="text-center px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                            <Switch
                              checked={s.status === "ACTIVE"}
                              onCheckedChange={() => handleToggleStatus(s)}
                              className="data-[state=checked]:bg-[#00AA5B]"
                            />
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                              {s.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(s)}
                              className="h-8 w-8 rounded-lg hover:text-[#00AA5B] hover:bg-emerald-50 text-slate-600 transition-colors"
                              title="Edit Sesi"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingSession(s)}
                              className="h-8 w-8 rounded-lg hover:text-rose-600 hover:bg-rose-50 text-slate-600 transition-colors"
                              title="Hapus Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL BUAT & EDIT FLASH SALE */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-white">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 shrink-0 text-left pr-12 bg-white">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-[#212121]">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 border border-amber-200/50">
                <Zap className="w-4 h-4 fill-amber-500" />
              </div>
              {editingSession ? "Edit Sesi Flash Sale" : "Jadwalkan Flash Sale Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Atur waktu mulai & selesai, pilih produk, serta tentukan harga coret diskon dan alokasi kuota promo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSession} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              {/* Nama Sesi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Nama Kampanye Flash Sale <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Flash Sale Akhir Pekan, Midnight Sale"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              {/* Jadwal Mulai & Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Waktu Mulai <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Waktu Berakhir <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Pemilihan Produk & Konfigurasi Diskon */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#00AA5B]" />
                    Pilih Produk Flash Sale ({selectedProducts.length} / {subInfo.maxFlashSaleProducts === -1 ? "Unlimited" : subInfo.maxFlashSaleProducts} dipilih)
                  </label>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Minimal 1 produk (Paket {subInfo.planName})
                  </span>
                </div>

                {/* Product Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari produk toko Anda..."
                    className="h-8.5 pl-8.5 text-xs rounded-xl bg-slate-50 border-border"
                  />
                </div>

                {/* Available Products List */}
                <div className="border border-border/80 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1.5 bg-slate-50/50 scrollbar-thin">
                  {loadingProducts ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00AA5B]" />
                      <span>Memuat produk...</span>
                    </div>
                  ) : filteredAvailableProducts.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-4">
                      Tidak ada produk ditemukan.
                    </p>
                  ) : (
                    filteredAvailableProducts.map((p) => {
                      const isSelected = selectedProducts.some((item) => item.productId === String(p.id));
                      const img = p.images?.[0]?.imageUrl || "/assets/img/logo.png";
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProduct(p)}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-white border-[#00AA5B] shadow-2xs"
                              : "bg-white/70 border-border/60 hover:bg-white"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-3.5 h-3.5 rounded text-[#00AA5B] accent-[#00AA5B] shrink-0 pointer-events-none"
                          />
                          <div className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden shrink-0 relative border border-border/50">
                            <img src={img} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#212121] truncate leading-tight">
                              {p.title}
                            </p>
                            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                              Harga Asli: Rp {Number(p.price || 0).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Settings for Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-extrabold text-[#212121] uppercase tracking-wider">
                      Atur Harga Promo & Kuota ({selectedProducts.length} Produk):
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {selectedProducts.map((item) => (
                        <div
                          key={item.productId}
                          className="p-2.5 rounded-xl border border-border bg-white space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#212121] truncate">
                              {item.title}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setSelectedProducts((prev) =>
                                  prev.filter((p) => p.productId !== item.productId)
                                )
                              }
                              className="h-6 w-6 rounded-md hover:bg-rose-50 text-rose-500 shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Diskon % */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Diskon (%)</label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  max={99}
                                  step="any"
                                  value={item.discountPercentage}
                                  onChange={(e) =>
                                    handleUpdateProduct(item.productId, "discountPercentage", Number(e.target.value))
                                  }
                                  className="h-8 text-xs rounded-lg pl-6 pr-1"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>

                            {/* Harga Flash Sale */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Harga Promo (Rp)</label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={100}
                                  step="any"
                                  value={item.discountPrice}
                                  onChange={(e) =>
                                    handleUpdateProduct(item.productId, "discountPrice", Number(e.target.value))
                                  }
                                  className="h-8 text-xs rounded-lg pl-7 pr-1"
                                />
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                                  Rp
                                </span>
                              </div>
                            </div>

                            {/* Kuota Flash Sale */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Kuota Promo</label>
                              <Input
                                type="number"
                                min={1}
                                step="1"
                                value={item.quota}
                                onChange={(e) =>
                                  handleUpdateProduct(item.productId, "quota", Number(e.target.value))
                                }
                                className="h-8 text-xs rounded-lg px-2"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-slate-50 px-2 py-1 rounded-md">
                            <span>Harga Asli: Rp {item.originalPrice.toLocaleString("id-ID")}</span>
                            <span className="font-bold text-rose-600">
                              Hemat: Rp {(item.originalPrice - item.discountPrice).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/60">
                <div>
                  <p className="text-xs font-bold text-[#212121]">Aktifkan Sesi</p>
                  <p className="text-[10px] text-muted-foreground">
                    Sesi akan otomatis aktif saat jam promo tercapai
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>
            </div>

            <DialogFooter className="p-3.5 sm:p-4 border-t border-border/60 shrink-0 bg-slate-50/90 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-lg border-border"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 px-4 text-xs font-bold rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5 shadow-sm shadow-[#00AA5B]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : editingSession ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Sesi Flash Sale"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL: LIHAT PRODUK SESI */}
      <Dialog open={!!viewingSession} onOpenChange={() => setViewingSession(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-white">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 shrink-0 text-left pr-12 bg-white">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-[#212121]">
              <Package className="w-4 h-4 text-[#00AA5B]" />
              Produk Flash Sale ({viewingSession?.products?.length || 0})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {viewingSession?.name} • {viewingSession?.startTime.replace("T", " ")} s/d {viewingSession?.endTime.replace("T", " ")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-96 scrollbar-thin">
            {viewingSession?.products?.map((p) => (
              <div
                key={p.productId}
                className="p-3 rounded-xl border border-border bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-border/50">
                    <img src={p.imageUrl || "/assets/img/logo.png"} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#212121] truncate">{p.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground line-through">
                        Rp {p.originalPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs font-black text-rose-600">
                        Rp {p.discountPrice.toLocaleString("id-ID")}
                      </span>
                      <Badge className="bg-rose-50 text-rose-600 text-[9px] px-1 py-0 border-rose-200">
                        -{p.discountPercentage}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-muted-foreground">Kuota</p>
                  <p className="text-xs font-black text-[#212121]">{p.sold}/{p.quota}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-3 border-t border-border/60 bg-slate-50 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setViewingSession(null)}
              className="h-8 px-4 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI HAPUS */}
      <Dialog open={!!deletingSession} onOpenChange={() => setDeletingSession(null)}>
        <DialogContent className="w-[95vw] sm:max-w-sm p-5 rounded-2xl bg-white border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/50">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-[#212121]">Hapus Sesi Flash Sale?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sesi "{deletingSession?.name}" akan dihapus secara permanen.
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeletingSession(null)}
              className="h-9 px-4 text-xs font-bold rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Peringatan Batas Produk Flash Sale / Upgrade */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-base font-black text-[#212121]">
              {!subInfo.flashSaleAllowed || subInfo.maxFlashSaleProducts === 0
                ? "Fitur Flash Sale Belum Tersedia"
                : "Batas Produk Flash Sale Tercapai"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
              {upgradeModalMsg}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t mt-3">
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
                Upgrade Plan Toko
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
