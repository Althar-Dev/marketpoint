"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Percent,
  Coins,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Calculator,
  Layers,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DigiFlazzMarkupConfig,
  DEFAULT_MARKUP_CONFIG,
  MarkupRule,
  calculateMarkupPrice,
} from "@/lib/markup-calc";
import { cn } from "@/lib/utils";

export default function DigiFlazzMarkupPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("global");

  const [config, setConfig] = useState<DigiFlazzMarkupConfig>(DEFAULT_MARKUP_CONFIG);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ brand: string; category: string; count: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sampleCalculations, setSampleCalculations] = useState<any[]>([]);

  // Category markup form state
  const [selectedCatToAdd, setSelectedCatToAdd] = useState("");
  const [catRuleType, setCatRuleType] = useState<"fixed" | "percent">("percent");
  const [catRuleValue, setCatRuleValue] = useState<number>(5);

  // Brand markup form state
  const [selectedBrandToAdd, setSelectedBrandToAdd] = useState("");
  const [brandRuleType, setBrandRuleType] = useState<"fixed" | "percent">("percent");
  const [brandRuleValue, setBrandRuleValue] = useState<number>(5);
  const [brandSearch, setBrandSearch] = useState("");

  // Product markup form state
  const [productFilterCat, setProductFilterCat] = useState("");
  const [productFilterBrand, setProductFilterBrand] = useState("");
  const [selectedProductSku, setSelectedProductSku] = useState("");
  const [productRuleType, setProductRuleType] = useState<"fixed" | "percent">("fixed");
  const [productRuleValue, setProductRuleValue] = useState<number>(1500);
  const [productSearch, setProductSearch] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Status filters for viewing and selecting items that are belum dimarkup vs sudah dimarkup
  const [brandSelectFilter, setBrandSelectFilter] = useState<"all" | "unmarked" | "marked">("all");
  const [productSelectFilter, setProductSelectFilter] = useState<"all" | "unmarked" | "marked">("all");
  const [productViewTab, setProductViewTab] = useState<"marked" | "unmarked" | "all">("marked");

  // Live simulation test
  const [simBasePrice, setSimBasePrice] = useState<number>(50000);
  const [simCategory, setSimCategory] = useState<string>("");
  const [simBrand, setSimBrand] = useState<string>("");
  const [simProductSku, setSimProductSku] = useState<string>("");

  useEffect(() => {
    fetchMarkupConfig();
  }, []);

  // Debounced product search & category/brand filter
  useEffect(() => {
    let active = true;
    const fetchFilteredProducts = async () => {
      setIsSearchingProduct(true);
      try {
        const params = new URLSearchParams();
        if (productFilterCat) params.set("category", productFilterCat);
        if (productFilterBrand) params.set("brand", productFilterBrand);
        if (productSearch.trim()) params.set("search", productSearch.trim());

        const res = await fetch(`/api/admin/digiflazz/markup?${params.toString()}`);
        const data = await res.json();
        if (active && data.success && Array.isArray(data.products)) {
          setProductSearchResults(data.products);
        }
      } catch (e) {
        console.error("Gagal mencari produk:", e);
      } finally {
        if (active) setIsSearchingProduct(false);
      }
    };

    const timer = setTimeout(fetchFilteredProducts, productSearch ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productFilterCat, productFilterBrand, productSearch]);

  const fetchMarkupConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/digiflazz/markup");
      const data = await res.json();
      if (data.success) {
        setConfig(data.config || DEFAULT_MARKUP_CONFIG);
        setCategories(Array.from(new Set<string>(data.categories || [])));
        setBrands(data.brands || []);
        setProducts(data.products || []);
        setSampleCalculations(data.sampleCalculations || []);
      } else {
        toast({
          title: "Gagal memuat pengaturan",
          description: data.error || "Terjadi kesalahan saat memuat markup",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Gagal memuat markup:", err);
      toast({
        title: "Koneksi Gagal",
        description: "Tidak dapat terhubung ke server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (customConfig?: DigiFlazzMarkupConfig) => {
    const configToSave =
      customConfig && typeof customConfig === "object" && "global" in customConfig
        ? customConfig
        : config;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/digiflazz/markup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: configToSave }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Berhasil Disimpan & Aktif",
          description: "Aturan markup harga DigiFlazz telah disimpan dan langsung aktif di katalog.",
        });
        setConfig(configToSave);
      } else {
        toast({
          title: "Gagal Menyimpan",
          description: data.error || "Gagal menyimpan konfigurasi",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Kesalahan",
        description: err.message || "Gagal menghubungi server",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (typeof window !== "undefined") {
      const confirmReset = window.confirm(
        "Peringatan: Apakah Anda yakin ingin menghapus seluruh aturan markup (Global, Kategori, Brand, dan Produk) dan mengembalikan ke setelan default?"
      );
      if (!confirmReset) return;
    }
    setConfig(DEFAULT_MARKUP_CONFIG);
    handleSave(DEFAULT_MARKUP_CONFIG);
  };

  // Add / Remove Category Markup
  const handleAddCategoryRule = () => {
    if (!selectedCatToAdd) return;
    const newConfig: DigiFlazzMarkupConfig = {
      ...config,
      categories: {
        ...(config.categories || {}),
        [selectedCatToAdd]: {
          type: catRuleType,
          value: Number(catRuleValue) || 0,
        },
      },
    };
    setConfig(newConfig);
    handleSave(newConfig);
    setSelectedCatToAdd("");
  };

  const handleRemoveCategoryRule = (catKey: string) => {
    const updated = { ...(config.categories || {}) };
    delete updated[catKey];
    const newConfig: DigiFlazzMarkupConfig = { ...config, categories: updated };
    setConfig(newConfig);
    handleSave(newConfig);
  };

  // Add / Remove Brand Markup
  const handleAddBrandRule = () => {
    if (!selectedBrandToAdd) return;
    const newConfig: DigiFlazzMarkupConfig = {
      ...config,
      brands: {
        ...(config.brands || {}),
        [selectedBrandToAdd]: {
          type: brandRuleType,
          value: Number(brandRuleValue) || 0,
        },
      },
    };
    setConfig(newConfig);
    handleSave(newConfig);
    setSelectedBrandToAdd("");
  };

  const handleRemoveBrandRule = (brandKey: string) => {
    const updated = { ...(config.brands || {}) };
    delete updated[brandKey];
    const newConfig: DigiFlazzMarkupConfig = { ...config, brands: updated };
    setConfig(newConfig);
    handleSave(newConfig);
  };

  // Brands filtered for product tab
  const brandsForProductFilter = useMemo(() => {
    let list = brands;
    if (productFilterCat) {
      list = brands.filter(
        (b) => b.category && b.category.toLowerCase() === productFilterCat.toLowerCase()
      );
    }
    const uniqueMap = new Map<string, { brand: string; category: string; count: number }>();
    list.forEach((b) => {
      if (b.brand && !uniqueMap.has(b.brand.toLowerCase())) {
        uniqueMap.set(b.brand.toLowerCase(), b);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.brand.localeCompare(b.brand));
  }, [brands, productFilterCat]);

  // Add / Remove Product (SKU) Markup
  const availableProductsForSelect = useMemo(() => {
    if (productSearch.trim() || productFilterCat || productFilterBrand) {
      return productSearchResults;
    }
    return products;
  }, [productSearch, productFilterCat, productFilterBrand, productSearchResults, products]);

  // Counts of marked vs unmarked products in the current selection pool
  const { markedSelectCount, unmarkedSelectCount } = useMemo(() => {
    let marked = 0;
    let unmarked = 0;
    availableProductsForSelect.forEach((p) => {
      if (config.products?.[p.buyer_sku_code]) {
        marked++;
      } else {
        unmarked++;
      }
    });
    return { markedSelectCount: marked, unmarkedSelectCount: unmarked };
  }, [availableProductsForSelect, config.products]);

  // Filtered products list for Select dropdown according to status filter
  const displayedProductsForSelect = useMemo(() => {
    if (productSelectFilter === "marked") {
      return availableProductsForSelect.filter((p) => Boolean(config.products?.[p.buyer_sku_code]));
    }
    if (productSelectFilter === "unmarked") {
      return availableProductsForSelect.filter((p) => !config.products?.[p.buyer_sku_code]);
    }
    return availableProductsForSelect;
  }, [availableProductsForSelect, productSelectFilter, config.products]);

  // Unmarked products list for bottom grid view
  const unmarkedProductsList = useMemo(() => {
    return availableProductsForSelect.filter((p) => !config.products?.[p.buyer_sku_code]);
  }, [availableProductsForSelect, config.products]);

  const selectedProductDetail = useMemo(() => {
    if (!selectedProductSku) return null;
    return (
      availableProductsForSelect.find((p) => p.buyer_sku_code === selectedProductSku) ||
      products.find((p) => p.buyer_sku_code === selectedProductSku) ||
      null
    );
  }, [selectedProductSku, availableProductsForSelect, products]);

  const selectedProductRule = useMemo(() => {
    if (!selectedProductSku) return null;
    return config.products?.[selectedProductSku] || null;
  }, [selectedProductSku, config.products]);

  const selectedProductCalc = useMemo(() => {
    if (!selectedProductDetail) return null;
    const base = selectedProductDetail.price || selectedProductDetail.admin || 0;
    return calculateMarkupPrice(
      base,
      selectedProductDetail.category || productFilterCat,
      selectedProductDetail.brand || productFilterBrand,
      config,
      selectedProductDetail.buyer_sku_code
    );
  }, [selectedProductDetail, productFilterCat, productFilterBrand, config]);

  // Metadata map to quickly look up category, brand, and base price for active rules
  const productMetaMap = useMemo(() => {
    const map = new Map<string, { brand?: string; category?: string; name?: string; price?: number }>();
    products.forEach((p) => {
      if (p.buyer_sku_code) {
        map.set(p.buyer_sku_code, {
          brand: p.brand,
          category: p.category,
          name: p.product_name,
          price: p.price || p.admin || 0,
        });
      }
    });
    productSearchResults.forEach((p) => {
      if (p.buyer_sku_code && !map.has(p.buyer_sku_code)) {
        map.set(p.buyer_sku_code, {
          brand: p.brand,
          category: p.category,
          name: p.product_name,
          price: p.price || p.admin || 0,
        });
      }
    });
    return map;
  }, [products, productSearchResults]);

  // Active product rules filtered by category/brand filter if selected
  const filteredActiveProductRules = useMemo(() => {
    const entries = Object.entries(config.products || {});
    return entries.filter(([skuKey, rule]) => {
      const meta = productMetaMap.get(skuKey);
      const itemBrand = (rule.brand || meta?.brand || "").toLowerCase().trim();
      const itemCat = (rule.category || meta?.category || "").toLowerCase().trim();
      const itemName = (rule.product_name || meta?.name || "").toLowerCase().trim();

      if (productFilterCat && productFilterCat !== "ALL") {
        const catFilter = productFilterCat.toLowerCase().trim();
        if (itemCat && itemCat !== catFilter) {
          return false;
        }
      }

      if (productFilterBrand && productFilterBrand !== "ALL") {
        const brandFilter = productFilterBrand.toLowerCase().trim();
        if (itemBrand) {
          if (itemBrand !== brandFilter) return false;
        } else if (!itemName.includes(brandFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [config.products, productMetaMap, productFilterCat, productFilterBrand]);

  // Helper to determine markup status of a category
  const getCategoryMarkupStatus = (cat: string) => {
    if (!cat || cat === "ALL") return null;
    const catRule = config.categories?.[cat];
    if (catRule && catRule.value > 0) {
      return {
        isMarked: true,
        label: `✓ Sudah Dimarkup (${catRule.type === "percent" ? `+${catRule.value}%` : `+Rp ${catRule.value.toLocaleString("id-ID")}`})`,
        shortLabel: "✓ Sudah Dimarkup",
        type: "category" as const,
        rule: catRule,
      };
    }

    const brandsInCat = brands.filter(
      (b) => b.category && b.category.toLowerCase() === cat.toLowerCase()
    );
    const markedBrands = brandsInCat.filter(
      (b) => config.brands?.[b.brand] && config.brands[b.brand].value > 0
    );

    if (brandsInCat.length > 0 && markedBrands.length === brandsInCat.length) {
      return {
        isMarked: true,
        label: `✓ Semua Brand Dimarkup (${markedBrands.length})`,
        shortLabel: "✓ Semua Brand Dimarkup",
        type: "all_brands" as const,
      };
    }

    if (markedBrands.length > 0) {
      return {
        isMarked: true,
        label: `✓ ${markedBrands.length}/${brandsInCat.length} Brand Dimarkup`,
        shortLabel: `✓ ${markedBrands.length}/${brandsInCat.length} Brand`,
        type: "partial_brands" as const,
      };
    }

    const globalVal = config.global?.type === "percent" ? `+${config.global?.value}%` : `+Rp ${config.global?.value?.toLocaleString("id-ID")}`;
    return {
      isMarked: false,
      label: `Belum Dimarkup (Ikut Global ${globalVal})`,
      shortLabel: "Belum Dimarkup",
      sublabel: `Ikut Global (${globalVal})`,
      type: "global" as const,
    };
  };

  // Helper to determine markup status of a brand
  const getBrandMarkupStatus = (brandName: string, categoryName?: string) => {
    if (!brandName || brandName === "ALL") return null;

    const brandRule = config.brands?.[brandName];
    if (brandRule && brandRule.value > 0) {
      return {
        isMarked: true,
        label: `✓ Sudah Dimarkup (${brandRule.type === "percent" ? `+${brandRule.value}%` : `+Rp ${brandRule.value.toLocaleString("id-ID")}`})`,
        shortLabel: "✓ Sudah Dimarkup",
        type: "brand" as const,
        rule: brandRule,
      };
    }

    const cat = categoryName || productFilterCat || brands.find((b) => b.brand.toLowerCase() === brandName.toLowerCase())?.category;
    if (cat) {
      const catRule = config.categories?.[cat];
      if (catRule && catRule.value > 0) {
        return {
          isMarked: true,
          label: `✓ Ikut Kategori (${catRule.type === "percent" ? `+${catRule.value}%` : `+Rp ${catRule.value.toLocaleString("id-ID")}`})`,
          shortLabel: "✓ Ikut Kategori",
          type: "category_inherited" as const,
          rule: catRule,
        };
      }
    }

    const skuRulesForBrand = Object.entries(config.products || {}).filter(([sku, r]) => {
      const meta = productMetaMap.get(sku);
      const bName = (r.brand || meta?.brand || "").toLowerCase().trim();
      return bName === brandName.toLowerCase().trim() && r.value > 0;
    });

    if (skuRulesForBrand.length > 0) {
      return {
        isMarked: true,
        label: `✓ ${skuRulesForBrand.length} Produk Dimarkup`,
        shortLabel: `✓ ${skuRulesForBrand.length} Produk`,
        type: "partial_products" as const,
      };
    }

    const globalVal = config.global?.type === "percent" ? `+${config.global?.value}%` : `+Rp ${config.global?.value?.toLocaleString("id-ID")}`;
    return {
      isMarked: false,
      label: `Belum Dimarkup (Ikut Global ${globalVal})`,
      shortLabel: "Belum Dimarkup",
      sublabel: `Ikut Global (${globalVal})`,
      type: "global" as const,
    };
  };

  const handleSelectProduct = (sku: string) => {
    setSelectedProductSku(sku);
    const existing = config.products?.[sku];
    if (existing) {
      setProductRuleType(existing.type);
      setProductRuleValue(existing.value);
    }
  };

  const handleAddProductRule = () => {
    if (!selectedProductSku) return;

    if (selectedProductSku === "ALL_BRAND" && productFilterBrand) {
      const newConfig: DigiFlazzMarkupConfig = {
        ...config,
        brands: {
          ...(config.brands || {}),
          [productFilterBrand]: {
            type: productRuleType,
            value: Number(productRuleValue) || 0,
          },
        },
      };
      setConfig(newConfig);
      handleSave(newConfig);
      setSelectedProductSku("");
      return;
    }

    const found =
      availableProductsForSelect.find((p) => p.buyer_sku_code === selectedProductSku) ||
      products.find((p) => p.buyer_sku_code === selectedProductSku);

    const newConfig: DigiFlazzMarkupConfig = {
      ...config,
      products: {
        ...(config.products || {}),
        [selectedProductSku]: {
          type: productRuleType,
          value: Number(productRuleValue) || 0,
          product_name: found?.product_name || selectedProductSku,
          category: found?.category || productFilterCat || "",
          brand: found?.brand || productFilterBrand || "",
        },
      },
    };
    setConfig(newConfig);
    handleSave(newConfig);
    setSelectedProductSku("");
  };

  const handleRemoveProductRule = (skuKey: string) => {
    const updated = { ...(config.products || {}) };
    delete updated[skuKey];
    const newConfig: DigiFlazzMarkupConfig = { ...config, products: updated };
    setConfig(newConfig);
    handleSave(newConfig);
  };

  // Simulation calculation
  const simResult = useMemo(() => {
    return calculateMarkupPrice(simBasePrice, simCategory, simBrand, config, simProductSku);
  }, [simBasePrice, simCategory, simBrand, config, simProductSku]);

  // Deduplicated unique brands list aggregating counts across categories
  const uniqueBrands = useMemo(() => {
    const map = new Map<string, { brand: string; count: number }>();
    brands.forEach((b) => {
      if (!b.brand) return;
      const key = b.brand.trim();
      if (!key) return;
      const lower = key.toLowerCase();
      const existing = map.get(lower);
      if (existing) {
        existing.count += b.count || 0;
      } else {
        map.set(lower, { brand: key, count: b.count || 0 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.brand.localeCompare(b.brand));
  }, [brands]);

  // Brand counts: marked vs unmarked
  const { markedBrandCount, unmarkedBrandCount } = useMemo(() => {
    let marked = 0;
    let unmarked = 0;
    uniqueBrands.forEach((b) => {
      if (getBrandMarkupStatus(b.brand)?.isMarked) {
        marked++;
      } else {
        unmarked++;
      }
    });
    return { markedBrandCount: marked, unmarkedBrandCount: unmarked };
  }, [uniqueBrands, config, productMetaMap]);

  const filteredBrandsForSelect = useMemo(() => {
    let list = uniqueBrands;
    if (brandSearch) {
      list = list.filter((b) => b.brand.toLowerCase().includes(brandSearch.toLowerCase()));
    }
    if (brandSelectFilter === "marked") {
      list = list.filter((b) => getBrandMarkupStatus(b.brand)?.isMarked);
    } else if (brandSelectFilter === "unmarked") {
      list = list.filter((b) => !getBrandMarkupStatus(b.brand)?.isMarked);
    }
    return list.slice(0, 60);
  }, [uniqueBrands, brandSearch, brandSelectFilter, config, productMetaMap]);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-6 w-48 sm:w-60 rounded-md" />
            <Skeleton className="h-3.5 w-72 sm:w-80 rounded-md max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 sm:h-9 w-24 rounded-lg" />
            <Skeleton className="h-8 sm:h-9 w-32 rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-9 sm:h-10 w-full sm:w-[420px] rounded-xl" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 rounded-2xl border border-border bg-white p-4 sm:p-6 space-y-4">
            <Skeleton className="h-4 w-40 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-9 sm:h-10 w-full max-w-sm rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00AA5B] shrink-0" />
            Markup Harga DigiFlazz
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Atur margin keuntungan platform untuk seluruh produk DigiFlazz secara global, per kategori, maupun per brand.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={saving}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-semibold text-xs shadow-xs"
          >
            {saving ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="bg-slate-100/90 p-1 rounded-xl h-auto border border-border w-full flex overflow-x-auto no-scrollbar sm:inline-grid sm:grid-cols-5 sm:w-auto">
          <TabsTrigger
            value="global"
            className="rounded-lg text-[11px] sm:text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-2xs py-1.5 px-3 whitespace-nowrap flex-1 sm:flex-initial"
          >
            <span className="hidden sm:inline">Aturan </span>Global
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="rounded-lg text-[11px] sm:text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-2xs py-1.5 px-3 whitespace-nowrap flex-1 sm:flex-initial"
          >
            Kategori ({Object.keys(config.categories || {}).length})
          </TabsTrigger>
          <TabsTrigger
            value="brands"
            className="rounded-lg text-[11px] sm:text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-2xs py-1.5 px-3 whitespace-nowrap flex-1 sm:flex-initial"
          >
            Brand ({Object.keys(config.brands || {}).length})
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="rounded-lg text-[11px] sm:text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-2xs py-1.5 px-3 whitespace-nowrap flex-1 sm:flex-initial"
          >
            Produk ({Object.keys(config.products || {}).length})
          </TabsTrigger>
          <TabsTrigger
            value="simulator"
            className="rounded-lg text-[11px] sm:text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-2xs py-1.5 px-3 whitespace-nowrap flex-1 sm:flex-initial"
          >
            Simulasi<span className="hidden sm:inline"> & Kalkulator</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ATURAN GLOBAL */}
        <TabsContent value="global" className="space-y-4 sm:space-y-6 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="md:col-span-2 rounded-2xl border-border bg-white shadow-xs">
              <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
                <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00AA5B]" />
                  Keuntungan Standar (Global Markup)
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Aturan ini otomatis diterapkan pada seluruh produk jika tidak ada aturan khusus per kategori atau brand.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
                {/* Tipe Markup */}
                <div className="space-y-2">
                  <Label className="text-[11px] sm:text-xs font-semibold text-slate-700">Tipe Perhitungan Markup</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, global: { ...prev.global, type: "percent" } }))}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3 transition-all ${
                        config.global?.type === "percent"
                          ? "border-[#00AA5B] bg-green-50/40 ring-1 ring-[#00AA5B]/30"
                          : "border-border hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 text-[#00AA5B] flex items-center justify-center shrink-0">
                        <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-800">Persentase (%)</div>
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Margin proporsional dari harga modal (misal: 3%, 5%).
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, global: { ...prev.global, type: "fixed" } }))}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3 transition-all ${
                        config.global?.type === "fixed"
                          ? "border-[#00AA5B] bg-green-50/40 ring-1 ring-[#00AA5B]/30"
                          : "border-border hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-800">Nominal Tetap (Rp)</div>
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Nominal rupiah tetap di atas modal (misal: Rp 1.500).
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Nilai Markup */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-[11px] sm:text-xs font-semibold text-slate-700">
                    Besaran Markup {config.global?.type === "percent" ? "(Persen %)" : "(Rupiah Rp)"}
                  </Label>
                  <div className="relative max-w-sm">
                    <Input
                      type="number"
                      min="0"
                      value={config.global?.value || 0}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          global: { ...prev.global, value: Number(e.target.value) || 0 },
                        }))
                      }
                      className="h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold pl-3 pr-10 border-border focus:border-[#00AA5B]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {config.global?.type === "percent" ? "%" : "Rp"}
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                    Contoh: Jika modal Rp 10.000 dengan markup {config.global?.type === "percent" ? `${config.global.value}%` : `Rp ${config.global?.value?.toLocaleString("id-ID")}`}, maka harga jual menjadi{" "}
                    <span className="font-bold text-[#00AA5B]">
                      Rp{" "}
                      {config.global?.type === "percent"
                        ? Math.round(10000 + (10000 * (config.global?.value || 0)) / 100).toLocaleString("id-ID")
                        : (10000 + (config.global?.value || 0)).toLocaleString("id-ID")}
                    </span>
                  </p>
                </div>

                {/* Aturan Pembulatan */}
                <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-border/60">
                  <Label className="text-[11px] sm:text-xs font-semibold text-slate-700">Pembulatan Harga Jual</Label>
                  <Select
                    value={config.rounding || "up_100"}
                    onValueChange={(val: any) => setConfig((prev) => ({ ...prev, rounding: val }))}
                  >
                    <SelectTrigger className="h-9 sm:h-10 rounded-xl bg-slate-50 border-border font-medium text-xs max-w-md">
                      <SelectValue placeholder="Pilih Pembulatan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none" className="text-xs font-medium py-1.5">
                        Tidak Ada Pembulatan (Harga Eksak)
                      </SelectItem>
                      <SelectItem value="up_100" className="text-xs font-medium py-1.5">
                        Bulatkan ke atas kelipatan Rp 100 (Rp 10.123 ➔ Rp 10.200) - Disarankan
                      </SelectItem>
                      <SelectItem value="up_500" className="text-xs font-medium py-1.5">
                        Bulatkan ke atas kelipatan Rp 500 (Rp 10.123 ➔ Rp 10.500)
                      </SelectItem>
                      <SelectItem value="up_1000" className="text-xs font-medium py-1.5">
                        Bulatkan ke atas kelipatan Rp 1.000 (Rp 10.123 ➔ Rp 11.000)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">
                    Pembulatan otomatis ke atas mempermudah pembayaran pelanggan dan mencegah angka pecahan ganjil.
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Hierarchy Info Box */}
            <div className="space-y-3">
              <Card className="rounded-2xl border-border bg-slate-50/70 shadow-xs">
                <CardHeader className="p-3.5 sm:p-4 pb-2">
                  <CardTitle className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-[#00AA5B]" />
                    Prioritas Perhitungan Harga
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 sm:p-4 pt-0 space-y-2 text-xs text-slate-600">
                  <div className="p-2.5 rounded-xl bg-white border border-border space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
                      Markup Khusus Produk (SKU)
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground pl-5.5 leading-snug">
                      Prioritas tertinggi. Berlaku khusus untuk produk/SKU tertentu jika didaftarkan.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-border space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px]">2</span>
                      Markup Khusus Brand
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground pl-5.5 leading-snug">
                      Digunakan jika produk tidak memiliki markup SKU khusus.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-border space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[9px]">3</span>
                      Markup Kategori
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground pl-5.5 leading-snug">
                      Digunakan jika produk tidak memiliki markup SKU maupun brand.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-border space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center text-[9px]">4</span>
                      Markup Global (Fallback)
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground pl-5.5 leading-snug">
                      Digunakan jika produk tidak memiliki aturan khusus lainnya.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MARKUP KATEGORI */}
        <TabsContent value="categories" className="space-y-4 sm:space-y-6 mt-0">
          <Card className="rounded-2xl border-border bg-white shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00AA5B]" />
                Aturan Markup Berdasarkan Kategori
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px]">
                Tentukan keuntungan berbeda untuk setiap kategori produk (misal: Pulsa Rp 1.500, Game 5%, PLN Rp 2.500).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* Add category rule form */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Pilih Kategori</Label>
                  <Select value={selectedCatToAdd} onValueChange={setSelectedCatToAdd}>
                    <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                      <SelectValue placeholder="Pilih Kategori dari Katalog" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {categories.map((cat) => {
                        const status = getCategoryMarkupStatus(cat);
                        return (
                          <SelectItem key={cat} value={cat} className="text-xs font-medium py-1.5 cursor-pointer">
                            <div className="flex items-center justify-between w-full gap-2.5">
                              <span className="font-semibold text-slate-800">{cat}</span>
                              {status?.isMarked ? (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border",
                                  status.type === "category"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}>
                                  {status.label}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border bg-amber-50 text-amber-800 border-amber-300">
                                  {status?.label || "Belum Dimarkup"}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Tipe</Label>
                  <Select value={catRuleType} onValueChange={(val: any) => setCatRuleType(val)}>
                    <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="percent" className="text-xs font-medium">Persentase (%)</SelectItem>
                      <SelectItem value="fixed" className="text-xs font-medium">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Nilai</Label>
                  <Input
                    type="number"
                    min="0"
                    value={catRuleValue}
                    onChange={(e) => setCatRuleValue(Number(e.target.value))}
                    className="h-8 sm:h-9 rounded-lg bg-white border-border text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    onClick={handleAddCategoryRule}
                    disabled={!selectedCatToAdd}
                    className="w-full h-8 sm:h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Active Category Rules List */}
              <div className="space-y-2.5">
                <Label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Markup Kategori Aktif ({Object.keys(config.categories || {}).length})
                </Label>
                {Object.keys(config.categories || {}).length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-border bg-slate-50/50">
                    <p className="text-xs text-muted-foreground">
                      Belum ada aturan khusus kategori. Semua kategori saat ini menggunakan Aturan Global ({config.global?.type === "percent" ? `${config.global.value}%` : `Rp ${config.global?.value?.toLocaleString("id-ID")}`}).
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Object.entries(config.categories).map(([catKey, rule]) => (
                      <div
                        key={catKey}
                        className="p-2.5 sm:p-3 rounded-xl border border-border bg-white shadow-2xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-xs text-slate-800 truncate">{catKey}</div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-[#00AA5B] mt-0.5">
                            {rule.type === "percent" ? `+${rule.value}%` : `+Rp ${rule.value.toLocaleString("id-ID")}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCategoryRule(catKey)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kategori yang Belum Dimarkup */}
              {(() => {
                const unmarkedCats = categories.filter((c) => !config.categories?.[c]);
                if (unmarkedCats.length === 0) return null;
                return (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Label className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Kategori Belum Dimarkup Khusus ({unmarkedCats.length})
                      </Label>
                      <span className="text-[10px] text-muted-foreground">(klik untuk langsung atur)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {unmarkedCats.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCatToAdd(cat)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5",
                            selectedCatToAdd === cat
                              ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-400"
                              : "bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200"
                          )}
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] text-amber-600 font-bold">+ Atur</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MARKUP BRAND */}
        <TabsContent value="brands" className="space-y-4 sm:space-y-6 mt-0">
          <Card className="rounded-2xl border-border bg-white shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00AA5B]" />
                Aturan Markup Khusus Brand
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px]">
                Tentukan margin khusus untuk brand tertentu (misal Mobile Legends, Free Fire, Telkomsel, DANA).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* Add Brand rule form */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Cari & Pilih Brand</Label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBrandSelectFilter("all")}
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[9px] font-bold transition-all",
                          brandSelectFilter === "all"
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandSelectFilter("unmarked")}
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[9px] font-bold transition-all",
                          brandSelectFilter === "unmarked"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                        )}
                      >
                        Belum ({unmarkedBrandCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrandSelectFilter("marked")}
                        className={cn(
                          "px-1.5 py-0.2 rounded text-[9px] font-bold transition-all",
                          brandSelectFilter === "marked"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        Sudah ({markedBrandCount})
                      </button>
                    </div>
                  </div>
                  <Select value={selectedBrandToAdd} onValueChange={setSelectedBrandToAdd}>
                    <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                      <SelectValue placeholder="Pilih Brand dari Katalog" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      <div className="p-1.5 border-b border-border">
                        <Input
                          placeholder="Ketik nama brand..."
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      {filteredBrandsForSelect.length === 0 && (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Tidak ada brand {brandSelectFilter === "unmarked" ? "yang belum dimarkup" : brandSelectFilter === "marked" ? "yang sudah dimarkup" : "ditemukan"}.
                        </div>
                      )}
                      {filteredBrandsForSelect.map((b) => {
                        const status = getBrandMarkupStatus(b.brand);
                        return (
                          <SelectItem key={b.brand} value={b.brand} className="text-xs font-medium py-1.5 cursor-pointer">
                            <div className="flex items-center justify-between w-full gap-2.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-slate-800">{b.brand}</span>
                                <span className="text-[9px] text-muted-foreground">({b.count})</span>
                              </div>
                              {status?.isMarked ? (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border",
                                  status.type === "brand"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : status.type === "category_inherited"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}>
                                  {status.label}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border bg-amber-50 text-amber-800 border-amber-300">
                                  {status?.label || "Belum Dimarkup"}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Tipe</Label>
                  <Select value={brandRuleType} onValueChange={(val: any) => setBrandRuleType(val)}>
                    <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="percent" className="text-xs font-medium">Persentase (%)</SelectItem>
                      <SelectItem value="fixed" className="text-xs font-medium">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Nilai</Label>
                  <Input
                    type="number"
                    min="0"
                    value={brandRuleValue}
                    onChange={(e) => setBrandRuleValue(Number(e.target.value))}
                    className="h-8 sm:h-9 rounded-lg bg-white border-border text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    onClick={handleAddBrandRule}
                    disabled={!selectedBrandToAdd}
                    className="w-full h-8 sm:h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Active Brand Rules List */}
              <div className="space-y-2.5">
                <Label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Markup Brand Aktif ({Object.keys(config.brands || {}).length})
                </Label>
                {Object.keys(config.brands || {}).length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-border bg-slate-50/50">
                    <p className="text-xs text-muted-foreground">
                      Belum ada aturan khusus brand. Semua brand saat ini mengikuti aturan Kategori atau Global.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Object.entries(config.brands).map(([brandKey, rule]) => (
                      <div
                        key={brandKey}
                        className="p-2.5 sm:p-3 rounded-xl border border-border bg-white shadow-2xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-xs text-slate-800 truncate">{brandKey}</div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-[#00AA5B] mt-0.5">
                            {rule.type === "percent" ? `+${rule.value}%` : `+Rp ${rule.value.toLocaleString("id-ID")}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBrandRule(brandKey)}
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MARKUP KHUSUS PRODUK / SKU */}
        <TabsContent value="products" className="space-y-4 sm:space-y-6 mt-0">
          <Card className="rounded-2xl border-border bg-white shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
              <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#00AA5B]" />
                Aturan Markup Khusus Produk (SKU)
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px]">
                Tentukan margin khusus untuk item atau SKU spesifik. Aturan ini memiliki prioritas tertinggi di atas Brand, Kategori, dan Global.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
              {/* Form Tambah Aturan Produk dengan Cascading Filter (Kategori -> Brand -> Produk) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-border/80 space-y-3">
                <div className="text-[11px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#00AA5B]" />
                  <span>Pilih Produk & Tentukan Margin</span>
                </div>

                {/* Filter Kategori & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                        1. Filter Kategori
                      </Label>
                      {productFilterCat && (() => {
                        const status = getCategoryMarkupStatus(productFilterCat);
                        if (status?.isMarked) {
                          return (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              {status.label}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300">
                            {status?.shortLabel || "Belum Dimarkup"}
                          </span>
                        );
                      })()}
                    </div>
                    <Select
                      value={productFilterCat || "ALL"}
                      onValueChange={(val) => {
                        setProductFilterCat(val === "ALL" ? "" : val);
                        setProductFilterBrand("");
                        setSelectedProductSku("");
                      }}
                    >
                      <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                        <SelectValue placeholder="Semua Kategori" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        <SelectItem value="ALL" className="text-xs font-medium">
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>Semua Kategori</span>
                            <span className="text-[9px] text-slate-400 font-normal">
                              Global: {config.global?.type === "percent" ? `+${config.global?.value}%` : `+Rp ${config.global?.value?.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </SelectItem>
                        {categories.map((cat) => {
                          const status = getCategoryMarkupStatus(cat);
                          return (
                            <SelectItem key={cat} value={cat} className="text-xs font-medium py-1.5 cursor-pointer">
                              <div className="flex items-center justify-between w-full gap-2.5">
                                <span className="font-semibold text-slate-800 truncate">{cat}</span>
                                {status?.isMarked ? (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border",
                                    status.type === "category"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  )}>
                                    {status.label}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border bg-amber-50 text-amber-800 border-amber-300">
                                    {status?.label}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700 truncate">
                        2. Filter Brand {productFilterCat ? `(${productFilterCat})` : ""}
                      </Label>
                      {productFilterBrand && (() => {
                        const status = getBrandMarkupStatus(productFilterBrand, productFilterCat);
                        if (status?.isMarked) {
                          return (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shrink-0">
                              {status.label}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300 shrink-0">
                            {status?.shortLabel || "Belum Dimarkup"}
                          </span>
                        );
                      })()}
                    </div>
                    <Select
                      value={productFilterBrand || "ALL"}
                      onValueChange={(val) => {
                        setProductFilterBrand(val === "ALL" ? "" : val);
                        setSelectedProductSku("");
                      }}
                    >
                      <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                        <SelectValue placeholder="Semua Brand" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        <SelectItem value="ALL" className="text-xs font-medium">Semua Brand</SelectItem>
                        {brandsForProductFilter.map((b) => {
                          const status = getBrandMarkupStatus(b.brand, b.category || productFilterCat);
                          return (
                            <SelectItem key={b.brand} value={b.brand} className="text-xs font-medium py-1.5 cursor-pointer">
                              <div className="flex items-center justify-between w-full gap-2.5">
                                <span className="font-semibold text-slate-800 truncate">{b.brand}</span>
                                {status?.isMarked ? (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border",
                                    status.type === "brand"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : status.type === "category_inherited"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  )}>
                                    {status.label}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px] shrink-0 border bg-amber-50 text-amber-800 border-amber-300">
                                    {status?.label}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pilih Produk */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                      3. Pilih Produk
                    </Label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setProductSelectFilter("all")}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold transition-all",
                          productSelectFilter === "all"
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        Semua ({availableProductsForSelect.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductSelectFilter("unmarked")}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold transition-all",
                          productSelectFilter === "unmarked"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                        )}
                      >
                        Belum Dimarkup ({unmarkedSelectCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductSelectFilter("marked")}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold transition-all",
                          productSelectFilter === "marked"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        Sudah ({markedSelectCount})
                      </button>
                    </div>
                  </div>
                  <Select value={selectedProductSku} onValueChange={handleSelectProduct}>
                    <SelectTrigger className="min-h-[38px] h-auto py-1.5 rounded-lg bg-white border-border font-medium text-xs">
                      {selectedProductDetail ? (
                        <div className="flex items-center gap-2 truncate text-left w-full">
                          <span className="font-semibold text-slate-800 truncate">{selectedProductDetail.product_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {selectedProductDetail.buyer_sku_code}
                          </span>
                          {selectedProductRule ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shrink-0">
                              ✓ Sudah Dimarkup ({selectedProductRule.type === "percent" ? `+${selectedProductRule.value}%` : `+Rp ${selectedProductRule.value.toLocaleString("id-ID")}`})
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300 shrink-0">
                              ⚠ Belum Dimarkup Khusus
                            </span>
                          )}
                          <span className="text-[11px] text-emerald-700 font-bold ml-auto shrink-0">
                            Modal Rp {(selectedProductDetail.price || selectedProductDetail.admin || 0).toLocaleString("id-ID")}
                            {selectedProductCalc && (
                              <span className="text-slate-600 font-semibold ml-1.5 hidden sm:inline">
                                (Jual Rp {selectedProductCalc.finalPrice.toLocaleString("id-ID")})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Pilih Produk dari Daftar..." />
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-64">
                      <div className="p-1.5 border-b border-border sticky top-0 bg-white z-10">
                        <Input
                          placeholder="Cari nama produk / SKU..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-7 text-xs"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {isSearchingProduct && (
                        <div className="p-3 text-center text-xs text-muted-foreground">Mencari produk...</div>
                      )}
                      {!isSearchingProduct && displayedProductsForSelect.length === 0 && (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Tidak ada produk {productSelectFilter === "unmarked" ? "yang belum dimarkup" : productSelectFilter === "marked" ? "yang sudah dimarkup" : "ditemukan"}.
                        </div>
                      )}
                      {displayedProductsForSelect.map((p) => {
                        const customRule = config.products?.[p.buyer_sku_code];
                        const base = p.price || p.admin || 0;
                        const calc = calculateMarkupPrice(base, p.category, p.brand, config, p.buyer_sku_code);

                        return (
                          <SelectItem key={p.buyer_sku_code} value={p.buyer_sku_code} className="text-xs font-medium py-2 cursor-pointer border-b border-slate-100 last:border-b-0">
                            <span className="flex flex-col text-left py-0.5 w-full min-w-0">
                              <span className="flex items-center justify-between gap-2 w-full">
                                <span className="font-semibold text-slate-800 truncate">{p.product_name}</span>
                                {customRule ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] shrink-0 border border-emerald-300">
                                    ✓ Sudah Dimarkup ({customRule.type === "percent" ? `+${customRule.value}%` : `+Rp ${customRule.value.toLocaleString("id-ID")}`})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[9px] shrink-0 border border-amber-300">
                                    ⚠ Belum Dimarkup Khusus ({calc.ruleApplied})
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground mt-1 w-full">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className="font-medium text-slate-600 truncate">{p.brand}</span>
                                  <span>•</span>
                                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[9px] shrink-0">{p.buyer_sku_code}</span>
                                  <span>•</span>
                                  <span className="shrink-0">Modal Rp {base.toLocaleString("id-ID")}</span>
                                </span>
                                <span className="font-bold shrink-0 ml-2">
                                  Harga Jual: <span className={customRule ? "text-emerald-700 font-black" : "text-slate-800"}>Rp {calc.finalPrice.toLocaleString("id-ID")}</span>
                                </span>
                              </span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview Produk Terpilih */}
                {selectedProductDetail && selectedProductCalc && (
                  <div className={cn(
                    "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all",
                    selectedProductRule
                      ? "bg-emerald-50/90 border-emerald-300 shadow-2xs"
                      : "bg-amber-50/50 border-amber-200 shadow-2xs"
                  )}>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 truncate">
                          {selectedProductDetail.product_name}
                        </span>
                        {selectedProductRule ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shrink-0 shadow-2xs">
                            ✓ Markup Khusus Aktif ({selectedProductRule.type === "percent" ? `+${selectedProductRule.value}%` : `+Rp ${selectedProductRule.value.toLocaleString("id-ID")}`})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] shrink-0">
                            ⚠ Belum Dimarkup Khusus (Mengikuti {selectedProductCalc.ruleApplied})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Kategori: <strong className="text-slate-800">{selectedProductDetail.category || productFilterCat || "-"}</strong></span>
                        <span>•</span>
                        <span>Brand: <strong className="text-slate-800">{selectedProductDetail.brand || productFilterBrand || "-"}</strong></span>
                        <span>•</span>
                        <span>SKU: <code className="font-mono font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-border">{selectedProductDetail.buyer_sku_code}</code></span>
                        <span>•</span>
                        <span>Aturan Berlaku: <strong className="text-slate-800">{selectedProductCalc.ruleApplied}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-200 sm:pl-4">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-medium">Modal DigiFlazz</div>
                        <div className="text-xs font-bold text-slate-700">
                          Rp {(selectedProductDetail.price || selectedProductDetail.admin || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-emerald-800 font-medium">Harga Jual Konsumen</div>
                        <div className="text-xs sm:text-sm font-black text-emerald-700">
                          Rp {selectedProductCalc.finalPrice.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pengaturan Tipe Margin & Nilai */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-end pt-1">
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Tipe Margin</Label>
                    <Select value={productRuleType} onValueChange={(val: any) => setProductRuleType(val)}>
                      <SelectTrigger className="h-8 sm:h-9 rounded-lg bg-white border-border font-medium text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fixed" className="text-xs font-medium">Nominal Tetap (Rp)</SelectItem>
                        <SelectItem value="percent" className="text-xs font-medium">Persentase (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                      Nilai Margin {productRuleType === "percent" ? "(%)" : "(Rp)"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={productRuleValue}
                      onChange={(e) => setProductRuleValue(Number(e.target.value))}
                      className="h-8 sm:h-9 rounded-lg bg-white border-border text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-2">
                    <Button
                      onClick={handleAddProductRule}
                      disabled={!selectedProductSku}
                      className="w-full h-8 sm:h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                    >
                      {selectedProductRule ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          Perbarui Aturan
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Tambah Aturan
                        </>
                      )}
                    </Button>
                    {selectedProductRule && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Hapus aturan markup khusus produk ini"
                        onClick={() => handleRemoveProductRule(selectedProductSku)}
                        className="h-8 sm:h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Rules List & Unmarked Products Explorer */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Daftar Produk & Markup
                    </Label>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-border/60">
                      <button
                        type="button"
                        onClick={() => setProductViewTab("marked")}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                          productViewTab === "marked"
                            ? "bg-white text-emerald-800 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        ✓ Sudah Dimarkup ({filteredActiveProductRules.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductViewTab("unmarked")}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                          productViewTab === "unmarked"
                            ? "bg-white text-amber-800 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        ⚠ Belum Dimarkup ({unmarkedProductsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductViewTab("all")}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                          productViewTab === "all"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        Semua ({filteredActiveProductRules.length + unmarkedProductsList.length})
                      </button>
                    </div>
                  </div>

                  {(productFilterCat || productFilterBrand) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                      <span>Filter:</span>
                      {productFilterCat && (
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full border border-border text-[10px]">
                          {productFilterCat}
                        </span>
                      )}
                      {productFilterBrand && (
                        <span className="bg-green-50 text-[#00AA5B] font-semibold px-2 py-0.5 rounded-full border border-green-200 text-[10px]">
                          {productFilterBrand}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProductFilterCat("");
                          setProductFilterBrand("");
                        }}
                        className="h-6 px-2 text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-medium"
                      >
                        Reset Filter
                      </Button>
                    </div>
                  )}
                </div>

                {/* View 1: Hanya Yang Sudah Dimarkup */}
                {productViewTab === "marked" && (
                  <>
                    {Object.keys(config.products || {}).length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-border bg-slate-50/50 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Belum ada aturan khusus produk individual. Seluruh produk saat ini mengikuti aturan Brand, Kategori, atau Global.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductViewTab("unmarked")}
                          className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold"
                        >
                          Lihat Produk Belum Dimarkup ({unmarkedProductsList.length})
                        </Button>
                      </div>
                    ) : filteredActiveProductRules.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-border bg-slate-50/50 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Tidak ada produk dengan markup khusus untuk {productFilterBrand || productFilterCat}.
                        </p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setProductFilterCat("");
                              setProductFilterBrand("");
                            }}
                            className="text-xs text-[#00AA5B] font-semibold h-auto p-0"
                          >
                            Tampilkan semua {Object.keys(config.products || {}).length} markup produk
                          </Button>
                          <span className="text-muted-foreground">•</span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setProductViewTab("unmarked")}
                            className="text-xs text-amber-700 font-semibold h-auto p-0"
                          >
                            Lihat produk belum dimarkup ({unmarkedProductsList.length})
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {filteredActiveProductRules.map(([skuKey, rule]) => {
                          const meta = productMetaMap.get(skuKey);
                          const base = meta?.price || 0;
                          const isSelected = selectedProductSku === skuKey;
                          const calc = base > 0 ? calculateMarkupPrice(base, rule.category || meta?.category, rule.brand || meta?.brand, config, skuKey) : null;

                          return (
                            <div
                              key={skuKey}
                              onClick={() => handleSelectProduct(skuKey)}
                              className={cn(
                                "p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group",
                                isSelected
                                  ? "bg-green-50/40 border-[#00AA5B] ring-1 ring-[#00AA5B]/40 shadow-xs"
                                  : "border-border bg-white hover:border-slate-300 hover:shadow-2xs"
                              )}
                              title="Klik untuk melihat / mengedit markup produk ini"
                            >
                              <div className="min-w-0 pr-1 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-slate-800 truncate group-hover:text-[#00AA5B] transition-colors">
                                    {rule.product_name || meta?.name || skuKey}
                                  </span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B] shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{skuKey}</span>
                                  {(rule.brand || meta?.brand) && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{rule.brand || meta?.brand}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] sm:text-[11px] font-bold text-[#00AA5B]">
                                    {rule.type === "percent" ? `+${rule.value}%` : `+Rp ${rule.value.toLocaleString("id-ID")}`}
                                  </span>
                                  {calc && (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ➔ Jual Rp {calc.finalPrice.toLocaleString("id-ID")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Hapus aturan markup ini"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveProductRule(skuKey);
                                }}
                                className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* View 2: Produk yang Belum Dimarkup Khusus */}
                {productViewTab === "unmarked" && (
                  <>
                    {unmarkedProductsList.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <p className="text-xs font-bold text-emerald-800">
                          Luar biasa! Semua produk dalam pilihan ini sudah memiliki markup khusus.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {unmarkedProductsList.slice(0, 60).map((p) => {
                          const base = p.price || p.admin || 0;
                          const calc = calculateMarkupPrice(base, p.category || productFilterCat, p.brand || productFilterBrand, config, p.buyer_sku_code);
                          const isSelected = selectedProductSku === p.buyer_sku_code;

                          return (
                            <div
                              key={p.buyer_sku_code}
                              onClick={() => handleSelectProduct(p.buyer_sku_code)}
                              className={cn(
                                "p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group",
                                isSelected
                                  ? "bg-amber-50/70 border-amber-400 ring-1 ring-amber-400/40 shadow-xs"
                                  : "border-border bg-white hover:border-amber-300 hover:shadow-2xs"
                              )}
                              title="Klik untuk mengatur margin khusus produk ini"
                            >
                              <div className="min-w-0 pr-1 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                                    {p.product_name}
                                  </span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{p.buyer_sku_code}</span>
                                  {p.brand && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{p.brand}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Belum Dimarkup Khusus
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    ➔ Jual Rp {calc.finalPrice.toLocaleString("id-ID")} ({calc.ruleApplied.split(" ")[0]})
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProduct(p.buyer_sku_code);
                                }}
                                className="h-7 px-2.5 text-[10px] font-bold text-amber-700 hover:text-amber-900 border-amber-300 hover:bg-amber-50 rounded-lg shrink-0"
                              >
                                + Atur
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* View 3: Tampilkan Semua (Sudah & Belum) */}
                {productViewTab === "all" && (
                  <div className="space-y-4">
                    {/* Yang Sudah Dimarkup */}
                    {filteredActiveProductRules.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Sudah Dimarkup Khusus ({filteredActiveProductRules.length})
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {filteredActiveProductRules.map(([skuKey, rule]) => {
                            const meta = productMetaMap.get(skuKey);
                            const base = meta?.price || 0;
                            const isSelected = selectedProductSku === skuKey;
                            const calc = base > 0 ? calculateMarkupPrice(base, rule.category || meta?.category, rule.brand || meta?.brand, config, skuKey) : null;

                            return (
                              <div
                                key={skuKey}
                                onClick={() => handleSelectProduct(skuKey)}
                                className={cn(
                                  "p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group",
                                  isSelected
                                    ? "bg-green-50/40 border-[#00AA5B] ring-1 ring-[#00AA5B]/40 shadow-xs"
                                    : "border-border bg-white hover:border-slate-300 hover:shadow-2xs"
                                )}
                              >
                                <div className="min-w-0 pr-1 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-slate-800 truncate group-hover:text-[#00AA5B] transition-colors">
                                      {rule.product_name || meta?.name || skuKey}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>{skuKey}</span>
                                    {(rule.brand || meta?.brand) && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{rule.brand || meta?.brand}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] sm:text-[11px] font-bold text-[#00AA5B]">
                                      {rule.type === "percent" ? `+${rule.value}%` : `+Rp ${rule.value.toLocaleString("id-ID")}`}
                                    </span>
                                    {calc && (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        ➔ Jual Rp {calc.finalPrice.toLocaleString("id-ID")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveProductRule(skuKey);
                                  }}
                                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Yang Belum Dimarkup */}
                    {unmarkedProductsList.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Belum Dimarkup Khusus ({unmarkedProductsList.length})
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {unmarkedProductsList.slice(0, 40).map((p) => {
                            const base = p.price || p.admin || 0;
                            const calc = calculateMarkupPrice(base, p.category || productFilterCat, p.brand || productFilterBrand, config, p.buyer_sku_code);
                            const isSelected = selectedProductSku === p.buyer_sku_code;

                            return (
                              <div
                                key={p.buyer_sku_code}
                                onClick={() => handleSelectProduct(p.buyer_sku_code)}
                                className={cn(
                                  "p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group",
                                  isSelected
                                    ? "bg-amber-50/70 border-amber-400 ring-1 ring-amber-400/40 shadow-xs"
                                    : "border-border bg-white hover:border-amber-300 hover:shadow-2xs"
                                )}
                              >
                                <div className="min-w-0 pr-1 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                                      {p.product_name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                    <span>{p.buyer_sku_code}</span>
                                    {p.brand && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{p.brand}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      Belum Dimarkup Khusus
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ➔ Jual Rp {calc.finalPrice.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectProduct(p.buyer_sku_code);
                                  }}
                                  className="h-7 px-2.5 text-[10px] font-bold text-amber-700 hover:text-amber-900 border-amber-300 hover:bg-amber-50 rounded-lg shrink-0"
                                >
                                  + Atur
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: SIMULASI & KALKULATOR */}
        <TabsContent value="simulator" className="space-y-4 sm:space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* Interactive Calculator */}
            <Card className="lg:col-span-5 rounded-2xl border-border bg-white shadow-xs">
              <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
                <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#00AA5B]" />
                  Kalkulator Simulasi Harga
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Coba ketik nominal harga modal atau pilih produk spesifik untuk menguji harga jual yang akan dihasilkan.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Pilih Produk Contoh (Opsional)</Label>
                  <Select
                    value={simProductSku || "none"}
                    onValueChange={(val) => {
                      const sku = val === "none" ? "" : val;
                      setSimProductSku(sku);
                      if (sku) {
                        const item = products.find((p) => p.buyer_sku_code === sku);
                        if (item) {
                          setSimBasePrice(item.price || item.admin || simBasePrice);
                          if (item.category) setSimCategory(item.category);
                          if (item.brand) setSimBrand(item.brand);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 sm:h-9 rounded-lg text-xs font-medium">
                      <SelectValue placeholder="Pilih produk untuk isi otomatis..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      <SelectItem value="none" className="text-xs font-medium">Input Manual (Tanpa Produk)</SelectItem>
                      {products.slice(0, 50).map((p) => (
                        <SelectItem key={p.buyer_sku_code} value={p.buyer_sku_code} className="text-xs font-medium">
                          {p.product_name} ({p.brand})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Harga Modal DigiFlazz (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={simBasePrice}
                    onChange={(e) => setSimBasePrice(Number(e.target.value) || 0)}
                    className="h-8 sm:h-9 rounded-lg font-bold text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Kategori (Opsional)</Label>
                    <Select value={simCategory || "none"} onValueChange={(val) => setSimCategory(val === "none" ? "" : val)}>
                      <SelectTrigger className="h-8 sm:h-9 rounded-lg text-xs font-medium">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-48">
                        <SelectItem value="none" className="text-xs font-medium">Semua (Default)</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs font-medium">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] sm:text-[11px] font-semibold text-slate-700">Brand (Opsional)</Label>
                    <Select value={simBrand || "none"} onValueChange={(val) => setSimBrand(val === "none" ? "" : val)}>
                      <SelectTrigger className="h-8 sm:h-9 rounded-lg text-xs font-medium">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-48">
                        <SelectItem value="none" className="text-xs font-medium">Semua (Default)</SelectItem>
                        {uniqueBrands.slice(0, 50).map((b) => (
                          <SelectItem key={b.brand} value={b.brand} className="text-xs font-medium">{b.brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Simulation Breakdown Card */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Harga Modal:</span>
                    <span className="font-semibold text-slate-800">Rp {simResult.basePrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Aturan Diterapkan:</span>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold text-[#00AA5B] border-[#00AA5B]/30 bg-white">
                      {simResult.ruleApplied}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Margin Keuntungan:</span>
                    <span className="font-bold text-[#00AA5B]">+Rp {simResult.markupAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Harga Jual Akhir:</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      Rp {simResult.finalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample Catalog Products Table */}
            <Card className="lg:col-span-7 rounded-2xl border-border bg-white shadow-xs">
              <CardHeader className="p-3.5 sm:p-5 border-b border-border/60">
                <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00AA5B]" />
                  Contoh Harga Produk Nyata dari Katalog
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Perbandingan harga modal DigiFlazz vs harga jual yang akan dilihat pembeli di web berdasarkan aturan 4 tingkat.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4">Nama Produk</th>
                        <th className="py-2.5 px-2 sm:px-3">Modal</th>
                        <th className="py-2.5 px-2 sm:px-3">Margin</th>
                        <th className="py-2.5 px-3 sm:px-4">Harga Jual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sampleCalculations.map((item, idx) => {
                        const calc = calculateMarkupPrice(item.basePrice, item.category, item.brand, config, item.buyer_sku_code);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 sm:px-4">
                              <div className="font-semibold text-xs text-slate-800 line-clamp-1">{item.product_name}</div>
                              <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                                {item.category} • {item.brand} • <span className="font-mono text-slate-400">{item.buyer_sku_code}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 sm:px-3 font-medium text-slate-600 whitespace-nowrap text-[11px] sm:text-xs">
                              Rp {item.basePrice.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-2 sm:px-3 font-semibold text-[#00AA5B] whitespace-nowrap text-[11px] sm:text-xs">
                              +Rp {calc.markupAmount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                              Rp {calc.finalPrice.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
