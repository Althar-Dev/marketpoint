import { jsPDF } from "jspdf";
import { cleanPaymentMethodName, cleanProductTitle } from "@/lib/utils";

export interface TransactionInvoiceData {
  invoiceNumber: string;
  productTitle: string;
  variant?: string | null;
  unitPrice: number;
  quantity: number;
  itemsSubtotal: number;
  paymentFee: number;
  discount: number;
  voucherCode?: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodName?: string | null;
  paymentCategory?: string | null;
  channelCode?: string | null;
  status: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
  deliveredBy?: string | null;
  licenseKey?: string | null;
  licenseKeys?: string[];
  createdAt: string;
}

function formatRupiahPdf(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

function formatDatePdf(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Loads the MarketPointID official logo as a Base64 data URL
 */
async function loadLogoBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/assets/img/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * ============================================================================
 * 1. GENERATOR PDF KHUSUS ISI SALDO (TOP UP)
 * Desain struk mutasi finansial/dompet digital yang bersih, elegan, dan profesional.
 * ============================================================================
 */
async function generateTopUpPdf(tx: TransactionInvoiceData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [0, 170, 91] as const; // #00AA5B
  const darkColor = [30, 41, 59] as const; // Slate 800
  const grayColor = [100, 116, 139] as const; // Slate 500
  const lightBg = [248, 250, 252] as const; // Slate 50
  const borderLight = [226, 232, 240] as const; // Slate 200

  // 1. Top Decorative Accent Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 4, "F");

  // 2. Header
  const logoBase64 = await loadLogoBase64();
  let brandTextX = 15;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 15, 10, 14, 14);
      brandTextX = 32;
    } catch (e) {
      console.warn("Could not add logo to PDF:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("MarketPointID", brandTextX, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Layanan Dompet & Saldo Digital Resmi", brandTextX, 21.5);
  doc.text("support@marketpoint.id • marketpoint.id", brandTextX, 25.5);

  // Metadata di kanan atas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkColor);
  doc.text("Bukti Top Up Saldo", 195, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(`No. Referensi: ${tx.invoiceNumber}`, 195, 21, { align: "right" });
  doc.text(`Waktu: ${formatDatePdf(tx.createdAt)}`, 195, 25.5, { align: "right" });

  // 3. Hero Status & Nominal Box
  let y = 33;
  const isPaid = tx.status === "PAID" || tx.status === "SETTLED";

  if (isPaid) {
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(187, 247, 208); // Emerald 200
    doc.roundedRect(15, y, 180, 26, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("Pengisian Saldo Berhasil", 20, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.text(formatRupiahPdf(tx.totalAmount), 20, y + 14.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text("Saldo telah berhasil ditambahkan ke saldo dompet akun Anda.", 20, y + 20.5);
  } else {
    doc.setFillColor(254, 243, 199); // Amber 50
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(15, y, 180, 26, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`STATUS: ${tx.status === "PENDING" ? "MENUNGGU PEMBAYARAN" : tx.status}`, 20, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.text(formatRupiahPdf(tx.totalAmount), 20, y + 14.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text("Silakan selesaikan pembayaran sesuai instruksi metode yang dipilih.", 20, y + 20.5);
  }

  // 4. Section: Informasi Akun & Saluran Pembayaran (2 Kolom berdampingan)
  y = 66;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Rincian Transaksi Saldo", 15, y);

  const cardY = y + 2.5;
  const cardHeight = 28;
  const cardWidth = 88;

  // Sub-Card 1: Akun Dompet (Kiri)
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 2, 2, "FD");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(15, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Akun Penerima Saldo", 19, cardY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Nama Akun:", 19, cardY + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.buyerName || "Pelanggan Terdaftar", 37, cardY + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Email Akun:", 19, cardY + 17.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.buyerEmail || "-", 37, cardY + 17.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Jenis:", 19, cardY + 23.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text("Top Up Saldo Dompet", 37, cardY + 23.5);

  // Sub-Card 2: Detail Pembayaran (Kanan)
  const rightCardX = 107;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, "FD");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightCardX, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(rightCardX, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Metode Pembayaran", rightCardX + 4, cardY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Kanal:", rightCardX + 4, cardY + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(cleanPaymentMethodName(tx.paymentMethodName || tx.paymentMethod), rightCardX + 22, cardY + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Saluran:", rightCardX + 4, cardY + 17.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.channelCode || tx.paymentMethod || "QRIS", rightCardX + 22, cardY + 17.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Status:", rightCardX + 4, cardY + 23.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(isPaid ? 5 : 180, isPaid ? 150 : 83, isPaid ? 105 : 9);
  doc.text(isPaid ? "Lunas & Terverifikasi" : "Menunggu Pembayaran", rightCardX + 22, cardY + 23.5);

  // 5. Section: Tabel Rincian Biaya Saldo
  y = cardY + cardHeight + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Rincian Pengisian Saldo", 15, y);

  y += 2.5;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.rect(15, y, 180, 7.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Deskripsi Transaksi", 20, y + 5);
  doc.text("Jumlah", 190, y + 5, { align: "right" });

  // Baris 1: Nominal Top Up
  y += 7.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 10, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text("Nominal Pengisian Saldo Dompet Akun", 20, y + 6.5);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiahPdf(tx.itemsSubtotal || tx.totalAmount), 190, y + 6.5, { align: "right" });

  // Baris 2: Biaya Layanan
  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 10, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text("Biaya Layanan & Administrasi", 20, y + 6.5);
  doc.setFont("helvetica", "bold");
  doc.text(tx.paymentFee > 0 ? formatRupiahPdf(tx.paymentFee) : "Rp 0 (Gratis)", 190, y + 6.5, { align: "right" });

  // Baris 3: Total Pembayaran
  y += 10;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...primaryColor);
  doc.rect(15, y, 180, 12, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Total Pembayaran Top Up", 20, y + 7.5);

  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(formatRupiahPdf(tx.totalAmount), 190, y + 7.5, { align: "right" });

  // 6. Petunjuk & Informasi Penggunaan Saldo
  y += 18;
  doc.setDrawColor(...borderLight);
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, y, 180, 32, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text("Ketentuan & Informasi Saldo Dompet", 20, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  const infoLines = [
    "• Saldo yang telah berhasil diisi dapat langsung digunakan untuk pembelian semua produk di MarketPointID.",
    "• Riwayat mutasi saldo terperinci dapat dipantau secara real-time pada menu Saldo / Dompet Saya.",
    "• Pengisian saldo ini sah dan dijamin keamanannya oleh infrastruktur escrow MarketPointID.",
    "• Simpan dokumen ini sebagai tanda bukti pembayaran yang sah apabila sewaktu-waktu dibutuhkan konfirmasi.",
  ];
  let iY = y + 11.5;
  infoLines.forEach((line) => {
    doc.text(line, 20, iY);
    iY += 4.5;
  });

  // 7. Security Banner
  y += 38;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, y, 180, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text("Mutasi Saldo Resmi & Dilindungi Sistem MarketPointID", 20, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text(
    "Setiap penambahan saldo diverifikasi otomatis dan tercatat pada buku besar (ledger) dompet pengguna.",
    20,
    y + 8.5
  );

  // 8. Footer
  const footerY = 282;
  doc.setDrawColor(...borderLight);
  doc.line(15, footerY - 4, 195, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(
    "Dokumen bukti top up ini diterbitkan secara elektronik oleh MarketPointID dan sah tanpa tanda tangan basah.",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Waktu Cetak: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "medium" })} • Halaman 1 dari 1`,
    105,
    footerY + 3.8,
    { align: "center" }
  );

  doc.save(`MarketPointID-Bukti-TopUp-${tx.invoiceNumber}.pdf`);
}

/**
 * ============================================================================
 * 2. GENERATOR PDF KHUSUS BELANJA PRODUK DIGITAL
 * Memuat detail produk, lisensi & serial key resmi, serta petunjuk pengiriman.
 * ============================================================================
 */
async function generatePurchasePdf(tx: TransactionInvoiceData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [0, 170, 91] as const;
  const darkColor = [30, 41, 59] as const;
  const grayColor = [100, 116, 139] as const;
  const lightBg = [248, 250, 252] as const;
  const borderLight = [226, 232, 240] as const;

  // 1. Top Decorative Green Accent Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 4, "F");

  // 2. Header
  const logoBase64 = await loadLogoBase64();
  let brandTextX = 15;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 15, 10, 14, 14);
      brandTextX = 32;
    } catch (e) {
      console.warn("Could not add logo to PDF:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...primaryColor);
  doc.text("MarketPointID", brandTextX, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Platform Produk Digital Terpercaya", brandTextX, 21.5);
  doc.text("delivery@marketpoint.id • marketpoint.id", brandTextX, 25.5);

  // Metadata di kanan atas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkColor);
  doc.text("Bukti Transaksi Resmi", 195, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(`No. Invoice: ${tx.invoiceNumber}`, 195, 21, { align: "right" });
  doc.text(`Waktu: ${formatDatePdf(tx.createdAt)}`, 195, 25.5, { align: "right" });

  // 3. Status Bar
  let y = 32;
  const isPaid = tx.status === "PAID" || tx.status === "SETTLED";
  if (isPaid) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(15, y, 180, 10, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text("Status: Lunas / Selesai", 20, y + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text("Pesanan telah lunas & lisensi digital otomatis diterbitkan", 190, y + 6.5, { align: "right" });
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(15, y, 180, 10, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text(`Status: ${tx.status}`, 20, y + 6.5);
  }

  // Extract License Keys
  const rawLicense = tx.licenseKey || (tx.licenseKeys && tx.licenseKeys.length > 0 ? tx.licenseKeys.join("\n") : null);
  const keysList = tx.licenseKeys && tx.licenseKeys.length > 0
    ? tx.licenseKeys
    : rawLicense ? rawLicense.split("\n").filter(Boolean) : [];

  // 4. Section: Informasi Pembeli & Pembayaran
  y = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Informasi Pembeli & Pembayaran", 15, y);

  const cardY = y + 2.5;
  const cardHeight = 26;
  const cardWidth = 88;

  // Sub-Card 1: Detail Pembeli (Kiri)
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 2, 2, "FD");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(15, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Penerima Pesanan", 19, cardY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Nama:", 19, cardY + 11.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.buyerName || "Pelanggan Terdaftar", 33, cardY + 11.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Email:", 19, cardY + 16.8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.buyerEmail || "-", 33, cardY + 16.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Pengiriman:", 19, cardY + 22.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Otomatis via Email (Instan)", 36, cardY + 22.2);

  // Sub-Card 2: Detail Pembayaran (Kanan)
  const rightCardX = 107;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, "FD");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightCardX, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(rightCardX, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Rincian Pembayaran", rightCardX + 4, cardY + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Metode:", rightCardX + 4, cardY + 11.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(cleanPaymentMethodName(tx.paymentMethodName || tx.paymentMethod), rightCardX + 22, cardY + 11.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Saluran:", rightCardX + 4, cardY + 16.8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.channelCode || tx.paymentMethod || "QRIS", rightCardX + 22, cardY + 16.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Status:", rightCardX + 4, cardY + 22.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Lunas (Terverifikasi Escrow)", rightCardX + 22, cardY + 22.2);

  // 5. Section: Data Lisensi & Akses Produk (Hanya jika ada)
  y = cardY + cardHeight + 6;

  if (keysList.length > 0) {
    const boxHeight = Math.max(22, 14 + keysList.length * 8.5);
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(15, y, 180, boxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text("Data Lisensi & Serial Key Produk", 20, y + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text("Gunakan data serial / lisensi ini untuk aktivasi produk Anda:", 20, y + 11.2);

    let kY = y + 17.5;
    keysList.forEach((key) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(20, kY - 4.8, 170, 7.2, 1.5, 1.5, "FD");

      doc.setFont("courier", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...darkColor);
      doc.text(key.trim(), 23, kY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...primaryColor);
      doc.text("Tervalidasi Resmi", 186, kY, { align: "right" });

      kY += 8.5;
    });

    y += boxHeight + 7;
  } else {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderLight);
    doc.roundedRect(15, y, 180, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...darkColor);
    doc.text("Data Lisensi & Akses Produk", 20, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
      `Lisensi dikirimkan langsung ke email ${tx.buyerEmail || "pembeli"} oleh ${tx.deliveredBy || "delivery@marketpoint.id"}.`,
      20,
      y + 10
    );

    y += 18;
  }

  // 6. Section: Rincian Produk (Table)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Rincian Produk", 15, y);

  y += 2.5;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.rect(15, y, 180, 7.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("No", 20, y + 5);
  doc.text("Nama Produk & Varian", 33, y + 5);
  doc.text("Jumlah", 125, y + 5, { align: "center" });
  doc.text("Harga Satuan", 155, y + 5, { align: "right" });
  doc.text("Subtotal", 190, y + 5, { align: "right" });

  y += 7.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 14, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  doc.text("1", 20, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(cleanProductTitle(tx.productTitle).slice(0, 52), 33, y + 6);

  if (tx.variant) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...grayColor);
    doc.text(`Varian: ${tx.variant}`, 33, y + 10.5);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  doc.text(`${tx.quantity}x`, 125, y + 6, { align: "center" });
  doc.text(formatRupiahPdf(tx.unitPrice), 155, y + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(formatRupiahPdf(tx.itemsSubtotal || tx.totalAmount), 190, y + 6, { align: "right" });

  // 7. Section: Ringkasan Tagihan & Catatan Pengiriman
  y += 18;
  const summaryBoxX = 110;
  const summaryBoxWidth = 85;

  doc.setDrawColor(...borderLight);
  doc.setFillColor(...lightBg);
  doc.roundedRect(summaryBoxX, y, summaryBoxWidth, 44, 2, 2, "FD");

  let rY = y + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Subtotal Produk:", summaryBoxX + 5, rY);
  doc.setTextColor(...darkColor);
  doc.text(formatRupiahPdf(tx.itemsSubtotal || tx.totalAmount), summaryBoxX + summaryBoxWidth - 5, rY, { align: "right" });

  if (Number(tx.discount || 0) > 0) {
    rY += 5.5;
    doc.setTextColor(225, 29, 72);
    doc.text(`Diskon${tx.voucherCode ? ` (${tx.voucherCode})` : ""}:`, summaryBoxX + 5, rY);
    doc.text(`- ${formatRupiahPdf(tx.discount)}`, summaryBoxX + summaryBoxWidth - 5, rY, { align: "right" });
  }

  if (Number(tx.paymentFee || 0) > 0) {
    rY += 5.5;
    doc.setTextColor(...grayColor);
    doc.text("Biaya Layanan:", summaryBoxX + 5, rY);
    doc.setTextColor(...darkColor);
    doc.text(`+ ${formatRupiahPdf(tx.paymentFee)}`, summaryBoxX + summaryBoxWidth - 5, rY, { align: "right" });
  }

  rY += 3.5;
  doc.setDrawColor(...borderLight);
  doc.line(summaryBoxX + 5, rY, summaryBoxX + summaryBoxWidth - 5, rY);

  rY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text("Total Pembayaran:", summaryBoxX + 5, rY);

  doc.setFontSize(11.5);
  doc.setTextColor(...primaryColor);
  doc.text(formatRupiahPdf(tx.totalAmount), summaryBoxX + summaryBoxWidth - 5, rY, { align: "right" });

  rY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(`Metode: ${cleanPaymentMethodName(tx.paymentMethodName || tx.paymentMethod)}`, summaryBoxX + 5, rY);

  // Left Side: Notes & Instructions
  doc.setDrawColor(...borderLight);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, 90, 44, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text("Petunjuk Pengiriman Digital", 20, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  const noteLines = [
    "• Lisensi & file produk dikirimkan otomatis ke email Anda.",
    "• Periksa folder Kotak Masuk atau folder Spam pada email.",
    "• Simpan dokumen bukti transaksi ini untuk keperluan klaim,",
    "  bantuan teknis, serta garansi resmi MarketPointID.",
  ];
  let nY = y + 11.5;
  noteLines.forEach((line) => {
    doc.text(line, 20, nY);
    nY += 4;
  });

  if (tx.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Catatan Pembeli: "${tx.notes.slice(0, 48)}"`, 20, nY + 2);
  }

  // 8. Security Guarantee Banner
  y += 48;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, y, 180, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text("Transaksi Resmi & Dilindungi Sistem MarketPointID", 20, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text(
    "Setiap pembayaran diverifikasi secara otomatis dan tercatat aman dalam sistem basis data MarketPointID.",
    20,
    y + 8.5
  );

  // 9. Footer
  const footerY = 282;
  doc.setDrawColor(...borderLight);
  doc.line(15, footerY - 4, 195, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(
    "Dokumen ini diterbitkan secara otomatis oleh sistem MarketPointID dan merupakan bukti transaksi yang sah tanpa tanda tangan basah.",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Waktu Unduh: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "medium" })} • Halaman 1 dari 1`,
    105,
    footerY + 3.8,
    { align: "center" }
  );

  doc.save(`MarketPointID-Invoice-${tx.invoiceNumber}.pdf`);
}

/**
 * Main entry point: otomatis mendeteksi apakah transaksi adalah Top Up Saldo atau Belanja Produk.
 */
export async function generateTransactionPdf(tx: TransactionInvoiceData): Promise<void> {
  const isTopUp = Boolean(
    (tx.productTitle && tx.productTitle.toLowerCase().includes("top up")) ||
    (tx.invoiceNumber && tx.invoiceNumber.startsWith("TOPUP-")) ||
    (tx.paymentCategory === "TOPUP")
  );

  if (isTopUp) {
    return generateTopUpPdf(tx);
  } else {
    return generatePurchasePdf(tx);
  }
}
