"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useMerchantShop } from "@/context/merchant-context";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  where
} from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCog,
  UserPlus,
  Users,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Package,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Copy,
  Download,
  Lock,
  Smartphone,
  History,
  Shield,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface ShopAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "OWNER" | "CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS";
  roleLabel: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  permissions: {
    finance: boolean;
    products: boolean;
    chat: boolean;
  };
  lastActive?: string;
  createdAt?: any;
}

export interface AuditLogItem {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  target: string;
  module: "KEUANGAN" | "PRODUK" | "CS" | "ADMIN";
  timestamp: string;
  dateObj: string;
  ip: string;
  status: "SUCCESS" | "WARNING";
}

const ROLE_PRESETS = {
  CO_OWNER: {
    label: "Co-Owner",
    description: "Akses penuh operasional (Keuangan, Produk, CS).",
    permissions: {
      finance: true,
      products: true,
      chat: true,
    },
  },
  KEUANGAN: {
    label: "Admin Keuangan",
    description: "Saldo toko & laporan mutasi.",
    permissions: {
      finance: true,
      products: false,
      chat: false,
    },
  },
  PRODUK: {
    label: "Admin Produk",
    description: "Katalog, etalase, dan stok barang.",
    permissions: {
      finance: false,
      products: true,
      chat: false,
    },
  },
  CS: {
    label: "Customer Service",
    description: "Balas chat, diskusi, dan ulasan.",
    permissions: {
      finance: false,
      products: false,
      chat: true,
    },
  },
};

function resolveStaffAvatar(photo?: string, email?: string, name?: string): string {
  if (photo && photo.trim()) {
    return photo === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : photo;
  }
  const seed = (email || name || "staff").trim().toLowerCase();
  const defaultAvatars = ["/assets/avatar/hawk.png", "/assets/avatar/duck.jpg"];
  const charSum = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return defaultAvatars[charSum % defaultAvatars.length];
}

export default function MerchantAdminsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"admins" | "activity" | "quota">("admins");

  // State Admins & Logs
  const [admins, setAdmins] = useState<ShopAdmin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Filter & Search states for Admins
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Filter & Search states for Audit Logs
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logModuleFilter, setLogModuleFilter] = useState<string>("ALL");
  const [logStaffFilter, setLogStaffFilter] = useState<string>("ALL");

  // Security Toggles
  const [require2FA, setRequire2FA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoSessionTimeout, setAutoSessionTimeout] = useState(false);

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<ShopAdmin | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ShopAdmin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyInvited, setNewlyInvited] = useState<{ admin: ShopAdmin; url: string } | null>(null);
  const [isInviteSuccessModalOpen, setIsInviteSuccessModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<"CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS">("PRODUK");
  const [formPermissions, setFormPermissions] = useState({
    finance: false,
    products: true,
    chat: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const {
    shopId,
    shop: contextShop,
    loading: merchantLoading,
    isOwner,
    isStaff,
    staffRole: currentStaffRole,
  } = useMerchantShop();
  const activeShopId = shopId || user?.uid;

  const shopRef = useMemoFirebase(() => {
    if (!activeShopId) return null;
    return doc(db, "shops", activeShopId);
  }, [db, activeShopId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  const ownerName =
    userData?.displayName ||
    userData?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Pemilik Toko";

  const rawOwnerPhoto = userData?.photoURL || user?.photoURL || "";
  const ownerAvatar =
    rawOwnerPhoto === "/assets/avatar/duck.png"
      ? "/assets/avatar/duck.jpg"
      : rawOwnerPhoto;

  const ownerPhone =
    userData?.phoneNumber ||
    userData?.phone ||
    user?.phoneNumber ||
    shop?.whatsapp ||
    "";

  // Load real admins and audit logs from Firestore
  useEffect(() => {
    async function fetchData() {
      if (!user || !db || !activeShopId) {
        setAdmins([]);
        setAuditLogs([]);
        setLoadingAdmins(false);
        return;
      }

      try {
        setLoadingAdmins(true);

        // Real owner admin based on authenticated user and user profile data
        const ownerAdmin: ShopAdmin = {
          id: activeShopId,
          name: isStaff ? (shop?.name || "Pemilik Toko") : ownerName,
          email: isStaff ? (shop?.email || "owner@marketpoint.id") : (user.email || "owner@marketpoint.id"),
          phone: isStaff ? (shop?.whatsapp || "") : ownerPhone,
          avatar: isStaff ? (shop?.logoUrl || "") : ownerAvatar,
          role: "OWNER",
          roleLabel: "Pemilik Toko",
          status: "ACTIVE",
          permissions: {
            finance: true,
            products: true,
            chat: true,
          },
          lastActive: "Sedang Aktif",
        };

        // Fetch real staff admins from Firestore subcollection
        const adminsCol = collection(db, "shops", activeShopId, "admins");
        const snap = await getDocs(adminsCol);
        const staffList: ShopAdmin[] = [];
        for (const docSnap of snap.docs) {
          const raw = docSnap.data() as any;
          // Ignore if it's the owner or legacy mock
          if (docSnap.id === user.uid || raw.role === "OWNER") continue;

          let staffAvatar = raw.avatar || "";
          let staffName = raw.name || "";
          let staffPhone = raw.phone || "";

          // Auto-resolve avatar & name from users collection by email or userId
          if (!staffAvatar || !staffName) {
            try {
              let userMatch: any = null;
              if (raw.userId) {
                const uDoc = await getDoc(doc(db, "users", raw.userId));
                if (uDoc.exists()) userMatch = uDoc.data();
              }
              if (!userMatch && raw.email) {
                const qEmail = raw.email.toLowerCase().trim();
                const uSnap = await getDocs(
                  query(collection(db, "users"), where("email", "==", qEmail))
                );
                if (!uSnap.empty) {
                  userMatch = uSnap.docs[0].data();
                }
              }

              if (userMatch) {
                if (!staffAvatar && userMatch.photoURL) {
                  staffAvatar = userMatch.photoURL;
                }
                if (!staffName && (userMatch.displayName || userMatch.name)) {
                  staffName = userMatch.displayName || userMatch.name;
                }
                if (!staffPhone && (userMatch.phoneNumber || userMatch.phone)) {
                  staffPhone = userMatch.phoneNumber || userMatch.phone;
                }
              }
            } catch (e) {
              console.warn("Could not lookup user profile for staff:", e);
            }
          }

          staffAvatar = resolveStaffAvatar(staffAvatar, raw.email, staffName);

          // If the firestore doc didn't have an avatar, save the resolved avatar so it is persisted
          if (!raw.avatar && staffAvatar) {
            updateDoc(doc(db, "shops", activeShopId, "admins", docSnap.id), {
              avatar: staffAvatar,
              ...(staffName && !raw.name ? { name: staffName } : {}),
              ...(staffPhone && !raw.phone ? { phone: staffPhone } : {})
            }).catch(() => { });
          }

          staffList.push({
            id: docSnap.id,
            name: staffName || "Admin",
            email: raw.email || "",
            phone: staffPhone || raw.phone || "",
            avatar: staffAvatar,
            role: raw.role || "PRODUK",
            roleLabel: raw.roleLabel || "Admin Produk",
            status: raw.status || "ACTIVE",
            permissions: {
              finance: !!raw.permissions?.finance,
              products: !!raw.permissions?.products,
              chat: !!raw.permissions?.chat,
            },
            lastActive: raw.lastActive || "Baru saja",
            createdAt: raw.createdAt,
          });
        }

        setAdmins([ownerAdmin, ...staffList]);

        // Fetch real audit logs from Firestore subcollection
        const logsCol = collection(db, "shops", activeShopId, "audit_logs");
        const logsSnap = await getDocs(logsCol);
        const loadedLogs: AuditLogItem[] = [];
        logsSnap.forEach((docSnap) => {
          const raw = docSnap.data() as any;
          loadedLogs.push({
            id: docSnap.id,
            adminName: raw.adminName || "Admin",
            adminRole: raw.adminRole || "Staf",
            action: raw.action || "",
            target: raw.target || "",
            module: raw.module || "ADMIN",
            timestamp: raw.timestamp || "Baru saja",
            dateObj: raw.dateObj || "",
            ip: raw.ip || "-",
            status: raw.status || "SUCCESS",
          });
        });
        loadedLogs.sort((a, b) => (b.dateObj || "").localeCompare(a.dateObj || ""));
        setAuditLogs(loadedLogs);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoadingAdmins(false);
      }
    }

    if (mounted && !authLoading && activeShopId) {
      fetchData();
    }
  }, [mounted, user, db, activeShopId, shop, authLoading]);

  // Keep owner details in admin list synced when user profile loads
  useEffect(() => {
    if (!user) return;
    setAdmins((prev) => {
      const idx = prev.findIndex((a) => a.id === user.uid || a.role === "OWNER");
      if (idx === -1) return prev;
      const current = prev[idx];
      if (
        current.name === ownerName &&
        current.avatar === ownerAvatar &&
        current.phone === ownerPhone
      ) {
        return prev;
      }
      const updated = [...prev];
      updated[idx] = {
        ...current,
        name: ownerName,
        avatar: ownerAvatar,
        phone: ownerPhone,
      };
      return updated;
    });
  }, [user, ownerName, ownerAvatar, ownerPhone]);

  // Handle Preset Selection in form
  const handleRoleChange = (newRole: "CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS") => {
    setFormRole(newRole);
    setFormPermissions(ROLE_PRESETS[newRole].permissions);
  };

  const handleOpenAddModal = () => {
    if (admins.length >= 10) {
      toast({
        title: "Batas Kuota Tercapai",
        description: "Tokomu telah mencapai batas maksimal 10 admin. Silakan Upgrade Plan toko di tab Kuota.",
        variant: "destructive",
      });
      return;
    }
    setEditingAdmin(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("PRODUK");
    setFormPermissions(ROLE_PRESETS.PRODUK.permissions);
    setIsDialogOpen(true);
  };

  const handleOpenEditModal = (admin: ShopAdmin) => {
    setEditingAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormPhone(admin.phone || "");
    const r = (admin.role === "OWNER" ? "CO_OWNER" : admin.role) as "CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS";
    setFormRole(r);
    setFormPermissions({
      finance: !!admin.permissions.finance,
      products: !!admin.permissions.products,
      chat: !!admin.permissions.chat,
    });
    setIsDialogOpen(true);
  };

  // Toggle active status
  const handleToggleStatus = async (admin: ShopAdmin) => {
    if (admin.role === "OWNER") {
      toast({
        title: "Tidak dapat mengubah status",
        description: "Status akun Pemilik Toko selalu aktif.",
        variant: "destructive"
      });
      return;
    }

    const nextStatus = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
    );

    // Add log item
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      adminName: ownerName,
      adminRole: "Pemilik Toko",
      action: nextStatus === "ACTIVE" ? "Mengaktifkan Staf" : "Menonaktifkan Staf",
      target: `${admin.name} (${admin.roleLabel})`,
      module: "ADMIN",
      timestamp: "Baru saja",
      dateObj: new Date().toISOString().replace("T", " ").substring(0, 16),
      ip: "127.0.0.1 (Lokal)",
      status: nextStatus === "ACTIVE" ? "SUCCESS" : "WARNING"
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      if (user && db && activeShopId) {
        const adminDocRef = doc(db, "shops", activeShopId, "admins", admin.id);
        await updateDoc(adminDocRef, { status: nextStatus, updatedAt: serverTimestamp() });

        try {
          let targetUserId = (admin as any).userId;
          if (!targetUserId && admin.email) {
            const uSnap = await getDocs(
              query(collection(db, "users"), where("email", "==", admin.email.toLowerCase().trim()))
            );
            if (!uSnap.empty) {
              targetUserId = uSnap.docs[0].id;
            }
          }
          if (targetUserId) {
            await updateDoc(doc(db, "users", targetUserId), {
              isStaffSuspended: nextStatus === "INACTIVE",
              updatedAt: serverTimestamp(),
            });
          }
        } catch (_) { }

        const logsCol = collection(db, "shops", activeShopId, "audit_logs");
        await addDoc(logsCol, {
          ...newLog,
          createdAt: serverTimestamp(),
        });
      }
      toast({
        title: nextStatus === "ACTIVE" ? "Staf Diaktifkan Kembali" : "Staf Dinonaktifkan (Suspend)",
        description: `Akses Seller Center untuk ${admin.name || admin.email} kini ${nextStatus === "ACTIVE" ? "aktif kembali" : "ditangguhkan sementara"}.`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Copy invitation link
  const handleCopyInviteLink = (admin: ShopAdmin) => {
    if (!user || !activeShopId) return;
    const inviteUrl = `${window.location.origin}/invite/shop-admin?shopId=${activeShopId}&adminId=${admin.id}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Tautan Undangan Disalin! 📋",
      description: `Tautan persetujuan untuk ${admin.name || admin.email} telah disalin ke clipboard.`,
    });
  };

  // Save new / edited admin
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      toast({
        title: "Email wajib diisi",
        description: "Masukkan email calon admin yang ingin diundang.",
        variant: "destructive",
      });
      return;
    }

    if (editingAdmin && !formName.trim()) {
      toast({
        title: "Nama wajib diisi",
        description: "Nama admin tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const roleLabel =
        formRole === "CO_OWNER"
          ? "Co-Owner"
          : formRole === "KEUANGAN"
            ? "Keuangan"
            : formRole === "PRODUK"
              ? "Produk"
              : "Customer Service";

      if (editingAdmin) {
        const updatedData: ShopAdmin = {
          ...editingAdmin,
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: editingAdmin.role === "OWNER" ? "OWNER" : formRole,
          roleLabel: editingAdmin.role === "OWNER" ? "Pemilik Toko" : roleLabel,
          permissions: editingAdmin.role === "OWNER" ? editingAdmin.permissions : formPermissions,
        };

        setAdmins((prev) => prev.map((a) => (a.id === editingAdmin.id ? updatedData : a)));

        const newLog: AuditLogItem = {
          id: `log-${Date.now()}`,
          adminName: ownerName,
          adminRole: "Pemilik Toko",
          action: "Ubah Hak Akses Staf",
          target: `${updatedData.name || updatedData.email} (${updatedData.roleLabel})`,
          module: "ADMIN",
          timestamp: "Baru saja",
          dateObj: new Date().toISOString().replace("T", " ").substring(0, 16),
          ip: "127.0.0.1 (Lokal)",
          status: "SUCCESS"
        };
        setAuditLogs((prev) => [newLog, ...prev]);

        if (user && db && activeShopId) {
          if (editingAdmin.role !== "OWNER") {
            const adminDocRef = doc(db, "shops", activeShopId, "admins", editingAdmin.id);
            await updateDoc(adminDocRef, {
              name: updatedData.name,
              email: updatedData.email,
              phone: updatedData.phone,
              role: updatedData.role,
              roleLabel: updatedData.roleLabel,
              permissions: updatedData.permissions,
              updatedAt: serverTimestamp(),
            });
          }
          const logsCol = collection(db, "shops", activeShopId, "audit_logs");
          await addDoc(logsCol, {
            ...newLog,
            createdAt: serverTimestamp(),
          });
        }

        toast({
          title: "Berhasil Memperbarui Admin",
          description: `Perubahan hak akses ${updatedData.name || updatedData.email} telah disimpan.`,
        });
        setIsDialogOpen(false);
      } else {
        // Invite new admin: email only, status PENDING, no name yet until accepted
        let createdId = `admin-${Date.now()}`;
        let initialAvatar = "";
        if (user && db && activeShopId) {
          try {
            const uSnap = await getDocs(
              query(collection(db, "users"), where("email", "==", formEmail.trim().toLowerCase()))
            );
            if (!uSnap.empty) {
              initialAvatar = uSnap.docs[0].data()?.photoURL || "";
            }
          } catch (_) { }

          initialAvatar = resolveStaffAvatar(initialAvatar, formEmail.trim(), "");

          const adminsCol = collection(db, "shops", activeShopId, "admins");
          const docRef = await addDoc(adminsCol, {
            name: "",
            email: formEmail.trim().toLowerCase(),
            phone: "",
            avatar: initialAvatar,
            role: formRole,
            roleLabel,
            status: "PENDING",
            permissions: formPermissions,
            lastActive: "Undangan Terkirim",
            invitedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
          createdId = docRef.id;
        } else {
          initialAvatar = resolveStaffAvatar("", formEmail.trim(), "");
        }

        const newAdmin: ShopAdmin = {
          id: createdId,
          name: "",
          email: formEmail.trim().toLowerCase(),
          phone: "",
          avatar: initialAvatar,
          role: formRole,
          roleLabel,
          status: "PENDING",
          permissions: formPermissions,
          lastActive: "Undangan Terkirim",
          createdAt: new Date().toISOString(),
        };

        setAdmins((prev) => [...prev, newAdmin]);

        const newLog: AuditLogItem = {
          id: `log-${Date.now()}`,
          adminName: ownerName,
          adminRole: "Pemilik Toko",
          action: "Mengirim Undangan Staf",
          target: `${newAdmin.email} (${newAdmin.roleLabel})`,
          module: "ADMIN",
          timestamp: "Baru saja",
          dateObj: new Date().toISOString().replace("T", " ").substring(0, 16),
          ip: "127.0.0.1 (Lokal)",
          status: "SUCCESS"
        };
        setAuditLogs((prev) => [newLog, ...prev]);

        if (user && db && activeShopId) {
          const logsCol = collection(db, "shops", activeShopId, "audit_logs");
          await addDoc(logsCol, {
            ...newLog,
            createdAt: serverTimestamp(),
          });
        }

        const inviteUrl = `${window.location.origin}/invite/shop-admin?shopId=${activeShopId}&adminId=${createdId}`;
        setNewlyInvited({
          admin: newAdmin,
          url: inviteUrl,
        });
        setIsDialogOpen(false);
        setIsInviteSuccessModalOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Mengundang Admin",
        description: err.message || "Terjadi kesalahan saat memproses data admin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Revoke staff admin
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    if (deleteCandidate.role === "OWNER") {
      toast({
        title: "Gagal Mengeluarkan",
        description: "Akun Pemilik Toko tidak dapat dikeluarkan.",
        variant: "destructive",
      });
      setDeleteCandidate(null);
      return;
    }

    try {
      setAdmins((prev) => prev.filter((a) => a.id !== deleteCandidate.id));

      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        adminName: ownerName,
        adminRole: isStaff ? "Co-Owner" : "Pemilik Toko",
        action: "Keluarkan Staf dari Toko",
        target: `${deleteCandidate.name || deleteCandidate.email} (${deleteCandidate.roleLabel})`,
        module: "ADMIN",
        timestamp: "Baru saja",
        dateObj: new Date().toISOString().replace("T", " ").substring(0, 16),
        ip: "127.0.0.1 (Lokal)",
        status: "WARNING"
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      if (user && db && activeShopId) {
        const adminDocRef = doc(db, "shops", activeShopId, "admins", deleteCandidate.id);
        await deleteDoc(adminDocRef);

        // Find and revoke staffShopId on the affected user's profile document
        try {
          let targetUserId = (deleteCandidate as any).userId;
          if (!targetUserId && deleteCandidate.email) {
            const uSnap = await getDocs(
              query(collection(db, "users"), where("email", "==", deleteCandidate.email.toLowerCase().trim()))
            );
            if (!uSnap.empty) {
              targetUserId = uSnap.docs[0].id;
            }
          }
          if (targetUserId) {
            await updateDoc(doc(db, "users", targetUserId), {
              isStaff: false,
              hasShop: false,
              staffShopId: null,
              activeShopId: null,
              staffRole: null,
              staffRoleLabel: null,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (revokeErr) {
          console.warn("Could not revoke user doc:", revokeErr);
        }

        const logsCol = collection(db, "shops", activeShopId, "audit_logs");
        await addDoc(logsCol, {
          ...newLog,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: "Staf Dikeluarkan",
        description: `Hak akses untuk ${deleteCandidate.name || deleteCandidate.email} telah dicabut sepenuhnya dari toko.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal Mengeluarkan Staf",
        description: err.message || "Terjadi kesalahan saat mencabut akses staf.",
        variant: "destructive",
      });
    } finally {
      setDeleteCandidate(null);
    }
  };

  // Download Audit Log as CSV
  const handleDownloadLogCSV = () => {
    const headers = ["ID", "Waktu", "Admin", "Peran", "Aksi", "Target / Rincian", "Modul", "IP Address", "Status"];
    const rows = auditLogs.map(log => [
      log.id,
      log.dateObj,
      `"${log.adminName}"`,
      `"${log.adminRole}"`,
      `"${log.action}"`,
      `"${log.target.replace(/"/g, '""')}"`,
      log.module,
      `"${log.ip}"`,
      log.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-log-toko-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Log Berhasil Diunduh! 📄",
      description: "Berkas CSV riwayat aktivitas telah tersimpan di komputermu.",
    });
  };

  // Metrics
  const totalAdminCount = admins.length;
  const coOwnerCount = admins.filter((a) => a.role === "CO_OWNER").length;
  const financeCount = admins.filter((a) => a.role === "KEUANGAN").length;
  const productsCount = admins.filter((a) => a.role === "PRODUK").length;
  const csCount = admins.filter((a) => a.role === "CS").length;

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchSearch =
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.phone && admin.phone.includes(searchQuery));

      const matchRole =
        selectedRoleFilter === "ALL" || admin.role === selectedRoleFilter;

      const matchStatus =
        selectedStatusFilter === "ALL" || admin.status === selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.adminName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(logSearchQuery.toLowerCase());

      const matchModule =
        logModuleFilter === "ALL" || log.module === logModuleFilter;

      const matchStaff =
        logStaffFilter === "ALL" || log.adminName === logStaffFilter;

      return matchSearch && matchModule && matchStaff;
    });
  }, [auditLogs, logSearchQuery, logModuleFilter, logStaffFilter]);

  if (!mounted || authLoading || (shopLoading && !shop)) {
    return (
      <div className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Permission guard: Only Owner & Co-Owner can access Staff Management
  if (!merchantLoading && isStaff && currentStaffRole !== "CO_OWNER") {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full border border-border shadow-md rounded-2xl p-6 text-center space-y-4 bg-white">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Akses Halaman Dibatasi</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Halaman <b>Kelola Staf Toko</b> hanya dapat diakses oleh <b>Pemilik Toko</b> dan <b>Co-Owner</b>.
              Peran Anda saat ini adalah <span className="font-bold text-foreground">{currentStaffRole || "Staf Toko"}</span>.
            </p>
          </div>
          <Button asChild className="w-full bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs font-bold h-9 shadow-sm">
            <a href="/my-shop">Kembali ke Dashboard Toko</a>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#F8FAFC]">
      <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <UserCog className="h-5 w-5 text-[#00AA5B]" />
                Kelola Admin Toko
              </h1>
              <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none text-[10px] font-bold px-2 py-0.5">
                Multi-Admin
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Kelola staf tokomu khusus untuk <b>Keuangan</b>, <b>Produk</b>, dan <b>Customer Service</b>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={handleOpenAddModal}
              className="bg-[#00AA5B] hover:bg-[#00924c] text-white gap-1.5 font-semibold shadow-sm rounded-xl shrink-0 h-8 sm:h-9 px-3 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tambah Admin
            </Button>
          </div>
        </div>

        {/* Tabs Navigation: Clean Segmented Control (tanpa garis bawah hitam) */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
          <div className="overflow-x-auto no-scrollbar pb-0.5">
            <TabsList className="bg-slate-200/60 dark:bg-muted/80 p-1 rounded-xl h-auto inline-flex items-center gap-1 border border-border/40">
              <TabsTrigger
                value="admins"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Tim & Hak Akses</span>
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-300/60 text-slate-700 data-[state=active]:bg-[#00AA5B]/10 data-[state=active]:text-[#00AA5B] leading-none">
                  {totalAdminCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="activity"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
              >
                <History className="h-3.5 w-3.5" />
                <span>Log Aktivitas</span>
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-300/60 text-slate-700 leading-none">
                  {auditLogs.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="quota"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-white data-[state=active]:text-[#00AA5B] data-[state=active]:font-bold data-[state=active]:shadow-xs transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Kuota & Keamanan</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ================= TAB 1: ADMINS & PERMISSIONS ================= */}
          <TabsContent value="admins" className="space-y-4 mt-0">
            {/* Stats Cards: Compact & Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <Card className="rounded-xl border border-border shadow-none hover:border-[#00AA5B]/40 transition-colors">
                <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">Total Admin</p>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{totalAdminCount}</h3>
                    <p className="text-[10px] text-[#00AA5B] font-medium mt-0.5">Semua staf toko</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border shadow-none hover:border-indigo-400/40 transition-colors">
                <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">Co-Owner</p>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{coOwnerCount}</h3>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Akses penuh</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Crown className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border shadow-none hover:border-[#00AA5B]/40 transition-colors">
                <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">Keuangan</p>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{financeCount}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Saldo & mutasi</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border shadow-none hover:border-[#00AA5B]/40 transition-colors">
                <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">Produk</p>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{productsCount}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Etalase & stok</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 sm:col-span-1 rounded-xl border border-border shadow-none hover:border-[#00AA5B]/40 transition-colors">
                <CardContent className="p-3 sm:p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">Customer Service</p>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 leading-tight">{csCount}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Chat & ulasan</p>
                  </div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Headphones className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table & Cards Container */}
            <Card className="rounded-xl border border-border shadow-none">
              <CardContent className="p-3 sm:p-4 md:p-5 space-y-3.5">
                {/* Filters Bar: Stacks on mobile */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, email, nomor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 sm:h-9 rounded-xl border-border text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                      <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9 rounded-xl border-border text-xs">
                        <SelectValue placeholder="Semua Peran" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl text-xs">
                        <SelectItem value="ALL">Semua Peran</SelectItem>
                        <SelectItem value="OWNER">Pemilik Toko</SelectItem>
                        <SelectItem value="CO_OWNER">Co-Owner</SelectItem>
                        <SelectItem value="KEUANGAN">Keuangan</SelectItem>
                        <SelectItem value="PRODUK">Produk</SelectItem>
                        <SelectItem value="CS">Customer Service</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[130px] h-8 sm:h-9 rounded-xl border-border text-xs">
                        <SelectValue placeholder="Semua Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl text-xs">
                        <SelectItem value="ALL">Semua Status</SelectItem>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="PENDING">Menunggu</SelectItem>
                        <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mobile View: Clean Card List (< md) */}
                <div className="block md:hidden space-y-2">
                  {filteredAdmins.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="h-8 w-8 stroke-[1.5] mx-auto mb-1 text-muted-foreground/50" />
                      <p className="text-xs font-semibold text-foreground">Tidak ada admin yang ditemukan</p>
                      <p className="text-[10px] mt-0.5">Coba ubah kata kunci pencarian atau filter.</p>
                    </div>
                  ) : (
                    filteredAdmins.map((admin) => {
                      const isOwner = admin.role === "OWNER";
                      return (
                        <div key={admin.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-7 w-7 border border-border shrink-0">
                                <AvatarImage src={resolveStaffAvatar(admin.avatar, admin.email, admin.name)} alt={admin.name || admin.email} />
                                <AvatarFallback className={cn("font-bold text-[10px]", admin.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-[#00AA5B]/10 text-[#00AA5B]")}>
                                  {admin.name ? admin.name.slice(0, 2).toUpperCase() : <Mail className="h-3 w-3" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 leading-tight">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {admin.name ? (
                                      admin.name
                                    ) : (
                                      <span className="italic font-normal text-muted-foreground">
                                        Menunggu Persetujuan
                                      </span>
                                    )}
                                  </span>
                                  {isOwner && (
                                    <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] px-1 py-0 h-3.5">
                                      Owner
                                    </Badge>
                                  )}
                                  {admin.status === "PENDING" && (
                                    <Badge className="bg-amber-100/90 text-amber-800 border-none text-[8px] px-1 py-0 h-3.5 font-semibold">
                                      Undangan
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{admin.email}</p>
                              </div>
                            </div>

                            <Badge
                              className={cn(
                                "text-[9px] font-semibold border-none px-1.5 py-0.5 shrink-0",
                                admin.role === "OWNER" && "bg-purple-100 text-purple-700",
                                admin.role === "CO_OWNER" && "bg-indigo-100 text-indigo-700",
                                admin.role === "KEUANGAN" && "bg-emerald-100 text-emerald-700",
                                admin.role === "PRODUK" && "bg-amber-100 text-amber-700",
                                admin.role === "CS" && "bg-blue-100 text-blue-700"
                              )}
                            >
                              {admin.roleLabel}
                            </Badge>
                          </div>

                          {/* Badges & Actions row */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[10px]">
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions.finance && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60 font-medium">
                                  <DollarSign className="h-2.5 w-2.5" /> Keuangan
                                </span>
                              )}
                              {admin.permissions.products && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/60 font-medium">
                                  <Package className="h-2.5 w-2.5" /> Produk
                                </span>
                              )}
                              {admin.permissions.chat && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60 font-medium">
                                  <MessageSquare className="h-2.5 w-2.5" /> CS
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {admin.status === "PENDING" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyInviteLink(admin)}
                                  className="h-6 px-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200 rounded-md gap-1"
                                  title="Salin Tautan Undangan"
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                  Salin Link
                                </Button>
                              )}
                              {!isOwner && admin.status !== "PENDING" && (
                                <Switch
                                  checked={admin.status === "ACTIVE"}
                                  onCheckedChange={() => handleToggleStatus(admin)}
                                  className="data-[state=checked]:bg-[#00AA5B] scale-[0.65] origin-right"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(admin)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded-md"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {!isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteCandidate(admin)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 rounded-md"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {admins.length === 1 && selectedRoleFilter === "ALL" && !searchQuery && (
                    <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-2">
                      <Users className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                      <p className="text-xs font-semibold text-foreground">Belum Ada Staf Tambahan</p>
                      <p className="text-[11px] text-muted-foreground">
                        Tambahkan staf admin untuk membantu mengelola Keuangan, Produk, atau CS tokomu.
                      </p>
                      <Button
                        onClick={handleOpenAddModal}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10 text-xs font-semibold h-7"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Tambah Staf Pertama
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop / Tablet View: Compact Table (>= md) */}
                <div className="hidden md:block border border-border rounded-xl overflow-hidden overflow-x-auto">
                  <Table className="w-full whitespace-nowrap min-w-[760px]">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 py-2.5 px-4 whitespace-nowrap">Admin / Staf</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Peran</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Hak Akses</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Terakhir Aktif</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 text-right pr-4 whitespace-nowrap">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            <p className="text-xs text-muted-foreground">Tidak ada admin yang ditemukan</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {filteredAdmins.map((admin) => {
                            const isOwner = admin.role === "OWNER";

                            return (
                              <TableRow key={admin.id} className="hover:bg-muted/20 transition-colors">
                                {/* Profile */}
                                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border border-border">
                                      <AvatarImage src={resolveStaffAvatar(admin.avatar, admin.email, admin.name)} alt={admin.name || admin.email} />
                                      <AvatarFallback className={cn("font-bold text-[10px]", admin.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-[#00AA5B]/10 text-[#00AA5B]")}>
                                        {admin.name ? admin.name.slice(0, 2).toUpperCase() : <Mail className="h-3.5 w-3.5" />}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5 leading-tight">
                                        {admin.name ? (
                                          admin.name
                                        ) : (
                                          <span className="italic font-normal text-muted-foreground">
                                            Menunggu Persetujuan
                                          </span>
                                        )}
                                        {isOwner && (
                                          <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] px-1 py-0 h-3.5">
                                            Owner
                                          </Badge>
                                        )}
                                        {admin.status === "PENDING" && (
                                          <Badge className="bg-amber-100/90 text-amber-800 border-none text-[8px] px-1 py-0 h-3.5 font-semibold">
                                            Undangan
                                          </Badge>
                                        )}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Mail className="h-2.5 w-2.5 inline text-muted-foreground/70" />
                                        {admin.email}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Role */}
                                <TableCell className="px-4 whitespace-nowrap">
                                  <Badge
                                    className={cn(
                                      "text-[10px] font-semibold border-none px-2 py-0.5",
                                      admin.role === "OWNER" && "bg-purple-100 text-purple-700",
                                      admin.role === "CO_OWNER" && "bg-indigo-100 text-indigo-700",
                                      admin.role === "KEUANGAN" && "bg-emerald-100 text-emerald-700",
                                      admin.role === "PRODUK" && "bg-amber-100 text-amber-700",
                                      admin.role === "CS" && "bg-blue-100 text-blue-700"
                                    )}
                                  >
                                    {admin.roleLabel}
                                  </Badge>
                                </TableCell>

                                {/* Permissions Tags */}
                                <TableCell className="px-4 whitespace-nowrap">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {admin.permissions.finance && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium">
                                        <DollarSign className="h-2.5 w-2.5 text-emerald-600" /> Keuangan
                                      </span>
                                    )}
                                    {admin.permissions.products && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium">
                                        <Package className="h-2.5 w-2.5 text-amber-600" /> Produk
                                      </span>
                                    )}
                                    {admin.permissions.chat && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.5 rounded font-medium">
                                        <MessageSquare className="h-2.5 w-2.5 text-blue-600" /> Customer Service
                                      </span>
                                    )}
                                  </div>
                                </TableCell>

                                {/* Status */}
                                <TableCell className="px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {admin.status === "ACTIVE" ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold gap-1 px-1.5 py-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Aktif
                                      </Badge>
                                    ) : admin.status === "PENDING" ? (
                                      <Badge className="bg-amber-50 text-amber-800 border border-amber-300 text-[9px] font-semibold gap-1 px-1.5 py-0.5">
                                        <Clock className="h-2.5 w-2.5 text-amber-600" />
                                        Menunggu Persetujuan
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-semibold px-1.5 py-0.5">
                                        Nonaktif
                                      </Badge>
                                    )}

                                    {!isOwner && admin.status !== "PENDING" && (
                                      <Switch
                                        checked={admin.status === "ACTIVE"}
                                        onCheckedChange={() => handleToggleStatus(admin)}
                                        className="data-[state=checked]:bg-[#00AA5B] scale-75 origin-left"
                                      />
                                    )}
                                  </div>
                                </TableCell>

                                {/* Last Active */}
                                <TableCell className="px-4 whitespace-nowrap">
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground/60" />
                                    {admin.lastActive || "Baru saja"}
                                  </span>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right px-4 whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {admin.status === "PENDING" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyInviteLink(admin)}
                                        className="h-7 px-2 text-[11px] font-semibold text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg gap-1"
                                        title="Salin Tautan Undangan"
                                      >
                                        <Copy className="h-3 w-3" />
                                        <span>Salin Link</span>
                                      </Button>
                                    )}

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditModal(admin)}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                      title="Edit Hak Akses"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>

                                    {!isOwner && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteCandidate(admin)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 rounded-lg"
                                        title={admin.status === "PENDING" ? "Batalkan Undangan" : "Cabut Akses Admin"}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {admins.length === 1 && selectedRoleFilter === "ALL" && !searchQuery && (
                            <TableRow className="hover:bg-transparent border-dashed">
                              <TableCell colSpan={6} className="py-6 text-center bg-muted/10">
                                <div className="flex flex-col items-center justify-center space-y-1.5 max-w-sm mx-auto">
                                  <Users className="h-6 w-6 text-muted-foreground/60" />
                                  <p className="text-xs font-semibold text-foreground">Belum Ada Staf Tambahan</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Tambahkan staf admin untuk membantu mengelola Keuangan, Produk, atau Customer Service tokomu.
                                  </p>
                                  <Button
                                    onClick={handleOpenAddModal}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/10 text-xs font-semibold h-7 mt-1"
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Tambah Staf Pertama
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 2: AUDIT LOGS ================= */}
          <TabsContent value="activity" className="space-y-4 mt-0">
            <Card className="rounded-xl border border-border shadow-none">
              <CardContent className="p-3 sm:p-4 md:p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                      <History className="h-4 w-4 text-[#00AA5B]" />
                      Riwayat Aktivitas & Perubahan
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Catatan otomatis setiap tindakan staf di modul Keuangan, Produk, dan CS.
                    </p>
                  </div>

                  <Button
                    onClick={handleDownloadLogCSV}
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs font-semibold h-8 self-start sm:self-auto"
                  >
                    <Download className="h-3 w-3" />
                    Unduh CSV
                  </Button>
                </div>

                {/* Filters for Logs */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari aksi, staf, atau rincian..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="pl-8 h-8 sm:h-9 rounded-xl border-border text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={logModuleFilter} onValueChange={setLogModuleFilter}>
                      <SelectTrigger className="w-full sm:w-[140px] h-8 sm:h-9 rounded-xl border-border text-xs">
                        <SelectValue placeholder="Semua Modul" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl text-xs">
                        <SelectItem value="ALL">Semua Modul</SelectItem>
                        <SelectItem value="KEUANGAN">Keuangan</SelectItem>
                        <SelectItem value="PRODUK">Produk</SelectItem>
                        <SelectItem value="CS">Customer Service</SelectItem>
                        <SelectItem value="ADMIN">Akses Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={logStaffFilter} onValueChange={setLogStaffFilter}>
                      <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9 rounded-xl border-border text-xs">
                        <SelectValue placeholder="Semua Staf" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl text-xs">
                        <SelectItem value="ALL">Semua Staf</SelectItem>
                        {admins.map((a) => (
                          <SelectItem key={a.id} value={a.name}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Responsive Log Table */}
                <div className="border border-border rounded-xl overflow-x-auto">
                  <Table className="w-full whitespace-nowrap min-w-[720px]">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 py-2.5 px-4 whitespace-nowrap">Staf Pelaksana</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Aksi & Modul</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Rincian Perubahan</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Waktu</TableHead>
                        <TableHead className="text-[11px] font-bold text-muted-foreground/80 px-4 whitespace-nowrap">Alamat IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center">
                            <p className="text-xs text-muted-foreground">Tidak ada riwayat aktivitas yang cocok</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="py-2.5 px-4 whitespace-nowrap">
                              <div className="flex flex-col leading-tight">
                                <span className="text-xs font-bold text-foreground">{log.adminName}</span>
                                <span className="text-[10px] text-muted-foreground">{log.adminRole}</span>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  className={cn(
                                    "text-[9px] font-semibold border-none px-1.5 py-0",
                                    log.module === "KEUANGAN" && "bg-emerald-100 text-emerald-700",
                                    log.module === "PRODUK" && "bg-amber-100 text-amber-700",
                                    log.module === "CS" && "bg-blue-100 text-blue-700",
                                    log.module === "ADMIN" && "bg-slate-100 text-slate-700"
                                  )}
                                >
                                  {log.module}
                                </Badge>
                                <span className="text-xs font-medium text-foreground">{log.action}</span>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 whitespace-nowrap">
                              <span className="text-xs text-muted-foreground">{log.target}</span>
                            </TableCell>

                            <TableCell className="px-4 whitespace-nowrap">
                              <span className="text-[11px] text-muted-foreground">{log.timestamp}</span>
                            </TableCell>

                            <TableCell className="px-4 whitespace-nowrap">
                              <span className="text-[10px] font-mono text-muted-foreground/80">{log.ip}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= TAB 3: QUOTA & SECURITY ================= */}
          <TabsContent value="quota" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card className="rounded-xl border border-border shadow-none">
                  <CardContent className="p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-[#00AA5B]" />
                          Kapasitas Slot Staf Toko
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Batas jumlah akun staf yang dapat mengelola tokomu.
                        </p>
                      </div>
                      <Badge className="bg-[#00AA5B]/10 text-[#00AA5B] border-none font-bold text-[10px]">
                        Seller Pro
                      </Badge>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Penggunaan Slot</span>
                        <span className="font-bold text-[#00AA5B]">{totalAdminCount} dari 10 Terpakai</span>
                      </div>
                      <Progress value={(totalAdminCount / 10) * 100} className="h-2 bg-muted" />
                      <p className="text-[10px] text-muted-foreground pt-0.5">
                        Sisa {10 - totalAdminCount} slot admin pada plan saat ini.
                      </p>
                    </div>

                    {/* Plan Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground">Toko Reguler</span>
                        <p className="text-base font-bold text-foreground">Free</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">• Maksimal 2 Admin</p>
                      </div>

                      <div className="p-3 rounded-xl border-2 border-[#00AA5B] bg-[#00AA5B]/5 space-y-1 relative">
                        <Badge className="absolute -top-2 right-2 bg-[#00AA5B] text-white text-[8px] px-1 py-0 h-3.5">
                          Aktif
                        </Badge>
                        <span className="text-[10px] font-bold text-[#00AA5B]">Seller Pro</span>
                        <p className="text-base font-bold text-foreground">Rp 99rb<span className="text-[9px] font-normal text-muted-foreground">/bln</span></p>
                        <p className="text-[10px] text-foreground leading-tight">• Maksimal 10 Admin</p>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-background space-y-1">
                        <span className="text-[10px] font-bold text-purple-700">Official</span>
                        <p className="text-base font-bold text-foreground">Rp 499rb<span className="text-[9px] font-normal text-muted-foreground">/bln</span></p>
                        <p className="text-[10px] text-muted-foreground leading-tight">• Slot Unlimited</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Policy */}
                <Card className="rounded-xl border border-border shadow-none">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-[#00AA5B]" />
                        Kebijakan Keamanan Akun
                      </h3>
                    </div>

                    <div className="divide-y divide-border/60">
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-foreground">Wajibkan Verifikasi 2 Langkah (2FA)</p>
                          <p className="text-[10px] text-muted-foreground">
                            Staf wajib verifikasi OTP saat masuk akun.
                          </p>
                        </div>
                        <Switch checked={require2FA} onCheckedChange={setRequire2FA} className="data-[state=checked]:bg-[#00AA5B] scale-75" />
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-foreground">Peringatan Login Perangkat Baru</p>
                          <p className="text-[10px] text-muted-foreground">
                            Notifikasi jika ada staf masuk dari lokasi asing.
                          </p>
                        </div>
                        <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} className="data-[state=checked]:bg-[#00AA5B] scale-75" />
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-foreground">Auto-Logout Sesi 30 Menit</p>
                          <p className="text-[10px] text-muted-foreground">
                            Otomatis keluar jika tidak ada aktivitas.
                          </p>
                        </div>
                        <Switch checked={autoSessionTimeout} onCheckedChange={setAutoSessionTimeout} className="data-[state=checked]:bg-[#00AA5B] scale-75" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Guide */}
              <div className="space-y-3">
                <Card className="rounded-xl border border-border shadow-none bg-gradient-to-br from-emerald-500/5 to-white">
                  <CardContent className="p-4 space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Fokus 3 Peran</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sistem dirancang simpel: <b>Keuangan</b> untuk saldo, <b>Produk</b> untuk etalase, dan <b>Customer Service</b> untuk interaksi pembeli.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Add / Edit Admin: Responsive */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[94vw] max-w-md rounded-2xl p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <UserCog className="h-4 w-4 text-[#00AA5B]" />
                {editingAdmin ? "Ubah Hak Akses Admin" : "Undang Admin Toko"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {editingAdmin
                  ? "Sesuaikan peran dan hak staf tokomu."
                  : "Kirim undangan staf melalui email. Nama admin akan muncul otomatis setelah undangan disetujui."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitForm} className="space-y-3 pt-1">
              {/* Jika sedang edit, tampilkan nama & no telepon */}
              {editingAdmin && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Nama Lengkap *</Label>
                  <Input
                    placeholder="Contoh: Dimas Anggara"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="h-8 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Email Akun */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">
                  {editingAdmin ? "Email Akun" : "Email Calon Admin *"}
                </Label>
                <Input
                  type="email"
                  placeholder="staf@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  disabled={editingAdmin?.role === "OWNER"}
                  className="h-8 rounded-xl text-xs"
                  autoFocus={!editingAdmin}
                />
                {!editingAdmin && (
                  <p className="text-[10px] text-muted-foreground">
                    Cukup masukkan email calon admin. Staf akan diminta menyetujui undangan melalui tautan.
                  </p>
                )}
              </div>

              {/* No. Telepon hanya saat editing admin yang sudah disetujui */}
              {editingAdmin && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">No. Telepon</Label>
                  <Input
                    placeholder="08123456789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="h-8 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Info Wajib Persetujuan saat mengundang admin baru */}
              {!editingAdmin && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/40 text-[11px] text-amber-800 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3 text-amber-600" /> Wajib Persetujuan
                  </span>
                  <p className="text-[10px] text-amber-900/80 leading-relaxed">
                    Status admin akan diawali dengan <b>Menunggu Persetujuan</b>. Nama lengkap staf akan otomatis muncul di sistem setelah admin menyetujui undangan.
                  </p>
                </div>
              )}

              {/* Role Preset Selection */}
              {editingAdmin?.role !== "OWNER" && (
                <div className="space-y-1.5 pt-0.5">
                  <Label className="text-[11px] font-semibold text-foreground">Pilih Peran Staf</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(["CO_OWNER", "KEUANGAN", "PRODUK", "CS"] as const).map((rKey) => {
                      const preset = ROLE_PRESETS[rKey];
                      const isSelected = formRole === rKey;
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => handleRoleChange(rKey)}
                          className={cn(
                            "p-2 rounded-xl border text-left transition-all flex flex-col justify-between",
                            isSelected
                              ? "border-[#00AA5B] bg-[#00AA5B]/5 ring-1 ring-[#00AA5B]"
                              : "border-border hover:border-border/80 bg-background"
                          )}
                        >
                          <span className="text-[11px] font-bold text-foreground flex items-center justify-between">
                            {rKey === "CO_OWNER" ? "Co-Owner" : rKey === "KEUANGAN" ? "Keuangan" : rKey === "PRODUK" ? "Produk" : "CS"}
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-[#00AA5B]" />}
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1 leading-tight">
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Checkboxes: Keuangan, Produk, CS */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <Label className="text-[11px] font-semibold text-foreground">
                  Rincian Izin Akses
                </Label>

                <div className="grid grid-cols-1 gap-1.5 bg-muted/30 p-2.5 rounded-xl border border-border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox
                      checked={formPermissions.finance}
                      disabled={editingAdmin?.role === "OWNER"}
                      onCheckedChange={(checked) => {
                        setFormPermissions((prev) => ({ ...prev, finance: !!checked }));
                      }}
                      className="data-[state=checked]:bg-[#00AA5B] data-[state=checked]:border-[#00AA5B]"
                    />
                    <span className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                      <DollarSign className="h-3 w-3 text-emerald-600" /> Keuangan (Saldo & Laporan Mutasi)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox
                      checked={formPermissions.products}
                      disabled={editingAdmin?.role === "OWNER"}
                      onCheckedChange={(checked) => {
                        setFormPermissions((prev) => ({ ...prev, products: !!checked }));
                      }}
                      className="data-[state=checked]:bg-[#00AA5B] data-[state=checked]:border-[#00AA5B]"
                    />
                    <span className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                      <Package className="h-3 w-3 text-amber-600" /> Produk (Kelola Produk, Varian & Etalase)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox
                      checked={formPermissions.chat}
                      disabled={editingAdmin?.role === "OWNER"}
                      onCheckedChange={(checked) => {
                        setFormPermissions((prev) => ({ ...prev, chat: !!checked }));
                      }}
                      className="data-[state=checked]:bg-[#00AA5B] data-[state=checked]:border-[#00AA5B]"
                    />
                    <span className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
                      <MessageSquare className="h-3 w-3 text-blue-600" /> Customer Service (Chat & Ulasan Pembeli)
                    </span>
                  </label>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 flex-row justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs h-8"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#00AA5B] hover:bg-[#00924c] text-white rounded-xl text-xs h-8 font-semibold gap-1.5"
                >
                  {isSubmitting
                    ? "Memproses..."
                    : editingAdmin
                      ? "Simpan Perubahan"
                      : "Kirim Undangan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
          <DialogContent className="w-[90vw] max-w-sm rounded-2xl p-4">
            <DialogHeader>
              <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-1">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm font-bold">Keluarkan Staf dari Toko?</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Apakah Anda yakin ingin mengeluarkan <b>{deleteCandidate?.name || deleteCandidate?.email}</b>? Seluruh hak akses Seller Center untuk akun ini akan dicabut seketika dan ia tidak akan dapat lagi mengelola toko Anda.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2 gap-2 flex-row justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl text-xs h-8"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="rounded-xl text-xs h-8 font-semibold"
              >
                Keluarkan Staf
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Invitation Modal */}
        <Dialog open={isInviteSuccessModalOpen} onOpenChange={setIsInviteSuccessModalOpen}>
          <DialogContent className="w-[94vw] max-w-sm rounded-2xl p-5 text-center space-y-3.5">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-[#00AA5B] flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                Undangan Berhasil Dibuat! 🎉
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Tautan undangan untuk <b>{newlyInvited?.admin.email}</b> telah siap. Calon staf wajib membuka tautan ini untuk menyetujui dan mengisi nama mereka.
              </DialogDescription>
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-[11px] font-semibold text-foreground">Tautan Persetujuan</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  readOnly
                  value={newlyInvited?.url || ""}
                  className="h-8 text-xs font-mono bg-muted/40 border-border select-all"
                />
                <Button
                  onClick={() => {
                    if (newlyInvited?.url) {
                      navigator.clipboard.writeText(newlyInvited.url);
                      toast({
                        title: "Tautan Disalin! 📋",
                        description: "Kirim tautan ini ke calon admin tokomu.",
                      });
                    }
                  }}
                  className="bg-[#00AA5B] hover:bg-[#00924c] text-white h-8 px-2.5 text-xs font-semibold rounded-xl shrink-0 gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Salin
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-1">
              <Button
                onClick={() => setIsInviteSuccessModalOpen(false)}
                className="w-full rounded-xl text-xs font-semibold h-8 bg-slate-900 text-white hover:bg-slate-800"
              >
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
