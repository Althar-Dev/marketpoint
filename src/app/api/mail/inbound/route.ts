import { NextResponse } from "next/server";
import { query, initDatabaseSchema } from "@/lib/database/db";

/**
 * Inbound Email Webhook
 * Menerima email masuk dari luar (Cloudflare Email Routing Worker, SendGrid Inbound Parse, Brevo, Mailgun, atau simulasi)
 * dan menyimpannya langsung ke folder 'inbox' PostgreSQL mail_messages.
 */
export async function POST(req: Request) {
  try {
    await initDatabaseSchema();
    const contentType = req.headers.get("content-type") || "";

    let from = "";
    let to = "";
    let subject = "";
    let content = "";
    let preview = "";

    let rawInput = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      from = body.from || body.sender || body.from_email || "";
      to = body.to || body.recipient || body.to_email || "";
      subject = body.subject || "";
      rawInput = body.content || body.text || body.html || body.body || "";
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      from = (formData.get("from") || formData.get("sender"))?.toString() || "";
      to = (formData.get("to") || formData.get("recipient"))?.toString() || "";
      subject = formData.get("subject")?.toString() || "";
      rawInput =
        (formData.get("html") || formData.get("text") || formData.get("body"))?.toString() || "";
    } else {
      const rawText = await req.text();
      try {
        const body = JSON.parse(rawText);
        from = body.from || "";
        to = body.to || "";
        subject = body.subject || "";
        rawInput = body.content || body.text || body.html || rawText;
      } catch {
        rawInput = rawText;
      }
    }

    // Jika pesan mengandung format MIME mentah (header RFC 822/5322 seperti Received:, Content-Type:, dll)
    if (
      typeof rawInput === "string" &&
      (rawInput.includes("Received:") ||
        rawInput.includes("Content-Type:") ||
        rawInput.includes("ARC-Seal:") ||
        rawInput.includes("MIME-Version:"))
    ) {
      try {
        const { simpleParser } = await import("mailparser");
        const parsed = await simpleParser(rawInput);

        if (!from && parsed.from?.value?.[0]?.address) {
          from = parsed.from.value[0].address;
        }
        if (!to && parsed.to) {
          const toArr = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
          to = toArr[0]?.value?.[0]?.address || "";
        }
        if (!subject || subject === "(Tanpa Subjek)") {
          subject = parsed.subject || "(Tanpa Subjek)";
        }

        content = parsed.html || parsed.textAsHtml || parsed.text || rawInput;
      } catch (mimeErr) {
        console.warn("[INBOUND MAIL] Gagal parse MIME, fallback ke raw:", mimeErr);
        content = rawInput;
      }
    } else {
      content = rawInput;
    }

    if (!from) from = "unknown@domain.com";
    if (!to) to = "support@marketpoint.id";
    if (!subject) subject = "(Tanpa Subjek)";

    const cleanText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    preview = cleanText.substring(0, 70) + (cleanText.length > 70 ? "..." : "");

    const mailId = `inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `
      INSERT INTO mail_messages (id, from_email, to_email, subject, preview, content, folder, is_unread)
      VALUES ($1, $2, $3, $4, $5, $6, 'inbox', true)
    `,
      [mailId, from, to, subject, preview, content]
    );

    console.log(`[INBOUND MAIL] Email dari ${from} untuk ${to} berhasil disimpan ke Kotak Masuk. ID: ${mailId}`);

    return NextResponse.json({
      success: true,
      message: "Email berhasil diterima dan disimpan ke Kotak Masuk.",
      mailId,
    });
  } catch (error: any) {
    console.error("[INBOUND MAIL ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memproses email masuk",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "MarketPoint Inbound Mail Webhook",
    instructions: "POST JSON or FormData with { from, to, subject, content } to ingest incoming emails into PostgreSQL inbox.",
  });
}
