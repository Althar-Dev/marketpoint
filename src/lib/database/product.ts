import { query, getClient, initDatabaseSchema } from "./db";

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface ProductImage {
  id?: number;
  productId?: string;
  imageUrl: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductFile {
  id?: number;
  productId?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  version?: string;
}

export interface DigitalProduct {
  id: string;
  shopId: string;
  categoryId: number;
  categoryName?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  stockType: "REUSABLE" | "SINGLE_USE";
  stockCount: number;
  demoUrl?: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  attributes?: Record<string, any>;
  salesCount: number;
  viewsCount: number;
  ratingAvg: number;
  ratingCount: number;
  images: ProductImage[];
  files: ProductFile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  shopId: string;
  categoryId: number;
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  stockType?: "REUSABLE" | "SINGLE_USE";
  stockCount?: number;
  demoUrl?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE";
  attributes?: Record<string, any>;
  images?: string[];
  files?: Array<{ fileName: string; fileUrl: string; fileSize?: number; version?: string }>;
  licenseKeys?: string[];
}

let isDbInitialized = false;

async function ensureSchema() {
  if (!isDbInitialized) {
    await initDatabaseSchema();
    isDbInitialized = true;
  }
}

/**
 * Generate URL-friendly slug from product title
 */
export function generateProductSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
}

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: "App Premium", slug: "app-premium", icon: "smartphone" },
  { id: 2, name: "Asset Design", slug: "asset-design", icon: "palette" },
  { id: 3, name: "Bot", slug: "bot", icon: "bot" },
  { id: 4, name: "Ebook", slug: "ebook", icon: "book-open" },
  { id: 5, name: "Script", slug: "script", icon: "terminal" },
  { id: 6, name: "Source Code", slug: "source-code", icon: "code" },
  { id: 7, name: "Lainnya", slug: "lainnya", icon: "package" },
];

/**
 * Get all categories with graceful fallback & auto-schema retry
 */
export async function getCategories(): Promise<ProductCategory[]> {
  try {
    await ensureSchema();
    const res = await query("SELECT id, name, slug, icon, description FROM categories ORDER BY name ASC");
    return res.rows.length > 0 ? res.rows : DEFAULT_CATEGORIES;
  } catch (err: any) {
    if (err?.code === "42P01") {
      try {
        await initDatabaseSchema(true);
        const res = await query("SELECT id, name, slug, icon, description FROM categories ORDER BY name ASC");
        return res.rows.length > 0 ? res.rows : DEFAULT_CATEGORIES;
      } catch (retryErr) {
        console.warn("⚠️ PostgreSQL belum terhubung. Menggunakan daftar kategori default.");
        return DEFAULT_CATEGORIES;
      }
    }
    console.warn("⚠️ PostgreSQL belum terhubung. Menggunakan daftar kategori default.");
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Get all products for a specific shop with graceful fallback & auto-schema retry
 */
export async function getProductsByShop(shopId: string): Promise<DigitalProduct[]> {
  try {
    await ensureSchema();

    const fetchProductsData = async () => {
      const sql = `
        SELECT 
          p.id, p.shop_id as "shopId", p.category_id as "categoryId", c.name as "categoryName",
          p.title, p.slug, p.short_description as "shortDescription", p.description,
          p.price, p.discount_price as "discountPrice", p.stock_type as "stockType",
          p.stock_count as "stockCount", p.demo_url as "demoUrl", p.status,
          p.attributes, p.sales_count as "salesCount", p.views_count as "viewsCount",
          p.rating_avg as "ratingAvg", p.rating_count as "ratingCount",
          p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.shop_id = $1 AND p.status != 'ARCHIVED'
        ORDER BY p.created_at DESC
      `;

      const res = await query(sql, [shopId]);
      const products = res.rows;

      if (products.length === 0) return [];

      const productIds = products.map((p) => p.id);

      const imgRes = await query(
        `SELECT id, product_id as "productId", image_url as "imageUrl", is_primary as "isPrimary" FROM product_images WHERE product_id = ANY($1::varchar[]) ORDER BY sort_order ASC`,
        [productIds]
      );

      const fileRes = await query(
        `SELECT id, product_id as "productId", file_name as "fileName", file_url as "fileUrl", file_size as "fileSize", version FROM product_files WHERE product_id = ANY($1::varchar[])`,
        [productIds]
      );

      return products.map((p) => ({
        ...p,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        ratingAvg: Number(p.ratingAvg),
        images: imgRes.rows.filter((img) => img.productId === p.id),
        files: fileRes.rows.filter((f) => f.productId === p.id),
      }));
    };

    return await fetchProductsData();
  } catch (err: any) {
    if (err?.code === "42P01") {
      try {
        await initDatabaseSchema(true);
        const res = await query("SELECT p.id FROM products p WHERE p.shop_id = $1 LIMIT 1", [shopId]);
        if (res.rows.length === 0) return [];
      } catch (retryErr) {
        console.warn(`⚠️ PostgreSQL belum terhubung. Gagal mengambil produk toko ${shopId}.`);
        return [];
      }
    }
    console.warn(`⚠️ PostgreSQL belum terhubung. Gagal mengambil produk toko ${shopId}.`);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<DigitalProduct | null> {
  await ensureSchema();
  const sql = `
    SELECT 
      p.id, p.shop_id as "shopId", p.category_id as "categoryId", c.name as "categoryName",
      p.title, p.slug, p.short_description as "shortDescription", p.description,
      p.price, p.discount_price as "discountPrice", p.stock_type as "stockType",
      p.stock_count as "stockCount", p.demo_url as "demoUrl", p.status,
      p.attributes, p.sales_count as "salesCount", p.views_count as "viewsCount",
      p.rating_avg as "ratingAvg", p.rating_count as "ratingCount",
      p.created_at as "createdAt", p.updated_at as "updatedAt"
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
  `;

  const res = await query(sql, [id]);
  if (res.rows.length === 0) return null;

  const product = res.rows[0];

  const imgRes = await query(
    `SELECT id, product_id as "productId", image_url as "imageUrl", is_primary as "isPrimary" FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC`,
    [id]
  );

  const fileRes = await query(
    `SELECT id, product_id as "productId", file_name as "fileName", file_url as "fileUrl", file_size as "fileSize", version FROM product_files WHERE product_id = $1`,
    [id]
  );

  return {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    ratingAvg: Number(product.ratingAvg),
    images: imgRes.rows,
    files: fileRes.rows,
  };
}

/**
 * Create new digital product
 */
export async function createProduct(input: CreateProductInput): Promise<DigitalProduct> {
  await ensureSchema();

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = input.slug?.trim() || generateProductSlug(input.title);

    const productSql = `
      INSERT INTO products (
        id, shop_id, category_id, title, slug, short_description, description,
        price, discount_price, stock_type, stock_count, demo_url, status, attributes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING 
        id, shop_id as "shopId", category_id as "categoryId", title, slug,
        short_description as "shortDescription", description, price,
        discount_price as "discountPrice", stock_type as "stockType",
        stock_count as "stockCount", demo_url as "demoUrl", status,
        attributes, sales_count as "salesCount", views_count as "viewsCount",
        rating_avg as "ratingAvg", rating_count as "ratingCount", created_at as "createdAt"
    `;

    const stockType = input.stockType || "REUSABLE";
    const licenseKeys = (input.licenseKeys || []).filter((k) => k.trim().length > 0);
    const stockCount = stockType === "SINGLE_USE" ? (licenseKeys.length || input.stockCount || 0) : (input.stockCount || 9999);

    const productParams = [
      productId,
      input.shopId,
      input.categoryId,
      input.title,
      slug,
      input.shortDescription || null,
      input.description || null,
      input.price,
      input.discountPrice || null,
      stockType,
      stockCount,
      input.demoUrl || null,
      input.status || "ACTIVE",
      JSON.stringify(input.attributes || {}),
    ];

    const prodRes = await client.query(productSql, productParams);
    const newProduct = prodRes.rows[0];

    // Insert Images
    const createdImages: ProductImage[] = [];
    if (input.images && input.images.length > 0) {
      for (let i = 0; i < input.images.length; i++) {
        const imgUrl = input.images[i];
        const isPrimary = i === 0;
        const imgRes = await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, image_url as "imageUrl", is_primary as "isPrimary"`,
          [productId, imgUrl, isPrimary, i]
        );
        createdImages.push(imgRes.rows[0]);
      }
    }

    // Insert Files (for REUSABLE or digital products)
    const createdFiles: ProductFile[] = [];
    if (input.files && input.files.length > 0) {
      for (const f of input.files) {
        const fileRes = await client.query(
          `INSERT INTO product_files (product_id, file_name, file_url, file_size, version) VALUES ($1, $2, $3, $4, $5) RETURNING id, file_name as "fileName", file_url as "fileUrl", file_size as "fileSize", version`,
          [productId, f.fileName, f.fileUrl, f.fileSize || 0, f.version || "v1.0.0"]
        );
        createdFiles.push(fileRes.rows[0]);
      }
    }

    // Insert License Keys / Single Use Account Lines
    if (stockType === "SINGLE_USE" && licenseKeys.length > 0) {
      for (const key of licenseKeys) {
        await client.query(
          `INSERT INTO product_license_keys (product_id, license_key) VALUES ($1, $2)`,
          [productId, key]
        );
      }
    }

    await client.query("COMMIT");

    return {
      ...newProduct,
      price: Number(newProduct.price),
      discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : null,
      ratingAvg: Number(newProduct.ratingAvg),
      images: createdImages,
      files: createdFiles,
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[CREATE PRODUCT ERROR]", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Delete / Archive product
 */
export async function deleteProduct(productId: string, shopId: string): Promise<boolean> {
  await ensureSchema();
  const res = await query(
    `UPDATE products SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND shop_id = $2`,
    [productId, shopId]
  );
  return (res.rowCount || 0) > 0;
}
