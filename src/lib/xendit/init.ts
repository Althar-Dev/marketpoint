/**
 * @fileOverview Inisialisasi Kredensial Xendit untuk MarketPointID.
 * File ini menyimpan konfigurasi dasar dan fungsi pembantu autentikasi.
 */

export const XENDIT_SECRET_KEY =
  process.env.XENDIT_SECRET_KEY || process.env.XENDIT || "";

/**
 * Helper untuk membuat header autentikasi Basic Auth Xendit.
 * Xendit menggunakan Secret Key sebagai username dan password dikosongkan.
 */
export function getXenditHeaders(customKey?: string) {
  const key = customKey || XENDIT_SECRET_KEY;
  if (!key) {
    console.warn("CRITICAL: XENDIT_SECRET_KEY is not defined in environment variables or configuration.");
  }

  const base64Key = Buffer.from(`${key}:`).toString("base64");
  return {
    Authorization: `Basic ${base64Key}`,
    "Content-Type": "application/json",
  };
}
