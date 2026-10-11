"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { useMerchantShop } from "@/context/merchant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerItem {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrder?: string;
  status?: "VIP" | "LOYAL" | "ACTIVE" | "NEW";
  joinDate?: string;
}

export default function MerchantCustomersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { shopId } = useMerchantShop();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "loyal" | "new">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "spending" | "orders">("newest");
  const [pgOrders, setPgOrders] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeShopTargetId = shopId || user?.uid;

  const shopRef = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return doc(db, "shops", activeShopTargetId);
  }, [db, activeShopTargetId]);

  const { data: shop, loading: shopLoading } = useDoc(shopRef);

  const customersQuery = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return query(collection(db, "shops", activeShopTargetId, "customers"));
  }, [db, activeShopTargetId]);

  const ordersQuery = useMemoFirebase(() => {
    if (!activeShopTargetId || !db) return null;
    return query(collection(db, "shops", activeShopTargetId, "orders"));
  }, [db, activeShopTargetId]);

  const { data: rawCustomers, loading: customersLoading } = useCollection<any>(customersQuery);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  // Format tanggal rapi
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Ambil transaksi toko dari PostgreSQL
  useEffect(() => {
    const url = activeShopTargetId
      ? `/api/transactions?shopId=${encodeURIComponent(activeShopTargetId)}`
      : `/api/transactions`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.transactions)) {
          setPgOrders(data.transactions);
        }
      })
      .catch((err) => console.warn("[MERCHANT CUSTOMERS PG FETCH ERROR]", err));
  }, [activeShopTargetId]);

  // Cari displayName dan foto profil pembeli dari data akun pengguna Firestore
  const [userProfileMap, setUserProfileMap] = useState<Record<string, { displayName?: string; photoURL?: string }>>({});

  useEffect(() => {
    if (!db) return;
    const allEmails = Array.from(
      new Set(
        [...(rawOrders || []), ...pgOrders]
          .map((o) => (o.buyerEmail || o.recipient || o.email || "").trim().toLowerCase())
          .filter(Boolean)
      )
    );

    allEmails.forEach(async (email) => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
        if (!snap.empty) {
          const u = snap.docs[0].data();
          const dName = u.displayName || u.name;
          const photo = u.photoURL;
          if (dName || photo) {
            setUserProfileMap((prev) => ({
              ...prev,
              [email]: { displayName: dName, photoURL: photo },
            }));
          }
        }
      } catch (err) {
        // Abaikan jika permission Firestore dibatasi
      }
    });
  }, [db, pgOrders, rawOrders]);

  // Agregasi pelanggan otomatis dari pesanan riil & Firestore
  const customers: CustomerItem[] = useMemo(() => {
    const map = new Map<string, CustomerItem>();

    // Masukkan data pelanggan tersimpan dari Firestore terlebih dahulu jika ada
    if (rawCustomers && rawCustomers.length > 0) {
      for (const c of rawCustomers) {
        const key = (c.email || c.id || c.name || "").trim().toLowerCase();
        if (key) {
          map.set(key, { ...c });
        }
      }
    }

    // Agregasi dari seluruh pesanan riil (Firestore + PostgreSQL)
    const allOrders = [...(rawOrders || []), ...pgOrders];

    for (const o of allOrders) {
      const email = (o.buyerEmail || o.recipient || o.email || "").trim().toLowerCase();
      const profile = userProfileMap[email];

      // Prioritaskan displayName akun asli
      let name = profile?.displayName || o.buyerName || o.buyer;
      if (!name || name.toLowerCase() === email.split("@")[0].toLowerCase()) {
        if (email === "althar.dev@gmail.com") name = "Alhadi Adriano";
        else if (email === "starvale.id@gmail.com") name = "StarVale";
        else name = email ? email.split("@")[0] : "Pelanggan";
      }

      const avatar = profile?.photoURL || o.avatar || undefined;
      const key = email || name;
      if (!key) continue;

      const spent = Number(o.totalAmount || o.amount || o.itemsSubtotal || 0) || 0;
      const orderDate = o.createdAt?.toDate
        ? o.createdAt.toDate().toISOString()
        : (o.createdAt || new Date().toISOString());

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          email: email || undefined,
          avatar,
          totalOrders: 1,
          totalSpent: spent,
          lastOrder: orderDate,
          joinDate: orderDate,
          status: "NEW",
        });
      } else {
        const existing = map.get(key)!;
        if (name && (!existing.name || existing.name.toLowerCase() === email.split("@")[0].toLowerCase())) {
          existing.name = name;
        }
        if (avatar && !existing.avatar) {
          existing.avatar = avatar;
        }
        // Jika pelanggan dari Firestore belum punya totalOrders atau dihitung dari transaksi
        if (!rawCustomers || rawCustomers.length === 0) {
          existing.totalOrders = (existing.totalOrders || 0) + 1;
          existing.totalSpent = (existing.totalSpent || 0) + spent;
          if (existing.totalOrders >= 3) existing.status = "VIP";
          else if (existing.totalOrders >= 2) existing.status = "LOYAL";
        }
      }
    }

    return Array.from(map.values());
  }, [rawCustomers, rawOrders, pgOrders, userProfileMap]);

  const loyalCount = customers.filter(c => c.status === "LOYAL" || c.status === "VIP").length;
  const newCount = customers.filter(c => c.status === "NEW").length;
  const totalRevenue = customers.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);

  const filteredCustomers = customers.filter((item) => {
    if (activeTab === "loyal" && item.status !== "LOYAL" && item.status !== "VIP") return false;
    if (activeTab === "new" && item.status !== "NEW") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "spending") return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
    if (sortBy === "orders") return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
    return 0;
  });

  if (!mounted || ((authLoading || shopLoading || customersLoading) && pgOrders.length === 0)) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-[#F9FAFB]">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-[#212121]">Daftar Pelanggan</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Analisis riwayat pembeli dan bangun hubungan jangka panjang.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Pelanggan", value: customers.length, icon: "ph:users-bold", color: "text-[#00AA5B]", bg: "bg-emerald-50" },
            { label: "Pelanggan Baru", value: newCount, icon: "ph:user-plus-bold", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Pelanggan Loyal", value: loyalCount, icon: "ph:heart-straight-bold", color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Total Pembelian", value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: "ph:wallet-bold", color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, idx) => (
            <Card key={idx} className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                    <Icon icon={stat.icon} className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                  <p className="text-xl font-black text-[#212121] tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button
              variant={activeTab === "all" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("all")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "all" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Semua ({customers.length})
            </Button>
            <Button
              variant={activeTab === "loyal" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("loyal")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "loyal" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Loyal / VIP ({loyalCount})
            </Button>
            <Button
              variant={activeTab === "new" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("new")}
              className={cn(
                "h-8 rounded-lg text-[10px] font-bold cursor-pointer",
                activeTab === "new" ? "bg-[#00AA5B]/10 text-[#00AA5B]" : "text-muted-foreground"
              )}
            >
              Baru ({newCount})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative md:w-56">
              <Icon icon="ph:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 rounded-lg border-border text-[10px] bg-muted/20"
              />
            </div>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-8 w-32 rounded-lg border-border text-[10px] font-bold bg-white">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="newest" className="text-[10px] font-bold">Terbaru</SelectItem>
                <SelectItem value="spending" className="text-[10px] font-bold">Total Belanja</SelectItem>
                <SelectItem value="orders" className="text-[10px] font-bold">Total Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers Table / Clean Empty State */}
        <Card className="border-border border-[1.5px] shadow-sm rounded-2xl bg-white overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-border/80 mb-3">
                <Icon icon="ph:users-three" className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Data Pelanggan</h3>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                {customers.length === 0
                  ? "Daftar pembeli akan otomatis tersimpan di sini begitu pelanggan melakukan transaksi pada produk toko Anda."
                  : "Tidak ada pelanggan yang sesuai dengan kriteria pencarian."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full whitespace-nowrap min-w-[720px]">
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 whitespace-nowrap">Pelanggan</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 whitespace-nowrap">Total Pesanan</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 whitespace-nowrap">Total Belanja</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 whitespace-nowrap">Transaksi Terakhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((cust) => (
                    <TableRow key={cust.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-xl border border-border shadow-2xs">
                            {cust.avatar && <AvatarImage src={cust.avatar} />}
                            <AvatarFallback className="bg-[#00AA5B]/5 text-[#00AA5B] text-[10px] font-black">
                              {cust.name ? cust.name.substring(0, 1).toUpperCase() : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-black text-slate-900 whitespace-nowrap">{cust.name || "Pelanggan"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{cust.email || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 whitespace-nowrap">
                        <Badge className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md border-none whitespace-nowrap",
                          cust.status === "VIP" ? "bg-purple-600 text-white" :
                            cust.status === "LOYAL" ? "bg-[#00AA5B] text-white" :
                              cust.status === "ACTIVE" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                        )}>
                          {cust.status || "ACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-xs px-4 whitespace-nowrap">{cust.totalOrders || 0} Order</TableCell>
                      <TableCell className="font-bold text-xs text-slate-900 px-4 whitespace-nowrap">
                        Rp {(cust.totalSpent || 0).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-medium px-4 whitespace-nowrap">
                        {formatDate(cust.lastOrder)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

      </div>
    </main>
  );
}
