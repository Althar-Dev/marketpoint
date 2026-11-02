"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/firebase";

export function useUserBalance() {
  const { user } = useUser();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(user.uid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && typeof data.balance === "number") {
        setBalance(data.balance);
      }
    } catch (err: any) {
      console.warn("[USE_USER_BALANCE WARN]", err);
      setError(err?.message || "Gagal memuat saldo.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refreshBalance: fetchBalance };
}
