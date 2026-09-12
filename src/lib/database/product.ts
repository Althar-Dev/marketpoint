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
    WHERE p.id = $1 OR p.slug = $1
  `;

  const res = await query(sql, [id]);
  if (res.rows.length === 0) return null;

  const product = res.rows[0];
  const actualId = product.id;

  const imgRes = await query(
    `SELECT id, product_id as "productId", image_url as "imageUrl", is_primary as "isPrimary" FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC`,
    [actualId]
  );

  const fileRes = await query(
    `SELECT id, product_id as "productId", file_name as "fileName", file_url as "fileUrl", file_size as "fileSize", version FROM product_files WHERE product_id = $1`,
    [actualId]
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
 * Generate clean, URL-safe product ID from title
 */
export function generateProductIdFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

/**
 * Create new digital product
 */
export async function createProduct(input: CreateProductInput): Promise<DigitalProduct> {
  await ensureSchema();

  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Generate clean base ID from product title (sanitized from special characters)
    const baseId = generateProductIdFromTitle(input.title);
    let productId = baseId;
    let existingIdCheck = await client.query("SELECT id FROM products WHERE id = $1", [productId]);

    while (existingIdCheck.rows.length > 0) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      productId = `${baseId}-${randomSuffix}`;
      existingIdCheck = await client.query("SELECT id FROM products WHERE id = $1", [productId]);
    }

    const slug = input.slug?.trim() || generateProductIdFromTitle(input.title);

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
 * Delete product and its related database records
 */
export async function deleteProduct(productId: string, shopId: string): Promise<DigitalProduct | null> {
  await ensureSchema();
  const product = await getProductById(productId);
  if (!product || product.shopId !== shopId) return null;

  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
    await client.query("DELETE FROM product_files WHERE product_id = $1", [productId]);
    await client.query("DELETE FROM product_license_keys WHERE product_id = $1", [productId]);
    await client.query("DELETE FROM products WHERE id = $1 AND shop_id = $2", [productId, shopId]);
    await client.query("COMMIT");
    return product;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DELETE PRODUCT ERROR]", err);
    throw err;
  } finally {
    client.release();
  }
}

export interface UpdateProductInput {
  id: string;
  shopId: string;
  categoryId?: number;
  title?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  discountPrice?: number | null;
  stockType?: "REUSABLE" | "SINGLE_USE";
  stockCount?: number;
  demoUrl?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE";
  attributes?: Record<string, any>;
  images?: string[];
  files?: Array<{ fileName: string; fileUrl: string; fileSize?: number }>;
  licenseKeys?: string[];
}

/**
 * Update an existing digital product
 */
export async function updateProduct(input: UpdateProductInput): Promise<DigitalProduct | null> {
  await ensureSchema();
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { id, shopId } = input;

    const checkRes = await client.query("SELECT id FROM products WHERE id = $1 AND shop_id = $2", [id, shopId]);
    if (checkRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [id, shopId];

    if (input.title !== undefined) {
      params.push(input.title);
      updates.push(`title = $${params.length}`);
      const newSlug = generateProductIdFromTitle(input.title);
      params.push(newSlug);
      updates.push(`slug = $${params.length}`);
    }
    if (input.categoryId !== undefined) {
      params.push(input.categoryId);
      updates.push(`category_id = $${params.length}`);
    }
    if (input.price !== undefined) {
      params.push(input.price);
      updates.push(`price = $${params.length}`);
    }
    if (input.shortDescription !== undefined) {
      params.push(input.shortDescription || null);
      updates.push(`short_description = $${params.length}`);
    }
    if (input.description !== undefined) {
      params.push(input.description || null);
      updates.push(`description = $${params.length}`);
    }
    if (input.stockType !== undefined) {
      params.push(input.stockType);
      updates.push(`stock_type = $${params.length}`);
    }
    if (input.stockCount !== undefined) {
      params.push(input.stockCount);
      updates.push(`stock_count = $${params.length}`);
    }
    if (input.demoUrl !== undefined) {
      params.push(input.demoUrl || null);
      updates.push(`demo_url = $${params.length}`);
    }
    if (input.status !== undefined) {
      params.push(input.status);
      updates.push(`status = $${params.length}`);
    }
    if (input.attributes !== undefined) {
      params.push(JSON.stringify(input.attributes || {}));
      updates.push(`attributes = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 2) {
      const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = $1 AND shop_id = $2`;
      await client.query(sql, params);
    }

    if (input.images !== undefined) {
      await client.query("DELETE FROM product_images WHERE product_id = $1", [id]);
      for (let i = 0; i < input.images.length; i++) {
        const imgUrl = input.images[i];
        const isPrimary = i === 0;
        await client.query(
          "INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ($1, $2, $3, $4)",
          [id, imgUrl, isPrimary, i]
        );
      }
    }

    if (input.files !== undefined) {
      await client.query("DELETE FROM product_files WHERE product_id = $1", [id]);
      for (const f of input.files) {
        await client.query(
          "INSERT INTO product_files (product_id, file_name, file_url, file_size, version) VALUES ($1, $2, $3, $4, $5)",
          [id, f.fileName, f.fileUrl, f.fileSize || 0, "v1.0.0"]
        );
      }
    }

    if (input.stockType === "SINGLE_USE" && input.licenseKeys !== undefined) {
      await client.query("DELETE FROM product_license_keys WHERE product_id = $1", [id]);
      for (const key of input.licenseKeys) {
        await client.query(
          "INSERT INTO product_license_keys (product_id, license_key) VALUES ($1, $2)",
          [id, key]
        );
      }
    }

    await client.query("COMMIT");
    return await getProductById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[UPDATE PRODUCT ERROR]", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all active products across all shops for public market listing
 */
export async function getAllActiveProducts(categoryId?: number, limit = 60): Promise<DigitalProduct[]> {
  try {
    await ensureSchema();

    const runQuery = async () => {
      let sql = `
        SELECT 
          p.id, p.shop_id as "shopId",
          p.category_id as "categoryId", c.name as "categoryName",
          p.title, p.slug, p.short_description as "shortDescription", p.description,
          p.price, p.discount_price as "discountPrice", p.stock_type as "stockType",
          p.stock_count as "stockCount", p.demo_url as "demoUrl", p.status,
          p.attributes, p.sales_count as "salesCount", p.views_count as "viewsCount",
          p.rating_avg as "ratingAvg", p.rating_count as "ratingCount",
          p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'ACTIVE'
      `;
      const params: any[] = [];

      if (categoryId && !isNaN(Number(categoryId))) {
        params.push(Number(categoryId));
        sql += ` AND p.category_id = $${params.length}`;
      }

      sql += ` ORDER BY p.created_at DESC LIMIT ${limit}`;

      const res = await query(sql, params);
      const products = res.rows;

      if (products.length === 0) return [];

      const productIds = products.map((p) => p.id);

      const imgRes = await query(
        `SELECT id, product_id as "productId", image_url as "imageUrl", is_primary as "isPrimary" FROM product_images WHERE product_id = ANY($1::varchar[]) ORDER BY sort_order ASC`,
        [productIds]
      );

      return products.map((p) => ({
        ...p,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        ratingAvg: Number(p.ratingAvg || 5.0),
        images: imgRes.rows.filter((img) => img.productId === p.id),
        files: [],
      }));
    };

    return await runQuery();
  } catch (err: any) {
    if (err?.code === "42P01") {
      try {
        await initDatabaseSchema(true);
        const res = await query("SELECT p.id FROM products p WHERE p.status = 'ACTIVE' LIMIT 1");
        if (res.rows.length === 0) return [];
      } catch (retryErr) {
        console.warn("⚠️ PostgreSQL belum terhubung / schema error:", retryErr);
        return [];
      }
    }
    console.warn("⚠️ Error fetching active products:", err);
    return [];
  }
}

