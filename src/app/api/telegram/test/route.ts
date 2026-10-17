import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, chatId, shopName } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { success: false, error: "Token bot Telegram wajib diisi." },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // 1. Verify Bot Token with getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // timeout after 8s
      signal: AbortSignal.timeout(8000),
    });

    const getMeData = await getMeRes.json();

    if (!getMeRes.ok || !getMeData.ok) {
      const errMsg = getMeData.description || "Token bot tidak valid atau telah dicabut.";
      return NextResponse.json(
        {
          success: false,
          error: `Gagal verifikasi bot: ${errMsg}`,
        },
        { status: 400 }
      );
    }

    const botInfo = {
      id: getMeData.result.id,
      firstName: getMeData.result.first_name,
      username: getMeData.result.username,
    };

    // 2. If Chat ID is provided, send a formatted test message
    let messageSent = false;
    let messageError: string | null = null;

    if (chatId && typeof chatId === "string" && chatId.trim()) {
      const cleanChatId = chatId.trim();
      const currentShop = shopName || "MarketPointID Merchant";
      const now = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      });

      const messageText = `🔔 <b>Tes Koneksi Bot Toko MarketPointID</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>Status: Terhubung Berhasil!</b>\n🏪 Toko: <b>${currentShop}</b>\n🤖 Bot: <b>@${botInfo.username}</b>\n🕒 Waktu: <i>${now} WIB</i>\n━━━━━━━━━━━━━━━━━━━━\nNotifikasi transaksi Anda (pesanan baru, pembayaran, dan komplain) akan otomatis dikirimkan ke obrolan ini.`;

      try {
        const sendRes = await fetch(
          `https://api.telegram.org/bot${cleanToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text: messageText,
              parse_mode: "HTML",
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        const sendData = await sendRes.json();
        if (sendRes.ok && sendData.ok) {
          messageSent = true;
        } else {
          messageError =
            sendData.description ||
            "Gagal mengirim pesan ke Chat ID tersebut. Pastikan Anda sudah menekan /start pada bot di Telegram.";
        }
      } catch (sendErr: any) {
        messageError =
          sendErr.message || "Timeout saat mencoba mengirim pesan ke Telegram.";
      }
    }

    return NextResponse.json({
      success: true,
      bot: botInfo,
      messageSent,
      messageError,
    });
  } catch (error: any) {
    console.error("[Telegram Test API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Terjadi kesalahan saat menghubungi server Telegram.",
      },
      { status: 500 }
    );
  }
}
