"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Plus, Trash2, Globe, FileText, Image as ImageIcon, CheckCircle2, Repeat, Key, Sparkles, Layers, X, Upload, MoreVertical, Pencil } from "lucide-react";
import Image from "next/image";

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface ProductVariantItem {
  id: string;
  name: string;
  price: number;
  fileUrl?: string;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categoryId?: number;
  categoryName?: string;
  shortDescription?: string;
  description?: string;
  demoUrl?: string;
  price: number;
  discountPrice?: number | null;
  stockType: "REUSABLE" | "SINGLE_USE";
  stockCount: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  attributes?: {
    variants?: ProductVariantItem[];
    [key: string]: any;
  };
  salesCount: number;
  ratingAvg: number;
  images: Array<{ imageUrl: string }>;
  files: Array<{ fileName: string; fileUrl: string; fileSize?: number }>;
  createdAt?: string;
}

interface FormImageItem {
  id: string;
  file?: File;
  previewUrl: string;
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
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

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
  const [formImages, setFormImages] = useState<FormImageItem[]>([]);
  const [formVariants, setFormVariants] = useState<ProductVariantItem[]>([
    { id: Math.random().toString(36).substring(7), name: "Default", price: 0, fileUrl: "" }
  ]);

  const handleAddVariant = () => {
    setFormVariants((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), name: "", price: 0, fileUrl: "" },
    ]);
  };

  const handleUpdateVariant = (index: number, field: "name" | "price" | "fileUrl", value: any) => {
    setFormVariants((prev) => {
      const updated = [...prev];
      if (field === "price") {
        updated[index] = { ...updated[index], price: Number(value) || 0 };
      } else if (field === "fileUrl") {
        updated[index] = { ...updated[index], fileUrl: String(value || "") };
      } else {
        updated[index] = { ...updated[index], name: String(value || "") };
      }
      return updated;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const previewUrl = URL.createObjectURL(file);
    const newItem: FormImageItem = {
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl,
    };

    setFormImages((prev) => [...prev, newItem]);
    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => {
      const itemToRemove = prev[indexToRemove];
      if (itemToRemove && itemToRemove.file && itemToRemove.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormTitle(prod.title || "");
    setFormPrice(String(prod.price || 0));
    setFormShortDesc(prod.shortDescription || "");
    setFormDesc(prod.description || "");
    setFormStockType(prod.stockType || "REUSABLE");
    setFormStockCount(String(prod.stockCount || 10));
    setFormDemoUrl(prod.demoUrl || "");
    setFormImages(
      (prod.images || []).map((img) => ({
        id: Math.random().toString(36).substring(7),
        previewUrl: img.imageUrl,
      }))
    );
    if (prod.categoryId) {
      setFormCategoryId(String(prod.categoryId));
    } else if (categories.length > 0) {
      setFormCategoryId(String(categories[0].id));
    }

    if (prod.attributes?.variants && Array.isArray(prod.attributes.variants) && prod.attributes.variants.length > 0) {
      setFormVariants(
        prod.attributes.variants.map((v: any) => ({
          id: v.id || Math.random().toString(36).substring(7),
          name: v.name || "Default",
          price: Number(v.price) || 0,
          fileUrl: v.fileUrl || "",
        }))
      );
    } else {
      setFormVariants([
        {
          id: Math.random().toString(36).substring(7),
          name: "Default",
          price: Number(prod.price) || 0,
          fileUrl: prod.files?.[0]?.fileUrl || "",
        },
      ]);
    }

    // Delay opening dialog slightly so Radix DropdownMenu releases pointer-events lock
    setTimeout(() => {
      document.body.style.pointerEvents = "";
      setShowAddDialog(true);
    }, 50);
  };

  const isFormValid = useMemo(() => {
    if (!formTitle.trim() || formTitle.trim().length < 3) return false;
    if (!formCategoryId) return false;
    if (!formDesc.trim() || formDesc.length > 10000) return false;
    if (formImages.length === 0) return false;
    if (formVariants.length === 0) return false;

    for (const v of formVariants) {
      if (!v.name || !v.name.trim()) return false;
      if (
        v.price === undefined ||
        v.price === null ||
        String(v.price).trim() === "" ||
        isNaN(Number(v.price)) ||
        Number(v.price) < 0
      ) return false;
      if (formStockType === "REUSABLE" && (!v.fileUrl || !v.fileUrl.trim())) return false;
    }

    if (formStockType === "SINGLE_USE" && !editingProduct) {
      const singleUseLines = formLicenseKeysText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (singleUseLines.length === 0) return false;
    }

    return true;
  }, [
    formTitle,
    formCategoryId,
    formDesc,
    formImages,
    formVariants,
    formStockType,
    formLicenseKeysText,
    editingProduct,
  ]);

  const handleCreateProduct = async () => {
    if (!user) return;

    const isEditMode = Boolean(editingProduct);

    if (!formTitle.trim() || formTitle.trim().length < 3) {
      toast({ variant: "destructive", title: "Judul Produk Wajib Diisi", description: "Masukkan judul produk minimal 3 karakter." });
      return;
    }

    if (!formCategoryId) {
      toast({ variant: "destructive", title: "Pilih Kategori", description: "Pilih kategori produk terlebih dahulu." });
      return;
    }

    if (!formDesc.trim()) {
      toast({
        variant: "destructive",
        title: "Deskripsi Produk Wajib Diisi",
        description: "Tuliskan deskripsi penjelasan produk digital Anda (maksimal 10.000 karakter).",
      });
      return;
    }

    if (formImages.length === 0) {
      toast({
        variant: "destructive",
        title: "Foto Produk Wajib Unggah",
        description: "Unggah setidaknya 1 foto produk digital Anda.",
      });
      return;
    }

    if (formVariants.length === 0) {
      toast({
        variant: "destructive",
        title: "Varian Produk Wajib Diisi",
        description: "Minimal 1 varian produk harus ditambahkan.",
      });
      return;
    }

    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.name || !v.name.trim()) {
        toast({
          variant: "destructive",
          title: "Nama Varian Wajib Diisi",
          description: `Masukkan nama varian untuk Varian #${i + 1}.`,
        });
        return;
      }
      if (v.price === undefined || v.price === null || String(v.price).trim() === "" || isNaN(Number(v.price)) || Number(v.price) < 0) {
        toast({
          variant: "destructive",
          title: "Harga Varian Wajib Diisi",
          description: `Masukkan harga yang valid untuk Varian #${i + 1} ("${v.name || "Default"}").`,
        });
        return;
      }
      if (formStockType === "REUSABLE" && (!v.fileUrl || !v.fileUrl.trim())) {
        toast({
          variant: "destructive",
          title: "URL Link Digital Wajib Diisi",
          description: `Masukkan URL link file/data digital untuk Varian #${i + 1} ("${v.name}").`,
        });
        return;
      }
    }

    const singleUseLines = formLicenseKeysText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (formStockType === "SINGLE_USE" && singleUseLines.length === 0 && !editingProduct) {
      toast({
        variant: "destructive",
        title: "Stok Akun Wajib Diisi",
        description: "Masukkan setidaknya 1 baris akun/lisensi di kolom Single Use.",
      });
      return;
    }

    const validVariants = formVariants
      .filter((v) => v.name.trim().length > 0 && v.price >= 0)
      .map((v) => ({
        id: v.id,
        name: v.name.trim(),
        price: Number(v.price),
        fileUrl: (v.fileUrl || "").trim(),
      }));

    if (validVariants.length === 0) {
      toast({
        variant: "destructive",
        title: "Varian Produk Wajib Diisi",
        description: "Minimal 1 varian produk harus diisi dengan nama dan harga.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload new image files to R2 if any File object exists
      const uploadedUrls: string[] = [];
      for (const imgItem of formImages) {
        if (imgItem.file) {
          const formData = new FormData();
          formData.append("file", imgItem.file);
          formData.append("type", "products");

          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.url) {
            throw new Error(uploadData.error || "Gagal mengunggah foto produk.");
          }
          uploadedUrls.push(uploadData.url);
        } else {
          uploadedUrls.push(imgItem.previewUrl);
        }
      }

      const url = "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const variantFiles = validVariants
        .filter((v) => v.fileUrl && v.fileUrl.length > 0)
        .map((v) => ({ fileName: `${v.name}.zip`, fileUrl: v.fileUrl }));

      const payload: any = {
        shopId: user.uid,
        categoryId: Number(formCategoryId),
        title: formTitle.trim(),
        price: validVariants[0]?.price || 0,
        shortDescription: formShortDesc.trim(),
        description: formDesc.trim(),
        stockType: formStockType,
        stockCount: formStockType === "SINGLE_USE" ? (singleUseLines.length || Number(formStockCount) || 0) : (Number(formStockCount) || 9999),
        demoUrl: formDemoUrl.trim(),
        images: uploadedUrls.length > 0 ? uploadedUrls : ["https://cdn.marketpoint.id/marketpoint.png"],
        files: formStockType === "REUSABLE" ? variantFiles : [],
        licenseKeys: formStockType === "SINGLE_USE" && singleUseLines.length > 0 ? singleUseLines : undefined,
        attributes: {
          ...(editingProduct?.attributes || {}),
          variants: validVariants,
        },
      };

      if (isEditMode && editingProduct) {
        payload.id = editingProduct.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Gagal ${isEditMode ? "memperbarui" : "menambahkan"} produk.`);
      }

      toast({
        title: isEditMode ? "Produk Berhasil Diperbarui!" : "Produk Berhasil Dibuat!",
        description: `Produk "${formTitle}" telah tersimpan.`,
      });

      setShowAddDialog(false);
      resetForm();
      fetchProducts(user.uid);
    } catch (err: any) {
      toast({ variant: "destructive", title: isEditMode ? "Gagal Update Produk" : "Gagal Membuat Produk", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (product: ProductItem) => {
    setTimeout(() => {
      document.body.style.pointerEvents = "";
      setProductToDelete(product);
    }, 50);
  };

  const handleConfirmDelete = async () => {
    if (!user || !productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const res = await fetch(`/api/products?id=${productToDelete.id}&shopId=${user.uid}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Produk Berhasil Dihapus", description: `Produk "${productToDelete.title}" telah berhasil dihapus permanen.` });
        setProductToDelete(null);
        fetchProducts(user.uid);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus produk.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Hapus Produk", description: err.message });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const resetForm = () => {
    formImages.forEach((img) => {
      if (img.file && img.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setEditingProduct(null);
    setFormTitle("");
    setFormPrice("");
    setFormShortDesc("");
    setFormDesc("");
    setFormStockType("REUSABLE");
    setFormStockCount("10");
    setFormLicenseKeysText("");
    setFormDemoUrl("");
    setFormImages([]);
    setFormVariants([
      { id: Math.random().toString(36).substring(7), name: "Default", price: 0, fileUrl: "" }
    ]);
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
              <Plus className="w-4 h-4" /> Tambah Produk
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl border-border p-1">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleEditProduct(product);
                              }}
                              className="text-xs font-bold gap-2 cursor-pointer py-2 focus:bg-muted"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                              Edit Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleOpenDeleteDialog(product);
                              }}
                              className="text-xs font-bold gap-2 cursor-pointer py-2 focus:bg-red-50 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Produk
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

      </div>

      {/* Modal Dialog Tambah / Edit Produk Digital */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowAddDialog(open);
      }}>
        <DialogContent className="max-w-md md:max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#212121]">
              {editingProduct ? "Edit Produk Digital" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Isi informasi produk digital Anda untuk disimpan di database MarketPoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Judul Produk <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Contoh: Source Code Website Top Up Game Next.js"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-10 rounded-xl text-xs font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">Kategori Produk <span className="text-red-500">*</span></Label>
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

            {/* Deskripsi Produk (Maksimal 10.000 Karakter) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground">Deskripsi Produk <span className="text-red-500">*</span></Label>
                <span className={cn("text-[10px] font-bold", formDesc.length > 10000 ? "text-red-600" : "text-muted-foreground")}>
                  {formDesc.length}/10.000 Karakter
                </span>
              </div>
              <Textarea
                placeholder="Tuliskan deskripsi lengkap fitur, keunggulan, dan instruksi penggunaan produk digital Anda di sini..."
                value={formDesc}
                maxLength={10000}
                onChange={(e) => setFormDesc(e.target.value)}
                className="min-h-[110px] rounded-xl text-xs font-medium bg-muted/20 resize-y leading-relaxed"
              />
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
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground">Foto Produk (Maksimal 3 Foto) <span className="text-red-500">*</span></Label>
                <span className="text-[10px] font-bold text-muted-foreground">{formImages.length}/3 Foto</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {formImages.map((img, idx) => (
                  <div key={img.id || idx} className="relative h-20 rounded-xl overflow-hidden border border-border group bg-muted shadow-sm">
                    <Image src={img.previewUrl} alt={`Foto ${idx + 1}`} fill className="object-cover" />
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
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground">Pilih Foto</span>
                  </label>
                )}
              </div>
            </div>

            {/* Fitur Varian Produk (Wajib Minimal 1 Varian) */}
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-[#212121] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00AA5B]" /> Varian Produk <span className="text-red-500">*</span>
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-[#00AA5B]/40 text-[#00AA5B] hover:bg-[#00AA5B]/10 gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Tambah Varian
                </Button>
              </div>

              {formVariants.length > 0 && (
                <div className="space-y-2.5">
                  {formVariants.map((variant, idx) => (
                    <div key={variant.id || idx} className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-2.5 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-[#00AA5B] bg-[#00AA5B]/10 px-2 py-0.5 rounded-md">
                          Varian #{idx + 1}
                        </span>
                        {formVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveVariant(idx)}
                            className="h-6 w-6 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">Nama Varian <span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="Contoh: Default / 1 Bulan / License Pro"
                            value={variant.name}
                            onChange={(e) => handleUpdateVariant(idx, "name", e.target.value)}
                            className="h-9 rounded-xl text-xs font-medium bg-white border-border"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">Harga Varian (Rp) <span className="text-red-500">*</span></Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Rp</span>
                            <Input
                              type="number"
                              placeholder="50000"
                              value={variant.price || ""}
                              onChange={(e) => handleUpdateVariant(idx, "price", e.target.value)}
                              className="h-9 pl-8 rounded-xl text-xs font-bold bg-white border-border"
                            />
                          </div>
                        </div>
                      </div>

                      {formStockType === "REUSABLE" && (
                        <div className="space-y-1 pt-1.5 border-t border-border/50">
                          <Label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#00AA5B]" /> URL Link File / Data Digital Varian <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="https://cdn.marketpoint.id/files/varian-1bulan.zip"
                            value={variant.fileUrl || ""}
                            onChange={(e) => handleUpdateVariant(idx, "fileUrl", e.target.value)}
                            className="h-9 rounded-xl text-xs font-medium bg-white border-border"
                          />
                          <p className="text-[9px] text-muted-foreground font-medium">
                            Link file digital ini akan diberikan otomatis kepada pembeli varian ini.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formStockType === "SINGLE_USE" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground">Daftar Akun / Lisensi (1 Baris = 1 Stok)</Label>
                  <Badge variant="outline" className="text-[10px] font-bold text-[#00AA5B] border-[#00AA5B]/30">
                    {formLicenseKeysText.split("\n").map(l => l.trim()).filter(Boolean).length} Stok
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
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl text-xs font-bold">
              Batal
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={isSubmitting || !isFormValid}
              className="rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Produk */}
      <Dialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingProduct) setProductToDelete(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-black text-[#212121]">
              Hapus Produk Digital?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus produk <span className="font-bold text-[#212121]">"{productToDelete?.title}"</span>? Gambar produk di storage R2 juga akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4 border-t mt-3">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={isDeletingProduct}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeletingProduct}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 shadow-sm"
            >
              {isDeletingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Hapus Produk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
