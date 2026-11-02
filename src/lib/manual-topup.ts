/**
 * Configuration & Helpers for Manual Balance Top Up
 * MarketPointID
 */

export interface ManualPaymentChannel {
  id: string;
  category: "BANK" | "QRIS" | "EWALLET";
  name: string;
  label: string;
  accountName?: string;
  accountNumber?: string;
  logo: string;
  instructions: string[];
}

export const MANUAL_PAYMENT_CHANNELS: ManualPaymentChannel[] = [
  {
    id: "bca",
    category: "BANK",
    name: "Bank Central Asia (BCA)",
    label: "Transfer Bank BCA",
    logo: "/assets/bank/bca.png",
    instructions: [
      "Pilih metode Bank Central Asia (BCA).",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan memberikan nomor rekening resmi BCA dan rincian transfer.",
      "Kirimkan bukti transfer pada chat WhatsApp untuk verifikasi pengisian saldo instan."
    ]
  },
  {
    id: "mandiri",
    category: "BANK",
    name: "Bank Mandiri",
    label: "Transfer Bank Mandiri",
    logo: "/assets/bank/mandiri.png",
    instructions: [
      "Pilih metode Bank Mandiri.",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan memberikan nomor rekening resmi Mandiri.",
      "Kirimkan bukti transfer pada chat WhatsApp untuk diverifikasi."
    ]
  },
  {
    id: "bri",
    category: "BANK",
    name: "Bank Rakyat Indonesia (BRI)",
    label: "Transfer Bank BRI",
    logo: "/assets/bank/bri.png",
    instructions: [
      "Pilih metode Bank BRI.",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan memberikan nomor rekening resmi BRI.",
      "Kirimkan bukti transfer pada chat WhatsApp untuk diverifikasi."
    ]
  },
  {
    id: "seabank",
    category: "BANK",
    name: "SeaBank",
    label: "Transfer SeaBank",
    logo: "/assets/bank/seabank.png",
    instructions: [
      "Pilih metode SeaBank.",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan memberikan rekening resmi SeaBank.",
      "Kirimkan bukti transfer pada chat WhatsApp untuk diverifikasi."
    ]
  },
  {
    id: "qris",
    category: "QRIS",
    name: "QRIS (Semua Bank & E-Wallet)",
    label: "QRIS Instant",
    logo: "/assets/bank/qris.png",
    instructions: [
      "Pilih metode QRIS.",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan mengirimkan barcode QRIS resmi MarketPoint.",
      "Scan QRIS dengan aplikasi M-Banking atau E-Wallet pilihan Anda dan kirim buktinya."
    ]
  },
  {
    id: "dana",
    category: "EWALLET",
    name: "DANA E-Wallet",
    label: "Transfer DANA",
    logo: "/assets/bank/dana.png",
    instructions: [
      "Pilih metode DANA E-Wallet.",
      "Klik tombol 'Lanjut ke WhatsApp Admin'.",
      "Admin akan memberikan nomor akun DANA resmi.",
      "Kirimkan bukti transfer pada chat WhatsApp untuk diverifikasi."
    ]
  }
];

export const ADMIN_CONTACT = {
  phone: "6285658286012",
  displayPhone: "0856-5828-6012",
  name: "Admin Keuangan MarketPoint",
  workHours: "Setiap Hari (08.00 - 23.00 WIB)",
};

/**
 * Build pre-filled WhatsApp confirmation URL
 */
export function buildWhatsAppTopUpUrl(params: {
  invoiceNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  nominal: number;
  channelName: string;
}): string {
  const text = 
`Halo Admin MarketPoint, saya ingin konfirmasi Top Up Saldo Akun:

• No. Invoice: *${params.invoiceNumber}*
• ID Pengguna: *${params.userId}*
• Nama: *${params.userName || params.userEmail || "Pengguna MarketPoint"}*
• Nominal Top Up: *Rp ${params.nominal.toLocaleString("id-ID")}*
• Metode: *${params.channelName}*
• Waktu Pengajuan: *${new Date().toLocaleString("id-ID")}*

Mohon nomor rekening tujuan / QRIS resmi serta bantu proses pengisian saldo akun saya. Terima kasih!`;

  return `https://wa.me/${ADMIN_CONTACT.phone}?text=${encodeURIComponent(text)}`;
}
