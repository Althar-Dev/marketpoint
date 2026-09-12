"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronDown,
  ArrowLeft,
  Search, 
  ShoppingBag, 
  Menu,
  XCircle,
  Store,
  Star,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();

  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("st") === "toko" ? "toko" : "produk";

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"produk" | "toko">(initialTab);
  const [sortBy, setSortBy] = useState("paling-sesuai");
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [firestoreShops, setFirestoreShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Sync searchQuery & activeTab when searchParams change
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    if (searchParams.get("st") === "toko") {
      setActiveTab("toko");
    } else {
      setActiveTab("produk");
    }
  }, [searchParams]);

  // Fetch real products from PostgreSQL API & combine with Firestore shop data
  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        let rawProducts = data.products && Array.isArray(data.products) ? data.products : [];

        if (db) {
          try {
            const shopsSnap = await getDocs(collection(db, "shops"));
            const shopsMap: Record<string, any> = {};
            const shopDocs: any[] = [];

            shopsSnap.forEach((docSnap) => {
              const shopData = docSnap.data() || {};
              shopsMap[docSnap.id] = shopData;

              let shopCity = "";
              const rawCity = shopData.city || shopData.location || shopData.district || shopData.province || shopData.address;
              if (typeof rawCity === "string" && rawCity.trim().length > 0) {
                shopCity = rawCity.trim();
              } else if (rawCity && typeof rawCity === "object") {
                shopCity = rawCity.city || rawCity.cityName || rawCity.district || rawCity.province || rawCity.address || "";
              }

              shopDocs.push({
                ...shopData,
                id: docSnap.id,
                name: shopData.shopName || shopData.name || "Toko",
                slug: shopData.slug || docSnap.id,
                city: shopCity || "Jakarta Pusat",
                logo: shopData.logoUrl || shopData.photoURL || shopData.logo,
                isVerified: shopData.isVerified ?? true,
                isOfficial: shopData.isOfficial ?? (shopData.slug === "marketpoint" || docSnap.id === "marketpoint" || (shopData.isOfficialStore ?? true)),
              });
            });

            const extractString = (val: any): string => {
              if (!val) return "";
              if (typeof val === "string") return val;
              if (typeof val === "object") {
                if (typeof val.city === "string" && val.city) return val.city;
                if (typeof val.province === "string" && val.province) return val.province;
                if (typeof val.district === "string" && val.district) return val.district;
                if (typeof val.address === "string" && val.address) return val.address;
                if (typeof val.name === "string" && val.name) return val.name;
              }
              return "";
            };

            rawProducts = rawProducts.map((p: any) => {
              const shop = shopsMap[p.shopId];
              const realName = extractString(shop?.shopName) || extractString(shop?.name) || extractString(shop?.title) || extractString(shop?.slug);
              const fallbackName = typeof p.shopName === "string" && p.shopName && p.shopName !== "MarketPoint Seller"
                ? p.shopName
                : (p.shopId ? `Toko ${p.shopId.substring(0, 6)}` : "Toko Seller");

              const rawCity = extractString(shop?.city) || extractString(shop?.province) || extractString(shop?.location) || extractString(shop?.address) || extractString(p.shopCity);

              return {
                ...p,
                shopName: realName || fallbackName,
                shopLogoUrl: shop?.logoUrl || shop?.logo || shop?.avatar || shop?.photoUrl || p.shopLogoUrl || "",
                shopIsVerified: shop?.isVerified ?? shop?.verified ?? shop?.is_verified ?? p.shopIsVerified ?? false,
                shopIsOfficial: shop?.isOfficial ?? shop?.official ?? shop?.is_official ?? p.shopIsOfficial ?? false,
                shopCity: rawCity || "Jakarta Pusat",
              };
            });

            if (isSubscribed) {
              setFirestoreShops(shopDocs);
            }
          } catch (err) {
            console.error("Error fetching Firestore shops in search:", err);
          }
        }

        if (isSubscribed) {
          setAllProducts(rawProducts);
        }
      } catch (err) {
        console.error("Error loading search products:", err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [db]);

  // Live autocomplete suggestions when overlay is open
  useEffect(() => {
    if (isOverlayOpen && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      
      const matchedShops = firestoreShops
        .filter((s: any) =>
          s.name?.toLowerCase().includes(query) ||
          s.slug?.toLowerCase().includes(query) ||
          s.city?.toLowerCase().includes(query)
        )
        .map((s: any) => ({ ...s, suggestionType: "shop" }));

      const matchedProducts = allProducts
        .filter((p: any) => p.title?.toLowerCase().includes(query))
        .map((p: any) => ({ ...p, suggestionType: "product" }));

      const combined = [
        ...matchedShops.slice(0, 3),
        ...matchedProducts.slice(0, 6)
      ];

      setSuggestions(combined);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, isOverlayOpen, allProducts, firestoreShops]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsOverlayOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}&st=${activeTab}`);
  };

  const handleTabChange = (tab: "produk" | "toko") => {
    setActiveTab(tab);
    const query = searchQuery.trim();
    router.push(`/search?q=${encodeURIComponent(query)}&st=${tab}`);
  };

  const handleResetInput = () => {
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Filter products by current query
  const queryLower = (searchParams.get("q") || "").toLowerCase().trim();
  const productResults = queryLower
    ? allProducts.filter((p: any) =>
        p.title?.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower) ||
        p.categoryName?.toLowerCase().includes(queryLower)
      )
    : [];

  // Filter real Firestore shops by current query
  const shopResults = queryLower
    ? firestoreShops.filter((s: any) =>
        s.name?.toLowerCase().includes(queryLower) ||
        s.slug?.toLowerCase().includes(queryLower) ||
        s.city?.toLowerCase().includes(queryLower)
      )
    : [];

  // Sorting logic
  let sortedProducts = [...productResults];
  if (sortBy === "terbaru") {
    sortedProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } else if (sortBy === "harga-rendah") {
    sortedProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sortBy === "harga-tinggi") {
    sortedProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (sortBy === "ulasan") {
    sortedProducts.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0));
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pt-0 md:pt-16 pb-16 md:pb-12">
      {/* DESKTOP HEADER (width >= 768px) */}
      <div className="hidden md:block">
        <MarketHeader />
      </div>

      {/* MOBILE HEADER (width < 768px) */}
      <header className="sticky top-0 z-40 bg-white border-b border-border px-3 py-2.5 flex items-center gap-2 shadow-2xs md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full shrink-0 hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Button>

        {/* Search Input Box */}
        <form 
          onSubmit={handleSearchSubmit} 
          onClick={() => setIsOverlayOpen(true)}
          className="flex-1 flex items-center gap-2 border border-foreground/30 focus-within:border-foreground rounded-xl px-3 py-1.5 bg-white transition-all cursor-pointer"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsOverlayOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari..."
            className="flex-1 bg-transparent text-xs font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/60 cursor-text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetInput();
              }}
              className="text-muted-foreground/60 hover:text-foreground shrink-0"
            >
              <XCircle className="w-4 h-4 fill-muted-foreground/30 text-white" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" title="Keranjang" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground">
            <ShoppingBag className="w-4.5 h-4.5" />
          </Button>
          <Button size="icon" variant="ghost" title="Menu" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground">
            <Menu className="w-4.5 h-4.5" />
          </Button>
        </div>
      </header>

      {/* MOBILE TABS (width < 768px) */}
      <div className="flex border-b border-border bg-white text-xs font-bold sticky top-[57px] z-30 shadow-2xs md:hidden">
        <button
          type="button"
          onClick={() => handleTabChange("produk")}
          className={cn(
            "flex-1 py-3 text-center border-b-2 transition-colors",
            activeTab === "produk"
              ? "border-[#00AA5B] text-[#00AA5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Produk
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("toko")}
          className={cn(
            "flex-1 py-3 text-center border-b-2 transition-colors",
            activeTab === "toko"
              ? "border-[#00AA5B] text-[#00AA5B]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Toko
        </button>
      </div>

      {/* DESKTOP TABS (width >= 768px) */}
      <div className="hidden md:block bg-white border-b border-border sticky top-16 z-30 shadow-2xs">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center gap-10">
          <button
            type="button"
            onClick={() => handleTabChange("produk")}
            className={cn(
              "py-3 flex items-center gap-2 font-bold text-base border-b-[3px] transition-colors -mb-[1px]",
              activeTab === "produk"
                ? "border-[#00AA5B] text-[#00AA5B]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className={cn("w-5 h-5", activeTab === "produk" ? "text-[#00AA5B]" : "text-muted-foreground")} />
            <span>Produk</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("toko")}
            className={cn(
              "py-3 flex items-center gap-2 font-bold text-base border-b-[3px] transition-colors -mb-[1px]",
              activeTab === "toko"
                ? "border-[#00AA5B] text-[#00AA5B]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Store className={cn("w-5 h-5", activeTab === "toko" ? "text-[#00AA5B]" : "text-muted-foreground")} />
            <span>Toko</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto p-2.5 sm:p-4 space-y-3 sm:space-y-4">

        {activeTab === "produk" ? (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 sm:h-64 rounded-xl bg-muted/40 animate-pulse border border-border" />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4">
                {sortedProducts.map((product: any) => {
                  const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png";
                  const price = Number(product.price || 0);
                  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
                  const discountPercent = discountPrice && discountPrice > price
                    ? `${Math.round(((discountPrice - price) / discountPrice) * 100)}%`
                    : null;
                  const rating = Number(product.ratingAvg || 5.0).toFixed(1);
                  const soldText = product.salesCount ? `${product.salesCount} terjual` : "0 terjual";

                  const shopName = typeof product.shopName === "string"
                    ? product.shopName
                    : (product.shopName && typeof product.shopName === "object" ? (product.shopName.name || product.shopName.shopName || "Toko Seller") : "Toko Seller");
                  const shopLogoUrl = typeof product.shopLogoUrl === "string" ? product.shopLogoUrl : "";
                  const isVerified = Boolean(product.shopIsVerified);
                  const isOfficial = Boolean(product.shopIsOfficial);
                  const shopCity = typeof product.shopCity === "string"
                    ? product.shopCity
                    : (product.shopCity && typeof product.shopCity === "object" ? (product.shopCity.city || product.shopCity.province || "") : "");

                  return (
                    <Link key={product.id} href={`/${product.shopSlug || 'marketpoint'}/${product.slug || product.id}`}>
                      <Card className="group border-border/70 shadow-2xs rounded-xl overflow-hidden bg-card hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer border-[1px] h-full">
                        <CardContent className="p-0 flex flex-col h-full">
                          <div className="relative aspect-square w-full bg-muted/20 overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={product.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {discountPercent && (
                              <div className="absolute top-1.5 left-1.5 bg-[#FF5E5E] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs">
                                {discountPercent}
                              </div>
                            )}
                          </div>

                          <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="text-[10px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                                {product.title}
                              </h4>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[#000000] text-[11px] sm:text-sm font-bold">
                                    Rp {price.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                {discountPrice && discountPrice > price && (
                                  <p className="text-[8px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                                    Rp {discountPrice.toLocaleString('id-ID')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
                                <span className="text-[9px] sm:text-[11px] font-medium text-muted-foreground">
                                  {rating} <span className="opacity-40">|</span> {soldText}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  {shopLogoUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={shopLogoUrl}
                                      alt={String(shopName)}
                                      className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                                    />
                                  ) : (
                                    <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                      <Store className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                  <span className="text-[9px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[60px] sm:max-w-[90px]">
                                    {String(shopName)}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {isVerified && (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src="/assets/badge/verified.png"
                                        alt="Verified"
                                        className="w-[14px] h-[14px] sm:w-[17px] sm:h-[17px] object-contain shrink-0"
                                      />
                                    )}
                                    {isOfficial && (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src="/assets/badge/officials.png"
                                        alt="Official"
                                        className="w-[14px] h-[14px] sm:w-[17px] sm:h-[17px] object-contain shrink-0"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Tokopedia Empty State for Produk */
              <div className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-border/60 my-6 shadow-xs">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00AA5B]/10 rounded-full flex items-center justify-center border border-[#00AA5B]/20">
                  <Store className="w-8 h-8 sm:w-10 sm:h-10 text-[#00AA5B]" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    Oops, produknya nggak ketemu
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    Coba kata kunci lain
                  </p>
                </div>
                <Button
                  onClick={() => setIsOverlayOpen(true)}
                  className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 sm:h-10 px-6 sm:px-8 shadow-sm transition-transform active:scale-95 w-full max-w-xs"
                >
                  Ganti Kata Kunci
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Tab Toko Results View */
          <div className="space-y-3 sm:space-y-4 w-full min-w-0 overflow-hidden">
            {queryLower && (
              <div className="text-xs sm:text-sm text-foreground/90 py-0.5 font-medium truncate">
                Menampilkan {shopResults.length > 0 ? `1 - ${shopResults.length}` : "0"} toko untuk <strong className="font-bold text-foreground">"{queryLower}"</strong>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-44 sm:h-56 rounded-2xl bg-muted/40 animate-pulse border border-border" />
                ))}
              </div>
            ) : shopResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
                {shopResults.map((shop: any) => {
                  // Find up to 3 products belonging to this shop
                  const shopProducts = allProducts
                    .filter((p: any) => p.shopId === shop.id || p.shopSlug === shop.slug || p.shopName === shop.name)
                    .slice(0, 3);

                  return (
                    <Card key={shop.id} className="border-border/80 bg-white rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
                      {/* Shop Header inside card */}
                      <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <Avatar className="h-9 w-9 sm:h-12 sm:w-12 rounded-full border border-border/80 shrink-0">
                            {shop.logo && <AvatarImage src={shop.logo} alt={shop.name} className="object-cover" />}
                            <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs sm:text-base font-black">
                              {shop.name ? shop.name.substring(0, 1) : "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-xs sm:text-base font-bold text-foreground truncate min-w-0">
                                {shop.name}
                              </span>
                              {shop.isVerified && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" />
                              )}
                              {shop.isOfficial && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/officials.png" alt="Official" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/80 truncate">
                              {shop.city || "Jakarta Pusat"}
                            </p>
                          </div>
                        </div>

                        <Button asChild variant="outline" className="border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10 font-bold rounded-lg sm:rounded-xl h-7 sm:h-8.5 text-[10px] sm:text-xs px-2 sm:px-3.5 shrink-0 transition-colors">
                          <Link href={`/${shop.slug || shop.id}`}>Lihat Toko</Link>
                        </Button>
                      </div>

                      {/* Products preview (3 items) or Empty box */}
                      {shopProducts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-0.5 sm:pt-1 w-full max-w-full overflow-hidden">
                          {shopProducts.map((p: any) => {
                            const pImg = p.images && p.images.length > 0 ? p.images[0].imageUrl : "https://cdn.marketpoint.id/marketpoint.png";
                            const pPrice = Number(p.price || 0);

                            return (
                              <Link
                                key={p.id}
                                href={`/${shop.slug || 'marketpoint'}/${p.slug || p.id}`}
                                className="flex flex-col space-y-1 group cursor-pointer min-w-0 w-full overflow-hidden"
                              >
                                <div className="relative aspect-square w-full rounded-xl bg-muted/20 overflow-hidden border border-border/50">
                                  <Image
                                    src={pImg}
                                    alt={p.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                                <span className="font-bold text-[10px] sm:text-xs text-[#E99C00] truncate block w-full">
                                  Rp {pPrice.toLocaleString('id-ID')}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-xl sm:rounded-2xl h-20 sm:h-24 flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground/60 font-medium border border-dashed border-border/60 w-full">
                          Tidak ada produk di toko ini
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Tokopedia Empty State for Toko */
              <div className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-border/60 my-6 shadow-xs w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#00AA5B]/10 rounded-full flex items-center justify-center border border-[#00AA5B]/20">
                  <Store className="w-8 h-8 sm:w-10 sm:h-10 text-[#00AA5B]" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    Oops, tokonya nggak ketemu
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground">
                    Coba kata kunci lain
                  </p>
                </div>
                <Button
                  onClick={() => setIsOverlayOpen(true)}
                  className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 sm:h-10 px-6 sm:px-8 shadow-sm transition-transform active:scale-95 w-full max-w-xs"
                >
                  Ganti Kata Kunci
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Search Overlay when input is focused/tapped */}
      {isOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150">
          <form onSubmit={handleSearchSubmit} className="p-3 sm:p-4 border-b border-border flex items-center gap-2.5 bg-white">
            <button
              type="button"
              onClick={() => setIsOverlayOpen(false)}
              className="p-1.5 rounded-full hover:bg-muted text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Input Box in Overlay */}
            <div className="flex-1 flex items-center gap-2 border border-foreground/30 focus-within:border-foreground rounded-xl px-3 py-1.5 bg-white transition-all">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleResetInput}
                  className="text-muted-foreground/60 hover:text-foreground shrink-0"
                >
                  <XCircle className="w-4 h-4 fill-muted-foreground/30 text-white" />
                </button>
              )}
              <button
                type="submit"
                className="text-xs sm:text-sm font-black text-foreground pl-1 hover:text-[#00AA5B] transition-colors shrink-0"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Autocomplete Suggestions */}
          <div className="flex-1 overflow-y-auto bg-white p-2 sm:p-3">
            {suggestions.length > 0 ? (
              <div className="space-y-0.5">
                {suggestions.map((item, idx) => {
                  if (item.suggestionType === "shop") {
                    return (
                      <Link
                        key={`shop-${item.id}-${idx}`}
                        href={`/${item.slug}`}
                        onClick={() => setIsOverlayOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/40 transition-colors group cursor-pointer"
                      >
                        <Avatar className="h-9 w-9 rounded-full border border-border/70 shrink-0">
                          {item.logo && <AvatarImage src={item.logo} alt={item.name} />}
                          <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-black">
                            {item.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#00AA5B] truncate">
                              {item.name}
                            </span>
                            {item.isVerified && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain shrink-0" />
                            )}
                            {item.isOfficial && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src="/assets/badge/officials.png" alt="Official Store" className="w-3.5 h-3.5 object-contain shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                            {item.city || "Jakarta Pusat"}
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={`prod-${item.id}-${idx}`}
                      href={`/${item.shopSlug || 'marketpoint'}/${item.slug || item.id}`}
                      onClick={() => setIsOverlayOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors group cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-[#00AA5B]" />
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-[#00AA5B]">
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground leading-relaxed">
                Tidak ada hasil rekomendasi untuk &quot;<span className="font-bold text-foreground">{searchQuery}</span>&quot;. Tekan <span className="font-bold text-[#00AA5B]">Cari</span> untuk melihat hasil lengkap.
              </div>
            ) : (
              <div className="p-2 text-xs font-medium text-muted-foreground">
                Ketik nama produk untuk mulai mencari...
              </div>
            )}
          </div>
        </div>
      )}

      <MarketFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00AA5B] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
