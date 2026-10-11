import { NextResponse } from "next/server";
import { getXenditPaymentRequest } from "@/lib/xendit";
import { deliverProductLicense } from "@/lib/delivery";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      pr_id,
      secret_key,
      order_details,
      orderId,
      recipientEmail,
      recipientName,
      productTitle,
      productId,
      variant,
      quantity,
    } = body;

    if (!pr_id) {
      return NextResponse.json(
        { success: false, message: "pr_id wajib diisi." },
        { status: 400 }
      );
    }

    const res = await getXenditPaymentRequest(pr_id, secret_key);

    if (!res.success || !res.data) {
      return NextResponse.json(
        {
          success: false,
          message: res.message || "Gagal mengambil data status dari Xendit.",
        },
        { status: 400 }
      );
    }

    const pr = res.data;
    const isPaid = pr.status === "SUCCEEDED";

    let deliveryResult = null;
    if (isPaid) {
      const oId = orderId || order_details?.orderId || pr.reference_id;
      const email = recipientEmail || order_details?.recipientEmail || order_details?.buyerEmail;
      if (oId && email) {
        try {
          deliveryResult = await deliverProductLicense({
            orderId: oId,
            recipientEmail: email,
            recipientName: recipientName || order_details?.recipientName || order_details?.buyerName,
            productId: productId || order_details?.productId,
            productTitle: productTitle || order_details?.productTitle,
            variant: variant || order_details?.variant,
            quantity: Number(quantity || order_details?.quantity) || 1,
          });
        } catch (dErr) {
          console.warn("[STATUS AUTO-DELIVERY WARN]", dErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      isPaid,
      status: pr.status,
      data: pr,
      delivery: deliveryResult,
    });
  } catch (error: any) {
    console.error("[API PAYMENTS STATUS ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pr_id = searchParams.get("pr_id") || searchParams.get("id");
    const secret_key = searchParams.get("secret_key") || undefined;

    if (!pr_id) {
      return NextResponse.json(
        { success: false, message: "Parameter pr_id wajib disertakan." },
        { status: 400 }
      );
    }

    const res = await getXenditPaymentRequest(pr_id, secret_key);

    if (!res.success || !res.data) {
      return NextResponse.json(
        {
          success: false,
          message: res.message || "Gagal mengambil data status dari Xendit.",
        },
        { status: 400 }
      );
    }

    const pr = res.data;
    const isPaid = pr.status === "SUCCEEDED";

    return NextResponse.json({
      success: true,
      isPaid,
      status: pr.status,
      data: pr,
    });
  } catch (error: any) {
    console.error("[API PAYMENTS STATUS GET ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal server.",
      },
      { status: 500 }
    );
  }
}
