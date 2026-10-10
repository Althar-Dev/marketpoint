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
    ]
  );

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchantShop() {
  const context = useContext(MerchantContext);
  return context;
}
