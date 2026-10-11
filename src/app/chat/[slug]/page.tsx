"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  ChatProductPreview,
  ChatReplyPreview,
  ChatMessage,
  ChatThread,
  QUICK_TEMPLATES,
  getChatId,
  sendChatMessage,
  subscribeToChatMessages,
  subscribeToBuyerChats,
  markChatReadByBuyer,
} from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Send,
  ShoppingBag,
  Check,
  CheckCheck,
  Store,
  LogIn,
  Search,
  Plus,
  Smile,
  MoreVertical,
  ExternalLink,
  Reply,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";

function ShopChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const slugParam = (params?.slug as string) || "";
  const productIdParam = searchParams.get("productId") || "";

  const [mounted, setMounted] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [product, setProduct] = useState<ChatProductPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [buyerThreads, setBuyerThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasSentProductCard, setHasSentProductCard] = useState(false);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInitiateReply = (msg: ChatMessage) => {
    const senderTitle =
      msg.senderRole === "BUYER"
        ? "Kamu"
        : msg.senderName || shop?.name || "Penjual";
    setReplyingTo({
      messageId: msg.id,
      senderName: senderTitle,
      senderRole: msg.senderRole,
      text: msg.text,
    });
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      inputRef.current?.focus();
    }, 60);
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId((prev) => (prev === msgId ? null : prev));
      }, 1500);
    }
  };

  const handleTouchStart = (msgId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipingId(msgId);
    setSwipeOffset(0);
  };

  const handleTouchMove = (msg: ChatMessage, e: React.TouchEvent) => {
    if (!touchStartRef.current || swipingId !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 6) {
      const clamped = Math.sign(deltaX) * Math.min(Math.abs(deltaX), 65);
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = (msg: ChatMessage) => {
    if (swipingId === msg.id && Math.abs(swipeOffset) >= 30) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
      handleInitiateReply(msg);
    }
    setSwipingId(null);
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Shop details by slug or document ID
  useEffect(() => {
    if (!slugParam || !db) return;

    let isMounted = true;
    async function fetchShop() {
      try {
        setShopLoading(true);
        const directSnap = await getDocs(
          query(collection(db, "shops"), where("slug", "==", slugParam))
        );

        if (!directSnap.empty) {
          const docItem = directSnap.docs[0];
          if (isMounted) setShop({ id: docItem.id, ...docItem.data() });
        } else {
          // Fallback: check by document ID
          const allDocs = await getDocs(collection(db, "shops"));
          const match = allDocs.docs.find(
            (d) => d.id === slugParam || d.data().slug === slugParam
          );
          if (match && isMounted) {
            setShop({ id: match.id, ...match.data() });
          }
        }
      } catch (err) {
        console.error("Error fetching shop for chat:", err);
      } finally {
        if (isMounted) setShopLoading(false);
      }
    }

    fetchShop();
    return () => {
      isMounted = false;
    };
  }, [slugParam, db]);

  // 2. Fetch Attached Product if productIdParam exists
  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      if (!productIdParam) return;
      try {
        // 1. Try query param endpoint
        let res = await fetch(`/api/products?id=${encodeURIComponent(productIdParam)}`);
        if (!res.ok) {
          // 2. Fallback to direct REST route
          res = await fetch(`/api/products/${encodeURIComponent(productIdParam)}`);
        }

        if (res.ok) {
          const data = await res.json();
          const prod = data.product || data;
          if (prod && isMounted) {
            const rawImages = prod.images;
            let imgUrl = "";
            if (Array.isArray(rawImages) && rawImages.length > 0) {
              imgUrl = typeof rawImages[0] === "string" ? rawImages[0] : (rawImages[0]?.imageUrl || rawImages[0]?.url);
            } else if (prod.imageUrl) {
              imgUrl = prod.imageUrl;
            }

            setProduct({
              id: prod.id,
              title: prod.title || prod.name || "Produk",
              price: Number(prod.price || 0),
              imageUrl: imgUrl || "https://picsum.photos/seed/placeholder/200/200",
              slug: prod.slug || prod.id,
              category: prod.categoryName || prod.category,
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch product preview for chat:", err);
      }
    }

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [productIdParam]);

  // Fallback: If no productId in URL, but conversation has a message with productPreview
  useEffect(() => {
    if (!product && messages.length > 0) {
      const msgWithProduct = [...messages].reverse().find((m) => m.productPreview);
      if (msgWithProduct?.productPreview) {
        setProduct(msgWithProduct.productPreview);
      }
    }
  }, [product, messages]);


  // 3. Subscribe to all buyer threads for sidebar
  useEffect(() => {
    if (!user || !db) return;

    const unsub = subscribeToBuyerChats(db, user.uid, (threads) => {
      setBuyerThreads(threads);
    });

    return () => unsub();
  }, [user, db]);

  const shopId = shop?.id || slugParam;
  const shopSlug = shop?.slug || slugParam;
  const shopName = shop?.name || shop?.shopName || "Toko Penjual";
  const shopLogo = shop?.logoUrl || "";

  const isVerified = Boolean(
    shop?.isVerified ?? 
    shop?.verified ?? 
    shop?.is_verified ?? 
    (shop?.slug === "marketpoint" || shopSlug === "marketpoint" || shopId === "marketpoint")
  );

  const isOfficial = Boolean(
    shop?.isOfficial ?? 
    shop?.official ?? 
    shop?.is_official ?? 
    shop?.isOfficialStore ?? 
    (shop?.slug === "marketpoint" || shopSlug === "marketpoint" || shopId === "marketpoint")
  );

  const chatId = user && shopId ? getChatId(shopId, user.uid) : "";

  // 4. Mark chat read by buyer when opening active chat
  useEffect(() => {
    if (db && chatId) {
      markChatReadByBuyer(db, chatId);
    }
  }, [db, chatId]);

  // 5. Subscribe to real-time chat messages
  useEffect(() => {
    if (!user || !db || !chatId) return;

    const unsubscribe = subscribeToChatMessages(db, chatId, (msgs) => {
      setMessages(msgs);
      if (product) {
        const alreadySent = msgs.some(
          (m) => m.productPreview && m.productPreview.id === product.id
        );
        setHasSentProductCard(alreadySent);
      }
    });

    return () => unsubscribe();
  }, [user, db, chatId, product]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Combined Sidebar Threads (Includes current shop thread even if not yet saved to Firestore)
  const allSidebarThreads = React.useMemo(() => {
    const list = [...buyerThreads];
    const exists = list.some(
      (t) => t.shopSlug === shopSlug || t.shopId === shopId
    );

    if (!exists && shop) {
      list.unshift({
        id: chatId || `temp-${shopId}`,
        shopId: shopId,
        shopSlug: shopSlug,
        shopName: shopName,
        shopLogo: shopLogo,
        buyerId: user?.uid || "",
        buyerName: user?.displayName || "Pembeli",
        lastMessage: product ? `Tanya tentang ${product.title}` : "Mulai percakapan...",
        lastMessageAt: null,
        unreadByBuyer: 0,
      });
    }

    return list;
  }, [buyerThreads, shopSlug, shopId, shop, shopName, shopLogo, chatId, user, product]);

  const filteredThreads = allSidebarThreads.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.shopName || "").toLowerCase().includes(q) ||
      (t.lastMessage || "").toLowerCase().includes(q)
    );
  });

  // Handle send message
  const handleSend = async (customText?: string, attachProduct?: boolean) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend && !attachProduct) return;

    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan masuk ke akun Anda terlebih dahulu untuk memulai chat.",
      });
      router.push(`/login?redirect=/chat/${slugParam}${productIdParam ? `?productId=${productIdParam}` : ""}`);
      return;
    }

    if (!db) return;

    setSending(true);
    try {
      const willAttachProduct =
        (attachProduct && product) ||
        (product && !hasSentProductCard && messages.length === 0);

      await sendChatMessage(db, {
        shopId,
        shopSlug,
        shopName,
        shopLogo,
        buyerId: user.uid,
        buyerName: user.displayName || user.email?.split("@")[0] || "Pembeli",
        buyerAvatar: user.photoURL || "",
        senderId: user.uid,
        senderRole: "BUYER",
        senderName: user.displayName || user.email?.split("@")[0] || "Pembeli",
        senderAvatar: user.photoURL || "",
        text: textToSend || (product ? `Halo, saya ingin menanyakan produk "${product.title}"` : "Halo kak"),
        productPreview: willAttachProduct ? product : null,
        replyTo: replyingTo || null,
      });

      setReplyingTo(null);

      if (!customText) {
        setInputText("");
      }
      if (product) {
        setHasSentProductCard(true);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: err.message || "Terjadi kesalahan saat mengirim pesan.",
      });
    } finally {
      setSending(false);
    }
  };

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <div className="hidden md:flex w-80 lg:w-88 border-r border-border bg-white flex-col">
          <div className="p-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="flex-1 p-2 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-16 w-full rounded-none" />
          <div className="flex-1 p-6 flex flex-col justify-end space-y-4">
            <Skeleton className="h-12 w-1/2 rounded-2xl" />
            <Skeleton className="h-12 w-1/3 rounded-2xl self-end" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex overflow-hidden bg-white relative font-body text-[#212121]">
      {/* 1. Left Sidebar: Chat List */}
      <aside
        className={cn(
          "w-full md:w-80 lg:w-88 border-r border-border bg-white flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0",
          showDetailOnMobile
            ? "-translate-x-full md:translate-x-0 absolute md:relative z-0"
            : "translate-x-0 relative z-10"
        )}
      >
        <div className="p-4 border-b border-border bg-[#F8FAFC]/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="h-7 w-7 rounded-full hover:bg-white text-muted-foreground"
                title="Kembali ke Beranda"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-[13px] font-semibold text-[#212121]">Pesan Masuk</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="h-7 w-7 rounded-full hover:bg-white border border-transparent hover:border-border"
              title="Cari Toko Lain"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Cari toko atau pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-xl bg-white border-border text-[11px] focus:ring-4 focus:ring-[#00AA5B]/5"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Belum ada percakapan
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected =
                thread.shopSlug === slugParam || thread.shopId === shopId;
              const unread = thread.unreadByBuyer || 0;
              const timeDisplay = thread.lastMessageAt?.toDate
                ? thread.lastMessageAt
                    .toDate()
                    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Baru saja";

              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    if (thread.shopSlug && thread.shopSlug !== slugParam) {
                      router.push(`/chat/${thread.shopSlug}`);
                    }
                    setShowDetailOnMobile(true);
                  }}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 transition-all border-b border-border/40 relative text-left cursor-pointer",
                    isSelected
                      ? "bg-[#00AA5B]/5 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[#00AA5B]"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11 rounded-2xl border border-border/60 shadow-sm">
                      <AvatarImage src={thread.shopLogo} className="object-cover" />
                      <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-semibold">
                        {thread.shopName?.substring(0, 1) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#00AA5B] border-2 border-white shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[12px] font-semibold text-[#2E3137] truncate">
                          {thread.shopName}
                        </span>
                        {((isSelected && isVerified) || thread.shopSlug === "marketpoint") && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src="/assets/badge/verified.png" alt="" className="w-3 h-3 object-contain shrink-0" />
                        )}
                        {((isSelected && isOfficial) || thread.shopSlug === "marketpoint") && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src="/assets/badge/officials.png" alt="" className="w-3 h-3 object-contain shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0 ml-1">
                        {timeDisplay}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-[10px] truncate leading-relaxed",
                        unread > 0
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {thread.lastMessage || "Mulai percakapan..."}
                    </p>
                  </div>
                  {unread > 0 && (
                    <div className="h-4 min-w-4 px-1 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0 shadow-lg shadow-[#00AA5B]/20 ml-1">
                      <span className="text-[8px] font-semibold text-white">
                        {unread}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Main Content: Active Chat View */}
      <section
        className={cn(
          "flex-1 flex flex-col bg-[#F8FAFC] relative transition-transform duration-300 md:translate-x-0 overflow-hidden",
          showDetailOnMobile
            ? "translate-x-0 relative z-10"
            : "translate-x-full md:translate-x-0 absolute md:relative z-0"
        )}
      >
        {/* Header Bar */}
        <div className="h-16 px-4 md:px-6 border-b border-border flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetailOnMobile(false)}
              className="md:hidden h-8 w-8 rounded-full hover:bg-muted shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 rounded-2xl border border-border shadow-sm">
                <AvatarImage src={shopLogo} />
                <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                  {shopName.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#00AA5B]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#2E3137] truncate max-w-[170px] sm:max-w-xs">
                  {shopName}
                </span>
                {isVerified && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/assets/badge/verified.png"
                    alt="Verified"
                    className="w-3.5 h-3.5 object-contain shrink-0"
                  />
                )}
                {isOfficial && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/assets/badge/officials.png"
                    alt="Official Store"
                    className="w-3.5 h-3.5 object-contain shrink-0"
                  />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {shopSlug && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-xl border-border hover:border-[#00AA5B] hover:text-[#00AA5B] text-[11px] font-semibold shrink-0"
              >
                <Link href={`/${shopSlug}`} className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kunjungi Toko</span>
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pinned Attached Product Card (if navigated from product) */}
        {product && (
          <div className="bg-[#F8FAFC] border-b border-border/70 p-2.5 sm:px-4 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 rounded-xl bg-white border border-border/80 overflow-hidden shrink-0 shadow-2xs">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate leading-tight">
                  {product.title}
                </p>
                <p className="text-xs sm:text-sm font-black text-[#00AA5B] mt-0.5">
                  Rp {product.price?.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {!hasSentProductCard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend("Tanya tentang produk ini", true)}
                  className="h-7 px-2.5 text-[10px] sm:text-[11px] font-bold rounded-lg border-[#00AA5B]/40 text-[#00AA5B] hover:bg-[#00AA5B]/10 cursor-pointer"
                >
                  Lampirkan
                </Button>
              )}
              <Button
                asChild
                size="sm"
                className="h-7 px-3 text-[10px] sm:text-[11px] font-bold rounded-lg bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer shadow-2xs"
              >
                <Link href={`/checkout?productId=${product.id}&quantity=1`}>
                  Beli Langsung
                </Link>
              </Button>
            </div>
          </div>
        )}


        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
          <div className="flex justify-center mb-3">
            <span className="px-3 py-1 rounded-full bg-white text-[9px] text-muted-foreground border border-border/70 shadow-2xs">
              Awal percakapan dengan {shopName}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-border/60">
                <Store className="w-8 h-8 text-[#00AA5B] opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-[#2E3137]">
                Mulai Obrolan dengan {shopName}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Kirim pertanyaan Anda langsung ke penjual. Penjual biasanya membalas dalam beberapa menit.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isBuyer = msg.senderRole === "BUYER";
              const timeStr = msg.createdAt?.toDate
                ? msg.createdAt
                    .toDate()
                    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : msg.createdAt?.seconds
                ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Baru saja";

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={cn(
                    "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200 transition-colors group relative",
                    isBuyer ? "justify-end" : "justify-start",
                    highlightedMsgId === msg.id && "bg-[#00AA5B]/10 p-1.5 rounded-2xl"
                  )}
                >
                  {/* Swipe Indicator Background for Mobile Gesture */}
                  {swipingId === msg.id && Math.abs(swipeOffset) > 8 && (
                    <div
                      className={cn(
                        "absolute inset-y-0 flex items-center pointer-events-none md:hidden z-0",
                        swipeOffset > 0 ? "left-2" : "right-2"
                      )}
                      style={{
                        opacity: Math.min(Math.abs(swipeOffset) / 25, 1),
                        transform: `scale(${Math.min(0.7 + Math.abs(swipeOffset) / 50, 1.15)})`,
                      }}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-xs",
                          Math.abs(swipeOffset) >= 30
                            ? "bg-[#00AA5B] text-white"
                            : "bg-slate-200 text-slate-600"
                        )}
                      >
                        <Reply className={cn("w-4 h-4", swipeOffset > 0 ? "rotate-180" : "")} />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[65%] flex items-end gap-1.5",
                      isBuyer ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* DESKTOP HOVER ACTION: Tombol Reply yang muncul saat mouse hover */}
                    <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-all duration-150 pb-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInitiateReply(msg);
                        }}
                        title="Balas pesan ini"
                        className="h-7 w-7 rounded-full bg-white border border-border shadow-xs hover:bg-[#00AA5B] hover:text-white text-muted-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                      >
                        <Reply className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>

                    {/* Bubble Content with Touch Handlers for Mobile Swipe */}
                    <div
                      className={cn(
                        "flex flex-col touch-pan-y transition-transform z-10 w-full",
                        isBuyer ? "items-end" : "items-start"
                      )}
                      style={{
                        transform:
                          swipingId === msg.id ? `translateX(${swipeOffset}px)` : "translateX(0px)",
                        transition: swipingId === msg.id ? "none" : "transform 0.2s ease-out",
                      }}
                      onTouchStart={(e) => handleTouchStart(msg.id, e)}
                      onTouchMove={(e) => handleTouchMove(msg, e)}
                      onTouchEnd={() => handleTouchEnd(msg)}
                      onDoubleClick={() => handleInitiateReply(msg)}
                    >
                      {/* Attached Product Card Inside Message */}
                      {msg.productPreview && (
                        <div className="mb-2 p-2.5 rounded-2xl bg-white border border-border shadow-xs flex items-center gap-3 w-full max-w-[320px]">
                          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border relative">
                            <Image
                              src={
                                msg.productPreview.imageUrl ||
                                "https://picsum.photos/seed/placeholder/200/200"
                              }
                              alt={msg.productPreview.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-muted-foreground block font-medium">
                              Menanyakan produk:
                            </span>
                            <p className="text-[11px] font-semibold text-[#212121] truncate">
                              {msg.productPreview.title}
                            </p>
                            <p className="text-[11px] font-bold text-[#00AA5B]">
                              Rp {msg.productPreview.price?.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <Link
                            href={`/products/${msg.productPreview.id}`}
                            target="_blank"
                            className="p-1.5 text-muted-foreground hover:text-[#00AA5B] rounded-lg hover:bg-muted/50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}

                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl shadow-2xs border text-[12px] leading-relaxed break-words",
                          isBuyer
                            ? "bg-[#00AA5B] text-white rounded-tr-none border-[#00AA5B]/10 shadow-[#00AA5B]/10"
                            : "bg-white text-[#2E3137] rounded-tl-none border-border/60"
                        )}
                      >
                        {/* Quote Box for Reply */}
                        {msg.replyTo && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToMessage(msg.replyTo!.messageId);
                            }}
                            className={cn(
                              "mb-2.5 -mx-1 -mt-0.5 rounded-lg overflow-hidden cursor-pointer transition-all duration-150 select-none flex items-stretch border shadow-2xs group/quote",
                              isBuyer
                                ? "bg-black/15 hover:bg-black/25 border-white/20 text-white"
                                : "bg-slate-50/95 hover:bg-slate-100/95 border-emerald-500/20 text-[#2E3137]"
                            )}
                            title="Klik untuk melihat pesan asli"
                          >
                            {/* Accent Vertical Strip */}
                            <div
                              className={cn(
                                "w-1 shrink-0",
                                isBuyer ? "bg-white" : "bg-[#00AA5B]"
                              )}
                            />
                            <div className="px-2.5 py-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10.5px] font-bold leading-none">
                                <Reply className="w-2.5 h-2.5 rotate-180 shrink-0 opacity-80" />
                                <span
                                  className={cn(
                                    "truncate",
                                    isBuyer ? "text-white" : "text-[#00AA5B]"
                                  )}
                                >
                                  {msg.replyTo.senderRole === "BUYER" ? "Kamu" : msg.replyTo.senderName}
                                </span>
                              </div>
                              <p
                                className={cn(
                                  "text-[11px] truncate mt-1 leading-snug font-normal line-clamp-1",
                                  isBuyer ? "text-white/85" : "text-slate-600"
                                )}
                              >
                                {msg.replyTo.text}
                              </p>
                            </div>
                          </div>
                        )}

                        <p>{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[8px] text-muted-foreground opacity-60">
                          {timeStr}
                        </span>
                        {isBuyer && (
                          msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#00AA5B]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
                          )
                        )}
                        {/* Tombol Balas Cepat Mobile */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateReply(msg);
                          }}
                          title="Balas pesan"
                          className="md:hidden flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground/70 hover:text-[#00AA5B] active:text-[#00AA5B] active:scale-95 transition-all ml-1 px-1 py-0.5 rounded"
                        >
                          <Reply className="w-2.5 h-2.5 rotate-180" />
                          <span>Balas</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Templates Bar */}
        <div className="bg-white border-t border-border/70 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-wider">
              Pesan Cepat:
            </span>
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(tmpl)}
                className="text-[11px] font-medium bg-[#F8FAFC] hover:bg-[#00AA5B]/10 hover:text-[#00AA5B] text-[#2E3137] border border-border/80 px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Composer Bar */}
        <div className="p-3 md:p-4 border-t border-border bg-white sticky bottom-0 z-10 shrink-0">
          {!user ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-medium text-amber-800">
                Anda perlu masuk akun terlebih dahulu untuk mengirim pesan.
              </span>
              <Button
                size="sm"
                onClick={() =>
                  router.push(
                    `/login?redirect=/chat/${slugParam}${
                      productIdParam ? `?productId=${productIdParam}` : ""
                    }`
                  )
                }
                className="h-8 px-3 text-xs font-bold rounded-xl bg-[#00AA5B] text-white"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" /> Masuk Akun
              </Button>
            </div>
          ) : (
            <div>
              {/* Replying Banner Bar */}
              {replyingTo && (
                <div className="mb-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1 self-stretch bg-[#00AA5B] rounded-full shrink-0 min-h-[28px]" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00AA5B]">
                        <Reply className="w-3 h-3 rotate-180" />
                        <span>Membalas {replyingTo.senderName}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate line-clamp-1 mt-0.5">
                        {replyingTo.text}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
                    title="Batalkan balasan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-border/60 focus-within:border-[#00AA5B]/30 focus-within:ring-4 focus-within:ring-[#00AA5B]/5 transition-all shadow-inner"
              >
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Tulis pesan untuk penjual..."
                  disabled={sending}
                  className="flex-1 h-9 bg-transparent border-none shadow-none focus-visible:ring-0 text-[12px] text-[#2E3137] placeholder:text-muted-foreground/60 px-3"
                />
              <div className="flex items-center gap-1 pr-1">
                <ChatEmojiPicker
                  onSelectEmoji={(emoji) => {
                    setInputText((prev) => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  triggerClassName="hidden sm:flex"
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="h-9 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-lg shadow-[#00AA5B]/20 shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
                  <span className="text-[11px] font-semibold">Kirim</span>
                </Button>
              </div>
            </form>
          </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function ShopChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-[#00AA5B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopChatContent />
    </Suspense>
  );
}

