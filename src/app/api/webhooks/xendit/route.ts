import { NextResponse } from "next/server";
import { verifyXenditCallbackToken } from "@/lib/xendit";

export async function POST(req: Request) {
  try {
    const callbackToken = req.headers.get("x-callback-token") || "";
    const isValid = await verifyXenditCallbackToken(callbackToken);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Callback Token" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[XENDIT WEBHOOK RECEIVED]", payload);

    // Event handling (e.g. PAID invoice)
    const { status, external_id, id } = payload;
    if (status === "PAID" || status === "SETTLED") {
      console.log(`[XENDIT PAYMENT PAID] Invoice ID: ${id}, External ID: ${external_id}`);
      // Here you can process subscription status upgrade or order payment status update
    }

    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("[XENDIT WEBHOOK ERROR]", err);
    return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
  }
}
