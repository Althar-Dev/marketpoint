"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Zap,
  Gamepad2,
  Smartphone,
  Wallet as WalletIcon,
  Ticket,
  FileText,
  Layers,
  Copy,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Store,
  RefreshCw,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface PPOBServiceItem {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type?: string;
  seller_name?: string;
  price: number;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock?: boolean;
  stock?: number;
  desc?: string;
  cmd_type?: "prepaid" | "pasca";
}

// Fallback high-demand PPOB catalog items
const FALLBACK_PPOB_SERVICES: PPOBServiceItem[] = [
  // 1. Games (Mobile Legends, Free Fire, PUBG, Genshin)
  {
    buyer_sku_code: "ML-86",
    product_name: "Mobile Legends 86 Diamonds (78 + 8 Bonus)",
    category: "GAMES",
    brand: "MOBILE LEGENDS",
    price: 21500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Proses otomatis 1-5 detik via User ID & Zone ID"
  },
  {
    buyer_sku_code: "ML-172",
    product_name: "Mobile Legends 172 Diamonds (156 + 16 Bonus)",
    category: "GAMES",
    brand: "MOBILE LEGENDS",
    price: 42800,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Proses otomatis 1-5 detik via User ID & Zone ID"
  },
  {
    buyer_sku_code: "ML-WDP",
    product_name: "Mobile Legends Weekly Diamond Pass (WDP)",
    category: "GAMES",
    brand: "MOBILE LEGENDS",
    price: 27900,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Klaim harian total 210 Diamonds + 70 Starlight Point"
  },
  {
    buyer_sku_code: "FF-70",
    product_name: "Free Fire 70 Diamonds",
    category: "GAMES",
    brand: "FREE FIRE",
    price: 9600,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up instan langsung masuk ke akun Free Fire"
  },
  {
    buyer_sku_code: "FF-140",
    product_name: "Free Fire 140 Diamonds",
    category: "GAMES",
    brand: "FREE FIRE",
    price: 18900,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up instan langsung masuk ke akun Free Fire"
  },
  {
    buyer_sku_code: "PUBG-60",
    product_name: "PUBG Mobile 60 Unknown Cash (UC)",
    category: "GAMES",
    brand: "PUBG MOBILE",
    price: 14700,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Proses cepat via Player ID Global / Indo"
  },
  {
    buyer_sku_code: "GENSHIN-BLESS",
    product_name: "Genshin Impact Blessing of the Welkin Moon",
    category: "GAMES",
    brand: "GENSHIN IMPACT",
    price: 74500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "300 Genesis Crystals + 90 Primogems setiap hari selama 30 hari"
  },

  // 2. Pulsa & Data (Telkomsel, Indosat, XL, Tri, Smartfren)
  {
    buyer_sku_code: "TSEL-5",
    product_name: "Telkomsel Pulsa Reguler Rp 5.000",
    category: "PULSA",
    brand: "TELKOMSEL",
    price: 5850,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Menambah masa aktif 7 hari"
  },
  {
    buyer_sku_code: "TSEL-10",
    product_name: "Telkomsel Pulsa Reguler Rp 10.000",
    category: "PULSA",
    brand: "TELKOMSEL",
    price: 10750,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Menambah masa aktif 15 hari"
  },
  {
    buyer_sku_code: "TSEL-DATA-5GB",
    product_name: "Telkomsel Internet Max 5GB (30 Hari)",
    category: "DATA",
    brand: "TELKOMSEL",
    price: 32000,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Kuota utama 24 jam di seluruh jaringan 4G/5G"
  },
  {
    buyer_sku_code: "ISAT-10",
    product_name: "Indosat Ooredoo Pulsa Reguler Rp 10.000",
    category: "PULSA",
    brand: "INDOSAT",
    price: 10650,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Menambah masa aktif 15 hari IM3"
  },
  {
    buyer_sku_code: "ISAT-DATA-10GB",
    product_name: "Indosat Freedom Internet 10GB (30 Hari)",
    category: "DATA",
    brand: "INDOSAT",
    price: 43500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "100% kuota utama tanpa pembagian waktu"
  },
  {
    buyer_sku_code: "XL-10",
    product_name: "XL Axiata Pulsa Reguler Rp 10.000",
    category: "PULSA",
    brand: "XL",
    price: 10700,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Pulsa reguler XL Nasional"
  },
  {
    buyer_sku_code: "TRI-10",
    product_name: "Tri Indonesia Pulsa Reguler Rp 10.000",
    category: "PULSA",
    brand: "TRI",
    price: 10250,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Pulsa reguler Tri"
  },

  // 3. E-Money / E-Wallet (DANA, GoPay, OVO, ShopeePay)
  {
    buyer_sku_code: "DANA-20",
    product_name: "Saldo DANA Rp 20.000",
    category: "E-MONEY",
    brand: "DANA",
    price: 20450,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up instan saldo DANA tanpa biaya admin bank"
  },
  {
    buyer_sku_code: "DANA-50",
    product_name: "Saldo DANA Rp 50.000",
    category: "E-MONEY",
    brand: "DANA",
    price: 50450,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up instan saldo DANA tanpa biaya admin bank"
  },
  {
    buyer_sku_code: "GOPAY-20",
    product_name: "Saldo GoPay Customer Rp 20.000",
    category: "E-MONEY",
    brand: "GOPAY",
    price: 20500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up saldo GoPay instan 24 jam"
  },
  {
    buyer_sku_code: "OVO-50",
    product_name: "Saldo OVO Cash Rp 50.000",
    category: "E-MONEY",
    brand: "OVO",
    price: 50600,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Top up instan nomor akun OVO terdaftar"
  },
  {
    buyer_sku_code: "SPAY-50",
    product_name: "Saldo ShopeePay Rp 50.000",
    category: "E-MONEY",
    brand: "SHOPEEPAY",
    price: 50500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Langsung masuk ke ShopeePay akun pembeli"
  },

  // 4. PLN Listrik
  {
    buyer_sku_code: "PLN-20",
    product_name: "Token Listrik PLN Prabayar Rp 20.000",
    category: "PLN",
    brand: "PLN",
    price: 20500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "20 digit kode stroom token PLN instan"
  },
  {
    buyer_sku_code: "PLN-50",
    product_name: "Token Listrik PLN Prabayar Rp 50.000",
    category: "PLN",
    brand: "PLN",
    price: 50500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "20 digit kode stroom token PLN instan"
  },
  {
    buyer_sku_code: "PLN-100",
    product_name: "Token Listrik PLN Prabayar Rp 100.000",
    category: "PLN",
    brand: "PLN",
    price: 100500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "20 digit kode stroom token PLN instan"
  },

  // 5. Voucher & Pascabayar
  {
    buyer_sku_code: "VOUCH-GOOGLE-50",
    product_name: "Voucher Google Play Store Rp 50.000",
    category: "VOUCHER",
    brand: "GOOGLE PLAY",
    price: 52000,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "prepaid",
    desc: "Kode voucher digital Google Play Indonesia"
  },
  {
    buyer_sku_code: "PASCA-PLN",
    product_name: "Tagihan Listrik PLN Pascabayar",
    category: "PLN",
    brand: "PLN PASCABAYAR",
    price: 2500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "pasca",
    desc: "Cek & bayar tagihan listrik bulanan resmi"
  },
  {
    buyer_sku_code: "PASCA-BPJS",
    product_name: "Tagihan BPJS Kesehatan",
    category: "BPJS",
    brand: "BPJS KESEHATAN",
    price: 2500,
    buyer_product_status: true,
    seller_product_status: true,
    stock: 9999,
    cmd_type: "pasca",
    desc: "Bayar iuran BPJS Kesehatan keluarga"
  }
];

const PPOB_CATEGORIES = [
  { id: "all", name: "Semua Layanan", icon: Layers, match: [] },
  { id: "games", name: "Game Top Up", icon: Gamepad2, match: ["GAMES", "GAME"] },
  { id: "pulsa", name: "Pulsa & Data", icon: Smartphone, match: ["PULSA", "DATA"] },
  { id: "emoney", name: "E-Wallet", icon: WalletIcon, match: ["E-MONEY", "E-WALLET", "SALDO"] },
  { id: "pln", name: "Listrik PLN", icon: Zap, match: ["PLN"] },
  { id: "voucher", name: "Voucher Digital", icon: Ticket, match: ["VOUCHER"] },
  { id: "pasca", name: "Pascabayar", icon: FileText, match: ["PASCABAYAR", "BPJS", "PDAM"] },
];

export default function DashboardServicesPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<PPOBServiceItem[]>([]);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCmdType, setSelectedCmdType] = useState<"all" | "prepaid" | "pasca">("all");
  const [sortBy, setSortBy] = useState<"CHEAPEST" | "PRICIEST" | "NAME">("CHEAPEST");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Fetch catalog from API
  const fetchServices = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/digiflazz/products?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setServices(data.data);
      } else {
        setServices(FALLBACK_PPOB_SERVICES);
      }
    } catch (e) {
      console.warn("Menggunakan katalog lokal PPOB:", e);
      setServices(FALLBACK_PPOB_SERVICES);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, []);

  // Distinct brand list from current dataset
  const brandList = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.brand) set.add(s.brand.toUpperCase());
    });
    return Array.from(set).sort();
  }, [services]);

  // Filtered & Sorted services
  const filteredServices = useMemo(() => {
    const activeCat = PPOB_CATEGORIES.find((c) => c.id === selectedCatId);

    return services
      .filter((item) => {
        const q = search.toLowerCase().trim();
        const matchesSearch =
          item.buyer_sku_code.toLowerCase().includes(q) ||
          item.product_name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);

        // Category filter
        let matchesCategory = true;
        if (selectedCatId === "pasca") {
          matchesCategory = item.cmd_type === "pasca";
        } else if (activeCat && activeCat.match.length > 0) {
          matchesCategory = activeCat.match.some((m) =>
            item.category.toUpperCase().includes(m)
          );
        }

        // Brand filter
        const matchesBrand =
          selectedBrand === "all" || item.brand.toUpperCase() === selectedBrand;

        // Command type filter
        const matchesCmd =
          selectedCmdType === "all" || item.cmd_type === selectedCmdType;

        return matchesSearch && matchesCategory && matchesBrand && matchesCmd;
      })
      .sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (sortBy === "CHEAPEST") return priceA - priceB;
        if (sortBy === "PRICIEST") return priceB - priceA;
        if (sortBy === "NAME") return a.product_name.localeCompare(b.product_name);
        return 0;
      });
  }, [services, search, selectedCatId, selectedBrand, selectedCmdType, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCatId, selectedBrand, selectedCmdType, sortBy, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredServices.length);

  const paginatedServices = useMemo(() => {
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, startIndex, endIndex]);

  const copySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
    toast({
      title: "SKU Disalin",
      description: `Kode SKU "${sku}" berhasil disalin ke clipboard.`
    });
  };

  if (!mounted) return null;

  return (
    <main className="p-3 sm:p-5 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div className="hidden md:block space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Layanan PPOB & Top Up
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Daftar seluruh layanan produk PPOB (Pulsa, Paket Data, Game, E-Wallet, Token PLN, Voucher & Pascabayar).
          </p>
        </div>

        {/* Action Buttons: Refresh, Topup Hub, & Marketplace Products */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchServices}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 gap-1.5"
            title="Muat ulang data PPOB"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin text-[#00AA5B]")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link href="/topup">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Top Up Hub</span>
            </Button>
          </Link>

          <Link href="/dashboard/products">
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-bold bg-[#00AA5B] hover:bg-[#00924E] text-white rounded-lg shadow-2xs gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Katalog Produk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {PPOB_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0",
                isActive
                  ? "bg-[#00AA5B] text-white border-[#00AA5B] font-semibold shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. PPOB Services Table Unified Card */}
      <Card className="border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl bg-white overflow-hidden">
        {/* Card Toolbar */}
        <div className="p-3 sm:p-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari SKU, layanan, brand (contoh: ML-86, Telkomsel, DANA)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-slate-50/60 border-slate-200 rounded-lg placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00AA5B]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Brand */}
            <div className="flex items-center gap-1 bg-slate-50/70 border border-slate-200 rounded-lg px-2 h-8">
              <Store className="w-3 h-3 text-slate-500 shrink-0" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1 max-w-[130px] truncate"
              >
                <option value="all">Semua Brand</option>
                {brandList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Tipe (Prabayar/Pascabayar) */}
            <div className="flex items-center gap-1 bg-slate-50/70 border border-slate-200 rounded-lg px-2 h-8">
              <select
                value={selectedCmdType}
                onChange={(e) => setSelectedCmdType(e.target.value as any)}
                className="bg-transparent text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">Semua Tipe</option>
                <option value="prepaid">Prabayar</option>
                <option value="pasca">Pascabayar</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1 bg-slate-50/70 border border-slate-200 rounded-lg px-2 h-8">
              <SlidersHorizontal className="w-3 h-3 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="CHEAPEST">Harga Terendah</option>
                <option value="PRICIEST">Harga Tertinggi</option>
                <option value="NAME">Nama A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. PPOB Services Table (Clean 6 Columns) */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[620px]">
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-28 text-left">Kode / SKU</th>
                <th className="py-2.5 px-3 text-left">Layanan PPOB</th>
                <th className="py-2.5 px-3 text-left w-28">Kategori</th>
                <th className="py-2.5 px-3 text-left w-36">Provider</th>
                <th className="py-2.5 px-3 text-right w-28">Harga</th>
                <th className="py-2.5 px-3 text-center w-24">Status</th>
                <th className="py-2.5 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`service-skel-${idx}`} className="border-b border-slate-100/70">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Skeleton className="h-6 w-20 rounded" />
                    </td>
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-44 sm:w-56" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <Skeleton className="h-7 w-20 mx-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200 text-slate-400">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Tidak ada layanan ditemukan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                      Tidak ada produk PPOB yang cocok dengan pencarian &quot;{search}&quot;.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setSelectedCatId("all");
                        setSelectedBrand("all");
                        setSelectedCmdType("all");
                      }}
                      className="mt-2.5 h-7 px-3 text-[11px] font-semibold rounded-lg"
                    >
                      Reset Filter
                    </Button>
                  </td>
                </tr>
              ) : (
                paginatedServices.map((service) => {
                  const isAvailable =
                    service.buyer_product_status && service.seller_product_status;
                  const isCopied = copiedSku === service.buyer_sku_code;

                  return (
                    <tr
                      key={service.buyer_sku_code}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* 1. Kode / SKU */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                          <span>{service.buyer_sku_code}</span>
                          <button
                            type="button"
                            onClick={() => copySku(service.buyer_sku_code)}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Salin SKU"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-[#00AA5B]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Layanan PPOB */}
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 text-xs sm:text-[13px] leading-tight block">
                            {service.product_name}
                          </span>
                          {service.desc && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1">
                              {service.desc}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 3. Kategori */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-semibold text-slate-600 bg-slate-50 border-slate-200 px-1.5 py-0 rounded"
                        >
                          {service.category || "PPOB"}
                        </Badge>
                      </td>

                      {/* 4. Brand / Provider */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-700 text-xs">
                          {service.brand || "Operator"}
                        </span>
                      </td>

                      {/* 5. Harga (Smaller Rp unit) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">Rp</span>
                          <span className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                            {(service.price || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00AA5B] border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Gangguan</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Aksi */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Link href={`/topup?search=${encodeURIComponent(service.brand || service.product_name)}`}>
                          <Button
                            size="sm"
                            className="h-7 px-2.5 rounded-lg bg-[#00AA5B] hover:bg-[#00924E] text-white text-[11px] font-bold gap-1 shadow-2xs"
                          >
                            <span>Beli</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span>
              Menampilkan <b>{filteredServices.length === 0 ? 0 : startIndex + 1}</b> - <b>{endIndex}</b> dari <b>{filteredServices.length}</b> layanan
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Baris:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className="h-7 w-14 text-xs bg-white rounded-md border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-xs font-medium rounded-md border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              <span>Prev</span>
            </Button>
            <span className="text-xs font-semibold text-slate-600 px-1">
              {validPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2.5 text-xs font-medium rounded-md border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
