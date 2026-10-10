export interface FlashSaleProductItem {
  productId: string;
  title: string;
  imageUrl?: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  quota: number;
  sold: number;
}

export interface FlashSaleSession {
  id: string;
  name: string;
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string;   // YYYY-MM-DDTHH:mm
  status: "ACTIVE" | "INACTIVE";
  products: FlashSaleProductItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface ActiveFlashSaleInfo {
  session: FlashSaleSession;
  item: FlashSaleProductItem;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  quota: number;
  sold: number;
  remainingQuota: number;
  endTimeMs: number;
  startTimeMs: number;
  isOngoing: boolean;
  isUpcoming: boolean;
}

/**
 * Check if a product is part of an ongoing active flash sale session in the shop.
 */
export function getProductActiveFlashSale(
  productId: string,
  flashSales?: FlashSaleSession[] | null,
  nowMs: number = Date.now()
): ActiveFlashSaleInfo | null {
  if (!flashSales || !Array.isArray(flashSales) || !productId) return null;

  for (const session of flashSales) {
    if (session.status !== "ACTIVE") continue;

    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();

    if (nowMs >= startMs && nowMs <= endMs) {
      const item = session.products?.find((p) => String(p.productId) === String(productId));
      if (item) {
        const quota = Number(item.quota || 0);
        const sold = Number(item.sold || 0);
        const remainingQuota = Math.max(0, quota - sold);

        if (remainingQuota > 0) {
          return {
            session,
            item,
            originalPrice: Number(item.originalPrice || 0),
            discountPrice: Number(item.discountPrice || 0),
            discountPercentage: Number(item.discountPercentage || 0),
            quota,
            sold,
            remainingQuota,
            endTimeMs: endMs,
            startTimeMs: startMs,
            isOngoing: true,
            isUpcoming: false,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if a product is part of an upcoming flash sale session in the shop.
 */
export function getProductUpcomingFlashSale(
  productId: string,
  flashSales?: FlashSaleSession[] | null,
  nowMs: number = Date.now()
): ActiveFlashSaleInfo | null {
  if (!flashSales || !Array.isArray(flashSales) || !productId) return null;

  for (const session of flashSales) {
    if (session.status !== "ACTIVE") continue;

    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(session.endTime).getTime();

    if (nowMs < startMs) {
      const item = session.products?.find((p) => String(p.productId) === String(productId));
      if (item) {
        const quota = Number(item.quota || 0);
        const sold = Number(item.sold || 0);
        const remainingQuota = Math.max(0, quota - sold);

        return {
          session,
          item,
          originalPrice: Number(item.originalPrice || 0),
          discountPrice: Number(item.discountPrice || 0),
          discountPercentage: Number(item.discountPercentage || 0),
          quota,
          sold,
          remainingQuota,
          endTimeMs: endMs,
          startTimeMs: startMs,
          isOngoing: false,
          isUpcoming: true,
        };
      }
    }
  }

  return null;
}

/**
 * Format duration remaining in seconds into HH:MM:SS or DDh HHm.
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}h ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Sanitizes object by converting undefined to null for safe Firestore updates.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}
