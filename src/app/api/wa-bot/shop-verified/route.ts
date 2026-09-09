import { NextResponse } from "next/server";
import { sendWAMessage, sendShopAnnouncementMessage, formatPhoneNumber } from "@/wa-bot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, shopName, slug, city, province, logoUrl, bannerUrl, description } = body;

    if (!phone || !shopName || !slug) {
      return NextResponse.json(
        { success: false, error: "Parameter phone, shopName, dan slug wajib diisi." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const locationText = [city, province].filter(Boolean).join(", ") || "Indonesia";

    const messageText =
      `🎉 *Selamat! Toko Anda Terverifikasi*\n\n` +
      `Halo *${shopName}*, pendaftaran toko Anda di MarketPoint telah berhasil dan nomor WhatsApp Anda telah terverifikasi resmi.\n\n` +
      `📋 *Detail Toko Terdaftar:*\n` +
      `• *Nama Toko:* ${shopName}\n` +
      `• *URL Toko:* marketpoint.id/${slug}\n` +
      `• *Nomor WhatsApp:* +${formattedPhone}\n` +
      `• *Lokasi Toko:* ${locationText}\n` +
      `• *Waktu Verifikasi:* ${formattedDate} WIB\n\n` +
      `🚀 *Langkah Selanjutnya:*\n` +
      `Toko Anda kini telah aktif! Silakan buka Dashboard Seller Anda di website MarketPoint untuk mulai menambah produk digital dan mengelola penjualan.\n\n` +
      `Salam hangat,\n` +
      `*Tim MarketPoint Indonesia* 🛍️`;

    // 1. Send personal notification to shop owner
    const result = await sendWAMessage(formattedPhone, messageText);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // 2. Broadcast announcement message to Community / Groups
    sendShopAnnouncementMessage({
      shopName,
      slug,
      city,
      province,
      logoUrl,
      bannerUrl,
      description,
    }).catch((announcementErr) => {
      console.error("[SHOP ANNOUNCEMENT BROADCAST ERROR]", announcementErr);
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi verifikasi toko dan pengumuman komunitas berhasil dikirim.",
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("[WA BOT SHOP VERIFIED NOTIFY ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengirim notifikasi toko terverifikasi." },
      { status: 500 }
    );
  }
}
