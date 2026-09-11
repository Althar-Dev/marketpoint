import crypto from "crypto";
import { getPlatformSettings } from "./database/settings";

export interface DigiFlazzDepositBalanceResponse {
  data?: {
    deposit: number;
  };
  rc?: string;
  message?: string;
}

export interface DigiFlazzPriceListItem {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

function generateDigiFlazzSignature(username: string, apiKey: string, suffix: string): string {
  return crypto
    .createHash("md5")
    .update(`${username}${apiKey}${suffix}`)
    .digest("hex");
}

export async function checkDigiFlazzBalance(customConfig?: { username: string; apiKey: string }): Promise<{
  success: boolean;
  message: string;
  deposit?: number;
}> {
  try {
    let username = customConfig?.username;
    let apiKey = customConfig?.apiKey;

    if (!username || !apiKey) {
      const settings = await getPlatformSettings();
      username = settings.digiflazz.username;
      apiKey = settings.digiflazz.apiKey;
    }

    if (!username || !apiKey) {
      return {
        success: false,
        message: "Username dan API Key DigiFlazz belum dikonfigurasi.",
      };
    }

    const sign = generateDigiFlazzSignature(username, apiKey, "depo");

    const response = await fetch("https://api.digiflazz.com/v1/cek-saldo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmd: "deposit",
        username,
        sign,
      }),
    });

    const result = await response.json();

    if (result.data && typeof result.data.deposit === "number") {
      return {
        success: true,
        message: "Berhasil mengambil saldo DigiFlazz",
        deposit: result.data.deposit,
      };
    } else {
      return {
        success: false,
        message: result.message || result.rc || "Gagal cek saldo DigiFlazz",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal menghubungi DigiFlazz API",
    };
  }
}

export async function getDigiFlazzPriceList(): Promise<DigiFlazzPriceListItem[]> {
  const settings = await getPlatformSettings();
  const { username, apiKey } = settings.digiflazz;

  if (!username || !apiKey) {
    throw new Error("Username dan API Key DigiFlazz belum diatur.");
  }

  const sign = generateDigiFlazzSignature(username, apiKey, "pricelist");

  const response = await fetch("https://api.digiflazz.com/v1/price-list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cmd: "prepaid",
      username,
      sign,
    }),
  });

  const result = await response.json();
  if (result.data && Array.isArray(result.data)) {
    return result.data;
  }
  return [];
}

export async function createDigiFlazzTopup(sku: string, customerNo: string, refId: string) {
  const settings = await getPlatformSettings();
  const { username, apiKey, mode } = settings.digiflazz;

  if (!username || !apiKey) {
    throw new Error("Username dan API Key DigiFlazz belum diatur.");
  }

  const sign = generateDigiFlazzSignature(username, apiKey, refId);

  const body = {
    username,
    buyer_sku_code: sku,
    customer_no: customerNo,
    ref_id: refId,
    sign,
    testing: mode === "development",
  };

  const response = await fetch("https://api.digiflazz.com/v1/transaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await response.json();
}
