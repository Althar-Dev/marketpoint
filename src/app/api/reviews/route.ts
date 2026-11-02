import { NextResponse } from "next/server";
import {
  createReview,
  getReviewByTransactionId,
  getReviewsByProductId,
  getReviewsByShopId,
  updateReviewUserAvatar,
  updateReviewSellerReply,
} from "@/lib/database/review-db";
import { getDbTransactionByInvoice } from "@/lib/database/transaction-db";
import { query } from "@/lib/database/db";
import { extractBearerToken, verifyFirebaseIdToken, verifyShopAuthorization } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const productId = searchParams.get("productId");
    const shopId = searchParams.get("shopId");
    const starFilter = searchParams.get("star") ? parseInt(searchParams.get("star")!, 10) : undefined;
    const sortBy = (searchParams.get("sortBy") as "newest" | "highest" | "lowest") || "newest";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    // 0. Aggregate ratings summary across all shops
    if (searchParams.get("shopSummary") === "true") {
      const summaryRes = await query(`
        SELECT shop_id as "shopId", ROUND(AVG(rating), 1)::float as "ratingAvg", COUNT(id)::int as "totalReviews"
        FROM reviews
        GROUP BY shop_id
      `);
      return NextResponse.json({ success: true, summaries: summaryRes.rows || [] });
    }

    // 1. Single transaction check
    if (transactionId) {
      const review = await getReviewByTransactionId(transactionId);
      return NextResponse.json({ success: true, review });
    }

    // 2. Product reviews
    if (productId) {
      const data = await getReviewsByProductId(productId, {
        limit,
        offset,
        starFilter,
        sortBy,
      });
      return NextResponse.json({ success: true, ...data });
    }

    // 3. Shop reviews
    if (shopId) {
      let data = await getReviewsByShopId(shopId, {
        limit,
        offset,
        starFilter,
        sortBy,
      });

      // If no reviews found, shopId might be a shop slug rather than shop UID
      if (data.reviews.length === 0) {
        try {
          const { firebaseConfig } = await import("@/firebase/config");
          const firestoreQueryUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:runQuery?key=${firebaseConfig.apiKey}`;
          const queryRes = await fetch(firestoreQueryUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              structuredQuery: {
                from: [{ collectionId: "shops" }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: "slug" },
                    op: "EQUAL",
                    value: { stringValue: shopId }
                  }
                },
                limit: 1
              }
            })
          });

          if (queryRes.ok) {
            const queryData = await queryRes.json();
            const docName = queryData[0]?.document?.name;
            const resolvedShopId = docName ? docName.split("/").pop() : null;
            if (resolvedShopId && resolvedShopId !== shopId) {
              data = await getReviewsByShopId(resolvedShopId, {
                limit,
                offset,
                starFilter,
                sortBy,
              });
            }
          }
        } catch (slugErr) {
          console.warn("[API REVIEWS SLUG RESOLVE WARN]", slugErr);
        }
      }

      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json(
      { success: false, error: "Parameter transactionId, productId, atau shopId diperlukan." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API REVIEWS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat ulasan." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      transactionId,
      invoiceNumber,
      productId,
      productName,
      shopId,
      userId,
      userName,
      userAvatar,
      rating,
      comment,
      isAnonymous,
    } = body;

    if (!transactionId || !rating) {
      return NextResponse.json(
        { success: false, error: "ID Transaksi dan rating bintang wajib diisi." },
        { status: 400 }
      );
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json(
        { success: false, error: "Rating harus berupa angka antara 1 sampai 5." },
        { status: 400 }
      );
    }

    // Check if review already exists for this transaction
    const existing = await getReviewByTransactionId(transactionId);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Transaksi ini sudah pernah Anda beri ulasan.", existingReview: existing },
        { status: 409 }
      );
    }

    // Validate transaction status in PostgreSQL or Firestore fallback
    const inv = invoiceNumber || transactionId;
    const tx = await getDbTransactionByInvoice(inv);
    let isPaid = tx ? (tx.status === "PAID" || tx.status === "SETTLED") : false;

    if (!tx) {
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpointid";
        const fsRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/transactions/${inv}`,
          { cache: "no-store" }
        );
        if (fsRes.ok) {
          const fsData = await fsRes.json();
          const fsStatus = fsData.fields?.status?.stringValue;
          if (fsStatus === "PAID" || fsStatus === "SETTLED") {
            isPaid = true;
          }
        }
      } catch (_) {}
    }

    if (!isPaid) {
      return NextResponse.json(
        { success: false, error: "Ulasan hanya dapat diberikan untuk transaksi yang telah berhasil/lunas." },
        { status: 400 }
      );
    }

    // Determine buyer display name if anonymous
    const finalUserName = isAnonymous
      ? (userName ? `${userName.charAt(0)}***${userName.slice(-1)}` : "Pengguna MarketPointID")
      : (userName || "Pembeli Terverifikasi");

    const review = await createReview({
      transactionId,
      invoiceNumber: invoiceNumber || tx?.invoiceNumber || transactionId,
      productId: productId || tx?.productId || "general",
      productName: productName || tx?.productTitle || "",
      shopId: shopId || tx?.shopId || "",
      userId: userId || tx?.buyerEmail || tx?.userId || "guest",
      userName: finalUserName,
      userAvatar: isAnonymous ? null : userAvatar,
      rating: Number(rating),
      comment: (comment || "").trim(),
      isAnonymous: Boolean(isAnonymous),
    });

    return NextResponse.json({
      success: true,
      message: "Terima kasih! Ulasan Anda berhasil disimpan.",
      review,
    });
  } catch (error: any) {
    console.error("[API REVIEWS POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan ulasan." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, invoiceNumber, userId, userAvatar, userName } = body;
    const identifier = transactionId || invoiceNumber || userId;
    if (!identifier || !userAvatar) {
      return NextResponse.json(
        { success: false, error: "Parameter identifier (transactionId/invoiceNumber/userId) dan userAvatar diperlukan." },
        { status: 400 }
      );
    }

    const updated = await updateReviewUserAvatar(identifier, userAvatar, userName);
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("[API REVIEWS PUT ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui avatar ulasan." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { reviewId, sellerReply } = body;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "Parameter reviewId diperlukan." },
        { status: 400 }
      );
    }

    // 1. Inspect existing review to determine shop_id
    const reviewRes = await query(
      `SELECT * FROM reviews WHERE id = $1::VARCHAR OR transaction_id = $1::VARCHAR OR invoice_number = $1::VARCHAR LIMIT 1`,
      [reviewId]
    );

    if (!reviewRes.rows || reviewRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ulasan tidak ditemukan." },
        { status: 404 }
      );
    }

    const reviewShopId = reviewRes.rows[0].shop_id;

    // 2. Verify authorization
    const token = extractBearerToken(req);
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = Boolean(process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET);

    if (!isInternal) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: "Otentikasi diperlukan: Header Authorization: Bearer <TOKEN> wajib disertakan." },
          { status: 401 }
        );
      }

      const auth = await verifyFirebaseIdToken(token);
      if (!auth.valid || !auth.uid) {
        return NextResponse.json(
          { success: false, error: auth.error || "Token autentikasi tidak valid." },
          { status: 401 }
        );
      }

      if (reviewShopId) {
        const access = await verifyShopAuthorization(auth.uid, reviewShopId);
        if (!access.authorized) {
          return NextResponse.json(
            { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang untuk toko ini." },
            { status: 403 }
          );
        }
      }
    }

    const updated = await updateReviewSellerReply(
      reviewId,
      typeof sellerReply === "string" ? sellerReply.trim() : null
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Ulasan tidak ditemukan atau gagal diperbarui." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sellerReply ? "Balasan penjual berhasil disimpan." : "Balasan penjual telah dihapus.",
      review: updated,
    });
  } catch (error: any) {
    console.error("[API REVIEWS PATCH ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui balasan ulasan." },
      { status: 500 }
    );
  }
}
