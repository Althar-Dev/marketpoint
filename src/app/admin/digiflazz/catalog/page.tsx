"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Zap,
  RefreshCw,
  Wallet,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Server,
  PackageCheck,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DigiFlazzItem {
  product_name: string;
  category: string;
  brand: string;
  type?: string;
  seller_name?: string;
  price?: number;
  admin?: number;
  commission?: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock?: boolean;
  stock?: number;
  multi?: boolean;
  start_cut_off?: string;
  end_cut_off?: string;
  desc?: string;
  cmd_type?: "prepaid" | "pasca";
}

export default function DigiFlazzCatalogPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [clearingCatalog, setClearingCatalog] = useState(false);
  const digiflazzDocRef = useMemoFirebase(() => doc(db, "settings", "digiflazz"), [db]);
  const { data: digiflazzData } = useDoc(digiflazzDocRef);
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [productsList, setProductsList] = useState<DigiFlazzItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [dbSize, setDbSize] = useState<string>("0 KB");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCmd, setSelectedCmd] = useState<"all" | "prepaid" | "pasca">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("name_asc");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<DigiFlazzItem | null>(null);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setMounted(true);
    fetchCachedProducts();
  }, []);

  useEffect(() => {
    if (digiflazzData) {
      setUsername(digiflazzData.username || "");
      setApiKey(digiflazzData.apiKey || "");
      if (digiflazzData.lastSyncTime) {
        setLastSyncTime(digiflazzData.lastSyncTime);
      }
    }
  }, [digiflazzData]);

  const fetchCachedProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/digiflazz/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProductsList(data.data);
        if (data.dbSize) {
          setDbSize(data.dbSize);
        }
        if (data.lastSync) {
          try {
            setLastSyncTime(new Date(data.lastSync).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }));
          } catch {
            setLastSyncTime(data.lastSync);
          }
        }
      }
    } catch (e) {
      console.warn("Gagal mengambil ketersediaan DigiFlazz:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSyncProducts = async () => {
    if (!username || !apiKey) {
      toast({ variant: "destructive", title: "Kredensial Kosong", description: "Silakan atur Username & API Key di menu DigiFlazz Config terlebih dahulu." });
      return;
    }

    setSyncingProducts(true);
    try {
      const resPrepaid = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_digiflazz_pricelist",
          username,
          apiKey,
          cmd: "prepaid",
        }),
      });
      const dataPrepaid = await resPrepaid.json();

      const resPasca = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_digiflazz_pricelist",
          username,
          apiKey,
          cmd: "pasca",
        }),
      });
      const dataPasca = await resPasca.json();

      if (!dataPrepaid.success && dataPrepaid.error) {
        throw new Error(dataPrepaid.error);
      }
      if (!dataPasca.success && dataPasca.error) {
        throw new Error(dataPasca.error);
      }

      let combined: DigiFlazzItem[] = [];

      if (dataPrepaid.success && Array.isArray(dataPrepaid.data)) {
        combined = [...combined, ...dataPrepaid.data.map((item: any) => ({ ...item, cmd_type: "prepaid" }))];
      }
      if (dataPasca.success && Array.isArray(dataPasca.data)) {
        combined = [...combined, ...dataPasca.data.map((item: any) => ({ ...item, cmd_type: "pasca" }))];
      }

      const isItemActive = (item: any) => {
        const buyerOk = item.buyer_product_status === true || item.buyer_product_status === 1 || item.buyer_product_status === "true";
        const sellerOk = item.seller_product_status === true || item.seller_product_status === 1 || item.seller_product_status === "true";
        return buyerOk && sellerOk;
      };

      const activeCombined = combined.filter(isItemActive);

      if (activeCombined.length === 0) {
        toast({
          variant: "destructive",
          title: "Sinkronisasi Kosong (0 Produk Aktif)",
          description: "Tidak ada produk aktif yang dikembalikan dari API DigiFlazz. Pastikan Username, API Key, dan IP Whitelist pada dashboard DigiFlazz Anda sudah benar.",
        });
        return;
      }

      const syncRes = await fetch("/api/admin/digiflazz/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_items",
          items: activeCombined,
        }),
      });
      const syncData = await syncRes.json();
      if (!syncData.success) {
        throw new Error(syncData.error || "Gagal menyimpan hasil sinkronisasi");
      }

      const nowStr = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

      try {
        await setDoc(digiflazzDocRef, { lastSyncTime: nowStr, totalProducts: activeCombined.length }, { merge: true });
      } catch (e) {
        console.warn("Firestore sync cache update error:", e);
      }

      await fetchCachedProducts();

      toast({
        title: "Sinkronisasi Berhasil!",
        description: `Berhasil memperbarui & menyinkronkan ${activeCombined.length.toLocaleString('id-ID')} produk aktif. Produk lama/terhapus di DigiFlazz telah dibersihkan.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Sinkronisasi",
        description: err.message || "Terjadi kesalahan saat mengambil price-list dari API DigiFlazz.",
      });
    } finally {
      setSyncingProducts(false);
    }
  };

  const handleClearCatalog = async () => {
    setClearingCatalog(true);
    try {
      const res = await fetch("/api/admin/digiflazz/products", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProductsList([]);
        if (data.dbSize) setDbSize(data.dbSize);
        toast({
          title: "Catalog Dikosongkan!",
          description: data.message || "Berhasil menghapus seluruh katalog di database/catalog.db.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menghapus",
          description: data.error || "Gagal mengosongkan katalog database.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: "Terjadi kesalahan jaringan saat menghapus catalog.",
      });
    } finally {
      setClearingCatalog(false);
    }
  };

  const handleDeleteSingleProduct = async (item: DigiFlazzItem) => {
    setDeletingSku(item.buyer_sku_code);
    try {
      const res = await fetch(`/api/admin/digiflazz/products?sku=${encodeURIComponent(item.buyer_sku_code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProductsList((prev) => prev.filter((p) => p.buyer_sku_code !== item.buyer_sku_code));
        setSelectedSkus((prev) => prev.filter((s) => s !== item.buyer_sku_code));
        if (data.dbSize) setDbSize(data.dbSize);
        toast({
          title: "Produk Berhasil Dihapus",
          description: `"${item.product_name}" (${item.buyer_sku_code}) berhasil dihapus dari .`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menghapus",
          description: data.error || "Gagal menghapus produk dari database.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Kesalahan Jaringan",
        description: "Gagal menghubungi server saat menghapus produk.",
      });
    } finally {
      setDeletingSku(null);
      setProductToDelete(null);
    }
  };

  // Bulk Delete Selected Products Function
  const handleBulkDelete = async () => {
    if (selectedSkus.length === 0) return;
    setDeletingBulk(true);
    try {
      const res = await fetch("/api/admin/digiflazz/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: selectedSkus }),
      });
      const data = await res.json();
      if (data.success) {
        const count = data.deletedCount || selectedSkus.length;
        setProductsList((prev) => prev.filter((p) => !selectedSkus.includes(p.buyer_sku_code)));
        setSelectedSkus([]);
        setBulkDeleteModalOpen(false);
        if (data.dbSize) setDbSize(data.dbSize);
        toast({
          title: "Produk Berhasil Dihapus",
          description: `Berhasil menghapus ${count.toLocaleString("id-ID")} produk terpilih dari .`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Menghapus",
          description: data.error || "Gagal menghapus produk terpilih.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Kesalahan Jaringan",
        description: "Gagal menghubungi server saat menghapus produk terpilih.",
      });
    } finally {
      setDeletingBulk(false);
    }
  };

  const toggleSelectAllPage = () => {
    const pageSkus = paginatedProducts.map((p) => p.buyer_sku_code);
    const allSelected = pageSkus.length > 0 && pageSkus.every((sku) => selectedSkus.includes(sku));
    if (allSelected) {
      setSelectedSkus((prev) => prev.filter((sku) => !pageSkus.includes(sku)));
    } else {
      setSelectedSkus((prev) => Array.from(new Set([...prev, ...pageSkus])));
    }
  };

  const toggleSelectSku = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    );
  };

  // Extract Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    productsList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [productsList]);

  // Extract Brands
  const brandsList = useMemo(() => {
    const set = new Set<string>();
    productsList.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort();
  }, [productsList]);

  // Filtered & Sorted Products List
  const filteredProducts = useMemo(() => {
    let result = productsList.filter((item) => {
      if (selectedCmd !== "all" && item.cmd_type !== selectedCmd) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedBrand !== "all" && item.brand !== selectedBrand) return false;

      if (selectedStatus === "active" && (!item.buyer_product_status || !item.seller_product_status)) return false;
      if (selectedStatus === "inactive" && (item.buyer_product_status && item.seller_product_status)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.product_name?.toLowerCase().includes(q);
        const skuMatch = item.buyer_sku_code?.toLowerCase().includes(q);
        const brandMatch = item.brand?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        return nameMatch || skuMatch || brandMatch || catMatch;
      }

      return true;
    });

    return result.sort((a, b) => {
      const priceA = a.cmd_type === "pasca" ? (a.admin || 0) : (a.price || 0);
      const priceB = b.cmd_type === "pasca" ? (b.admin || 0) : (b.price || 0);
      const brandA = (a.brand || "").toLowerCase();
      const brandB = (b.brand || "").toLowerCase();
      const nameA = (a.product_name || "").toLowerCase();
      const nameB = (b.product_name || "").toLowerCase();

      if (selectedSort === "name_desc") {
        if (brandA !== brandB) return brandB.localeCompare(brandA);
        if (priceA !== priceB) return priceA - priceB;
        return nameA.localeCompare(nameB);
      } else if (selectedSort === "price_asc") {
        if (priceA !== priceB) return priceA - priceB;
        if (brandA !== brandB) return brandA.localeCompare(brandB);
        return nameA.localeCompare(nameB);
      } else if (selectedSort === "price_desc") {
        if (priceA !== priceB) return priceB - priceA;
        if (brandA !== brandB) return brandA.localeCompare(brandB);
        return nameA.localeCompare(nameB);
      } else {
        if (brandA !== brandB) return brandA.localeCompare(brandB);
        if (priceA !== priceB) return priceA - priceB;
        return nameA.localeCompare(nameB);
      }
    });
  }, [productsList, selectedCmd, selectedCategory, selectedBrand, selectedStatus, searchQuery, selectedSort]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Page Numbers Array for Pagination Bar
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    toast({ title: "Tersalin!", description: `SKU ${text} telah disalin.` });
    setTimeout(() => setCopiedSku(null), 2000);
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" /> DigiFlazz Catalog
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Pantau dan kelola katalog produk pulsa & PPOB DigiFlazz secara realtime dari database SQLite.
          </p>
        </div>
      </div>

      {/* Top 3 Stat Cards (2 cards per row on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
        {/* Total Products Stat */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <Wallet className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 shrink-0" /> Total Katalog
              </span>
              <Badge variant="outline" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 border-blue-200 text-blue-700 bg-blue-50 shrink-0">
                SQLITE DB
              </Badge>
            </div>
            <div>
              <div className="text-sm sm:text-base md:text-xl font-black text-slate-800 tracking-tight">
                {productsList.length.toLocaleString('id-ID')} <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">SKU</span>
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                {productsList.filter(p => p.buyer_product_status && p.seller_product_status).length.toLocaleString('id-ID')} produk aktif
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Stat */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#00AA5B] shrink-0" /> Terakhir Sync
              </span>
              <Badge variant="outline" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 border-green-200 text-green-700 bg-green-50 shrink-0">
                AUTOSYNC
              </Badge>
            </div>
            <div>
              <div className="text-xs sm:text-sm md:text-lg font-bold text-slate-800 tracking-tight truncate">
                {lastSyncTime || "Belum Pernah"}
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                {lastSyncTime ? "Pembaruan DigiFlazz API" : "Klik Sinkronkan untuk update"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database SQLite Catalog Storage Size */}
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <Server className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600 shrink-0" /> Storage Catalog
              </span>
              <Badge variant="default" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200 shrink-0">
                catalog.db
              </Badge>
            </div>
            <div>
              <div className="text-sm sm:text-base md:text-xl font-black text-purple-700 tracking-tight">
                {dbSize}
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Ukuran file database/catalog.db
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Catalog Card */}
      <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden outline-none focus:outline-none focus-visible:outline-none">
        <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/40 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#212121] flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#00AA5B]" /> Catalog Detail
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Menampilkan {filteredProducts.length.toLocaleString('id-ID')} dari total {productsList.length.toLocaleString('id-ID')} produk. Produk diurutkan berdasarkan abjad & harga termurah.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={clearingCatalog || syncingProducts}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl text-xs h-9 px-3 gap-1.5 shadow-2xs"
                  >
                    {clearingCatalog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {clearingCatalog ? "Hapus Catalog..." : "Hapus Catalog"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border/80 p-5">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      Hapus Katalog?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
                      Tindakan ini akan menghapus seluruh data katalog produk yang tersimpan di database lokal <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold">database/catalog.db</code>. Anda dapat menyinkronkan ulang data kapan saja dari DigiFlazz API.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="pt-3 gap-2">
                    <AlertDialogCancel className="rounded-xl text-xs font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0">
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearCatalog}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 px-4"
                    >
                      Ya, Hapus Catalog
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSyncProducts}
                disabled={syncingProducts || clearingCatalog}
                size="sm"
                className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 px-4 gap-2 shadow-2xs"
              >
                {syncingProducts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {syncingProducts ? "Memproses Sync API..." : "Sinkronkan Harga Terbaru"}
              </Button>
            </div>
          </div>

          {/* Toolbar Filters & Sort */}
          <div className="space-y-2.5 pt-2">
            {/* Row 1: Search Bar & Reset */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari SKU, Nama Produk, Brand, Kategori..."
                  className="h-9 pl-9 rounded-xl bg-white border-border/70 text-xs font-medium focus:ring-[#00AA5B]/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              {(searchQuery || selectedCmd !== "all" || selectedCategory !== "all" || selectedBrand !== "all" || selectedStatus !== "all" || selectedSort !== "name_asc") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCmd("all");
                    setSelectedCategory("all");
                    setSelectedBrand("all");
                    setSelectedStatus("all");
                    setSelectedSort("name_asc");
                    setCurrentPage(1);
                  }}
                  className="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Row 2: 5 Balanced Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* 1. Sort Order Filter */}
              <Select
                value={selectedSort}
                onValueChange={(val: string) => {
                  setSelectedSort(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white border-border/70">
                  <SelectValue placeholder="Urutkan Produk" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="name_asc" className="text-xs">Brand A - Z (Termurah)</SelectItem>
                  <SelectItem value="name_desc" className="text-xs">Brand Z - A</SelectItem>
                  <SelectItem value="price_asc" className="text-xs">Harga Termurah</SelectItem>
                  <SelectItem value="price_desc" className="text-xs">Harga Tertinggi</SelectItem>
                </SelectContent>
              </Select>

              {/* 2. Command Filter */}
              <Select
                value={selectedCmd}
                onValueChange={(val: any) => {
                  setSelectedCmd(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white border-border/70">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Semua Tipe</SelectItem>
                  <SelectItem value="prepaid" className="text-xs">Prepaid (Prabayar)</SelectItem>
                  <SelectItem value="pasca" className="text-xs">Pasca (Pascabayar)</SelectItem>
                </SelectContent>
              </Select>

              {/* 3. Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={(val: string) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white border-border/70 truncate">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  <SelectItem value="all" className="text-xs">Semua Kategori ({categoriesList.length})</SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 4. Brand Filter */}
              <Select
                value={selectedBrand}
                onValueChange={(val: string) => {
                  setSelectedBrand(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white border-border/70 truncate">
                  <SelectValue placeholder="Semua Brand" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56">
                  <SelectItem value="all" className="text-xs">Semua Brand ({brandsList.length})</SelectItem>
                  {brandsList.map((b) => (
                    <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 5. Status Filter */}
              <Select
                value={selectedStatus}
                onValueChange={(val: any) => {
                  setSelectedStatus(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white border-border/70">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="active" className="text-xs">Aktif Semua</SelectItem>
                  <SelectItem value="inactive" className="text-xs">Gangguan / Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loadingProducts ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00AA5B]" />
              <p className="text-xs font-semibold text-slate-600">Memuat katalog produk dari database catalog.db...</p>
            </div>
          ) : productsList.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-foreground">Katalog Produk DigiFlazz Belum Disinkronkan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Klik tombol &quot;Sinkronkan Harga Terbaru&quot; untuk mengambil daftar harga dan SKU prabayar & pascabayar dari DigiFlazz API.
                </p>
              </div>
              <Button
                onClick={handleSyncProducts}
                disabled={syncingProducts}
                className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-10 px-6 gap-2 shadow-sm"
              >
                {syncingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {syncingProducts ? "Menyinkronkan..." : "Mulai Sync Kategori & Produk"}
              </Button>
            </div>
          ) : (
            <>
              {/* Floating / Sticky Bulk Action Bar */}
              {selectedSkus.length > 0 && (
                <div className="bg-red-50/90 border-b border-red-200/80 px-4 py-2.5 flex items-center justify-between text-xs transition-all">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5">
                      {selectedSkus.length} SKU Terpilih
                    </Badge>
                    <span className="text-slate-700 font-medium text-[11px] hidden sm:inline">
                      Pilih produk yang ingin dihapus dari  lokal.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSkus([])}
                      className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Batal Pilih
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setBulkDeleteModalOpen(true)}
                      className="h-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus {selectedSkus.length} Produk
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto outline-none focus:outline-none focus-visible:outline-none">
                <table className="w-full text-left border-collapse whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none">
                  <thead>
                    <tr className="border-b border-border/50 bg-slate-50/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          aria-label="Pilih semua produk di halaman ini"
                          checked={
                            paginatedProducts.length > 0 &&
                            paginatedProducts.every((p) => selectedSkus.includes(p.buyer_sku_code))
                          }
                          onChange={toggleSelectAllPage}
                          className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer align-middle"
                        />
                      </th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Tipe</th>
                      <th className="py-3 px-4 whitespace-nowrap">Seller</th>
                      <th className="py-3 px-4 whitespace-nowrap">SKU</th>
                      <th className="py-3 px-4 whitespace-nowrap">Nama</th>
                      <th className="py-3 px-4 whitespace-nowrap">Deskripsi</th>
                      <th className="py-3 px-4 whitespace-nowrap">Kategori</th>
                      <th className="py-3 px-4 whitespace-nowrap">Brand</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Harga & Admin</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Stok</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs font-medium whitespace-nowrap">
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((item, idx) => {
                        const isPrepaid = item.cmd_type !== "pasca";
                        const priceVal = isPrepaid ? (item.price || 0) : (item.admin || 0);
                        const isAvailable = item.buyer_product_status && item.seller_product_status;
                        const isSelected = selectedSkus.includes(item.buyer_sku_code);

                        return (
                          <tr
                            key={item.buyer_sku_code || idx}
                            className={cn(
                              "transition-colors whitespace-nowrap",
                              isSelected ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/60"
                            )}
                          >
                            {/* 0. Checkbox */}
                            <td className="py-3 px-3 align-middle text-center w-10">
                              <input
                                type="checkbox"
                                aria-label={`Pilih produk ${item.product_name}`}
                                checked={isSelected}
                                onChange={() => toggleSelectSku(item.buyer_sku_code)}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer align-middle"
                              />
                            </td>

                            {/* 1. Tipe */}
                            <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                              <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider bg-slate-100 border-slate-300 text-slate-700 whitespace-nowrap">
                                {isPrepaid ? "PREPAID" : "PASCA"}
                              </Badge>
                            </td>

                            {/* 2. Seller */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap font-semibold text-slate-700 text-xs">
                              {item.seller_name || "DigiFlazz"}
                            </td>

                            {/* 3. SKU */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-mono font-bold text-[11px] text-[#212121] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  {item.buyer_sku_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(item.buyer_sku_code)}
                                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-slate-200/60 transition-colors"
                                  title="Salin SKU"
                                >
                                  {copiedSku === item.buyer_sku_code ? (
                                    <Check className="w-3 h-3 text-[#00AA5B]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* 4. Nama */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap font-bold text-[#2E3137] text-xs">
                              {item.product_name}
                            </td>

                            {/* 5. Deskripsi */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap text-[11px] text-muted-foreground">
                              {item.desc && item.desc !== "-" ? item.desc : "-"}
                            </td>

                            {/* 6. Kategori */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                                {item.category}
                              </span>
                            </td>

                            {/* 7. Brand */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap font-bold text-slate-800 text-xs">
                              {item.brand}
                            </td>

                            {/* 8. Harga & Admin */}
                            <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                              <span className="font-bold text-[#00AA5B] text-xs whitespace-nowrap">
                                Rp {priceVal.toLocaleString("id-ID")}
                              </span>
                              {!isPrepaid && item.commission !== undefined && (
                                <span className="text-[9px] text-blue-600 block font-bold whitespace-nowrap">
                                  Komisi: Rp {item.commission.toLocaleString("id-ID")}
                                </span>
                              )}
                            </td>

                            {/* 9. Stok */}
                            <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                              {item.unlimited_stock ? (
                                <Badge variant="outline" className="text-[9px] font-bold bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                                  Unlimited
                                </Badge>
                              ) : (
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                  {item.stock !== undefined ? item.stock.toLocaleString("id-ID") : "-"}
                                </span>
                              )}
                            </td>

                            {/* 10. Status */}
                            <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                              {isAvailable ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold px-2.5 py-0.5 gap-1 whitespace-nowrap">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> AKTIF
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[9px] font-bold px-2.5 py-0.5 gap-1 whitespace-nowrap">
                                  <XCircle className="w-2.5 h-2.5" /> OFF / GANGGUAN
                                </Badge>
                              )}
                            </td>

                            {/* 11. Aksi (Hapus) */}
                            <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={deletingSku === item.buyer_sku_code}
                                onClick={() => setProductToDelete(item)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus produk dari katalog"
                              >
                                {deletingSku === item.buyer_sku_code ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-xs text-muted-foreground">
                          Tidak ada produk DigiFlazz yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Premium Pagination Bar */}
          {filteredProducts.length > 0 && (
            <div className="p-3 md:p-4 border-t border-border/40 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Info Text */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                <span>
                  Menampilkan <strong className="text-slate-900 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> dari <strong className="text-slate-900 font-bold">{filteredProducts.length.toLocaleString('id-ID')}</strong> SKU
                </span>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-xl border-border/60 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </Button>

                {/* Prev Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 rounded-xl border-border/60 text-slate-700 hover:text-slate-900 font-bold text-xs px-2.5 gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                {/* Number Pills */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((pNum, index) => {
                    if (pNum === "...") {
                      return (
                        <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-muted-foreground font-bold">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = pNum === currentPage;
                    return (
                      <Button
                        key={`page-${pNum}`}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(Number(pNum))}
                        className={cn(
                          "h-8 min-w-8 px-2.5 rounded-xl font-bold text-xs transition-all",
                          isCurrent
                            ? "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-2xs border-transparent"
                            : "border-border/60 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        {pNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-xl border-border/60 text-slate-700 hover:text-slate-900 font-bold text-xs px-2.5 gap-1 disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-xl border-border/60 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Konfirmasi Hapus Single Produk */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border/80 p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Hapus Produk dari Catalog?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-xs text-slate-600 leading-relaxed pt-1 space-y-2">
                <p>Apakah Anda yakin ingin menghapus produk ini dari database  lokal?</p>
                {productToDelete && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1 mt-2">
                    <div className="font-bold text-slate-800">{productToDelete.product_name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>SKU: {productToDelete.buyer_sku_code}</span>
                      <span>•</span>
                      <span>{productToDelete.brand}</span>
                      <span>•</span>
                      <span className="font-sans font-bold text-[#00AA5B]">
                        Rp {(productToDelete.cmd_type === "pasca" ? (productToDelete.admin || 0) : (productToDelete.price || 0)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}
                <span className="text-[11px] text-amber-700 block mt-2">
                  *Produk yang dihapus tidak akan muncul lagi di halaman topup/etalase toko. Anda dapat mengembalikannya kapan saja dengan menekan &quot;Sinkronkan Harga Terbaru&quot;.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingSku}
              onClick={() => productToDelete && handleDeleteSingleProduct(productToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5"
            >
              {deletingSku ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deletingSku ? "Menghapus..." : "Ya, Hapus Produk"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Konfirmasi Hapus Bulk Produk Terpilih */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border/80 p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Hapus {selectedSkus.length} Produk Terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-xs text-slate-600 leading-relaxed pt-1">
                <p>
                  Tindakan ini akan menghapus <strong>{selectedSkus.length} produk</strong> yang Anda pilih dari database SQLite lokal (<code className="bg-slate-100 text-red-600 px-1 py-0.5 rounded font-mono font-bold">database/catalog.db</code>).
                </p>
                <span className="text-[11px] text-amber-700 block mt-2">
                  *Produk-produk terpilih tidak akan tampil di etalase pembeli. Anda dapat mengembalikannya kapan saja melalui Sinkronisasi DigiFlazz.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingBulk}
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5"
            >
              {deletingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deletingBulk ? "Menghapus..." : `Ya, Hapus ${selectedSkus.length} Produk`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
