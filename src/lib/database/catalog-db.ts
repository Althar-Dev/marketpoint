import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

export interface DigiFlazzCatalogItem {
  product_name: string;
  category: string;
  brand: string;
  type?: string;
  seller_name?: string;
  price?: number;
  admin?: number;
  commission?: number;
  buyer_sku_code: string;
  buyer_product_status: boolean | number;
  seller_product_status: boolean | number;
  unlimited_stock?: boolean | number;
  stock?: number;
  multi?: boolean | number;
  start_cut_off?: string;
  end_cut_off?: string;
  desc?: string;
  cmd_type?: "prepaid" | "pasca" | string;
  updated_at?: string;
}

const dbDir = path.join(process.cwd(), "database");
const dbPath = path.join(dbDir, "catalog.db");

let dbInstance: sqlite3.Database | null = null;

function getDbInstance(): sqlite3.Database {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath);
  }
  return dbInstance;
}

let initPromise: Promise<sqlite3.Database> | null = null;

export async function initCatalogDb(): Promise<sqlite3.Database> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const db = getDbInstance();
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS digiflazz_catalog (
          buyer_sku_code TEXT PRIMARY KEY,
          product_name TEXT NOT NULL,
          category TEXT,
          brand TEXT,
          type TEXT,
          seller_name TEXT,
          price REAL DEFAULT 0,
          admin REAL DEFAULT 0,
          commission REAL DEFAULT 0,
          buyer_product_status INTEGER DEFAULT 1,
          seller_product_status INTEGER DEFAULT 1,
          unlimited_stock INTEGER DEFAULT 1,
          stock INTEGER DEFAULT 0,
          multi INTEGER DEFAULT 0,
          start_cut_off TEXT,
          end_cut_off TEXT,
          desc TEXT,
          cmd_type TEXT,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`,
        (err) => {
          if (err) {
            initPromise = null;
            return reject(err);
          }
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_digiflazz_cat_brand ON digiflazz_catalog(category, brand);`,
            (err2) => {
              if (err2) {
                initPromise = null;
                return reject(err2);
              }
              resolve(db);
            }
          );
        }
      );
    });
  });

  return initPromise;
}

export async function saveDigiFlazzCatalog(items: DigiFlazzCatalogItem[]): Promise<number> {
  const db = await initCatalogDb();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO digiflazz_catalog (
          buyer_sku_code, product_name, category, brand, type, seller_name,
          price, admin, commission, buyer_product_status, seller_product_status,
          unlimited_stock, stock, multi, start_cut_off, end_cut_off, desc, cmd_type, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      for (const item of items) {
        if (!item.buyer_sku_code) continue;
        stmt.run([
          item.buyer_sku_code,
          item.product_name || "",
          item.category || "",
          item.brand || "",
          item.type || "",
          item.seller_name || "",
          item.price ?? 0,
          item.admin ?? 0,
          item.commission ?? 0,
          item.buyer_product_status ? 1 : 0,
          item.seller_product_status ? 1 : 0,
          item.unlimited_stock ? 1 : 0,
          item.stock ?? 0,
          item.multi ? 1 : 0,
          item.start_cut_off || "",
          item.end_cut_off || "",
          item.desc || "",
          item.cmd_type || "prepaid",
        ]);
      }

      stmt.finalize((err) => {
        if (err) {
          db.run("ROLLBACK;");
          return reject(err);
        }
        db.run("COMMIT;", (commitErr) => {
          if (commitErr) return reject(commitErr);
          resolve(items.length);
        });
      });
    });
  });
}

export async function getDigiFlazzCatalog(params?: {
  search?: string;
  category?: string;
  brand?: string;
  cmd_type?: string;
  status?: "active" | "inactive" | string;
  sort?: "name_asc" | "name_desc" | "price_asc" | "price_desc" | string;
}): Promise<DigiFlazzCatalogItem[]> {
  const db = await initCatalogDb();
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM digiflazz_catalog WHERE 1=1`;
    const sqlParams: any[] = [];

    if (params?.cmd_type && params.cmd_type !== "all") {
      sql += ` AND cmd_type = ?`;
      sqlParams.push(params.cmd_type);
    }

    if (params?.category && params.category !== "all") {
      sql += ` AND category = ?`;
      sqlParams.push(params.category);
    }

    if (params?.brand && params.brand !== "all") {
      sql += ` AND brand = ?`;
      sqlParams.push(params.brand);
    }

    if (params?.status === "active") {
      sql += ` AND buyer_product_status = 1 AND seller_product_status = 1`;
    } else if (params?.status === "inactive") {
      sql += ` AND (buyer_product_status = 0 OR seller_product_status = 0)`;
    }

    if (params?.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(product_name) LIKE ? OR LOWER(buyer_sku_code) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(category) LIKE ?)`;
      sqlParams.push(q, q, q, q);
    }

    // Default: Sort by Brand Alphabetically ASC, then Price ASC (Cheapest), then Product Name
    if (params?.sort === "name_desc") {
      sql += ` ORDER BY brand DESC, price ASC, product_name ASC`;
    } else if (params?.sort === "price_asc") {
      sql += ` ORDER BY price ASC, brand ASC, product_name ASC`;
    } else if (params?.sort === "price_desc") {
      sql += ` ORDER BY price DESC, brand ASC, product_name ASC`;
    } else {
      sql += ` ORDER BY brand ASC, price ASC, product_name ASC`;
    }

    db.all(sql, sqlParams, (err, rows: any[]) => {
      if (err) return reject(err);
      const items: DigiFlazzCatalogItem[] = (rows || []).map((row) => ({
        buyer_sku_code: row.buyer_sku_code,
        product_name: row.product_name,
        category: row.category,
        brand: row.brand,
        type: row.type,
        seller_name: row.seller_name,
        price: row.price,
        admin: row.admin,
        commission: row.commission,
        buyer_product_status: row.buyer_product_status === 1,
        seller_product_status: row.seller_product_status === 1,
        unlimited_stock: row.unlimited_stock === 1,
        stock: row.stock,
        multi: row.multi === 1,
        start_cut_off: row.start_cut_off,
        end_cut_off: row.end_cut_off,
        desc: row.desc,
        cmd_type: row.cmd_type,
        updated_at: row.updated_at,
      }));
      resolve(items);
    });
  });
}

export function getCatalogDbFileSize(totalProducts: number = 1): { formatted: string; bytes: number } {
  try {
    if (totalProducts === 0) {
      return { formatted: "0 KB", bytes: 0 };
    }
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const bytes = stats.size;
      if (bytes < 1024) return { formatted: `${bytes} B`, bytes };
      if (bytes < 1024 * 1024) return { formatted: `${(bytes / 1024).toFixed(1)} KB`, bytes };
      return { formatted: `${(bytes / (1024 * 1024)).toFixed(2)} MB`, bytes };
    }
  } catch (e) {
    console.warn("Error reading dbPath stat:", e);
  }
  return { formatted: "0 KB", bytes: 0 };
}

export async function clearDigiFlazzCatalog(): Promise<boolean> {
  return new Promise((resolve) => {
    const doDeleteFile = () => {
      dbInstance = null;
      initPromise = null;
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch (e) {
          console.warn("Gagal hapus file catalog.db:", e);
        }
      }
      resolve(true);
    };

    if (dbInstance) {
      dbInstance.close(() => {
        doDeleteFile();
      });
    } else {
      doDeleteFile();
    }
  });
}

export async function getCatalogStats(): Promise<{
  total: number;
  categories: string[];
  brands: string[];
  lastSync: string | null;
  dbSize: string;
  dbSizeBytes: number;
}> {
  if (!fs.existsSync(dbPath)) {
    return {
      total: 0,
      categories: [],
      brands: [],
      lastSync: null,
      dbSize: "0 KB",
      dbSizeBytes: 0,
    };
  }

  const db = await initCatalogDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as total, MAX(updated_at) as last_sync FROM digiflazz_catalog`,
      (err, row: any) => {
        if (err) return reject(err);
        const total = row?.total || 0;
        const lastSync = row?.last_sync || null;
        const dbSizeInfo = getCatalogDbFileSize(total);

        if (total === 0) {
          return resolve({
            total: 0,
            categories: [],
            brands: [],
            lastSync: null,
            dbSize: "0 KB",
            dbSizeBytes: 0,
          });
        }

        db.all(
          `SELECT DISTINCT category FROM digiflazz_catalog WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`,
          (catErr, catRows: any[]) => {
            if (catErr) return reject(catErr);
            const categories = (catRows || []).map((r) => r.category);

            db.all(
              `SELECT DISTINCT brand FROM digiflazz_catalog WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC`,
              (brandErr, brandRows: any[]) => {
                if (brandErr) return reject(brandErr);
                const brands = (brandRows || []).map((r) => r.brand);
                resolve({
                  total,
                  categories,
                  brands,
                  lastSync,
                  dbSize: dbSizeInfo.formatted,
                  dbSizeBytes: dbSizeInfo.bytes,
                });
              }
            );
          }
        );
      }
    );
  });
}
