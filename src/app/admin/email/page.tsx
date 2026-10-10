"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle2,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  X,
  Star,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Accounts
const ACCOUNTS = [
  { email: "admin@marketpoint.id", name: "Administrator", role: "Super Admin", usage: "2.4 GB", quota: "10 GB", status: "ACTIVE" },
  { email: "billing@marketpoint.id", name: "Billing Team", role: "Finance", usage: "0.8 GB", quota: "5 GB", status: "ACTIVE" },
  { email: "support@marketpoint.id", name: "Customer Support", role: "CS", usage: "4.1 GB", quota: "10 GB", status: "ACTIVE" },
  { email: "no-reply@marketpoint.id", name: "System Notifications", role: "Automated", usage: "0.1 GB", quota: "2 GB", status: "ACTIVE" },
];

// Mock Emails
const MOCK_EMAILS = [
  { id: "1", from: "billing@marketpoint.id", to: "admin@marketpoint.id", subject: "Laporan Pendapatan Mingguan", preview: "Halo Admin, berikut kami lampirkan rekapitulasi...", date: "09:15", isUnread: true, isStarred: true },
  { id: "2", from: "system@aws.com", to: "admin@marketpoint.id", subject: "[Alert] CPU Usage High - Production Server", preview: "Your instance i-09823129837 is experiencing high CPU...", date: "08:45", isUnread: false, isStarred: false },
  { id: "3", from: "no-reply@xendit.co", to: "billing@marketpoint.id", subject: "Invoice PAID: INV-990120", preview: "Pembayaran untuk invoice tersebut telah berhasil...", date: "Kemarin", isUnread: false, isStarred: true },
  { id: "4", from: "noreply@digiflazz.com", to: "admin@marketpoint.id", subject: "Pembaruan Price List - 10 Oktober 2026", preview: "Terdapat perubahan harga pada beberapa SKU provider...", date: "Kemarin", isUnread: true, isStarred: false },
];

export default function AdminEmailPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"inbox" | "accounts">("inbox");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="h-[calc(100vh-64px)] flex overflow-hidden bg-white">
      {/* 1. Folder & Management Sidebar */}
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
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all",
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
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "sent" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <Send className="w-4 h-4" /> Terkirim
            </button>
            <button 
              onClick={() => { setViewMode("inbox"); setActiveFolder("drafts"); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "drafts" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <FileText className="w-4 h-4" /> Draft
            </button>
            <button 
              onClick={() => { setViewMode("inbox"); setActiveFolder("spam"); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === "inbox" && activeFolder === "spam" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <AlertCircle className="w-4 h-4" /> Spam
            </button>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="p-4 space-y-4">
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-1">Management</p>
          <div className="space-y-1">
            <button 
              onClick={() => setViewMode("accounts")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all",
                viewMode === "accounts" ? "bg-white text-[#00AA5B] shadow-sm border border-border" : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              <UserPlus className="w-4 h-4" /> Akun Email
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 space-y-4">
          <Card className="bg-white border-border/60 shadow-none rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">Storage Info</span>
              <HardDrive className="w-3.5 h-3.5 text-[#00AA5B]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span>7.4 GB / 30 GB</span>
                <span>74%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00AA5B] w-[74%] rounded-full" />
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-[#00AA5B] animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground">Server @marketpoint.id Online</span>
          </div>
        </div>
      </aside>

      {/* 2. Middle Panel: List View */}
      <section className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cari email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-9 rounded-lg bg-slate-50 border-border text-[11px] font-medium focus:ring-0" 
            />
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="w-3.5 h-3.5" />
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
                  "p-4 cursor-pointer transition-all hover:bg-slate-50 relative",
                  selectedEmail?.id === email.id ? "bg-slate-50/80 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:bg-[#00AA5B]" : "",
                  email.isUnread && "bg-emerald-50/20"
                )}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className={cn(
                    "text-xs truncate font-bold",
                    email.isUnread ? "text-slate-950" : "text-slate-600"
                  )}>
                    {email.from.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-muted-foreground shrink-0 font-medium">{email.date}</span>
                </div>
                <h4 className={cn(
                  "text-[11px] mb-1 line-clamp-1",
                  email.isUnread ? "font-extrabold text-slate-900" : "font-semibold text-slate-700"
                )}>
                  {email.subject}
                </h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{email.preview}</p>
                
                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100">
                  {email.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">Daftar Akun @marketpoint.id</h3>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 rounded-lg">
                <Plus className="w-3 h-3" /> Akun Baru
              </Button>
            </div>
            <div className="grid gap-2">
              {ACCOUNTS.map((acc) => (
                <div key={acc.email} className="p-3 rounded-xl border border-border bg-white flex items-center justify-between group hover:border-[#00AA5B]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-50 text-[#00AA5B] flex items-center justify-center font-bold text-xs">
                      {acc.email.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">{acc.email}</p>
                      <p className="text-[9px] text-muted-foreground">{acc.name} • {acc.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Right Panel: Content View */}
      <section className="hidden lg:flex w-[460px] xl:w-[580px] flex-col bg-slate-50/30 overflow-hidden">
        {selectedEmail ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg text-xs font-bold gap-1.5 border-border bg-white">
                  Balas
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white no-scrollbar">
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedEmail.subject}
                </h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      {selectedEmail.from.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedEmail.from}</p>
                      <p className="text-[10px] text-muted-foreground">ke <span className="font-semibold">{selectedEmail.to}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {selectedEmail.date}, 10 Okt 2026
                  </span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
                <p>Halo Admin,</p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <div className="p-4 rounded-xl border border-border bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">laporan_keuangan_oktober.pdf</p>
                      <p className="text-[10px] text-muted-foreground">2.4 MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#00AA5B]">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <p>Terima kasih,<br/><span className="font-bold">Billing Team MarketPoint</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-border flex items-center justify-center shadow-inner">
              <Mail className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800">Pilih pesan untuk dibaca</h3>
              <p className="text-[11px] text-muted-foreground max-w-[280px] leading-relaxed font-medium">
                Gunakan email @marketpoint.id untuk berkomunikasi dengan tim internal dan pihak ketiga secara profesional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Card className="p-3 bg-white border-border/60 shadow-none rounded-xl text-left space-y-1">
                <ShieldCheck className="w-4 h-4 text-[#00AA5B]" />
                <p className="text-[10px] font-bold">Safe Inbox</p>
                <p className="text-[9px] text-muted-foreground leading-tight">E2E Encryption aktif di semua akun internal.</p>
              </Card>
              <Card className="p-3 bg-white border-border/60 shadow-none rounded-xl text-left space-y-1">
                <Server className="w-4 h-4 text-blue-600" />
                <p className="text-[10px] font-bold">Cloud Hosting</p>
                <p className="text-[9px] text-muted-foreground leading-tight">Dihosting mandiri di infrastruktur utama.</p>
              </Card>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
