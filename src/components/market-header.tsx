"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingBag, 
  ChevronDown,
  Bell,
  MessageCircle,
  LayoutGrid,
  User as UserIcon,
  LogOut,
  Store,
  XCircle,
  Star,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, getDocs } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MarketHeader() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const shopDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);
  const { data: shopData } = useDoc(shopDocRef);

  const hasShop = Boolean(
    shopData && (shopData.name || shopData.shopName || shopData.slug || shopData.id || shopData.createdAt)
  );

  const rawPhoto = userData?.photoURL || user?.photoURL;
  const photoURL = rawPhoto === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : (rawPhoto || undefined);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [realShops, setRealShops] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch products & shops when search bar is focused or mobile overlay opened
  useEffect(() => {
    if ((isFocused || isMobileOverlayOpen) && allProducts.length === 0) {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          if (data.products && Array.isArray(data.products)) {
            setAllProducts(data.products);
          }
        })
        .catch(() => {});
    }
  }, [isFocused, isMobileOverlayOpen, allProducts.length]);

  useEffect(() => {
    if ((isFocused || isMobileOverlayOpen) && realShops.length === 0 && db) {
      getDocs(collection(db, "shops"))
        .then((snapshot) => {
          const docs = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() || {};
            const extractString = (val: any): string => {
              if (!val) return "";
              if (typeof val === "string") return val.trim();
              if (typeof val === "object") {
                return val.city || val.cityName || val.district || val.province || val.address || "";
              }
              return "";
            };
            const rawCity = extractString(data.city) || extractString(data.location) || extractString(data.province) || extractString(data.address);

            return {
              ...data,
              id: docSnap.id,
              name: data.shopName || data.name || "Toko",
              slug: data.slug || docSnap.id,
              city: rawCity || "Jakarta Pusat",
              logo: data.logoUrl || data.photoURL || data.logo,
              isVerified: Boolean(data.isVerified ?? data.verified ?? data.is_verified ?? true),
              isOfficial: Boolean(data.isOfficial ?? data.official ?? data.is_official ?? data.isOfficialStore ?? (data.slug === "marketpoint" || docSnap.id === "marketpoint" || true)),
              ratingAvg: data.ratingAvg || data.rating || 5.0,
            };
          });
          setRealShops(docs);
        })
        .catch((err) => console.error("Error fetching shops for search:", err));
    }
  }, [isFocused, isMobileOverlayOpen, realShops.length, db]);

  // Compute live search suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchedShops = realShops
        .filter((s: any) => s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q))
        .map((s: any) => ({ ...s, suggestionType: "shop" }));

      const matchedProducts = allProducts
        .filter((p: any) => p.title?.toLowerCase().includes(q))
        .map((p: any) => ({ ...p, suggestionType: "product" }));

      setSuggestions([...matchedShops.slice(0, 3), ...matchedProducts.slice(0, 6)]);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allProducts, realShops]);

  // Outside click listener to dismiss live suggestions overlay
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { title: "API Bridge", href: "/s?cat=api" },
    { title: "Source Code", href: "/s?cat=source" },
    { title: "Bot Automation", href: "/s?cat=bot" },
    { title: "AI GenKit", href: "/s?cat=ai" },
  ];

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 flex items-center",
      "bg-background border-b border-border shadow-sm"
    )}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center gap-4 md:gap-8 w-full">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src="/assets/img/logo.png" 
            alt="MarketPoint Logo" 
            className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col leading-none hidden sm:flex">
            <span className="text-[8px] font-bold uppercase tracking-widest text-primary/40">Market</span>
            <span className="font-headline font-bold text-base md:text-lg tracking-tighter">Point</span>
          </div>
        </Link>

        <div className="hidden lg:block">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-wider">
                Kategori <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 rounded-xl border-border" align="start">
              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.title} 
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-xs font-bold transition-all"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-primary/40" />
                    {link.title}
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Bar with Live Autocomplete Suggestions */}
        <div ref={searchContainerRef} className="flex-1 relative group">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setIsFocused(false);
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            className="relative flex items-center"
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              name="q"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsMobileOverlayOpen(true);
                }
              }}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsMobileOverlayOpen(true);
                }
              }}
              placeholder="Cari solusi infrastruktur, toko, atau API..." 
              className="h-10 pl-10 pr-9 rounded-xl bg-muted/40 border-border focus:bg-background focus:ring-2 focus:ring-[#00AA5B]/20 focus:border-[#00AA5B] transition-all text-xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <XCircle className="w-4 h-4 fill-muted-foreground/30 text-white" />
              </button>
            )}
          </form>

          {/* Autocomplete Suggestions Dropdown Overlay (Desktop Only) */}
          {isFocused && searchQuery.trim().length > 0 && (
            <div className="hidden md:block absolute top-full left-0 right-0 mt-1.5 bg-white border border-border/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-2 max-h-[380px] overflow-y-auto space-y-1 no-scrollbar">
                {suggestions.length > 0 ? (
                  suggestions.map((item: any, idx: number) => {
                    if (item.suggestionType === "shop") {
                      return (
                        <Link
                          key={`shop-${item.id}-${idx}`}
                          href={`/${item.slug}`}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                        >
                          <Avatar className="h-8 w-8 rounded-full border border-border/70 shrink-0">
                            {item.logo && <AvatarImage src={item.logo} alt={item.name} />}
                            <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                              {item.name ? item.name.substring(0, 1) : "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground group-hover:text-[#00AA5B] truncate">
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
                            <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                              <span>Toko</span>
                              <span className="opacity-40">•</span>
                              <div className="flex items-center gap-0.5 text-[#FFC400]">
                                <Star className="w-3 h-3 fill-[#FFC400]" />
                                <span className="text-foreground font-bold text-[10px]">
                                  {Number(item.ratingAvg || item.rating || 5.0).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={`prod-${item.id}-${idx}`}
                        href={`/${item.shopSlug || 'marketpoint'}/${item.slug || item.id}`}
                        onClick={() => setIsFocused(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#00AA5B]" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-[#00AA5B]">
                          {item.title}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Tidak ada hasil rekomendasi untuk &quot;<span className="font-bold text-foreground">{searchQuery}</span>&quot;. Tekan <span className="font-bold text-[#00AA5B]">Enter</span> untuk cari.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Full-Screen Mobile Search Overlay (Matching Image 1) */}
        {isMobileOverlayOpen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150 md:hidden">
            {/* Mobile Header Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setIsMobileOverlayOpen(false);
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="p-3 sm:p-4 border-b border-border flex items-center gap-2.5 bg-white"
            >
              <button
                type="button"
                onClick={() => setIsMobileOverlayOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Mobile Input Container matching Image 1 */}
              <div className="flex-1 flex items-center gap-2 border border-gray-600 focus-within:border-black rounded-full px-3.5 py-1.5 bg-white transition-all">
                <Search className="w-4 h-4 text-muted-foreground/80 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari..."
                  className="flex-1 bg-transparent text-xs font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground/60 hover:text-foreground shrink-0"
                  >
                    <XCircle className="w-4 h-4 fill-muted-foreground/30 text-white" />
                  </button>
                )}
                <button
                  type="submit"
                  className="text-xs font-bold text-foreground pl-1 hover:text-[#00AA5B] transition-colors shrink-0"
                >
                  Cari
                </button>
              </div>
            </form>

            {/* Mobile Overlay Suggestions / Empty State Body */}
            <div className="flex-1 overflow-y-auto bg-white p-4">
              {searchQuery.trim().length === 0 ? (
                <div className="text-xs font-medium text-muted-foreground/80">
                  Ketik nama produk untuk mulai mencari...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((item: any, idx: number) => {
                    if (item.suggestionType === "shop") {
                      return (
                        <Link
                          key={`mobile-shop-${item.id}-${idx}`}
                          href={`/${item.slug}`}
                          onClick={() => setIsMobileOverlayOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                        >
                          <Avatar className="h-9 w-9 rounded-full border border-border/70 shrink-0">
                            {item.logo && <AvatarImage src={item.logo} alt={item.name} />}
                            <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                              {item.name ? item.name.substring(0, 1) : "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground group-hover:text-[#00AA5B] truncate">
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
                            <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                              <span>Toko</span>
                              <span className="opacity-40">•</span>
                              <div className="flex items-center gap-0.5 text-[#FFC400]">
                                <Star className="w-3 h-3 fill-[#FFC400]" />
                                <span className="text-foreground font-bold text-[10px]">
                                  {Number(item.ratingAvg || item.rating || 5.0).toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={`mobile-prod-${item.id}-${idx}`}
                        href={`/${item.shopSlug || 'marketpoint'}/${item.slug || item.id}`}
                        onClick={() => setIsMobileOverlayOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#00AA5B]" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-[#00AA5B]">
                          {item.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Tidak ada hasil rekomendasi untuk &quot;<span className="font-bold text-foreground">{searchQuery}</span>&quot;. Tekan <span className="font-bold text-[#00AA5B]">Cari</span> untuk cari.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Area */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-1">
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <ShoppingBag className="w-4.5 h-4.5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <Bell className="w-4.5 h-4.5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl h-9 w-9 text-muted-foreground">
              <MessageCircle className="w-4.5 h-4.5" />
            </Button>
          </div>

          {/* Toko Button (Desktop Only - Only if user has a shop) */}
          {user && hasShop && (
            <Button
              asChild
              variant="ghost"
              className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/10 transition-colors"
            >
              <Link href="/my-shop">
                <Store className="w-4 h-4 text-[#00AA5B] shrink-0" />
                <span className="truncate max-w-[100px] lg:max-w-[130px]">
                  {shopData?.name || shopData?.shopName || "Toko Saya"}
                </span>
              </Link>
            </Button>
          )}

          <div className="flex items-center">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center outline-none group cursor-pointer">
                    <Avatar className="h-8 w-8 rounded-full border border-border transition-transform group-hover:scale-105">
                      <AvatarImage 
                        src={photoURL} 
                        alt={user.displayName || "User"} 
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-[#00AA5B] text-white text-[10px] font-bold">
                        {user.displayName?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase() || "MP"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border p-2">
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-xs font-bold text-foreground truncate">{user.displayName || "User MarketPoint"}</p>
                      <p className="text-[10px] font-medium text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
                    <Link href="/profile" className="flex items-center gap-2 text-xs font-bold">
                      <UserIcon className="w-3.5 h-3.5 opacity-50" />
                      Profil Saya
                    </Link>
                  </DropdownMenuItem>
                  {hasShop && (
                    <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer focus:bg-muted">
                      <Link href="/my-shop" className="flex items-center gap-2 text-xs font-bold">
                        <Store className="w-3.5 h-3.5 text-[#00AA5B]" />
                        Toko Saya
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="rounded-lg py-2 cursor-pointer focus:bg-destructive/5 text-destructive focus:text-destructive"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <LogOut className="w-3.5 h-3.5 opacity-50" />
                      Keluar
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="h-9 px-5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg bg-[#00AA5B] shadow-[#00AA5B]/10 hover:bg-[#00AA5B]/90 transition-all">
                <Link href="/login">Masuk</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
