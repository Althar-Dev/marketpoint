"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Plus, 
  Inbox, 
  Send, 
  FileText, 
  AlertCircle, 
  Trash2, 
  Search, 
  MoreVertical, 
  UserPlus, 
  Server, 
  ShieldCheck, 
  HardDrive,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  Star,
  Clock,
  ArrowRight,
  LayoutGrid,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCOUNTS = [
  { email: "admin@marketpoint.id", name: "Administrator", role: "Super Admin", usage: "2.4 GB", quota: "10 GB", status: "ACTIVE" },
  { email: "billing@marketpoint.id", name: "Billing Team", role: "Finance", usage: "0.8 GB", quota: "5 GB", status: "ACTIVE" },
  { email: "support@marketpoint.id", name: "Customer Support", role: "CS", usage: "4.1 GB", quota: "10 GB", status: "ACTIVE" },
  { email: "no-reply@marketpoint.id", name: "System Notifications", role: "Automated", usage: "0.1 GB", quota: "2 GB", status: "ACTIVE" },
];

const MOCK_EMAILS = [
  { id: "1", from: "billing@marketpoint.id", to: "admin@marketpoint.id", subject: "Laporan Pendapatan Mingguan", preview: "Halo Admin, berikut kami lampirkan rekapitulasi...", date: "09:15", isUnread: true, isStarred: true },
  { id: "2", from: "system@aws.com", to: "admin@marketpoint.id", subject: "[Alert] CPU Usage High - Production Server", preview: "Your instance i-09823129837 is experiencing high CPU...", date: "08:45", isUnread: false, isStarred: false },
  { id: "3", from: "no-reply@xendit.co", to: "billing@marketpoint.id", subject: "Invoice PAID: INV-990120", preview: "Pembayaran untuk invoice tersebut telah berhasil...", date: "Kemarin", isUnread: false, isStarred: true },
  { id: "4", from: "noreply@digiflazz.com", to: "admin@marketpoint.id", subject: "Pembaruan Price List - 10 Oktober 2026", preview: "Terdapat perubahan harga pada beberapa SKU provider...", date: "Kemarin", isUnread: true, isStarred: false },
];

export default function EmailManagementPage() {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"inbox" | "accounts">("inbox");

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* 1. Sidebar: Folder & Account Management */}
      <aside className="w-64 border-r border-border bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-4 space-y-4">
          <Button 
            className="w-full bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl h-10 gap-2 shadow-sm"
            onClick={() => setSelectedEmail(null)}
          >
            <Plus className="w-4 h-4" /> Tulis Pesan
          </Button>

          <div className="space-y-1">
            <button 
              onClick={() => { setViewMode("inbox"); setActiveFolder("inbox"); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "inbox" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4" /> Kotak Masuk
              </div>
              <span className="text-[10px] opacity-60">12</span>
            </button>
            <button 
              onClick={() => { setViewMode("inbox"); setActiveFolder("sent"); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "sent" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <Send className="w-4 h-4" /> Terkirim
            </button>
            <button 
              onClick={() => { setViewMode("inbox"); setActiveFolder("drafts"); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "drafts" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <FileText className="w-4 h-4" /> Draft
            </button>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="p-4 space-y-4">
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1">Infrastructure</p>
          <div className="space-y-1">
            <button 
              onClick={() => setViewMode("accounts")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                viewMode === "accounts" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <UserPlus className="w-4 h-4" /> Manajemen Akun
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-slate-100 transition-all">
              <Server className="w-4 h-4" /> Log Server
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 space-y-4">
          <Card className="bg-white border-border/60 shadow-none rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cloud Usage</span>
              <HardDrive className="w-3.5 h-3.5 text-[#00AA5B]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-black">
                <span>7.4 GB / 30 GB</span>
                <span>74%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-[#00AA5B] w-[74%] rounded-full shadow-[0_0_8px_rgba(0,170,91,0.3)]" />
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 px-1 pb-2">
            <div className="h-2 w-2 rounded-full bg-[#00AA5B] animate-pulse shadow-[0_0_5px_#00AA5B]" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Node @mp-mail-01 Online</span>
          </div>
        </div>
      </aside>

      {/* 2. Middle: List View */}
      <section className="flex-1 flex flex-col min-w-0 border-r border-border bg-white">
        <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cari dalam kotak masuk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-9 rounded-xl bg-slate-50 border-border text-[11px] font-medium focus:bg-white transition-all" 
            />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/50">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/50">
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {viewMode === "inbox" ? (
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border/40">
            {MOCK_EMAILS.map((email) => (
              <div 
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={cn(
                  "p-5 cursor-pointer transition-all hover:bg-slate-50 relative group",
                  selectedEmail?.id === email.id ? "bg-[#00AA5B]/5 shadow-inner after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-[#00AA5B]" : "",
                  email.isUnread && "bg-emerald-50/20"
                )}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                     <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", email.isUnread ? "bg-[#00AA5B]" : "bg-transparent")} />
                     <span className={cn("text-xs truncate font-bold uppercase tracking-wide", email.isUnread ? "text-slate-950" : "text-slate-500")}>
                       {email.from.split('@')[0]}
                     </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-bold">{email.date}</span>
                </div>
                <h4 className={cn(
                  "text-[12px] mb-1 line-clamp-1 leading-snug",
                  email.isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"
                )}>
                  {email.subject}
                </h4>
                <p className="text-[11px] text-muted-foreground/80 line-clamp-1 font-medium">{email.preview}</p>
                
                <div className="absolute right-4 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {email.isStarred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900">Akun Email Bisnis</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Domain utama @marketpoint.id</p>
              </div>
              <Button size="sm" className="h-8 text-[11px] font-black gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-md">
                <Plus className="w-3.5 h-3.5" /> Akun Baru
              </Button>
            </div>
            
            <div className="grid gap-3">
              {ACCOUNTS.map((acc) => (
                <div key={acc.email} className="p-4 rounded-2xl border border-border/80 bg-white flex items-center justify-between group hover:border-[#00AA5B]/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-green-50 text-[#00AA5B] flex items-center justify-center font-black text-sm border border-green-100">
                      {acc.email.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900">{acc.email}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{acc.name} • {acc.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                       <p className="text-[10px] font-bold text-slate-700">{acc.usage} / {acc.quota}</p>
                       <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-[#00AA5B] w-[40%]" />
                       </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Right: Email Viewer */}
      <section className="hidden lg:flex w-[480px] xl:w-[680px] flex-col bg-slate-50/20 overflow-hidden">
        {selectedEmail ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-white shrink-0 shadow-2xs">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                  <AlertCircle className="w-4 h-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:bg-muted">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8.5 px-5 rounded-xl text-xs font-black gap-2 border-border bg-white shadow-sm hover:bg-slate-50">
                  Reply
                </Button>
                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl text-muted-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white no-scrollbar">
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {selectedEmail.subject}
                </h2>
                
                <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-border/40">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/20">
                      {selectedEmail.from.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-950">{selectedEmail.from}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">ke <span className="font-bold text-[#00AA5B]">{selectedEmail.to}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center justify-end gap-1.5">
                      <Clock className="w-3 h-3" />
                      {selectedEmail.date}, 10 Okt 2026
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 font-medium space-y-5">
                <p>Halo Admin,</p>
                <p>
                  Sistem monitoring kami mendeteksi adanya lonjakan aktivitas pada node server utama. Mohon lakukan pengecekan pada dashboard infrastruktur untuk memastikan ketersediaan resource tetap dalam batas aman.
                </p>
                <p>
                  Rekapitulasi penggunaan bandwidth dan CPU terlampir pada dokumen di bawah ini. Harap segera berikan konfirmasi jika diperlukan penambahan instance baru.
                </p>
                
                <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center justify-between group hover:border-[#00AA5B]/40 hover:bg-white transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900">server_usage_report.pdf</p>
                      <p className="text-[10px] text-muted-foreground font-bold">2.4 MB • PDF Document</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-[#00AA5B] hover:bg-[#00AA5B]/10">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>

                <p className="pt-4 border-t border-border/40">Terima kasih,<br/><span className="font-black text-slate-900 uppercase tracking-wide">System Monitoring Team</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="h-24 w-24 rounded-[2.5rem] bg-white border border-border/60 flex items-center justify-center shadow-xl shadow-slate-200/50">
              <Mail className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">Pilih pesan untuk dibaca</h3>
              <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed font-bold uppercase tracking-wider">
                Safe Communication Suite @marketpoint.id
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 w-full max-w-sm">
              <Card className="p-4 bg-white border-border/60 shadow-none rounded-2xl text-left space-y-2 group hover:border-[#00AA5B]/40 transition-colors">
                <ShieldCheck className="w-5 h-5 text-[#00AA5B]" />
                <div>
                  <p className="text-[11px] font-black">Secure Mail</p>
                  <p className="text-[9px] text-muted-foreground leading-tight font-medium">E2E Encryption aktif pada seluruh percakapan.</p>
                </div>
              </Card>
              <Card className="p-4 bg-white border-border/60 shadow-none rounded-2xl text-left space-y-2 group hover:border-blue-400/40 transition-colors">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-[11px] font-black">Cloud Storage</p>
                  <p className="text-[9px] text-muted-foreground leading-tight font-medium">Dihosting mandiri di infrastruktur MarketPoint.</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
