import { getPlatformSettings } from "./database/settings";

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

async function getXenditAuthHeader(customSecretKey?: string): Promise<string> {
  let key = customSecretKey;
  if (!key) {
    const settings = await getPlatformSettings();
    key = settings.xendit.secretKey;
  }
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export async function testXenditConnection(customSecretKey?: string): Promise<{ success: boolean; message: string; balance?: number }> {
  try {
    const authHeader = await getXenditAuthHeader(customSecretKey);
    const response = await fetch("https://api.xendit.co/balance", {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errJson.message || `Xendit HTTP ${response.status}: Key API tidak valid atau tidak memiliki akses balance.`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: "Koneksi Xendit Berhasil!",
      balance: data.balance,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal terhubung ke server Xendit API",
    };
  }
}

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoiceResponse> {
  const authHeader = await getXenditAuthHeader();
  const body = {
    external_id: params.externalId,
    amount: params.amount,
    payer_email: params.payerEmail,
    description: params.description,
    success_redirect_url: params.successRedirectUrl,
    failure_redirect_url: params.failureRedirectUrl,
  };

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Gagal membuat invoice Xendit (${response.status})`);
  }

  return await response.json();
}

export async function verifyXenditCallbackToken(tokenFromHeader: string): Promise<boolean> {
  const settings = await getPlatformSettings();
  if (!settings.xendit.webhookToken) {
    return true; // Jika belum dikonfigurasi, skip dulu atau sesuaikan
  }
  return tokenFromHeader === settings.xendit.webhookToken;
}
