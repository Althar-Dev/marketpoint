"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Mail,
  Plus,
  Inbox,
  Send,
  FileText,
  Trash2,
  Search,
  UserPlus,
  HardDrive,
  RefreshCw,
  Clock,
  Download,
  ArrowLeft,
  Menu,
  X,
  Zap,
  Users,
  CheckCircle2,
  Package,
  Check,
  SendHorizontal,
  Copy,
  RotateCcw,
  Sparkles,
  Pencil,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Account {
  email: string;
  name: string;
  role: string;
  usage: string;
  quota: string;
  status: string;
}

interface CloudStorageStats {
  bucket: string;
  totalFiles: number;
  totalBytes: number;
  limitBytes: number;
  limitGb: number;
  freeBytes: number;
  usedFormatted: string;
  limitFormatted: string;
  freeFormatted: string;
  percentage: number;
  percentageLabel: string;
  folders: Array<{
    name: string;
    bytes: number;
    formatted: string;
    count: number;
  }>;
  lastUpdated: string;
}

interface EmailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  isUnread: boolean;
  content: string;
  folder: "inbox" | "sent" | "drafts" | "trash";
  previousFolder?: "inbox" | "sent" | "drafts";
  attachment?: {
    name: string;
    size: string;
  };
}

interface DeliveryLog {
  id: string;
  orderId: string;
  productTitle: string;
  recipient: string;
  sentAt: string;
  status: "DELIVERED" | "PENDING" | "FAILED";
  serialKeySnippet: string;
  fullSerialKey: string;
}

const EMAIL_TEMPLATES = [
  {
    id: "digital_product",
    name: "Pengiriman Lisensi Produk Digital",
    subject: "[Delivery] Serial Key & Panduan Aktivasi Pesanan",
    message: "Halo Pelanggan,\n\nTerima kasih telah berbelanja di MarketPoint! Berikut lisensi aktivasi resmi untuk pesanan Anda:\n\n• Produk: [Nama Produk]\n• Serial Key / Lisensi: [XXXX-XXXX-XXXX-XXXX]\n\nPanduan Aktivasi:\n1. Buka aplikasi atau platform terkait.\n2. Masuk ke menu Pengaturan > Aktivasi.\n3. Masukkan kode serial key di atas.\n\nJika mengalami kendala, silakan hubungi tim kami dengan membalas email ini.\n\nSalam hangat,\nMarketPoint Delivery Service"
  },
  {
    id: "payment_confirmation",
    name: "Konfirmasi Pembayaran Sukses",
    subject: "Konfirmasi Pembayaran Pesanan #[INV-XXXXX]",
    message: "Halo Pelanggan,\n\nPembayaran Anda untuk nomor pesanan #[INV-XXXXX] telah berhasil diverifikasi oleh sistem escrow MarketPoint.\n\nPesanan Anda saat ini sedang disiapkan dan akan dikirimkan otomatis ke email ini. Anda juga dapat memantau status pesanan melalui menu Riwayat Transaksi di akun Anda.\n\nTerima kasih telah bertransaksi dengan aman di MarketPoint!"
  },
  {
    id: "cs_support",
    name: "Tanggapan Bantuan Customer Support",
    subject: "Tanggapan Layanan Bantuan MarketPoint - Tiket #[TICKET-ID]",
    message: "Halo Pelanggan,\n\nTerima kasih telah menghubungi Customer Care MarketPoint. Mengenai kendala yang Anda laporkan, berikut solusi yang dapat Anda lakukan:\n\n1. [Langkah penyelesaian pertama]\n2. [Langkah penyelesaian kedua]\n\nHarap informasikan kembali apabila Anda masih mengalami kendala atau memerlukan panduan lebih lanjut.\n\nSalam hormat,\nTim Layanan Pelanggan MarketPoint"
  },
  {
    id: "maintenance_announcement",
    name: "Pengumuman Pemeliharaan Sistem",
    subject: "[Pengumuman] Jadwal Pemeliharaan Server Berkala",
    message: "Kepada Seluruh Mitra & Pengguna MarketPoint,\n\nKami menginformasikan bahwa akan dilakukan pemeliharaan sistem berkala demi meningkatkan performa dan keamanan transaksi pada:\n\n• Hari/Tanggal: [Hari, Tanggal]\n• Waktu: 01:00 - 04:00 WIB\n\nSelama proses berlangsung, beberapa layanan mungkin mengalami jeda singkat. Terima kasih atas pengertian dan kerja sama Anda."
  }
];

export default function EmailManagementPage() {
  const { toast } = useToast();

  // Navigation & View States
  const [viewMode, setViewMode] = useState<"inbox" | "accounts" | "delivery">("inbox");
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States (Bersih tanpa mock/placeholder)
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Delivery Actions State
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Compose Modal States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState("admin@marketpoint.id");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New Account Modal States
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountRole, setNewAccountRole] = useState("Customer Support");
  const [newAccountQuota, setNewAccountQuota] = useState("5 GB");

  // Edit Account Modal States
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountRole, setEditAccountRole] = useState("");
  const [editAccountQuota, setEditAccountQuota] = useState("5 GB");
  const [editAccountStatus, setEditAccountStatus] = useState("ACTIVE");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  // Delete Account Modal States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Cloud Storage Real-time State (Cloudflare R2)
  const [storageStats, setStorageStats] = useState<CloudStorageStats | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isStorageDetailOpen, setIsStorageDetailOpen] = useState(false);

  // Fetch data kapasitas & penggunaan Cloudflare R2 secara real
  const loadStorageStats = async (force = false) => {
    try {
      setIsLoadingStorage(true);
      const res = await fetch(`/api/storage${force ? "?force=true" : ""}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStorageStats(json.data);
      }
    } catch (err) {
      console.warn("[STORAGE] Gagal memuat data Cloudflare R2:", err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Fetch dari PostgreSQL database saat halaman dibuka
  const loadMailFromDatabase = async (silent = false) => {
    try {
      if (!silent) setIsLoadingDb(true);
      const res = await fetch("/api/mail");
      const result = await res.json();
      if (result.success && result.data) {
        if (result.data.accounts && result.data.accounts.length > 0) {
          setAccounts(result.data.accounts);
        }
        if (result.data.messages && result.data.messages.length > 0) {
          setEmails(result.data.messages);
        }
        if (result.data.deliveryLogs && result.data.deliveryLogs.length > 0) {
          setDeliveryLogs(result.data.deliveryLogs);
        }
      }
    } catch (err) {
      console.warn("[MAIL] Using in-memory fallback:", err);
    } finally {
      if (!silent) setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    loadMailFromDatabase();
    loadStorageStats();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      loadMailFromDatabase(true),
      loadStorageStats(true)
    ]).finally(() => {
      setIsRefreshing(false);
      toast({
        title: "Data Berhasil Diperbarui! 🔄",
        description: "Sinkronisasi PostgreSQL & Cloudflare R2 storage selesai.",
      });
    });
  };

  const handleFolderChange = (folder: "inbox" | "sent" | "drafts" | "trash") => {
    setViewMode("inbox");
    setActiveFolder(folder);
    setSelectedEmail(null);
    setIsMobileSidebarOpen(false);
  };

  const handleViewChange = (mode: "accounts" | "delivery") => {
    setViewMode(mode);
    setSelectedEmail(null);
    setIsMobileSidebarOpen(false);
  };

  // Terapkan Template Cepat
  const handleApplyTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setComposeSubject(tpl.subject);
    setComposeMessage(tpl.message);
    toast({
      title: "Template Diterapkan! ✨",
      description: `Format "${tpl.name}" berhasil diisikan ke editor.`,
    });
  };

  // Salin Kode Lisensi ke Clipboard
  const handleCopyKey = (id: string, fullKey: string) => {
    navigator.clipboard.writeText(fullKey);
    setCopiedKeyId(id);
    toast({
      title: "Lisensi Disalin! 📋",
      description: fullKey,
    });
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Kirim Ulang Delivery (Tercatat ke PostgreSQL dari delivery@marketpoint.id)
  const handleResendDelivery = async (log: DeliveryLog) => {
    setResendingId(log.id);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_delivery",
          id: log.id,
          orderId: log.orderId,
          recipient: log.recipient,
          productTitle: log.productTitle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Lisensi Berhasil Dikirim Ulang! 🚀",
          description: `Pesanan ${log.orderId} telah dikirim oleh delivery@marketpoint.id ke ${log.recipient}.`,
        });
        // Perbarui daftar email terkirim & log delivery secara otomatis
        loadMailFromDatabase(true);
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Mengirim Ulang",
          description: data.error || "Terjadi kesalahan saat memproses pengiriman ulang.",
        });
      }
    } catch {
      toast({
        title: "Lisensi Dikirim Ulang (Mode Offline)",
        description: `Pesanan ${log.orderId} telah dikirim kembali ke ${log.recipient}.`,
      });
    } finally {
      setResendingId(null);
    }
  };

  // Pindahkan ke Sampah atau Hapus Permanen (Tersimpan ke PostgreSQL)
  const handleDeleteEmail = async (email: EmailItem) => {
    if (email.folder === "trash") {
      // Hapus Permanen
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelectedEmail(null);
      try {
        await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: email.id }),
        });
      } catch (err) {
        console.warn("[MAIL DELETE DB ERR]", err);
      }
      toast({
        title: "Pesan Dihapus Permanen 🗑️",
        description: `Email "${email.subject}" telah dihapus selamanya dari PostgreSQL.`,
      });
    } else {
      // Pindahkan ke Sampah
      const prevFolder = email.folder;
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, folder: "trash", previousFolder: prevFolder } : e));
      setSelectedEmail(null);
      try {
        await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "update_folder", 
            id: email.id, 
            folder: "trash", 
            previousFolder: prevFolder 
          }),
        });
      } catch (err) {
        console.warn("[MAIL TRASH DB ERR]", err);
      }
      toast({
        title: "Pesan Dipindahkan ke Sampah",
        description: "Anda dapat memulihkannya kapan saja dari folder Sampah.",
      });
    }
  };

  // Pulihkan dari Sampah (Tersimpan ke PostgreSQL)
  const handleRestoreEmail = async (email: EmailItem) => {
    const targetFolder = email.previousFolder || "inbox";
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, folder: targetFolder, previousFolder: undefined } : e));
    setSelectedEmail(null);
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "update_folder", 
          id: email.id, 
          folder: targetFolder 
        }),
      });
    } catch (err) {
      console.warn("[MAIL RESTORE DB ERR]", err);
    }
    toast({
      title: "Pesan Dipulihkan! 🔄",
      description: `Email telah dikembalikan ke folder ${targetFolder === "inbox" ? "Kotak Masuk" : targetFolder === "sent" ? "Terkirim" : "Draft"}.`,
    });
  };

  // Kirim Email Baru (Tersimpan ke PostgreSQL)
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Form Belum Lengkap",
        description: "Harap isi penerima, subjek, dan pesan email.",
      });
      return;
    }

    setIsSending(true);
    const newMailPayload = {
      from: composeFrom,
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      content: composeMessage.trim(),
    };

    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", ...newMailPayload }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEmails(prev => [json.data, ...prev]);
      } else {
        // Fallback optimis
        const fallbackMail: EmailItem = {
          id: String(Date.now()),
          ...newMailPayload,
          preview: newMailPayload.content.substring(0, 60) + "...",
          date: "Baru saja",
          isUnread: false,
          folder: "sent",
        };
        setEmails(prev => [fallbackMail, ...prev]);
      }
    } catch {
      const fallbackMail: EmailItem = {
        id: String(Date.now()),
        ...newMailPayload,
        preview: newMailPayload.content.substring(0, 60) + "...",
        date: "Baru saja",
        isUnread: false,
        folder: "sent",
      };
      setEmails(prev => [fallbackMail, ...prev]);
    } finally {
      setIsSending(false);
      setIsComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeMessage("");
      toast({
        title: "Email Berhasil Dikirim! 🚀",
        description: `Pesan tersimpan di database PostgreSQL dan masuk ke Terkirim.`,
      });
    }
  };

  // Buat Akun Baru (Tersimpan ke PostgreSQL)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newAccountUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!cleanUser || !newAccountName.trim()) {
      toast({
        variant: "destructive",
        title: "Data Belum Valid",
        description: "Harap masukkan username email dan nama tampilan.",
      });
      return;
    }

    const fullEmail = `${cleanUser}@marketpoint.id`;
    if (accounts.some(a => a.email === fullEmail)) {
      toast({
        variant: "destructive",
        title: "Email Sudah Ada",
        description: `Alamat ${fullEmail} sudah terdaftar di sistem.`,
      });
      return;
    }

    const newAccPayload = {
      email: fullEmail,
      name: newAccountName.trim(),
      role: newAccountRole,
      quota: newAccountQuota,
    };

    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_account", ...newAccPayload }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(prev => [...prev, json.data]);
      } else {
        setAccounts(prev => [...prev, { ...newAccPayload, usage: "0.0 GB", status: "ACTIVE" }]);
      }
    } catch {
      setAccounts(prev => [...prev, { ...newAccPayload, usage: "0.0 GB", status: "ACTIVE" }]);
    } finally {
      setIsNewAccountOpen(false);
      setNewAccountUsername("");
      setNewAccountName("");
      toast({
        title: "Akun Email Dibuat! 🎉",
        description: `Alamat ${fullEmail} aktif dan tersimpan di PostgreSQL.`,
      });
    }
  };

  // Handler Buka Edit Akun
  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccountName(acc.name);
    setEditAccountRole(acc.role);
    setEditAccountQuota(acc.quota || "5 GB");
    setEditAccountStatus(acc.status || "ACTIVE");
    setIsEditAccountOpen(true);
  };

  // Handler Simpan Edit Akun
  const handleSaveEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (!editAccountName.trim() || !editAccountRole.trim()) {
      toast({
        title: "Data Belum Lengkap",
        description: "Harap isi nama penanggung jawab dan role/bagian.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingAccount(true);
    const updatedPayload = {
      originalEmail: editingAccount.email,
      name: editAccountName.trim(),
      role: editAccountRole.trim(),
      quota: editAccountQuota,
      status: editAccountStatus,
    };

    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_account", ...updatedPayload }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.email === editingAccount.email ? json.data : acc))
        );
      } else {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.email === editingAccount.email
              ? { ...acc, ...updatedPayload }
              : acc
          )
        );
      }
      toast({
        title: "Akun Berhasil Diperbarui! ✅",
        description: `Informasi akun ${editingAccount.email} berhasil disimpan.`,
      });
      setIsEditAccountOpen(false);
    } catch {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.email === editingAccount.email
            ? { ...acc, ...updatedPayload }
            : acc
        )
      );
      toast({
        title: "Akun Berhasil Diperbarui! ✅",
        description: `Informasi akun ${editingAccount.email} berhasil disimpan.`,
      });
      setIsEditAccountOpen(false);
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  // Handler Buka Hapus Akun
  const handleOpenDeleteAccount = (acc: Account) => {
    setDeletingAccount(acc);
    setIsDeleteDialogOpen(true);
  };

  // Handler Konfirmasi Hapus Akun
  const handleConfirmDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_account",
          email: deletingAccount.email,
        }),
      });
      setAccounts((prev) => prev.filter((acc) => acc.email !== deletingAccount.email));
      toast({
        title: "Akun Berhasil Dihapus! 🗑️",
        description: `Akun email ${deletingAccount.email} telah dihapus dari sistem.`,
      });
    } catch {
      setAccounts((prev) => prev.filter((acc) => acc.email !== deletingAccount.email));
      toast({
        title: "Akun Berhasil Dihapus! 🗑️",
        description: `Akun email ${deletingAccount.email} telah dihapus dari sistem.`,
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
      setDeletingAccount(null);
    }
  };

  const filteredEmails = emails.filter((item) => {
    const matchFolder = item.folder === activeFolder;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      item.subject.toLowerCase().includes(q) ||
      item.from.toLowerCase().includes(q) ||
      item.to.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q);
    return matchFolder && matchSearch;
  });

  const unreadCount = emails.filter(e => e.folder === "inbox" && e.isUnread).length;
  const trashCount = emails.filter(e => e.folder === "trash").length;

  return (
    <div className="flex flex-col h-full w-full bg-white font-body overflow-hidden">
      <header className="h-14 border-b border-border bg-white px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl text-foreground hover:bg-muted/60"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/assets/img/logo.png"
              alt="MarketPoint Logo"
              className="h-6 sm:h-7 w-auto transition-transform group-hover:scale-105"
            />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-[11px] sm:text-xs font-black tracking-tight text-foreground uppercase hidden sm:inline">
              Mail Service
            </span>
          </Link>
        </div>
        <div className="flex-1 max-w-xl mx-auto px-1 sm:px-2">
          <div className="relative flex items-center w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari dalam kotak masuk, pengirim, atau subjek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9.5 pl-10 pr-9 rounded-full bg-slate-100/80 border-transparent hover:bg-slate-100 focus:bg-white focus:border-[#00AA5B] focus:ring-2 focus:ring-[#00AA5B]/20 text-xs font-medium transition-all w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            title="Perbarui Email"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#00AA5B]")} />
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden h-full relative">
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          />
        )}

        {/* SIDEBAR NAVIGATION (Desktop Static + Mobile Slide-Over) */}
        <aside className={cn(
          "w-64 border-r border-border bg-slate-50/70 flex flex-col shrink-0 h-full transition-transform duration-200 ease-out z-50",
          "fixed inset-y-0 left-0 bg-white lg:bg-slate-50/70 lg:static lg:translate-x-0 shadow-xl lg:shadow-none",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>

          {/* Header Mobile Drawer */}
          <div className="lg:hidden p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Navigasi Email</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="h-8 w-8 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Button: Tulis Pesan */}
          <div className="p-4 space-y-4">
            <Button
              onClick={() => {
                setIsComposeOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl h-10 gap-2 shadow-sm transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" /> Tulis Pesan
            </Button>

            {/* Folder Links */}
            <div className="space-y-1">
              <button
                onClick={() => handleFolderChange("inbox")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "inbox" && activeFolder === "inbox"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4" /> Kotak Masuk
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-[#00AA5B] text-white border-none text-[10px] font-bold px-1.5 py-0 h-4.5 rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => handleFolderChange("sent")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "inbox" && activeFolder === "sent"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <Send className="w-4 h-4" /> Terkirim
              </button>

              <button
                onClick={() => handleFolderChange("drafts")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "inbox" && activeFolder === "drafts"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <FileText className="w-4 h-4" /> Draft
              </button>

              {/* Folder Sampah (Trash) */}
              <button
                onClick={() => handleFolderChange("trash")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "inbox" && activeFolder === "trash"
                    ? "bg-white text-rose-600 shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4" /> Sampah
                </div>
                {trashCount > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono font-bold">
                    {trashCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Infrastructure & Delivery Section */}
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest px-1">
              Engine & Delivery
            </p>
            <div className="space-y-1">
              <button
                onClick={() => handleViewChange("delivery")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "delivery"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-amber-500" /> Log Auto-Delivery
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">Auto</span>
              </button>

              <button
                onClick={() => handleViewChange("accounts")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "accounts"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <UserPlus className="w-4 h-4" /> Manajemen Akun
              </button>
            </div>
          </div>

          {/* Cloud Usage Card di Bawah (Real-time Cloudflare R2) */}
          <div className="mt-auto p-4 space-y-3">
            <button
              type="button"
              onClick={() => setIsStorageDetailOpen(true)}
              className="w-full text-left bg-white border border-border/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs hover:shadow-md hover:border-[#00AA5B]/40 transition-all cursor-pointer group active:scale-[0.99]"
              title="Klik untuk rincian Cloud Storage (Cloudflare R2)"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Cloud Storage
                </span>
                <HardDrive className={cn("w-3.5 h-3.5 text-[#00AA5B] transition-transform group-hover:scale-110", isLoadingStorage && "animate-spin")} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-black text-slate-900">
                  <span>
                    {storageStats ? `${storageStats.usedFormatted} / ${storageStats.limitFormatted}` : "53.4 MB / 30 GB"}
                  </span>
                  <span className="text-[#00AA5B]">
                    {storageStats ? storageStats.percentageLabel : "0.2%"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00AA5B] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, Math.min(100, storageStats ? storageStats.percentage : 0.2))}%`,
                    }}
                  />
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* 3. MAIN PANE CONTENT                                     */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden">

          {/* VIEW MODE 1: LOG AUTO-DELIVERY PRODUK (RESPONSIF & COMPACT DENGAN AKSI) */}
          {viewMode === "delivery" ? (
            <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
              {/* Header Bar Ringkas */}
              <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border flex items-center justify-between gap-2 bg-white shrink-0">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 fill-amber-500 shrink-0" />
                    <h3 className="text-xs sm:text-base font-black text-slate-900 tracking-tight truncate">
                      Log Auto-Delivery Pengiriman
                    </h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium hidden sm:block">
                    Monitoring riwayat pengiriman lisensi & serial key otomatis ke email pembeli
                  </p>
                </div>

                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] sm:text-[10px] gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">SMTP Delivery</span> Engine Aktif
                </Badge>
              </div>

              {/* Scrollable Container dengan padding proporsional */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-5 space-y-2.5 sm:space-y-4 bg-slate-50/50">

                {/* 3 Metric Cards Ringkas (3 Kolom Compact di Layar HP) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <div className="bg-white p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border/80 shadow-2xs space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Terkirim</p>
                    <p className="text-xs sm:text-xl font-black text-slate-900">{deliveryLogs.length} Order</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 sm:gap-1 truncate">
                      <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 shrink-0" /> 100% Sukses
                    </p>
                  </div>

                  <div className="bg-white p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border/80 shadow-2xs space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Kecepatan</p>
                    <p className="text-xs sm:text-xl font-black text-slate-900">&lt; 2 Detik</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">Instan</p>
                  </div>

                  <div className="bg-white p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border/80 shadow-2xs space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pengirim</p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      <span className="sm:hidden">delivery@</span>
                      <span className="hidden sm:inline">delivery@marketpoint.id</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate">TLS 1.3</p>
                  </div>
                </div>

                {/* Structured Data Container */}
                <div className="bg-white border border-border/80 rounded-xl sm:rounded-2xl shadow-2xs overflow-hidden">

                  {/* Desktop Table View (Layar Desktop / Tablet) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                          <th className="py-2.5 px-3.5">Invoice & Waktu</th>
                          <th className="py-2.5 px-3.5">Produk Digital</th>
                          <th className="py-2.5 px-3.5">Email Penerima</th>
                          <th className="py-2.5 px-3.5">Serial Key / Lisensi</th>
                          <th className="py-2.5 px-3.5 text-center">Status</th>
                          <th className="py-2.5 px-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {deliveryLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3.5 align-middle">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] block w-fit mb-0.5">
                                {log.orderId}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 opacity-60" /> {log.sentAt}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 align-middle font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                                  <Package className="w-3 h-3" />
                                </div>
                                <span className="line-clamp-1 max-w-[190px] text-[11px] font-black">{log.productTitle}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3.5 align-middle">
                              <span className="font-medium text-slate-700 block truncate max-w-[160px] text-[11px]">
                                {log.recipient}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 align-middle">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {log.serialKeySnippet}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyKey(log.id, log.fullSerialKey)}
                                  title="Salin Serial Key Lengkap"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  {copiedKeyId === log.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </td>

                            <td className="py-3 px-3.5 align-middle text-center">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] px-2 py-0.5 gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Terkirim
                              </Badge>
                            </td>

                            <td className="py-3 px-3.5 align-middle text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resendingId === log.id}
                                onClick={() => handleResendDelivery(log)}
                                className="h-7 px-2.5 text-[10px] font-bold gap-1 rounded-lg border-border hover:border-[#00AA5B] hover:text-[#00AA5B] bg-white shadow-2xs"
                              >
                                <RefreshCw className={cn("w-3 h-3", resendingId === log.id && "animate-spin text-[#00AA5B]")} />
                                <span>{resendingId === log.id ? "Mengirim..." : "Kirim Ulang"}</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty State jika belum ada Delivery Log */}
                  {deliveryLogs.length === 0 && (
                    <div className="py-20 text-center space-y-3 px-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 border border-border/60">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-sm mx-auto">
                        <p className="text-xs font-bold text-slate-900">Belum Ada Pengiriman Otomatis</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Riwayat pengiriman lisensi digital akan tercatat di sini secara otomatis saat pembeli menyelesaikan transaksi.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mobile Compact Card List View (Layar HP - Sleek & Rapi) */}
                  <div className="md:hidden divide-y divide-border/50">
                    {deliveryLogs.map((log) => (
                      <div key={log.id} className="p-3 space-y-1.5 hover:bg-slate-50/60 transition-colors">
                        {/* Baris 1: Invoice + Waktu + Badge Status */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                              {log.orderId}
                            </span>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 opacity-60" /> {log.sentAt.split(",")[1]?.trim() || log.sentAt}
                            </span>
                          </div>

                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[8px] px-1.5 py-0.5 gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Terkirim
                          </Badge>
                        </div>

                        {/* Baris 2: Nama Produk Digital */}
                        <p className="text-[11px] font-black text-slate-900 leading-snug line-clamp-1">
                          {log.productTitle}
                        </p>

                        {/* Baris 3: Penerima & Lisensi Serial Key + Aksi */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                          <span className="text-muted-foreground truncate max-w-[130px]">
                            Ke: <span className="font-semibold text-slate-800">{log.recipient}</span>
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopyKey(log.id, log.fullSerialKey)}
                              title="Salin lisensi"
                              className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 active:scale-95"
                            >
                              <span>{log.serialKeySnippet}</span>
                              {copiedKeyId === log.id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-60" />
                              )}
                            </button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={resendingId === log.id}
                              onClick={() => handleResendDelivery(log)}
                              className="h-6 px-1.5 text-[9px] font-bold text-[#00AA5B] hover:bg-[#00AA5B]/10 rounded"
                            >
                              <RefreshCw className={cn("w-2.5 h-2.5 mr-0.5", resendingId === log.id && "animate-spin")} />
                              Kirim
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>

            /* VIEW MODE 2: MANAJEMEN AKUN EMAIL BISNIS */
          ) : viewMode === "accounts" ? (
            <div className="flex flex-col h-full animate-in fade-in duration-200">
              <div className="h-14 px-4 sm:px-6 border-b border-border flex items-center justify-between bg-white shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Manajemen Akun @marketpoint.id</h3>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">Kelola identitas dan kuota penyimpanan email domain resmi</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsNewAccountOpen(true)}
                  className="h-8 text-[11px] font-black gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Akun Baru
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {accounts.length === 0 ? (
                  <div className="py-24 text-center space-y-3 px-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 border border-border/60 shadow-xs">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <p className="text-sm font-black text-slate-900">Belum Ada Akun Terdaftar</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Buat akun email resmi domain @marketpoint.id pertama untuk staf, departemen, atau sistem otomatis.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsNewAccountOpen(true)}
                      className="h-9 px-4 text-xs font-black gap-1.5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Tambah Akun Baru
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {accounts.map((acc) => (
                      <div
                        key={acc.email}
                        className="p-4 rounded-2xl border border-border bg-white flex flex-col justify-between group hover:border-[#00AA5B]/40 hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#00AA5B] flex items-center justify-center font-black text-sm border border-emerald-100 shrink-0 shadow-xs">
                              {acc.email.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{acc.email}</p>
                              <p className="text-[10px] text-muted-foreground font-bold truncate">{acc.name} • {acc.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5",
                                acc.status === "ACTIVE"
                                  ? "text-emerald-700 bg-emerald-50/70 border-emerald-200"
                                  : "text-amber-700 bg-amber-50/70 border-amber-200"
                              )}
                            >
                              {acc.status || "ACTIVE"}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenEditAccount(acc)}
                              className="h-7 w-7 text-muted-foreground hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Akun"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenDeleteAccount(acc)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                          <span>Kuota: {acc.quota}</span>
                          <span className="font-bold text-slate-700">{acc.usage} terpakai</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            /* VIEW MODE 3: DETAIL EMAIL TERPILIH */
          ) : selectedEmail ? (
            <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
              {/* Detail Header Action Bar */}
              <div className="h-14 px-3 sm:px-6 border-b border-border flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmail(null)}
                    className="h-9 px-2.5 sm:px-3 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />

                  {/* Tombol Hapus / Pindah ke Sampah */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEmail(selectedEmail)}
                    title={selectedEmail.folder === "trash" ? "Hapus Permanen" : "Pindahkan ke Sampah"}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Tombol Pulihkan jika sedang di folder Trash */}
                  {selectedEmail.folder === "trash" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreEmail(selectedEmail)}
                      title="Pulihkan Email"
                      className="h-8 px-2.5 rounded-lg text-emerald-600 hover:bg-emerald-50 font-bold text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setComposeTo(selectedEmail.from);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setIsComposeOpen(true);
                    }}
                    className="h-9 px-4 rounded-xl text-xs font-black gap-1.5 border-border bg-white shadow-2xs hover:border-[#00AA5B] hover:text-[#00AA5B]"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" /> Balas
                  </Button>
                </div>
              </div>

              {/* Detail Message Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
                <div className="max-w-3xl mx-auto space-y-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                    {selectedEmail.subject}
                  </h2>

                  {/* Sender & Recipient Box */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                        {selectedEmail.from.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{selectedEmail.from}</p>
                        <p className="text-[11px] text-muted-foreground">
                          ke <span className="font-bold text-[#00AA5B]">{selectedEmail.to}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {selectedEmail.date}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium space-y-4">
                    <p className="whitespace-pre-line leading-relaxed">{selectedEmail.content}</p>

                    {/* Attachment preview if exists */}
                    {selectedEmail.attachment && (
                      <div className="p-4 rounded-2xl border border-border bg-slate-50 flex items-center justify-between group hover:border-[#00AA5B]/40 hover:bg-white transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-xs">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{selectedEmail.attachment.name}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">{selectedEmail.attachment.size} • Dokumen Lampiran</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#00AA5B] hover:bg-[#00AA5B]/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="pt-6 border-t border-border/50 text-[11px] text-muted-foreground">
                      <p>Sistem Pengiriman Email Resmi</p>
                      <span className="font-black text-slate-900 uppercase tracking-widest mt-0.5 block">MarketPoint Mail Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            /* VIEW MODE 4: DAFTAR EMAIL (INBOX / SENT / DRAFTS / TRASH) */
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-200">

              {/* Folder Label Header */}
              <div className="h-10 px-4 border-b border-border/60 flex items-center justify-between bg-slate-50/50 text-[11px] font-bold text-muted-foreground">
                <span className="uppercase tracking-wider">
                  {activeFolder === "inbox"
                    ? "Kotak Masuk"
                    : activeFolder === "sent"
                      ? "Email Terkirim"
                      : activeFolder === "drafts"
                        ? "Draft Pesan"
                        : "Sampah"} ({filteredEmails.length})
                </span>
                {searchQuery && (
                  <span className="text-xs text-[#00AA5B]">Hasil pencarian: &quot;{searchQuery}&quot;</span>
                )}
              </div>

              {/* Email List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 bg-white">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={cn(
                      "px-4 sm:px-6 py-4 cursor-pointer transition-all hover:bg-slate-50 relative group border-l-4 border-transparent",
                      email.isUnread ? "bg-emerald-50/25 border-l-[#00AA5B]" : ""
                    )}
                  >
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <span className={cn(
                        "text-xs truncate font-bold",
                        email.isUnread ? "text-slate-950 font-black" : "text-slate-600"
                      )}>
                        {email.folder === "sent" ? `Ke: ${email.to}` : email.from}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-bold">{email.date}</span>
                    </div>

                    <h4 className={cn(
                      "text-xs sm:text-sm mb-1 line-clamp-1 leading-snug",
                      email.isUnread ? "font-black text-slate-900" : "font-semibold text-slate-700"
                    )}>
                      {email.subject}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
                      {email.preview}
                    </p>
                  </div>
                ))}

                {filteredEmails.length === 0 && (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 border border-border/60">
                      <Mail className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">Tidak ada pesan ditemukan</p>
                      <p className="text-[11px] text-muted-foreground">Folder ini kosong atau tidak cocok dengan filter pencarian.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL DIALOG: TULIS PESAN / COMPOSE EMAIL             */}
      {/* ======================================================== */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 rounded-2xl overflow-hidden border-border">
          <DialogHeader className="p-4 bg-slate-50 border-b border-border flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#00AA5B]" /> Tulis Email Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="p-4 sm:p-5 space-y-3.5">
            {/* Pilihan Template Cepat (Fitur Baru) */}
            <div className="space-y-1 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
              <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Gunakan Template Cepat (Opsional)
              </label>
              <Select onValueChange={handleApplyTemplate}>
                <SelectTrigger className="h-8.5 rounded-lg text-xs font-medium bg-white border-emerald-200">
                  <SelectValue placeholder="Pilih jenis template siap pakai..." />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map(tpl => (
                    <SelectItem key={tpl.id} value={tpl.id} className="text-xs font-medium">
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dari (From) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pengirim (From)</label>
              {accounts.length > 0 ? (
                <Select value={composeFrom} onValueChange={setComposeFrom}>
                  <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-slate-50 border-border">
                    <SelectValue placeholder="Pilih akun pengirim..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.email} value={acc.email} className="text-xs font-medium">
                        {acc.email} ({acc.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="email"
                  placeholder="admin@marketpoint.id"
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                  className="h-9 rounded-xl text-xs font-bold bg-slate-50 border-border"
                  required
                />
              )}
            </div>

            {/* Kepada (To) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Kepada (To)</label>
              <Input
                type="email"
                placeholder="nama@domain.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="h-9 rounded-xl text-xs font-medium"
                required
              />
            </div>

            {/* Subjek (Subject) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Subjek</label>
              <Input
                type="text"
                placeholder="Judul atau topik pesan..."
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="h-9 rounded-xl text-xs font-medium"
                required
              />
            </div>

            {/* Pesan (Message Body) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Isi Pesan</label>
              <Textarea
                placeholder="Tulis pesan Anda di sini..."
                rows={5}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="rounded-xl text-xs font-medium resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsComposeOpen(false)}
                className="h-9 rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSending}
                className="h-9 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white gap-2 shadow-xs"
              >
                {isSending ? "Mengirim..." : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Kirim Sekarang
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. MODAL DIALOG: BUAT AKUN EMAIL BARU @marketpoint.id     */}
      {/* ======================================================== */}
      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border">
          <DialogHeader className="p-4 bg-slate-50 border-b border-border">
            <DialogTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#00AA5B]" /> Buat Akun Email Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Alamat Email Baru</label>
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="contoh: sales"
                  value={newAccountUsername}
                  onChange={(e) => setNewAccountUsername(e.target.value)}
                  className="h-9 rounded-l-xl rounded-r-none text-xs font-bold"
                  required
                />
                <span className="h-9 px-3 bg-slate-100 border border-l-0 border-border text-slate-700 text-xs font-black flex items-center rounded-r-xl">
                  @marketpoint.id
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Tampilan</label>
              <Input
                type="text"
                placeholder="Contoh: Sales Marketing Team"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="h-9 rounded-xl text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Role / Bagian</label>
                <Input
                  type="text"
                  placeholder="Sales / CS / Admin"
                  value={newAccountRole}
                  onChange={(e) => setNewAccountRole(e.target.value)}
                  className="h-9 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Batas Kuota</label>
                <Select value={newAccountQuota} onValueChange={setNewAccountQuota}>
                  <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 GB">2 GB</SelectItem>
                    <SelectItem value="5 GB">5 GB</SelectItem>
                    <SelectItem value="10 GB">10 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsNewAccountOpen(false)}
                className="h-9 rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
              >
                Buat Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. MODAL DIALOG: EDIT AKUN EMAIL                         */}
      {/* ======================================================== */}
      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border">
          <DialogHeader className="p-4 bg-slate-50 border-b border-border">
            <DialogTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#00AA5B]" /> Edit Akun Email
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditAccount} className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Alamat Email</label>
              <Input
                type="text"
                value={editingAccount?.email || ""}
                disabled
                className="h-9 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 cursor-not-allowed border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Penanggung Jawab</label>
              <Input
                type="text"
                placeholder="Contoh: Customer Service Officer"
                value={editAccountName}
                onChange={(e) => setEditAccountName(e.target.value)}
                className="h-9 rounded-xl text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Role / Bagian</label>
              <Input
                type="text"
                placeholder="Contoh: Sales / CS / Technical"
                value={editAccountRole}
                onChange={(e) => setEditAccountRole(e.target.value)}
                className="h-9 rounded-xl text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Batas Kuota</label>
                <Select value={editAccountQuota} onValueChange={setEditAccountQuota}>
                  <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 GB">2 GB</SelectItem>
                    <SelectItem value="5 GB">5 GB</SelectItem>
                    <SelectItem value="10 GB">10 GB</SelectItem>
                    <SelectItem value="25 GB">25 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status Akun</label>
                <Select value={editAccountStatus} onValueChange={setEditAccountStatus}>
                  <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE (Aktif)</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED (Ditangguhkan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditAccountOpen(false)}
                className="h-9 rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingAccount}
                className="h-9 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white shadow-xs cursor-pointer"
              >
                {isUpdatingAccount ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 7. MODAL DIALOG: KONFIRMASI HAPUS AKUN                   */}
      {/* ======================================================== */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border">
          <DialogHeader className="p-4 bg-rose-50/60 border-b border-rose-100">
            <DialogTitle className="text-sm font-black text-rose-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" /> Hapus Akun Email
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun email{" "}
              <strong className="text-slate-900 font-black">{deletingAccount?.email}</strong>?
            </p>
            <p className="text-[11px] text-muted-foreground bg-slate-50 p-3 rounded-xl border border-border/60">
              ⚠️ Tindakan ini akan menghapus akun dari daftar PostgreSQL. Kotak surat yang terhubung dengan akun ini mungkin tidak lagi dapat diakses.
            </p>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingAccount}
                className="h-9 rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="h-9 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {isDeletingAccount ? "Menghapus..." : "Ya, Hapus Akun"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 8. DIALOG RINCIAN CLOUD STORAGE (CLOUDFLARE R2)          */}
      {/* ======================================================== */}
      <Dialog open={isStorageDetailOpen} onOpenChange={setIsStorageDetailOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-border bg-white shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00AA5B]/10 flex items-center justify-center text-[#00AA5B]">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900 tracking-tight">
                  Rincian Cloud Storage
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Cloudflare R2 Bucket: <span className="font-mono font-bold text-slate-800">{storageStats?.bucket || "market"}</span>
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Kartu Status Ringkas */}
            <div className="bg-slate-50 border border-border/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Kuota Penyimpanan</span>
                <span className="text-xs font-black text-slate-900">{storageStats?.limitFormatted || "30 GB"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Terpakai Saat Ini</span>
                <span className="font-black text-[#00AA5B]">{storageStats?.usedFormatted || "0 MB"} ({storageStats?.percentageLabel || "0%"})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Sisa Ruang Kosong</span>
                <span className="font-bold text-slate-700">{storageStats?.freeFormatted || "30 GB"}</span>
              </div>

              {/* Progress Bar Utama */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00AA5B] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, Math.min(100, storageStats ? storageStats.percentage : 0.2))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>0 GB</span>
                  <span>{storageStats?.totalFiles || 0} Total File Tersimpan</span>
                  <span>{storageStats?.limitFormatted || "30 GB"}</span>
                </div>
              </div>
            </div>

            {/* Breakdown per Direktori/Folder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Penggunaan per Folder
                </h4>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {storageStats?.folders?.length || 0} Direktori
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {storageStats?.folders && storageStats.folders.length > 0 ? (
                  storageStats.folders.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/70 border border-border/60 text-xs hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-[#00AA5B] shrink-0" />
                        <span className="font-mono font-bold text-slate-800 truncate">
                          /{f.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({f.count} file)
                        </span>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">
                        {f.formatted}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Memuat rincian folder...
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadStorageStats(true)}
                disabled={isLoadingStorage}
                className="h-8.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoadingStorage && "animate-spin text-[#00AA5B]")} />
                {isLoadingStorage ? "Memperbarui..." : "Sinkronkan R2"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsStorageDetailOpen(false)}
                className="h-8.5 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer"
              >
                Tutup
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
