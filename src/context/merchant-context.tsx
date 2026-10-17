"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useUser, useFirestore } from "@/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

export interface StaffPermissions {
  finance: boolean;
  products: boolean;
  chat: boolean;
}

export interface AvailableShop {
  shopId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  role: "OWNER" | "CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS";
  roleLabel: string;
  isOwner: boolean;
  permissions: StaffPermissions;
  shopData: any;
}

export type ShopPlanTier = "admin" | "free" | "plus" | "pro" | "prime";

export interface EffectiveFeatures {
  planId: string;
  planName: string;
  maxProducts: number;
  maxVouchers: number;
  maxFlashSaleProducts: number;
  voucherToko: boolean;
  flashSale: boolean;
  telegramBot: boolean;
  hasAdvancedStats: boolean;
  has30DaysStats: boolean;
  hasAllTimeStats: boolean;
  commissionRate: number;
}

export const DEFAULT_EFFECTIVE_FEATURES: EffectiveFeatures = {
  planId: "free",
  planName: "Free",
  maxProducts: 5,
  maxVouchers: 0,
  maxFlashSaleProducts: 0,
  voucherToko: false,
  flashSale: false,
  telegramBot: false,
  hasAdvancedStats: false,
  has30DaysStats: false,
  hasAllTimeStats: false,
  commissionRate: 7.0,
};

export interface MerchantContextValue {
  shopId: string | null;
  shop: any | null;
  loading: boolean;
  isOwner: boolean;
  isStaff: boolean;
  staffRole: "CO_OWNER" | "KEUANGAN" | "PRODUK" | "CS" | "OWNER" | null;
  staffRoleLabel: string | null;
  staffPermissions: StaffPermissions | null;
  availableShops: AvailableShop[];
  switchShop: (targetShopId: string) => Promise<void>;
  refreshShop: () => Promise<void>;
  isAdmin: boolean;
  isFullAdminUnlock: boolean;
  activePlanId: ShopPlanTier;
  switchShopPlan: (targetPlan: ShopPlanTier) => Promise<void>;
  effectiveFeatures: EffectiveFeatures;
}

const MerchantContext = createContext<MerchantContextValue>({
  shopId: null,
  shop: null,
  loading: true,
  isOwner: false,
  isStaff: false,
  staffRole: null,
  staffRoleLabel: null,
  staffPermissions: null,
  availableShops: [],
  switchShop: async () => {},
  refreshShop: async () => {},
  isAdmin: false,
  isFullAdminUnlock: false,
  activePlanId: "free",
  switchShopPlan: async () => {},
  effectiveFeatures: DEFAULT_EFFECTIVE_FEATURES,
});

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const isResolvingRef = React.useRef(false);

  const [shopId, setShopId] = useState<string | null>(null);
  const [shop, setShop] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<any | null>(null);
  const [staffRoleLabel, setStaffRoleLabel] = useState<string | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions | null>(null);
  const [availableShops, setAvailableShops] = useState<AvailableShop[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin & Real Subscription State
  const [isAdmin, setIsAdmin] = useState(false);
  const [actualSubscription, setActualSubscription] = useState<any>(null);
  const [plansList, setPlansList] = useState<any[]>([]);

  // Function to actually switch the shop plan in PostgreSQL database
  const switchShopPlan = useCallback(
    async (targetPlan: ShopPlanTier) => {
      const targetId = shopId || user?.uid;
      if (!targetId) return;

      try {
        const res = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: targetId,
            planId: targetPlan,
            billingCycle: "monthly",
          }),
        });
        const data = await res.json();
        if (data.success && data.subscription) {
          setActualSubscription(data.subscription);
        }

        if (db) {
          const isVerified = targetPlan === "pro" || targetPlan === "prime" || targetPlan === "admin";
          const isOfficial = targetPlan === "prime" || targetPlan === "admin";
          updateDoc(doc(db, "shops", targetId), {
            verified: isVerified,
            isVerified: isVerified,
            official: isOfficial,
            isOfficial: isOfficial,
            "subscription.planId": targetPlan,
            "subscription.planName": data?.subscription?.planName || (targetPlan === "prime" ? "Prime" : targetPlan === "pro" ? "Pro" : targetPlan === "plus" ? "Plus" : targetPlan === "admin" ? "Admin Full Unlock" : "Free"),
            "subscription.status": "ACTIVE",
          }).catch((err) => console.warn("Failed to sync plan badges to Firestore:", err));
        }
      } catch (err) {
        console.error("Gagal mengubah paket toko di database:", err);
      }
    },
    [shopId, user?.uid, db]
  );

  // Listen to user document for admin: true
  useEffect(() => {
    if (!user || !db) {
      setIsAdmin(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const uData = snap.data();
          setIsAdmin(uData?.admin === true);
        } else {
          setIsAdmin(false);
        }
      },
      (err) => {
        console.warn("Error listening to user admin status:", err);
      }
    );
    return () => unsub();
  }, [user, db]);

  // Load shop subscription & available plans for dynamic limit resolution
  useEffect(() => {
    const targetId = shopId || user?.uid;
    if (!targetId) return;
    fetch(`/api/subscription?shopId=${encodeURIComponent(targetId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setActualSubscription(data.subscription);
          if (Array.isArray(data.plans)) {
            setPlansList(data.plans);
          }
        }
      })
      .catch((e) => console.warn("Error fetching merchant subscription context:", e));
  }, [shopId, user?.uid]);

  // Auto-sync Firestore verified & official fields with active plan in PostgreSQL
  useEffect(() => {
    if (!db || !user || !actualSubscription?.planId) return;
    const targetId = shopId || user.uid;
    const currentPlan = actualSubscription.planId;
    const isVerified = currentPlan === "pro" || currentPlan === "prime" || currentPlan === "admin";
    const isOfficial = currentPlan === "prime" || currentPlan === "admin";

    if (
      shop &&
      (Boolean(shop.verified) !== isVerified ||
       Boolean(shop.isVerified) !== isVerified ||
       Boolean(shop.official) !== isOfficial ||
       Boolean(shop.isOfficial) !== isOfficial)
    ) {
      updateDoc(doc(db, "shops", targetId), {
        verified: isVerified,
        isVerified: isVerified,
        official: isOfficial,
        isOfficial: isOfficial,
        "subscription.planId": currentPlan,
        "subscription.planName": actualSubscription.planName || (currentPlan === "prime" ? "Prime" : currentPlan === "pro" ? "Pro" : currentPlan === "plus" ? "Plus" : currentPlan === "admin" ? "Admin Full Unlock" : "Free"),
        "subscription.status": "ACTIVE",
      }).catch((err) => console.warn("Auto-sync shop badges to Firestore warning:", err));
    }
  }, [db, user, shopId, shop, actualSubscription]);

  const resolveMerchant = useCallback(
    async (overrideShopId?: string) => {
      if (!user || !db) {
        setShopId(null);
        setShop(null);
        setIsOwner(false);
        setIsStaff(false);
        setStaffRole(null);
        setStaffRoleLabel(null);
        setStaffPermissions(null);
        setAvailableShops([]);
        setLoading(false);
        return;
      }

      if (isResolvingRef.current) return;
      isResolvingRef.current = true;

      try {
        const foundShops: AvailableShop[] = [];

        // 1. Check if user is the OWNER of their own shop (shops/{user.uid})
        try {
          const ownerShopRef = doc(db, "shops", user.uid);
          const ownerShopSnap = await getDoc(ownerShopRef);
          if (ownerShopSnap.exists()) {
            const oData = ownerShopSnap.data();
            foundShops.push({
              shopId: user.uid,
              name: oData.name || oData.shopName || "Toko Saya",
              slug: oData.slug || user.uid,
              logoUrl: oData.logoUrl || oData.logo || "",
              role: "OWNER",
              roleLabel: "Pemilik Toko",
              isOwner: true,
              permissions: { finance: true, products: true, chat: true },
              shopData: oData,
            });
          }
        } catch (ownerErr) {
          console.warn("Error checking owner shop:", ownerErr);
        }

        // 2. Check user profile for activeShopId preference
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        // 3. Scan all shops for active staff membership (admins subcollection)
        try {
          const uEmail = user.email ? user.email.toLowerCase().trim() : "";
          const allShopsSnap = await getDocs(collection(db, "shops"));

          for (const sDoc of allShopsSnap.docs) {
            const sData = sDoc.data();

            // 3a. Check if this shop is owned by the user
            const isOwnerOfThisShop =
              sDoc.id === user.uid ||
              sData.ownerId === user.uid ||
              sData.userId === user.uid ||
              (userData?.shopId && sDoc.id === userData.shopId) ||
              (userData?.shopSlug && sData.slug === userData.shopSlug);

            if (isOwnerOfThisShop) {
              if (!foundShops.some((s) => s.shopId === sDoc.id)) {
                foundShops.push({
                  shopId: sDoc.id,
                  name: sData.name || sData.shopName || "Toko Saya",
                  slug: sData.slug || sDoc.id,
                  logoUrl: sData.logoUrl || sData.logo || "",
                  role: "OWNER",
                  roleLabel: "Pemilik Toko",
                  isOwner: true,
                  permissions: { finance: true, products: true, chat: true },
                  shopData: sData,
                });
              }
              continue;
            }

            // 3b. Scan admins subcollection for staff membership
            try {
              const adminsCol = collection(db, "shops", sDoc.id, "admins");
              const adminsSnap = await getDocs(adminsCol);

              for (const aDoc of adminsSnap.docs) {
                const aData = aDoc.data();
                const aEmail = aData.email ? String(aData.email).toLowerCase().trim() : "";
                const matchesUser = aData.userId === user.uid || (uEmail && aEmail === uEmail);

                if (matchesUser && aData.status === "ACTIVE") {
                  const isCoOwner = aData.role === "CO_OWNER";
                  const roleLabel =
                    aData.roleLabel ||
                    (isCoOwner
                      ? "Co Owner"
                      : aData.role === "KEUANGAN"
                      ? "Admin Keuangan"
                      : aData.role === "CS"
                      ? "Customer Service"
                      : "Admin Produk");

                  // Auto-link userId to admin record if missing
                  if (!aData.userId && user.uid) {
                    updateDoc(aDoc.ref, { userId: user.uid, updatedAt: serverTimestamp() }).catch(() => {});
                  }

                  if (!foundShops.some((s) => s.shopId === sDoc.id)) {
                    foundShops.push({
                      shopId: sDoc.id,
                      name: sData.name || sData.shopName || "Toko Mitra",
                      slug: sData.slug || sDoc.id,
                      logoUrl: sData.logoUrl || sData.logo || "",
                      role: aData.role || "PRODUK",
                      roleLabel,
                      isOwner: false,
                      permissions: {
                        finance: isCoOwner || !!aData.permissions?.finance,
                        products: isCoOwner || !!aData.permissions?.products,
                        chat: isCoOwner || !!aData.permissions?.chat,
                      },
                      shopData: sData,
                    });
                  }
                  break;
                }
              }
            } catch (shopAdminErr) {
              console.warn(`Error scanning admins for shop ${sDoc.id}:`, shopAdminErr);
            }
          }
        } catch (shopsErr) {
          console.warn("Could not scan shops for staff membership:", shopsErr);
        }

        setAvailableShops(foundShops);

        // 4. If user has no shops at all
        if (foundShops.length === 0) {
          if (userData?.hasShop || userData?.staffShopId || userData?.activeShopId) {
            updateDoc(userRef, {
              hasShop: false,
              isStaff: false,
              staffShopId: null,
              activeShopId: null,
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }
          setShopId(null);
          setShop(null);
          setIsOwner(false);
          setIsStaff(false);
          setStaffRole(null);
          setStaffRoleLabel(null);
          setStaffPermissions(null);
          setLoading(false);
          return;
        }

        // 5. Determine active shop based on priority
        let storedPreferredId: string | null = null;
        if (typeof window !== "undefined") {
          storedPreferredId = localStorage.getItem("active_merchant_shop_id");
        }

        const candidateId =
          overrideShopId ||
          storedPreferredId ||
          userData?.activeShopId ||
          userData?.staffShopId ||
          foundShops.find((s) => s.isOwner)?.shopId ||
          foundShops[0].shopId;

        const activeItem = foundShops.find((s) => s.shopId === candidateId) || foundShops[0];

        setShopId(activeItem.shopId);
        setShop(activeItem.shopData);
        setIsOwner(activeItem.isOwner);
        setIsStaff(!activeItem.isOwner);
        setStaffRole(activeItem.role);
        setStaffRoleLabel(activeItem.roleLabel);
        setStaffPermissions(activeItem.permissions);

        if (typeof window !== "undefined") {
          localStorage.setItem("active_merchant_shop_id", activeItem.shopId);
        }
      } catch (err) {
        console.error("Error resolving merchant shops:", err);
      } finally {
        isResolvingRef.current = false;
        setLoading(false);
      }
    },
    [user, db]
  );

  const switchShop = useCallback(
    async (targetShopId: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("active_merchant_shop_id", targetShopId);
      }
      if (user && db) {
        updateDoc(doc(db, "users", user.uid), {
          activeShopId: targetShopId,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
      await resolveMerchant(targetShopId);
    },
    [user, db, resolveMerchant]
  );

  useEffect(() => {
    if (!authLoading && user) {
      resolveMerchant();
    }
  }, [authLoading, user, resolveMerchant]);

  // Real-time listener: sync automatically when the user's personal shop changes
  useEffect(() => {
    if (!user || !db) return;

    const unsubOwnerShop = onSnapshot(doc(db, "shops", user.uid), () => {
      resolveMerchant();
    });

    return () => {
      unsubOwnerShop();
    };
  }, [user, db, resolveMerchant]);

  const rawPlanId = actualSubscription?.planId;
  const isFullAdminUnlock = isAdmin && (!rawPlanId || rawPlanId === "admin");
  const activePlanId = (rawPlanId || (isAdmin ? "admin" : "free")) as ShopPlanTier;

  const effectiveFeatures = useMemo<EffectiveFeatures>(() => {
    if (activePlanId === "admin" || (isAdmin && !rawPlanId)) {
      return {
        planId: "admin",
        planName: "Admin Full Unlock",
        maxProducts: -1,
        maxVouchers: -1,
        maxFlashSaleProducts: -1,
        voucherToko: true,
        flashSale: true,
        telegramBot: true,
        hasAdvancedStats: true,
        has30DaysStats: true,
        hasAllTimeStats: true,
        commissionRate: 0.0,
      };
    }

    const targetPlanConfig = plansList.find((p) => p.id === activePlanId);
    const isPrime = activePlanId === "prime";
    const isPro = activePlanId === "pro";
    const isPlus = activePlanId === "plus";
    const isFree = activePlanId === "free";

    const maxProducts = typeof targetPlanConfig?.maxProducts === "number"
      ? targetPlanConfig.maxProducts
      : (typeof actualSubscription?.maxProducts === "number" ? actualSubscription.maxProducts : (isPrime ? -1 : isPro ? 40 : isPlus ? 15 : 5));

    const maxVouchers = typeof targetPlanConfig?.maxVouchers === "number"
      ? targetPlanConfig.maxVouchers
      : (isPrime ? 15 : isPro ? 5 : isPlus ? 2 : 0);

    const maxFlashSaleProducts = typeof targetPlanConfig?.maxFlashSaleProducts === "number"
      ? targetPlanConfig.maxFlashSaleProducts
      : (isPrime ? 10 : isPro ? 3 : isPlus ? 1 : 0);

    const voucherToko = targetPlanConfig?.features?.voucherToko ?? (!isFree && maxVouchers > 0);
    const flashSale = targetPlanConfig?.features?.flashSale ?? (!isFree && maxFlashSaleProducts > 0);
    const telegramBot = targetPlanConfig?.features?.telegramBot ?? (isPro || isPrime);
    const has30DaysStats = isPro || isPrime;
    const hasAllTimeStats = isPrime;
    const hasAdvancedStats = isPro || isPrime;
    const commissionRate = typeof targetPlanConfig?.commissionRate === "number"
      ? targetPlanConfig.commissionRate
      : (actualSubscription?.commissionRate ?? (isPrime ? 2.0 : isPro ? 3.5 : isPlus ? 5.0 : 7.0));

    return {
      planId: activePlanId,
      planName: targetPlanConfig?.name || actualSubscription?.planName || (isPrime ? "Prime" : isPro ? "Pro" : isPlus ? "Plus" : "Free"),
      maxProducts,
      maxVouchers,
      maxFlashSaleProducts,
      voucherToko,
      flashSale,
      telegramBot,
      hasAdvancedStats,
      has30DaysStats,
      hasAllTimeStats,
      commissionRate,
    };
  }, [isAdmin, rawPlanId, activePlanId, actualSubscription, plansList]);

  const value = useMemo(
    () => ({
      shopId,
      shop,
      loading: authLoading || loading,
      isOwner,
      isStaff,
      staffRole,
      staffRoleLabel,
      staffPermissions,
      availableShops,
      switchShop,
      refreshShop: async () => {
        await resolveMerchant();
      },
      isAdmin,
      isFullAdminUnlock,
      activePlanId,
      switchShopPlan,
      effectiveFeatures,
    }),
    [
      shopId,
      shop,
      authLoading,
      loading,
      isOwner,
      isStaff,
      staffRole,
      staffRoleLabel,
      staffPermissions,
      availableShops,
      switchShop,
      resolveMerchant,
      isAdmin,
      isFullAdminUnlock,
      activePlanId,
      switchShopPlan,
      effectiveFeatures,
    ]
  );

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchantShop() {
  const context = useContext(MerchantContext);
  return context;
}
