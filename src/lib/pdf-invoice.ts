import { jsPDF } from "jspdf";

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

export async function generateTransactionPdf(tx: TransactionInvoiceData): Promise<void> {
  // A4 size: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [0, 170, 91] as const; // #00AA5B (MarketPointID Green)
  const darkColor = [30, 41, 59] as const; // Slate 800
  const grayColor = [100, 116, 139] as const; // Slate 500
  const lightBg = [248, 250, 252] as const; // Slate 50
  const borderLight = [226, 232, 240] as const; // Slate 200

  // 1. Top Decorative Green Accent Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 4, "F");

  // 2. Header: Logo & Brand + Invoice Details
  const logoBase64 = await loadLogoBase64();
  let brandTextX = 15;

  if (logoBase64) {
    try {
      // Draw 14mm x 14mm logo
      doc.addImage(logoBase64, "PNG", 15, 10, 14, 14);
      brandTextX = 32;
    } catch (e) {
      console.warn("Could not add logo to PDF:", e);
    }
  }

  // Brand Name & Tagline (clean title case, no all-caps)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...primaryColor);
  doc.text("MarketPointID", brandTextX, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Platform Produk Digital Terpercaya", brandTextX, 21.5);
  doc.text("delivery@marketpoint.id • marketpoint.id", brandTextX, 25.5);

  // Document Title & Metadata on the Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkColor);
  doc.text("Bukti Transaksi Resmi", 195, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(`No. Invoice: ${tx.invoiceNumber}`, 195, 21, { align: "right" });
  doc.text(`Waktu Transaksi: ${formatDatePdf(tx.createdAt)}`, 195, 25.5, { align: "right" });

  // 3. Status Bar
  let y = 32;
  const isPaid = tx.status === "PAID" || tx.status === "SETTLED";
  if (isPaid) {
    doc.setFillColor(240, 253, 244); // Emerald 50
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

  // Extract License Keys early
  const rawLicense = tx.licenseKey || (tx.licenseKeys && tx.licenseKeys.length > 0 ? tx.licenseKeys.join("\n") : null);
  const keysList = tx.licenseKeys && tx.licenseKeys.length > 0
    ? tx.licenseKeys
    : rawLicense ? rawLicense.split("\n").filter(Boolean) : [];
  const primaryKey = keysList[0] || tx.licenseKey || "Terkirim ke Email";

  // 4. Section: Informasi Pembeli & Pembayaran
  y = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text("Informasi Pembeli & Pembayaran", 15, y);

  const cardY = y + 2.5;
  const cardHeight = 26;
  const cardWidth = 88;

  // --- Sub-Card 1: Detail Pembeli (Kiri) ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 2, 2, "FD");

  // Header Bar Kiri
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(15, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(15, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Penerima Pesanan", 19, cardY + 4.2);

  // Content Kiri
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

  // --- Sub-Card 2: Detail Pembayaran & Transaksi (Kanan) ---
  const rightCardX = 107;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 2, 2, "FD");

  // Header Bar Kanan
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(rightCardX, cardY, cardWidth, 6, 2, 2, "F");
  doc.rect(rightCardX, cardY + 3.5, cardWidth, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Rincian Pembayaran", rightCardX + 4, cardY + 4.2);

  // Content Kanan
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text("Metode:", rightCardX + 4, cardY + 11.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(tx.paymentMethodName || tx.paymentCategory || "QRIS", rightCardX + 22, cardY + 11.2);

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

  // 5. Section: Data Lisensi & Akses Produk (Dynamic Y)
  y = cardY + cardHeight + 6;

  if (keysList.length > 0) {
    const boxHeight = Math.max(22, 14 + keysList.length * 8.5);
    doc.setFillColor(240, 253, 244); // Emerald 50
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
      // Small pill box for key
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
    // If license key not generated yet
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

  // Table Header
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

  // Table Row
  y += 7.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 14, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  doc.text("1", 20, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(tx.productTitle.slice(0, 52), 33, y + 6);

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

  // Right Side: Summary Box
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

  // Divider inside summary
  rY += 3.5;
  doc.setDrawColor(...borderLight);
  doc.line(summaryBoxX + 5, rY, summaryBoxX + summaryBoxWidth - 5, rY);

  // Total Row
  rY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text("Total Pembayaran:", summaryBoxX + 5, rY);

  doc.setFontSize(11.5);
  doc.setTextColor(...primaryColor);
  doc.text(formatRupiahPdf(tx.totalAmount), summaryBoxX + summaryBoxWidth - 5, rY, { align: "right" });

  // Payment Method Row
  rY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(`Metode: ${tx.paymentMethodName || tx.paymentMethod || "QRIS"}`, summaryBoxX + 5, rY);

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

  // Trigger direct download in browser
  doc.save(`MarketPointID-Bukti-Transaksi-${tx.invoiceNumber}.pdf`);
}
