import { NextResponse } from "next/server";
import { generateOTP, sendOTPMessage, sendCommunityInviteMessage, formatPhoneNumber, checkIsCommunityMember, WA_CONFIG } from "@/wa-bot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    // 1. Check if user is a member of the WhatsApp Community
    if (WA_CONFIG.CHECK_COMMUNITY) {
      try {
        const memberCheck = await checkIsCommunityMember(formattedPhone);
        if (!memberCheck.isMember) {
          // Send WhatsApp invite message directly to user's WhatsApp number
          sendCommunityInviteMessage(formattedPhone, memberCheck.communityLink).catch((invErr) => {
            console.error("[WA COMMUNITY INVITE ERROR]", invErr);
          });

          return NextResponse.json(
            {
              success: false,
              requiresCommunityJoin: true,
              communityLink: memberCheck.communityLink,
              error: "Nomor WhatsApp Anda belum terdaftar di Komunitas WhatsApp MarketPoint. Kami telah mengirimkan pesan instruksi & link ke WhatsApp Anda.",
            },
            { status: 403 }
          );
        }
      } catch (commErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: commErr.message || "Gagal mengonfirmasi keanggotaan komunitas WhatsApp.",
          },
          { status: 500 }
        );
      }
    }

    // 2. Generate OTP Code
    const otpResult = generateOTP(formattedPhone);
    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.message, cooldownMs: otpResult.cooldownMs },
        { status: 429 }
      );
    }

    const otpCode = otpResult.code!;

    // 2. Send OTP via WhatsApp Socket Bot
    const sendResult = await sendOTPMessage(formattedPhone, otpCode);

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || "Gagal mengirim pesan WhatsApp via Bot.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi berhasil dikirimkan ke WhatsApp +${formattedPhone}.`,
      phone: formattedPhone,
    });
  } catch (error: any) {
    console.error("[API OTP SEND ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
