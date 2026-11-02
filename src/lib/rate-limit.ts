/**
 * High-performance In-Memory Sliding Window Rate Limiter
 * Automatically cleans up expired windows to prevent memory leaks
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit keys every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  intervalMs?: number; // Duration of window in ms (default: 60,000ms = 1 minute)
  maxRequests?: number; // Maximum allowed hits in interval (default: 60)
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const intervalMs = options.intervalMs || 60_000;
  const maxRequests = options.maxRequests || 60;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + intervalMs,
    };
    rateLimitMap.set(key, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: newRecord.resetAt,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);

  if (record.count > maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining,
    resetAt: record.resetAt,
  };
}

/**
 * Extract client IP address safely from Request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
