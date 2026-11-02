"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  Store,
  Star,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

export interface ResellerCatalogItem {
  id: string;
  userId: string;
  buyerSku: string;
  productId: string;
  customName?: string | null;
  sellingPrice?: number | null;
  status: "ACTIVE" | "INACTIVE";
  sellerPrice: number;
  sellerStock: number;
  sellerStockType?: "REUSABLE" | "SINGLE_USE";
  sellerStatus: string;
  sellerTitle: string;
  sellerShopId: string;
  categoryName: string;
  categorySlug?: string;
  productSlug?: string;
  ratingAvg?: number;
  imageUrl?: string;
  sellerName?: string;
}

export default function DashboardProductsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real products list configured by this reseller
  const [products, setProducts] = useState<ResellerCatalogItem[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSellerFilter, setSelectedSellerFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"POPULAR" | "CHEAPEST" | "PRICIEST" | "RATING">("POPULAR");

  // Selection state for checkbox
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  // Local draft & saving states for editing product codes
  const [skuDrafts, setSkuDrafts] = useState<Record<string, string>>({});
  const [savingSkuId, setSavingSkuId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch real reseller products from API
  const loadResellerProducts = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch(`/api/reseller/products?userId=${encodeURIComponent(user.uid)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        // Resolve friendly seller names without UID fallback
        const formatted = data.products.map((p: any) => {
          const isOfficial =
            p.sellerIsOfficial ||
            p.sellerShopId === "7eiFB7ievpRHlVbdq049z3AhtT73" ||
            p.sellerShopId === "marketpoint";
          const sellerName =
            p.sellerName && !p.sellerName.startsWith("Toko ")
              ? p.sellerName
              : isOfficial
                ? "MarketPoint"
                : p.sellerName || "MarketPoint";

          return {
            ...p,
            sellerName,
            sellerIsOfficial: isOfficial,
          };
        });
        setProducts(formatted);
      }
    } catch (e) {
      console.error("Gagal memuat produk reseller:", e);
      toast({
        title: "Gagal Memuat Produk",
        description: "Tidak dapat mengambil data katalog dari server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    setMounted(true);
    loadResellerProducts();
  }, [loadResellerProducts]);

  // Unique list of all sellers across current products
  const allSellers = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.sellerShopId) {
        map.set(p.sellerShopId, p.sellerName || p.sellerShopId);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Unique list of all categories across current products
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Handle saving product code with checkmark confirmation
  const handleSaveSku = async (productId: string) => {
    if (!user?.uid) return;
    const target = products.find((p) => p.productId === productId);
    if (!target) return;

    const newSku = (skuDrafts[productId] !== undefined ? skuDrafts[productId] : (target.buyerSku || "")).trim();

    // If unchanged, simply remove from draft
    if (newSku === (target.buyerSku || "")) {
      setSkuDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    setSavingSkuId(productId);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/reseller/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.uid,
          buyerSku: newSku,
          productId: productId,
          customName: target.customName || target.sellerTitle,
          sellingPrice: target.sellingPrice || target.sellerPrice,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal menyimpan kode produk.");
      }

      // Optimistic local update
      setProducts((prev) =>
        prev.map((p) => (p.productId === productId ? { ...p, buyerSku: newSku } : p))
      );

      // Clear draft
      setSkuDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      toast({
        title: "Kode Produk Berhasil Diubah",
        description: newSku
          ? `Kode untuk "${target.customName || target.sellerTitle}" berhasil diubah menjadi ${newSku}.`
          : `Kode untuk "${target.customName || target.sellerTitle}" berhasil dikosongkan.`,
      });
    } catch (err: any) {
      console.error("Gagal mengubah kode:", err);
      toast({
        title: "Gagal Mengubah Kode",
        description: err.message || "Terjadi kesalahan saat menyimpan kode.",
        variant: "destructive",
      });
    } finally {
      setSavingSkuId(null);
    }
  };

  // Delete product mapping handler
  const handleDeleteProduct = async (buyerSku: string, title?: string) => {
    if (!user?.uid) return;

    // Optimistic local removal
    setProducts((prev) => prev.filter((p) => p.buyerSku !== buyerSku));
    setSelectedSkus((prev) => prev.filter((s) => s !== buyerSku));

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch(
        `/api/reseller/products?userId=${encodeURIComponent(user.uid)}&sku=${encodeURIComponent(buyerSku)}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal menghapus produk");
      }
      toast({
        title: "Produk Dihapus",
        description: `"${title || buyerSku}" dihapus dari katalog Anda.`,
      });
    } catch (err: any) {
      console.error("Gagal menghapus produk:", err);
      loadResellerProducts(); // rollback by reloading
      toast({
        title: "Gagal Menghapus",
        description: err.message || "Terjadi kesalahan server.",
        variant: "destructive",
      });
    }
  };

  // Batch delete handler
  const handleBatchDelete = async () => {
    if (selectedSkus.length === 0 || !user?.uid) return;

    const toDelete = [...selectedSkus];
    setProducts((prev) => prev.filter((p) => !toDelete.includes(p.buyerSku)));
    setSelectedSkus([]);

    try {
      const token = user ? await user.getIdToken() : "";
      await Promise.all(
        toDelete.map((sku) =>
          fetch(
            `/api/reseller/products?userId=${encodeURIComponent(user.uid)}&sku=${encodeURIComponent(sku)}`,
            {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          )
        )
      );
      toast({
        title: "Berhasil Menghapus",
        description: `${toDelete.length} produk berhasil dihapus dari katalog Anda.`,
      });
    } catch (err: any) {
      console.error("Gagal menghapus batch:", err);
      loadResellerProducts();
      toast({
        title: "Peringatan",
        description: "Sebagian produk gagal dihapus. Silakan refresh halaman.",
        variant: "destructive",
      });
    }
  };

  // Filtered & Sorted products for main table
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          p.buyerSku.toLowerCase().includes(q) ||
          (p.customName || p.sellerTitle || "").toLowerCase().includes(q) ||
          (p.categoryName || "").toLowerCase().includes(q) ||
          (p.sellerName || "").toLowerCase().includes(q);

        const matchesCategory =
          selectedCategory === "all" || p.categoryName === selectedCategory;

        const matchesSeller =
          selectedSellerFilter === "all" || p.sellerShopId === selectedSellerFilter;

        return matchesSearch && matchesCategory && matchesSeller;
      })
      .sort((a, b) => {
        if (sortBy === "CHEAPEST") return (a.sellerPrice || 0) - (b.sellerPrice || 0);
        if (sortBy === "PRICIEST") return (b.sellerPrice || 0) - (a.sellerPrice || 0);
        if (sortBy === "RATING") return (b.ratingAvg || 5) - (a.ratingAvg || 5);
        return 0; // Default sort by updated_at from DB
      });
  }, [products, search, selectedCategory, selectedSellerFilter, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSellerFilter, sortBy, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Selection handlers
  const isAllPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedSkus.includes(p.buyerSku));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageSkus = new Set(paginatedProducts.map((p) => p.buyerSku));
      setSelectedSkus((prev) => prev.filter((sku) => !pageSkus.has(sku)));
    } else {
      const newSkus = new Set(selectedSkus);
      paginatedProducts.forEach((p) => newSkus.add(p.buyerSku));
      setSelectedSkus(Array.from(newSkus));
    }
  };

  const toggleSelectOne = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((item) => item !== sku) : [...prev, sku]
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Kode Produk Disalin",
      description: `Kode "${code}" berhasil disalin ke clipboard.`,
    });
  };

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Katalog Produk Saya
            </h1>
            <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-[#00AA5B]/20 text-[10px] font-bold py-0.5 px-2">
              {products.length} Produk
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur kode produk custom Anda untuk otomatisasi transaksi via API Head-to-Head (H2H).
          </p>
        </div>

        {/* Action Buttons: Layanan PPOB & Tambah Produk */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/services">
            <Button
              variant="outline"
              className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Layanan PPOB</span>
            </Button>
          </Link>

          <Link href="/dashboard/products/add">
            <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-semibold text-xs gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Produk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <Card className="border border-slate-200/80 bg-white shadow-xs rounded-xl p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode produk, nama layanan, seller..."
              className="pl-9 h-9 text-xs sm:text-sm bg-slate-50/60 hover:bg-slate-50 focus:bg-white border-slate-200 rounded-lg transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 w-[150px] text-xs font-medium bg-slate-50/60 border-slate-200 rounded-lg">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Kategori
                </SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seller Filter */}
            <Select value={selectedSellerFilter} onValueChange={setSelectedSellerFilter}>
              <SelectTrigger className="h-9 w-[160px] text-xs font-medium bg-slate-50/60 border-slate-200 rounded-lg">
                <SelectValue placeholder="Semua Seller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Seller
                </SelectItem>
                {allSellers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select
              value={sortBy}
              onValueChange={(v: "POPULAR" | "CHEAPEST" | "PRICIEST" | "RATING") => setSortBy(v)}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs font-medium bg-slate-50/60 border-slate-200 rounded-lg">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POPULAR" className="text-xs">
                  Paling Baru
                </SelectItem>
                <SelectItem value="CHEAPEST" className="text-xs">
                  Harga Terendah
                </SelectItem>
                <SelectItem value="PRICIEST" className="text-xs">
                  Harga Tertinggi
                </SelectItem>
                <SelectItem value="RATING" className="text-xs">
                  Rating Tertinggi
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="h-9 w-[90px] text-xs font-medium bg-slate-50/60 border-slate-200 rounded-lg">
                <SelectValue placeholder="Baris" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">
                  10 baris
                </SelectItem>
                <SelectItem value="25" className="text-xs">
                  25 baris
                </SelectItem>
                <SelectItem value="50" className="text-xs">
                  50 baris
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 3. Batch Action Floating Bar */}
      {selectedSkus.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00AA5B]" />
            <span>{selectedSkus.length} produk terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedSkus([])}
              className="h-8 text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100"
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBatchDelete}
              className="h-8 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedSkus.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* 4. Products Table */}
      <Card className="border border-slate-200/80 bg-white shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <Checkbox
                    checked={isAllPageSelected}
                    onCheckedChange={toggleSelectAllPage}
                    aria-label="Pilih semua produk di halaman"
                  />
                </th>
                <th className="py-3 px-3 font-semibold min-w-[150px]">
                  Kode Produk (SKU)
                </th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">
                  Nama Produk
                </th>
                <th className="py-3 px-4 font-semibold min-w-[170px]">
                  Seller
                </th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                  Harga Modal
                </th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                  Stok
                </th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-transparent">
                    <td className="py-3 px-4"><Skeleton className="h-10 w-10 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded-md" /></td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-44 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md mt-1" />
                    </td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 rounded-md ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-4 w-12 rounded-md mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-5 w-16 rounded-md mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><Skeleton className="h-7 w-14 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                        <ShoppingBag className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-700 text-sm">
                          {products.length === 0
                            ? "Katalog Anda Masih Kosong"
                            : "Produk Tidak Ditemukan"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {products.length === 0
                            ? "Anda belum menambahkan produk seller ke katalog reseller Anda. Tambahkan produk untuk memulai transaksi via API."
                            : "Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih."}
                        </p>
                      </div>
                      {products.length === 0 && (
                        <Link href="/dashboard/products/add">
                          <Button className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00924E] text-white font-semibold text-xs gap-1.5 shadow-xs mt-2">
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Tambah Produk Sekarang</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedSkus.includes(p.buyerSku);

                  return (
                    <tr
                      key={p.productId}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors group",
                        isSelected && "bg-emerald-50/40"
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(p.buyerSku)}
                          aria-label={`Pilih ${p.sellerTitle}`}
                        />
                      </td>

                      {/* 2. Kode Produk (Editable inline with checkmark confirmation) */}
                      <td className="py-3 px-3">
                        {(() => {
                          const currentVal =
                            skuDrafts[p.productId] !== undefined
                              ? skuDrafts[p.productId]
                              : p.buyerSku || "";
                          const isDirty =
                            skuDrafts[p.productId] !== undefined &&
                            skuDrafts[p.productId] !== (p.buyerSku || "");
                          const isSaving = savingSkuId === p.productId;

                          return (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={currentVal}
                                onChange={(e) => {
                                  const clean = e.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9_-]/g, "");
                                  setSkuDrafts((prev) => ({
                                    ...prev,
                                    [p.productId]: clean,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveSku(p.productId);
                                  }
                                }}
                                placeholder="KODE"
                                className={cn(
                                  "h-8 w-28 font-mono text-xs font-bold bg-slate-50 border-slate-200 focus:bg-white focus:border-[#00AA5B] focus:ring-1 focus:ring-[#00AA5B]/20 rounded-lg px-2.5 transition-all shadow-2xs",
                                  isDirty
                                    ? "border-amber-400 bg-amber-50/40 text-amber-900 ring-1 ring-amber-300"
                                    : currentVal
                                      ? "text-slate-800"
                                      : "text-slate-400 italic"
                                )}
                                title="Ketik kode custom lalu klik tombol centang untuk menyimpan"
                              />

                              {/* Tombol Centang untuk Simpan */}
                              <button
                                type="button"
                                onClick={() => handleSaveSku(p.productId)}
                                disabled={isSaving || !isDirty}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0",
                                  isDirty
                                    ? "bg-[#00AA5B] hover:bg-[#008f4c] text-white shadow-xs cursor-pointer active:scale-95"
                                    : "text-slate-300 bg-slate-100/50 cursor-not-allowed opacity-50"
                                )}
                                title={isDirty ? "Klik untuk simpan perubahan kode" : "Kode belum diubah"}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                              </button>

                              {/* Tombol Salin Kode */}
                              {p.buyerSku && (
                                <button
                                  type="button"
                                  onClick={() => copyCode(p.buyerSku)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                                  title="Salin Kode SKU"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 3. Nama Produk */}
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="min-w-0 space-y-0.5">
                          <Link href={`/products/${p.productId}`} className="block">
                            <h4 className="font-bold text-slate-900 group-hover:text-[#00AA5B] transition-colors truncate leading-tight text-xs">
                              {p.customName || p.sellerTitle}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[9px] font-semibold text-slate-500 bg-slate-50 border-slate-200 py-0 px-1.5"
                            >
                              {p.categoryName || "Produk Digital"}
                            </Badge>
                            {p.ratingAvg && p.ratingAvg > 0 ? (
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{p.ratingAvg.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Belum ada rating
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Seller */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800 text-xs truncate">
                            {p.sellerName || "MarketPoint"}
                          </span>
                          {(p.sellerShopId === "marketpoint" || p.sellerShopId === "7eiFB7ievpRHlVbdq049z3AhtT73") && (
                            <Badge className="bg-emerald-50 text-[#00AA5B] border-emerald-200/80 text-[9px] font-bold py-0.5 px-1.5 rounded-md">
                              Official
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* 5. Harga (Smaller Rp unit) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">Rp</span>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            {(p.sellerPrice || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>

                      {/* 6. Stok (Differentiate REUSABLE vs SINGLE_USE) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {p.sellerStockType === "REUSABLE" ? (
                          <div className="flex items-center justify-center text-slate-800" title="Unlimited (Stok Tidak Terbatas)">
                            <svg
                              className="w-4 h-4 text-slate-700"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.178-8-12.356-8-5.096 0-5.096 8 0 8 5.178 0 7.261-8 12.356-8z" />
                            </svg>
                          </div>
                        ) : (p.sellerStock ?? 0) > 0 ? (
                          <span className="font-bold text-slate-800 text-xs">
                            {p.sellerStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                            <span>Habis</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {p.status === "ACTIVE" && (p.sellerStatus === "ACTIVE" || !p.sellerStatus) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00AA5B] border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
                            <span>Aktif</span>
                          </span>
                        ) : p.sellerStatus === "MAINTENANCE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Gangguan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(p.buyerSku, p.sellerTitle)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus dari katalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-800 font-semibold">
                {filteredProducts.length === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-800 font-semibold">
                {endIndex}
              </strong>{" "}
              dari{" "}
              <strong className="text-slate-800 font-semibold">
                {filteredProducts.length}
              </strong>{" "}
              produk
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0 border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-600">
              Hal {validPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0 border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
