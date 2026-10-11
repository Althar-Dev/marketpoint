import { NextResponse } from "next/server";
import {
  getDbMailAccounts,
  createDbMailAccount,
  updateDbMailAccount,
  deleteDbMailAccount,
  getDbMailMessages,
  sendDbMailMessage,
  updateDbMailFolder,
  deleteDbMailPermanently,
  getDbDeliveryLogs,
  clearAllDbMailData,
} from "@/lib/database/mail-db";
import { deliverProductLicense } from "@/lib/delivery";
import { sendOutgoingEmail } from "@/lib/mailer";

export async function GET() {
  try {
    const [accounts, messages, deliveryLogs] = await Promise.all([
      getDbMailAccounts(),
      getDbMailMessages(),
      getDbDeliveryLogs(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        messages,
        deliveryLogs,
      },
    });
  } catch (error: any) {
    console.error("[MAIL API GET ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch mail data from PostgreSQL",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "send": {
        const { from, to, subject, content } = body;
        if (!to || !subject || !content) {
          return NextResponse.json({ success: false, error: "Data email tidak lengkap" }, { status: 400 });
        }

        let liveResult = null;
        try {
          liveResult = await sendOutgoingEmail({
            from: from ? `MarketPoint <${from}>` : "MarketPoint Delivery <delivery@marketpoint.id>",
            to: to.trim(),
            subject,
            text: content,
          });
        } catch (err: any) {
          console.warn("[MANUAL SEND DIRECT MX WARN]:", err?.message);
        }

        const newMail = await sendDbMailMessage({ from, to, subject, content });
        return NextResponse.json({ success: true, data: newMail, liveResult });
      }

      case "create_account": {
        const { email, name, role, quota } = body;
        if (!email || !name) {
          return NextResponse.json({ success: false, error: "Data akun tidak lengkap" }, { status: 400 });
        }
        const newAcc = await createDbMailAccount({ email, name, role, quota });
        return NextResponse.json({ success: true, data: newAcc });
      }

      case "update_account": {
        const { originalEmail, name, role, quota, status } = body;
        if (!originalEmail || !name) {
          return NextResponse.json({ success: false, error: "Data akun tidak lengkap" }, { status: 400 });
        }
        const updatedAcc = await updateDbMailAccount({ originalEmail, name, role, quota, status });
        return NextResponse.json({ success: true, data: updatedAcc });
      }

      case "delete_account": {
        const { email } = body;
        if (!email) {
          return NextResponse.json({ success: false, error: "Email akun wajib disertakan" }, { status: 400 });
        }
        await deleteDbMailAccount(email);
        return NextResponse.json({ success: true });
      }

      case "update_folder": {
        const { id, folder, previousFolder } = body;
        if (!id || !folder) {
          return NextResponse.json({ success: false, error: "ID dan folder wajib disertakan" }, { status: 400 });
        }
        await updateDbMailFolder(id, folder, previousFolder);
        return NextResponse.json({ success: true });
      }

      case "delete": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: "ID wajib disertakan" }, { status: 400 });
        }
        await deleteDbMailPermanently(id);
        return NextResponse.json({ success: true });
      }

      case "resend_delivery": {
        const { id, orderId, recipient, productTitle, productId } = body;
        if (!orderId || !recipient) {
          return NextResponse.json({ success: false, error: "orderId dan recipient wajib disertakan" }, { status: 400 });
        }

        const deliveryRes = await deliverProductLicense({
          orderId,
          recipientEmail: recipient,
          productTitle: productTitle || undefined,
          productId: productId || undefined,
          forceResend: true,
        });

        return NextResponse.json({ 
          success: true, 
          message: `Lisensi pesanan ${orderId} berhasil dikirim ulang ke ${recipient}.`,
          data: deliveryRes
        });
      }

      case "clear_mock": {
        await clearAllDbMailData();
        return NextResponse.json({ success: true, message: "Semua data mock telah dibersihkan." });
      }

      default:
        return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[MAIL API POST ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
