"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  AlertTriangle,
  Printer,
  Sliders,
  Settings2,
  Activity,
  Wifi,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  MailCheck,
  Server,
  MailOpen,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronDown,
  ChevronUp,
  Reply,
  Forward,
  Headphones,
  Bell,
  Archive,
  AlertOctagon,
  FolderInput,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Star,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { renderDeliveryEmailHtml, parsePlainTextDeliveryEmail } from "@/lib/email-template";

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
  createdAt?: string;
  isUnread: boolean;
  content: string;
  folder: "inbox" | "sent" | "drafts" | "trash";
  previousFolder?: "inbox" | "sent" | "drafts";
  attachment?: {
    name: string;
    size: string;
  };
  threadCount?: number;
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
    message: "Halo Pelanggan,\n\nTerima kasih telah berbelanja di MarketPointID! Berikut lisensi aktivasi resmi untuk pesanan Anda:\n\n• Produk: [Nama Produk]\n• Serial Key / Lisensi: [XXXX-XXXX-XXXX-XXXX]\n\nPanduan Aktivasi:\n1. Buka aplikasi atau platform terkait.\n2. Masuk ke menu Pengaturan > Aktivasi.\n3. Masukkan kode serial key di atas.\n\nJika mengalami kendala, silakan hubungi tim kami dengan membalas email ini.\n\nSalam hangat,\nMarketPointID Delivery Service"
  },
  {
    id: "payment_confirmation",
    name: "Konfirmasi Pembayaran Sukses",
    subject: "Konfirmasi Pembayaran Pesanan #[MPoint-XXXXX]",
    message: "Halo Pelanggan,\n\nPembayaran Anda untuk nomor pesanan #[MPoint-XXXXX] telah berhasil diverifikasi oleh sistem escrow MarketPointID.\n\nPesanan Anda saat ini sedang disiapkan dan akan dikirimkan otomatis ke email ini. Anda juga dapat memantau status pesanan melalui menu Riwayat Transaksi di akun Anda.\n\nTerima kasih telah bertransaksi dengan aman di MarketPointID!"
  },
  {
    id: "cs_support",
    name: "Tanggapan Bantuan Customer Support",
    subject: "Tanggapan Layanan Bantuan MarketPointID - Tiket #[TICKET-ID]",
    message: "Halo Pelanggan,\n\nTerima kasih telah menghubungi Customer Care MarketPointID. Mengenai kendala yang Anda laporkan, berikut solusi yang dapat Anda lakukan:\n\n1. [Langkah penyelesaian pertama]\n2. [Langkah penyelesaian kedua]\n\nHarap informasikan kembali apabila Anda masih mengalami kendala atau memerlukan panduan lebih lanjut.\n\nSalam hormat,\nTim Layanan Pelanggan MarketPointID"
  },
  {
    id: "maintenance_announcement",
    name: "Pengumuman Pemeliharaan Sistem",
    subject: "[Pengumuman] Jadwal Pemeliharaan Server Berkala",
    message: "Kepada Seluruh Mitra & Pengguna MarketPointID,\n\nKami menginformasikan bahwa akan dilakukan pemeliharaan sistem berkala demi meningkatkan performa dan keamanan transaksi pada:\n\n• Hari/Tanggal: [Hari, Tanggal]\n• Waktu: 01:00 - 04:00 WIB\n\nSelama proses berlangsung, beberapa layanan mungkin mengalami jeda singkat. Terima kasih atas pengertian dan kerja sama Anda."
  }
];

// Helper avatar brand MarketPointID vs pengirim eksternal
function getBrandAvatar(emailOrFrom: string, explicitAvatar?: string): { type: "image" | "initials"; src?: string; initial: string; bg: string } {
  if (explicitAvatar && explicitAvatar.startsWith("http")) {
    return { type: "image", src: explicitAvatar, initial: "U", bg: "bg-slate-700" };
  }
  const lower = (emailOrFrom || "").toLowerCase();
  if (lower.includes("support@marketpoint.id")) {
    return { type: "image", src: "/assets/img/support.png", initial: "S", bg: "bg-blue-600" };
  }
  if (lower.includes("delivery@marketpoint.id")) {
    return { type: "image", src: "/assets/img/delivery.png", initial: "D", bg: "bg-[#00AA5B]" };
  }
  if (lower.includes("admin@marketpoint.id") || lower.includes("noreply@marketpoint.id") || lower.includes("@marketpoint.id")) {
    return { type: "image", src: "/assets/img/icon.png", initial: "M", bg: "bg-slate-900" };
  }
  if (lower.includes("google.com") || lower.includes("bounces.google.com") || lower.includes("idverification")) {
    return { type: "initials", initial: "G", bg: "bg-[#4285F4]" };
  }

  // Pengirim user: gunakan inisial huruf dengan palet warna ala Gmail (tanpa foto palsu)
  const name = emailOrFrom.includes("<")
    ? emailOrFrom.split("<")[0].trim().replace(/^["']|["']$/g, "")
    : emailOrFrom.split("@")[0] || "U";
  const initial = (name[0] || "U").toUpperCase();
  const colors = [
    "bg-red-500", "bg-purple-600", "bg-indigo-600", "bg-blue-600",
    "bg-amber-600", "bg-teal-600", "bg-rose-500", "bg-cyan-600", "bg-emerald-600"
  ];
  let hash = 0;
  for (let i = 0; i < emailOrFrom.length; i++) {
    hash = emailOrFrom.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bg = colors[Math.abs(hash) % colors.length];
  return { type: "initials", initial, bg };
}

function EmailAvatar({
  email,
  name,
  size = "md"
}: {
  email: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  const brand = getBrandAvatar(email);
  const sizeClasses = {
    sm: "h-6.5 w-6.5 text-[11px]",
    md: "h-8 w-8 text-xs sm:h-9 sm:w-9 sm:text-sm",
    lg: "h-10 w-10 text-sm",
  }[size];

  if (brand.type === "image" && brand.src) {
    return (
      <div className={cn("relative shrink-0 rounded-full overflow-hidden border border-slate-200/80 bg-white shadow-2xs flex items-center justify-center", sizeClasses)}>
        <Image
          src={brand.src}
          alt={name || email}
          width={size === "lg" ? 44 : size === "md" ? 40 : 28}
          height={size === "lg" ? 44 : size === "md" ? 40 : 28}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-bold text-white shadow-2xs select-none",
        brand.bg,
        sizeClasses
      )}
    >
      {brand.initial}
    </div>
  );
}

export default function EmailManagementPage() {
  const { toast } = useToast();

  // Navigation & View States
  const [viewMode, setViewMode] = useState<"inbox" | "accounts" | "delivery" | "settings">("inbox");
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [showEmailTechDetails, setShowEmailTechDetails] = useState(false);
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null);
  const [collapsedMessageIds, setCollapsedMessageIds] = useState<Record<string, boolean>>({});
  const [isInlineReplying, setIsInlineReplying] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState("");
  const [isSendingInlineReply, setIsSendingInlineReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States (Bersih tanpa mock/placeholder)
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Feature 1: Tab Pengaturan SMTP & Diagnostik Koneksi
  const [smtpForm, setSmtpForm] = useState<{
    mode: "direct_mx" | "custom_smtp";
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
    heloDomain: string;
  }>({
    mode: "direct_mx",
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "MarketPointID Delivery",
    fromEmail: "delivery@marketpoint.id",
    heloDomain: "marketpoint.id",
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    step: string;
    latencyMs: number;
    mode: "direct_mx" | "custom_smtp";
    hostUsed?: string;
    response?: string;
    error?: string;
  } | null>(null);

  // Feature 2: Ganti Email Pembeli & Kirim Ulang Modal
  const [isEditBuyerEmailOpen, setIsEditBuyerEmailOpen] = useState(false);
  const [selectedDeliveryForEdit, setSelectedDeliveryForEdit] = useState<DeliveryLog | null>(null);
  const [newBuyerEmail, setNewBuyerEmail] = useState("");
  const [syncTransactionEmail, setSyncTransactionEmail] = useState(true);
  const [resendNowToNewEmail, setResendNowToNewEmail] = useState(true);
  const [isUpdatingBuyerEmail, setIsUpdatingBuyerEmail] = useState(false);

  // Feature 3: Filter Cepat & Pencarian Pintar
  const [emailCategoryFilter, setEmailCategoryFilter] = useState<
    "all" | "unread" | "delivery" | "support" | "admin" | "noreply"
  >("all");

  // Feature 4: Cetak / Simpan PDF
  const emailIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Feature 5: Fitur Select & Multi-Pilihan Email
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [isBulkSelectDropdownOpen, setIsBulkSelectDropdownOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Delivery Actions State & Clear Logs
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isClearLogsDialogOpen, setIsClearLogsDialogOpen] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

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
        if (result.data.smtpSettings) {
          setSmtpForm(result.data.smtpSettings);
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
    setSelectedMailIds([]);
    setIsMobileSidebarOpen(false);
  };

  const handleViewChange = (mode: "accounts" | "delivery" | "settings") => {
    setViewMode(mode);
    setSelectedEmail(null);
    setSelectedMailIds([]);
    setIsMobileSidebarOpen(false);
  };

  // Toggle individual mail select
  const handleToggleSelectMail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all visible
  const handleToggleSelectAll = () => {
    const visibleIds = filteredEmails.map((e) => e.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMailIds.includes(id));
    if (allSelected) {
      setSelectedMailIds([]);
    } else {
      setSelectedMailIds(visibleIds);
    }
    setIsBulkSelectDropdownOpen(false);
  };

  // Select specific filter preset
  const handleSelectPreset = (type: "all" | "unread" | "read" | "none") => {
    setIsBulkSelectDropdownOpen(false);
    if (type === "none") {
      setSelectedMailIds([]);
      return;
    }
    if (type === "all") {
      setSelectedMailIds(filteredEmails.map((e) => e.id));
      return;
    }
    if (type === "unread") {
      setSelectedMailIds(filteredEmails.filter((e) => e.isUnread).map((e) => e.id));
      return;
    }
    if (type === "read") {
      setSelectedMailIds(filteredEmails.filter((e) => !e.isUnread).map((e) => e.id));
      return;
    }
  };

  // Bulk: Tandai Sudah Dibaca
  const handleBulkMarkRead = async () => {
    if (selectedMailIds.length === 0) return;
    const count = selectedMailIds.length;
    setIsProcessingBulk(true);
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_mark_read", ids: selectedMailIds }),
      });
      setEmails((prev) =>
        prev.map((e) => (selectedMailIds.includes(e.id) ? { ...e, isUnread: false } : e))
      );
      toast({
        title: "Ditandai Sudah Dibaca! ✅",
        description: `${count} pesan berhasil ditandai sebagai sudah dibaca.`,
      });
      setSelectedMailIds([]);
    } catch {
      toast({ title: "Gagal memperbarui status email", variant: "destructive" });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Bulk: Tandai Belum Dibaca
  const handleBulkMarkUnread = async () => {
    if (selectedMailIds.length === 0) return;
    const count = selectedMailIds.length;
    setIsProcessingBulk(true);
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_mark_unread", ids: selectedMailIds }),
      });
      setEmails((prev) =>
        prev.map((e) => (selectedMailIds.includes(e.id) ? { ...e, isUnread: true } : e))
      );
      toast({
        title: "Ditandai Belum Dibaca! ✉️",
        description: `${count} pesan ditandai sebagai belum dibaca.`,
      });
      setSelectedMailIds([]);
    } catch {
      toast({ title: "Gagal memperbarui status email", variant: "destructive" });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Bulk: Pindahkan ke Sampah atau Hapus Permanen
  const handleBulkDelete = async () => {
    if (selectedMailIds.length === 0) return;
    const count = selectedMailIds.length;
    setIsProcessingBulk(true);

    if (activeFolder === "trash") {
      try {
        await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "bulk_delete", ids: selectedMailIds }),
        });
        setEmails((prev) => prev.filter((e) => !selectedMailIds.includes(e.id)));
        toast({
          title: "Dihapus Permanen! 🗑️",
          description: `${count} pesan telah dihapus secara permanen dari basis data.`,
        });
        setSelectedMailIds([]);
      } catch {
        toast({ title: "Gagal menghapus pesan", variant: "destructive" });
      } finally {
        setIsProcessingBulk(false);
      }
    } else {
      try {
        await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "bulk_update_folder", ids: selectedMailIds, folder: "trash" }),
        });
        setEmails((prev) =>
          prev.map((e) => (selectedMailIds.includes(e.id) ? { ...e, folder: "trash" } : e))
        );
        toast({
          title: "Dipindahkan ke Sampah! 🗑️",
          description: `${count} pesan dipindahkan ke folder sampah.`,
        });
        setSelectedMailIds([]);
      } catch {
        toast({ title: "Gagal memindahkan pesan", variant: "destructive" });
      } finally {
        setIsProcessingBulk(false);
      }
    }
  };

  // Bulk: Pulihkan dari Sampah
  const handleBulkRestore = async () => {
    if (selectedMailIds.length === 0) return;
    const count = selectedMailIds.length;
    setIsProcessingBulk(true);
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_update_folder", ids: selectedMailIds, folder: "inbox" }),
      });
      setEmails((prev) =>
        prev.map((e) => (selectedMailIds.includes(e.id) ? { ...e, folder: "inbox" } : e))
      );
      toast({
        title: "Pesan Dipulihkan! 🔄",
        description: `${count} pesan berhasil dikembalikan ke Kotak Masuk.`,
      });
      setSelectedMailIds([]);
    } catch {
      toast({ title: "Gagal memulihkan pesan", variant: "destructive" });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Simpan Pengaturan SMTP ke Database
  const handleSaveSmtpSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSmtp(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_smtp_settings", settings: smtpForm }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Pengaturan SMTP Disimpan! ✅",
          description: "Konfigurasi pengiriman email berhasil diperbarui di database.",
        });
        if (json.data) setSmtpForm(json.data);
      } else {
        toast({
          title: "Gagal Menyimpan",
          description: json.error || "Terjadi kesalahan sistem.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan koneksi server.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Diagnostik Uji Koneksi SMTP / Direct MX
  const handleTestConnection = async () => {
    setIsTestingSmtp(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_connection",
          targetEmail: testRecipient.trim(),
          config: smtpForm,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTestResult(json.data);
        if (json.data.success) {
          toast({
            title: "Koneksi Berhasil! 🚀",
            description: `Handshake & verifikasi sukses (${json.data.latencyMs} ms).`,
          });
        } else {
          toast({
            title: "Diagnostik: Koneksi Gagal",
            description: json.data.error || "Gagal menghubungi mail server.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        step: "Koneksi Server",
        latencyMs: 0,
        mode: smtpForm.mode,
        error: err?.message || "Gagal memanggil API diagnostik",
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Buka Modal Ubah Email Pembeli
  const handleOpenChangeEmail = (log: DeliveryLog) => {
    setSelectedDeliveryForEdit(log);
    setNewBuyerEmail(log.recipient);
    setSyncTransactionEmail(true);
    setResendNowToNewEmail(true);
    setIsEditBuyerEmailOpen(true);
  };

  // Simpan Perubahan Email Pembeli & Kirim Ulang Lisensi
  const handleSaveBuyerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryForEdit || !newBuyerEmail.trim()) {
      toast({
        title: "Email Tidak Boleh Kosong",
        description: "Masukkan alamat email penerima yang valid.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingBuyerEmail(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_delivery_recipient",
          orderId: selectedDeliveryForEdit.orderId,
          newRecipient: newBuyerEmail.trim(),
          updateTransaction: syncTransactionEmail,
          resendNow: resendNowToNewEmail,
          productTitle: selectedDeliveryForEdit.productTitle,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Email Pembeli Berhasil Diperbarui! 🎉",
          description: json.message,
        });
        setDeliveryLogs((prev) =>
          prev.map((l) =>
            l.orderId === selectedDeliveryForEdit.orderId
              ? { ...l, recipient: newBuyerEmail.trim() }
              : l
          )
        );
        setIsEditBuyerEmailOpen(false);
        loadMailFromDatabase(true);
      } else {
        toast({
          title: "Gagal Memperbarui Email",
          description: json.error || "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal Memperbarui Email",
        description: "Terjadi kesalahan koneksi.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingBuyerEmail(false);
    }
  };

  // Cetak / Simpan Email sebagai PDF
  const handlePrintEmail = () => {
    if (emailIframeRef.current && emailIframeRef.current.contentWindow) {
      try {
        emailIframeRef.current.contentWindow.focus();
        emailIframeRef.current.contentWindow.print();
        return;
      } catch (err) {
        console.warn("[PRINT IFRAME FAILED, FALLBACK]", err);
      }
    }

    if (!selectedEmail) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Gagal Membuka Jendela Cetak",
        description: "Pastikan pop-up diizinkan pada browser Anda.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedEmail.subject} - MarketPointID Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 2px solid #00AA5B; padding-bottom: 14px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #0f172a; }
            .meta { font-size: 12px; color: #64748b; line-height: 1.6; }
            .meta strong { color: #334155; }
            .content { font-size: 13px; line-height: 1.7; white-space: pre-wrap; margin-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${selectedEmail.subject}</div>
            <div class="meta">
              <div><strong>Dari:</strong> ${selectedEmail.from}</div>
              <div><strong>Kepada:</strong> ${selectedEmail.to}</div>
              <div><strong>Waktu:</strong> ${selectedEmail.date}</div>
            </div>
          </div>
          <div class="content">${selectedEmail.content}</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  // Bersihkan Semua Log Delivery dari Database
  const handleClearAllDeliveryLogs = async () => {
    setIsClearingLogs(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_delivery_logs" }),
      });
      const json = await res.json();
      if (json.success) {
        setDeliveryLogs([]);
        setIsClearLogsDialogOpen(false);
        toast({
          title: "Log Berhasil Dibersihkan! 🧹",
          description: "Semua riwayat pengiriman lisensi telah dibersihkan dari database.",
        });
      } else {
        toast({
          title: "Gagal Membersihkan Log",
          description: json.error || "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal Membersihkan Log",
        description: "Terjadi gangguan koneksi.",
        variant: "destructive",
      });
    } finally {
      setIsClearingLogs(false);
    }
  };

  // Hapus Satu Baris Log Delivery
  const handleDeleteSingleDeliveryLog = async (id: string, orderId: string) => {
    setDeletingLogId(id);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_delivery_log", id }),
      });
      const json = await res.json();
      if (json.success) {
        setDeliveryLogs((prev) => prev.filter((l) => l.id !== id));
        toast({
          title: "Log Dihapus",
          description: `Riwayat pesanan ${orderId} telah dihapus.`,
        });
      } else {
        toast({
          title: "Gagal Menghapus Log",
          description: json.error || "Terjadi kesalahan.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal Menghapus Log",
        description: "Terjadi gangguan koneksi.",
        variant: "destructive",
      });
    } finally {
      setDeletingLogId(null);
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

  // Buka Email dan Tandai Sebagai Sudah Dibaca
  const handleSelectEmail = async (email: EmailItem) => {
    setSelectedEmail(email);

    if (email.isUnread) {
      // Optimistic state update
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isUnread: false } : e))
      );

      // Simpan status terbaca ke database PostgreSQL
      try {
        await fetch("/api/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read", id: email.id }),
        });
      } catch (err) {
        console.warn("[MARK READ ERROR]", err);
      }
    }
  };

  // Tandai Semua Email di Folder Aktif Sebagai Sudah Dibaca
  const handleMarkAllAsRead = async () => {
    setEmails((prev) =>
      prev.map((e) => (e.folder === activeFolder ? { ...e, isUnread: false } : e))
    );
    try {
      await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read", folder: activeFolder }),
      });
      toast({
        title: "Semua Ditandai Terbaca ✅",
        description: "Semua pesan di folder ini telah ditandai sebagai sudah dibaca.",
      });
    } catch (err) {
      console.warn("[MARK ALL READ ERROR]", err);
    }
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

  // Kirim Balasan Langsung (Inline Reply ala Gmail)
  const handleSendInlineReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmail || !inlineReplyText.trim()) return;

    setIsSendingInlineReply(true);
    const replyFrom = composeFrom || "support@marketpoint.id";
    const rawRecipient = targetReplyEmail;
    const matchEmail = rawRecipient.match(/<([^>]+)>/);
    const recipient = matchEmail ? matchEmail[1].trim() : rawRecipient.trim();
    const baseSub = normalizeEmailSubject(selectedEmail.subject);
    const sub = `Re: ${baseSub}`;

    const newMailPayload = {
      from: replyFrom,
      to: recipient,
      subject: sub,
      content: inlineReplyText.trim(),
    };

    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", ...newMailPayload }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Balasan Terkirim! 🚀",
          description: `Pesan balasan berhasil dikirim ke ${recipient}.`,
        });
        setInlineReplyText("");
        setIsInlineReplying(false);
        // Refresh dari DB agar pesan terkirim langsung masuk ke thread
        await loadMailFromDatabase(true);
      } else {
        toast({
          variant: "destructive",
          title: "Gagal Mengirim Balasan",
          description: data.error || "Terjadi kesalahan.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Balasan",
        description: "Terjadi gangguan koneksi.",
      });
    } finally {
      setIsSendingInlineReply(false);
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

  // Helper decode RFC 2047 MIME encoded-words (misal =?UTF-8?Q?...?= atau =?UTF-8?B?...?=)
  const decodeMimeHeader = (str: string = "") => {
    if (!str || typeof str !== "string") return "";
    return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (match, charset, enc, text) => {
      try {
        if (enc.toUpperCase() === "B") {
          return Buffer.from(text, "base64").toString("utf-8");
        }
        if (enc.toUpperCase() === "Q") {
          const bytes: number[] = [];
          const clean = text.replace(/_/g, " ");
          for (let i = 0; i < clean.length; i++) {
            if (clean[i] === "=" && i + 2 < clean.length) {
              bytes.push(parseInt(clean.substr(i + 1, 2), 16));
              i += 2;
            } else {
              bytes.push(clean.charCodeAt(i));
            }
          }
          return Buffer.from(bytes).toString("utf-8");
        }
      } catch {
        return match;
      }
      return match;
    });
  };

  // Helper decode Quoted-Printable (menghilangkan = break, =20, =3D, dll)
  const decodeQuotedPrintable = (str: string = "") => {
    if (!str || typeof str !== "string") return "";
    if (!str.includes("=")) return str;

    // 1. Bersihkan soft line-break Quoted-Printable ("=\r\n" atau "=\n" atau "= ")
    let decoded = str.replace(/=\s*\r?\n/g, "").replace(/=\s+(?=[a-zA-Z0-9&])/g, "");

    // 2. Decode hex-escapes (=20, =3D, dll)
    try {
      decoded = decoded.replace(/=([A-Fa-f0-9]{2})/g, (m, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch {
          return m;
        }
      });
      // Handle URI decoding jika multi-byte
      decoded = decodeURIComponent(escape(decoded));
    } catch {
      // Fallback
    }

    return decoded;
  };

  // Helper normalisasi subjek email untuk thread percakapan ala Gmail
  const normalizeEmailSubject = (sub: string = "") => {
    const decoded = decodeMimeHeader(sub);
    return decoded
      .replace(/^(\s*(re|fwd|fw|balas|teruskan)\s*:\s*)+/gi, "")
      .trim();
  };

  // Helper membersihkan header RFC mentah / MIME artifacts agar tampilan selalu rapi
  const cleanDisplayEmailContent = (content: string = "") => {
    if (!content || typeof content !== "string") return "";
    let extracted = content;

    // Ekstrak bagian pesan dari multipart boundary jika ada
    if (
      content.includes("Received:") ||
      content.includes("Content-Type:") ||
      content.includes("ARC-Seal:") ||
      content.includes("boundary=")
    ) {
      const boundaryMatch = content.match(/boundary="?([^"\r\n]+)"?/i);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = content.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

        // Prioritas 1: text/html
        for (const part of parts) {
          if (part.includes("text/html")) {
            const bodySplit = part.split(/\r?\n\r?\n/);
            if (bodySplit.length > 1) {
              const body = bodySplit.slice(1).join("\n\n").replace(/--\s*$/, "").trim();
              if (body) {
                extracted = body;
                break;
              }
            }
          }
        }

        // Prioritas 2: text/plain
        if (extracted === content) {
          for (const part of parts) {
            if (part.includes("text/plain")) {
              const bodySplit = part.split(/\r?\n\r?\n/);
              if (bodySplit.length > 1) {
                const body = bodySplit.slice(1).join("\n\n").replace(/--\s*$/, "").trim();
                if (body) {
                  extracted = body;
                  break;
                }
              }
            }
          }
        }
      } else if (content.includes("Received:") || content.includes("ARC-Seal:") || content.includes("MIME-Version:")) {
        const doubleNewlineIdx = content.indexOf("\r\n\r\n");
        const unixDoubleIdx = content.indexOf("\n\n");
        const splitIdx = doubleNewlineIdx !== -1 ? doubleNewlineIdx + 4 : (unixDoubleIdx !== -1 ? unixDoubleIdx + 2 : -1);
        if (splitIdx !== -1) {
          const rest = content.substring(splitIdx).trim();
          if (rest) extracted = rest;
        }
      }
    }

    // Bersihkan quoted-printable di akhir agar bebas dari artifacts "= "
    return decodeQuotedPrintable(extracted);
  };

  // Helper membuat cuplikan teks (snippet/preview) yang bersih, bebas dari CSS, tag HTML, dan MIME artifacts
  const getCleanEmailSnippet = (previewText: string = "", contentText: string = "", maxLen: number = 100) => {
    let raw = previewText || "";
    const hasArtifacts =
      !raw ||
      raw.includes("{color:") ||
      raw.includes(".mobile_only") ||
      raw.includes("=E2=") ||
      raw.includes(".awl") ||
      raw.includes("{display:") ||
      raw.includes(".abml") ||
      raw.includes("a {") ||
      raw.includes("text-decoration:") ||
      raw.includes("Received:") ||
      raw.includes("ARC-Seal:") ||
      raw.includes("Content-Type:");

    if (hasArtifacts && contentText) {
      raw = cleanDisplayEmailContent(contentText);
    }
    if (!raw) return "";

    let cleaned = raw
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
      .replace(/<xml\b[^>]*>[\s\S]*?<\/xml>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/=\s*\r?\n/g, "")
      .replace(/=([A-Fa-f0-9]{2})/g, (m, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch {
          return m;
        }
      });

    try {
      cleaned = decodeURIComponent(escape(cleaned));
    } catch { }

    cleaned = cleaned
      .replace(/@media[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, " ")
      .replace(/[.#][a-zA-Z0-9_-]+\s*\{[^}]*\}/g, " ")
      .replace(/[.#][a-zA-Z0-9_-]+\s+[a-zA-Z0-9_#.-]+\s*\{[^}]*\}/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&[a-z0-9#]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[.\s,;:-]+/, "")
      .trim();

    return cleaned.slice(0, maxLen);
  };

  // Kumpulan seluruh pesan dalam satu utas percakapan (Conversation Thread ala Gmail)
  const activeThreadMessages = useMemo(() => {
    if (!selectedEmail) return [];
    const baseKey = normalizeEmailSubject(selectedEmail.subject).toLowerCase();

    // Temukan semua email dengan subjek dasar yang sama
    const thread = emails.filter((e) => {
      if (selectedEmail.folder !== "trash" && e.folder === "trash") return false;
      return normalizeEmailSubject(e.subject).toLowerCase() === baseKey;
    });

    if (thread.length === 0) return [selectedEmail];

    // Urutkan kronologis dari pesan pertama ke pesan terbaru (oldest to newest ala Gmail)
    return [...thread].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      const extractTime = (id: string) => {
        const match = id.match(/mail-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const tA = extractTime(a.id);
      const tB = extractTime(b.id);
      if (tA && tB) return tA - tB;
      return a.id.localeCompare(b.id);
    });
  }, [selectedEmail, emails]);

  // Alamat tujuan balasan (peserta luar percakapan)
  const targetReplyEmail = useMemo(() => {
    if (!selectedEmail) return "";
    const externalMsg = activeThreadMessages.find((m) => !m.from.includes("@marketpoint.id"));
    if (externalMsg) return externalMsg.from;
    return selectedEmail.from.includes("@marketpoint.id") ? selectedEmail.to : selectedEmail.from;
  }, [selectedEmail, activeThreadMessages]);

  // Pengelompokan Thread di Kotak Masuk (Gmail Style - Tanpa Baris Terpisah)
  const emailsInActiveFolder = useMemo(() => {
    const rawList = emails.filter((item) => item.folder === activeFolder);
    if (activeFolder !== "inbox") return rawList;

    // Di Kotak Masuk, kelompokkan berdasarkan subjek percakapan
    const threadMap = new Map<string, EmailItem>();

    rawList.forEach((msg) => {
      const key = normalizeEmailSubject(msg.subject).toLowerCase();
      // Simpan jika belum ada (karena emails sudah diurutkan dari terbaru)
      if (!threadMap.has(key)) {
        threadMap.set(key, msg);
      }
    });

    return Array.from(threadMap.values()).map((item) => {
      const key = normalizeEmailSubject(item.subject).toLowerCase();
      const relatedCount = emails.filter(
        (e) => e.folder !== "trash" && normalizeEmailSubject(e.subject).toLowerCase() === key
      ).length;

      return {
        ...item,
        threadCount: relatedCount > 1 ? relatedCount : undefined,
      };
    });
  }, [emails, activeFolder]);

  const unreadInActiveFolder = emailsInActiveFolder.filter((e) => e.isUnread).length;

  const deliveryInActiveFolder = emailsInActiveFolder.filter(
    (e) =>
      e.subject.toLowerCase().includes("delivery") ||
      e.subject.toLowerCase().includes("lisensi") ||
      e.subject.toLowerCase().includes("pesanan") ||
      e.from.toLowerCase().includes("delivery@") ||
      e.to.toLowerCase().includes("delivery@") ||
      e.preview.toLowerCase().includes("lisensi")
  ).length;

  const supportInActiveFolder = emailsInActiveFolder.filter(
    (e) =>
      e.subject.toLowerCase().includes("bantuan") ||
      e.subject.toLowerCase().includes("support") ||
      e.subject.toLowerCase().includes("tiket") ||
      e.subject.toLowerCase().includes("kendala") ||
      e.from.toLowerCase().includes("support@") ||
      e.to.toLowerCase().includes("support@") ||
      e.preview.toLowerCase().includes("support")
  ).length;

  const adminInActiveFolder = emailsInActiveFolder.filter(
    (e) =>
      e.from.toLowerCase().includes("admin@") ||
      e.to.toLowerCase().includes("admin@") ||
      e.subject.toLowerCase().includes("admin") ||
      e.preview.toLowerCase().includes("admin")
  ).length;

  const noreplyInActiveFolder = emailsInActiveFolder.filter(
    (e) =>
      e.from.toLowerCase().includes("no-reply@") ||
      e.from.toLowerCase().includes("noreply@") ||
      e.to.toLowerCase().includes("no-reply@") ||
      e.to.toLowerCase().includes("noreply@") ||
      e.subject.toLowerCase().includes("no-reply") ||
      e.subject.toLowerCase().includes("notifikasi")
  ).length;

  const filteredEmails = emailsInActiveFolder.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.subject.toLowerCase().includes(q) ||
      item.from.toLowerCase().includes(q) ||
      item.to.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q);

    let matchCategory = true;
    if (emailCategoryFilter === "unread") {
      matchCategory = item.isUnread;
    } else if (emailCategoryFilter === "delivery") {
      matchCategory =
        item.subject.toLowerCase().includes("delivery") ||
        item.subject.toLowerCase().includes("lisensi") ||
        item.subject.toLowerCase().includes("pesanan") ||
        item.from.toLowerCase().includes("delivery@") ||
        item.to.toLowerCase().includes("delivery@") ||
        item.preview.toLowerCase().includes("lisensi");
    } else if (emailCategoryFilter === "support") {
      matchCategory =
        item.subject.toLowerCase().includes("bantuan") ||
        item.subject.toLowerCase().includes("support") ||
        item.subject.toLowerCase().includes("tiket") ||
        item.subject.toLowerCase().includes("kendala") ||
        item.from.toLowerCase().includes("support@") ||
        item.to.toLowerCase().includes("support@") ||
        item.preview.toLowerCase().includes("support");
    } else if (emailCategoryFilter === "admin") {
      matchCategory =
        item.from.toLowerCase().includes("admin@") ||
        item.to.toLowerCase().includes("admin@") ||
        item.subject.toLowerCase().includes("admin") ||
        item.preview.toLowerCase().includes("admin");
    } else if (emailCategoryFilter === "noreply") {
      matchCategory =
        item.from.toLowerCase().includes("no-reply@") ||
        item.from.toLowerCase().includes("noreply@") ||
        item.to.toLowerCase().includes("no-reply@") ||
        item.to.toLowerCase().includes("noreply@") ||
        item.subject.toLowerCase().includes("no-reply") ||
        item.subject.toLowerCase().includes("notifikasi");
    }

    return matchSearch && matchCategory;
  });

  const unreadCount = emails.filter((e) => e.folder === "inbox" && e.isUnread).length;
  const trashCount = emails.filter((e) => e.folder === "trash").length;

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
              alt="MarketPointID Logo"
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

              <button
                onClick={() => handleViewChange("settings")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                  viewMode === "settings"
                    ? "bg-white text-[#00AA5B] shadow-xs border border-border/80"
                    : "text-muted-foreground hover:bg-slate-200/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-emerald-600" /> Pengaturan SMTP
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">
                  {smtpForm.mode === "custom_smtp" ? "Relay" : "Direct"}
                </span>
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

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deliveryLogs.length === 0 || isClearingLogs}
                    onClick={() => setIsClearLogsDialogOpen(true)}
                    className="h-8 px-2.5 sm:px-3 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold text-[10px] sm:text-xs gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
                    title="Bersihkan Semua Riwayat Log Delivery"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Bersihkan Log</span>
                  </Button>

                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] sm:text-[10px] gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden sm:inline">SMTP Delivery</span> Engine Aktif
                  </Badge>
                </div>
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
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenChangeEmail(log)}
                                  title="Ubah Email Pembeli & Kirim Ulang"
                                  className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg border-border hover:border-blue-500 hover:text-blue-600 bg-white shadow-2xs"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Ganti Email</span>
                                </Button>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={deletingLogId === log.id}
                                  onClick={() => handleDeleteSingleDeliveryLog(log.id, log.orderId)}
                                  title="Hapus baris log ini"
                                  className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                >
                                  {deletingLogId === log.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
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

                          <div className="flex items-center gap-1 shrink-0">
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
                              onClick={() => handleOpenChangeEmail(log)}
                              className="h-6 px-1.5 text-[9px] font-bold text-blue-600 hover:bg-blue-50 rounded"
                              title="Ganti Email Pembeli"
                            >
                              <Pencil className="w-2.5 h-2.5 mr-0.5" />
                              Ganti
                            </Button>

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

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingLogId === log.id}
                              onClick={() => handleDeleteSingleDeliveryLog(log.id, log.orderId)}
                              className="h-6 w-6 text-muted-foreground hover:text-rose-600 rounded"
                              title="Hapus log"
                            >
                              {deletingLogId === log.id ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-2.5 h-2.5" />
                              )}
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
                            <EmailAvatar email={acc.email} name={acc.name} size="md" />
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

            /* VIEW MODE 2b: PENGATURAN SMTP & DIAGNOSTIK KONEKSI */
          ) : viewMode === "settings" ? (
            <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
              {/* Header Bar */}
              <div className="h-14 px-4 sm:px-6 border-b border-border flex items-center justify-between bg-white shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00AA5B]" />
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      Pengaturan SMTP & Diagnostik Koneksi
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                    Konfigurasi mesin pengiriman email otomatis (Direct MX Port 25 vs Custom SMTP Relay Port 587/465)
                  </p>
                </div>

                <Badge className={cn(
                  "font-bold text-[10px] gap-1 px-2.5 py-1",
                  smtpForm.mode === "custom_smtp"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  Mode: {smtpForm.mode === "custom_smtp" ? "Custom SMTP Relay" : "Direct MX (Port 25)"}
                </Badge>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-6">
                <div className="max-w-4xl mx-auto space-y-6">

                  {/* Mode Selector Card */}
                  <div className="bg-white p-5 rounded-2xl border border-border shadow-2xs space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Pilih Metode Pengiriman Email
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tentukan arsitektur koneksi email yang sesuai dengan infrastruktur server hosting Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Option 1: Direct MX */}
                      <button
                        type="button"
                        onClick={() => setSmtpForm(prev => ({ ...prev, mode: "direct_mx" }))}
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all cursor-pointer relative",
                          smtpForm.mode === "direct_mx"
                            ? "border-[#00AA5B] bg-emerald-50/30 shadow-xs ring-1 ring-[#00AA5B]"
                            : "border-border hover:border-slate-300 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-black text-slate-900">Direct MX (Port 25)</span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] font-bold">
                            100% Gratis
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          Mengirim email langsung ke MX Server domain penerima (Gmail, Yahoo, dll) tanpa pihak ketiga.
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          Persyaratan: Port 25 keluar dibuka oleh ISP / Hosting provider Anda.
                        </p>
                      </button>

                      {/* Option 2: Custom SMTP */}
                      <button
                        type="button"
                        onClick={() => setSmtpForm(prev => ({ ...prev, mode: "custom_smtp" }))}
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all cursor-pointer relative",
                          smtpForm.mode === "custom_smtp"
                            ? "border-blue-600 bg-blue-50/30 shadow-xs ring-1 ring-blue-600"
                            : "border-border hover:border-slate-300 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-black text-slate-900">Custom SMTP Relay</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-none text-[9px] font-bold">
                            Rekomendasi
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          Relay via Gmail, Google Workspace, SendGrid, Amazon SES, Brevo, atau Mailgun.
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          Menggunakan Port 587 (STARTTLS) atau 465 (SSL). Bebas blokir port 25.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Settings Form Grid */}
                  <form onSubmit={handleSaveSmtpSettings} className="bg-white p-5 rounded-2xl border border-border shadow-2xs space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Konfigurasi Kredensial Mail
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {smtpForm.mode === "custom_smtp"
                            ? "Isi kredensial server SMTP penyedia layanan Anda"
                            : "Konfigurasi identitas domain HELO dan pengirim resmi"}
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSavingSmtp}
                        className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"
                      >
                        {isSavingSmtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Simpan Pengaturan
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sender Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">Nama Pengirim Resmi</label>
                        <Input
                          value={smtpForm.fromName}
                          onChange={(e) => setSmtpForm(prev => ({ ...prev, fromName: e.target.value }))}
                          placeholder="MarketPointID Delivery"
                          className="h-9 text-xs rounded-xl"
                        />
                        <p className="text-[10px] text-muted-foreground">Ditampilkan di inbox penerima (misal: MarketPointID Delivery)</p>
                      </div>

                      {/* Sender Email */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">Alamat Email Pengirim (From)</label>
                        <Input
                          value={smtpForm.fromEmail}
                          onChange={(e) => setSmtpForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                          placeholder="delivery@marketpoint.id"
                          className="h-9 text-xs rounded-xl"
                        />
                        <p className="text-[10px] text-muted-foreground">Alamat email resmi untuk header & Return-Path</p>
                      </div>

                      {/* HELO Domain */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700">HELO / EHLO Domain</label>
                        <Input
                          value={smtpForm.heloDomain}
                          onChange={(e) => setSmtpForm(prev => ({ ...prev, heloDomain: e.target.value }))}
                          placeholder="marketpoint.id"
                          className="h-9 text-xs rounded-xl font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">Domain identitas server saat memulai handshake SMTP</p>
                      </div>

                      {/* Mode Custom Fields */}
                      {smtpForm.mode === "custom_smtp" ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">SMTP Host / Server</label>
                            <Input
                              value={smtpForm.host}
                              onChange={(e) => setSmtpForm(prev => ({ ...prev, host: e.target.value }))}
                              placeholder="smtp.gmail.com atau mail.domain.com"
                              className="h-9 text-xs rounded-xl font-mono"
                              required={smtpForm.mode === "custom_smtp"}
                            />
                            <p className="text-[10px] text-muted-foreground">Alamat host server relay SMTP Anda</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Port SMTP</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={smtpForm.port}
                                onChange={(e) => setSmtpForm(prev => ({ ...prev, port: Number(e.target.value) || 587 }))}
                                placeholder="587"
                                className="h-9 text-xs rounded-xl font-mono w-28"
                              />
                              <div className="flex items-center gap-1">
                                {[587, 465, 25].map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setSmtpForm(prev => ({ ...prev, port: p, secure: p === 465 }))}
                                    className={cn(
                                      "px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-colors cursor-pointer",
                                      smtpForm.port === p
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    )}
                                  >
                                    {p} {p === 587 ? "(STARTTLS)" : p === 465 ? "(SSL)" : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Enkripsi Aman (SSL/TLS)</label>
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                id="smtp-secure-toggle"
                                checked={smtpForm.secure}
                                onChange={(e) => setSmtpForm(prev => ({ ...prev, secure: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-[#00AA5B] focus:ring-[#00AA5B] cursor-pointer"
                              />
                              <label htmlFor="smtp-secure-toggle" className="text-xs text-slate-700 font-medium cursor-pointer">
                                Gunakan SSL (Direct TLS - untuk Port 465)
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Username / User SMTP</label>
                            <Input
                              value={smtpForm.user}
                              onChange={(e) => setSmtpForm(prev => ({ ...prev, user: e.target.value }))}
                              placeholder="akun@gmail.com atau apikey"
                              className="h-9 text-xs rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Password / App Password</label>
                            <div className="relative">
                              <Input
                                type={showSmtpPass ? "text" : "password"}
                                value={smtpForm.pass}
                                onChange={(e) => setSmtpForm(prev => ({ ...prev, pass: e.target.value }))}
                                placeholder="••••••••••••••••"
                                className="h-9 text-xs rounded-xl pr-9 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSmtpPass(!showSmtpPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900 cursor-pointer"
                              >
                                {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Untuk Gmail, gunakan 16 karakter App Password dari Akun Google Anda.</p>
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="text-[11px] text-emerald-900 leading-relaxed">
                            <strong>Direct MX Sending Aktif:</strong> MarketPointID Mail Engine akan melakukan pencarian DNS MX otomatis (RFC 5321) ke domain tujuan dan mengantarkan email langsung secara gratis dengan enkripsi STARTTLS opportunistik.
                          </div>
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Live Diagnostic & Test Connection Card */}
                  <div className="bg-white p-5 rounded-2xl border border-border shadow-2xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Alat Diagnostik & Uji Koneksi Live
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Kirim 1 email tes langsung untuk memastikan port, handshake SMTP, dan izin pengiriman berfungsi 100%.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          placeholder="Masukkan email tujuan tes (misal: althar.dev@gmail.com)"
                          className="h-9.5 text-xs pl-8.5 rounded-xl bg-slate-50 border-border"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={isTestingSmtp}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9.5 px-5 rounded-xl shrink-0 gap-1.5 shadow-xs cursor-pointer"
                      >
                        {isTestingSmtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Menguji Koneksi...
                          </>
                        ) : (
                          <>
                            <Wifi className="w-3.5 h-3.5" />
                            Uji Koneksi & Kirim Tes
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Diagnostic Result Box */}
                    {testResult && (
                      <div className={cn(
                        "p-4 rounded-xl border space-y-2 animate-in fade-in duration-200",
                        testResult.success
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-rose-50/70 border-rose-200 text-rose-950"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {testResult.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            )}
                            <span className="text-xs font-black">
                              {testResult.success ? "Hasil: Koneksi Sukses!" : "Hasil: Koneksi Gagal"}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 border border-current">
                            Latensi: {testResult.latencyMs} ms
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1 font-medium">
                          <div><strong>Tahapan:</strong> {testResult.step}</div>
                          {testResult.hostUsed && <div><strong>Host / Server:</strong> <span className="font-mono">{testResult.hostUsed}</span></div>}
                          {testResult.response && (
                            <div className="mt-1 p-2 rounded-lg bg-white/80 border border-current font-mono text-[10px] overflow-x-auto">
                              {testResult.response}
                            </div>
                          )}
                          {testResult.error && (
                            <div className="mt-1 p-2 rounded-lg bg-white/90 border border-rose-300 font-mono text-[10px] text-rose-700 leading-relaxed">
                              {testResult.error}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            /* VIEW MODE 3: DETAIL EMAIL TERPILIH */
          ) : selectedEmail ? (
            <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
              {/* Detail Header Action Bar (Clean & Fully Functional) */}
              <div className="h-11 sm:h-12 px-2.5 sm:px-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-1 text-slate-600">
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    title="Kembali ke kotak masuk"
                    className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEmail(selectedEmail)}
                    title={selectedEmail.folder === "trash" ? "Hapus Permanen" : "Hapus"}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                </div>

                {/* Right Pagination: 1 dari N < > */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-normal">
                  <span className="hidden sm:inline">
                    {Math.max(1, filteredEmails.findIndex(e => e.id === selectedEmail.id) + 1)} dari {filteredEmails.length || 1}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={filteredEmails.findIndex(e => e.id === selectedEmail.id) <= 0}
                      onClick={() => {
                        const idx = filteredEmails.findIndex(e => e.id === selectedEmail.id);
                        if (idx > 0) setSelectedEmail(filteredEmails[idx - 1]);
                      }}
                      title="Lebih lama"
                      className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={filteredEmails.findIndex(e => e.id === selectedEmail.id) >= filteredEmails.length - 1}
                      onClick={() => {
                        const idx = filteredEmails.findIndex(e => e.id === selectedEmail.id);
                        if (idx < filteredEmails.length - 1) setSelectedEmail(filteredEmails[idx + 1]);
                      }}
                      title="Lebih baru"
                      className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-600 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Message Body - Authentic Canvas (Responsive & Mobile Friendly) */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white">
                <div className="w-full">
                  {/* Subject Row */}
                  <div className="pb-2.5 mb-3 flex items-start justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 tracking-tight leading-snug">
                        {normalizeEmailSubject(selectedEmail.subject) || "(Tanpa Subjek)"}
                      </h1>
                      <div className="flex items-center gap-1">
                        <span className="bg-slate-100 text-slate-700 text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium inline-flex items-center">
                          {selectedEmail.folder === "inbox"
                            ? "Kotak Masuk"
                            : selectedEmail.folder === "sent"
                              ? "Terkirim"
                              : selectedEmail.folder === "trash"
                                ? "Sampah"
                                : "Draft"}
                        </span>
                        {activeThreadMessages.length > 1 && (
                          <span className="text-[10px] sm:text-xs text-slate-500 font-normal">
                            ({activeThreadMessages.length})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DAFTAR SELURUH PESAN DALAM THREAD (CHRONOLOGICAL ALA GMAIL) */}
                  <div className="divide-y divide-slate-100">
                    {activeThreadMessages.map((msg, idx) => {
                      const isLastMessage = idx === activeThreadMessages.length - 1;
                      const sanitizedContent = cleanDisplayEmailContent(msg.content);
                      const isFullTemplate =
                        sanitizedContent.includes("<!DOCTYPE") ||
                        sanitizedContent.includes("<html") ||
                        sanitizedContent.includes("<table");
                      let htmlToRender = isFullTemplate ? sanitizedContent : null;
                      if (htmlToRender) {
                        htmlToRender = htmlToRender.includes('<meta name="viewport"')
                          ? htmlToRender
                          : `<meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;font-family:sans-serif;box-sizing:border-box;}img{max-width:100%!important;height:auto;}table{max-width:100%!important;width:100%!important;}</style>${htmlToRender}`;
                      }

                      if (!htmlToRender && msg.from.includes("delivery@marketpoint.id")) {
                        const parsed = parsePlainTextDeliveryEmail(sanitizedContent, msg.subject);
                        if (parsed) {
                          htmlToRender = renderDeliveryEmailHtml(parsed);
                        }
                      }

                      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(sanitizedContent);
                      const cleanHtmlContent = hasHtmlTags
                        ? sanitizedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                        : null;

                      const isMarketpointSender = msg.from.includes("marketpoint.id");
                      const isGoogleSender =
                        msg.from.toLowerCase().includes("google.com") ||
                        msg.from.toLowerCase().includes("bounces.google.com") ||
                        msg.from.toLowerCase().includes("idverification");

                      const senderDisplayName = isGoogleSender
                        ? "Google"
                        : msg.from.includes("<")
                          ? decodeMimeHeader(msg.from.split("<")[0].trim().replace(/^["']|["']$/g, ""))
                          : decodeMimeHeader(msg.from.split("@")[0]);

                      const senderEmailAddr = isGoogleSender
                        ? "no-reply@accounts.google.com"
                        : msg.from.includes("<")
                          ? msg.from.match(/<([^>]+)>/)?.[1] || msg.from
                          : msg.from;

                      // Format quote blocks if exists
                      const quoteIndex = sanitizedContent.search(/(Pada [^\n]+ menulis:|On [^\n]+ wrote:)/i);
                      const mainText = quoteIndex !== -1 ? sanitizedContent.slice(0, quoteIndex).trim() : sanitizedContent;
                      const quoteText = quoteIndex !== -1 ? sanitizedContent.slice(quoteIndex).trim() : null;

                      return (
                        <div key={msg.id} className="py-3.5 first:pt-0">
                          {/* Sender & Header Info Row */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                              <EmailAvatar email={msg.from} name={senderDisplayName} size="md" />

                              <div className="min-w-0">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                                    {senderDisplayName}
                                  </span>
                                  <span className="text-[11px] sm:text-xs text-slate-500 font-normal truncate max-w-[150px] sm:max-w-none">
                                    &lt;{senderEmailAddr}&gt;
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedTechId(expandedTechId === msg.id ? null : msg.id)
                                    }
                                    className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 font-normal flex items-center gap-0.5 cursor-pointer transition-colors"
                                  >
                                    <span>
                                      kepada{" "}
                                      <span className="text-slate-700 font-medium">
                                        {msg.to === "support@marketpoint.id" ? "saya" : msg.to}
                                      </span>
                                    </span>
                                    {expandedTechId === msg.id ? (
                                      <ChevronUp className="w-3 h-3 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Right Message Actions: Date & Reply */}
                            <div className="flex items-center gap-1 shrink-0 text-slate-500">
                              <span className="text-[11px] sm:text-xs text-slate-500 font-normal mr-1">
                                {msg.date}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsInlineReplying(true);
                                  setTimeout(() => {
                                    const replyBox = document.getElementById("inline-reply-container");
                                    if (replyBox) replyBox.scrollIntoView({ behavior: "smooth" });
                                  }, 50);
                                }}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Balas"
                              >
                                <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Detail Enkripsi & Header TLS (Collapsible ala Gmail) */}
                          {expandedTechId === msg.id && (
                            <div className="mt-2 ml-0 sm:ml-10 lg:ml-11 max-w-lg p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-2xs animate-in fade-in duration-150">
                              <div className="grid grid-cols-[60px_1fr] gap-y-1 gap-x-2 text-[11px] sm:text-xs">
                                <span className="font-semibold text-slate-500">dari:</span>
                                <span className="font-mono text-slate-800 text-[11px] break-all">{msg.from}</span>
                                <span className="font-semibold text-slate-500">kepada:</span>
                                <span className="font-mono text-slate-800 text-[11px] break-all">{msg.to}</span>
                                <span className="font-semibold text-slate-500">tanggal:</span>
                                <span className="text-slate-800">{msg.date}</span>
                                <span className="font-semibold text-slate-500">subjek:</span>
                                <span className="text-slate-800 font-semibold">{msg.subject}</span>
                                <span className="font-semibold text-slate-500">keamanan:</span>
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Enkripsi Standar (TLS) • SPF Valid
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Message Body Content - Responsive margins ml-0 sm:ml-10 */}
                          <div className="mt-2.5 sm:mt-3 ml-0 sm:ml-10 lg:ml-11 space-y-2.5">
                            {htmlToRender ? (
                              <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-white">
                                <iframe
                                  ref={isLastMessage ? emailIframeRef : undefined}
                                  srcDoc={htmlToRender}
                                  title={`Pesan Email - ${msg.subject}`}
                                  className="w-full border-0 block"
                                  style={{ minHeight: "450px", height: "600px" }}
                                  sandbox="allow-same-origin allow-popups"
                                />
                              </div>
                            ) : cleanHtmlContent ? (
                              <div
                                className="text-slate-800 text-xs sm:text-sm leading-relaxed break-words font-normal [&_p]:my-1.5 [&_div]:my-1 [&_a]:text-[#00AA5B] [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
                              />
                            ) : (
                              <div className="text-slate-800 text-xs sm:text-sm leading-relaxed font-normal break-words space-y-2.5">
                                <div className="whitespace-pre-wrap">{mainText}</div>
                                {quoteText && (
                                  <div className="border-l-2 border-slate-300 pl-2.5 sm:pl-3 py-0.5 text-slate-600 text-[11px] sm:text-xs whitespace-pre-wrap">
                                    {quoteText}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Attachment preview if exists */}
                            {msg.attachment && (
                              <div className="max-w-md p-2.5 sm:p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between group hover:border-[#00AA5B]/50 hover:bg-white transition-all">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-7 w-7 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">{msg.attachment.name}</p>
                                    <p className="text-[10px] text-slate-500 font-normal">
                                      {msg.attachment.size} • Dokumen Lampiran
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-[#00AA5B] hover:bg-[#00AA5B]/10 shrink-0">
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}

                            {/* Internal Mail Signature */}
                            {isMarketpointSender && (
                              <div className="pt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-[#00AA5B]" />
                                <span>MarketPointID Mail Engine • Pesan Resmi Terverifikasi</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AKSI BALAS & TERUSKAN (RESPONSIVE PILL BUTTONS) */}
                  <div id="inline-reply-container" className="pt-3 sm:pt-4">
                    {!isInlineReplying ? (
                      <div className="ml-0 sm:ml-10 lg:ml-11 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsInlineReplying(true);
                            setTimeout(() => {
                              const replyBox = document.getElementById("inline-reply-container");
                              if (replyBox) replyBox.scrollIntoView({ behavior: "smooth" });
                            }, 50);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Reply className="w-3.5 h-3.5 text-slate-500" />
                          Balas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setComposeTo("");
                            setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                            setComposeMessage(
                              `\n\n---------- Pesan Diteruskan ----------\nDari: ${selectedEmail.from}\nTanggal: ${selectedEmail.date}\nSubjek: ${selectedEmail.subject}\nKepada: ${selectedEmail.to}\n\n${selectedEmail.content}`
                            );
                            setIsComposeOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Forward className="w-3.5 h-3.5 text-slate-500" />
                          Teruskan
                        </button>
                      </div>
                    ) : (
                      <div className="ml-0 sm:ml-10 lg:ml-11 border border-slate-300 rounded-xl sm:rounded-2xl bg-white shadow-xs overflow-hidden animate-in fade-in duration-200">
                        {/* Inline Reply Header */}
                        <div className="px-3 sm:px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Reply className="w-3.5 h-3.5 text-[#00AA5B]" />
                            <span className="font-normal text-slate-500">Membalas ke:</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                              {targetReplyEmail || selectedEmail.from}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] sm:text-xs text-slate-500 font-normal">Dari:</span>
                            {accounts.length > 0 ? (
                              <Select value={composeFrom} onValueChange={setComposeFrom}>
                                <SelectTrigger className="h-7 text-xs font-medium bg-white border-slate-200 rounded-md w-44 sm:w-52">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts.map((acc) => (
                                    <SelectItem key={acc.email} value={acc.email} className="text-xs">
                                      {acc.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs font-semibold text-slate-800">support@marketpoint.id</span>
                            )}
                          </div>
                        </div>

                        {/* Inline Reply Textarea */}
                        <div className="p-3 sm:p-4 space-y-3">
                          <Textarea
                            value={inlineReplyText}
                            onChange={(e) => setInlineReplyText(e.target.value)}
                            placeholder={`Tulis balasan untuk ${targetReplyEmail || "pengirim"}...`}
                            autoFocus
                            rows={4}
                            className="w-full border-0 focus-visible:ring-0 p-0 text-xs sm:text-sm leading-relaxed resize-y placeholder:text-slate-400 font-normal focus:outline-none"
                          />

                          {/* Action Toolbar */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                onClick={handleSendInlineReply}
                                disabled={isSendingInlineReply || !inlineReplyText.trim()}
                                className="bg-[#00AA5B] hover:bg-[#00924c] text-white font-bold text-xs h-8 px-4 rounded-full gap-1.5 shadow-2xs cursor-pointer"
                              >
                                {isSendingInlineReply ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" /> Mengirim...
                                  </>
                                ) : (
                                  <>
                                    <SendHorizontal className="w-3 h-3" /> Kirim
                                  </>
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setInlineReplyText("");
                                  setIsInlineReplying(false);
                                }}
                                className="h-8 px-2.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                Batal
                              </Button>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setComposeTo(targetReplyEmail || selectedEmail.from);
                                setComposeSubject(`Re: ${normalizeEmailSubject(selectedEmail.subject)}`);
                                setComposeMessage(inlineReplyText);
                                setIsInlineReplying(false);
                                setIsComposeOpen(true);
                              }}
                              title="Buka di jendela penuh"
                              className="h-7.5 px-2 text-[11px] font-normal text-slate-500 hover:text-slate-900 rounded-md gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="hidden sm:inline">Jendela Penuh</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            /* VIEW MODE 4: DAFTAR EMAIL (INBOX / SENT / DRAFTS / TRASH) */
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-200">

              {/* Folder Label Header / Bulk Action Bar */}
              {selectedMailIds.length > 0 ? (
                <div className="h-10 px-3 sm:px-4 border-b border-emerald-200 bg-emerald-50/90 flex items-center justify-between text-xs font-bold text-slate-800 shrink-0 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Master Checkbox & Preset Dropdown */}
                    <div className="relative flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="p-1 rounded hover:bg-emerald-200/60 text-[#00AA5B] transition-colors cursor-pointer"
                        title={
                          selectedMailIds.length === filteredEmails.length
                            ? "Batalkan semua pilihan"
                            : "Pilih semua yang tampil"
                        }
                      >
                        {selectedMailIds.length === filteredEmails.length && filteredEmails.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#00AA5B]" />
                        ) : (
                          <MinusSquare className="w-4 h-4 text-[#00AA5B]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
                        className="p-0.5 rounded hover:bg-emerald-200/60 text-slate-700 transition-colors cursor-pointer"
                        title="Opsi Pilihan"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Dropdown Menu Preset */}
                      {isBulkSelectDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-border py-1 z-30 text-[11px] font-semibold text-slate-700 animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("all")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Semua</span>
                            <span className="text-[10px] text-muted-foreground">{filteredEmails.length}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("unread")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Belum Dibaca</span>
                            <span className="text-[10px] text-muted-foreground">{unreadInActiveFolder}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("read")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Sudah Dibaca</span>
                            <span className="text-[10px] text-muted-foreground">
                              {filteredEmails.length - unreadInActiveFolder}
                            </span>
                          </button>
                          <div className="h-px bg-border my-1" />
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("none")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-rose-600 cursor-pointer"
                          >
                            Batalkan Pilihan
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="font-black text-emerald-950 text-xs">
                      {selectedMailIds.length} email dipilih
                    </span>
                  </div>

                  {/* Bulk Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkMarkRead}
                      disabled={isProcessingBulk}
                      className="h-7 px-2 text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg gap-1 cursor-pointer"
                      title="Tandai Sudah Dibaca"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Tandai Dibaca</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkMarkUnread}
                      disabled={isProcessingBulk}
                      className="h-7 px-2 text-[11px] font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-100 rounded-lg gap-1 cursor-pointer"
                      title="Tandai Belum Dibaca"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Belum Dibaca</span>
                    </Button>

                    {activeFolder === "trash" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkRestore}
                        disabled={isProcessingBulk}
                        className="h-7 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg gap-1 cursor-pointer"
                        title="Pulihkan ke Kotak Masuk"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Pulihkan</span>
                      </Button>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isProcessingBulk}
                      className="h-7 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-100 rounded-lg gap-1 cursor-pointer"
                      title={activeFolder === "trash" ? "Hapus Permanen" : "Pindahkan ke Sampah"}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">
                        {activeFolder === "trash" ? "Hapus Permanen" : "Hapus"}
                      </span>
                    </Button>

                    <div className="h-4 w-px bg-emerald-300 mx-0.5" />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedMailIds([])}
                      className="h-7 w-7 text-muted-foreground hover:text-slate-900 rounded-lg cursor-pointer"
                      title="Batal Pilih"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-10 px-4 border-b border-border/60 flex items-center justify-between bg-slate-50/50 text-[11px] font-bold text-muted-foreground shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Master Checkbox Trigger */}
                    <div className="relative flex items-center gap-0.5 mr-1">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        disabled={filteredEmails.length === 0}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40"
                        title="Pilih Semua Email"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBulkSelectDropdownOpen(!isBulkSelectDropdownOpen)}
                        disabled={filteredEmails.length === 0}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40"
                        title="Opsi Pilihan"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Dropdown Menu Preset */}
                      {isBulkSelectDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-border py-1 z-30 text-[11px] font-semibold text-slate-700 animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("all")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Semua</span>
                            <span className="text-[10px] text-muted-foreground">{filteredEmails.length}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("unread")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Belum Dibaca</span>
                            <span className="text-[10px] text-muted-foreground">{unreadInActiveFolder}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset("read")}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <span>Sudah Dibaca</span>
                            <span className="text-[10px] text-muted-foreground">
                              {filteredEmails.length - unreadInActiveFolder}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="uppercase tracking-wider">
                      {activeFolder === "inbox"
                        ? "Kotak Masuk"
                        : activeFolder === "sent"
                          ? "Email Terkirim"
                          : activeFolder === "drafts"
                            ? "Draft Pesan"
                            : "Sampah"} ({filteredEmails.length})
                    </span>
                    {activeFolder === "inbox" && unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-[#00AA5B] hover:underline font-bold transition-colors cursor-pointer"
                      >
                        • Tandai Semua Dibaca
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <span className="text-xs text-[#00AA5B] font-semibold">Hasil pencarian: &quot;{searchQuery}&quot;</span>
                  )}
                </div>
              )}

              {/* Quick Filter Tabs (Semua, Belum Dibaca, Delivery, Support, Admin, No-Reply) */}
              <div className="px-3 sm:px-4 py-2 border-b border-border/60 bg-white flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
                {/* 1. Semua */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "all"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  )}
                >
                  <span>Semua</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                      emailCategoryFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {emailsInActiveFolder.length}
                  </span>
                </button>

                {/* 2. Belum Dibaca */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("unread")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "unread"
                      ? "bg-[#00AA5B] text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                  )}
                >
                  <Mail className="w-3 h-3" />
                  <span>Belum Dibaca</span>
                  {unreadInActiveFolder > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                        emailCategoryFilter === "unread" ? "bg-white/20 text-white" : "bg-emerald-200/60 text-emerald-800"
                      )}
                    >
                      {unreadInActiveFolder}
                    </span>
                  )}
                </button>

                {/* 3. Delivery */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("delivery")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "delivery"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100"
                  )}
                >
                  <Package className="w-3 h-3" />
                  <span>Delivery</span>
                  {deliveryInActiveFolder > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                        emailCategoryFilter === "delivery" ? "bg-white/20 text-white" : "bg-amber-200/60 text-amber-800"
                      )}
                    >
                      {deliveryInActiveFolder}
                    </span>
                  )}
                </button>

                {/* 4. Support */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("support")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "support"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                  )}
                >
                  <Headphones className="w-3 h-3" />
                  <span>Support</span>
                  {supportInActiveFolder > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                        emailCategoryFilter === "support" ? "bg-white/20 text-white" : "bg-blue-200/60 text-blue-800"
                      )}
                    >
                      {supportInActiveFolder}
                    </span>
                  )}
                </button>

                {/* 5. Admin */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("admin")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "admin"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                  )}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                  {adminInActiveFolder > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                        emailCategoryFilter === "admin" ? "bg-white/20 text-white" : "bg-indigo-200/60 text-indigo-800"
                      )}
                    >
                      {adminInActiveFolder}
                    </span>
                  )}
                </button>

                {/* 6. No-Reply */}
                <button
                  type="button"
                  onClick={() => setEmailCategoryFilter("noreply")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer",
                    emailCategoryFilter === "noreply"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100"
                  )}
                >
                  <Bell className="w-3 h-3" />
                  <span>No-Reply</span>
                  {noreplyInActiveFolder > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                        emailCategoryFilter === "noreply" ? "bg-white/20 text-white" : "bg-rose-200/60 text-rose-800"
                      )}
                    >
                      {noreplyInActiveFolder}
                    </span>
                  )}
                </button>
              </div>

              {/* Email List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 bg-white">
                {filteredEmails.map((email) => {
                  const isSelected = selectedMailIds.includes(email.id);
                  const isGoogle =
                    email.from.toLowerCase().includes("google.com") ||
                    email.from.toLowerCase().includes("bounces.google.com") ||
                    email.from.toLowerCase().includes("idverification");
                  const senderDisplayName = isGoogle
                    ? "Google"
                    : email.folder === "sent"
                      ? `Ke: ${email.to}`
                      : decodeMimeHeader(email.from.split("<")[0].trim().replace(/^["']|["']$/g, "") || email.from);
                  const snippetText = getCleanEmailSnippet(email.preview, email.content, 95);

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        "cursor-pointer transition-colors border-b border-slate-100 hover:bg-slate-100/70 select-none",
                        email.isUnread ? "bg-white font-bold" : "bg-slate-50/40 text-slate-600 font-normal",
                        isSelected ? "bg-emerald-50/70" : ""
                      )}
                    >
                      {/* Mobile Row Layout (< sm) */}
                      <div className="sm:hidden px-3 py-2.5 flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectMail(email.id, e)}
                          className="p-1 -ml-1 text-slate-400 hover:text-slate-800 transition-colors shrink-0 cursor-pointer mt-0.5"
                          title={isSelected ? "Batalkan pilihan" : "Pilih email ini"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#00AA5B]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={cn(
                              "truncate text-xs",
                              email.isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                            )}>
                              {senderDisplayName}
                            </span>
                            <span className={cn(
                              "text-[10px] shrink-0 font-normal",
                              email.isUnread ? "font-bold text-[#00AA5B]" : "text-slate-400"
                            )}>
                              {email.date}
                            </span>
                          </div>
                          <div className={cn(
                            "truncate text-xs mt-0.5",
                            email.isUnread ? "font-bold text-slate-900" : "font-medium text-slate-800"
                          )}>
                            {normalizeEmailSubject(email.subject) || "(Tanpa Subjek)"}
                          </div>
                          <div className="truncate text-[11px] text-slate-500 font-normal mt-0.5">
                            {snippetText}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Row Layout (>= sm) */}
                      <div className="hidden sm:flex h-10 px-4 items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectMail(email.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
                          title={isSelected ? "Batalkan pilihan" : "Pilih email ini"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#00AA5B]" />
                          ) : (
                            <Square className="w-4 h-4 group-hover:text-slate-600" />
                          )}
                        </button>

                        <div className="w-44 lg:w-56 shrink-0 truncate flex items-center gap-1.5">
                          <span className={cn(
                            "truncate text-xs",
                            email.isUnread ? "font-bold text-slate-900" : "font-normal text-slate-700"
                          )}>
                            {senderDisplayName}
                          </span>
                          {email.threadCount && email.threadCount > 1 && (
                            <span className="text-[11px] text-slate-500 font-normal shrink-0">
                              {email.threadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 truncate text-xs">
                          <span className={cn(
                            email.isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                          )}>
                            {normalizeEmailSubject(email.subject) || "(Tanpa Subjek)"}
                          </span>
                          <span className="text-slate-500 font-normal ml-1.5">
                            - {snippetText}
                          </span>
                        </div>

                        <div className="shrink-0 text-right text-xs text-slate-500 font-normal min-w-[65px]">
                          {email.date}
                        </div>
                      </div>
                    </div>
                  );
                })}

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

      {/* ======================================================== */}
      {/* 5. MODAL DIALOG: UBAH EMAIL PEMBELI & KIRIM ULANG LISENSI */}
      {/* ======================================================== */}
      <Dialog open={isEditBuyerEmailOpen} onOpenChange={setIsEditBuyerEmailOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border">
          <DialogHeader className="p-4 bg-slate-50 border-b border-border flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-blue-600" /> Perbarui Email Pembeli & Kirim Ulang
            </DialogTitle>
          </DialogHeader>

          {selectedDeliveryForEdit && (
            <form onSubmit={handleSaveBuyerEmail} className="p-4 sm:p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-border/70 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Nomor Invoice:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-border">
                    {selectedDeliveryForEdit.orderId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Produk:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">
                    {selectedDeliveryForEdit.productTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Email Lama:</span>
                  <span className="text-slate-600 truncate max-w-[200px] line-through">
                    {selectedDeliveryForEdit.recipient}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Alamat Email Pembeli Baru
                </label>
                <Input
                  type="email"
                  value={newBuyerEmail}
                  onChange={(e) => setNewBuyerEmail(e.target.value)}
                  placeholder="nama.benar@gmail.com"
                  className="h-9.5 text-xs rounded-xl font-medium"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Gunakan email aktif pembeli untuk menerima serial key lisensi digital secara instan.
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={syncTransactionEmail}
                    onChange={(e) => setSyncTransactionEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#00AA5B] focus:ring-[#00AA5B] mt-0.5"
                  />
                  <span>Perbarui juga catatan transaksi di database (<code>transactions.buyer_email</code>)</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={resendNowToNewEmail}
                    onChange={(e) => setResendNowToNewEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#00AA5B] focus:ring-[#00AA5B] mt-0.5"
                  />
                  <span className="font-semibold text-slate-900">Langsung kirim ulang email lisensi ke email baru sekarang</span>
                </label>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditBuyerEmailOpen(false)}
                  className="h-9 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingBuyerEmail}
                  className="h-9 rounded-xl text-xs font-bold bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white cursor-pointer"
                >
                  {isUpdatingBuyerEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Simpan & Kirimkan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. MODAL DIALOG: KONFIRMASI BERSIHKAN SEMUA LOG DELIVERY */}
      {/* ======================================================== */}
      <Dialog open={isClearLogsDialogOpen} onOpenChange={setIsClearLogsDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border-border shadow-xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Bersihkan Semua Log Pengiriman?
            </DialogTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tindakan ini akan menghapus seluruh riwayat pengiriman lisensi digital ({deliveryLogs.length} entri pesanan) dari database PostgreSQL.
              Data yang telah dibersihkan tidak dapat dipulihkan.
            </p>
          </DialogHeader>

          <DialogFooter className="pt-4 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isClearingLogs}
              onClick={() => setIsClearLogsDialogOpen(false)}
              className="h-9 px-4 rounded-xl text-xs font-bold border-border hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isClearingLogs}
              onClick={handleClearAllDeliveryLogs}
              className="h-9 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm cursor-pointer"
            >
              {isClearingLogs ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Membersihkan...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Ya, Bersihkan Semua
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
