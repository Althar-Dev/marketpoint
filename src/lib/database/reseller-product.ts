import { query, initDatabaseSchema } from "./db";

export interface ResellerProduct {
  id: string;
  userId: string;
  buyerSku: string;
  productId: string;
  customName?: string | null;
  sellingPrice?: number | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;

  // Joined seller product fields
  sellerPrice?: number;
  sellerStock?: number;
  sellerStockType?: "REUSABLE" | "SINGLE_USE";
  sellerStatus?: string;
  sellerTitle?: string;
  sellerShopId?: string;
  categoryName?: string;
  categorySlug?: string;
  productSlug?: string;
  ratingAvg?: number;
  ratingCount?: number;
  imageUrl?: string;
}

export interface UpsertResellerProductInput {
  userId: string;
  buyerSku?: string | null;
  productId: string;
  customName?: string;
  sellingPrice?: number;
  status?: "ACTIVE" | "INACTIVE";
}

/**
 * Get all custom products configured by a specific reseller/buyer
 */
export async function getResellerProducts(userId: string): Promise<ResellerProduct[]> {
  await initDatabaseSchema();

  const sql = `
    SELECT 
      rp.id,
      rp.user_id AS "userId",
      COALESCE(rp.buyer_sku, '') AS "buyerSku",
      rp.product_id AS "productId",
      rp.custom_name AS "customName",
      rp.selling_price AS "sellingPrice",
      rp.status,
      rp.created_at AS "createdAt",
      rp.updated_at AS "updatedAt",
      p.title AS "sellerTitle",
      p.slug AS "productSlug",
      p.price AS "sellerPrice",
      p.stock_type AS "sellerStockType",
      p.stock_count AS "sellerStock",
      p.status AS "sellerStatus",
      p.shop_id AS "sellerShopId",
      p.rating_avg AS "ratingAvg",
      p.rating_count AS "ratingCount",
      c.name AS "categoryName",
      c.slug AS "categorySlug",
      (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS "imageUrl"
    FROM reseller_products rp
    JOIN products p ON rp.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE rp.user_id = $1
    ORDER BY rp.updated_at DESC
  `;

  const res = await query(sql, [userId]);
  return res.rows.map((row: any) => ({
    ...row,
    buyerSku: row.buyerSku || "",
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : null,
    sellerPrice: row.sellerPrice ? Number(row.sellerPrice) : 0,
    sellerStock: row.sellerStock ? Number(row.sellerStock) : 0,
    sellerStockType: row.sellerStockType || "REUSABLE",
    ratingAvg: row.ratingAvg ? Number(row.ratingAvg) : 0,
    ratingCount: row.ratingCount ? Number(row.ratingCount) : 0,
  }));
}

/**
 * CORE QUERY FOR API TRANSACTIONS:
 * Look up a product by buyer_sku for an authenticated reseller
 */
export async function getResellerProductBySku(
  userId: string,
  buyerSku: string
): Promise<ResellerProduct | null> {
  await initDatabaseSchema();

  const cleanSku = buyerSku.trim().toUpperCase();
  if (!cleanSku) return null;

  const sql = `
    SELECT 
      rp.id,
      rp.user_id AS "userId",
      COALESCE(rp.buyer_sku, '') AS "buyerSku",
      rp.product_id AS "productId",
      rp.custom_name AS "customName",
      rp.selling_price AS "sellingPrice",
      rp.status,
      rp.created_at AS "createdAt",
      rp.updated_at AS "updatedAt",
      p.title AS "sellerTitle",
      p.slug AS "productSlug",
      p.price AS "sellerPrice",
      p.stock_type AS "sellerStockType",
      p.stock_count AS "sellerStock",
      p.status AS "sellerStatus",
      p.shop_id AS "sellerShopId",
      p.rating_avg AS "ratingAvg",
      p.rating_count AS "ratingCount",
      c.name AS "categoryName",
      c.slug AS "categorySlug",
      (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS "imageUrl"
    FROM reseller_products rp
    JOIN products p ON rp.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE rp.user_id = $1 AND rp.buyer_sku = $2
    LIMIT 1
  `;

  const res = await query(sql, [userId, cleanSku]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    ...row,
    buyerSku: row.buyerSku || "",
    sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : null,
    sellerPrice: row.sellerPrice ? Number(row.sellerPrice) : 0,
    sellerStock: row.sellerStock ? Number(row.sellerStock) : 0,
    sellerStockType: row.sellerStockType || "REUSABLE",
    ratingAvg: row.ratingAvg ? Number(row.ratingAvg) : 0,
    ratingCount: row.ratingCount ? Number(row.ratingCount) : 0,
  };
}

/**
 * Add or update custom product code mapping for a reseller
 */
export async function upsertResellerProduct(
  input: UpsertResellerProductInput
): Promise<ResellerProduct> {
  await initDatabaseSchema();

  const cleanSku = input.buyerSku
    ? input.buyerSku.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
    : null;

  const finalSku = cleanSku && cleanSku.length > 0 ? cleanSku : null;

  const sql = `
    INSERT INTO reseller_products (
      user_id,
      product_id,
      buyer_sku,
      custom_name,
      selling_price,
      status,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, product_id) DO UPDATE SET
      buyer_sku = EXCLUDED.buyer_sku,
      custom_name = COALESCE(EXCLUDED.custom_name, reseller_products.custom_name),
      selling_price = COALESCE(EXCLUDED.selling_price, reseller_products.selling_price),
      status = COALESCE(EXCLUDED.status, reseller_products.status),
      updated_at = CURRENT_TIMESTAMP
    RETURNING 
      id,
      user_id AS "userId",
      COALESCE(buyer_sku, '') AS "buyerSku",
      product_id AS "productId",
      custom_name AS "customName",
      selling_price AS "sellingPrice",
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const res = await query(sql, [
    input.userId,
    input.productId,
    finalSku,
    input.customName || null,
    input.sellingPrice || null,
    input.status || "ACTIVE",
  ]);

  return res.rows[0];
}

/**
 * Delete a product mapping from reseller's catalog (by SKU or productId)
 */
export async function deleteResellerProduct(
  userId: string,
  identifier: string
): Promise<boolean> {
  await initDatabaseSchema();

  const cleanIdentifier = identifier.trim().toUpperCase();
  const sql = `
    DELETE FROM reseller_products 
    WHERE user_id = $1 AND (buyer_sku = $2 OR product_id = $3)
  `;

  const res = await query(sql, [userId, cleanIdentifier, identifier.trim()]);
  return (res.rowCount ?? 0) > 0;
}
