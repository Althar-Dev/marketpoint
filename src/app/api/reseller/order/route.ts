import { NextResponse } from "next/server";
import { getResellerProductBySku } from "@/lib/database/reseller-product";
import { createDbTransaction } from "@/lib/database/transaction-db";
import { validateApiKey } from "@/lib/database/api-key";
import { deductUserBalance, getUserBalance } from "@/lib/database/balance";
import { deliverProductLicense } from "@/lib/delivery";
import { query } from "@/lib/database/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/reseller/order
 * H2H API Order Endpoint:
 * Allows a buyer / reseller to execute transactions via API using their custom product SKU!
 * 
 * Header:
 * Authorization: Bearer mp_live_... (or x-api-key: mp_live_...)
 * 
 * Request payload:
 * {
 *   "buyerSku": "CAPCUT-1M",       // buyer's custom SKU code
 *   "refId": "ORDER-987654",       // buyer's unique reference ID (mandatory for idempotency)
 *   "customerNo": "08123456789",   // target phone / user account ID (optional)
 *   "quantity": 1
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { buyerSku, refId, customerNo, quantity = 1 } = body;

    // 1. Mandatory API Key Authentication (Strict Security: No unauthenticated userId bypass!)
    const authHeader = req.headers.get("authorization") || "";
    const bearerKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const headerKey = req.headers.get("x-api-key") || req.headers.get("api-key");
    const rawApiKey = bearerKey || headerKey || body.apiKey;

    if (!rawApiKey) {
      return NextResponse.json(
        {
          success: false,
          rc: "41",
          message: "Otentikasi gagal: API Key wajib disertakan via header Authorization: Bearer <API_KEY> atau x-api-key.",
        },
        { status: 401 }
      );
    }

    const authResult = await validateApiKey(rawApiKey);
    if (!authResult.valid || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          rc: "41",
          message: "API Key tidak valid atau telah dinonaktifkan. Silakan periksa kunci API di dashboard.",
        },
        { status: 401 }
      );
    }

    const targetUserId = authResult.userId;

    if (!buyerSku || !refId) {
      return NextResponse.json(
        {
          success: false,
          rc: "40",
          message: "Parameter 'buyerSku' dan 'refId' wajib disertakan.",
        },
        { status: 400 }
      );
    }

    const cleanSku = String(buyerSku).trim().toUpperCase();
    const cleanRefId = String(refId).trim();

    // 2. Idempotency Check: Prevent double billing / replay attacks
    const existingTx = await query(
      `SELECT * FROM transactions WHERE user_id = $1 AND (payment_info->>'refId' = $2 OR notes LIKE $3) LIMIT 1`,
      [targetUserId, cleanRefId, `%RefId: ${cleanRefId}%`]
    );

    if (existingTx.rows.length > 0) {
      const row = existingTx.rows[0];
      return NextResponse.json({
        success: true,
        rc: "00",
        isDuplicate: true,
        message: "Transaksi dengan refId ini sudah pernah diproses sebelumnya (Idempotent Replay).",
        data: {
          refId: cleanRefId,
          invoiceNumber: row.invoice_number,
          buyerSku: cleanSku,
          productId: row.product_id,
          productTitle: row.product_title,
          customerNo: customerNo || null,
          price: Number(row.unit_price || 0),
          quantity: Number(row.quantity || 1),
          totalAmount: Number(row.total_amount || 0),
          status: row.status,
          createdAt: row.created_at,
        },
      });
    }

    // 3. O(1) Indexed Lookup from reseller_products -> products
    const mapping = await getResellerProductBySku(targetUserId, cleanSku);
    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          rc: "44",
          message: `Kode SKU "${cleanSku}" tidak ditemukan di katalog Anda. Silakan petakan terlebih dahulu di dashboard.`,
        },
        { status: 404 }
      );
    }

    // 4. Validate Reseller Mapping Status
    if (mapping.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          rc: "43",
          message: `Produk dengan SKU "${cleanSku}" sedang dinonaktifkan di katalog Anda.`,
        },
        { status: 400 }
      );
    }

    // 5. Validate Seller Product Status & Stock
    if (mapping.sellerStatus && mapping.sellerStatus !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          rc: "42",
          message: "Produk seller tujuan saat ini sedang tidak aktif / gangguan.",
        },
        { status: 400 }
      );
    }

    const orderQty = Math.max(1, Number(quantity) || 1);
    if ((mapping.sellerStock ?? 0) < orderQty) {
      return NextResponse.json(
        {
          success: false,
          rc: "41",
          message: `Stok produk seller tidak mencukupi (Tersisa: ${mapping.sellerStock || 0}).`,
        },
        { status: 400 }
      );
    }

    const unitPrice = mapping.sellerPrice || 0;
    const subtotal = unitPrice * orderQty;

    // 6. Balance Verification & Atomic Deduction (Row Locking FOR UPDATE)
    const deductRes = await deductUserBalance(targetUserId, subtotal);
    if (!deductRes.success) {
      return NextResponse.json(
        {
          success: false,
          rc: "42",
          message: deductRes.message || "Saldo deposit Anda tidak mencukupi untuk melakukan transaksi ini.",
        },
        { status: 400 }
      );
    }

    // 7. Generate transaction invoice & record to PostgreSQL
    const invoiceNumber = `H2H-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const transaction = await createDbTransaction({
      invoiceNumber,
      userId: targetUserId,
      shopId: mapping.sellerShopId || null,
      productId: mapping.productId,
      productTitle: mapping.customName || mapping.sellerTitle || cleanSku,
      variant: cleanSku,
      unitPrice,
      quantity: orderQty,
      itemsSubtotal: subtotal,
      paymentFee: 0,
      totalAmount: subtotal,
      paymentMethod: "API_BALANCE",
      paymentMethodName: "Reseller API Deposit",
      paymentCategory: "API",
      channelCode: "H2H_API",
      status: "PAID",
      buyerName: targetUserId,
      buyerPhone: customerNo || null,
      notes: `RefId: ${cleanRefId} | BuyerSKU: ${cleanSku} | Target: ${customerNo || "-"}`,
      paymentInfo: {
        refId: cleanRefId,
        buyerSku: cleanSku,
        customerNo: customerNo || null,
        remainingBalance: deductRes.balance,
      },
    });

    // 8. Auto-delivery of digital licenses if applicable
    let deliveredKeys: string[] = [];
    if (mapping.productId) {
      try {
        const targetRecipientEmail = customerNo && customerNo.includes("@")
          ? customerNo
          : `reseller-${targetUserId}@marketpoint.id`;

        const delivRes = await deliverProductLicense({
          orderId: invoiceNumber,
          productId: mapping.productId,
          productTitle: transaction.productTitle,
          recipientEmail: targetRecipientEmail,
          recipientName: `Reseller (${cleanRefId})`,
          variant: cleanSku,
          quantity: orderQty,
        });
        if (delivRes?.licenseKeys) {
          deliveredKeys = delivRes.licenseKeys;
        }
      } catch (delivErr) {
        console.warn("[RESELLER ORDER DELIVERY WARN]", delivErr);
      }
    }

    return NextResponse.json({
      success: true,
      rc: "00",
      message: "Transaksi H2H berhasil diproses.",
      data: {
        refId: cleanRefId,
        invoiceNumber: transaction.invoiceNumber,
        buyerSku: cleanSku,
        productId: mapping.productId,
        productTitle: transaction.productTitle,
        customerNo: customerNo || null,
        price: unitPrice,
        quantity: orderQty,
        totalAmount: subtotal,
        status: transaction.status,
        remainingBalance: deductRes.balance,
        serialKeys: deliveredKeys.length > 0 ? deliveredKeys : undefined,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[API RESELLER ORDER ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        rc: "99",
        message: error.message || "Terjadi kesalahan internal server saat memproses order API.",
      },
      { status: 500 }
    );
  }
}
