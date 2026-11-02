import { NextResponse } from "next/server";
import { getOrCreateUserApiKey, rotateUserApiKey } from "@/lib/database/api-key";
import { extractBearerToken, verifyFirebaseIdToken } from "@/lib/server-auth";
import { firebaseConfig } from "@/firebase/config";

export const dynamic = "force-dynamic";

async function isPlatformAdmin(uid: string): Promise<boolean> {
  const projectId = firebaseConfig.projectId || "marketpointid";
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return data.fields?.admin?.booleanValue === true;
    }
  } catch (_) {}
  return false;
}

/**
 * GET /api/reseller/api-key?userId=...
 * Fetch or provision the persistent API key for a reseller
 * Strictly authenticated: Only the key owner or platform admin can view it.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const token = extractBearerToken(req);
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    let authorizedUserId: string | null = null;

    if (isInternal) {
      authorizedUserId = requestedUserId;
    } else {
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Otentikasi diperlukan. Header Authorization: Bearer <TOKEN> wajib disertakan." },
          { status: 401 }
        );
      }

      const auth = await verifyFirebaseIdToken(token);
      if (!auth.valid || !auth.uid) {
        return NextResponse.json(
          { success: false, message: auth.error || "Token autentikasi tidak valid atau telah kedaluwarsa." },
          { status: 401 }
        );
      }

      // Check if user is asking for their own key or is platform admin
      if (requestedUserId && requestedUserId !== auth.uid) {
        const isAdmin = await isPlatformAdmin(auth.uid);
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, message: "Akses ditolak: Anda tidak memiliki izin untuk melihat API Key pengguna lain." },
            { status: 403 }
          );
        }
        authorizedUserId = requestedUserId;
      } else {
        authorizedUserId = auth.uid;
      }
    }

    if (!authorizedUserId) {
      return NextResponse.json(
        { success: false, message: "Parameter userId wajib disertakan." },
        { status: 400 }
      );
    }

    const keyRecord = await getOrCreateUserApiKey(authorizedUserId);

    return NextResponse.json({
      success: true,
      apiKey: keyRecord.apiKey,
      status: keyRecord.status,
      lastUsedAt: keyRecord.lastUsedAt,
      createdAt: keyRecord.createdAt,
    });
  } catch (error: any) {
    console.error("[API RESELLER KEY GET ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil API Key." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reseller/api-key
 * Rotate / regenerate the API key for a reseller
 * Strictly authenticated: Only the key owner or platform admin can rotate it.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId: requestedUserId } = body;

    const token = extractBearerToken(req);
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    let authorizedUserId: string | null = null;

    if (isInternal) {
      authorizedUserId = requestedUserId;
    } else {
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Otentikasi diperlukan. Header Authorization: Bearer <TOKEN> wajib disertakan." },
          { status: 401 }
        );
      }

      const auth = await verifyFirebaseIdToken(token);
      if (!auth.valid || !auth.uid) {
        return NextResponse.json(
          { success: false, message: auth.error || "Token autentikasi tidak valid atau telah kedaluwarsa." },
          { status: 401 }
        );
      }

      if (requestedUserId && requestedUserId !== auth.uid) {
        const isAdmin = await isPlatformAdmin(auth.uid);
        if (!isAdmin) {
          return NextResponse.json(
            { success: false, message: "Akses ditolak: Anda tidak memiliki izin untuk merotasi API Key pengguna lain." },
            { status: 403 }
          );
        }
        authorizedUserId = requestedUserId;
      } else {
        authorizedUserId = auth.uid;
      }
    }

    if (!authorizedUserId) {
      return NextResponse.json(
        { success: false, message: "userId wajib disertakan." },
        { status: 400 }
      );
    }

    const newKeyRecord = await rotateUserApiKey(authorizedUserId);

    return NextResponse.json({
      success: true,
      message: "API Key berhasil dirotasi secara instan.",
      apiKey: newKeyRecord.apiKey,
      status: newKeyRecord.status,
      createdAt: newKeyRecord.createdAt,
    });
  } catch (error: any) {
    console.error("[API RESELLER KEY ROTATE ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal merotasi API Key." },
      { status: 500 }
    );
  }
}
