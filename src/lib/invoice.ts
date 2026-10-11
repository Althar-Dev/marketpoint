/**
 * Helper untuk pembuatan ID Referensi / Nomor Invoice MarketPoint
 * Format yang diminta:
 * MPoint-[product_id]-[8-16 random alfanumerik jangan uppercase semua]
 * Contoh hasil: MPoint-product-test-1-k9Lx8Pm2Qz
 */

export function generateMPointInvoiceNumber(productId?: string, length = 10): string {
  // Pastikan panjang dalam rentang 8 - 16
  const targetLength = Math.min(16, Math.max(8, length));

  // Bersihkan ID produk agar aman dan valid untuk URL maupun database
  const rawId = (productId || "item").toString().trim();
  const cleanPid = rawId.replace(/[^a-zA-Z0-9_-]/g, "") || "item";

  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const allChars = lowers + uppers + digits;

  // Pastikan ada campuran huruf kecil, huruf besar, dan angka sehingga tidak pernah uppercase semua
  const chars: string[] = [
    lowers.charAt(Math.floor(Math.random() * lowers.length)),
    uppers.charAt(Math.floor(Math.random() * uppers.length)),
    digits.charAt(Math.floor(Math.random() * digits.length)),
    lowers.charAt(Math.floor(Math.random() * lowers.length)),
  ];

  // Lengkapi sisa karakter acak hingga targetLength (antara 8 dan 16)
  for (let i = chars.length; i < targetLength; i++) {
    chars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  // Fisher-Yates shuffle untuk mengacak posisi karakter
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const randomStr = chars.join("");
  return `MPoint-${cleanPid}-${randomStr}`;
}
