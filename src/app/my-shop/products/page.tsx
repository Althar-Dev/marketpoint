"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Globe, FileText, Image as ImageIcon, CheckCircle2, Repeat, Key, Sparkles, X, Upload } from "lucide-react";
import Image from "next/image";

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categoryName?: string;
  price: number;
  discountPrice?: number | null;
  stockType: "REUSABLE" | "SINGLE_USE";
  stockCount: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  salesCount: number;
  ratingAvg: number;
  images: Array<{ imageUrl: string }>;
  files: Array<{ fileName: string; fileUrl: string; fileSize?: number }>;
  createdAt?: string;
}

export default function MerchantProductsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStockType, setFormStockType] = useState<"REUSABLE" | "SINGLE_USE">("REUSABLE");
  const [formStockCount, setFormStockCount] = useState("10");
  const [formLicenseKeysText, setFormLicenseKeysText] = useState("");
  const [formDemoUrl, setFormDemoUrl] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileName, setFormFileName] = useState("");

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Products when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchProducts(user.uid);
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/products?categories=true");
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setFormCategoryId(String(data.categories[0].id));
        }
      }
    } catch (err) {
      console.error("Gagal mengambil kategori:", err);
    }
  };

  const fetchProducts = async (shopId: string) => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?shopId=${shopId}`);
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formImages.length >= 3) {
      toast({ variant: "destructive", title: "Batas Foto Tercapai", description: "Maksimal 3 foto produk yang diperbolehkan." });
      return;
    }

    const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB Limit
    if (file.size > MAX_SIZE_BYTES) {
      toast({
        variant: "destructive",
        title: "Ukuran Gambar Terlalu Besar",
        description: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas maksimal 3MB per foto.`,
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "products");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormImages((prev) => [...prev, data.url]);
        toast({ title: "Berhasil Upload Foto", description: "Foto produk berhasil diunggah." });
      } else {
        throw new Error(data.error || "Gagal mengunggah gambar.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Gagal", description: err.message });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateProduct = async () => {
    if (!user) return;

    if (!formTitle.trim() || formTitle.trim().length < 3) {
      toast({ variant: "destructive", title: "Judul Wajib Diisi", description: "Masukkan judul produk minimal 3 karakter." });
      return;
    }

    if (!formPrice || Number(formPrice) < 0) {
      toast({ variant: "destructive", title: "Harga Tidak Valid", description: "Masukkan harga produk yang sesuai." });
      return;
    }

    if (!formCategoryId) {
      toast({ variant: "destructive", title: "Pilih Kategori", description: "Pilih kategori produk terlebih dahulu." });
      return;
    }

    const singleUseLines = formLicenseKeysText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (formStockType === "SINGLE_USE" && singleUseLines.length === 0) {
      toast({
        variant: "destructive",
        title: "Stok Akun Kosong",
        description: "Masukkan setidaknya 1 baris akun/lisensi di kolom Single Use.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        shopId: user.uid,
        categoryId: Number(formCategoryId),
        title: formTitle.trim(),
        price: Number(formPrice),
        shortDescription: formShortDesc.trim(),
        description: formDesc.trim(),
        stockType: formStockType,
        stockCount: formStockType === "SINGLE_USE" ? singleUseLines.length : 9999,
        demoUrl: formDemoUrl.trim(),
        images: formImages.length > 0 ? formImages : ["https://cdn.marketpoint.id/marketpoint.png"],
        files: formStockType === "REUSABLE" && formFileUrl ? [{ fileName: formFileName || "produk-digital.zip", fileUrl: formFileUrl }] : [],
        licenseKeys: formStockType === "SINGLE_USE" ? singleUseLines : undefined,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan produk.");
      }

      toast({
        title: "Produk Berhasil Dibuat!",
        description: `Produk "${formTitle}" telah aktif dan tersimpan di database.`,
      });

      setShowAddDialog(false);
      resetForm();
      fetchProducts(user.uid);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Membuat Produk", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/products?id=${productId}&shopId=${user.uid}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Produk Dihapus", description: "Produk telah berhasil diarsipkan/dihapus." });
        fetchProducts(user.uid);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus produk.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Hapus Produk", description: err.message });
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormPrice("");
    setFormShortDesc("");
    setFormDesc("");
    setFormStockType("REUSABLE");
    setFormStockCount("10");
    setFormLicenseKeysText("");
    setFormDemoUrl("");
    setFormImages([]);
    setFormFileUrl("");
    setFormFileName("");
  };

  const filteredProducts = products.filter((p) => {
    const matchQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const outOfStockCount = products.filter((p) => p.stockType === "SINGLE_USE" && p.stockCount === 0).length;
  const totalSalesCount = products.reduce((sum, p) => sum + Number(p.salesCount || 0), 0);

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-[#212121]">Manajemen Produk Digital</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kelola inventaris, harga, dan ketersediaan produk digital Anda.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="h-10 px-5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-md shadow-[#00AA5B]/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Produk Digital
            </Button>
          </div>
        </div>

        {/* Stats Grid - 4 Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Produk", value: products.length, icon: "ph:package", color: "text-[#2E3137]", bg: "bg-gray-100" },
            { label: "Produk Aktif", value: activeCount, icon: "ph:check-circle", color: "text-[#00AA5B]", bg: "bg-green-50" },
            { label: "Stok Habis", value: outOfStockCount, icon: "ph:warning-circle", color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Terjual", value: totalSalesCount, icon: "ph:shopping-cart-simple", color: "text-blue-600", bg: "bg-blue-50" },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-xl", stat.bg)}>
                    <Icon icon={stat.icon} className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                  <p className="text-xl font-black text-[#212121] tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Button
              variant={statusFilter === "ALL" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("ALL")}
              className={cn("h-8 rounded-lg text-[10px] font-bold", statusFilter === "ALL" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground")}
            >
              Semua ({products.length})
            </Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("ACTIVE")}
              className={cn("h-8 rounded-lg text-[10px] font-bold", statusFilter === "ACTIVE" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground")}
            >
              Aktif ({activeCount})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-64">
              <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari judul produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 rounded-lg border-border text-xs bg-muted/20"
              />
            </div>
          </div>
        </div>

        {/* Product Table / Empty State */}
        {isLoadingProducts ? (
          <Card className="border-border border-[1.5px] p-8 shadow-sm rounded-2xl bg-white text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00AA5B]" />
            <p className="text-xs font-bold text-muted-foreground mt-2">Memuat produk...</p>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-border border-[1.5px] border-dashed p-10 shadow-sm rounded-2xl bg-white text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center mx-auto mb-3">
              <Icon icon="ph:package" className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-[#212121]">Belum Ada Produk Digital</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5 font-medium">
              Tambahkan produk digital pertama Anda (source code, e-book, lisensi software, atau template) untuk mulai berjualan.
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="h-10 px-6 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs gap-2 shadow-md shadow-[#00AA5B]/10"
            >
              <Plus className="w-4 h-4" /> Tambah Produk Sekarang
            </Button>
          </Card>
        ) : (
          <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F8FAFC]">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 px-6">Info Produk</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Harga</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Stok</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10">Status</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase h-10 text-right px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const primaryImg = product.images?.[0]?.imageUrl || "https://cdn.marketpoint.id/marketpoint.png";
                  return (
                    <TableRow key={product.id} className="border-b border-border/50 hover:bg-[#F8FAFC]/50 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg border border-border shadow-sm overflow-hidden bg-muted relative shrink-0">
                            <Image src={primaryImg} alt={product.title} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold text-[#2E3137] truncate max-w-[260px]">{product.title}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{product.categoryName || "Digital"}</span>
                              <span className="text-[8px] text-muted-foreground/30">•</span>
                              <span className="text-[9px] text-[#00AA5B] font-bold">{product.salesCount} Terjual</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-black text-[#2E3137]">Rp {product.price.toLocaleString("id-ID")}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-[#2E3137]">
                          {product.stockType === "REUSABLE" ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1 inline-flex items-center">
                              <Repeat className="w-3 h-3 text-emerald-600" /> Reusable
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold gap-1 inline-flex items-center">
                              <Key className="w-3 h-3 text-blue-600" /> {product.stockCount} Akun / Baris
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md border-none",
                          product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

      </div>

      {/* Modal Dialog Tambah Produk Digital */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md md:max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#212121]">Tambah Produk Digital Baru</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Isi informasi produk digital Anda untuk disimpan di database MarketPoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Judul Produk</Label>
              <Input
                placeholder="Contoh: Source Code Website Top Up Game Next.js"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-10 rounded-xl text-xs font-bold bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Kategori Produk</Label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-muted/20">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs font-medium">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Harga (Rp)</Label>
                <Input
                  type="number"
                  placeholder="150000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="h-10 rounded-xl text-xs font-bold bg-muted/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Tipe Stok Produk</Label>
              <Select value={formStockType} onValueChange={(val: "REUSABLE" | "SINGLE_USE") => setFormStockType(val)}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="REUSABLE" className="text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Reusable (1 Link/File untuk Semua Pembeli)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SINGLE_USE" className="text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Single Use (1 Akun / 1 Baris Per Pembeli)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multi-Image Upload (Max 3 Images, Max 3MB/file) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground">Foto Produk (Maksimal 3 Foto, Max 3MB/file)</Label>
                <span className="text-[10px] font-bold text-muted-foreground">{formImages.length}/3 Foto</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {formImages.map((url, idx) => (
                  <div key={idx} className="relative h-20 rounded-xl overflow-hidden border border-border group bg-muted shadow-sm">
                    <Image src={url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[8px] font-extrabold bg-[#00AA5B] text-white px-1.5 py-0.5 rounded shadow">
                        Utama
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {formImages.length < 3 && (
                  <label className="h-20 rounded-xl border-2 border-dashed border-border hover:border-[#00AA5B] bg-muted/20 hover:bg-[#00AA5B]/5 transition-all flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#00AA5B]" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground">Upload Foto</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {formStockType === "SINGLE_USE" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground">Daftar Akun / Lisensi (1 Baris = 1 Stok)</Label>
                  <Badge variant="outline" className="text-[10px] font-bold text-[#00AA5B] border-[#00AA5B]/30">
                    {formLicenseKeysText.split("\n").map(l => l.trim()).filter(Boolean).length} Stok Terdeteksi
                  </Badge>
                </div>
                <Textarea
                  placeholder={`user1@gmail.com:pass123\nuser2@gmail.com:pass456\nLICENSE-KEY-ABC-123`}
                  value={formLicenseKeysText}
                  onChange={(e) => setFormLicenseKeysText(e.target.value)}
                  className="min-h-[100px] rounded-xl text-xs font-mono bg-muted/20 resize-y"
                />
                <p className="text-[10px] text-muted-foreground">
                  Setiap baris akun/lisensi akan diberikan secara eksklusif ke 1 pembeli saja.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">URL Link File Digital (.zip / .pdf)</Label>
                <Input
                  placeholder="https://cdn.marketpoint.id/files/sourcecode.zip"
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  className="h-10 rounded-xl text-xs font-medium bg-muted/20"
                />
                <p className="text-[10px] text-muted-foreground">Link file ini akan otomatis diberikan ke pembeli setelah transaksi berhasil.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl text-xs font-bold">
              Batal
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={isSubmitting || !formTitle || !formPrice}
              className="rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Simpan Produk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
