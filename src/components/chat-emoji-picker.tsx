"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Ekspresi",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
      "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
      "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖",
      "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
      "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔",
      "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦",
      "😴", "🤤", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🤠"
    ],
  },
  {
    id: "gestures",
    name: "Tangan & Hati",
    icon: "👍",
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋",
      "🤝", "🙏", "👏", "🙌", "👐", "🤲", "💪", "✊", "👊", "🤛",
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✨", "🔥",
      "💯", "🎉", "🎊", "⭐", "🌟", "💫", "💥", "💢", "💬", "💭"
    ],
  },
  {
    id: "shopping",
    name: "Toko & Belanja",
    icon: "🛍️",
    emojis: [
      "🛍️", "🛒", "📦", "🎁", "🏷️", "💳", "💰", "💵", "💸", "🧾",
      "🚚", "🛵", "🚗", "🚲", "🏠", "🏪", "🏬", "🏢", "📱", "💻",
      "🖥️", "📷", "⌚", "🎧", "🎮", "🕹️", "👕", "👖", "👗", "👟",
      "👠", "🎒", "👜", "🕶️", "🧴", "💄", "💍", "💎", "⭐", "🏆"
    ],
  },
  {
    id: "objects",
    name: "Benda & Makanan",
    icon: "☕",
    emojis: [
      "☕", "🍵", "🥤", "🧃", "🍕", "🍔", "🍟", "🌭", "🥪", "🌮",
      "🍜", "🍣", "🍱", "🍙", "🍰", "🎂", "🧁", "🍦", "🍫", "🍩",
      "🍎", "🍌", "🍉", "🍓", "🍒", "🍇", "🥑", "🥦", "🌽", "🥕",
      "⏰", "⌛", "⏳", "🔔", "📢", "📣", "📝", "📌", "📍", "🔒"
    ],
  },
];

export function ChatEmojiPicker({
  onSelectEmoji,
  className,
  triggerClassName,
  align = "end",
}: ChatEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("smileys");
  const [search, setSearch] = useState("");

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji, idx, arr) => arr.indexOf(emoji) === idx)
    : currentCategory.emojis;

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Pilih Emoji"
          className={cn(
            "h-9 w-9 rounded-xl text-muted-foreground hover:text-[#FFC400] hover:bg-[#FFC400]/10 transition-colors shrink-0",
            open && "text-[#FFC400] bg-[#FFC400]/10",
            triggerClassName
          )}
        >
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align={align}
        sideOffset={10}
        className={cn(
          "w-76 sm:w-80 p-0 rounded-2xl bg-white border border-border/80 shadow-xl overflow-hidden z-50",
          className
        )}
      >
        {/* Header Bar */}
        <div className="p-2.5 border-b border-border/60 bg-[#F8FAFC]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari emoji..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-white rounded-lg border border-border/80 focus:outline-none focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/10 placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          {!search && (
            <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1",
                    activeTab === cat.id
                      ? "bg-[#00AA5B] text-white shadow-2xs font-semibold"
                      : "text-muted-foreground hover:bg-slate-200/60 hover:text-foreground"
                  )}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span className="text-[11px]">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emoji Grid Area */}
        <div className="p-2.5 max-h-56 overflow-y-auto no-scrollbar">
          {filteredEmojis.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Tidak ada emoji ditemukan
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-lg hover:bg-slate-100 hover:scale-125 transition-transform active:scale-95 cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-3 py-1.5 border-t border-border/60 bg-[#FAFAFA] flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Klik emoji untuk memasukkan ke chat</span>
          <span className="font-medium text-[#00AA5B]">MarketPoint Chat</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
