"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, collection, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { MarketHeader } from "@/components/market-header";
import { MarketFooter } from "@/components/market-footer";
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRing,
  ChevronLeft,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Megaphone,
  Clock,
  X,
  Ticket,
  Tag,
  Bell,
  Flame,
  CheckCheck,
  Timer,
  Heart,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canShopUseFlashSale, canShopUseVouchers } from "@/lib/subscription-plans";

// Interface untuk item update feed murni dari database
export interface UpdateItem {
  id: string;
  type: "flash_sale" | "voucher" | "shop" | "system";
  title: string;
  message: string;
  time: string;
  timestamp: number;
  isUnread: boolean;
  isFromFollowedShop?: boolean;
  author: {
    name: string;
    slug?: string;
    avatar?: string;
    isOfficial?: boolean;
    isVerified?: boolean;
  };
  bannerImage?: string;
  actionUrl?: string;
  actionText?: string;

  // Khusus Flash Sale Toko
  flashSaleData?: {
    sessionId: string;
    productId: string;
    productTitle: string;
    productImage: string;
    productSlug?: string;
    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    soldPercent: number;
    stockRemaining: number;
    targetSeconds: number; // Untuk countdown timer
    endTimeMs?: number;
    startTimeMs?: number;
    isUpcoming?: boolean;
    hasReminder?: boolean;
  };

  // Khusus Voucher Toko
  voucherData?: {
    voucherId?: string;
    shopId?: string;
    shopSlug?: string;
    code: string;
    discountText: string;
    minSpendText: string;
    validUntil: string;
    isClaimed: boolean;
    scope?: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS";
    applicableProductNames?: string[];
    applicableProductIds?: string[];
  };
}

const TAB_ITEMS = [
  { id: "all", label: "Semua", icon: null },
  { id: "flash_sale", label: "Flash Sale", icon: Flame },
  { id: "voucher", label: "Voucher Toko", icon: Ticket },
  { id: "system", label: "Info Sistem", icon: Megaphone },
] as const;

function formatRelativeTime(timestampMs: number): string {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return new Date(timestampMs).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// SKELETON LENGKAP SAAT REFRESH / PERTAMA MASUK (F5)
function UpdatesFullSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col">
      {/* MOBILE FULL SKELETON */}
      <div className="md:hidden flex flex-col flex-1">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
          <div className="px-3.5 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4.5 w-28 rounded-md" />
                <Skeleton className="h-4 w-6 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-16 h-4 rounded-md" />
          </div>
          <div className="flex gap-4 px-3.5 border-t border-slate-100 overflow-x-auto pb-2 pt-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>

        <div className="p-3 pb-8 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-2.5 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP FULL SKELETON */}
      <div className="hidden md:flex flex-col flex-1">
        <MarketHeader />
        <div className="flex-1 w-full pt-16">
          <main className="max-w-screen-xl mx-auto w-full p-6 pb-12">
            <div className="flex gap-6 items-start">
              {/* Desktop Sidebar Skeleton */}
              <aside className="w-[260px] shrink-0 space-y-4 sticky top-20">
                <div className="border border-border/50 shadow-sm bg-white rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-2.5 w-32 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2.5 py-3.5 border-t border-border/50">
                    <Skeleton className="h-8 w-full rounded-full" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                  <div className="py-2.5 border-t border-border/50">
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="w-3.5 h-3.5 rounded" />
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content Skeleton */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-40 rounded-md" />
                      <Skeleton className="h-3.5 w-72 rounded" />
                    </div>
                    <Skeleton className="w-64 h-9 rounded-xl shrink-0" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                            <div className="space-y-1">
                              <Skeleton className="h-3.5 w-32 rounded" />
                              <Skeleton className="h-2.5 w-20 rounded" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function UpdatesPage() {
  const { user: hookUser, loading: authLoading } = useUser();
  const auth = useAuth();
  const user = hookUser || auth?.currentUser || null;
  const isClientNav = typeof window !== "undefined" && Boolean((window as any).__MP_APP_INITIALIZED__);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // REAL DATA STATES DARI FIRESTORE MURNI
  const [rawShops, setRawShops] = useState<any[]>([]);
  const [rawAnnouncements, setRawAnnouncements] = useState<any[]>([]);
  const [claimedCodes, setClaimedCodes] = useState<Set<string>>(new Set());
  const [readUpdateIds, setReadUpdateIds] = useState<Set<string>>(new Set());
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());
  const [followedShopIds, setFollowedShopIds] = useState<Set<string>>(new Set());
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "flash_sale" | "voucher" | "system">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live countdown timer ticks
  const [nowMs, setNowMs] = useState(Date.now());

  const userRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const walletRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "wallet", "info");
  }, [db, user]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userRef);
  const { data: wallet } = useDoc(walletRef);
  const { data: shop } = useDoc(shopRef);

  // Timer interval update setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      (window as any).__MP_APP_INITIALIZED__ = true;
    }
    if (!authLoading && !user) {
      router.push("/login?redirect=/inbox/updates");
    }
  }, [user, authLoading, router]);

  // =========================================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS (LIVE LISTENERS)
  // =========================================================================
  useEffect(() => {
    if (!db) return;

    // 1. Dengarkan seluruh toko aktif di Firestore (Real-time Flash Sale & Voucher)
    const unsubShops = onSnapshot(
      collection(db, "shops"),
      (snapshot) => {
        const shopsList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setRawShops(shopsList);
        setFirestoreLoaded(true);
      },
      (err) => {
        console.warn("Real-time shops listener notice:", err);
        setFirestoreLoaded(true);
      }
    );

    // 2. Dengarkan pengumuman resmi platform dari Firestore
    const unsubAnnouncements = onSnapshot(
      collection(db, "announcements"),
      (snapshot) => {
        const annList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setRawAnnouncements(annList);
      },
      (err) => {
        console.warn("Real-time announcements notice:", err);
      }
    );

    return () => {
      unsubShops();
      unsubAnnouncements();
    };
  }, [db]);

  // 3. User subcollections (Claimed vouchers, Read status, Reminders, Followed Shops)
  useEffect(() => {
    if (!db || !user?.uid) return;

    // A. Voucher yang sudah diklaim oleh user
    const unsubClaimed = onSnapshot(
      collection(db, "users", user.uid, "claimedVouchers"),
      (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach((d) => {
          set.add(d.id);
          const data = d.data();
          if (data?.code) set.add(data.code);
        });
        setClaimedCodes(set);
      },
      (err) => console.warn("Claimed vouchers listener notice:", err)
    );

    // B. Status update yang sudah dibaca
    const unsubRead = onSnapshot(
      collection(db, "users", user.uid, "readUpdates"),
      (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach((d) => set.add(d.id));
        setReadUpdateIds(set);
      },
      (err) => console.warn("Read updates listener notice:", err)
    );

    // C. Pengingat Flash Sale aktif
    const unsubReminders = onSnapshot(
      collection(db, "users", user.uid, "flashSaleReminders"),
      (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach((d) => set.add(d.id));
        setActiveReminders(set);
      },
      (err) => console.warn("Flash reminders listener notice:", err)
    );

    // D. Toko yang difollow oleh user
    const unsubFollowed = onSnapshot(
      collection(db, "users", user.uid, "followedShops"),
      (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach((d) => {
          set.add(d.id);
          const data = d.data();
          if (data?.shopId) set.add(data.shopId);
          if (data?.shopSlug) set.add(data.shopSlug);
          if (data?.slug) set.add(data.slug);
        });
        setFollowedShopIds(set);
      },
      (err) => console.warn("Followed shops listener notice:", err)
    );

    return () => {
      unsubClaimed();
      unsubRead();
      unsubReminders();
      unsubFollowed();
    };
  }, [db, user?.uid]);

  // =========================================================================
  // EKSTRAKSI REAL DATA FIRESTORE (100% ASLI DARI DATABASE)
  // =========================================================================
  const liveUpdates: UpdateItem[] = useMemo(() => {
    const list: UpdateItem[] = [];

    // A. Ekstrak Flash Sale dan Voucher dari setiap Toko di Firestore
    rawShops.forEach((shopItem) => {
      const isShopFollowed = Boolean(
        followedShopIds.has(shopItem.id) || (shopItem.slug && followedShopIds.has(shopItem.slug))
      );
      const isOfficial = Boolean(
        shopItem.isOfficial ?? shopItem.official ?? (shopItem.slug === "marketpoint")
      );
      const isVerified = Boolean(shopItem.isVerified ?? shopItem.verified);

      // ATURAN UTAMA: HANYA Toko Favorit (yang di-follow user) dan Official Store saja yang tampil di Update!
      if (!isShopFollowed && !isOfficial) return;

      // CEK STATUS SUBSCRIPTION TOKO: Jika masa aktif langganan toko sudah habis / kedaluwarsa, promo otomatis dinonaktifkan!
      const shopSub = shopItem.subscription;
      const isShopSubExpired = Boolean(
        shopSub?.expiresAt &&
        new Date(shopSub.expiresAt).getTime() < nowMs &&
        shopSub?.planId !== "admin" &&
        shopSub?.planId !== "free"
      ) || shopSub?.status === "EXPIRED";

      if (isShopSubExpired) return;

      const shopAuthor = {
        name: shopItem.name || shopItem.shopName || "Toko Penjual",
        slug: shopItem.slug || shopItem.shopSlug || shopItem.id,
        avatar: shopItem.logoUrl || shopItem.logo || shopItem.photoURL || undefined,
        isOfficial,
        isVerified,
      };

      // 1. Ekstrak Flash Sales Toko (Hanya jika paket toko mendukung Flash Sale dan masih berlaku)
      const hasFlashSaleFeature = canShopUseFlashSale(
        shopSub?.planId,
        shopSub?.status,
        shopSub?.expiresAt
      );
      const flashSalesList = hasFlashSaleFeature && Array.isArray(shopItem.flashSales) ? shopItem.flashSales : [];
      flashSalesList.forEach((session: any) => {
        // Pastikan status aktif dan memiliki array produk
        if (session.status !== "ACTIVE" || !Array.isArray(session.products)) return;

        if (!session.startTime || !session.endTime) return;
        const startMs = new Date(session.startTime).getTime();
        const endMs = new Date(session.endTime).getTime();

        // VALIDASI KETAT: Jika waktu flash sale sudah lewat / kedaluwarsa, JANGAN TAMPILKAN!
        if (nowMs > endMs) return;

        const isUpcoming = nowMs < startMs;
        const targetSeconds = isUpcoming
          ? Math.max(0, Math.floor((startMs - nowMs) / 1000))
          : Math.max(0, Math.floor((endMs - nowMs) / 1000));

        session.products.forEach((prod: any) => {
          const quota = Number(prod.quota || 0);
          const sold = Number(prod.sold || 0);
          const remaining = Math.max(0, quota - sold);

          // VALIDASI KUOTA: Jika kuota produk flash sale sudah habis, JANGAN TAMPILKAN!
          if (remaining <= 0) return;

          const soldPercent = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;
          const reminderKey = `${session.id}_${prod.productId}`;
          const hasReminder = activeReminders.has(reminderKey);

          const updateId = `fs-${session.id}-${prod.productId}`;
          const isUnread = !readUpdateIds.has(updateId);

          list.push({
            id: updateId,
            type: "flash_sale",
            title: isUpcoming
              ? `⏰ Flash Sale Segera Hadir: ${prod.title} Diskon ${prod.discountPercentage || 0}%!`
              : `⚡ Flash Sale Terbatas: ${prod.title} Hemat ${prod.discountPercentage || 0}%!`,
            message: isUpcoming
              ? `${shopAuthor.name} akan membuka kuota diskon ${prod.discountPercentage || 0}% untuk ${prod.title}. Pasang pengingat agar tidak kehabisan kuota!`
              : `Promo kilat dari ${shopAuthor.name}! Dapatkan ${prod.title} seharga Rp ${Number(prod.discountPrice || 0).toLocaleString("id-ID")}. Kuota terbatas!`,
            time: formatRelativeTime(session.createdAt ? new Date(session.createdAt).getTime() : startMs),
            timestamp: session.createdAt ? new Date(session.createdAt).getTime() : startMs,
            isUnread,
            isFromFollowedShop: isShopFollowed,
            author: shopAuthor,
            actionUrl: `/${shopAuthor.slug}/${prod.productSlug || prod.productId}`,
            actionText: isUpcoming ? "Lihat Produk" : "Beli Flash Sale",
            flashSaleData: {
              sessionId: session.id,
              productId: prod.productId,
              productTitle: prod.title,
              productImage: prod.imageUrl || "/assets/logo/logo.png",
              productSlug: prod.productSlug || prod.productId,
              originalPrice: Number(prod.originalPrice || 0),
              salePrice: Number(prod.discountPrice || 0),
              discountPercent: Number(prod.discountPercentage || 0),
              soldPercent,
              stockRemaining: remaining,
              targetSeconds,
              endTimeMs: endMs,
              startTimeMs: startMs,
              isUpcoming,
              hasReminder,
            },
          });
        });
      });

      // 2. Ekstrak Vouchers Toko (Hanya jika paket toko mendukung Voucher Toko, berstatus ACTIVE, kuota tersedia, dan belum kedaluwarsa)
      const hasVoucherFeature = canShopUseVouchers(
        shopSub?.planId,
        shopSub?.status,
        shopSub?.expiresAt
      );
      const vouchersList = hasVoucherFeature && Array.isArray(shopItem.vouchers) ? shopItem.vouchers : [];
      vouchersList.forEach((v: any) => {
        if (v.status !== "ACTIVE") return;

        // VALIDASI KUOTA VOUCHER
        const vQuota = Number(v.quota || 0);
        const vUsed = Number(v.used || 0);
        if (vQuota > 0 && vUsed >= vQuota) return;

        // VALIDASI TANGGAL KEDALUWARSA VOUCHER
        if (v.expiry) {
          const expMs = v.expiry.includes("T")
            ? new Date(v.expiry).getTime()
            : new Date(`${v.expiry}T23:59:59`).getTime();
          if (nowMs > expMs) return; // Sudah kedaluwarsa, jangan tampilkan!
        }

        const discountText =
          v.type === "percentage"
            ? `Diskon ${v.value}%`
            : `Potongan Rp ${Number(v.value || 0).toLocaleString("id-ID")}`;
        const minSpendText = v.minPurchase
          ? `Min. Belanja Rp ${Number(v.minPurchase).toLocaleString("id-ID")}`
          : "Tanpa Min. Belanja";
        const validUntil = v.expiry
          ? new Date(v.expiry).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Berlaku Selamanya";

        // Deteksi cakupan voucher: Semua Produk vs Khusus Produk Pilihan
        const scope: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" =
          v.scope === "SPECIFIC_PRODUCTS" ? "SPECIFIC_PRODUCTS" : "ALL_PRODUCTS";
        const applicableProductNames = Array.isArray(v.applicableProductNames) ? v.applicableProductNames : [];
        const applicableProductIds = Array.isArray(v.applicableProductIds) ? v.applicableProductIds : [];

        const scopeDesc =
          scope === "SPECIFIC_PRODUCTS"
            ? applicableProductNames.length > 0
              ? `Khusus ${applicableProductNames.length} produk pilihan: ${applicableProductNames.slice(0, 2).join(", ")}${applicableProductNames.length > 2 ? "..." : ""}`
              : "Khusus produk pilihan toko"
            : "Berlaku untuk semua produk di toko";

        const updateId = `voucher-${v.id || v.code}`;
        const isClaimed = Boolean(claimedCodes.has(v.code) || (v.id && claimedCodes.has(v.id)));
        const isUnread = !readUpdateIds.has(updateId);

        list.push({
          id: updateId,
          type: "voucher",
          title: `🎟️ Voucher Toko: ${discountText} dari ${shopAuthor.name}!`,
          message: `Gunakan kode ${v.code} untuk mendapatkan ${discountText.toLowerCase()} dari toko ${shopAuthor.name}. ${minSpendText} • ${scopeDesc}.`,
          time: formatRelativeTime(v.createdAt ? new Date(v.createdAt).getTime() : Date.now() - 3600000),
          timestamp: v.createdAt ? new Date(v.createdAt).getTime() : Date.now() - 3600000,
          isUnread,
          isFromFollowedShop: isShopFollowed,
          author: shopAuthor,
          actionUrl: `/${shopAuthor.slug}`,
          actionText: "Kunjungi Toko",
          voucherData: {
            voucherId: v.id,
            shopId: shopItem.id,
            shopSlug: shopAuthor.slug,
            code: v.code,
            discountText,
            minSpendText,
            validUntil,
            isClaimed,
            scope,
            applicableProductNames,
            applicableProductIds,
          },
        });
      });
    });

    // B. Ekstrak Pengumuman Asli Admin dari Firestore
    rawAnnouncements.forEach((ann: any) => {
      const updateId = `ann-${ann.id}`;
      const isUnread = !readUpdateIds.has(updateId);
      const annTime = ann.createdAt?.toMillis
        ? ann.createdAt.toMillis()
        : ann.createdAt
          ? new Date(ann.createdAt).getTime()
          : Date.now() - 7200000;

      list.push({
        id: updateId,
        type: "system",
        title: ann.title || "📢 Pembaruan Sistem MarketPointID",
        message: ann.message || ann.content || "Informasi pembaruan dan pengumuman resmi platform.",
        time: formatRelativeTime(annTime),
        timestamp: annTime,
        isUnread,
        author: {
          name: ann.authorName || "MarketPointID Care",
          avatar: ann.authorAvatar || "/assets/avatar/duck.png",
          isOfficial: true,
        },
        actionUrl: ann.actionUrl || "/inbox/reviews",
        actionText: ann.actionText || "Cek Info",
      });
    });

    // Urutkan feed: Toko Favorit di paling atas, kemudian timestamp terbaru
    list.sort((a, b) => {
      if (a.isFromFollowedShop && !b.isFromFollowedShop) return -1;
      if (!a.isFromFollowedShop && b.isFromFollowedShop) return 1;
      return b.timestamp - a.timestamp;
    });

    return list;
  }, [rawShops, rawAnnouncements, claimedCodes, readUpdateIds, activeReminders, followedShopIds, nowMs]);

  const hasShop = userData?.hasShop === true || !!shop;
  const unreadCount = liveUpdates.filter((u) => u.isUnread).length;

  const filteredUpdates = liveUpdates.filter((item) => {
    const matchTab = activeTab === "all" ? true : item.type === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      query === "" ||
      item.title.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query) ||
      item.author.name.toLowerCase().includes(query) ||
      (item.voucherData && item.voucherData.code.toLowerCase().includes(query)) ||
      (item.flashSaleData && item.flashSaleData.productTitle.toLowerCase().includes(query));

    return matchTab && matchSearch;
  });

  // =========================================================================
  // ACTIONS DENGAN PENYIMPANAN NYATA KE FIRESTORE
  // =========================================================================
  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali di MarketPointID!",
      });
      router.push("/login");
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Keluar",
        description: "Terjadi gangguan pada sistem.",
      });
    }
  };

  // Tandai semua dibaca di Firestore
  const handleMarkAllRead = async () => {
    if (!user || !db) return;
    try {
      const unreadItems = liveUpdates.filter((u) => u.isUnread);
      await Promise.all(
        unreadItems.map((u) =>
          setDoc(doc(db, "users", user.uid, "readUpdates", u.id), {
            readAt: serverTimestamp(),
          })
        )
      );
      toast({
        title: "Semua Update Ditandai Dibaca",
        description: "Kotak masuk update Anda kini bersih.",
      });
    } catch (err: any) {
      console.warn("Error marking all read:", err);
    }
  };

  // Tandai satu update dibaca di Firestore saat diklik
  const handleMarkItemRead = async (id: string) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, "users", user.uid, "readUpdates", id), {
        readAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Error marking item read:", err);
    }
  };

  // Klaim voucher toko: Tersimpan di Firestore lalu DIARAHKAN ke halaman slug toko
  const handleClaimVoucher = async (
    itemId: string,
    voucherCode: string,
    voucherId?: string,
    shopId?: string,
    shopSlug?: string
  ) => {
    const targetSlug = shopSlug || "deals";
    const shopUrl = `/${targetSlug}`;

    if (!user || !db) {
      toast({
        title: "Silakan Masuk",
        description: "Masuk ke akun Anda untuk mengklaim voucher.",
        variant: "destructive",
      });
      router.push(`/login?redirect=${encodeURIComponent(shopUrl)}`);
      return;
    }

    // Jika voucher sudah pernah diklaim, langsung arahkan ke toko
    const isAlreadyClaimed = claimedCodes.has(voucherCode) || (voucherId && claimedCodes.has(voucherId));
    if (isAlreadyClaimed) {
      router.push(shopUrl);
      return;
    }

    try {
      await setDoc(doc(db, "users", user.uid, "claimedVouchers", voucherCode), {
        code: voucherCode,
        voucherId: voucherId || null,
        shopId: shopId || null,
        claimedAt: serverTimestamp(),
      });

      // Tandai item sebagai sudah dibaca
      await setDoc(doc(db, "users", user.uid, "readUpdates", itemId), {
        readAt: serverTimestamp(),
      });

      toast({
        title: "Voucher Berhasil Diklaim! 🎟️",
        description: `Kode "${voucherCode}" tersimpan di akun Anda. Mengalihkan ke toko...`,
      });

      // Arahkan pengguna ke halaman toko penjual (slug shop)
      setTimeout(() => {
        router.push(shopUrl);
      }, 350);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengklaim Voucher",
        description: err.message || "Terjadi kesalahan jaringan.",
      });
    }
  };

  // Salin kode voucher ke clipboard
  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Kode Disalin! 📋",
      description: `Kode "${code}" berhasil disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Toggle pengingat Flash Sale (Tersimpan permanen di Firestore users/{uid}/flashSaleReminders)
  const handleToggleReminder = async (sessionId: string, productId: string, productTitle: string) => {
    if (!user || !db) {
      toast({
        title: "Silakan Masuk",
        description: "Masuk ke akun Anda untuk mengatur pengingat promo.",
        variant: "destructive",
      });
      return;
    }

    const reminderKey = `${sessionId}_${productId}`;
    const isCurrentlyActive = activeReminders.has(reminderKey);
    const reminderDocRef = doc(db, "users", user.uid, "flashSaleReminders", reminderKey);

    try {
      if (isCurrentlyActive) {
        await deleteDoc(reminderDocRef);
        toast({
          title: "Pengingat Dibatalkan",
          description: `Pengingat Flash Sale "${productTitle}" telah dimatikan.`,
        });
      } else {
        await setDoc(reminderDocRef, {
          sessionId,
          productId,
          productTitle,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Pengingat Diaktifkan! ⏰",
          description: `Kami akan mengingatkanmu saat Flash Sale "${productTitle}" dimulai.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengatur Pengingat",
        description: err.message || "Terjadi kendala pada server.",
      });
    }
  };

  // Format detik ke HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. SAAT PERTAMA KALI MASUK / F5: Tampilkan Full Page Skeleton
  if (!isClientNav && (!mounted || authLoading || !firestoreLoaded)) {
    return <UpdatesFullSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col">
      {/* HEADER DESKTOP */}
      <div className="hidden md:block">
        <MarketHeader />
      </div>

      {/* MOBILE APP BAR (STICKY HEADER + UNDERLINE TABS DI BAWAH HEADER) */}
      <div className="sticky top-0 z-40 md:hidden bg-white border-b border-slate-200/80 shadow-2xs">
        {isMobileSearchOpen ? (
          <header className="px-3.5 h-12 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
              title="Tutup pencarian"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari promo, voucher, toko..."
                className="h-8.5 pl-9 pr-8 text-xs rounded-lg border-slate-200 bg-slate-50 focus-visible:ring-[#00AA5B] w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title="Hapus teks"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>
        ) : (
          <header className="px-3.5 h-12 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Kembali"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">Update & Promo</h1>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-[#00AA5B] bg-[#00AA5B]/10 px-1.5 py-0.2 rounded-full shrink-0">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Cari update"
              >
                <Search className="w-4 h-4" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-[#00AA5B] hover:text-[#00AA5B]/80 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Tandai Dibaca
                </button>
              )}
            </div>
          </header>
        )}

        {/* TABS MOBILE: Underline style menempel rapi di bawah header */}
        <div className="flex items-center px-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count =
              tab.id === "all"
                ? liveUpdates.length
                : liveUpdates.filter((it) => it.type === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2.5 text-xs whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer shrink-0",
                  isActive
                    ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      isActive ? "text-[#00AA5B] fill-[#00AA5B]/20" : "text-slate-400"
                    )}
                  />
                )}
                <span>
                  {tab.label} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER WITH SAFE DESKTOP NAVBAR OFFSET */}
      <div className="flex-1 w-full pt-0 md:pt-16">
        <main className="max-w-screen-xl mx-auto w-full p-3 sm:p-6 pb-8 md:pb-12">
          <div className="flex gap-6 items-start">
            {/* DESKTOP SIDEBAR (Direct child with sticky top-20 self-start) */}
            <DesktopAccountSidebar
              user={user}
              wallet={wallet}
              hasShop={hasShop}
              displayName={user?.displayName || ""}
              activeItem="inbox-updates"
              handleLogout={handleLogout}
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-transparent md:bg-white rounded-none md:rounded-2xl border-0 md:border md:border-slate-200/80 shadow-none md:shadow-xs p-0 md:p-5">
                {/* Header Title & Actions (Desktop Only) */}
                <div className="hidden md:flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BellRing className="w-5 h-5 text-[#00AA5B]" />
                        Update & Promo
                      </h2>
                      {unreadCount > 0 && (
                        <Badge className="bg-[#00AA5B] hover:bg-[#00AA5B] text-white text-[10px] font-bold px-2 py-0 border-none shadow-none">
                          {unreadCount} Baru
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Notifikasi flash sale kilat toko, voucher promo diskon, dan pengumuman resmi dari toko terdaftar di MarketPointID.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Search Bar Desktop */}
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari promo, voucher, toko..."
                        className="h-9 pl-9 pr-8 text-xs rounded-xl border-slate-200 bg-slate-50/80 focus-visible:ring-[#00AA5B] transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-[#00AA5B]" />
                        Tandai Semua Dibaca
                      </Button>
                    )}
                  </div>
                </div>

                {/* TABS DESKTOP (UNDERLINE STYLE) */}
                <div className="hidden md:flex items-center gap-2 border-b border-slate-100 pb-px mb-4">
                  {TAB_ITEMS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    const count =
                      tab.id === "all"
                        ? liveUpdates.length
                        : liveUpdates.filter((it) => it.type === tab.id).length;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2.5 text-xs whitespace-nowrap transition-all border-b-2 font-medium cursor-pointer",
                          isActive
                            ? "border-[#00AA5B] text-[#00AA5B] font-bold"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                        )}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              "w-3.5 h-3.5 transition-colors",
                              isActive ? "text-[#00AA5B] fill-[#00AA5B]/20" : "text-slate-400"
                            )}
                          />
                        )}
                        <span>
                          {tab.label} ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* FEED CONTENT (MURNI DATA DATABASE) */}
                <div className="space-y-3">
                  {filteredUpdates.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <CheckCircle2 className="w-7 h-7 text-[#00AA5B]" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Belum Ada Update</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {searchQuery
                          ? `Tidak ditemukan promo atau update yang cocok dengan "${searchQuery}".`
                          : activeTab === "flash_sale"
                            ? "Saat ini belum ada Flash Sale dari Toko Favorit Anda maupun Official Store."
                            : activeTab === "voucher"
                              ? "Saat ini belum ada voucher aktif dari Toko Favorit Anda maupun Official Store."
                              : activeTab === "system"
                                ? "Belum ada pengumuman sistem saat ini."
                                : "Update promo dan voucher hanya menampilkan toko yang Anda ikuti (Toko Favorit) serta Official Store resmi."}
                      </p>
                      {!searchQuery && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="h-8 px-3.5 text-xs font-bold rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-2xs cursor-pointer"
                          >
                            <Link href="/official">
                              Jelajahi Official Store
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-3.5 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
                          >
                            <Link href="/favorites">
                              Cek Toko Favorit
                            </Link>
                          </Button>
                        </div>
                      )}
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="h-8 text-xs font-bold rounded-lg border-slate-200 text-slate-700 cursor-pointer"
                        >
                          Reset Pencarian
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredUpdates.map((item) => (
                      <article
                        key={item.id}
                        onClick={() => item.isUnread && handleMarkItemRead(item.id)}
                        className={cn(
                          "p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border transition-all relative overflow-hidden group cursor-pointer shadow-2xs",
                          item.isUnread
                            ? "bg-white border-emerald-300 ring-1 ring-emerald-500/10 hover:border-emerald-400"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        )}
                      >
                        {/* Unread Accent Indicator */}
                        {item.isUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00AA5B]" />
                        )}

                        {/* Author Header & Timestamp */}
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-9 w-9 ring-1 ring-slate-200/80 shrink-0">
                              <AvatarImage src={item.author.avatar} alt={item.author.name} />
                              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-bold">
                                {item.author.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {item.author.slug ? (
                                  <Link
                                    href={`/${item.author.slug}`}
                                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#00AA5B] transition-colors truncate"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.author.name}
                                  </Link>
                                ) : (
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {item.author.name}
                                  </span>
                                )}
                                {item.author.isOfficial && (
                                  <img
                                    src="/assets/badge/officials.png"
                                    alt="Official Store"
                                    className="w-3.5 h-3.5 object-contain shrink-0"
                                    title="Official Store"
                                  />
                                )}
                                {item.author.isVerified && !item.author.isOfficial && (
                                  <img
                                    src="/assets/badge/verified.png"
                                    alt="Verified Store"
                                    className="w-3.5 h-3.5 object-contain shrink-0"
                                    title="Verified Store"
                                  />
                                )}
                                {item.isFromFollowedShop && (
                                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Toko Favoritmu
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{item.time}</span>
                              </p>
                            </div>
                          </div>

                          {/* Badge Kategori Promo */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.isUnread && (
                              <span className="bg-[#00AA5B]/10 text-[#00AA5B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Baru
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1",
                                item.type === "flash_sale"
                                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                  : item.type === "voucher"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                    : "bg-blue-50 text-blue-700 border-blue-200/80"
                              )}
                            >
                              {item.type === "flash_sale" ? (
                                <>
                                  <Flame className="w-3 h-3 fill-rose-500 text-rose-500" /> Flash Sale
                                </>
                              ) : item.type === "voucher" ? (
                                <>
                                  <Ticket className="w-3 h-3 text-emerald-600" /> Voucher Toko
                                </>
                              ) : (
                                <>
                                  <Megaphone className="w-3 h-3 text-blue-500" /> Info
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Title & Message */}
                        <div className="pt-3 space-y-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00AA5B] transition-colors leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {item.message}
                          </p>

                          {/* ============================================================ */}
                          {/* REAL DATA FLASH SALE CARD */}
                          {/* ============================================================ */}
                          {item.flashSaleData && (
                            <div
                              className="mt-3 p-3 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Header Countdown */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                  <Flame className="w-4 h-4 text-rose-600 fill-rose-600" />
                                  <span>
                                    {item.flashSaleData.isUpcoming
                                      ? "Flash Sale Segera Datang"
                                      : "Flash Sale Sedang Berlangsung"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs">
                                  <Timer className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-[11px] font-medium text-slate-500">
                                    {item.flashSaleData.isUpcoming ? "Mulai dalam:" : "Berakhir dalam:"}
                                  </span>
                                  <span className="font-mono bg-slate-900 text-white text-[11px] px-2 py-0.5 rounded-md font-bold tracking-wider">
                                    {formatTime(item.flashSaleData.targetSeconds)}
                                  </span>
                                </div>
                              </div>

                              {/* Flash Sale Product Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={item.flashSaleData.productImage}
                                    alt={item.flashSaleData.productTitle}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                                  />
                                  <div className="min-w-0 space-y-1">
                                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                                      {item.flashSaleData.productTitle}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-black text-rose-600">
                                        Rp {item.flashSaleData.salePrice.toLocaleString("id-ID")}
                                      </span>
                                      <span className="text-[11px] text-slate-400 line-through">
                                        Rp {item.flashSaleData.originalPrice.toLocaleString("id-ID")}
                                      </span>
                                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                        -{item.flashSaleData.discountPercent}%
                                      </span>
                                    </div>

                                    {/* Stock Progress Bar */}
                                    {!item.flashSaleData.isUpcoming && (
                                      <div className="w-full max-w-[220px] space-y-0.5 pt-0.5">
                                        <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                                          <span>Terjual {item.flashSaleData.soldPercent}%</span>
                                          <span className="text-rose-600 font-bold">
                                            Sisa {item.flashSaleData.stockRemaining} slot
                                          </span>
                                        </div>
                                        <Progress
                                          value={item.flashSaleData.soldPercent}
                                          className="h-1.5 bg-slate-200 rounded-full [&>div]:bg-rose-500"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action CTA Button */}
                                <div className="sm:self-center shrink-0 w-full sm:w-auto">
                                  {item.flashSaleData.isUpcoming ? (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleToggleReminder(
                                          item.flashSaleData!.sessionId,
                                          item.flashSaleData!.productId,
                                          item.flashSaleData!.productTitle
                                        )
                                      }
                                      className={cn(
                                        "w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold gap-1.5 transition-all shadow-2xs cursor-pointer",
                                        item.flashSaleData.hasReminder
                                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                      )}
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                      {item.flashSaleData.hasReminder
                                        ? "Pengingat Aktif ✓"
                                        : "Ingatkan Saya"}
                                    </Button>
                                  ) : (
                                    <Button
                                      asChild
                                      size="sm"
                                      className="w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-2xs cursor-pointer"
                                    >
                                      <Link href={item.actionUrl || "/deals"}>
                                        <Zap className="w-3.5 h-3.5 fill-white" />
                                        Beli Flash Sale
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ============================================================ */}
                          {/* REAL DATA VOUCHER CARD (DENGAN CAKUPAN PRODUK & REDIRECT TOKO) */}
                          {/* ============================================================ */}
                          {item.voucherData && (
                            <div
                              className="mt-3 p-3.5 sm:p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-[#00AA5B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Ticket className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                                      {item.voucherData.discountText}
                                    </span>
                                    <span className="text-xs font-mono font-bold tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                                      {item.voucherData.code}
                                    </span>

                                    {/* BADGE CAKUPAN: KHUSUS PRODUK PILIHAN VS SEMUA PRODUK */}
                                    {item.voucherData.scope === "SPECIFIC_PRODUCTS" ? (
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Tag className="w-2.5 h-2.5 text-amber-700" /> Khusus Produk Pilihan
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-md">
                                        Semua Produk Toko
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {item.voucherData.minSpendText} • Berlaku s/d {item.voucherData.validUntil}
                                    {item.voucherData.scope === "SPECIFIC_PRODUCTS" &&
                                      item.voucherData.applicableProductNames &&
                                      item.voucherData.applicableProductNames.length > 0 && (
                                        <span className="block text-[10.5px] text-amber-800 font-medium mt-0.5">
                                          Berlaku untuk: {item.voucherData.applicableProductNames.join(", ")}
                                        </span>
                                      )}
                                  </p>
                                </div>
                              </div>

                              {/* Voucher Action Buttons */}
                              <div className="flex items-center gap-2 sm:self-center shrink-0 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyVoucher(item.voucherData!.code)}
                                  className="flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  {copiedCode === item.voucherData.code ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#00AA5B]" /> Tersalin
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" /> Salin Kode
                                    </>
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleClaimVoucher(
                                      item.id,
                                      item.voucherData!.code,
                                      item.voucherData!.voucherId,
                                      item.voucherData!.shopId,
                                      item.author.slug || item.voucherData!.shopSlug
                                    )
                                  }
                                  className="flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-2xs transition-all cursor-pointer bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white"
                                >
                                  {item.voucherData.isClaimed ? (
                                    <>
                                      Gunakan Voucher <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <Ticket className="w-3.5 h-3.5" /> Klaim Voucher
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Tombol aksi pengumuman */}
                          {!item.flashSaleData && !item.voucherData && item.actionUrl && (
                            <div className="pt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                              <Button
                                asChild
                                size="sm"
                                className="h-9 px-4 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Link href={item.actionUrl}>
                                  {item.actionText || "Lihat Selengkapnya"}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER (DESKTOP ONLY) */}
      <div className="hidden md:block">
        <MarketFooter />
      </div>
    </div>
  );
}
