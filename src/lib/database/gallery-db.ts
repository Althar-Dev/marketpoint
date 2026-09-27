import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export interface GalleryDbItem {
  id: string;
  name: string;
  url: string;
  category: "badge" | "banner" | "icon" | "background" | string;
  folder: string;
  size: number;
  type: string;
  created_at?: string;
}

const dbDir = path.join(process.cwd(), "database");
const dbPath = path.join(dbDir, "gallery.db");

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

export async function initGalleryDb(): Promise<sqlite3.Database> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const db = getDbInstance();
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS gallery_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          category TEXT NOT NULL,
          folder TEXT NOT NULL,
          size INTEGER DEFAULT 0,
          type TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`,
        (err) => {
          if (err) {
            initPromise = null;
            return reject(err);
          }
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_gallery_cat ON gallery_items(category);`,
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

export async function addGalleryItem(item: {
  id?: string;
  name: string;
  url: string;
  category: string;
  folder: string;
  size?: number;
  type?: string;
}): Promise<GalleryDbItem> {
  const db = await initGalleryDb();
  const id = item.id || crypto.randomUUID();
  const size = item.size || 0;
  const type = item.type || "";

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO gallery_items (id, name, url, category, folder, size, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run([id, item.name, item.url, item.category, item.folder, size, type], function (err) {
      if (err) return reject(err);
      db.get(`SELECT * FROM gallery_items WHERE id = ?`, [id], (getErr, row: any) => {
        if (getErr || !row) return reject(getErr || new Error("Failed to retrieve inserted item"));
        resolve({
          id: row.id,
          name: row.name,
          url: row.url,
          category: row.category,
          folder: row.folder,
          size: row.size,
          type: row.type,
          created_at: row.created_at,
        });
      });
    });
  });
}

export async function getGalleryItems(category?: string): Promise<GalleryDbItem[]> {
  const db = await initGalleryDb();
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM gallery_items`;
    const params: any[] = [];

    if (category && category !== "all") {
      sql += ` WHERE category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC`;

    db.all(sql, params, (err, rows: any[]) => {
      if (err) return reject(err);
      const items: GalleryDbItem[] = (rows || []).map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        category: row.category,
        folder: row.folder,
        size: row.size,
        type: row.type,
        created_at: row.created_at,
      }));
      resolve(items);
    });
  });
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  const db = await initGalleryDb();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM gallery_items WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

export function getGalleryDbFileSize(): { formatted: string; bytes: number } {
  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const bytes = stats.size;
      if (bytes < 1024) return { formatted: `${bytes} B`, bytes };
      if (bytes < 1024 * 1024) return { formatted: `${(bytes / 1024).toFixed(1)} KB`, bytes };
      return { formatted: `${(bytes / (1024 * 1024)).toFixed(2)} MB`, bytes };
    }
  } catch (e) {
    console.warn("Error reading gallery dbPath stat:", e);
  }
  return { formatted: "0 KB", bytes: 0 };
}
