export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
}

/**
 * Generate Authorization header for Xendit
 * Note: Key must be passed from client or fetched via secure method
 */
function getXenditAuthHeader(secretKey: string): string {
  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

/**
 * Test Xendit connection by fetching balance
 */
export async function testXenditConnection(secretKey: string): Promise<{ success: boolean; message: string; balance?: number }> {
  try {
    if (!secretKey) {
      return { success: false, message: "Secret Key tidak ditemukan." };
    }

    const authHeader = getXenditAuthHeader(secretKey);
    const response = await fetch("https://api.xendit.co/balance", {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      // Common error 403: Forbidden (Missing Permissions)
      if (response.status === 403) {
        return {
          success: false,
          message: "API Key tidak memiliki izin 'Balance'. Silakan aktifkan izin Balance (Read) di Dashboard Xendit.",
        };
      }
      return {
        success: false,
        message: errJson.message || `Xendit Error (${response.status}): Key tidak valid.`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "Koneksi Berhasil Terverifikasi!",
      balance: data.balance,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal terhubung ke Xendit API",
    };
  }
}

/**
 * Verify callback token (Placeholder for webhook implementation)
 */
export async function verifyXenditCallbackToken(tokenFromHeader: string): Promise<boolean> {
  // Logic to verify token against stored secret if needed
  return !!tokenFromHeader;
}
