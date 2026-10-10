"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { subscribeToBuyerChats, ChatThread } from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MessageCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const unsub = subscribeToBuyerChats(db, user.uid, (list) => {
      setThreads(list);
      // On desktop, auto-redirect to first chat if available
      if (window.innerWidth >= 768 && list.length > 0 && list[0].shopSlug) {
        router.replace(`/chat/${list[0].shopSlug}`);
      }
    });

    return () => unsub();
  }, [user, db, router]);

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.shopName || "").toLowerCase().includes(q) ||
      (t.lastMessage || "").toLowerCase().includes(q)
    );
  });

  if (!mounted || authLoading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <div className="w-full md:w-80 lg:w-88 border-r border-border bg-white flex flex-col p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="space-y-2 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex overflow-hidden bg-white relative font-body text-[#212121]">
      {/* Sidebar: Chat List */}
      <aside className="w-full md:w-80 lg:w-88 border-r border-border bg-white flex flex-col shrink-0">
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
              title="Cari Toko"
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
                    if (thread.shopSlug) {
                      router.push(`/chat/${thread.shopSlug}`);
                    }
                  }}
                  className="w-full p-4 flex items-start gap-3 transition-all border-b border-border/40 relative text-left hover:bg-muted/30 cursor-pointer"
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
                        {thread.shopSlug === "marketpoint" && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/badge/verified.png" alt="" className="w-3 h-3 object-contain shrink-0" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/assets/badge/officials.png" alt="" className="w-3 h-3 object-contain shrink-0" />
                          </>
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

      {/* Main Empty State */}
      <section className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl border border-border/40">
          <MessageCircle className="w-10 h-10 text-[#00AA5B] opacity-40" />
        </div>
        <h3 className="text-sm font-semibold text-[#2E3137]">Pilih percakapan</h3>
        <p className="text-[11px] text-muted-foreground mt-2 max-w-xs leading-relaxed">
          Pilih salah satu pesan di samping untuk mulai berinteraksi dengan penjual toko.
        </p>
      </section>
    </main>
  );
}
