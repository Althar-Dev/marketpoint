"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase";

export interface ShopBalanceData {
  shopId: string;
  activeBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  totalWithdrawn: number;
  bankInfo?: any;
  updatedAt: string;
}

export function useShopBalance(shopId: string | null | undefined) {
  const { user } = useUser();
  const [balance, setBalance] = useState<ShopBalanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    if (!user || !shopId) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const res = await fetch(`/api/shops/balance?shopId=${encodeURIComponent(shopId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.status === 403) {
        setIsAuthorized(false);
        setError(data.error || "Akses keuangan dibatasi untuk staf.");
        return;
      }

      if (data.success && data.balance) {
        setIsAuthorized(true);
        setBalance(data.balance);
      } else {
        setError(data.error || "Gagal memuat saldo toko.");
      }
    } catch (err: any) {
      console.warn("[USE_SHOP_BALANCE WARN]", err);
      setError(err?.message || "Kendala koneksi memuat saldo toko.");
    } finally {
      setLoading(false);
    }
  }, [user, shopId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    isAuthorized,
    refreshBalance: fetchBalance,
  };
}
