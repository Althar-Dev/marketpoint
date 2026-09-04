"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
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
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat]);

  const shopRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "shops", user.uid);
  }, [db, user]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  if (!mounted || authLoading || shopLoading) {
    return (
      <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex gap-4">
        <Skeleton className="w-80 h-full rounded-2xl" />
        <Skeleton className="flex-1 h-full rounded-2xl" />
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Logic dummy untuk menambah pesan
    const newMsg = {
      id: Date.now(),
      text: newMessage,
      sender: "merchant",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setSelectedChat(prev => ({
      ...prev,
      messages: [...prev.messages, newMsg as any]
    }));
    setNewMessage("");
  };

  return (
    <main className="h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row bg-[#F8FAFC]">
      
      {/* Left Sidebar: Chat List */}
      <aside className="w-full md:w-80 border-r border-border bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-black text-[#212121] tracking-tight mb-3">Chat Pembeli</h2>
          <div className="relative">
            <Icon icon="ph:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Cari percakapan..." className="h-9 pl-9 rounded-xl bg-muted/30 border-transparent focus:bg-white text-[11px] font-bold" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {MOCK_CHATS.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-4 flex items-start gap-3 transition-colors border-b border-border/50",
                selectedChat.id === chat.id ? "bg-[#00AA5B]/5 border-l-4 border-l-[#00AA5B]" : "hover:bg-muted/30"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                  <AvatarImage src={chat.userAvatar} />
                  <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-xs font-black">
                    {chat.userName.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00AA5B] border-2 border-white shadow-sm"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[12px] font-black text-[#2E3137] truncate">{chat.userName}</span>
                  <span className="text-[9px] text-muted-foreground font-medium">{chat.time}</span>
                </div>
                <p className={cn(
                  "text-[10px] truncate leading-tight",
                  chat.unread > 0 ? "text-foreground font-bold" : "text-muted-foreground font-medium"
                )}>
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="h-4 min-w-4 px-1 rounded-full bg-[#00AA5B] flex items-center justify-center shrink-0 shadow-sm shadow-[#00AA5B]/20">
                  <span className="text-[8px] font-black text-white">{chat.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content: Chat View */}
      <section className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-border shadow-sm">
              <AvatarImage src={selectedChat.userAvatar} />
              <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-[10px] font-black uppercase">
                {selectedChat.userName.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-[#2E3137] leading-none">{selectedChat.userName}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", selectedChat.online ? "bg-[#00AA5B]" : "bg-muted-foreground/30")}></div>
                <span className="text-[9px] text-muted-foreground font-bold tracking-wide">
                  {selectedChat.online ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5">
               <Icon icon="ph:phone-bold" className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#00AA5B] hover:bg-[#00AA5B]/5">
               <Icon icon="ph:dots-three-outline-vertical-fill" className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#F8FAFC]/50 no-scrollbar"
        >
          {selectedChat.messages.map((msg: any) => {
            const isMerchant = msg.sender === 'merchant';
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-300",
                  isMerchant ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] md:max-w-[65%] space-y-1",
                  isMerchant ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl shadow-sm border border-border/50",
                    isMerchant 
                      ? "bg-[#00AA5B] text-white rounded-tr-none border-[#00AA5B]/10" 
                      : "bg-white text-[#2E3137] rounded-tl-none"
                  )}>
                    <p className="text-[12px] font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[8px] text-muted-foreground font-bold opacity-60 uppercase">{msg.time}</span>
                    {isMerchant && <Icon icon="ph:checks-bold" className="w-3 h-3 text-[#00AA5B]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-2xl border border-border/50">
             <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary shrink-0">
               <Icon icon="ph:plus-bold" className="w-4 h-4" />
             </Button>
             <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan untuk pembeli..." 
                className="flex-1 h-9 bg-transparent border-none shadow-none focus-visible:ring-0 text-[12px] font-bold"
             />
             <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[#FFC400] shrink-0">
                  <Icon icon="ph:smiley-bold" className="w-4 h-4" />
                </Button>
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="h-9 w-9 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-lg shadow-[#00AA5B]/20 shrink-0"
                >
                  <Icon icon="ph:paper-plane-right-fill" className="w-4 h-4" />
                </Button>
             </div>
          </form>
        </div>
      </section>
    </main>
  );
}
