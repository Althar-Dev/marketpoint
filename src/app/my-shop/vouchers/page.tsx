"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Ticket,
  Plus,
  Percent,
  Coins,
  Calendar,
  Users,
  CheckCircle2,
  Copy,
  Edit,
  Trash2,
  Loader2,
  Tag,
  AlertCircle,
  Search,
  Check,
  Sparkles,
  ShoppingBag,
  Store,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface VoucherItem {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount?: number | null;
  minPurchase?: number | null;
  quota: number;
  used: number;
  status: "ACTIVE" | "INACTIVE";
  expiry: string | null;
  shopId?: string;
  createdAt?: any;
  scope?: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS";
  applicableProductIds?: string[];
  applicableProductNames?: string[];
}

// Helper to remove any undefined fields before sending to Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

export default function MerchantVouchersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Shop Products for specific voucher target
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");

  // Modal Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState<number | "">(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | "">("");
  const [formMinPurchase, setFormMinPurchase] = useState<number | "">(0);
  const [formQuota, setFormQuota] = useState<number | "">(50);
  const [formExpiry, setFormExpiry] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Scope: All products or specific products
  const [formScope, setFormScope] = useState<"ALL_PRODUCTS" | "SPECIFIC_PRODUCTS">("ALL_PRODUCTS");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Delete Confirmation state
  const [deletingVoucher, setDeletingVoucher] = useState<VoucherItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Default expiry 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormExpiry(d.toISOString().split("T")[0]);
  }, []);

  // Fetch shop products when user is loaded
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
      console.warn("Gagal memuat produk toko untuk voucher:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredShopProducts = useMemo(() => {
    if (!productSearch.trim()) return shopProducts;
    const q = productSearch.toLowerCase().trim();
    return shopProducts.filter((p) => p.title?.toLowerCase().includes(q));
  }, [shopProducts, productSearch]);

  // Shop Document Ref
  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);
  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  // Vouchers Collection Ref
  const vouchersColRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "shops", user.uid, "vouchers"), orderBy("createdAt", "desc"));
  }, [db, user]);
  const { data: rawVouchers, loading: vouchersLoading } = useCollection(vouchersColRef);

  // Merge vouchers from shop document (zero-permission storage) and subcollection
  const vouchers: VoucherItem[] = useMemo(() => {
    const map = new Map<string, VoucherItem>();

    // 1. Subcollection rawVouchers if loaded
    if (Array.isArray(rawVouchers)) {
      rawVouchers.forEach((doc: any) => {
        const item: VoucherItem = {
          id: doc.id,
          code: doc.code || "",
          type: doc.type || "percentage",
          value: Number(doc.value) || 0,
          maxDiscount: doc.maxDiscount ? Number(doc.maxDiscount) : undefined,
          minPurchase: doc.minPurchase ? Number(doc.minPurchase) : 0,
          quota: Number(doc.quota) || 0,
          used: Number(doc.used) || 0,
          status: doc.status || "ACTIVE",
          expiry: doc.expiry || "",
          shopId: doc.shopId || user?.uid,
          scope: doc.scope || "ALL_PRODUCTS",
          applicableProductIds: Array.isArray(doc.applicableProductIds) ? doc.applicableProductIds : [],
          applicableProductNames: Array.isArray(doc.applicableProductNames) ? doc.applicableProductNames : [],
          createdAt: doc.createdAt,
        };
        if (item.code) map.set(item.code, item);
      });
    }

    // 2. Shop document vouchers array (primary)
    if (Array.isArray(shop?.vouchers)) {
      shop.vouchers.forEach((item: any) => {
        const vItem: VoucherItem = {
          id: item.id || `vch_${item.code}`,
          code: item.code || "",
          type: item.type || "percentage",
          value: Number(item.value) || 0,
          maxDiscount: item.maxDiscount ? Number(item.maxDiscount) : undefined,
          minPurchase: item.minPurchase ? Number(item.minPurchase) : 0,
          quota: Number(item.quota) || 0,
          used: Number(item.used) || 0,
          status: item.status || "ACTIVE",
          expiry: item.expiry || "",
          shopId: item.shopId || user?.uid,
          scope: item.scope || "ALL_PRODUCTS",
          applicableProductIds: Array.isArray(item.applicableProductIds) ? item.applicableProductIds : [],
          applicableProductNames: Array.isArray(item.applicableProductNames) ? item.applicableProductNames : [],
          createdAt: item.createdAt,
        };
        if (vItem.code) map.set(vItem.code, vItem);
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      const timeA = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
      const timeB = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [rawVouchers, shop?.vouchers, user?.uid]);

  // Statistics calculation
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const total = vouchers.length;
    const active = vouchers.filter(
      (v) => v.status === "ACTIVE" && (!v.expiry || v.expiry >= today) && v.used < v.quota
    ).length;
    const totalUsed = vouchers.reduce((acc, v) => acc + (v.used || 0), 0);
    const estSaved = vouchers.reduce((acc, v) => {
      const perUse = v.type === "fixed" ? v.value : 15000;
      return acc + (v.used || 0) * perUse;
    }, 0);

    return { total, active, totalUsed, estSaved };
  }, [vouchers]);

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return vouchers.filter((v) => {
      const matchSearch =
        v.code.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      const isExpired = v.expiry && v.expiry < today;
      const isQuotaFull = v.used >= v.quota;

      if (statusFilter === "ACTIVE") {
        return v.status === "ACTIVE" && !isExpired && !isQuotaFull;
      }
      if (statusFilter === "INACTIVE") {
        return v.status === "INACTIVE";
      }
      if (statusFilter === "EXPIRED") {
        return isExpired || isQuotaFull;
      }
      return true;
    });
  }, [vouchers, searchQuery, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setFormCode("");
    setFormType("percentage");
    setFormValue(10);
    setFormMaxDiscount("");
    setFormMinPurchase(0);
    setFormQuota(50);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormExpiry(d.toISOString().split("T")[0]);
    setFormIsActive(true);
    setFormScope("ALL_PRODUCTS");
    setSelectedProductIds([]);
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v: VoucherItem) => {
    setEditingVoucher(v);
    setFormCode(v.code);
    setFormType(v.type);
    setFormValue(v.value);
    setFormMaxDiscount(v.maxDiscount ?? "");
    setFormMinPurchase(v.minPurchase ?? 0);
    setFormQuota(v.quota);
    setFormExpiry(v.expiry || "");
    setFormIsActive(v.status === "ACTIVE");
    setFormScope(v.scope || "ALL_PRODUCTS");
    setSelectedProductIds(v.applicableProductIds || []);
    setProductSearch("");
    setIsModalOpen(true);
  };

  // Save / Update Voucher
  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedCode = formCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!trimmedCode) {
      toast({
        variant: "destructive",
        title: "Kode Wajib Diisi",
        description: "Masukkan kode voucher, contoh: HEMAT10",
      });
      return;
    }

    const val = Number(formValue);
    if (!val || val <= 0) {
      toast({
        variant: "destructive",
        title: "Nilai Diskon Tidak Valid",
        description: "Masukkan nilai diskon yang lebih besar dari 0.",
      });
      return;
    }

    if (formType === "percentage" && val > 100) {
      toast({
        variant: "destructive",
        title: "Diskon Melebihi 100%",
        description: "Diskon persentase tidak boleh lebih dari 100%.",
      });
      return;
    }

    const quotaNum = Number(formQuota);
    if (!quotaNum || quotaNum <= 0) {
      toast({
        variant: "destructive",
        title: "Kuota Tidak Valid",
        description: "Kuota penggunaan voucher minimal 1.",
      });
      return;
    }

    if (formScope === "SPECIFIC_PRODUCTS" && selectedProductIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Pilih Minimal 1 Produk",
        description: "Untuk voucher khusus produk tertentu, Anda wajib memilih minimal 1 produk dari daftar.",
      });
      return;
    }

    const selectedProductNames = shopProducts
      .filter((p) => selectedProductIds.includes(String(p.id)))
      .map((p) => p.title);

    setIsSubmitting(true);
    try {
      const voucherId = editingVoucher ? editingVoucher.id : `vch_${Date.now()}`;
      const voucherItem: VoucherItem = {
        id: voucherId,
        code: trimmedCode,
        type: formType,
        value: val,
        maxDiscount: formMaxDiscount !== "" && Number(formMaxDiscount) > 0 ? Number(formMaxDiscount) : null,
        minPurchase: formMinPurchase !== "" && Number(formMinPurchase) > 0 ? Number(formMinPurchase) : 0,
        quota: quotaNum,
        used: editingVoucher ? (editingVoucher.used || 0) : 0,
        status: formIsActive ? "ACTIVE" : "INACTIVE",
        expiry: formExpiry || null,
        shopId: user.uid,
        scope: formScope,
        applicableProductIds: formScope === "SPECIFIC_PRODUCTS" ? selectedProductIds : [],
        applicableProductNames: formScope === "SPECIFIC_PRODUCTS" ? selectedProductNames : [],
        createdAt: editingVoucher?.createdAt || new Date().toISOString(),
      };

      // 1. Update shop document vouchers array (Primary - Zero Permission Block)
      if (shopRef) {
        const currentList: VoucherItem[] = Array.isArray(shop?.vouchers) ? [...shop.vouchers] : [];
        let updatedList: VoucherItem[] = [];
        if (editingVoucher) {
          updatedList = currentList.map((item) =>
            item.id === editingVoucher.id || item.code === editingVoucher.code ? voucherItem : item
          );
        } else {
          updatedList = [voucherItem, ...currentList.filter((item) => item.code !== trimmedCode)];
        }
        await updateDoc(shopRef, {
          vouchers: sanitizeForFirestore(updatedList),
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Mirror to subcollection if rules allow
      try {
        const payload: any = {
          code: trimmedCode,
          type: formType,
          value: val,
          maxDiscount: formMaxDiscount !== "" && Number(formMaxDiscount) > 0 ? Number(formMaxDiscount) : null,
          minPurchase: formMinPurchase !== "" && Number(formMinPurchase) > 0 ? Number(formMinPurchase) : 0,
          quota: quotaNum,
          status: formIsActive ? "ACTIVE" : "INACTIVE",
          expiry: formExpiry || null,
          shopId: user.uid,
          shopName: shop?.name || shop?.shopName || "Toko Seller",
          scope: formScope,
          applicableProductIds: formScope === "SPECIFIC_PRODUCTS" ? selectedProductIds : [],
          applicableProductNames: formScope === "SPECIFIC_PRODUCTS" ? selectedProductNames : [],
          updatedAt: serverTimestamp(),
        };

        if (editingVoucher) {
          const ref = doc(db, "shops", user.uid, "vouchers", editingVoucher.id);
          await updateDoc(ref, sanitizeForFirestore(payload));
        } else {
          payload.used = 0;
          payload.createdAt = serverTimestamp();
          await addDoc(collection(db, "shops", user.uid, "vouchers"), sanitizeForFirestore(payload));
        }
      } catch (subErr) {
        // Safe to ignore if cloud subcollection rules not yet published
      }

      toast({
        title: editingVoucher ? "Voucher Diperbarui!" : "Voucher Berhasil Dibuat!",
        description: `Voucher "${trimmedCode}" kini siap digunakan pembeli.`,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan Voucher",
        description: err.message || "Terjadi kesalahan sistem, silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (v: VoucherItem) => {
    if (!user || !shopRef) return;
    const newStatus = v.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      // 1. Update shop document
      const currentList: VoucherItem[] = Array.isArray(shop?.vouchers) ? [...shop.vouchers] : [];
      const updatedList = currentList.map((item) =>
        item.id === v.id || item.code === v.code ? { ...item, status: newStatus } : item
      );
      await updateDoc(shopRef, {
        vouchers: sanitizeForFirestore(updatedList),
        updatedAt: serverTimestamp(),
      });

      // 2. Try subcollection sync
      try {
        const ref = doc(db, "shops", user.uid, "vouchers", v.id);
        await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
      } catch { }

      toast({
        title: newStatus === "ACTIVE" ? "Voucher Diaktifkan" : "Voucher Dinonaktifkan",
        description: `Status voucher "${v.code}" berhasil diubah.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Status",
        description: err.message,
      });
    }
  };

  // Delete Voucher
  const handleConfirmDelete = async () => {
    if (!user || !deletingVoucher || !shopRef) return;
    setIsDeleting(true);
    try {
      // 1. Remove from shop document
      const currentList: VoucherItem[] = Array.isArray(shop?.vouchers) ? [...shop.vouchers] : [];
      const updatedList = currentList.filter(
        (item) => item.id !== deletingVoucher.id && item.code !== deletingVoucher.code
      );
      await updateDoc(shopRef, {
        vouchers: sanitizeForFirestore(updatedList),
        updatedAt: serverTimestamp(),
      });

      // 2. Try subcollection delete
      try {
        const ref = doc(db, "shops", user.uid, "vouchers", deletingVoucher.id);
        await deleteDoc(ref);
      } catch { }

      toast({
        title: "Voucher Dihapus",
        description: `Voucher "${deletingVoucher.code}" berhasil dihapus dari toko.`,
      });
      setDeletingVoucher(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Voucher",
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({
      title: "Kode Disalin!",
      description: `Kode "${code}" disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!mounted || authLoading || shopLoading || vouchersLoading) {
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

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-[#212121] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#00AA5B]" /> Voucher Toko
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Buat kode promo diskon menarik untuk meningkatkan penjualan produk toko Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCreate}
              className="h-10 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-extrabold text-white text-xs gap-2 shadow-md shadow-[#00AA5B]/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Buat Voucher Baru
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Voucher",
              value: stats.total,
              icon: Ticket,
              color: "text-[#2E3137]",
              bg: "bg-slate-100",
            },
            {
              label: "Voucher Aktif",
              value: stats.active,
              icon: CheckCircle2,
              color: "text-[#00AA5B]",
              bg: "bg-emerald-50",
            },
            {
              label: "Total Digunakan",
              value: `${stats.totalUsed} Klaim`,
              icon: Users,
              color: "text-[#8B5CF6]",
              bg: "bg-purple-50",
            },
            {
              label: "Estimasi Hemat",
              value: `Rp ${stats.estSaved.toLocaleString("id-ID")}`,
              icon: Coins,
              color: "text-amber-500",
              bg: "bg-amber-50",
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

        {/* List Section (Search, Filter, & Table merged into single Card) */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/70 bg-[#F8FAFC]/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#00AA5B]" />
                <h2 className="text-xs sm:text-sm font-extrabold text-[#2E3137]">
                  Daftar Voucher Toko ({filteredVouchers.length})
                </h2>
              </div>
              {filteredVouchers.length > 0 && (
                <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                  Kelola kuota, diskon, dan status aktif voucher secara instan
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
                  placeholder="Cari kode voucher..."
                  className="h-9 pl-9 text-xs rounded-xl bg-white border-border shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
                {(
                  [
                    { id: "ALL", label: "Semua" },
                    { id: "ACTIVE", label: "Aktif" },
                    { id: "INACTIVE", label: "Nonaktif" },
                    { id: "EXPIRED", label: "Kedaluwarsa / Habis" },
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

          {filteredVouchers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#00AA5B]">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#212121]">Belum Ada Voucher</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Tidak ada voucher yang cocok dengan pencarian atau filter saat ini."
                    : "Mulai buat voucher diskon pertama Anda untuk memikat lebih banyak pembeli ke toko."}
                </p>
              </div>
              {!searchQuery && statusFilter === "ALL" && (
                <Button
                  onClick={handleOpenCreate}
                  size="sm"
                  className="mt-2 h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-xs text-white gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Buat Voucher Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full scrollbar-thin">
              <Table className="min-w-[760px] w-full whitespace-nowrap">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-5 whitespace-nowrap">
                      Kode & Tipe
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Nilai Potongan
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Min. Belanja
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Kuota & Penggunaan
                    </TableHead>
                    <TableHead className="text-[11px] font-extrabold text-muted-foreground uppercase h-11 px-4 whitespace-nowrap">
                      Masa Berlaku
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
                  {filteredVouchers.map((v) => {
                    const today = new Date().toISOString().split("T")[0];
                    const isExpired = v.expiry && v.expiry < today;
                    const isQuotaFull = v.used >= v.quota;
                    const percentUsed = Math.min(100, Math.round((v.used / Math.max(1, v.quota)) * 100));

                    return (
                      <TableRow
                        key={v.id}
                        className="border-b border-border/50 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Kode & Tipe */}
                        <TableCell className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="font-mono text-xs sm:text-sm font-black text-[#00AA5B] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 whitespace-nowrap inline-flex items-center">
                              {v.code}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyCode(v.code, v.id)}
                              className="h-6 w-6 rounded-md hover:bg-slate-200 text-slate-500 shrink-0"
                              title="Salin Kode Voucher"
                            >
                              {copiedId === v.id ? (
                                <Check className="w-3 h-3 text-[#00AA5B]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
                            <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">
                              {v.type === "percentage" ? "Diskon (%)" : "Potongan Tetap (Rp)"}
                            </span>
                            <span className="text-slate-300">•</span>
                            {v.scope === "SPECIFIC_PRODUCTS" && (v.applicableProductIds?.length || 0) > 0 ? (
                              <span
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/70 whitespace-nowrap"
                                title={v.applicableProductNames?.join(", ") || "Produk tertentu"}
                              >
                                <Package className="w-2.5 h-2.5" />
                                Khusus {v.applicableProductIds?.length} Produk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                <Store className="w-2.5 h-2.5" />
                                Semua Produk
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Nilai Potongan */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-0.5 whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-black text-[#212121] whitespace-nowrap block">
                              {v.type === "percentage" ? `${v.value}%` : `Rp ${v.value.toLocaleString("id-ID")}`}
                            </span>
                            {v.type === "percentage" && v.maxDiscount && (
                              <span className="text-[10px] text-muted-foreground block whitespace-nowrap">
                                Maks. Rp {v.maxDiscount.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Min. Belanja */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-700 whitespace-nowrap block">
                            {v.minPurchase && v.minPurchase > 0
                              ? `Rp ${v.minPurchase.toLocaleString("id-ID")}`
                              : "Tanpa Minimal"}
                          </span>
                        </TableCell>

                        {/* Kuota & Penggunaan */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-1 w-32 whitespace-nowrap">
                            <div className="flex items-center justify-between text-[11px] font-bold whitespace-nowrap">
                              <span className="text-[#212121] whitespace-nowrap">{v.used} terpakai</span>
                              <span className="text-muted-foreground whitespace-nowrap">/ {v.quota}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isQuotaFull ? "bg-rose-500" : "bg-[#00AA5B]"
                                )}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Masa Berlaku */}
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span
                              className={cn(
                                "text-xs font-semibold whitespace-nowrap",
                                isExpired ? "text-rose-600 font-bold" : "text-slate-700"
                              )}
                            >
                              {v.expiry ? v.expiry : "Selamanya"}
                              {isExpired && " (Habis)"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Toggle Switch */}
                        <TableCell className="text-center px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                            <Switch
                              checked={v.status === "ACTIVE" && !isExpired && !isQuotaFull}
                              disabled={isExpired || isQuotaFull}
                              onCheckedChange={() => handleToggleStatus(v)}
                              className="data-[state=checked]:bg-[#00AA5B]"
                            />
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                              {isExpired
                                ? "Kedaluwarsa"
                                : isQuotaFull
                                  ? "Kuota Habis"
                                  : v.status === "ACTIVE"
                                    ? "Aktif"
                                    : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(v)}
                              className="h-8 w-8 rounded-lg hover:text-[#00AA5B] hover:bg-emerald-50 text-slate-600 transition-colors"
                              title="Edit Voucher"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingVoucher(v)}
                              className="h-8 w-8 rounded-lg hover:text-rose-600 hover:bg-rose-50 text-slate-600 transition-colors"
                              title="Hapus Voucher"
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

      {/* MODAL / DIALOG FORM BUAT & EDIT VOUCHER */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-white">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 shrink-0 text-left pr-12 bg-white">
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-[#212121]">
              <div className="w-7 h-7 rounded-lg bg-[#00AA5B]/10 flex items-center justify-center text-[#00AA5B] shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              {editingVoucher ? "Edit Voucher Toko" : "Buat Voucher Toko Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Tentukan kode promo, tipe diskon, batas kuota, dan masa berlaku voucher.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVoucher} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              {/* Kode Voucher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Kode Voucher <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="Contoh: HEMAT10, PROMOJOSS"
                    maxLength={20}
                    className="h-10 text-xs font-mono font-bold tracking-wider uppercase rounded-xl pl-9"
                    required
                  />
                  <Tag className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Gunakan huruf besar & angka tanpa spasi (maksimal 20 karakter).
                </p>
              </div>

              {/* Tipe Diskon Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Model Diskon</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("percentage")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      formType === "percentage"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <Percent className="w-4 h-4" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("fixed")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                      formType === "fixed"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Nominal Tetap (Rp)</span>
                  </button>
                </div>
              </div>

              {/* Nilai Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    {formType === "percentage" ? "Diskon (%)" : "Nominal Potongan (Rp)"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={formType === "percentage" ? 100 : undefined}
                      step="any"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder={formType === "percentage" ? "10" : "15000"}
                      className="h-9 text-xs rounded-lg pl-8"
                      required
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      {formType === "percentage" ? "%" : "Rp"}
                    </span>
                  </div>
                </div>

                {formType === "percentage" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Maks. Potongan (Rp)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={formMaxDiscount}
                        onChange={(e) => setFormMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Opsional (cth: 25000)"
                        className="h-9 text-xs rounded-lg pl-8"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        Rp
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Min. Belanja (Rp)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={formMinPurchase}
                        onChange={(e) => setFormMinPurchase(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0 = Tanpa minimal"
                        className="h-9 text-xs rounded-lg pl-8"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        Rp
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {formType === "percentage" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Min. Belanja (Rp)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={formMinPurchase}
                      onChange={(e) => setFormMinPurchase(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0 = Tanpa minimal"
                      className="h-9 text-xs rounded-lg pl-8"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                  </div>
                </div>
              )}

              {/* Kuota & Tanggal Kedaluwarsa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Kuota Voucher <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    value={formQuota}
                    onChange={(e) => setFormQuota(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Contoh: 100"
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Berlaku Sampai <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Target Cakupan Produk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Cakupan Produk</label>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {formScope === "SPECIFIC_PRODUCTS"
                      ? `${selectedProductIds.length} produk dipilih`
                      : "Berlaku semua produk"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormScope("ALL_PRODUCTS")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 transition-all cursor-pointer text-left",
                      formScope === "ALL_PRODUCTS"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span>Semua Produk</span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground line-clamp-1">
                      Berlaku seluruh produk toko
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormScope("SPECIFIC_PRODUCTS")}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 transition-all cursor-pointer text-left",
                      formScope === "SPECIFIC_PRODUCTS"
                        ? "border-[#00AA5B] bg-[#00AA5B]/10 text-[#00AA5B] ring-1 ring-[#00AA5B]"
                        : "border-border/70 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>Produk Tertentu</span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground line-clamp-1">
                      Pilih produk yang berlaku
                    </span>
                  </button>
                </div>

                {/* Daftar Pilihan Produk Jika SPECIFIC_PRODUCTS */}
                {formScope === "SPECIFIC_PRODUCTS" && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-border/80 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Cari produk toko..."
                          className="h-8 pl-8 text-[11px] rounded-lg bg-white border-border"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds(shopProducts.map((p) => String(p.id)))}
                          className="text-[10px] font-bold text-[#00AA5B] hover:underline px-1 py-0.5"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="text-[10px] font-bold text-rose-500 hover:underline px-1 py-0.5"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {loadingProducts ? (
                      <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-[#00AA5B]" />
                        <span>Memuat daftar produk...</span>
                      </div>
                    ) : shopProducts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        Toko belum memiliki produk.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {filteredShopProducts.length === 0 ? (
                          <p className="text-[11px] text-center text-muted-foreground py-2">
                            Tidak ada produk yang cocok dengan pencarian.
                          </p>
                        ) : (
                          filteredShopProducts.map((p) => {
                            const isChecked = selectedProductIds.includes(String(p.id));
                            const imgUrl = p.images?.[0]?.imageUrl || "/assets/img/logo.png";
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  const idStr = String(p.id);
                                  setSelectedProductIds((prev) =>
                                    prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
                                  );
                                }}
                                className={cn(
                                  "flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none",
                                  isChecked
                                    ? "bg-white border-[#00AA5B] shadow-2xs"
                                    : "bg-white/60 border-border/60 hover:bg-white"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded text-[#00AA5B] accent-[#00AA5B] shrink-0 pointer-events-none"
                                />
                                <div className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden shrink-0 relative border border-border/50">
                                  <img
                                    src={imgUrl}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[#212121] truncate leading-tight">
                                    {p.title}
                                  </p>
                                  <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    Rp {Number(p.price || 0).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {selectedProductIds.length === 0 && (
                      <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        Pilih minimal 1 produk untuk voucher ini.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border/60">
                <div>
                  <p className="text-xs font-bold text-[#212121]">Status Voucher</p>
                  <p className="text-[10px] text-muted-foreground">
                    Aktifkan agar dapat langsung digunakan pembeli di checkout
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="data-[state=checked]:bg-[#00AA5B]"
                />
              </div>

              {/* Live Card Preview */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00AA5B]" /> Pratinjau Tampilan Voucher:
                  </span>
                  <Badge className="bg-[#00AA5B] text-white text-[9px] px-2 py-0 border-none">
                    {formCode.trim().toUpperCase() || "KODE"}
                  </Badge>
                </div>
                <p className="text-xs font-extrabold text-[#212121]">
                  Diskon {formType === "percentage" ? `${formValue || 0}%` : `Rp ${Number(formValue || 0).toLocaleString("id-ID")}`}
                  {formType === "percentage" && formMaxDiscount ? ` (Maks. Rp ${Number(formMaxDiscount).toLocaleString("id-ID")})` : ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formMinPurchase && Number(formMinPurchase) > 0
                    ? `Min. belanja Rp ${Number(formMinPurchase).toLocaleString("id-ID")} • `
                    : "Tanpa min. belanja • "}
                  Kuota: {formQuota || 0} klaim • s/d {formExpiry || "selamanya"}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                  {formScope === "SPECIFIC_PRODUCTS" ? (
                    <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-md">
                      <Package className="w-3 h-3" />
                      Khusus {selectedProductIds.length} produk terpilih
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md">
                      <Store className="w-3 h-3" />
                      Berlaku untuk semua produk
                    </span>
                  )}
                </div>
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {editingVoucher ? "Simpan Perubahan" : "Buat Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI HAPUS VOUCHER */}
      <Dialog open={!!deletingVoucher} onOpenChange={(open) => !open && setDeletingVoucher(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-5 border border-border bg-white shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-extrabold text-[#212121]">
                Hapus Voucher?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin menghapus voucher{" "}
                <strong className="text-foreground font-mono">
                  &quot;{deletingVoucher?.code}&quot;
                </strong>
                ? Pembeli tidak akan dapat menggunakan kode promo ini lagi.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-row items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingVoucher(null)}
              className="flex-1 h-9 text-xs font-bold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 h-9 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
