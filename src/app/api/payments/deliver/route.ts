import { NextResponse } from "next/server";
import { deliverProductLicense } from "@/lib/delivery";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      productId,
      productTitle,
      recipientEmail,
      recipientName,
      variant,
      quantity,
      forceResend,
    } = body;

    if (!orderId || !recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "orderId dan recipientEmail wajib disertakan.",
        },
        { status: 400 }
      );
    }

    const result = await deliverProductLicense({
      orderId,
      productId,
      productTitle,
      recipientEmail,
      recipientName,
      variant,
      quantity: Number(quantity) || 1,
      forceResend: Boolean(forceResend),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API PAYMENTS DELIVER ERROR]", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Gagal memproses pengiriman produk.",
      },
      { status: 500 }
    );
  }
}
