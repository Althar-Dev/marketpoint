import { query } from "./db";

export interface ReviewRecord {
  id: string;
  transactionId: string;
  invoiceNumber: string;
  productId: string;
  productName: string;
  shopId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  ratingAvg: number;
  totalReviews: number;
  starCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Map raw database row to ReviewRecord interface
 */
function mapReviewRow(row: any): ReviewRecord {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    invoiceNumber: row.invoice_number,
    productId: row.product_id,
    productName: row.product_name,
    shopId: row.shop_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    rating: Number(row.rating),
    comment: row.comment || "",
    isAnonymous: Boolean(row.is_anonymous),
    sellerReply: row.seller_reply,
    sellerRepliedAt: row.seller_replied_at ? new Date(row.seller_replied_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Check if a review already exists for a transaction
 */
export async function getReviewByTransactionId(transactionId: string): Promise<ReviewRecord | null> {
  const sql = `
    SELECT * FROM reviews 
    WHERE transaction_id = $1 OR invoice_number = $1
    LIMIT 1;
  `;
  const res = await query(sql, [transactionId]);
  if (!res.rows || res.rows.length === 0) return null;
  return mapReviewRow(res.rows[0]);
}

/**
 * Create a new review and recalculate product rating_avg / rating_count
 */
export async function createReview(data: {
  id?: string;
  transactionId: string;
  invoiceNumber?: string;
  productId: string;
  productName?: string;
  shopId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}): Promise<ReviewRecord> {
  const reviewId = data.id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanRating = Math.max(1, Math.min(5, Math.round(data.rating)));

  const insertSql = `
    INSERT INTO reviews (
      id,
      transaction_id,
      invoice_number,
      product_id,
      product_name,
      shop_id,
      user_id,
      user_name,
      user_avatar,
      rating,
      comment,
      is_anonymous
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `;

  const values = [
    reviewId,
    data.transactionId,
    data.invoiceNumber || "",
    data.productId,
    data.productName || "",
    data.shopId || "",
    data.userId,
    data.userName,
    data.userAvatar || null,
    cleanRating,
    data.comment || "",
    Boolean(data.isAnonymous),
  ];

  const res = await query(insertSql, values);
  const newReview = mapReviewRow(res.rows[0]);

  // Recalculate and update products table rating stats
  if (data.productId) {
    try {
      const statsSql = `
        SELECT 
          COALESCE(ROUND(AVG(rating), 2), 0.00) as avg_rating,
          COUNT(id) as total_count
        FROM reviews
        WHERE product_id = $1;
      `;
      const statsRes = await query(statsSql, [data.productId]);
      if (statsRes.rows && statsRes.rows.length > 0) {
        const avg = Number(statsRes.rows[0].avg_rating);
        const count = parseInt(statsRes.rows[0].total_count, 10);

        await query(
          `UPDATE products 
           SET rating_avg = $1, rating_count = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [avg, count, data.productId]
        );
      }
    } catch (updateErr) {
      console.warn("[PG REVIEW] Failed to update product rating stats:", updateErr);
    }
  }

  return newReview;
}

/**
 * Get reviews and aggregate stats for a product
 */
export async function getReviewsByProductId(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
    starFilter?: number;
    sortBy?: "newest" | "highest" | "lowest";
  }
): Promise<{ reviews: ReviewRecord[]; stats: ReviewStats }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const starFilter = options?.starFilter;
  const sortBy = options?.sortBy || "newest";

  let orderClause = "ORDER BY created_at DESC";
  if (sortBy === "highest") {
    orderClause = "ORDER BY rating DESC, created_at DESC";
  } else if (sortBy === "lowest") {
    orderClause = "ORDER BY rating ASC, created_at DESC";
  }

  // Base query for reviews
  let querySql = `
    SELECT * FROM reviews 
    WHERE product_id = $1
  `;
  const params: any[] = [productId];

  if (starFilter && starFilter >= 1 && starFilter <= 5) {
    params.push(starFilter);
    querySql += ` AND rating = $${params.length}`;
  }

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  querySql += ` ${orderClause} LIMIT $${limitIdx} OFFSET $${offsetIdx};`;

  const reviewsRes = await query(querySql, params);
  const reviews = (reviewsRes.rows || []).map(mapReviewRow);

  // Stats query
  const statsSql = `
    SELECT 
      rating,
      COUNT(id) as count
    FROM reviews
    WHERE product_id = $1
    GROUP BY rating;
  `;
  const statsRes = await query(statsSql, [productId]);

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;
  let totalReviews = 0;

  for (const row of statsRes.rows || []) {
    const star = Number(row.rating) as 1 | 2 | 3 | 4 | 5;
    const count = parseInt(row.count, 10);
    if (starCounts[star] !== undefined) {
      starCounts[star] = count;
      totalRatingSum += star * count;
      totalReviews += count;
    }
  }

  const ratingAvg = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 0;

  return {
    reviews,
    stats: {
      ratingAvg,
      totalReviews,
      starCounts,
    },
  };
}

/**
 * Get reviews and aggregate stats for a shop
 */
export async function getReviewsByShopId(
  shopId: string,
  options?: {
    limit?: number;
    offset?: number;
    starFilter?: number;
    sortBy?: "newest" | "highest" | "lowest";
  }
): Promise<{ reviews: ReviewRecord[]; stats: ReviewStats }> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;
  const starFilter = options?.starFilter;
  const sortBy = options?.sortBy || "newest";

  let orderClause = "ORDER BY created_at DESC";
  if (sortBy === "highest") {
    orderClause = "ORDER BY rating DESC, created_at DESC";
  } else if (sortBy === "lowest") {
    orderClause = "ORDER BY rating ASC, created_at DESC";
  }

  let querySql = `
    SELECT * FROM reviews 
    WHERE shop_id = $1
  `;
  const params: any[] = [shopId];

  if (starFilter && starFilter >= 1 && starFilter <= 5) {
    params.push(starFilter);
    querySql += ` AND rating = $${params.length}`;
  }

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  querySql += ` ${orderClause} LIMIT $${limitIdx} OFFSET $${offsetIdx};`;

  const reviewsRes = await query(querySql, params);
  const reviews = (reviewsRes.rows || []).map(mapReviewRow);

  const statsSql = `
    SELECT 
      rating,
      COUNT(id) as count
    FROM reviews
    WHERE shop_id = $1
    GROUP BY rating;
  `;
  const statsRes = await query(statsSql, [shopId]);

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;
  let totalReviews = 0;

  for (const row of statsRes.rows || []) {
    const star = Number(row.rating) as 1 | 2 | 3 | 4 | 5;
    const count = parseInt(row.count, 10);
    if (starCounts[star] !== undefined) {
      starCounts[star] = count;
      totalRatingSum += star * count;
      totalReviews += count;
    }
  }

  const ratingAvg = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 0;

  return {
    reviews,
    stats: {
      ratingAvg,
      totalReviews,
      starCounts,
    },
  };
}

/**
 * Update review user avatar and name in PostgreSQL
 */
export async function updateReviewUserAvatar(
  identifier: string,
  userAvatar: string,
  userName?: string
): Promise<boolean> {
  const params: any[] = [userAvatar, identifier];
  let sql = `
    UPDATE reviews 
    SET user_avatar = $1, updated_at = CURRENT_TIMESTAMP
  `;
  if (userName) {
    params.push(userName);
    sql += `, user_name = $3`;
  }
  sql += ` WHERE transaction_id = $2 OR invoice_number = $2 OR user_id = $2;`;
  const res = await query(sql, params);
  return (res.rowCount || 0) > 0;
}

/**
 * Update seller reply for a review in PostgreSQL
 */
export async function updateReviewSellerReply(
  reviewId: string,
  sellerReply: string | null
): Promise<ReviewRecord | null> {
  const cleanReply = sellerReply && sellerReply.trim() ? sellerReply.trim() : null;

  if (!cleanReply) {
    const sql = `
      UPDATE reviews 
      SET seller_reply = NULL, 
          seller_replied_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1::VARCHAR OR transaction_id = $1::VARCHAR OR invoice_number = $1::VARCHAR
      RETURNING *;
    `;
    const res = await query(sql, [reviewId]);
    if (!res.rows || res.rows.length === 0) return null;
    return mapReviewRow(res.rows[0]);
  }

  const sql = `
    UPDATE reviews 
    SET seller_reply = $1::TEXT, 
        seller_replied_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2::VARCHAR OR transaction_id = $2::VARCHAR OR invoice_number = $2::VARCHAR
    RETURNING *;
  `;
  const res = await query(sql, [cleanReply, reviewId]);
  if (!res.rows || res.rows.length === 0) return null;
  return mapReviewRow(res.rows[0]);
}
