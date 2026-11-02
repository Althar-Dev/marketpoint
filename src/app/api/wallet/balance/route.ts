import { NextResponse } from "next/server";
import { getUserBalance, addUserBalance } from "@/lib/database/balance";
import { extractBearerToken, verifyFirebaseIdToken } from "@/lib/server-auth";
import { validateApiKey } from "@/lib/database/api-key";
import { firebaseConfig } from "@/firebase/config";

export const dynamic = "force-dynamic";

async function isPlatformAdmin(uid: string, token?: string): Promise<boolean> {
  const projectId = firebaseConfig.projectId || "marketpointid";
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers, cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return (
        data.fields?.admin?.booleanValue === true ||
        data.fields?.admin?.stringValue === "true" ||
        data.fields?.role?.stringValue === "admin" ||
        data.fields?.isAdmin?.booleanValue === true
      );
    }
  } catch (_) {}
  return false;
}

/**
 * GET /api/wallet/balance?userId=...
 * Fetch authoritative user balance from PostgreSQL ledger.
 * Accessible by:
 * - The authenticated user (via Bearer Firebase ID Token)
 * - Reseller using their API Key (Bearer mp_live_... or x-api-key)
 * - Platform Admin or Internal Secret
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    let authorizedUserId: string | null = null;

    if (isInternal) {
      authorizedUserId = requestedUserId;
    } else {
      const authHeader = req.headers.get("authorization") || "";
      const bearerVal = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
      const headerKey = req.headers.get("x-api-key") || req.headers.get("api-key");
      const rawApiKey = headerKey || (bearerVal && (bearerVal.startsWith("mp_") || bearerVal.startsWith("key_")) ? bearerVal : null);

      if (rawApiKey) {
        const keyAuth = await validateApiKey(rawApiKey);
        if (!keyAuth.valid || !keyAuth.userId) {
          return NextResponse.json(
            { success: false, message: "API Key tidak valid atau telah dinonaktifkan." },
            { status: 401 }
          );
        }
        authorizedUserId = keyAuth.userId;
      } else if (bearerVal) {
        const tokenAuth = await verifyFirebaseIdToken(bearerVal);
        if (!tokenAuth.valid || !tokenAuth.uid) {
          return NextResponse.json(
            { success: false, message: tokenAuth.error || "Token autentikasi tidak valid." },
            { status: 401 }
          );
        }

        if (requestedUserId && requestedUserId !== tokenAuth.uid) {
          const isAdmin = await isPlatformAdmin(tokenAuth.uid, bearerVal);
          if (!isAdmin) {
            return NextResponse.json(
              { success: false, message: "Akses ditolak: Anda tidak memiliki wewenang untuk memeriksa saldo pengguna lain." },
              { status: 403 }
            );
          }
          authorizedUserId = requestedUserId;
        } else {
          authorizedUserId = tokenAuth.uid;
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Otentikasi diperlukan. Sertakan header Authorization: Bearer <TOKEN> atau API Key." },
          { status: 401 }
        );
      }
    }

    if (!authorizedUserId) {
      return NextResponse.json(
        { success: false, message: "Parameter userId wajib disertakan." },
        { status: 400 }
      );
    }

    const balance = await getUserBalance(authorizedUserId);

    return NextResponse.json({
      success: true,
      userId: authorizedUserId,
      balance,
      currency: "IDR",
    });
  } catch (error: any) {
    console.error("[API WALLET BALANCE GET ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil saldo pengguna." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/balance
 * Deposit/credit balance into user's PostgreSQL ledger.
 * Strictly restricted to Platform Admin or Internal Secret (Webhooks).
 */
export async function POST(req: Request) {
  try {
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    if (!isInternal) {
      const token = extractBearerToken(req);
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Otentikasi admin diperlukan." },
          { status: 401 }
        );
      }

      const auth = await verifyFirebaseIdToken(token);
      if (!auth.valid || !auth.uid) {
        return NextResponse.json(
          { success: false, message: "Token autentikasi tidak valid." },
          { status: 401 }
        );
      }

      const isAdmin = await isPlatformAdmin(auth.uid, token);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak: Hanya administrator yang dapat menambahkan saldo manual." },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const { userId, amount } = body;

    if (!userId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Field 'userId' dan 'amount' (angka > 0) wajib disertakan." },
        { status: 400 }
      );
    }

    const newBalance = await addUserBalance(userId, amount);

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan saldo Rp ${amount.toLocaleString("id-ID")}.`,
      userId,
      balance: newBalance,
      currency: "IDR",
    });
  } catch (error: any) {
    console.error("[API WALLET BALANCE POST ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses penambahan saldo." },
      { status: 500 }
    );
  }
}
