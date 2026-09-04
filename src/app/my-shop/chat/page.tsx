"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
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
  Phone, 
  MoreVertical, 
  CheckCheck,
  ChevronLeft,
  Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_CHATS = [
  {
    id: "CHAT-001",
    userName: "Rian Hidayat",
    userAvatar: "https://picsum.photos/seed/u1/100/100",
    lastMessage: "Halo min, apakah lisensi API-nya masih tersedia?",
    time: "10:45",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Halo min, apakah lisensi API-nya masih tersedia?", sender: "customer", time: "10:42" },
      { id: 2, text: "Dan apakah support untuk NextJS 15?", sender: "customer", time: "10:45" },
    ]
  },
  {
    id: "CHAT-002",
    userName: "Dewi Lestari",
    userAvatar: "https://picsum.photos/seed/u2/100/100",
    lastMessage: "Sudah saya bayar ya kak, mohon diproses.",
    time: "Kemarin",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Sore kak, saya mau tanya produk PPOB Engine.", sender: "customer", time: "14:20" },
      { id: 2, text: "Silakan kak, ada yang bisa kami bantu?", sender: "merchant", time: "14:22" },
      { id: 3, text: "Sudah saya bayar ya kak, mohon diproses.", sender: "customer", time: "14:30" },
      { id: 4, text: "Baik kak, pesanan sedang kami verifikasi. Mohon tunggu sebentar ya.", sender: "merchant", time: "14:31" },
    ]
  },
  {
    id: "CHAT-003",
    userName: "Andrianto",
    userAvatar: "https://picsum.photos/seed/u3/100/100",
    lastMessage: "Terima kasih atas bantuannya!",
    time: "2 hari lalu",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Bot WhatsApp-nya sangat stabil!", sender: "customer", time: "09:00" },
      { id: 2, text: "Terima kasih atas bantuannya!", sender: "customer", time: "09:05" },
    ]
  }
];

export default function MerchantChatPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(MOCK_CHATS[0]);
  const [newMessage, setNewMessage] = useState("");
  const [showDetailOnMobile, setShowDetailOpenMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat, selectedChat?.messages]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || authLoading || shopLoading) {
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

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    setShowDetailOpenMobile(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      text: newMessage,
      sender: "merchant",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setSelectedChat((prev: any) => ({
      ...prev,
      messages: [...prev.messages, newMsg]
    }));
    setNewMessage("");
  };

  return (
    <main className="h-[calc(100vh-64px)] flex overflow-hidden bg-white relative">
      
      {/* Sidebar: Chat List */}
      <aside className={cn(
        "w-full md:w-80 border-r border-border bg-white flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0",
        showDetailOnMobile ? "-translate-x-full md:translate-x-0 absolute md:relative z-0" : "translate-x-0 relative z-10"
      )}>
        <div className="p-4 border-b border-border bg-[#F8FAFC]/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-black text-[#212121] tracking-tight">Pesan Masuk</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white border border-transparent hover:border-border">
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <Input 
              placeholder="Cari pembeli..." 
              className="h-9 pl-9 rounded-xl bg-white border-border text-[11px] font-bold focus:ring-4 focus:ring-[#00AA5B]/5" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {MOCK_CHATS.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={cn(
                "w-full p-4 flex items-start gap-3 transition-all border-b border-border/40 relative",
                selectedChat?.id === chat.id 
                  ? "bg-[#00AA5B]/5 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[#00AA5B]" 
                  : "hover:bg-muted/30"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11 rounded-2xl border border-border/60 shadow-sm">
                  <AvatarImage src={chat.userAvatar} className="object-cover" />
                  <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                    {chat.userName.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#00AA5B] border-2 border-white shadow-sm" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[12px] font-black text-[#2E3137] truncate">{chat.userName}</span>
                  <span className="text-[9px] text-muted-foreground font-bold opacity-60 uppercase">{chat.time}</span>
                </div>
                <p className={cn(
                  "text-[10px] truncate leading-relaxed",
                  chat.unread > 0 ? "text-foreground font-black" : "text-muted-foreground font-medium"
                )}>
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="h-4 min-w-4 px-1 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0 shadow-lg shadow-[#00AA5B]/20 ml-1">
                  <span className="text-[8px] font-black text-white">{chat.unread}</span>
                </div>
              )}
            </button>
          ))}
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
                    <AvatarImage src={selectedChat.userAvatar} />
                    <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black uppercase">
                      {selectedChat.userName.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                    selectedChat.online ? "bg-[#00AA5B]" : "bg-muted-foreground/30"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-[#2E3137] leading-none">{selectedChat.userName}</span>
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider mt-1.5 uppercase">
                    {selectedChat.online ? "Aktif Sekarang" : "Offline"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5 transition-all">
                   <Phone className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5 transition-all">
                   <MoreVertical className="w-4 h-4" />
                 </Button>
              </div>
            </div>

            {/* Message Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar"
            >
              <div className="flex justify-center mb-4">
                 <span className="px-3 py-1 rounded-full bg-muted/40 text-[9px] font-black text-muted-foreground uppercase tracking-widest border border-border/40">
                   Awal Percakapan
                 </span>
              </div>

              {selectedChat.messages.map((msg: any) => {
                const isMerchant = msg.sender === 'merchant';
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                      isMerchant ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] md:max-w-[65%] flex flex-col",
                      isMerchant ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl shadow-sm border text-[12px] font-medium leading-relaxed",
                        isMerchant 
                          ? "bg-[#00AA5B] text-white rounded-tr-none border-[#00AA5B]/10 shadow-[#00AA5B]/10" 
                          : "bg-white text-[#2E3137] rounded-tl-none border-border/50"
                      )}>
                        <p>{msg.text}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 px-1">
                        <span className="text-[8px] text-muted-foreground font-black opacity-50 uppercase tracking-tighter">{msg.time}</span>
                        {isMerchant && <CheckCheck className="w-3.5 h-3.5 text-[#00AA5B]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-border bg-white sticky bottom-0 z-10 shrink-0">
              <form 
                onSubmit={handleSendMessage} 
                className="flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-border/60 focus-within:border-[#00AA5B]/30 focus-within:ring-4 focus-within:ring-[#00AA5B]/5 transition-all shadow-inner"
              >
                 <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-[#00AA5B] shrink-0">
                   <Paperclip className="w-4.5 h-4.5" />
                 </Button>
                 <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis balasan..." 
                    className="flex-1 h-10 bg-transparent border-none shadow-none focus-visible:ring-0 text-[12px] font-bold text-[#2E3137] placeholder:text-muted-foreground/60"
                 />
                 <div className="flex items-center gap-1 pr-1">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-[#FFC400] shrink-0 hidden sm:flex">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="h-10 px-4 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-lg shadow-[#00AA5B]/20 shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                      <Send className="w-4 h-4 mr-2 hidden sm:inline" />
                      <span className="text-[10px] font-black sm:hidden">Kirim</span>
                      <span className="text-[10px] font-black hidden sm:inline">Balas</span>
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
            <h3 className="text-sm font-black text-[#2E3137]">Pilih Percakapan</h3>
            <p className="text-[11px] text-muted-foreground mt-2 max-w-xs leading-relaxed font-medium">
              Pilih salah satu pesan di samping untuk mulai berinteraksi dengan pembeli Anda.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

// Re-using local icon to avoid lucide missing issues
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
