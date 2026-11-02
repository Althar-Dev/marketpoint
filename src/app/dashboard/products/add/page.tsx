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
  ArrowLeft,
  Search,
  Package,
  Store,
  Star,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  X,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

export interface RealMarketProduct {
  id: string;
  title: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  price: number;
  discountPrice?: number | null;
  stockType: "REUSABLE" | "SINGLE_USE";
  stockCount: number;
  status: string;
  ratingAvg: number;
  ratingCount?: number;
  salesCount: number;
  images: any[];
  imageUrl: string;
  seller: {
    id: string;
    name: string;
    city: string;
    badge: "OFFICIAL" | "VERIFIED" | "STAR_SELLER";
  };
  defaultSku: string;
  isAdded: boolean;
  currentBuyerSku?: string | null;
}

export interface RealCategoryItem {
  id: number;
  name: string;
  slug: string;
}

export default function AddProductPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real products & categories from API
  const [allProducts, setAllProducts] = useState<RealMarketProduct[]>([]);
  const [categories, setCategories] = useState<RealCategoryItem[]>([]);

  // Track locally added product IDs for instantaneous UI response
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSellerFilter, setSelectedSellerFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"POPULAR" | "CHEAPEST" | "PRICIEST" | "RATING">("POPULAR");

  // Selection states for table checkboxes
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch real market products from API
  const loadMarketProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = user?.uid
        ? `/api/reseller/market-products?userId=${encodeURIComponent(user.uid)}`
        : "/api/reseller/market-products";
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setAllProducts(data.products);
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }

        // Initialize added set from API
        const addedSet = new Set<string>();
        data.products.forEach((p: RealMarketProduct) => {
          if (p.isAdded) {
            addedSet.add(p.id);
          }
        });
        setAddedProductIds(addedSet);
      }
    } catch (e) {
      console.error("Gagal memuat katalog pasar:", e);
      toast({
        title: "Gagal Memuat Produk",
        description: "Tidak dapat mengambil produk dari database server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    setMounted(true);
    loadMarketProducts();
  }, [loadMarketProducts]);

  // List of all unique sellers
  const allSellers = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach((p) => {
      if (p.seller?.id && !map.has(p.seller.id)) {
        map.set(p.seller.id, p.seller.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allProducts]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          p.title.toLowerCase().includes(q) ||
          p.seller.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.defaultSku.toLowerCase().includes(q);

        const matchesCategory =
          selectedCategory === "all" ||
          p.categorySlug === selectedCategory ||
          String(p.categoryId) === selectedCategory;

        const matchesSeller =
          selectedSellerFilter === "all" || p.seller.id === selectedSellerFilter;

        return matchesSearch && matchesCategory && matchesSeller;
      })
      .sort((a, b) => {
        if (sortBy === "POPULAR") return (b.salesCount || 0) - (a.salesCount || 0);
        if (sortBy === "RATING") return (b.ratingAvg || 0) - (a.ratingAvg || 0);
        if (sortBy === "CHEAPEST") return a.price - b.price;
        if (sortBy === "PRICIEST") return b.price - a.price;
        return 0;
      });
  }, [allProducts, searchQuery, selectedCategory, selectedSellerFilter, sortBy]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSellerFilter, sortBy, pageSize]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Select all on current page (only selectable if not already added)
  const selectableOnPage = useMemo(() => {
    return paginatedProducts.filter((p) => !addedProductIds.has(p.id));
  }, [paginatedProducts, addedProductIds]);

  const isAllPageSelected =
    selectableOnPage.length > 0 &&
    selectableOnPage.every((p) => selectedRowIds.includes(p.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageRowIds = new Set(selectableOnPage.map((p) => p.id));
      setSelectedRowIds((prev) => prev.filter((id) => !pageRowIds.has(id)));
    } else {
      const newIds = new Set(selectedRowIds);
      selectableOnPage.forEach((p) => newIds.add(p.id));
      setSelectedRowIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add single product offer handler
  const handleAddProduct = async (product: RealMarketProduct) => {
    if (addedProductIds.has(product.id)) {
      toast({
        title: "Produk Sudah Ada",
        description: `"${product.title}" sudah terdaftar di katalog Anda.`,
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI update
    setAddedProductIds((prev) => new Set(prev).add(product.id));
    setSelectedRowIds((prev) => prev.filter((id) => id !== product.id));

    if (user?.uid) {
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
            buyerSku: "", // Biarkan kosong sesuai permintaan user
            productId: product.id,
            customName: product.title,
            sellingPrice: product.price,
            status: "ACTIVE",
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Gagal menyimpan ke database.");
        }

        toast({
          title: "Produk Berhasil Ditambahkan",
          description: `"${product.title}" telah ditambahkan ke katalog Anda. Atur kodenya di halaman katalog.`,
        });
      } catch (err: any) {
        console.error("Gagal menambah produk:", err);
        // Rollback
        setAddedProductIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        toast({
          title: "Gagal Menambahkan",
          description: err.message || "Terjadi kesalahan server.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Perlu Login",
        description: "Silakan login terlebih dahulu untuk menyimpan katalog ke database akun Anda.",
        variant: "destructive",
      });
    }
  };

  // Batch Add handler
  const handleBatchAdd = async () => {
    if (selectedRowIds.length === 0) return;

    const toAdd = allProducts.filter(
      (p) => selectedRowIds.includes(p.id) && !addedProductIds.has(p.id)
    );

    if (toAdd.length === 0) return;

    // Optimistically mark all as added
    setAddedProductIds((prev) => {
      const next = new Set(prev);
      toAdd.forEach((p) => next.add(p.id));
      return next;
    });
    setSelectedRowIds([]);

    if (user?.uid) {
      try {
        const token = user ? await user.getIdToken() : "";
        await Promise.all(
          toAdd.map((p) =>
            fetch("/api/reseller/products", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                userId: user.uid,
                buyerSku: "", // Biarkan kosong
                productId: p.id,
                customName: p.title,
                sellingPrice: p.price,
                status: "ACTIVE",
              }),
            })
          )
        );

        toast({
          title: "Berhasil Menambahkan",
          description: `${toAdd.length} produk berhasil ditambahkan ke katalog Anda (tanpa kode).`,
        });
      } catch (err: any) {
        console.error("Gagal batch add produk:", err);
        toast({
          title: "Peringatan",
          description: "Sebagian produk gagal disimpan ke database. Silakan refresh halaman.",
          variant: "destructive",
        });
      }
    }
  };

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/products">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-800 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Tambah Produk Marketplace
            </h1>
            <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-[#00AA5B]/20 text-[10px] font-bold py-0.5 px-2">
              Katalog Real Seller
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Pilih produk digital dari seller marketplace untuk dimasukkan ke katalog Anda.
          </p>
        </div>
      </div>

      {/* 2. Filters & Search Section */}
      <Card className="border border-slate-200/80 bg-white shadow-xs rounded-xl p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, seller, atau kode SKU..."
              className="pl-9 h-9 text-xs sm:text-sm bg-slate-50/60 hover:bg-slate-50 focus:bg-white border-slate-200 rounded-lg transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug || String(c.id)} className="text-xs">
                    {c.name}
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
                  Paling Populer
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
      {selectedRowIds.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00AA5B]" />
            <span>{selectedRowIds.length} produk seller terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedRowIds([])}
              className="h-8 text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleBatchAdd}
              className="h-8 text-xs font-bold bg-[#00AA5B] hover:bg-[#008f4c] text-white gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambahkan Terpilih ({selectedRowIds.length})</span>
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
                    aria-label="Pilih semua di halaman ini"
                    disabled={selectableOnPage.length === 0}
                  />
                </th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Nama Produk</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Seller</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Harga</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Stok</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap w-28">Aksi</th>
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
                    <td className="py-3 px-4 text-center"><Skeleton className="h-7 w-20 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                        <ShoppingBag className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-slate-700 text-sm">
                        Tidak Ada Produk Ditemukan
                      </h3>
                      <p className="text-xs text-slate-500">
                        {allProducts.length === 0
                          ? "Belum ada produk aktif yang diunggah oleh seller di database marketplace."
                          : "Tidak ada produk yang cocok dengan kata kunci atau filter yang Anda pilih."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isAdded = addedProductIds.has(p.id);
                  const isSelected = selectedRowIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "hover:bg-slate-50/70 transition-colors group",
                        isSelected && "bg-emerald-50/40",
                        isAdded && "opacity-85"
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(p.id)}
                          disabled={isAdded}
                          aria-label={`Pilih ${p.title}`}
                        />
                      </td>

                      {/* 2. Nama Produk */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="space-y-0.5 min-w-0">
                          <Link href={`/products/${p.id}`} className="block">
                            <h4 className="font-bold text-slate-900 group-hover:text-[#00AA5B] transition-colors truncate leading-tight text-xs">
                              {p.title}
                            </h4>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[9px] font-semibold text-slate-500 bg-slate-50 border-slate-200 py-0 px-1.5"
                            >
                              {p.categoryName}
                            </Badge>
                            {p.ratingAvg > 0 ? (
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{p.ratingAvg.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Belum ada rating
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({p.salesCount || 0} terjual)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Seller */}
                      <td className="py-3 px-4 max-w-[180px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800 text-xs truncate">
                            {p.seller.name || "MarketPoint"}
                          </span>
                          {(p.seller.badge === "OFFICIAL" || p.seller.id === "7eiFB7ievpRHlVbdq049z3AhtT73" || p.seller.id === "marketpoint") ? (
                            <Badge className="bg-emerald-50 text-[#00AA5B] border-emerald-200/80 text-[9px] font-bold py-0.5 px-1.5 rounded-md">
                              Official
                            </Badge>
                          ) : p.seller.badge === "VERIFIED" ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200/80 text-[9px] font-bold py-0.5 px-1.5 rounded-md">
                              Verified
                            </Badge>
                          ) : null}
                        </div>
                      </td>

                      {/* 4. Harga Seller (Smaller Rp) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">Rp</span>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            {p.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>

                      {/* 5. Stok (Differentiate REUSABLE vs SINGLE_USE) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.stockType === "REUSABLE" ? (
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
                        ) : (p.stockCount ?? 0) > 0 ? (
                          <span className="font-bold text-slate-800 text-xs">
                            {p.stockCount}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                            <span>Habis</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00AA5B] border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Aksi Tambah */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 py-1 px-2.5 rounded-lg">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Ditambahkan</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(p)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#00AA5B] hover:bg-[#00924E] text-white gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Tambah</span>
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
