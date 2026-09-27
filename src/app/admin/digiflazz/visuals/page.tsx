"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Sparkles,
  Save,
  Image as ImageIcon,
  Search,
  Loader2,
  Check,
  Zap,
  Wand2,
  Upload,
  Eye,
  Sliders,
  Plus,
  ExternalLink,
  Award,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BrandVisual {
  brand: string;
  iconUrl?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  textColor?: string;
  badgeText?: string;
  badgeBg?: string;
  badgeIconUrl?: string;
}

interface CategoryVisual {
  category: string;
  iconUrl?: string;
  bgGradient?: string;
  bgImageUrl?: string;
  accentColor?: string;
}

interface GalleryDbAsset {
  id: string;
  name: string;
  url: string;
  category: string;
  folder: string;
  size?: number;
}

// Preset gradients & icons for popular Indonesian providers & games
const PRESET_BRAND_DEFAULTS: Record<string, BrandVisual> = {
  TELKOMSEL: {
    brand: "TELKOMSEL",
    iconUrl: "https://api.iconify.design/logos:telkomsel.svg",
    bgGradient: "linear-gradient(135deg, #E11218 0%, #900000 100%)",
    textColor: "#FFFFFF",
    badgeText: "HOT",
    badgeBg: "#FFD700"
  },
  INDOSAT: {
    brand: "INDOSAT",
    iconUrl: "https://api.iconify.design/simple-icons:indosat.svg",
    bgGradient: "linear-gradient(135deg, #FFCC00 0%, #E60000 100%)",
    textColor: "#FFFFFF",
    badgeText: "PROMO",
    badgeBg: "#00AA5B"
  },
  XL: {
    brand: "XL",
    iconUrl: "https://api.iconify.design/simple-icons:xl.svg",
    bgGradient: "linear-gradient(135deg, #002D72 0%, #0099FF 100%)",
    textColor: "#FFFFFF",
    badgeText: "FAST",
    badgeBg: "#00E676"
  },
  TRI: {
    brand: "TRI",
    iconUrl: "https://api.iconify.design/simple-icons:three.svg",
    bgGradient: "linear-gradient(135deg, #111111 0%, #FF0055 100%)",
    textColor: "#FFFFFF",
    badgeText: "HEMAT",
    badgeBg: "#FF0055"
  },
  AXIS: {
    brand: "AXIS",
    iconUrl: "https://api.iconify.design/simple-icons:axis.svg",
    bgGradient: "linear-gradient(135deg, #6B21A8 0%, #D946EF 100%)",
    textColor: "#FFFFFF",
    badgeText: "GAUL",
    badgeBg: "#F43F5E"
  },
  PLN: {
    brand: "PLN",
    iconUrl: "https://api.iconify.design/mdi:lightning-bolt.svg",
    bgGradient: "linear-gradient(135deg, #0284C7 0%, #F59E0B 100%)",
    textColor: "#FFFFFF",
    badgeText: "RESMI",
    badgeBg: "#F59E0B"
  },
  DANA: {
    brand: "DANA",
    iconUrl: "https://api.iconify.design/simple-icons:dana.svg",
    bgGradient: "linear-gradient(135deg, #118EEA 0%, #0B64A4 100%)",
    textColor: "#FFFFFF",
    badgeText: "E-WALLET",
    badgeBg: "#00E676"
  },
  OVO: {
    brand: "OVO",
    iconUrl: "https://api.iconify.design/simple-icons:ovo.svg",
    bgGradient: "linear-gradient(135deg, #4C2A86 0%, #6F3BAA 100%)",
    textColor: "#FFFFFF",
    badgeText: "E-WALLET",
    badgeBg: "#A855F7"
  },
  GOPAY: {
    brand: "GOPAY",
    iconUrl: "https://api.iconify.design/simple-icons:gopay.svg",
    bgGradient: "linear-gradient(135deg, #00A5CF 0%, #007799 100%)",
    textColor: "#FFFFFF",
    badgeText: "E-WALLET",
    badgeBg: "#00E676"
  },
  "MOBILE LEGENDS": {
    brand: "MOBILE LEGENDS",
    iconUrl: "https://api.iconify.design/mdi:gamepad-variant.svg",
    bgGradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)",
    textColor: "#FFFFFF",
    badgeText: "GAME",
    badgeBg: "#818CF8"
  },
  "FREE FIRE": {
    brand: "FREE FIRE",
    iconUrl: "https://api.iconify.design/mdi:fire.svg",
    bgGradient: "linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)",
    textColor: "#FFFFFF",
    badgeText: "POPULER",
    badgeBg: "#F97316"
  }
};

const GRADIENT_PRESETS = [
  { label: "Telkomsel Red", value: "linear-gradient(135deg, #E11218 0%, #900000 100%)" },
  { label: "Indosat Yellow", value: "linear-gradient(135deg, #FFCC00 0%, #E60000 100%)" },
  { label: "XL Ocean Blue", value: "linear-gradient(135deg, #002D72 0%, #0099FF 100%)" },
  { label: "Tri Magenta Dark", value: "linear-gradient(135deg, #111111 0%, #FF0055 100%)" },
  { label: "Axis Purple Pink", value: "linear-gradient(135deg, #6B21A8 0%, #D946EF 100%)" },
  { label: "PLN Electric Blue", value: "linear-gradient(135deg, #0284C7 0%, #F59E0B 100%)" },
  { label: "Dana Sky Blue", value: "linear-gradient(135deg, #118EEA 0%, #0B64A4 100%)" },
  { label: "Ovo Deep Violet", value: "linear-gradient(135deg, #4C2A86 0%, #6F3BAA 100%)" },
  { label: "Gopay Cyan", value: "linear-gradient(135deg, #00A5CF 0%, #007799 100%)" },
  { label: "Emerald Green", value: "linear-gradient(135deg, #059669 0%, #10B981 100%)" },
  { label: "Gaming Night Cyber", value: "linear-gradient(135deg, #0F172A 0%, #38BDF8 100%)" },
  { label: "Sunset Gold", value: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)" },
];

export default function DigiFlazzVisualsPage() {
  const { toast } = useToast();
  const db = useFirestore();

  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const [searchBrand, setSearchBrand] = useState("");

  // Dynamic lists from catalog DB
  const [brandsList, setBrandsList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  // Assets loaded from SQLite database/gallery.db
  const [galleryIcons, setGalleryIcons] = useState<GalleryDbAsset[]>([]);
  const [galleryBackgrounds, setGalleryBackgrounds] = useState<GalleryDbAsset[]>([]);

  // Firestore Visual Settings Ref
  const visualsDocRef = useMemoFirebase(() => doc(db, "settings", "digiflazz_visuals"), [db]);
  const { data: visualsData, loading: visualsLoading } = useDoc(visualsDocRef);

  // Local Brand Visual Configurations state
  const [brandVisuals, setBrandVisuals] = useState<Record<string, BrandVisual>>({});
  const [categoryVisuals, setCategoryVisuals] = useState<Record<string, CategoryVisual>>({});
  const [defaultBgGradient, setDefaultBgGradient] = useState("linear-gradient(135deg, #1E293B 0%, #0F172A 100%)");

  // Selected Brand for live editing/preview
  const [selectedBrandKey, setSelectedBrandKey] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    fetchCatalogMetadata();
    fetchGalleryAssets();
  }, []);

  useEffect(() => {
    if (visualsData) {
      if (visualsData.brands) setBrandVisuals(visualsData.brands);
      if (visualsData.categories) setCategoryVisuals(visualsData.categories);
      if (visualsData.defaultBgGradient) setDefaultBgGradient(visualsData.defaultBgGradient);
    }
  }, [visualsData]);

  const fetchCatalogMetadata = async () => {
    try {
      const res = await fetch("/api/admin/digiflazz/products");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const bSet = new Set<string>();
        const cSet = new Set<string>();
        data.data.forEach((item: any) => {
          if (item.brand) bSet.add(item.brand.toUpperCase());
          if (item.category) cSet.add(item.category);
        });
        const sortedBrands = Array.from(bSet).sort();
        const sortedCategories = Array.from(cSet).sort();
        setBrandsList(sortedBrands);
        setCategoriesList(sortedCategories);
        if (sortedBrands.length > 0) {
          setSelectedBrandKey(sortedBrands[0]);
        }
      }
    } catch (e) {
      console.warn("Gagal memuat metadata brand & kategori DigiFlazz:", e);
    }
  };

  const fetchGalleryAssets = async () => {
    try {
      const [resIcon, resBg] = await Promise.all([
        fetch("/api/admin/gallery?category=icon"),
        fetch("/api/admin/gallery?category=background"),
      ]);
      const dataIcon = await resIcon.json();
      const dataBg = await resBg.json();

      if (dataIcon.success && Array.isArray(dataIcon.data)) {
        setGalleryIcons(dataIcon.data);
      }
      if (dataBg.success && Array.isArray(dataBg.data)) {
        setGalleryBackgrounds(dataBg.data);
      }
    } catch (e) {
      console.warn("Gagal mengambil aset galeri dari database/gallery.db:", e);
    }
  };

  const handleUploadNewAsset = async (file: File, category: "icon" | "background") => {
    const isIcon = category === "icon";
    if (isIcon) setUploadingIcon(true);
    else setUploadingBg(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `gallery/${category}`);
      formData.append("type", category);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        toast({
          title: "Upload Berhasil!",
          description: `Gambar ${file.name} telah diunggah ke R2 'gallery/${category}' dan tersimpan di database/gallery.db.`,
        });

        // Refresh gallery items
        await fetchGalleryAssets();

        // Apply immediately to current brand
        if (selectedBrandKey) {
          if (isIcon) {
            handleUpdateBrandVisual(selectedBrandKey, { iconUrl: data.url });
          } else {
            handleUpdateBrandVisual(selectedBrandKey, { bgImageUrl: data.url });
          }
        }
      } else {
        throw new Error(data.error || "Gagal mengunggah file gambar ke R2");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Upload",
        description: err.message || "Terjadi kesalahan jaringan saat mengunggah gambar.",
      });
    } finally {
      if (isIcon) setUploadingIcon(false);
      else setUploadingBg(false);
    }
  };

  const filteredBrands = useMemo(() => {
    if (!searchBrand.trim()) return brandsList;
    const q = searchBrand.toLowerCase().trim();
    return brandsList.filter((b) => b.toLowerCase().includes(q));
  }, [brandsList, searchBrand]);

  const handleUpdateBrandVisual = (brandName: string, updates: Partial<BrandVisual>) => {
    setBrandVisuals((prev) => ({
      ...prev,
      [brandName]: {
        ...(prev[brandName] || { brand: brandName }),
        ...updates,
      },
    }));
  };

  const handleApplyPresetAll = () => {
    const newVisuals = { ...brandVisuals };
    let appliedCount = 0;

    brandsList.forEach((brand) => {
      const upperBrand = brand.toUpperCase();
      Object.keys(PRESET_BRAND_DEFAULTS).forEach((presetKey) => {
        if (upperBrand.includes(presetKey) && !newVisuals[brand]) {
          newVisuals[brand] = {
            ...PRESET_BRAND_DEFAULTS[presetKey],
            brand,
          };
          appliedCount++;
        }
      });
    });

    setBrandVisuals(newVisuals);
    toast({
      title: "Preset Otomatis Diterapkan!",
      description: `Berhasil mencocokkan ${appliedCount} brand dengan warna & logo resmi provider.`,
    });
  };

  const handleSaveVisuals = async () => {
    if (!mounted) return;
    setSaving(true);
    try {
      await setDoc(
        visualsDocRef,
        {
          brands: brandVisuals,
          categories: categoryVisuals,
          defaultBgGradient,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "Tersimpan!",
        description: "Pengaturan icon & background produk DigiFlazz berhasil disimpan ke Firestore.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: e.message || "Terjadi kesalahan saat menyimpan visual settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const currentBrandConfig = selectedBrandKey ? (brandVisuals[selectedBrandKey] || { brand: selectedBrandKey }) : null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Hidden File Inputs for Direct R2 Uploads */}
      <input
        ref={iconFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUploadNewAsset(e.target.files[0], "icon")}
        className="hidden"
      />
      <input
        ref={bgFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUploadNewAsset(e.target.files[0], "background")}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#00AA5B]" /> Icon & Background DigiFlazz
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            Pilih gambar icon dan background dari galeri Cloudflare R2 (<code className="text-[#00AA5B] font-mono">database/gallery.db</code>) untuk produk DigiFlazz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleApplyPresetAll}
            variant="outline"
            size="sm"
            className="h-9 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50/80 hover:bg-amber-100 rounded-xl gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" /> Auto Preset Logo
          </Button>

          <Button
            onClick={handleSaveVisuals}
            disabled={saving || visualsLoading}
            size="sm"
            className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 px-4 gap-2 shadow-2xs"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Brand</span>
              <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                {brandsList.length} BRAND
              </Badge>
            </div>
            <div className="text-base md:text-xl font-black text-slate-800 tracking-tight mt-1">
              {Object.keys(brandVisuals).length} / {brandsList.length}
            </div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">Brand dengan visual kustom</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Aset Icon Galeri</span>
              <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                {galleryIcons.length} ICONS
              </Badge>
            </div>
            <div className="text-base md:text-xl font-black text-purple-700 tracking-tight mt-1">
              {galleryIcons.length} Logo Icon
            </div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">Tersedia di Galeri Icon R2</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Aset Background</span>
              <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                {galleryBackgrounds.length} BG
              </Badge>
            </div>
            <div className="text-base md:text-xl font-black text-[#00AA5B] tracking-tight mt-1">
              {galleryBackgrounds.length} Background
            </div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">Tersedia di Galeri Background R2</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Live Preview</span>
              <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                REALTIME
              </Badge>
            </div>
            <div className="text-base md:text-xl font-black text-amber-600 tracking-tight mt-1">
              Active Sync
            </div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate">Pratinjau tampilan toko</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Split View (Left Form/List, Right Realtime Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* Left Column: Brand Visual Manager (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-[#212121] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00AA5B]" /> Pengaturan Visual Per-Brand
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Pilih brand lalu klik aset gambar dari **Galeri Icon** dan **Galeri Background** di bawah.
                  </CardDescription>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchBrand}
                    onChange={(e) => setSearchBrand(e.target.value)}
                    placeholder="Cari Brand..."
                    className="h-8 pl-8 rounded-xl text-xs bg-white border-border/70"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-5 space-y-5">
              {/* Brand Selector Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Pilih Brand DigiFlazz</Label>
                <Select value={selectedBrandKey} onValueChange={setSelectedBrandKey}>
                  <SelectTrigger className="h-10 rounded-xl text-xs font-bold bg-slate-50/70 border-border/70">
                    <SelectValue placeholder="Pilih Brand..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {filteredBrands.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#00AA5B]"></span>
                          <span>{b}</span>
                          {brandVisuals[b] && (
                            <Badge variant="outline" className="text-[8px] font-bold py-0 px-1 bg-green-50 text-green-700 border-green-200">
                              Customized
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBrandKey && currentBrandConfig && (
                <div className="p-4 rounded-xl border border-border/60 bg-slate-50/30 space-y-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Konfigurasi Visual: <span className="text-[#00AA5B]">{selectedBrandKey}</span>
                    </h4>
                    {PRESET_BRAND_DEFAULTS[selectedBrandKey.toUpperCase()] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleUpdateBrandVisual(selectedBrandKey, PRESET_BRAND_DEFAULTS[selectedBrandKey.toUpperCase()]);
                          toast({ title: "Preset Diterapkan!", description: `Preset resmi untuk ${selectedBrandKey} berhasil dimuat.` });
                        }}
                        className="h-6 px-2 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                      >
                        Gunakan Preset Resmi
                      </Button>
                    )}
                  </div>

                  {/* 1. SELEKSI ICON DARI GALERI ICON */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Pilih Icon Dari Galeri Icon
                      </Label>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => iconFileInputRef.current?.click()}
                          disabled={uploadingIcon}
                          className="h-7 text-[10px] font-bold border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg gap-1"
                        >
                          {uploadingIcon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Upload Icon Ke Galeri
                        </Button>

                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-slate-600 hover:text-foreground">
                          <Link href="/admin/gallery/icon" target="_blank" className="flex items-center gap-1">
                            Kelola Galeri Icon <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Icon Picker Grid */}
                    {galleryIcons.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-border bg-white text-center space-y-2">
                        <p className="text-xs text-muted-foreground">Belum ada icon di Galeri Icon R2.</p>
                        <Button
                          size="sm"
                          onClick={() => iconFileInputRef.current?.click()}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs h-8 px-3 gap-1.5"
                        >
                          <Upload className="w-3 h-3" /> Upload Icon Pertama
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-2 bg-white rounded-xl border border-border/70 max-h-48 overflow-y-auto">
                        {galleryIcons.map((asset) => {
                          const isSelected = currentBrandConfig.iconUrl === asset.url;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => handleUpdateBrandVisual(selectedBrandKey, { iconUrl: asset.url })}
                              className={cn(
                                "group relative aspect-square rounded-xl p-0 overflow-hidden border transition-all flex items-center justify-center bg-slate-50 hover:bg-slate-100",
                                isSelected
                                  ? "border-[#00AA5B] ring-2 ring-[#00AA5B]/20 bg-green-50/50"
                                  : "border-border/60 hover:border-slate-300"
                              )}
                              title={asset.name}
                            >
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover filter drop-shadow-2xs" />
                              {isSelected && (
                                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Manual URL Input Fallback */}
                    <Input
                      type="text"
                      value={currentBrandConfig.iconUrl || ""}
                      onChange={(e) => handleUpdateBrandVisual(selectedBrandKey, { iconUrl: e.target.value })}
                      placeholder="Atau tempelkan URL Icon khusus..."
                      className="h-8 rounded-xl text-xs font-mono bg-white border-border/70 mt-1"
                    />
                  </div>

                  {/* 2. SELEKSI BACKGROUND DARI GALERI BACKGROUND / GRADIENT */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Pilih Background Dari Galeri Background
                      </Label>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bgFileInputRef.current?.click()}
                          disabled={uploadingBg}
                          className="h-7 text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg gap-1"
                        >
                          {uploadingBg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Upload BG Ke Galeri
                        </Button>

                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-slate-600 hover:text-foreground">
                          <Link href="/admin/gallery/background" target="_blank" className="flex items-center gap-1">
                            Kelola Galeri Background <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Background Picker Grid */}
                    {galleryBackgrounds.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Gambar Galeri Background:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2 bg-white rounded-xl border border-border/70 max-h-44 overflow-y-auto">
                          {galleryBackgrounds.map((asset) => {
                            const isSelected = currentBrandConfig.bgImageUrl === asset.url;
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => handleUpdateBrandVisual(selectedBrandKey, { bgImageUrl: asset.url })}
                                className={cn(
                                  "group relative aspect-video rounded-lg overflow-hidden border transition-all bg-slate-100",
                                  isSelected
                                    ? "border-[#00AA5B] ring-2 ring-[#00AA5B]/20"
                                    : "border-border/60 hover:border-slate-300"
                                )}
                                title={asset.name}
                              >
                                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#00AA5B] text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Preset Palette Pills */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Atau Pilih Preset Gradien Warna:</span>
                        {currentBrandConfig.bgImageUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBrandVisual(selectedBrandKey, { bgImageUrl: "" })}
                            className="text-[10px] font-bold text-red-600 hover:underline"
                          >
                            Hapus Gambar Background (Ganti Ke Gradien)
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {GRADIENT_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleUpdateBrandVisual(selectedBrandKey, { bgGradient: preset.value, bgImageUrl: "" })}
                            className="flex items-center gap-2 p-1.5 rounded-lg border border-border/60 hover:border-[#00AA5B] text-[10px] font-medium text-slate-700 bg-white transition-all text-left truncate"
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-white"
                              style={{ background: preset.value }}
                            />
                            <span className="truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. BADGE TEKS & WARNA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Teks Badge (Opsional)</Label>
                      <Input
                        type="text"
                        value={currentBrandConfig.badgeText || ""}
                        onChange={(e) => handleUpdateBrandVisual(selectedBrandKey, { badgeText: e.target.value })}
                        placeholder="Contoh: PROMO, HOT, FAST"
                        className="h-9 rounded-xl text-xs bg-white border-border/70"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Warna Badge (Hex / CSS)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentBrandConfig.badgeBg || "#00AA5B"}
                          onChange={(e) => handleUpdateBrandVisual(selectedBrandKey, { badgeBg: e.target.value })}
                          className="w-9 h-9 p-0.5 rounded-xl border border-border cursor-pointer bg-white"
                        />
                        <Input
                          type="text"
                          value={currentBrandConfig.badgeBg || "#00AA5B"}
                          onChange={(e) => handleUpdateBrandVisual(selectedBrandKey, { badgeBg: e.target.value })}
                          placeholder="#00AA5B"
                          className="h-9 rounded-xl text-xs font-mono bg-white border-border/70 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Realtime Storefront Card Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden sticky top-6">
            <CardHeader className="p-4 border-b border-border/40 bg-slate-50/40">
              <CardTitle className="text-xs md:text-sm font-bold text-[#212121] flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" /> Realtime Storefront Preview
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Simulasi tampilan card produk di halaman toko pengguna mobile.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4 flex flex-col items-center justify-center">
              {/* Product Card Mockup */}
              <div
                className="w-full rounded-2xl p-4 text-white shadow-md transition-all duration-300 space-y-3 relative overflow-hidden bg-cover bg-center"
                style={{
                  background: currentBrandConfig?.bgImageUrl
                    ? `url('${currentBrandConfig.bgImageUrl}') center/cover no-repeat`
                    : (currentBrandConfig?.bgGradient || defaultBgGradient),
                }}
              >
                {/* Overlay for background images */}
                {currentBrandConfig?.bgImageUrl && (
                  <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
                )}

                {/* Glow Overlay effect */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-start justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md p-0 overflow-hidden flex items-center justify-center border border-white/20 shrink-0">
                      {currentBrandConfig?.iconUrl ? (
                        <img
                          src={currentBrandConfig.iconUrl}
                          alt={selectedBrandKey}
                          className="w-full h-full object-cover filter drop-shadow"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Zap className="w-5 h-5 text-amber-300" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase block leading-none">
                        DIGIFLAZZ PPOB
                      </span>
                      <h4 className="text-sm font-black text-white leading-tight mt-0.5">
                        {selectedBrandKey || "TELKOMSEL"}
                      </h4>
                    </div>
                  </div>

                  {currentBrandConfig?.badgeText && (
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950 uppercase tracking-wider shadow-xs relative z-10"
                      style={{ background: currentBrandConfig.badgeBg || "#FFD700" }}
                    >
                      {currentBrandConfig.badgeText}
                    </span>
                  )}
                </div>

                {/* Sample Product item inside card */}
                <div className="p-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 space-y-1 relative z-10">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>10.000 Pulsa Regular</span>
                    <span className="text-amber-300 font-extrabold">Rp 10.450</span>
                  </div>
                  <p className="text-[9px] text-white/80 line-clamp-1">
                    Isi ulang pulsa elektrik kilat 24 jam nonstop terverifikasi
                  </p>
                </div>
              </div>

              <div className="w-full text-center space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Status Preview Visual
                </span>
                <p className="text-[11px] font-semibold text-slate-700">
                  {selectedBrandKey ? `Visual untuk brand ${selectedBrandKey}` : "Pilih brand untuk melihat pratinjau"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
