"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Zap, ArrowRight } from "lucide-react";
import { detectOperatorFromPhone, normalizePhoneNumber } from "@/lib/operator-detector";
import { formatProductName } from "@/lib/format-product";

interface SkuOption {
  buyer_sku_code: string;
  product_name: string;
  price: number;
  desc?: string;
  category?: string;
  brand?: string;
}

const EMONEY_BRANDS = [
  { brand: "DANA", name: "DANA", icon: "https://cdn.marketpoint.id/gallery/icon/17aee6a5-92a1-4e99-b038-9e238ba6eb8c.png" },
  { brand: "GO PAY", name: "GoPay", icon: "https://cdn.marketpoint.id/gallery/icon/8f9627a6-063e-4799-a2e0-4e59d24abf95.png" },
  { brand: "SHOPEE PAY", name: "ShopeePay", icon: "https://cdn.marketpoint.id/gallery/icon/01d1d780-bcd1-429e-ba26-718ea02646c9.png" },
  { brand: "LinkAja", name: "LinkAja", icon: "https://cdn.marketpoint.id/gallery/icon/11cf2788-8c1e-4bcf-8d4e-885ff51b484a.png" },
];

export function HomeTopUpWidget() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("pulsa");
  const [phone, setPhone] = useState<string>("");
  const [plnId, setPlnId] = useState<string>("");

  const [detectedOp, setDetectedOp] = useState<{
    brand: string;
    name: string;
    iconUrl?: string | null;
  } | null>(null);

  const [skus, setSkus] = useState<SkuOption[]>([]);
  const [loadingSkus, setLoadingSkus] = useState<boolean>(false);
  const [selectedSkuCode, setSelectedSkuCode] = useState<string>("");

  const [plnSkus, setPlnSkus] = useState<SkuOption[]>([]);
  const [selectedPlnSkuCode, setSelectedPlnSkuCode] = useState<string>("");
  const [loadingPln, setLoadingPln] = useState<boolean>(false);

  const [selectedEmoneyBrand, setSelectedEmoneyBrand] = useState<string>("DANA");
  const [emoneyPhone, setEmoneyPhone] = useState<string>("");
  const [emoneySkus, setEmoneySkus] = useState<SkuOption[]>([]);
  const [selectedEmoneySkuCode, setSelectedEmoneySkuCode] = useState<string>("");
  const [loadingEmoney, setLoadingEmoney] = useState<boolean>(false);

  // Instant prefix check on phone change
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9+]/g, "");
    setPhone(raw);
    setSelectedSkuCode("");

    const norm = normalizePhoneNumber(raw);
    const op = detectOperatorFromPhone(norm);
    if (op) {
      setDetectedOp((prev) => ({
        brand: op.brand,
        name: op.name,
        iconUrl: op.iconUrl || prev?.iconUrl || null,
      }));
    } else {
      setDetectedOp(null);
      setSkus([]);
    }
  };

  // Fetch SKUs from API when phone number or active tab changes
  useEffect(() => {
    if (activeTab === "listrik" || activeTab === "emoney") return;

    const norm = normalizePhoneNumber(phone);
    if (norm.length < 4) {
      setSkus([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSkus(true);
      try {
        const typeParam = activeTab === "paket-data" ? "data" : "pulsa";
        const res = await fetch(`/api/topup/operator-check?phone=${encodeURIComponent(norm)}&type=${typeParam}`);
        const data = await res.json();

        if (data.success && data.detected && data.operator) {
          setDetectedOp({
            brand: data.operator.brand,
            name: data.operator.name,
            iconUrl: data.operator.iconUrl,
          });
          setSkus(data.skus || []);
        } else {
          setSkus([]);
        }
      } catch (err) {
        console.error("Gagal memeriksa operator:", err);
      } finally {
        setLoadingSkus(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [phone, activeTab]);

  // Load PLN tokens once if tab switched to PLN
  useEffect(() => {
    if (activeTab === "listrik" && plnSkus.length === 0) {
      setLoadingPln(true);
      fetch("/api/admin/digiflazz/products?brand=PLN&status=active&sort=price_asc")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setPlnSkus(d.data);
          }
        })
        .catch((e) => console.error("Gagal mengambil token PLN:", e))
        .finally(() => setLoadingPln(false));
    }
  }, [activeTab, plnSkus.length]);

  useEffect(() => {
    if (activeTab === "emoney") {
      setLoadingEmoney(true);
      fetch(`/api/admin/digiflazz/products?brand=${encodeURIComponent(selectedEmoneyBrand)}&status=active&sort=price_asc`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setEmoneySkus(d.data);
          }
        })
        .catch((e) => console.error("Gagal mengambil produk E-Money:", e))
        .finally(() => setLoadingEmoney(false));
    }
  }, [activeTab, selectedEmoneyBrand]);

  const handleBuy = () => {
    if (activeTab === "listrik") {
      if (!plnId.trim() || !selectedPlnSkuCode) return;
      router.push(`/checkout?sku=${encodeURIComponent(selectedPlnSkuCode)}&target=${encodeURIComponent(plnId.trim())}`);
      return;
    }

    if (activeTab === "emoney") {
      const targetPhone = emoneyPhone || phone;
      const norm = normalizePhoneNumber(targetPhone);
      if (!norm || !selectedEmoneySkuCode) return;
      router.push(`/checkout?sku=${encodeURIComponent(selectedEmoneySkuCode)}&target=${encodeURIComponent(norm)}`);
      return;
    }

    const norm = normalizePhoneNumber(phone);
    if (!norm || !selectedSkuCode) return;
    router.push(`/checkout?sku=${encodeURIComponent(selectedSkuCode)}&target=${encodeURIComponent(norm)}`);
  };

  const isBuyDisabled =
    activeTab === "listrik"
      ? !plnId.trim() || !selectedPlnSkuCode
      : activeTab === "emoney"
        ? normalizePhoneNumber(emoneyPhone || phone).length < 4 || !selectedEmoneySkuCode
        : normalizePhoneNumber(phone).length < 4 || !selectedSkuCode;

  return (
    <Card className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm flex-1">
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedSkuCode(""); }} className="w-full h-full flex flex-col">
        <div className="w-full border-b border-border bg-white">
          <TabsList className="bg-transparent h-12 w-full p-0 grid grid-cols-4 items-center rounded-none border-none">
            <TabsTrigger
              value="pulsa"
              className="w-full h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs flex items-center justify-center transition-all"
            >
              Pulsa
            </TabsTrigger>
            <TabsTrigger
              value="paket-data"
              className="w-full h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs flex items-center justify-center transition-all"
            >
              Paket Data
            </TabsTrigger>
            <TabsTrigger
              value="listrik"
              className="w-full h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs flex items-center justify-center transition-all"
            >
              Listrik PLN
            </TabsTrigger>
            <TabsTrigger
              value="emoney"
              className="w-full h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-xs flex items-center justify-center transition-all"
            >
              E-Money
            </TabsTrigger>
          </TabsList>
        </div>

        {(activeTab === "pulsa" || activeTab === "paket-data") && (
          <TabsContent value={activeTab} className="p-4 sm:p-6 mt-0 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nomor Telepon
                </Label>
                <div className="relative flex items-center">
                  <Input
                    type="tel"
                    placeholder="Masukkan Nomor"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="h-11 rounded-xl bg-muted/20 border-border text-xs sm:text-sm font-bold placeholder:text-xs placeholder:font-normal pr-11 focus:bg-white focus:border-[#00AA5B] transition-all"
                  />
                  <div className="absolute right-2.5 flex items-center pointer-events-none">
                    {detectedOp ? (
                      detectedOp.iconUrl ? (
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-border/80 bg-white flex items-center justify-center shadow-xs">
                          <img
                            src={detectedOp.iconUrl}
                            alt={detectedOp.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-border/80 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-xs">
                          {detectedOp.name.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Nominal Select */}
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nominal {activeTab === "paket-data" ? "Paket Data" : "Pulsa"}
                </Label>
                <Select
                  value={selectedSkuCode || undefined}
                  onValueChange={setSelectedSkuCode}
                  disabled={loadingSkus || skus.length === 0}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border font-bold text-xs px-2.5">
                    <SelectValue
                      placeholder={
                        loadingSkus
                          ? "Memuat..."
                          : skus.length > 0
                            ? "Pilih Nominal"
                            : detectedOp
                              ? "Pilihan tidak tersedia"
                              : "..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    {skus.map((item) => (
                      <SelectItem
                        key={item.buyer_sku_code}
                        value={item.buyer_sku_code}
                        className="text-xs font-semibold py-2"
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-bold text-slate-800">
                            {formatProductName(item.product_name, item.brand || detectedOp?.brand)}
                          </span>
                          <span className="font-black text-[#00AA5B] shrink-0">
                            Rp {item.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beli Button */}
              <div className="md:col-span-2">
                <Button
                  onClick={handleBuy}
                  disabled={isBuyDisabled}
                  className={`w-full h-11 rounded-xl font-bold text-xs shadow-none transition-all ${isBuyDisabled
                    ? "bg-[#E5E7E9] text-muted-foreground cursor-not-allowed"
                    : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer shadow-md shadow-[#00AA5B]/20"
                    }`}
                >
                  Beli
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Tab: Listrik PLN */}
        {activeTab === "listrik" && (
          <TabsContent value="listrik" className="p-4 sm:p-6 mt-0 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
              {/* PLN Customer ID */}
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nomor Meter / ID Pelanggan PLN
                </Label>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Masukkan No. Meter / ID Pelanggan"
                    value={plnId}
                    onChange={(e) => setPlnId(e.target.value.replace(/[^0-9]/g, ""))}
                    className="h-11 rounded-xl bg-muted/20 border-border text-xs font-bold placeholder:text-xs placeholder:font-normal px-3.5 focus:bg-white focus:border-[#00AA5B] transition-all"
                  />
                </div>
              </div>

              {/* PLN Token Nominal Select */}
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nominal Token PLN
                </Label>
                <Select
                  value={selectedPlnSkuCode || undefined}
                  onValueChange={setSelectedPlnSkuCode}
                  disabled={loadingPln || plnSkus.length === 0}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border font-bold text-xs px-2.5">
                    <SelectValue
                      placeholder={loadingPln ? "Memuat..." : "Pilih Nominal"}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    {plnSkus.map((item) => (
                      <SelectItem
                        key={item.buyer_sku_code}
                        value={item.buyer_sku_code}
                        className="text-xs font-semibold py-2"
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-bold text-slate-800">
                            {formatProductName(item.product_name, "PLN")}
                          </span>
                          <span className="font-black text-[#00AA5B] shrink-0">
                            Rp {(item.price || 0).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beli Button */}
              <div className="md:col-span-2">
                <Button
                  onClick={handleBuy}
                  disabled={isBuyDisabled}
                  className={`w-full h-11 rounded-xl font-bold text-xs shadow-none transition-all ${isBuyDisabled
                    ? "bg-[#E5E7E9] text-muted-foreground cursor-not-allowed"
                    : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer shadow-md shadow-[#00AA5B]/20"
                    }`}
                >
                  Beli
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Tab: E-Money */}
        {activeTab === "emoney" && (
          <TabsContent value="emoney" className="p-4 sm:p-6 mt-0 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
              {/* E-Money Brand Select */}
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Pilih E-Money
                </Label>
                <Select
                  value={selectedEmoneyBrand}
                  onValueChange={(val) => {
                    setSelectedEmoneyBrand(val);
                    setSelectedEmoneySkuCode("");
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border font-bold text-xs px-2.5">
                    <SelectValue placeholder="Pilih E-Money" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {EMONEY_BRANDS.map((item) => (
                      <SelectItem key={item.brand} value={item.brand} className="text-xs font-semibold py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-border/50 bg-white flex items-center justify-center">
                            <img src={item.icon} alt={item.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone / Account Number */}
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nomor Akun / Telepon
                </Label>
                <div className="relative flex items-center">
                  <Input
                    type="tel"
                    placeholder="Masukkan Nomor"
                    value={emoneyPhone || phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9+]/g, "");
                      setEmoneyPhone(clean);
                      setSelectedEmoneySkuCode("");
                    }}
                    className="h-11 rounded-xl bg-muted/20 border-border text-xs font-bold placeholder:text-xs placeholder:font-normal pr-10 focus:bg-white focus:border-[#00AA5B] transition-all"
                  />
                  <div className="absolute right-2 flex items-center pointer-events-none">
                    {(() => {
                      const cur = EMONEY_BRANDS.find((b) => b.brand === selectedEmoneyBrand);
                      return cur?.icon ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border/80 bg-white flex items-center justify-center shadow-xs">
                          <img src={cur.icon} alt={cur.name} className="w-full h-full object-cover rounded-full" />
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Nominal Select */}
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                  Nominal Saldo
                </Label>
                <Select
                  value={selectedEmoneySkuCode || undefined}
                  onValueChange={setSelectedEmoneySkuCode}
                  disabled={loadingEmoney || emoneySkus.length === 0}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border font-bold text-xs px-2.5">
                    <SelectValue
                      placeholder={
                        loadingEmoney
                          ? "Memuat..."
                          : emoneySkus.length > 0
                            ? "Pilih Nominal"
                            : "..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    {emoneySkus.map((item) => (
                      <SelectItem
                        key={item.buyer_sku_code}
                        value={item.buyer_sku_code}
                        className="text-xs font-semibold py-2"
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-bold text-slate-800">
                            {formatProductName(item.product_name, selectedEmoneyBrand)}
                          </span>
                          <span className="font-black text-[#00AA5B] shrink-0">
                            Rp {item.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beli Button */}
              <div className="md:col-span-2">
                <Button
                  onClick={handleBuy}
                  disabled={isBuyDisabled}
                  className={`w-full h-11 rounded-xl font-bold text-xs shadow-none transition-all ${isBuyDisabled
                    ? "bg-[#E5E7E9] text-muted-foreground cursor-not-allowed"
                    : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer shadow-md shadow-[#00AA5B]/20"
                    }`}
                >
                  Beli
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}
