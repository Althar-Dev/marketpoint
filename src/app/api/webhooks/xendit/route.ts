import { NextResponse } from "next/server";
import { verifyXenditCallbackToken } from "@/lib/xendit";
import { deliverProductLicense } from "@/lib/delivery";

export async function POST(req: Request) {
  try {
    const callbackToken = req.headers.get("x-callback-token") || "";
    const isValid = await verifyXenditCallbackToken(callbackToken);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Callback Token" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[XENDIT WEBHOOK RECEIVED]", payload);

    // Event handling (e.g. PAID invoice or SUCCEEDED payment request)
    const { status, external_id, id, payer_email, customer, items, description } = payload;
    const isPaid = status === "PAID" || status === "SETTLED" || status === "SUCCEEDED";

    if (isPaid && external_id) {
      console.log(`[XENDIT PAYMENT PAID] Invoice ID: ${id}, External ID: ${external_id}`);
      
      const recipientEmail = payer_email || customer?.email || payload.email;
      if (recipientEmail) {
        try {
          const itemTitle = items?.[0]?.name || description || "Produk Digital MarketPointID";
          await deliverProductLicense({
            orderId: external_id,
            recipientEmail,
            recipientName: customer?.given_names || "Pelanggan MarketPointID",
            productTitle: itemTitle,
          });
          console.log(`[XENDIT WEBHOOK AUTO-DELIVERY SUCCESS] Order ${external_id} delivered to ${recipientEmail}`);
        } catch (delivErr) {
          console.warn("[XENDIT WEBHOOK AUTO-DELIVERY WARN]", delivErr);
        }
      }
    }

    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("[XENDIT WEBHOOK ERROR]", err);
    return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
  }
}
