"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import {
  ChatProductPreview,
  ChatMessage,
  ChatReplyPreview,
  QUICK_TEMPLATES,
  getChatId,
  sendChatMessage,
  subscribeToChatMessages,
} from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Maximize2,
  Send,
  Sparkles,
  ShoppingBag,
  Check,
  CheckCheck,
  Store,
  ChevronRight,
  LogIn,
  Layers,
  Clock,
  ExternalLink,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";

interface ProductChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: {
    id?: string;
    slug?: string;
    name?: string;
    logoUrl?: string;
    isVerified?: boolean;
    isOfficial?: boolean;
    ratingAvg?: number;
    [key: string]: any;
  };
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    slug?: string;
    categoryName?: string;
    stockType?: string;
    stockCount?: number;
  };
}

export function ProductChatModal({
  isOpen,
  onClose,
  shop,
  product,
}: ProductChatModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasSentProductCard, setHasSentProductCard] = useState(false);
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
        : msg.senderName || shopName || "Penjual";
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
    const el = document.getElementById(`modal-msg-${msgId}`);
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

  const shopId = shop?.id || shop?.slug || "shop";
  const shopSlug = shop?.slug || shop?.id || "toko";
  const shopName = shop?.name || "Toko Penjual";
  const shopLogo = shop?.logoUrl || "";

  const isVerified = Boolean(
    shop?.isVerified ?? 
    (shop as any)?.verified ?? 
    (shop as any)?.is_verified ?? 
    (shop?.slug === "marketpoint" || shopSlug === "marketpoint" || shopId === "marketpoint")
  );
  const isOfficial = Boolean(
    shop?.isOfficial ?? 
    (shop as any)?.official ?? 
    (shop as any)?.is_official ?? 
    (shop as any)?.isOfficialStore ?? 
    (shop?.slug === "marketpoint" || shopSlug === "marketpoint" || shopId === "marketpoint")
  );

  const productPreview: ChatProductPreview = {
    id: product.id,
    title: product.title,
    price: product.price,
    imageUrl: product.imageUrl,
    slug: product.slug || product.id,
    category: product.categoryName,
  };

  const chatId = user ? getChatId(shopId, user.uid) : "";

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!isOpen || !user || !db || !chatId) return;

    const unsubscribe = subscribeToChatMessages(db, chatId, (msgs) => {
      setMessages(msgs);
      // Check if product card was already shared in this conversation
      const alreadySent = msgs.some(
        (m) => m.productPreview && m.productPreview.id === product.id
      );
      setHasSentProductCard(alreadySent);
    });

    return () => unsubscribe();
  }, [isOpen, user, db, chatId, product.id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle send message
  const handleSend = async (customText?: string, attachProduct?: boolean) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend && !attachProduct) return;

    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan masuk ke akun Anda terlebih dahulu untuk memulai chat.",
      });
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }

    if (!db) return;

    setSending(true);
    try {
      const willAttachProduct =
        attachProduct || (!hasSentProductCard && messages.length === 0);

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
        text: textToSend || `Halo, saya ingin menanyakan produk "${product.title}"`,
        productPreview: willAttachProduct ? productPreview : null,
        replyTo: replyingTo || null,
      });

      setReplyingTo(null);

      if (!customText) {
        setInputText("");
      }
      setHasSentProductCard(true);
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

  const handleExpandToFullChat = () => {
    onClose();
    router.push(`/chat/${shopSlug}?productId=${product.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="hidden lg:flex fixed bottom-5 right-5 z-50 flex-col w-[390px] h-[580px] bg-white rounded-2xl border border-border shadow-[0_12px_45px_rgba(0,0,0,0.18)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 font-body">
      {/* 1. Header */}
      <div className="bg-white px-4 py-3 border-b border-border flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 rounded-xl border border-border shadow-2xs">
              {shopLogo && <AvatarImage src={shopLogo} alt={shopName} />}
              <AvatarFallback className="bg-[#00AA5B]/10 text-[#00AA5B] text-xs font-bold">
                {shopName.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00AA5B] border-2 border-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate max-w-[170px]">
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
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00AA5B]" />
              Online
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExpandToFullChat}
            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Perbesar ke halaman penuh (/chat/[slug])"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Tutup chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Pinned Product Preview Card */}
      <div className="bg-[#F8FAFC] border-b border-border/60 p-2.5 flex items-center gap-3 shrink-0">
        <div className="relative h-12 w-12 rounded-xl bg-white border border-border/80 overflow-hidden shrink-0 shadow-2xs">
          <Image
            src={product.imageUrl || "https://picsum.photos/seed/placeholder/200/200"}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground truncate leading-tight">
            {product.title}
          </p>
          <div className="flex items-center justify-between gap-1 mt-1">
            <span className="text-xs font-black text-[#00AA5B]">
              Rp {product.price.toLocaleString("id-ID")}
            </span>
            {!hasSentProductCard && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend("Tanya tentang produk ini", true)}
                className="h-6 px-2 text-[9px] font-bold rounded-lg border-[#00AA5B]/40 text-[#00AA5B] hover:bg-[#00AA5B]/10 shrink-0"
              >
                Lampirkan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Messages Container */}
      <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-3 bg-[#FAFAFA]">
        {/* Timestamp Separator */}
        <div className="text-center my-1">
          <span className="text-[9px] font-semibold text-muted-foreground/70 bg-white/80 border border-border/60 px-2.5 py-0.5 rounded-full shadow-2xs">
            Percakapan Baru
          </span>
        </div>

        {/* Message bubbles */}
        {messages.length === 0 ? (
          <div className="text-center space-y-2 mt-4">
            <p className="text-xs font-bold text-foreground">
              Mulai Percakapan dengan {shopName}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
              Tanyakan ketersediaan produk, spesifikasi, atau konsultasi sebelum membeli.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderRole === "BUYER";
            return (
              <div
                key={m.id}
                id={`modal-msg-${m.id}`}
                className={cn(
                  "flex w-full group relative transition-colors duration-200",
                  isMe ? "justify-end" : "justify-start",
                  highlightedMsgId === m.id && "bg-[#00AA5B]/10 p-1.5 rounded-2xl"
                )}
              >
                {/* Swipe Indicator Background for Mobile Gesture */}
                {swipingId === m.id && Math.abs(swipeOffset) > 8 && (
                  <div
                    className={cn(
                      "absolute inset-y-0 flex items-center pointer-events-none md:hidden z-0",
                      swipeOffset > 0 ? "left-1" : "right-1"
                    )}
                    style={{
                      opacity: Math.min(Math.abs(swipeOffset) / 25, 1),
                      transform: `scale(${Math.min(0.7 + Math.abs(swipeOffset) / 50, 1.15)})`,
                    }}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-xs",
                        Math.abs(swipeOffset) >= 30
                          ? "bg-[#00AA5B] text-white"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      <Reply className={cn("w-3.5 h-3.5", swipeOffset > 0 ? "rotate-180" : "")} />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] flex items-end gap-1.5",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* DESKTOP HOVER ACTION: Tombol Reply di samping bubble */}
                  <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-all duration-150 pb-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInitiateReply(m);
                      }}
                      title="Balas pesan ini"
                      className="h-6 w-6 rounded-full bg-white border border-border shadow-xs hover:bg-[#00AA5B] hover:text-white text-muted-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                    >
                      <Reply className="w-3 h-3 rotate-180" />
                    </button>
                  </div>

                  {/* Bubble Container with Mobile Swipe */}
                  <div
                    className={cn(
                      "flex flex-col gap-1 w-full touch-pan-y transition-transform z-10",
                      isMe ? "items-end" : "items-start"
                    )}
                    style={{
                      transform:
                        swipingId === m.id ? `translateX(${swipeOffset}px)` : "translateX(0px)",
                        transition: swipingId === m.id ? "none" : "transform 0.2s ease-out",
                    }}
                    onTouchStart={(e) => handleTouchStart(m.id, e)}
                    onTouchMove={(e) => handleTouchMove(m, e)}
                    onTouchEnd={() => handleTouchEnd(m)}
                    onDoubleClick={() => handleInitiateReply(m)}
                  >
                    {/* Optional Attached Product Card inside message */}
                    {m.productPreview && (
                      <div className="bg-white border border-border/80 rounded-2xl p-2.5 shadow-2xs w-64 mb-1 text-left">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-11 w-11 rounded-lg bg-muted overflow-hidden shrink-0">
                            <Image
                              src={
                                m.productPreview.imageUrl ||
                                "https://picsum.photos/seed/placeholder/200/200"
                              }
                              alt={m.productPreview.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-foreground truncate">
                              {m.productPreview.title}
                            </p>
                            <p className="text-xs font-black text-[#00AA5B] mt-0.5">
                              Rp {m.productPreview.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bubble Text */}
                    <div
                      className={cn(
                        "px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-2xs",
                        isMe
                          ? "bg-[#00AA5B] text-white rounded-tr-xs"
                          : "bg-white border border-border/80 text-[#212121] rounded-tl-xs"
                      )}
                    >
                      {/* Quote Box for Reply */}
                      {m.replyTo && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(m.replyTo!.messageId);
                          }}
                          className={cn(
                            "mb-2 -mx-1 -mt-0.5 rounded-lg overflow-hidden cursor-pointer transition-all duration-150 select-none flex items-stretch border shadow-2xs group/quote",
                            isMe
                              ? "bg-black/15 hover:bg-black/25 border-white/20 text-white"
                              : "bg-slate-50/95 hover:bg-slate-100/95 border-emerald-500/20 text-[#2E3137]"
                          )}
                          title="Klik untuk melihat pesan asli"
                        >
                          {/* Accent Vertical Strip */}
                          <div
                            className={cn(
                              "w-1 shrink-0",
                              isMe ? "bg-white" : "bg-[#00AA5B]"
                            )}
                          />
                          <div className="px-2 py-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[9.5px] font-bold leading-none">
                              <Reply className="w-2.5 h-2.5 rotate-180 shrink-0 opacity-80" />
                              <span
                                className={cn(
                                  "truncate",
                                  isMe ? "text-white" : "text-[#00AA5B]"
                                )}
                              >
                                {m.replyTo.senderRole === "BUYER" ? "Kamu" : m.replyTo.senderName}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-[10px] truncate mt-0.5 leading-snug font-normal line-clamp-1",
                                isMe ? "text-white/85" : "text-slate-600"
                              )}
                            >
                              {m.replyTo.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {m.text}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground px-1">
                      <span>
                        {m.createdAt?.seconds
                          ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Baru saja"}
                      </span>
                      {isMe && (
                        m.isRead ? (
                          <CheckCheck className="w-3 h-3 text-[#00AA5B]" />
                        ) : (
                          <Check className="w-3 h-3 text-muted-foreground/60" />
                        )
                      )}
                      {/* Tombol Balas Cepat Mobile */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInitiateReply(m);
                        }}
                        title="Balas pesan"
                        className="md:hidden flex items-center gap-0.5 text-[8px] font-medium text-muted-foreground/70 hover:text-[#00AA5B] active:text-[#00AA5B] active:scale-95 transition-all ml-1 px-1 py-0.5 rounded"
                      >
                        <Reply className="w-2 h-2 rotate-180" />
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

      {/* 4. Quick Message Templates (Pesan Cepat) */}
      <div className="bg-white border-t border-border/60 px-3 py-2 shrink-0">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Template Pesan Cepat:
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {QUICK_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(tmpl)}
              className="text-[10px] font-semibold bg-[#F8FAFC] hover:bg-[#00AA5B]/10 hover:text-[#00AA5B] text-foreground border border-border/80 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {tmpl}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Bar */}
      <div className="bg-white p-2.5 border-t border-border shrink-0">
        {!user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] font-medium text-amber-800">
              Masuk akun untuk kirim pesan
            </span>
            <Button
              size="sm"
              onClick={() => router.push(`/login?redirect=/products/${product.id}`)}
              className="h-7 px-2.5 text-xs font-bold rounded-lg bg-[#00AA5B] text-white"
            >
              <LogIn className="w-3 h-3 mr-1" /> Login
            </Button>
          </div>
        ) : (
          <div>
            {/* Replying Banner Bar */}
            {replyingTo && (
              <div className="mb-2 p-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1 self-stretch bg-[#00AA5B] rounded-full shrink-0 min-h-[24px]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00AA5B]">
                      <Reply className="w-2.5 h-2.5 rotate-180" />
                      <span>Membalas {replyingTo.senderName}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate line-clamp-1 mt-0.5">
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
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis pesan ke penjual..."
                className="h-9 rounded-xl bg-[#F8FAFC] border-border text-xs focus-visible:ring-[#00AA5B]/20"
                disabled={sending}
              />
              <ChatEmojiPicker
                onSelectEmoji={(emoji) => {
                  setInputText((prev) => prev + emoji);
                  inputRef.current?.focus();
                }}
                triggerClassName="hidden sm:flex h-9 w-9"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="h-9 w-9 p-0 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shrink-0 shadow-sm disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
