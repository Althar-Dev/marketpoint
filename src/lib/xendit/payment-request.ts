/**
 * @fileOverview Library untuk berinteraksi dengan Xendit Payment Requests API (v3).
 * Sesuai dengan spesifikasi Xendit & implementasi di STSPay.
 */

import { getXenditHeaders } from "./init";

export type PaymentMethodType =
  | "VIRTUAL_ACCOUNT"
  | "QR_CODE"
  | "EWALLET"
  | "OVER_THE_COUNTER"
  | "CARD"
  | "DIRECT_DEBIT"
  | "PAYLATER";

export type EWalletChannel =
  | "OVO"
  | "DANA"
  | "SHOPEEPAY"
  | "LINKAJA"
  | "ASTRAPAY"
  | "JENIUSPAY";

export type VAChannel =
  | "BCA"
  | "BNI"
  | "BRI"
  | "MANDIRI"
  | "PERMATA"
  | "BSI"
  | "CIMB"
  | "SAHABAT_SAMPOERNA"
  | "BJB";

export type RetailChannel = "ALFAMART" | "INDOMARET";
export type PaylaterChannel = "AKULAKU" | "KREDIVO";

export interface CreatePaymentRequestInput {
  reference_id: string;
  amount: number;
  currency: "IDR";
  country?: "ID";
  description?: string;
  payment_method: {
    type: PaymentMethodType;
    reusability: "ONE_TIME_USE" | "MULTIPLE_USE";
    virtual_account?: {
      channel_code: VAChannel;
      channel_properties: {
        customer_name: string;
        expires_at?: string;
      };
    };
    qr_code?: {
      channel_code?: "QRIS";
      channel_properties?: {
        expires_at?: string;
      };
    };
    ewallet?: {
      channel_code: EWalletChannel;
      channel_properties: {
        success_return_url?: string;
        mobile_number?: string;
      };
    };
    over_the_counter?: {
      channel_code: RetailChannel;
      channel_properties: {
        customer_name: string;
        expires_at?: string;
      };
    };
    paylater?: {
      channel_code: PaylaterChannel;
    };
  };
  metadata?: Record<string, any>;
}

/**
 * Buat Payment Request Baru di Xendit (V3)
 */
export async function createXenditPaymentRequest(
  input: CreatePaymentRequestInput,
  secretKey?: string
) {
  const url = "https://api.xendit.co/payment_requests";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getXenditHeaders(secretKey),
      body: JSON.stringify({
        ...input,
        country: input.country || "ID",
      }),
      signal: AbortSignal.timeout(20000),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Xendit Error (${response.status})`);
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Xendit Create PR Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Cek Status Payment Request di Xendit (V3)
 */
export async function getXenditPaymentRequest(id: string, secretKey?: string) {
  const url = `https://api.xendit.co/payment_requests/${id}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getXenditHeaders(secretKey),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal mendapatkan data status.");
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Xendit Get PR Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Batalkan / Matikan Payment Request (Expire)
 */
export async function expireXenditPaymentRequest(id: string, secretKey?: string) {
  const url = `https://api.xendit.co/payment_requests/${id}/expire`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getXenditHeaders(secretKey),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json();

    // Jika PR tidak ditemukan (404), anggap sudah expired — lanjutkan saja
    if (response.status === 404) {
      console.warn(`[Xendit] PR ${id} tidak ditemukan (mungkin sudah expired). Anggap berhasil dibatalkan.`);
      return { success: true, data: null };
    }

    if (!response.ok) {
      throw new Error(result.message || "Gagal membatalkan transaksi di Xendit.");
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Xendit Expire PR Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Normalisasi VA Bank Code untuk Xendit
 */
function normalizeVaChannel(code: string): VAChannel {
  const c = code.toUpperCase();
  if (c === "BSS") return "SAHABAT_SAMPOERNA";
  return c as VAChannel;
}

/**
 * Helper Service untuk menghasilkan data pembayaran asli dari Xendit (V3)
 * Diadaptasi dari implementasi STSPay.
 */
export async function requestXenditPayment(
  type: "qris" | "va" | "ewallet" | "retail" | "paylater",
  data: {
    external_id: string;
    amount: number;
    bank_code?: string;
    channel_code?: string;
    name?: string;
    mobile_number?: string;
    payer_email?: string;
    description?: string;
    return_url?: string;
    secret_key?: string;
  }
) {
  try {
    const rawCode = (data.channel_code || data.bank_code || "").toUpperCase();
    const isAkulaku = rawCode === "AKULAKU" || type === "paylater";

    const methodType: PaymentMethodType =
      type === "qris"
        ? "QR_CODE"
        : type === "va"
        ? "VIRTUAL_ACCOUNT"
        : type === "retail"
        ? "OVER_THE_COUNTER"
        : isAkulaku
        ? "PAYLATER"
        : "EWALLET";

    const payload: CreatePaymentRequestInput = {
      reference_id: data.external_id,
      amount: Math.round(data.amount),
      currency: "IDR",
      country: "ID",
      description:
        data.description || `Pembayaran MarketPoint ${data.external_id}`,
      payment_method: {
        type: methodType,
        reusability: "ONE_TIME_USE",
      },
    };

    if (type === "va") {
      const vaChannel = normalizeVaChannel(rawCode);
      payload.payment_method.virtual_account = {
        channel_code: vaChannel,
        channel_properties: {
          customer_name: data.name || "MarketPoint Customer",
        },
      };
    } else if (type === "qris") {
      payload.payment_method.qr_code = {
        channel_code: "QRIS",
        channel_properties: {},
      };
    } else if (isAkulaku) {
      payload.payment_method.paylater = {
        channel_code: "AKULAKU",
      };
    } else if (type === "ewallet") {
      const ewalletChannel = rawCode as EWalletChannel;
      payload.payment_method.ewallet = {
        channel_code: ewalletChannel,
        channel_properties: {
          success_return_url:
            data.return_url ||
            `${process.env.NEXT_PUBLIC_APP_URL || "https://marketpoint.id"}/checkout`,
        },
      };

      if (rawCode.includes("OVO") && data.mobile_number) {
        const cleaned = data.mobile_number.replace(/\D/g, "");
        const formattedMobile = cleaned.startsWith("62")
          ? `+${cleaned}`
          : cleaned.startsWith("0")
          ? `+62${cleaned.substring(1)}`
          : `+62${cleaned}`;
        payload.payment_method.ewallet.channel_properties.mobile_number =
          formattedMobile;
      }
    } else if (type === "retail") {
      payload.payment_method.over_the_counter = {
        channel_code: rawCode as RetailChannel,
        channel_properties: {
          customer_name: data.name || "MarketPoint Customer",
        },
      };
    }

    const res = await createXenditPaymentRequest(payload, data.secret_key);

    if (res.success && res.data) {
      const pr = res.data;
      const pm = pr.payment_method || {};

      if (type === "qris") {
        return {
          success: true,
          type: "qris",
          qr_string: pm.qr_code?.channel_properties?.qr_string,
          qr_id: pm.qr_code?.id,
          pr_id: pr.id,
          status: pr.status,
          provider: "Xendit",
          raw_response: pr,
        };
      } else if (type === "va") {
        return {
          success: true,
          type: "va",
          account_number:
            pm.virtual_account?.channel_properties?.virtual_account_number,
          bank_code: pm.virtual_account?.channel_code || rawCode,
          va_id: pm.virtual_account?.id,
          pr_id: pr.id,
          status: pr.status,
          provider: "Xendit",
          raw_response: pr,
        };
      } else if (type === "ewallet" || isAkulaku) {
        const checkoutAction = pr.actions?.find(
          (a: any) =>
            a.action === "MOBILE_DEEPLINK" ||
            a.action === "WEB_CHECKOUT" ||
            a.action === "AUTH"
        );
        return {
          success: true,
          type: isAkulaku ? "paylater" : "ewallet",
          checkout_url: checkoutAction?.url || null,
          channel_code: pm.ewallet?.channel_code || pm.paylater?.channel_code || rawCode,
          is_push_payment: Boolean(
            (pm.ewallet?.channel_code || rawCode).includes("OVO")
          ),
          pr_id: pr.id,
          status: pr.status,
          provider: "Xendit",
          raw_response: pr,
        };
      } else if (type === "retail") {
        return {
          success: true,
          type: "retail",
          payment_code:
            pm.over_the_counter?.channel_properties?.payment_code,
          bank_code: pm.over_the_counter?.channel_code || rawCode,
          fpc_id: pm.over_the_counter?.id,
          pr_id: pr.id,
          status: pr.status,
          provider: "Xendit",
          raw_response: pr,
        };
      }
    }

    throw new Error(
      res.message || "Gagal mendapatkan respon pembayaran valid dari Xendit."
    );
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
