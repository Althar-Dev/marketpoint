import { NextRequest, NextResponse } from "next/server";
import {
  createDispute,
  getDisputeById,
  getDisputeByTransactionId,
  getDisputesByBuyer,
  getDisputesBySeller,
  getAllDisputes,
  sellerRespondToDispute,
  adminResolveDispute,
  escalateToAdminReview,
  cancelDispute,
  ensureDisputesTable,
  type DisputeResolution,
  type DisputeStatus,
} from "@/lib/database/dispute-db";

// ─── GET: Fetch disputes ───────────────────────────────────────────────────────
// ?id=DSP-xxx              → single dispute by ID
// ?transactionId=xxx       → dispute by transaction
// ?buyerId=uid             → all disputes for a buyer
// ?sellerId=uid            → all disputes for a seller
// ?admin=1&status=OPEN     → admin: all disputes
export async function GET(req: NextRequest) {
  try {
    await ensureDisputesTable();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const transactionId = searchParams.get("transactionId");
    const buyerId = searchParams.get("buyerId");
    const sellerId = searchParams.get("sellerId");
    const isAdmin = searchParams.get("admin") === "1";
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (id) {
      const dispute = await getDisputeById(id);
      if (!dispute) {
        return NextResponse.json(
          { success: false, error: "Dispute tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, dispute });
    }

    if (transactionId) {
      const dispute = await getDisputeByTransactionId(transactionId);
      return NextResponse.json({ success: true, dispute: dispute || null });
    }

    if (buyerId) {
      const disputes = await getDisputesByBuyer(buyerId);
      return NextResponse.json({ success: true, disputes });
    }

    if (sellerId) {
      const disputes = await getDisputesBySeller(sellerId);
      return NextResponse.json({ success: true, disputes });
    }

    if (isAdmin) {
      const disputes = await getAllDisputes({ status, limit, offset });
      return NextResponse.json({ success: true, disputes });
    }

    return NextResponse.json(
      { success: false, error: "Parameter tidak valid" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API DISPUTES GET]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// ─── POST: Create new dispute ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transactionId,
      invoiceNumber,
      buyerId,
      buyerName,
      buyerEmail,
      sellerId,
      sellerName,
      productTitle,
      productImage,
      totalAmount,
      reason,
      description,
      evidenceUrls,
    } = body;

    if (!transactionId || !buyerId || !sellerId || !reason || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Data dispute tidak lengkap. Pastikan alasan dan deskripsi diisi.",
        },
        { status: 400 }
      );
    }

    // Check if dispute already exists for this transaction
    const existing = await getDisputeByTransactionId(transactionId);
    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "Dispute untuk transaksi ini sudah ada dan masih aktif.",
          dispute: existing,
        },
        { status: 409 }
      );
    }

    const dispute = await createDispute({
      transactionId,
      invoiceNumber,
      buyerId,
      buyerName,
      buyerEmail,
      sellerId,
      sellerName,
      productTitle,
      productImage,
      totalAmount,
      reason,
      description,
      evidenceUrls: evidenceUrls || [],
    });

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (err: any) {
    console.error("[API DISPUTES POST]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat dispute" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update dispute (seller respond / admin resolve / buyer cancel) ────
// body.action:
//   "seller_respond"   → seller reply
//   "admin_resolve"    → admin resolve/reject
//   "admin_review"     → escalate to admin_review
//   "cancel"           → buyer cancel OPEN dispute
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "id dan action wajib diisi" },
        { status: 400 }
      );
    }

    let dispute = null;

    if (action === "seller_respond") {
      const { response } = body;
      if (!response?.trim()) {
        return NextResponse.json(
          { success: false, error: "Respons penjual tidak boleh kosong" },
          { status: 400 }
        );
      }
      dispute = await sellerRespondToDispute(id, response.trim());
    } else if (action === "admin_resolve") {
      const { resolution, adminNote, refundAmount, resolvedBy, status } = body;
      if (!resolution) {
        return NextResponse.json(
          { success: false, error: "Resolusi harus dipilih" },
          { status: 400 }
        );
      }
      dispute = await adminResolveDispute(id, {
        resolution: resolution as DisputeResolution,
        adminNote,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        resolvedBy,
        status: (status as DisputeStatus) || "RESOLVED",
      });
    } else if (action === "admin_review") {
      dispute = await escalateToAdminReview(id);
    } else if (action === "cancel") {
      const { buyerId } = body;
      if (!buyerId) {
        return NextResponse.json(
          { success: false, error: "buyerId wajib untuk pembatalan" },
          { status: 400 }
        );
      }
      dispute = await cancelDispute(id, buyerId);
      if (!dispute) {
        return NextResponse.json(
          {
            success: false,
            error: "Dispute tidak dapat dibatalkan. Mungkin sudah tidak berstatus OPEN.",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Action tidak dikenali" },
        { status: 400 }
      );
    }

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: "Dispute tidak ditemukan atau gagal diperbarui" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, dispute });
  } catch (err: any) {
    console.error("[API DISPUTES PATCH]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui dispute" },
      { status: 500 }
    );
  }
}
