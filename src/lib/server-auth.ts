import { firebaseConfig } from "@/firebase/config";

interface TokenVerificationResult {
  valid: boolean;
  uid?: string;
  email?: string;
  isAdmin?: boolean;
  error?: string;
}

interface ShopAuthResult {
  authorized: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  role?: string;
  permissions?: {
    products?: boolean;
    finance?: boolean;
    chat?: boolean;
  };
  reason?: string;
}

// In-memory token cache (token -> { result, expiresAt })
const tokenCache = new Map<string, { result: TokenVerificationResult; expiresAt: number }>();

/**
 * Verify Firebase Auth ID Token using Google Identity Toolkit REST API
 * Works server-side in Next.js without requiring a service account file
 */
export async function verifyFirebaseIdToken(
  token: string
): Promise<TokenVerificationResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token tidak disediakan." };
  }

  const cleanToken = token.trim();

  // Check cache
  const cached = tokenCache.get(cleanToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  try {
    const apiKey = firebaseConfig.apiKey;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: cleanToken }),
    });

    if (!res.ok) {
      return { valid: false, error: "Token autentikasi tidak valid atau sudah kedaluwarsa." };
    }

    const data = await res.json();
    const user = data.users?.[0];

    if (!user || !user.localId) {
      return { valid: false, error: "Identitas pengguna tidak ditemukan." };
    }

    let isCustomClaimAdmin = false;
    if (user.customAttributes) {
      try {
        const claims = JSON.parse(user.customAttributes);
        if (claims.admin === true || claims.role === "admin") {
          isCustomClaimAdmin = true;
        }
      } catch (_) {}
    }

    const verification: TokenVerificationResult = {
      valid: true,
      uid: user.localId,
      email: user.email,
      isAdmin: isCustomClaimAdmin,
    };

    // Cache valid token for 5 minutes
    tokenCache.set(cleanToken, {
      result: verification,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return verification;
  } catch (err: any) {
    console.error("[SERVER AUTH VERIFY ERROR]", err);
    return { valid: false, error: err.message || "Gagal memverifikasi token pengguna." };
  }
}

/**
 * Extract Bearer token from standard Request Authorization header
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Verify whether a user (by verified UID) has permission to manage a given shop
 */
export async function verifyShopAuthorization(
  uid: string,
  shopId: string,
  requiredPermission?: "products" | "finance" | "chat",
  token?: string
): Promise<ShopAuthResult> {
  if (!uid || !shopId) {
    return {
      authorized: false,
      isOwner: false,
      isAdmin: false,
      isStaff: false,
      reason: "UID dan ShopId wajib disediakan.",
    };
  }

  // 1. Direct Owner Check (Zero Network Overhead O(1))
  if (uid === shopId) {
    return {
      authorized: true,
      isOwner: true,
      isAdmin: false,
      isStaff: false,
      permissions: { products: true, finance: true, chat: true },
    };
  }

  const projectId = firebaseConfig.projectId || "marketpointid";

  // 2. Platform Admin Check via Firestore REST
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const userRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      { headers, cache: "no-store" }
    );
    if (userRes.ok) {
      const userData = await userRes.json();
      const isAdmin =
        userData.fields?.admin?.booleanValue === true ||
        userData.fields?.admin?.stringValue === "true" ||
        userData.fields?.role?.stringValue === "admin" ||
        userData.fields?.isAdmin?.booleanValue === true;
      if (isAdmin) {
        return {
          authorized: true,
          isOwner: false,
          isAdmin: true,
          isStaff: false,
          permissions: { products: true, finance: true, chat: true },
        };
      }
    }
  } catch (userErr) {
    console.warn("[CHECK ADMIN REST WARN]", userErr);
  }

  // 3. Shop Staff / Co-Owner Check
  try {
    const adminsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shops/${shopId}/admins`;
    const adminsRes = await fetch(adminsUrl, { cache: "no-store" });

    if (adminsRes.ok) {
      const data = await adminsRes.json();
      const docs = data.documents || [];

      for (const doc of docs) {
        const fields = doc.fields || {};
        const staffUserId = fields.userId?.stringValue;
        const status = fields.status?.stringValue || "PENDING";

        if (staffUserId === uid && status === "ACTIVE") {
          const role = fields.role?.stringValue || "PRODUK";
          const isCoOwner = role === "CO_OWNER";

          // Extract permissions map
          const permFields = fields.permissions?.mapValue?.fields || {};
          const permissions = {
            products: isCoOwner || permFields.products?.booleanValue === true || role === "PRODUK",
            finance: isCoOwner || permFields.finance?.booleanValue === true || role === "KEUANGAN",
            chat: isCoOwner || permFields.chat?.booleanValue === true || role === "CS",
          };

          if (requiredPermission && !permissions[requiredPermission]) {
            return {
              authorized: false,
              isOwner: false,
              isAdmin: false,
              isStaff: true,
              role,
              permissions,
              reason: `Staf tidak memiliki izin '${requiredPermission}' untuk toko ini.`,
            };
          }

          return {
            authorized: true,
            isOwner: false,
            isAdmin: false,
            isStaff: true,
            role,
            permissions,
          };
        }
      }
    }
  } catch (staffErr) {
    console.warn("[CHECK STAFF REST WARN]", staffErr);
  }

  return {
    authorized: false,
    isOwner: false,
    isAdmin: false,
    isStaff: false,
    reason: "Anda tidak memiliki hak akses untuk mengelola toko ini.",
  };
}

/**
 * Verify whether an incoming Request is authenticated and authorized as Platform Administrator
 */
export async function verifyAdminRequest(
  req: Request
): Promise<{ authorized: boolean; uid?: string; email?: string; error?: string }> {
  // 1. Check internal secret header
  const internalSecret = req.headers.get("x-internal-secret");
  if (process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET) {
    return { authorized: true };
  }

  // 2. Check Bearer token
  const token = extractBearerToken(req);
  if (!token) {
    return {
      authorized: false,
      error: "Otentikasi admin diperlukan. Header Authorization: Bearer <TOKEN> tidak ditemukan.",
    };
  }

  const auth = await verifyFirebaseIdToken(token);
  if (!auth.valid || !auth.uid) {
    return {
      authorized: false,
      error: auth.error || "Token autentikasi tidak valid atau telah kedaluwarsa.",
    };
  }

  // If token has admin custom claim, authorize immediately
  if (auth.isAdmin) {
    return { authorized: true, uid: auth.uid, email: auth.email };
  }

  // 3. Verify user has admin flag in Firestore
  const projectId = firebaseConfig.projectId || "marketpointid";
  try {
    // Attempt with Bearer token
    let userRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${auth.uid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    // Fallback without header if needed
    if (!userRes.ok) {
      userRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${auth.uid}`,
        { cache: "no-store" }
      );
    }

    if (userRes.ok) {
      const userData = await userRes.json();
      const isAdmin =
        userData.fields?.admin?.booleanValue === true ||
        userData.fields?.admin?.stringValue === "true" ||
        userData.fields?.role?.stringValue === "admin" ||
        userData.fields?.isAdmin?.booleanValue === true;

      if (isAdmin) {
        return { authorized: true, uid: auth.uid, email: auth.email };
      }
    }
  } catch (err) {
    console.warn("[VERIFY ADMIN ERROR]", err);
  }

  return {
    authorized: false,
    error: "Akses ditolak: Akun Anda tidak memiliki hak akses administrator platform.",
  };
}
