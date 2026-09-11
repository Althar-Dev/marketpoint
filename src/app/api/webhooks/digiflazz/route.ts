import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPlatformSettings } from "@/lib/database/settings";

export async function POST(req: Request) {
  try {
    const settings = await getPlatformSettings();
    const webhookSecret = settings.digiflazz.webhookSecret;

    const signatureHeader = req.headers.get("x-hub-signature") || req.headers.get("x-digiflazz-delivery") || "";
    const bodyText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      payload = {};
    }

    if (webhookSecret) {
      const computedHash = crypto
        .createHmac("sha1", webhookSecret)
        .update(bodyText)
        .digest("hex");
      
      const expectedSignature = `sha1=${computedHash}`;
      if (signatureHeader && signatureHeader !== expectedSignature) {
        console.warn("[DIGIFLAZZ WEBHOOK] Signature Mismatch");
      }
    }

    console.log("[DIGIFLAZZ WEBHOOK RECEIVED]", payload);

    return NextResponse.json({ status: "OK" });
  } catch (err: any) {
    console.error("[DIGIFLAZZ WEBHOOK ERROR]", err);
    return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
  }
}
