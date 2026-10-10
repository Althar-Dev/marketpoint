"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser, useFirestore } from "@/firebase";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Plus, 
  Smile, 
  Send, 
  MoreVertical, 
  Check,
  CheckCheck,
  ChevronLeft,
  ExternalLink,
  ShoppingBag,
  Reply,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ChatThread, 
  ChatMessage, 
  ChatReplyPreview,
  subscribeToShopChats, 
  subscribeToChatMessages, 
  sendChatMessage, 
  markChatReadByShop 
} from "@/lib/chat-service";
import Link from "next/link";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";

export default function MerchantChatPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { shop: currentShop, shopId: currentShopId, loading: merchantLoading } = useMerchantShop();
  
  const [mounted, setMounted] = useState(false);
  const [realChats, setRealChats] = useState<ChatThread[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailOnMobile, setShowDetailOpenMobile] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleInitiateReply = (msg: ChatMessage) => {
    const senderTitle =
      msg.senderRole === "SELLER"
        ? "Kamu"
        : msg.senderName || selectedChat?.buyerName || "Pembeli";
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
    const el = document.getElementById(`merchant-msg-${msgId}`);
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

  const handleSelectChat = useCallback((chat: ChatThread) => {
    setSelectedChat(chat);
    setShowDetailOpenMobile(true);
    if (db) {
      markChatReadByShop(db, chat.id);
    }
  }, [db]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || isSending) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      setIsSending(true);
      await sendChatMessage(db, {
        shopId: selectedChat.shopId || currentShopId || "shop",
        shopSlug: selectedChat.shopSlug || currentShop?.slug || "shop",
        shopName: selectedChat.shopName || currentShop?.name || "Penjual",
        shopLogo: selectedChat.shopLogo || currentShop?.logoUrl || "",
        buyerId: selectedChat.buyerId,
        buyerName: selectedChat.buyerName || "Pembeli",
        buyerAvatar: selectedChat.buyerAvatar || "",
        senderId: user?.uid || "seller",
        senderRole: "SELLER",
        senderName: currentShop?.name || user?.displayName || "Penjual",
        senderAvatar: currentShop?.logoUrl || user?.photoURL || "",
        text,
        replyTo: replyingTo || null,
      });
      setReplyingTo(null);
    } catch (err) {
      console.error("Gagal mengirim balasan penjual:", err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to real chat threads for current active shop
  useEffect(() => {
    if (!db || !currentShopId) return;

    const unsub = subscribeToShopChats(db, currentShopId, (threads) => {
      setRealChats(threads);
    });

    return () => unsub();
  }, [db, currentShopId]);

  const displayedChats = realChats;

  const filteredChats = displayedChats.filter((c) => {
    const name = c.buyerName || "";
    const msg = c.lastMessage || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || msg.toLowerCase().includes(q);
  });

  // Select initial chat if available and none selected
  useEffect(() => {
    if (!selectedChat && displayedChats.length > 0) {
      handleSelectChat(displayedChats[0]);
    } else if (selectedChat) {
      // Keep selectedChat updated if its thread data refreshed in realChats
      const updated = displayedChats.find((c) => c.id === selectedChat.id);
      if (updated) {
        if (updated.lastMessage !== selectedChat.lastMessage) {
          setSelectedChat((prev) => (prev ? { ...prev, ...updated } : updated));
        }
      } else if (displayedChats.length === 0) {
        setSelectedChat(null);
      }
    }
  }, [displayedChats, handleSelectChat, selectedChat]);

  // Subscribe to messages of selected chat
  useEffect(() => {
    if (!selectedChat || !db || !selectedChat.id) {
      setMessages([]);
      return;
    }

    markChatReadByShop(db, selectedChat.id);

    const unsub = subscribeToChatMessages(db, selectedChat.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [db, selectedChat?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  if (!mounted || authLoading || merchantLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-[#F8FAFC]">
        <div className="hidden md:flex w-80 border-r border-border bg-white flex-col">
          <div className="p-4 space-y-4">
             <Skeleton className="h-6 w-32" />
             <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="flex-1 p-2 space-y-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
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
    <main className="h-[calc(100vh-64px)] flex overflow-hidden bg-white relative">
      
      {/* Sidebar: Chat List */}
      <aside className={cn(
        "w-full md:w-80 border-r border-border bg-white flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0",
        showDetailOnMobile ? "-translate-x-full md:translate-x-0 absolute md:relative z-0" : "translate-x-0 relative z-10"
      )}>
        <div className="p-4 border-b border-border bg-[#F8FAFC]/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[#212121]">Pesan Masuk</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white border border-transparent hover:border-border">
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <Input 
              placeholder="Cari pembeli..." 
              className="h-9 pl-9 rounded-xl bg-white border-border text-[11px] focus:ring-4 focus:ring-[#00AA5B]/5" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-8 text-center text-muted-foreground my-auto">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/50">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-[#212121]">Belum ada pesan</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                Pesan masuk dari pembeli akan muncul di sini secara otomatis.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const buyerName = chat.buyerName || "Pembeli";
              const buyerAvatar = chat.buyerAvatar || "";
              const unread = chat.unreadByShop ?? 0;
              const timeDisplay = chat.lastMessageAt?.toDate 
                ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Baru saja";

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 transition-all border-b border-border/40 relative text-left",
                    selectedChat?.id === chat.id 
                      ? "bg-[#00AA5B]/5 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[#00AA5B]" 
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11 rounded-2xl border border-border/60 shadow-sm">
                      <AvatarImage src={buyerAvatar} className="object-cover" />
                      <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-semibold">
                        {buyerName.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[12px] font-semibold text-[#2E3137] truncate">{buyerName}</span>
                      <span className="text-[9px] text-muted-foreground">{timeDisplay}</span>
                    </div>
                    <p className={cn(
                      "text-[10px] truncate leading-relaxed",
                      unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}>
                      {chat.lastMessage || "Mulai percakapan..."}
                    </p>
                  </div>
                  {unread > 0 && (
                    <div className="h-4 min-w-4 px-1 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0 shadow-lg shadow-[#00AA5B]/20 ml-1">
                      <span className="text-[8px] font-semibold text-white">{unread}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content: Chat View */}
      <section className={cn(
        "flex-1 flex flex-col bg-[#F8FAFC] relative transition-transform duration-300 md:translate-x-0",
        showDetailOnMobile ? "translate-x-0 relative z-10" : "translate-x-full md:translate-x-0 absolute md:relative z-0"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 border-b border-border flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDetailOpenMobile(false)}
                  className="md:hidden h-8 w-8 rounded-full hover:bg-muted"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-2xl border border-border shadow-sm">
                    <AvatarImage src={selectedChat.buyerAvatar} />
                    <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-semibold">
                      {(selectedChat.buyerName || "P").substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#00AA5B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#2E3137] leading-none">
                    {selectedChat.buyerName || "Pembeli"}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1.5">
                    Pelanggan Toko
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5 transition-all">
                   <MoreVertical className="w-4 h-4" />
                 </Button>
              </div>
            </div>

            {/* Message Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 no-scrollbar"
            >
              <div className="flex justify-center mb-4">
                 <span className="px-3 py-1 rounded-full bg-muted/40 text-[9px] text-muted-foreground border border-border/40">
                   Awal percakapan
                 </span>
              </div>

              {messages.map((msg: any) => {
                const isSeller = msg.senderRole === "SELLER" || msg.sender === "merchant";
                const timeStr = msg.createdAt?.toDate 
                  ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : (msg.time || "");

                return (
                  <div 
                    key={msg.id} 
                    id={`merchant-msg-${msg.id}`}
                    className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors group relative",
                      isSeller ? "justify-end" : "justify-start",
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
                        isSeller ? "flex-row-reverse" : "flex-row"
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
                          isSeller ? "items-end" : "items-start"
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
                        {/* Attached Product Preview if any */}
                        {msg.productPreview && (
                          <div className="mb-2 p-2.5 rounded-2xl bg-white border border-border shadow-sm flex items-center gap-3 w-full max-w-[320px]">
                            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                              {msg.productPreview.imageUrl ? (
                                <img src={msg.productPreview.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-muted-foreground block font-medium">Menanyakan produk:</span>
                              <p className="text-[11px] font-semibold text-[#212121] truncate">{msg.productPreview.title}</p>
                              <p className="text-[11px] font-bold text-[#00AA5B]">Rp {msg.productPreview.price?.toLocaleString("id-ID")}</p>
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

                        <div className={cn(
                          "px-4 py-3 rounded-2xl shadow-sm border text-[12px] leading-relaxed break-words",
                          isSeller 
                            ? "bg-[#00AA5B] text-white rounded-tr-none border-[#00AA5B]/10 shadow-[#00AA5B]/10" 
                            : "bg-white text-[#2E3137] rounded-tl-none border-border/50"
                        )}>
                          {/* Quote Box for Reply */}
                          {msg.replyTo && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(msg.replyTo!.messageId);
                              }}
                              className={cn(
                                "mb-2.5 -mx-1 -mt-0.5 rounded-lg overflow-hidden cursor-pointer transition-all duration-150 select-none flex items-stretch border shadow-2xs group/quote",
                                isSeller
                                  ? "bg-black/15 hover:bg-black/25 border-white/20 text-white"
                                  : "bg-slate-50/95 hover:bg-slate-100/95 border-emerald-500/20 text-[#2E3137]"
                              )}
                              title="Klik untuk melihat pesan asli"
                            >
                              {/* Accent Vertical Strip */}
                              <div
                                className={cn(
                                  "w-1 shrink-0",
                                  isSeller ? "bg-white" : "bg-[#00AA5B]"
                                )}
                              />
                              <div className="px-2.5 py-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[10.5px] font-bold leading-none">
                                  <Reply className="w-2.5 h-2.5 rotate-180 shrink-0 opacity-80" />
                                  <span
                                    className={cn(
                                      "truncate",
                                      isSeller ? "text-white" : "text-[#00AA5B]"
                                    )}
                                  >
                                    {msg.replyTo.senderRole === "SELLER" ? "Kamu" : msg.replyTo.senderName}
                                  </span>
                                </div>
                                <p
                                  className={cn(
                                    "text-[11px] truncate mt-1 leading-snug font-normal line-clamp-1",
                                    isSeller ? "text-white/85" : "text-slate-600"
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
                          {timeStr && <span className="text-[8px] text-muted-foreground opacity-60">{timeStr}</span>}
                          {isSeller && (
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
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-border bg-white sticky bottom-0 z-10 shrink-0">
              {/* Replying Banner Bar */}
              {replyingTo && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
                onSubmit={handleSendMessage} 
                className="flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-border/60 focus-within:border-[#00AA5B]/30 focus-within:ring-4 focus-within:ring-[#00AA5B]/5 transition-all shadow-inner"
              >
                 <Input 
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis balasan untuk pembeli..." 
                    disabled={isSending}
                    className="flex-1 h-10 bg-transparent border-none shadow-none focus-visible:ring-0 text-[12px] text-[#2E3137] placeholder:text-muted-foreground/60 px-3"
                 />
                 <div className="flex items-center gap-1 pr-1">
                    <ChatEmojiPicker
                      onSelectEmoji={(emoji) => {
                        setNewMessage((prev) => prev + emoji);
                        inputRef.current?.focus();
                      }}
                      triggerClassName="hidden sm:flex"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || isSending}
                      className="h-10 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-lg shadow-[#00AA5B]/20 shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                      <Send className="w-4 h-4 mr-2 hidden sm:inline" />
                      <span className="text-[10px] sm:hidden">Kirim</span>
                      <span className="text-[10px] hidden sm:inline">Balas</span>
                    </Button>
                 </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl border border-border/40">
              <MessageCircle className="w-10 h-10 text-[#00AA5B] opacity-40" />
            </div>
            <h3 className="text-sm font-semibold text-[#2E3137]">Pilih percakapan</h3>
            <p className="text-[11px] text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Pilih salah satu pesan di samping untuk mulai berinteraksi dengan pembeli Anda.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function MessageCircle({ className, ...props }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
