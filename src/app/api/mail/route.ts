import { NextResponse } from "next/server";
import {
  getDbMailAccounts,
  createDbMailAccount,
  updateDbMailAccount,
  deleteDbMailAccount,
  getDbMailMessages,
  sendDbMailMessage,
  updateDbMailFolder,
  markDbMailAsRead,
  markAllDbMailAsRead,
  deleteDbMailPermanently,
  getDbDeliveryLogs,
  clearAllDbMailData,
  updateDbDeliveryRecipient,
  clearDbDeliveryLogs,
  deleteDbDeliveryLog,
  markMultipleDbMailAsRead,
  markMultipleDbMailAsUnread,
  updateMultipleDbMailFolder,
  deleteMultipleDbMailPermanently,
} from "@/lib/database/mail-db";
import { deliverProductLicense } from "@/lib/delivery";
import { sendOutgoingEmail, testMailConnection } from "@/lib/mailer";
import { getSmtpSettings, updateSmtpSettings } from "@/lib/database/settings";

export async function GET() {
  try {
    const [accounts, messages, deliveryLogs, smtpSettings] = await Promise.all([
      getDbMailAccounts(),
      getDbMailMessages(),
      getDbDeliveryLogs(),
      getSmtpSettings(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        messages,
        deliveryLogs,
        smtpSettings,
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

      case "mark_read": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: "ID pesan wajib disertakan" }, { status: 400 });
        }
        await markDbMailAsRead(id);
        return NextResponse.json({ success: true });
      }

      case "mark_all_read": {
        const { folder = "inbox" } = body;
        await markAllDbMailAsRead(folder);
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

      case "bulk_mark_read": {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ success: false, error: "Daftar ID pesan wajib disertakan" }, { status: 400 });
        }
        await markMultipleDbMailAsRead(ids);
        return NextResponse.json({ success: true, count: ids.length });
      }

      case "bulk_mark_unread": {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ success: false, error: "Daftar ID pesan wajib disertakan" }, { status: 400 });
        }
        await markMultipleDbMailAsUnread(ids);
        return NextResponse.json({ success: true, count: ids.length });
      }

      case "bulk_update_folder": {
        const { ids, folder } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !folder) {
          return NextResponse.json({ success: false, error: "Daftar ID dan folder tujuan wajib disertakan" }, { status: 400 });
        }
        await updateMultipleDbMailFolder(ids, folder);
        return NextResponse.json({ success: true, count: ids.length });
      }

      case "bulk_delete": {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ success: false, error: "Daftar ID pesan wajib disertakan" }, { status: 400 });
        }
        await deleteMultipleDbMailPermanently(ids);
        return NextResponse.json({ success: true, count: ids.length });
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

      case "update_delivery_recipient": {
        const { orderId, newRecipient, updateTransaction = true, resendNow = false, productTitle, productId } = body;
        if (!orderId || !newRecipient) {
          return NextResponse.json(
            { success: false, error: "Nomor pesanan (orderId) dan email baru (newRecipient) wajib diisi" },
            { status: 400 }
          );
        }

        await updateDbDeliveryRecipient({
          orderId,
          newRecipient: newRecipient.trim(),
          updateTransaction,
        });

        let deliveryRes = null;
        if (resendNow) {
          deliveryRes = await deliverProductLicense({
            orderId,
            recipientEmail: newRecipient.trim(),
            productTitle: productTitle || undefined,
            productId: productId || undefined,
            forceResend: true,
          });
        }

        return NextResponse.json({
          success: true,
          message: resendNow
            ? `Email berhasil diperbarui ke ${newRecipient} dan lisensi telah dikirim ulang.`
            : `Email penerima pesanan ${orderId} berhasil diperbarui menjadi ${newRecipient}.`,
          data: deliveryRes,
        });
      }

      case "save_smtp_settings": {
        const { settings } = body;
        if (!settings) {
          return NextResponse.json({ success: false, error: "Data pengaturan wajib disertakan" }, { status: 400 });
        }
        await updateSmtpSettings(settings);
        const updated = await getSmtpSettings();
        return NextResponse.json({ success: true, message: "Pengaturan SMTP berhasil disimpan.", data: updated });
      }

      case "test_connection": {
        const { targetEmail, config } = body;
        const testRes = await testMailConnection(targetEmail ? targetEmail.trim() : "", config);
        return NextResponse.json({ success: true, data: testRes });
      }

      case "clear_delivery_logs": {
        await clearDbDeliveryLogs();
        return NextResponse.json({
          success: true,
          message: "Semua riwayat log delivery berhasil dibersihkan dari database.",
        });
      }

      case "delete_delivery_log": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: "ID log delivery wajib disertakan" }, { status: 400 });
        }
        await deleteDbDeliveryLog(id);
        return NextResponse.json({
          success: true,
          message: "Log delivery berhasil dihapus.",
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
