"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Wallet,
  Store,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Tag,
  HelpCircle,
  ExternalLink,
  MessageCircle,
  User,
  Phone,
  Mail,
  FileText,
  Minus,
  Plus,
  Loader2,
  Landmark,
  Zap,
  Flame,
  Download,
  RefreshCw,
  Smartphone,
  LogIn
} from "lucide-react";
import { getProductActiveFlashSale, sanitizeForFirestore } from "@/lib/flash-sale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, updateDoc, setDoc, getDoc, getDocs, query, where, limit, serverTimestamp, increment } from "firebase/firestore";
import { PaymentChannel as AdminPaymentChannel, DEFAULT_CHANNELS } from "@/app/admin/xendit/channels/page";
import { CheckoutLoadingSkeleton } from "./loading";

const ADMIN_CHANNEL_METADATA: Record<string, {
  logoUrl: string;
  vaPrefix?: string;
  instructions: string[];
}> = {
  qris: {
    logoUrl: "/assets/payments/qris.png",
    instructions: [
      "Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja) atau Mobile Banking pilihan Anda.",
      "Pilih menu 'Scan' atau 'Bayar dengan QRIS'.",
      "Pindai (scan) kode QR yang tampil di layar Anda.",
      "Periksa nominal pembayaran dan konfirmasi transaksi Anda."
    ]
  },
  va_bni: {
    logoUrl: "/assets/payments/bni.png",
    vaPrefix: "98812",
    instructions: [
      "Buka BNI Mobile Banking, pilih 'Transfer' > 'Virtual Account Billing'.",
      "Pilih Rekening Debet lalu masukkan Nomor Virtual Account.",
      "Konfirmasi transaksi dan masukkan Password Transaksi."
    ]
  },
  va_bri: {
    logoUrl: "/assets/payments/bri.png",
    vaPrefix: "12800",
    instructions: [
      "Buka BRImo, pilih menu 'Tagihan' > 'BRIVA'.",
      "Masukkan Nomor Virtual Account BRIVA Anda.",
      "Periksa rincian tagihan lalu masukkan PIN BRImo."
    ]
  },
  va_bsi: {
    logoUrl: "/assets/bank/bsi-logo.svg",
    vaPrefix: "70012",
    instructions: [
      "Buka BSI Mobile, pilih menu 'Bayar' > 'Virtual Account'.",
      "Masukkan Nomor Virtual Account BSI Anda.",
      "Periksa detail nama merchant dan tagihan.",
      "Masukkan PIN BSI Mobile Anda."
    ]
  },
  va_bss: {
    logoUrl: "/assets/bank/bss-logo.svg",
    vaPrefix: "85501",
    instructions: [
      "Buka aplikasi perbankan Anda dan pilih transfer antar bank atau Virtual Account.",
      "Pilih Bank Sahabat Sampoerna (BSS).",
      "Masukkan Nomor Virtual Account dan selesaikan pembayaran."
    ]
  },
  va_cimb: {
    logoUrl: "/assets/payments/cimb.png",
    vaPrefix: "11809",
    instructions: [
      "Buka OCTO Mobile by CIMB Niaga, pilih menu 'Transfer' > 'Rekening Virtual'.",
      "Masukkan Nomor Virtual Account CIMB.",
      "Konfirmasi pembayaran dan masukkan PIN OCTO Mobile."
    ]
  },
  va_mandiri: {
    logoUrl: "/assets/payments/mandiri.png",
    vaPrefix: "89508",
    instructions: [
      "Buka Livin' by Mandiri, pilih menu 'Bayar'.",
      "Cari penyedia jasa 'MarketPoint' atau masukkan kode bayar.",
      "Masukkan Nomor Virtual Account lalu tekan Lanjut.",
      "Konfirmasi pembayaran dengan PIN Livin' Anda."
    ]
  },
  va_permata: {
    logoUrl: "/assets/bank/permata-logo.svg",
    vaPrefix: "84550",
    instructions: [
      "Buka PermataME, pilih 'Pembayaran Tagihan' > 'Virtual Account'.",
      "Masukkan Nomor Virtual Account Permata Bank.",
      "Pastikan rincian tagihan sesuai lalu masukkan otentikasi."
    ]
  },
  ewallet_astrapay: {
    logoUrl: "/assets/payments/linkaja.png",
    instructions: [
      "Buka aplikasi AstraPay.",
      "Periksa rincian pembayaran di halaman konfirmasi.",
      "Klik Bayar dan selesaikan transaksi."
    ]
  },
  ewallet_linkaja: {
    logoUrl: "/assets/payments/linkaja.png",
    instructions: [
      "Buka aplikasi LinkAja atau konfirmasi melalui notifikasi.",
      "Periksa rincian tagihan pesanan MarketPoint.",
      "Masukkan PIN LinkAja Anda untuk menyelesaikan transaksi."
    ]
  },
  ewallet_ovo: {
    logoUrl: "/assets/payments/ovo.png",
    instructions: [
      "Buka notifikasi di aplikasi OVO pada ponsel Anda.",
      "Periksa jumlah pembayaran tagihan MarketPoint.",
      "Pilih OVO Cash lalu tekan 'Bayar'."
    ]
  },
  retail_alfamart: {
    logoUrl: "/assets/payments/alfamart.png",
    vaPrefix: "ALFA",
    instructions: [
      "Kunjungi gerai Alfamart terdekat.",
      "Sampaikan kepada kasir ingin membayar pesanan MarketPoint.",
      "Tunjukkan Kode Pembayaran dan simpan struk pembayaran."
    ]
  },
  retail_indomaret: {
    logoUrl: "/assets/payments/indomaret.png",
    vaPrefix: "IDM",
    instructions: [
      "Kunjungi gerai Indomaret terdekat.",
      "Sampaikan kepada kasir ingin membayar transaksi MarketPoint.",
      "Tunjukkan Kode Pembayaran kepada kasir dan bayar sesuai tagihan."
    ]
  },
  paylater_akulaku: {
    logoUrl: "/assets/payments/akulaku.png",
    instructions: [
      "Anda akan diarahkan ke login Akulaku PayLater.",
      "Pilih skema tenor pembayaran yang diinginkan.",
      "Konfirmasi dengan PIN Akulaku Anda."
    ]
  }
};

const CATEGORY_DEFINITIONS = [
  {
    category: "VIRTUAL_ACCOUNT",
    id: "bank_transfer",
    label: "BANK TRANSFER",
    icon: Landmark,
  },
  {
    category: "RETAIL_OUTLET",
    id: "retail_outlet",
    label: "RETAIL OUTLET",
    icon: Store,
  },
  {
    category: "EWALLET",
    id: "e_wallet",
    label: "E-WALLET",
    icon: Wallet,
  },
  {
    category: "QRIS",
    id: "qr_payments",
    label: "QR PAYMENTS",
    icon: QrCode,
  },
  {
    category: "PAYLATER",
    id: "paylater",
    label: "PAYLATER",
    icon: Clock,
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  // Firestore Admin Channels Binding
  const xenditDocRef = useMemoFirebase(() => doc(db, "settings", "xendit"), [db]);
  const { data: xenditData } = useDoc(xenditDocRef);

  // Query Params
  const productId = searchParams.get("productId") || searchParams.get("product") || searchParams.get("id");
  const initialQuantity = Math.max(1, parseInt(searchParams.get("quantity") || "1", 10));
  const variantParam = searchParams.get("variant") || "";

  // State
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedVariant, setSelectedVariant] = useState<string>(variantParam);

  // Fetch Shop Profile to check active Flash Sales & shop-wide promos
  const shopDocRef = useMemoFirebase(
    () => (db && (product?.shopId || product?.shop_id) ? doc(db, "shops", product?.shopId || product?.shop_id) : null),
    [db, product?.shopId, product?.shop_id]
  );
  const { data: shopData } = useDoc(shopDocRef);

  // Active Flash Sale check
  const activeFlashSale = useMemo(() => {
    if (!product?.id || !shopData?.flashSales) return null;
    return getProductActiveFlashSale(product.id, shopData.flashSales);
  }, [product?.id, shopData?.flashSales]);

  // Buyer Details
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // STRICT FILTER: Only ACTIVE channels from Admin Payment Channels!
  const activeChannels = useMemo(() => {
    let list: AdminPaymentChannel[] = DEFAULT_CHANNELS;
    if (xenditData?.paymentChannels && Array.isArray(xenditData.paymentChannels) && xenditData.paymentChannels.length > 0) {
      const savedMap = new Map<string, AdminPaymentChannel>(
        xenditData.paymentChannels.map((c: AdminPaymentChannel) => [c.id, c])
      );
      list = DEFAULT_CHANNELS.map((def) => {
        const saved = savedMap.get(def.id);
        return saved ? { ...def, ...saved } : def;
      });
    }
    // HANYA METODE YANG AKTIF DARI ADMIN! QRIS minimal 1 rupiah.
    return list
      .map((ch) => {
        if (ch.id === "qris" || ch.category === "QRIS" || ch.channelCode === "QRIS") {
          return { ...ch, minAmount: 1 };
        }
        return ch;
      })
      .filter((ch) => ch.isActive === true);
  }, [xenditData]);

  // Selected Payment Method
  const [selectedMethodId, setSelectedMethodId] = useState<string>("qris");

  useEffect(() => {
    if (activeChannels.length > 0) {
      if (!activeChannels.some((c) => c.id === selectedMethodId)) {
        setSelectedMethodId(activeChannels[0].id);
      }
    }
  }, [activeChannels, selectedMethodId]);

  const selectedMethod = useMemo(() => {
    return activeChannels.find((c) => c.id === selectedMethodId) || activeChannels[0] || null;
  }, [activeChannels, selectedMethodId]);

  // Group active channels into categories (omit empty categories)
  const paymentCategories = useMemo(() => {
    return CATEGORY_DEFINITIONS.map((def) => {
      const channels = activeChannels.filter((c) => c.category === def.category);
      return {
        ...def,
        channels,
      };
    }).filter((cat) => cat.channels.length > 0);
  }, [activeChannels]);

  // Promo Code
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  // Invoice / Payment Modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Countdown timer in modal (24 hours)
  const [timeLeft, setTimeLeft] = useState(86399);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autofill user information if logged in
  useEffect(() => {
    if (user) {
      if (!buyerName && user.displayName) setBuyerName(user.displayName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
  }, [user, buyerName, buyerEmail, buyerPhone]);

  // Fetch Product Details
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProductData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?id=${productId}`);
        const data = await res.json();
        if (res.ok && data.product) {
          setProduct(data.product);
          // Set default variant if available and none selected
          if (!variantParam && data.product.attributes?.variants?.length > 0) {
            setSelectedVariant(data.product.attributes.variants[0].name || "");
          }
        } else {
          // Fallback dummy for testing if API fails
          setProduct({
            id: productId,
            title: "Produk Pembelian Instan",
            price: 5000,
            originalPrice: 10000,
            shopName: "MarketPoint Official",
            images: [{ imageUrl: "/assets/img/logo.png" }]
          });
        }
      } catch (err) {
        console.error("Gagal memuat produk checkout:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, variantParam]);

  // Timer countdown
  useEffect(() => {
    if (!showInvoiceModal) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showInvoiceModal]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Check if selected variant exists
  const variantObj = useMemo(() => {
    if (!product?.attributes?.variants || !selectedVariant) return null;
    return product.attributes.variants.find((v: any) => v.name === selectedVariant);
  }, [product, selectedVariant]);

  const basePrice = useMemo(() => {
    if (variantObj) return Number(variantObj.price || product?.price || 5000);
    return Number(product?.price || 5000);
  }, [product, variantObj]);

  // Calculations
  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (activeFlashSale) {
      if (variantObj) {
        return Math.max(100, Math.round(basePrice * (1 - (activeFlashSale.discountPercentage / 100))));
      }
      return activeFlashSale.discountPrice;
    }
    return basePrice;
  }, [product, activeFlashSale, variantObj, basePrice]);

  const originalUnitPrice = useMemo(() => {
    if (activeFlashSale) {
      return variantObj ? basePrice : activeFlashSale.originalPrice;
    }
    return product?.discountPrice ? Number(product.discountPrice) : null;
  }, [activeFlashSale, variantObj, basePrice, product?.discountPrice]);

  const itemsSubtotal = unitPrice * quantity;

  const getFeeInfo = (ch?: AdminPaymentChannel | null) => {
    if (!ch) return { feeAmount: 0, feeText: "Bebas Biaya" };
    if (ch.feeType === "percentage") {
      const feeAmount = Math.round((itemsSubtotal * (ch.customFee || 0)) / 100);
      const feeText = ch.customFee > 0 ? `+${ch.customFee}% (Rp ${feeAmount.toLocaleString("id-ID")})` : "Bebas Biaya";
      return { feeAmount, feeText };
    }
    const feeAmount = ch.customFee || 0;
    const feeText = feeAmount > 0 ? `+Rp ${feeAmount.toLocaleString("id-ID")}` : "Bebas Biaya";
    return { feeAmount, feeText };
  };

  const paymentFee = useMemo(() => {
    return getFeeInfo(selectedMethod).feeAmount;
  }, [selectedMethod, itemsSubtotal]);

  const grandTotal = Math.max(0, itemsSubtotal + paymentFee - appliedDiscount);

  // Apply Voucher Promo (Live Shop Vouchers & Platform Codes)
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    const code = promoCode.trim().toUpperCase().replace(/\s+/g, "");
    setCheckingPromo(true);

    try {
      const sId = product?.shopId || product?.shop_id;
      let matchedVoucher: any = null;

      // 1. Check shop's vouchers in Firestore (Shop Doc array first for zero permission errors)
      if (db && sId) {
        try {
          const shopDocSnap = await getDoc(doc(db, "shops", sId));
          if (shopDocSnap.exists()) {
            const sData = shopDocSnap.data();
            const shopVouchers = Array.isArray(sData?.vouchers) ? sData.vouchers : [];
            const found = shopVouchers.find((v: any) => v.code?.toUpperCase() === code);
            if (found) {
              matchedVoucher = {
                ...found,
                shopName: sData?.name || sData?.shopName || "Toko Penjual",
              };
            }
          }
        } catch (e) {
          console.warn("Could not query shop vouchers from doc:", e);
        }

        // Fallback check subcollection if not found in doc
        if (!matchedVoucher) {
          try {
            const vQuery = query(
              collection(db, "shops", sId, "vouchers"),
              where("code", "==", code),
              limit(1)
            );
            const snap = await getDocs(vQuery);
            if (!snap.empty) {
              matchedVoucher = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
            }
          } catch (e) {
            console.warn("Could not query shop vouchers subcollection:", e);
          }
        }
      }

      // 2. Validate matched shop voucher
      if (matchedVoucher) {
        if (matchedVoucher.status !== "ACTIVE") {
          toast({
            variant: "destructive",
            title: "Voucher Tidak Aktif",
            description: "Voucher promo ini sedang dinonaktifkan oleh penjual.",
          });
          return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (matchedVoucher.expiry && matchedVoucher.expiry < today) {
          toast({
            variant: "destructive",
            title: "Voucher Kedaluwarsa",
            description: `Masa berlaku voucher telah habis pada ${matchedVoucher.expiry}.`,
          });
          return;
        }

        if (Number(matchedVoucher.used || 0) >= Number(matchedVoucher.quota || 0)) {
          toast({
            variant: "destructive",
            title: "Kuota Voucher Habis",
            description: "Kuota penggunaan voucher promo ini sudah terpenuhi.",
          });
          return;
        }

        if (matchedVoucher.minPurchase && itemsSubtotal < Number(matchedVoucher.minPurchase)) {
          toast({
            variant: "destructive",
            title: "Syarat Belanja Belum Terpenuhi",
            description: `Minimal pembelian untuk voucher ini adalah Rp ${Number(matchedVoucher.minPurchase).toLocaleString("id-ID")}.`,
          });
          return;
        }

        // Check Product Specific Scope
        if (matchedVoucher.scope === "SPECIFIC_PRODUCTS" && Array.isArray(matchedVoucher.applicableProductIds) && matchedVoucher.applicableProductIds.length > 0) {
          const currentProdId = String(product?.id || productId || "");
          const isEligible = matchedVoucher.applicableProductIds.some((pId: any) => String(pId) === currentProdId);
          if (!isEligible) {
            toast({
              variant: "destructive",
              title: "Voucher Tidak Berlaku",
              description: `Voucher "${code}" khusus untuk produk tertentu dan tidak dapat digunakan untuk produk ini.`,
            });
            return;
          }
        }

        // Calculate discount
        let discount = 0;
        if (matchedVoucher.type === "percentage") {
          discount = Math.round((itemsSubtotal * Number(matchedVoucher.value)) / 100);
          if (matchedVoucher.maxDiscount && discount > Number(matchedVoucher.maxDiscount)) {
            discount = Number(matchedVoucher.maxDiscount);
          }
        } else {
          discount = Math.min(Number(matchedVoucher.value), itemsSubtotal);
        }

        setAppliedDiscount(discount);
        setAppliedVoucher(matchedVoucher);
        const descText = matchedVoucher.type === "percentage"
          ? `${matchedVoucher.value}%`
          : `Rp ${Number(matchedVoucher.value).toLocaleString("id-ID")}`;
        setPromoSuccessMsg(`Voucher Toko "${code}" aktif (-Rp ${discount.toLocaleString("id-ID")})`);
        toast({
          title: "Voucher Toko Berhasil Dipakai!",
          description: `Hemat Rp ${discount.toLocaleString("id-ID")} (${descText}) untuk pesanan ini.`,
        });
        return;
      }

      // 3. Fallback platform promo codes
      if (code === "MARKETHEMAT" || code === "DISKON10" || code === "MARKETPOINT") {
        const discount = Math.min(itemsSubtotal * 0.1, 50000);
        setAppliedDiscount(discount);
        setAppliedVoucher({ code, type: "percentage", value: 10 });
        setPromoSuccessMsg(`Kode "${code}" berhasil! Diskon 10% (Rp ${discount.toLocaleString("id-ID")})`);
        toast({
          title: "Voucher Berhasil Dipakai!",
          description: `Hemat Rp ${discount.toLocaleString("id-ID")} untuk pesanan ini.`
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Kode Promo Tidak Valid",
        description: "Kode voucher tidak ditemukan atau tidak berlaku untuk toko ini."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memeriksa Voucher",
        description: err.message || "Terjadi kesalahan saat memeriksa voucher.",
      });
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(0);
    setPromoSuccessMsg("");
    setAppliedVoucher(null);
    setPromoCode("");
    toast({
      title: "Voucher Dibatalkan",
      description: "Diskon promo telah dihapus dari pesanan ini.",
    });
  };

  // Handle Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Berhasil Disalin!",
      description: `${text} telah disalin ke papan klip.`
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to map category to Xendit payment type
  const getMethodType = (category?: string) => {
    switch (category) {
      case "QRIS":
        return "qris";
      case "VIRTUAL_ACCOUNT":
        return "va";
      case "EWALLET":
        return "ewallet";
      case "RETAIL_OUTLET":
        return "retail";
      case "PAYLATER":
        return "paylater";
      default:
        return "qris";
    }
  };

  // Download QRIS as image
  const handleDownloadQR = async () => {
    const qrStr = invoiceData?.qr_string || invoiceData?.paymentCode;
    if (!qrStr) return;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrStr)}`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QRIS-${(invoiceData?.invoiceNumber || "MarketPoint").replace(/[\/\s]/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "QRIS Berhasil Diunduh", description: "Buka aplikasi perbankan/e-wallet untuk scan QR." });
    } catch (error) {
      window.open(url, "_blank");
    }
  };

  // Cek status pembayaran ke Xendit
  const handleCheckPaymentStatus = async (silent = false) => {
    const prId = invoiceData?.pr_id || invoiceData?.payment_info?.pr_id;
    if (!prId) return;

    if (!silent) setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pr_id: prId,
          secret_key: xenditData?.secretKey || undefined,
          orderId: invoiceData?.invoiceNumber,
          recipientEmail: invoiceData?.buyerEmail || buyerEmail.trim(),
          recipientName: invoiceData?.buyerName || buyerName.trim(),
          productId: invoiceData?.productId || product?.id,
          productTitle: invoiceData?.productTitle || product?.title,
          variant: invoiceData?.variant || selectedVariant,
          quantity: invoiceData?.quantity || quantity,
        }),
      });
      const data = await res.json();
      if (data.success && data.isPaid) {
        setInvoiceData((prev: any) => ({ ...prev, status: "PAID" }));

        // Pastikan lisensi dan data produk terkirim oleh delivery@marketpoint.id
        const targetEmail = invoiceData?.buyerEmail || buyerEmail.trim();
        if (targetEmail) {
          fetch("/api/payments/deliver", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: invoiceData?.invoiceNumber,
              recipientEmail: targetEmail,
              recipientName: invoiceData?.buyerName || buyerName.trim(),
              productId: invoiceData?.productId || product?.id,
              productTitle: invoiceData?.productTitle || product?.title,
              variant: invoiceData?.variant || selectedVariant,
              quantity: invoiceData?.quantity || quantity,
            }),
          }).catch((err) => console.warn("[CHECKOUT AUTO-DELIVERY CALL WARN]", err));
        }

        // Sinkronisasi status di Firestore
        if (db) {
          const updates = { status: "PAID", deliveredBy: "delivery@marketpoint.id", updatedAt: serverTimestamp() };
          const invNum = invoiceData?.invoiceNumber;
          if (invNum) {
            setDoc(doc(db, "transactions", invNum), updates, { merge: true }).catch(() => {});
          }
          if (user?.uid && invoiceData?.userOrderId) {
            updateDoc(doc(db, "users", user.uid, "transactions", invoiceData.userOrderId), updates).catch(() => {});
          }
          const sId = product?.shopId || product?.shop_id;
          if (sId) {
            if (invoiceData?.shopOrderId) {
              updateDoc(doc(db, "shops", sId, "orders", invoiceData.shopOrderId), updates).catch(() => {});
            }

            // Kreditkan saldo hasil penjualan ke dompet akun toko
            const salesAmount = Number(
              invoiceData?.itemsSubtotal ||
              (Number(invoiceData?.unitPrice || product?.price || 0) * Number(invoiceData?.quantity || quantity || 1)) ||
              invoiceData?.totalAmount ||
              0
            );

            if (salesAmount > 0) {
              const sellerWalletRef = doc(db, "users", sId, "wallet", "info");
              setDoc(
                sellerWalletRef,
                {
                  balance: increment(salesAmount),
                  totalRevenue: increment(salesAmount),
                  currency: "IDR",
                  userId: sId,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch((wErr) => console.warn("[SELLER WALLET UPDATE WARN]", wErr));

              // Catat riwayat mutasi masuk (SALES) untuk toko penjual
              addDoc(collection(db, "users", sId, "transactions"), {
                type: "SALES",
                amount: salesAmount,
                description: `Hasil Penjualan #${invNum || "INV"} - ${invoiceData?.productTitle || product?.title || "Produk Digital"}`,
                status: "SUCCESS",
                invoiceNumber: invNum,
                orderId: invoiceData?.shopOrderId || null,
                buyerName: invoiceData?.buyerName || buyerName.trim(),
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
              }).catch((tErr) => console.warn("[SELLER TRANSACTION LOG WARN]", tErr));
            }
          }
        }

        toast({
          title: "Pembayaran Sukses & Lisensi Terkirim! 🎉",
          description: targetEmail
            ? `Lisensi dan data produk telah dikirimkan ke email Anda (${targetEmail}) oleh delivery@marketpoint.id.`
            : "Pesanan Anda telah lunas dan sedang diproses.",
        });

        setTimeout(() => {
          setShowInvoiceModal(false);
          router.push(`/transactions/${encodeURIComponent(invoiceData?.invoiceNumber || "")}`);
        }, 2200);
      } else if (!silent) {
        toast({
          title: "Belum Terdeteksi",
          description: "Pembayaran belum terdeteksi di Xendit. Mohon selesaikan pembayaran lalu periksa kembali.",
        });
      }
    } catch (err: any) {
      if (!silent) {
        toast({
          variant: "destructive",
          title: "Gagal Sinkronisasi",
          description: err.message || "Gagal memeriksa status ke Xendit.",
        });
      }
    } finally {
      if (!silent) setIsCheckingStatus(false);
    }
  };

  // Auto polling status pembayaran setiap 8 detik jika modal terbuka
  useEffect(() => {
    const prId = invoiceData?.pr_id || invoiceData?.payment_info?.pr_id;
    if (!showInvoiceModal || !prId || invoiceData?.status === "PAID") return;
    const interval = setInterval(() => {
      handleCheckPaymentStatus(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [showInvoiceModal, invoiceData?.pr_id, invoiceData?.status]);

  // Batalkan transaksi di Xendit
  const handleCancelPayment = async () => {
    const prId = invoiceData?.pr_id || invoiceData?.payment_info?.pr_id;
    setIsCanceling(true);
    try {
      if (prId) {
        await fetch("/api/payments/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pr_id: prId,
            secret_key: xenditData?.secretKey || undefined,
          }),
        });
      }
      if (db && invoiceData?.invoiceNumber) {
        await setDoc(doc(db, "transactions", invoiceData.invoiceNumber), { status: "CANCELLED", updatedAt: serverTimestamp() }, { merge: true });
      }
      setShowInvoiceModal(false);
      toast({
        title: "Tagihan Dibatalkan",
        description: "Transaksi pembayaran telah dibatalkan.",
      });
    } catch {
      setShowInvoiceModal(false);
    } finally {
      setIsCanceling(false);
    }
  };

  // Submit Order & Show Real Payment Invoice
  const handlePayNow = async () => {
    // 1. Verifikasi Status Login Pembeli
    if (!user) {
      toast({
        variant: "destructive",
        title: "Wajib Masuk Terlebih Dahulu 🔒",
        description: "Silakan masuk ke akun MarketPoint Anda untuk dapat melanjutkan pembayaran pesanan ini.",
      });
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!buyerName.trim()) {
      toast({
        variant: "destructive",
        title: "Nama Pembeli Wajib Diisi",
        description: "Silakan masukkan nama lengkap Anda untuk data pesanan."
      });
      return;
    }
    if (!buyerPhone.trim() && !buyerEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Kontak Wajib Diisi",
        description: "Mohon masukkan nomor WhatsApp atau email untuk pengiriman pesanan/lisensi."
      });
      return;
    }

    if (selectedMethod?.channelCode?.includes("OVO") && !buyerPhone.trim()) {
      toast({
        variant: "destructive",
        title: "Nomor WhatsApp/HP Wajib Diisi",
        description: "Metode OVO memerlukan nomor HP aktif untuk push notifikasi pembayaran."
      });
      return;
    }

    const isQris = selectedMethod?.id === "qris" || selectedMethod?.category === "QRIS" || selectedMethod?.channelCode === "QRIS";
    const minAmount = isQris
      ? 1
      : Number(selectedMethod?.minAmount || (selectedMethod?.category === "VIRTUAL_ACCOUNT" || selectedMethod?.category === "RETAIL_OUTLET" ? 10000 : 1000));

    if (grandTotal < minAmount) {
      toast({
        variant: "destructive",
        title: "Minimal Nominal Tidak Terpenuhi",
        description: `Minimal pembayaran untuk ${selectedMethod?.name || "metode ini"} adalah Rp ${minAmount.toLocaleString("id-ID")}.${!isQris ? " Silakan pilih metode QRIS (mulai Rp 1)." : ""}`
      });
      return;
    }

    setIsProcessing(true);

    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-MP-${Math.floor(100000 + Math.random() * 900000)}`;

      const methodType = getMethodType(selectedMethod?.category);

      // Panggil API pembuatan Payment Request Xendit yang sebenarnya!
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          external_id: invoiceNumber,
          amount: grandTotal,
          type: methodType,
          channel_code: selectedMethod?.channelCode || selectedMethod?.id,
          name: buyerName.trim(),
          payer_email: buyerEmail.trim(),
          mobile_number: buyerPhone.trim(),
          description: `Pembayaran ${product?.title || "Produk"} di MarketPoint (${invoiceNumber})`,
          secret_key: xenditData?.secretKey || undefined,
        }),
      });

      const payResult = await res.json();
      if (!payResult.success) {
        throw new Error(payResult.message || "Gagal membuat tagihan pembayaran di Xendit.");
      }

      const generatedCode =
        payResult.account_number ||
        payResult.payment_code ||
        payResult.qr_string ||
        "";

      let userOrderId = "";
      let shopOrderId = "";

      const orderPayload = {
        invoiceNumber,
        productId: product?.id || productId || "item-1",
        productTitle: product?.title || "Produk Marketplace",
        productImage: product?.images?.[0]?.imageUrl || "/assets/img/logo.png",
        variant: selectedVariant || null,
        unitPrice,
        quantity,
        itemsSubtotal,
        paymentFee,
        discount: appliedDiscount,
        voucherCode: appliedVoucher?.code || promoCode.trim().toUpperCase() || null,
        voucherDiscount: appliedDiscount || 0,
        isFlashSale: Boolean(activeFlashSale),
        flashSaleSessionId: activeFlashSale?.session?.id || null,
        flashSaleDiscount: activeFlashSale ? (activeFlashSale.originalPrice - activeFlashSale.discountPrice) * quantity : 0,
        totalAmount: grandTotal,
        paymentMethod: selectedMethod?.id || "qris",
        paymentMethodName: selectedMethod?.name || "QRIS",
        paymentCategory: selectedMethod?.category || "QRIS",
        channelCode: selectedMethod?.channelCode || "QRIS",
        paymentCode: generatedCode,
        pr_id: payResult.pr_id || null,
        payment_info: payResult,
        status: "PENDING",
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        notes: orderNotes.trim(),
        userId: user?.uid || "guest",
        createdAt: serverTimestamp(),
      };

      // Simpan riwayat transaksi pembeli di Firestore jika login
      if (db && user?.uid) {
        try {
          const userOrderRef = await addDoc(collection(db, "users", user.uid, "transactions"), orderPayload);
          userOrderId = userOrderRef.id;
        } catch (e) {
          console.warn("Could not write user transaction log:", e);
        }
      }

      // Simpan riwayat pesanan ke toko penjual agar tampil di /my-shop/orders
      const sId = product?.shopId || product?.shop_id;
      if (db && sId) {
        try {
          const shopOrderRef = await addDoc(collection(db, "shops", sId, "orders"), {
            ...orderPayload,
            buyer: buyerName.trim(),
            amount: grandTotal,
          });
          shopOrderId = shopOrderRef.id;
        } catch (e) {
          console.warn("Could not write shop order:", e);
        }
      }

      // Simpan catatan transaksi global
      if (db) {
        try {
          await setDoc(doc(db, "transactions", invoiceNumber), {
            ...orderPayload,
            userOrderId,
            shopOrderId,
          }, { merge: true });
        } catch (e) {
          console.warn("Could not write global transaction ledger:", e);
        }
      }

      // Update flash sale jika berlaku
      if (db && sId && activeFlashSale) {
        try {
          const shopRef = doc(db, "shops", sId);
          const sSnap = await getDoc(shopRef);
          if (sSnap.exists()) {
            const sData = sSnap.data();
            const flashSalesList = Array.isArray(sData?.flashSales) ? [...sData.flashSales] : [];
            const sIdx = flashSalesList.findIndex((s: any) => s.id === activeFlashSale.session.id);
            if (sIdx !== -1) {
              const pList = Array.isArray(flashSalesList[sIdx].products) ? [...flashSalesList[sIdx].products] : [];
              const pIdx = pList.findIndex((p: any) => String(p.productId) === String(product?.id || productId));
              if (pIdx !== -1) {
                pList[pIdx].sold = (Number(pList[pIdx].sold) || 0) + quantity;
                flashSalesList[sIdx].products = pList;
                await updateDoc(shopRef, sanitizeForFirestore({
                  flashSales: flashSalesList,
                  updatedAt: serverTimestamp(),
                }));
              }
            }
          }
        } catch (fsErr) {
          console.warn("Could not increment flash sale sold count in shop doc:", fsErr);
        }
      }

      // Update kuota voucher jika dipakai
      if (db && sId && appliedVoucher) {
        try {
          const shopRef = doc(db, "shops", sId);
          const sSnap = await getDoc(shopRef);
          if (sSnap.exists()) {
            const sData = sSnap.data();
            const vouchersList = Array.isArray(sData?.vouchers) ? [...sData.vouchers] : [];
            const idx = vouchersList.findIndex((v: any) => v.id === appliedVoucher.id || v.code === appliedVoucher.code);
            if (idx !== -1) {
              vouchersList[idx].used = (Number(vouchersList[idx].used) || 0) + 1;
              await updateDoc(shopRef, { vouchers: vouchersList, updatedAt: serverTimestamp() });
            }
          }
        } catch (vErr) {
          console.warn("Could not increment voucher in shop doc:", vErr);
        }

        if (appliedVoucher.id) {
          try {
            const vDocRef = doc(db, "shops", sId, "vouchers", appliedVoucher.id);
            await updateDoc(vDocRef, {
              used: (Number(appliedVoucher.used) || 0) + 1,
              updatedAt: serverTimestamp(),
            });
          } catch (vErr) {
            console.warn("Could not increment voucher used count in subcollection:", vErr);
          }
        }
      }

      setInvoiceData({
        ...orderPayload,
        userOrderId,
        shopOrderId,
        pr_id: payResult.pr_id,
        qr_string: payResult.qr_string,
        account_number: payResult.account_number,
        payment_code: payResult.payment_code,
        checkout_url: payResult.checkout_url,
        is_push_payment: payResult.is_push_payment,
      });
      setShowInvoiceModal(true);

      toast({
        title: "Tagihan Pembayaran Berhasil Dibuat! 💳",
        description: `Silakan selesaikan pembayaran sebelum batas waktu berakhir.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Membuat Pesanan",
        description: err.message || "Terjadi kesalahan sistem, silakan coba lagi."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || loading) {
    return <CheckoutLoadingSkeleton />;
  }

  const productImage = product?.images?.find((img: any) => img.isPrimary)?.imageUrl || product?.images?.[0]?.imageUrl || "https://picsum.photos/seed/placeholder/400/400";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-body text-[#212121]">
      {/* Top Checkout Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-xs">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Link href="/" className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/img/logo.png"
                alt="MarketPoint"
                className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
            <h1 className="text-sm md:text-base font-extrabold text-[#212121] hidden sm:block">
              Checkout Pembelian
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00AA5B] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-[#00AA5B]" />
            <span className="hidden sm:inline">100% Transaksi Aman & Terenkripsi</span>
            <span className="sm:hidden">Aman & Terenkripsi</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 max-w-screen-xl mx-auto px-4 py-6 md:py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: Order Details, Buyer Info & Payment Options (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: DATA PEMBELI & DETAIL PESANAN (DIGABUNG) */}
            <Card className="border-border bg-white rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00AA5B]" />
                  <h2 className="text-sm font-extrabold text-[#212121]">Data Pembeli & Detail Pesanan</h2>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground bg-white">
                  Instan / Digital
                </Badge>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Rincian Toko & Produk */}
                <div className="space-y-3 pb-5 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Thumbnail & Info Produk */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden border border-border/80 shrink-0">
                        <Image
                          src={productImage}
                          alt={product?.title || "Produk"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-[#212121] leading-snug line-clamp-2">
                          {product?.title}
                        </h3>
                        {selectedVariant && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#00AA5B] text-[10px] font-bold">
                            <span>Varian: {selectedVariant}</span>
                          </div>
                        )}
                        {activeFlashSale && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-extrabold border border-red-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/assets/icon/bolt.gif"
                              alt="Flash Sale"
                              className="w-3.5 h-3.5 object-contain shrink-0"
                            />
                            <span>Flash Sale Hemat {activeFlashSale.discountPercentage}%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className={cn("text-xs font-extrabold", activeFlashSale ? "text-red-600" : "text-[#00AA5B]")}>
                            Rp {unitPrice.toLocaleString("id-ID")}
                          </span>
                          {originalUnitPrice && originalUnitPrice > unitPrice && (
                            <span className="text-[10px] text-muted-foreground line-through opacity-60">
                              Rp {originalUnitPrice.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector (Tanpa Subtotal) */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-border/60 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                        className="h-7 w-7 rounded-lg text-slate-700 hover:bg-white disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-8 text-center text-xs font-extrabold text-[#212121]">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="h-7 w-7 rounded-lg text-slate-700 hover:bg-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Login Pengguna */}
                {!user ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 shadow-2xs">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-amber-950">Wajib Masuk Sebelum Melanjutkan</p>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          Masuk ke akun MarketPoint Anda agar transaksi tercatat aman dan lisensi produk dapat langsung diklaim.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout";
                        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                      }}
                      className="h-8 px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Masuk Sekarang
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between gap-2 text-emerald-900 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-[11px] font-bold text-emerald-950 truncate">
                          Masuk sebagai: <span className="font-black text-[#00AA5B]">{user.displayName || user.email}</span>
                        </p>
                        <p className="text-[10px] text-emerald-700 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 border-emerald-300 shrink-0">
                      Terverifikasi
                    </Badge>
                  </div>
                )}

                {/* Form Kontak & Data Pembeli */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#212121] flex items-center gap-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Contoh: Budi Santoso"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className="h-10 text-xs rounded-xl pl-9 bg-slate-50/50 focus:bg-white"
                        />
                        <User className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#212121] flex items-center gap-1">
                        Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="08123456789"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          className="h-10 text-xs rounded-xl pl-9 bg-slate-50/50 focus:bg-white"
                        />
                        <Phone className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#212121] flex items-center gap-1">
                      Alamat Email (Pengiriman Lisensi / Data Produk)
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="h-10 text-xs rounded-xl pl-9 bg-slate-50/50 focus:bg-white"
                      />
                      <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Bukti transaksi, kode lisensi atau invoice otomatis dikirimkan ke email ini.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: METODE PEMBAYARAN (ACCORDION STYLE) */}
            <Card className="border-border bg-white rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#00AA5B]" />
                  <h2 className="text-sm font-extrabold text-[#212121]">Pilih Metode Pembayaran</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                    <strong className="text-[#00AA5B]">{selectedMethod.name}</strong>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold text-[#00AA5B] bg-emerald-50 border-emerald-200">
                    Otomatis Terverifikasi
                  </Badge>
                </div>
              </div>

              <CardContent className="p-0">
                <Accordion type="single" collapsible defaultValue="qr_payments" className="w-full">
                  {paymentCategories.map((cat) => {
                    const hasSelectedMethod = cat.channels.some((m) => m.id === selectedMethod?.id);
                    const previewChannels = cat.channels.slice(0, 3);
                    const remainingCount = cat.channels.length - 3;

                    return (
                      <AccordionItem
                        key={cat.id}
                        value={cat.id}
                        className="border-b border-border/50 last:border-b-0"
                      >
                        <AccordionTrigger className="hover:no-underline py-4 sm:py-5 px-4 sm:px-6 w-full">
                          {/* Left: Icon & Title */}
                          <div className="flex items-center gap-3 min-w-0">
                            <cat.icon className="w-5 h-5 text-[#00AA5B] shrink-0" />
                            <span className="text-xs sm:text-sm font-black tracking-wider text-[#2E3137] uppercase">
                              {cat.label}
                            </span>
                            {hasSelectedMethod && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-[#00AA5B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Terpilih
                              </span>
                            )}
                          </div>

                          {/* Right: Logos Preview + Plus Count */}
                          <div className="flex items-center gap-2 sm:gap-2.5 mr-3 ml-auto">
                            {previewChannels.map((ch) => {
                              const meta = ADMIN_CHANNEL_METADATA[ch.id];
                              if (!meta?.logoUrl) return null;
                              return (
                                <img
                                  key={ch.id}
                                  src={meta.logoUrl}
                                  alt={ch.name}
                                  className="h-4 sm:h-5 max-w-[55px] sm:max-w-[70px] object-contain"
                                />
                              );
                            })}
                            {remainingCount > 0 && (
                              <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                                +{remainingCount}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>

                        {/* Expanded Payment Options */}
                        <AccordionContent className="px-4 sm:px-6 pb-4 pt-1 border-t border-slate-100/90 bg-slate-50/30">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {cat.channels.map((method) => {
                              const isSelected = selectedMethod?.id === method.id;
                              const meta = ADMIN_CHANNEL_METADATA[method.id];
                              const feeInfo = getFeeInfo(method);

                              return (
                                <div
                                  key={method.id}
                                  onClick={() => setSelectedMethodId(method.id)}
                                  className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none",
                                    isSelected
                                      ? "border-[#00AA5B] bg-[#00AA5B]/5 shadow-xs ring-1 ring-[#00AA5B]/20"
                                      : "border-border/70 hover:border-slate-300 bg-white hover:bg-slate-50/70"
                                  )}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-8 w-14 flex items-center justify-center shrink-0">
                                      {meta?.logoUrl ? (
                                        <img
                                          src={meta.logoUrl}
                                          alt={method.name}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                      ) : (
                                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <p className="text-xs font-bold text-[#212121] truncate">
                                        {method.name}
                                      </p>
                                      <p className="text-[10px] font-semibold text-muted-foreground">
                                        {feeInfo.feeAmount === 0 ? (
                                          <span className="text-[#00AA5B] font-bold">Bebas Biaya</span>
                                        ) : (
                                          `Biaya: ${feeInfo.feeText}`
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div
                                    className={cn(
                                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                      isSelected
                                        ? "border-[#00AA5B] bg-[#00AA5B]"
                                        : "border-slate-300"
                                    )}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Sticky Summary & Pay Button (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="border-border bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/60 bg-slate-50/50">
                <h2 className="text-sm font-extrabold text-[#212121]">Ringkasan Pembayaran</h2>
              </div>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Kode Promo Section */}
                <div className="space-y-2 pb-3.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#212121]">
                    <Tag className="w-3.5 h-3.5 text-[#00AA5B]" />
                    <span>Punya Kode Promo?</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="Masukkan kode promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="h-9 !text-[12px] rounded-xl bg-slate-50/70 focus:bg-white uppercase tracking-wider"
                    />
                    <Button
                      type="button"
                      disabled={checkingPromo || !promoCode.trim()}
                      onClick={handleApplyPromo}
                      className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shrink-0 disabled:opacity-50"
                    >
                      {checkingPromo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Terapkan"
                      )}
                    </Button>
                  </div>
                  {promoSuccessMsg && (
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#00AA5B] pt-0.5">
                      <p className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {promoSuccessMsg}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[10px] text-rose-500 hover:text-rose-600 hover:underline shrink-0 font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Total Harga ({quantity} Barang)</span>
                    <span className="font-bold text-[#212121]">Rp {itemsSubtotal.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Biaya Layanan ({selectedMethod.name.split(" ")[0]})</span>
                    <span className="font-bold text-[#212121]">
                      {paymentFee > 0 ? `Rp ${paymentFee.toLocaleString("id-ID")}` : "Gratis"}
                    </span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex items-center justify-between text-[#00AA5B] font-bold">
                      <span>Diskon Promo</span>
                      <span>- Rp {appliedDiscount.toLocaleString("id-ID")}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/80 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#212121]">Total Tagihan</p>
                      <p className="text-[10px] text-muted-foreground">Sudah termasuk PPN</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#00AA5B]">
                        Rp {grandTotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Pay Action */}
                <Button
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className={cn(
                    "w-full h-12 rounded-xl text-white font-extrabold text-sm gap-2 shadow-lg transition-transform active:scale-[0.98] mt-2 cursor-pointer",
                    !user
                      ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
                      : "bg-[#00AA5B] hover:bg-[#00AA5B]/90 shadow-[#00AA5B]/20"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                    </>
                  ) : !user ? (
                    <>
                      <LogIn className="w-4 h-4" /> Masuk untuk Bayar
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Bayar Sekarang
                    </>
                  )}
                </Button>

                {/* Secure Notice */}
                <div className="pt-3 border-t border-border/50 space-y-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00AA5B]" /> Pembayaran aman MarketPoint
                  </p>
                  <p className="text-[9px] text-muted-foreground/60">
                    Dengan membayar, Anda menyetujui Syarat & Ketentuan transaksi MarketPoint.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      {/* POPUP / MODAL INVOICE PEMBAYARAN */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent
          className="max-w-lg rounded-3xl p-0 overflow-hidden border-border [&>button]:text-white [&>button]:hover:text-white [&>button]:bg-white/20 [&>button]:hover:bg-white/30 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:top-5 [&>button]:right-5"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* DialogTitle tersembunyi untuk aksesibilitas screen reader */}
          <DialogTitle className="sr-only">Invoice Pembayaran</DialogTitle>
          {/* Header Modal */}
          <div className="bg-gradient-to-r from-emerald-600 to-[#00AA5B] p-6 text-white text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold mb-2 backdrop-blur-xs">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> Selesaikan dalam {formatTimer(timeLeft)}
            </div>
            <h2 className="text-xl font-black">Menunggu Pembayaran</h2>
            <p className="text-xs text-white/80 mt-1">
              Nomor Pesanan: {invoiceData?.invoiceNumber}
            </p>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Total Amount Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-border/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Tagihan</p>
                <p className="text-2xl font-black text-[#00AA5B]">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(grandTotal.toString(), "amount")}
                className="h-8 rounded-xl text-xs font-bold gap-1 border-border bg-white"
              >
                {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-[#00AA5B]" /> : <Copy className="w-3.5 h-3.5" />}
                Salin
              </Button>
            </div>

            {/* If QRIS */}
            {selectedMethod?.category === "QRIS" && (
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-white border border-border/80">
                <p className="text-xs font-bold text-[#212121]">Pindai Kode QRIS di Bawah Ini:</p>

                {/* QR Code Container */}
                <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                        invoiceData?.qr_string || invoiceData?.paymentCode || "https://marketpoint.id"
                      )}`}
                      alt="QRIS MarketPoint"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQR}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border hover:border-[#00AA5B] hover:text-[#00AA5B]"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh QRIS
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/payments/qris.png" alt="QRIS" className="h-5 w-auto object-contain" />
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Mendukung semua E-Wallet & Mobile Banking berstandar QRIS
                  </span>
                </div>
              </div>
            )}

            {/* If Virtual Account */}
            {selectedMethod?.category === "VIRTUAL_ACCOUNT" && (
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Nomor Virtual Account:
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.logoUrl || "/assets/payments/qris.png"}
                    alt={selectedMethod?.name}
                    className="h-5 w-auto object-contain"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-lg font-black tracking-wider text-[#212121]">
                    {invoiceData?.account_number || invoiceData?.paymentCode || "Membuat VA..."}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(invoiceData?.account_number || invoiceData?.paymentCode || "", "va")}
                    className="h-8 text-xs font-bold gap-1 text-[#00AA5B] hover:text-[#00AA5B]/80 hover:bg-emerald-50"
                  >
                    {copiedField === "va" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Salin Nomor
                  </Button>
                </div>
              </div>
            )}

            {/* If Retail Outlet */}
            {selectedMethod?.category === "RETAIL_OUTLET" && (
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Kode Pembayaran di Kasir:
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.logoUrl || "/assets/payments/alfamart.png"}
                    alt={selectedMethod?.name}
                    className="h-5 w-auto object-contain"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-lg font-black tracking-wider text-[#212121]">
                    {invoiceData?.payment_code || invoiceData?.paymentCode || "Membuat Kode..."}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(invoiceData?.payment_code || invoiceData?.paymentCode || "", "retail")}
                    className="h-8 text-xs font-bold gap-1 text-[#00AA5B] hover:text-[#00AA5B]/80 hover:bg-emerald-50"
                  >
                    {copiedField === "retail" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Salin Kode
                  </Button>
                </div>
              </div>
            )}

            {/* If E-Wallet */}
            {selectedMethod?.category === "EWALLET" && (
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Pembayaran E-Wallet: {selectedMethod?.name}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.logoUrl || "/assets/payments/ovo.png"}
                    alt={selectedMethod?.name}
                    className="h-5 w-auto object-contain"
                  />
                </div>

                {invoiceData?.is_push_payment ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 space-y-1.5">
                    <p className="text-xs font-bold flex items-center gap-1.5 text-amber-800">
                      <Smartphone className="w-4 h-4 text-amber-600 animate-bounce" />
                      Cek Aplikasi OVO di Ponsel Anda
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Notifikasi pembayaran telah dikirim ke nomor <strong>{invoiceData?.buyerPhone || buyerPhone}</strong>. Silakan buka notifikasi di aplikasi OVO dan setujui pembayaran dalam 60 detik.
                    </p>
                  </div>
                ) : invoiceData?.checkout_url ? (
                  <div className="space-y-2 pt-1">
                    <Button
                      asChild
                      className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 shadow-sm"
                    >
                      <a href={invoiceData.checkout_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Buka Aplikasi {selectedMethod?.name}
                      </a>
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      Klik tombol di atas untuk melanjutkan ke aplikasi {selectedMethod?.name}.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border text-center text-xs text-muted-foreground">
                    Menghubungkan ke layanan {selectedMethod?.name}...
                  </div>
                )}
              </div>
            )}

            {/* If PayLater */}
            {selectedMethod?.category === "PAYLATER" && (
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-border/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Cicilan PayLater: {selectedMethod?.name}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.logoUrl || "/assets/payments/akulaku.png"}
                    alt={selectedMethod?.name}
                    className="h-5 w-auto object-contain"
                  />
                </div>

                {invoiceData?.checkout_url ? (
                  <div className="space-y-2 pt-1">
                    <Button
                      asChild
                      className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 shadow-sm"
                    >
                      <a href={invoiceData.checkout_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" /> Lanjutkan ke {selectedMethod?.name}
                      </a>
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      Anda akan diarahkan ke halaman login dan konfirmasi cicilan Akulaku.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border text-center text-xs text-muted-foreground">
                    Menyiapkan sesi transaksi cicilan...
                  </div>
                )}
              </div>
            )}

            {/* Step-by-step instructions */}
            {ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.instructions && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-[#212121]">Tata Cara Pembayaran:</p>
                <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  {ADMIN_CHANNEL_METADATA[selectedMethod?.id || ""]?.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                onClick={() => handleCheckPaymentStatus(false)}
                disabled={isCheckingStatus}
                className="w-full h-11 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa Status Pembayaran...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" /> Cek Status Pembayaran
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    router.push("/wallet");
                  }}
                  className="h-10 rounded-xl border-border text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Bayar Nanti
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCancelPayment}
                  disabled={isCanceling}
                  className="h-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                >
                  {isCanceling ? "Membatalkan..." : "Batalkan Pesanan"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00AA5B] animate-spin mb-3" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Memuat Checkout...
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
