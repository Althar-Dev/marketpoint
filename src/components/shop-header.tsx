"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  ChevronLeft, 
  Search, 
  ShoppingBag, 
  Share2,
  XCircle,
  Store,
  SlidersHorizontal,
  ArrowUpDown,
  Menu,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

export function ShopHeader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"produk" | "toko">("produk");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [shopResults, setShopResults] = useState<any[]>([]);

  const db = useFirestore();
  const [realShops, setRealShops] = useState<any[]>([]);

  // Fetch products from PostgreSQL & real shops directly from Firestore "shops" collection
  useEffect(() => {
    if (showSearchOverlay && allProducts.length === 0) {
      fetch(`/api/products`)
        .then((res) => res.json())
        .then((data) => {
          if (data.products && Array.isArray(data.products)) {
            setAllProducts(data.products);
          }
        })
        .catch(() => {});
    }
  }, [showSearchOverlay, allProducts.length]);

  useEffect(() => {
    if (!showSearchOverlay || !db) return;
    getDocs(collection(db, "shops"))
      .then((snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data() || {};
          let shopCity = "";
          const rawCity = data.city || data.location || data.district || data.province || data.address;
          if (typeof rawCity === "string" && rawCity.trim().length > 0) {
            shopCity = rawCity.trim();
          } else if (rawCity && typeof rawCity === "object") {
            shopCity = rawCity.city || rawCity.cityName || rawCity.district || rawCity.province || rawCity.address || "";
          }
          if (!shopCity || typeof shopCity !== "string") {
            shopCity = "Jakarta Pusat";
          }

          return {
            ...data,
            id: doc.id,
            name: data.shopName || data.name || "Toko",
            slug: data.slug || doc.id,
            city: shopCity,
            logo: data.logoUrl || data.photoURL || data.logo,
            isVerified: data.isVerified ?? true,
            isOfficial: data.isOfficial ?? (data.slug === "marketpoint" || doc.id === "marketpoint" || (data.isOfficialStore ?? true)),
          };
        });
        setRealShops(docs);
      })
      .catch((err) => console.error("Error fetching Firestore shops:", err));
  }, [showSearchOverlay, db]);

  // Live Auto-Complete Suggestions as user types (Real Shops & Products combined)
  useEffect(() => {
    if (searchQuery.trim().length > 0 && !isSubmitted) {
      const query = searchQuery.toLowerCase().trim();

      const matchedShops = realShops
        .filter((s: any) =>
          s.name.toLowerCase().includes(query) ||
          s.slug.toLowerCase().includes(query) ||
          (s.city && s.city.toLowerCase().includes(query))
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
  }, [searchQuery, isSubmitted, allProducts, realShops]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setShowSearchOverlay(false);
    setIsSubmitted(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleResetInput = () => {
    setSearchQuery("");
    setIsSubmitted(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-14 md:h-16 flex items-center shadow-xs">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-3 w-full">
          {/* Back Button */}
          <div className="flex items-center gap-1 md:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="h-9 w-9 rounded-full hover:bg-muted"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
          </div>

          {/* Actions: Search Icon (Left of Cart) | Cart | Share */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                setShowSearchOverlay(true);
                setIsSubmitted(false);
              }}
              title="Cari produk"
              className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Search className="w-4.5 h-4.5" />
            </Button>

            <Button size="icon" variant="ghost" title="Keranjang" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <ShoppingBag className="w-4.5 h-4.5" />
            </Button>

            <Button size="icon" variant="ghost" title="Bagikan" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <Share2 className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Full-Screen Tokopedia-Style Search Overlay & Results View */}
      {showSearchOverlay && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150">
          {/* Header Row */}
          <form onSubmit={handleSearchSubmit} className="p-3 sm:p-4 border-b border-border flex items-center gap-2.5 bg-white">
            <button
              type="button"
              onClick={() => {
                setShowSearchOverlay(false);
                setIsSubmitted(false);
                setSearchQuery("");
              }}
              className="p-1.5 rounded-full hover:bg-muted text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Tokopedia-Style Input Box */}
            <div className="flex-1 flex items-center gap-2 border border-foreground/30 focus-within:border-foreground rounded-xl px-3 py-1.5 bg-white transition-all">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/60 placeholder:font-normal"
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

            {isSubmitted && (
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </button>
                <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground">
                  <Menu className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </form>

          {/* If Submitted: Tabs for Produk & Toko */}
          {isSubmitted && (
            <div className="flex border-b border-border bg-white text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("produk")}
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
                onClick={() => setActiveTab("toko")}
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
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto bg-muted/10">
            {!isSubmitted ? (
              /* Live Autocomplete Suggestions List */
              <div className="p-2 sm:p-4 space-y-1 bg-white">
                {suggestions.length > 0 ? (
                  <div className="space-y-0.5">
                    {suggestions.map((item, idx) => {
                      if (item.suggestionType === "shop") {
                        return (
                          <Link
                            key={`shop-${item.id}-${idx}`}
                            href={`/${item.slug}`}
                            onClick={() => setShowSearchOverlay(false)}
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
                                {item.city}
                              </span>
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <Link
                          key={`prod-${item.id}-${idx}`}
                          href={`/${item.shopSlug || 'marketpoint'}/${item.slug || item.id}`}
                          onClick={() => setShowSearchOverlay(false)}
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
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Tidak ada hasil rekomendasi untuk &quot;<span className="font-bold text-foreground">{searchQuery}</span>&quot;. Tekan <span className="font-bold text-[#00AA5B]">Cari</span> untuk melihat hasil lengkap.
                  </div>
                ) : (
                  <div className="p-4 text-xs font-semibold text-muted-foreground">
                    Ketik nama produk untuk mulai mencari...
                  </div>
                )}
              </div>
            ) : activeTab === "produk" ? (
              /* Tab Produk Results View */
              <div className="p-3 sm:p-4 space-y-4">
                {productResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {productResults.map((product: any) => {
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
                        <Link
                          key={product.id}
                          href={`/${product.shopSlug || 'marketpoint'}/${product.slug || product.id}`}
                          onClick={() => setShowSearchOverlay(false)}
                        >
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

                              <div className="p-2 sm:p-2.5 md:p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">
                                    {product.title}
                                  </h4>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[#000000] text-xs sm:text-sm font-bold">
                                        Rp {price.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                    {discountPrice && discountPrice > price && (
                                      <p className="text-[9px] sm:text-[10px] text-muted-foreground line-through opacity-60">
                                        Rp {discountPrice.toLocaleString('id-ID')}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFC400] fill-[#FFC400]" />
                                    <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
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
                                          className="w-[18px] h-[18px] rounded-md object-cover shrink-0 border border-border/80"
                                        />
                                      ) : (
                                        <div className="w-[18px] h-[18px] bg-[#00AA5B] rounded-xs flex items-center justify-center shrink-0">
                                          <Store className="w-2.5 h-2.5 text-white" />
                                        </div>
                                      )}
                                      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate max-w-[70px] sm:max-w-[90px]">
                                        {String(shopName)}
                                      </span>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {isVerified && (
                                          /* eslint-disable-next-line @next/next/no-img-element */
                                          <img
                                            src="/assets/badge/verified.png"
                                            alt="Verified"
                                            className="w-[17px] h-[17px] object-contain shrink-0"
                                          />
                                        )}
                                        {isOfficial && (
                                          /* eslint-disable-next-line @next/next/no-img-element */
                                          <img
                                            src="/assets/badge/officials.png"
                                            alt="Official"
                                            className="w-[17px] h-[17px] object-contain shrink-0"
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
                  /* Tokopedia Empty State for Produk (Reference Image 2) */
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-border/60 my-4 shadow-xs">
                    <div className="w-20 h-20 bg-[#00AA5B]/10 rounded-full flex items-center justify-center border border-[#00AA5B]/20">
                      <Store className="w-10 h-10 text-[#00AA5B]" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-base font-black text-foreground">
                        Oops, produknya nggak ketemu
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground">
                        Coba kata kunci lain
                      </p>
                    </div>
                    <Button
                      onClick={handleResetInput}
                      className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-10 px-8 shadow-sm transition-transform active:scale-95"
                    >
                      Ganti Kata Kunci
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Tab Toko Results View */
              <div className="p-3 sm:p-4 space-y-3">
                {shopResults.length > 0 ? (
                  shopResults.map((shop: any) => (
                    <Card key={shop.id} className="border-border/70 bg-white rounded-2xl overflow-hidden shadow-2xs p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 rounded-xl border border-border/80 shrink-0">
                            <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-sm font-black">
                              {shop.name.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground truncate">{shop.name}</span>
                              {shop.isVerified && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/verified.png" alt="Verified" className="w-3.5 h-3.5 object-contain shrink-0" />
                              )}
                              {shop.isOfficial && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="/assets/badge/officials.png" alt="Official Store" className="w-3.5 h-3.5 object-contain shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground">{shop.city || "Jakarta Pusat"}</p>
                          </div>
                        </div>
                        <Button asChild size="sm" className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs h-8 px-4 rounded-xl shrink-0">
                          <Link href={`/${shop.slug}`} onClick={() => setShowSearchOverlay(false)}>Lihat Toko</Link>
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  /* Tokopedia Empty State for Toko (Reference Image 2) */
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-border/60 my-4 shadow-xs">
                    <div className="w-20 h-20 bg-[#00AA5B]/10 rounded-full flex items-center justify-center border border-[#00AA5B]/20">
                      <Store className="w-10 h-10 text-[#00AA5B]" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <h3 className="text-base font-black text-foreground">
                        Oops, tokonya nggak ketemu
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground">
                        Coba kata kunci lain
                      </p>
                    </div>
                    <Button
                      onClick={handleResetInput}
                      className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-10 px-8 shadow-sm transition-transform active:scale-95"
                    >
                      Ganti Kata Kunci
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
