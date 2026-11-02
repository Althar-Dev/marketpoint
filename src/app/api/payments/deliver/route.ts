import { NextResponse } from "next/server";
import { deliverProductLicense } from "@/lib/delivery";
import { getDbTransactionByInvoice } from "@/lib/database/transaction-db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
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

    // Security Gate: Check internal secret OR verify transaction is PAID in database
    const internalSecret = req.headers.get("x-internal-secret");
    const isAuthorizedInternal = Boolean(
      process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET
    );

    if (!isAuthorizedInternal) {
      // Look up transaction in PostgreSQL database to verify payment status
      const tx = await getDbTransactionByInvoice(orderId);
      if (!tx) {
        return NextResponse.json(
          {
            success: false,
            error: `Nomor pesanan ${orderId} tidak ditemukan dalam sistem database.`,
          },
          { status: 404 }
        );
      }

      const isPaid = tx.status === "PAID" || tx.status === "SETTLED";
      if (!isPaid) {
        return NextResponse.json(
          {
            success: false,
            error: `Akses ditolak: Pesanan ${orderId} belum terverifikasi lunas (Status saat ini: ${tx.status}).`,
          },
          { status: 403 }
        );
      }
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
