import { Pool } from "pg";

/**
 * Global PostgreSQL connection pool for Next.js
 */
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/marketpoint";
const isCloudDb = connectionString.includes("neon.tech") || connectionString.includes("supabase") || connectionString.includes("sslmode=");

function getPool(): Pool {
  if (globalThis.pgPool && globalThis.pgPoolConnectionString === connectionString) {
    return globalThis.pgPool;
  }
  
  if (globalThis.pgPool) {
    globalThis.pgPool.end().catch(() => {});
  }

  const newPool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.pgPool = newPool;
    globalThis.pgPoolConnectionString = connectionString;
  }

  return newPool;
}

const pool = getPool();

declare global {
  var pgPool: Pool | undefined;
  var pgPoolConnectionString: string | undefined;
}

export async function getClient() {
  return getPool().connect();
}

export default pool;

/**
 * Execute query helper
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const activePool = getPool();
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`[PG QUERY] executed in ${duration}ms | rows: ${res.rowCount}`);
    }
    return res;
  } catch (error: any) {
    if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      console.warn("⚠️ [PG DB DISCONNECTED] Cannot connect to PostgreSQL at process.env.DATABASE_URL or localhost:5432");
    } else {
      console.error("[PG QUERY ERROR]", error);
    }
    throw error;
  }
}

let schemaInitPromise: Promise<void> | null = null;
let isSchemaSuccessfullyCreated = false;

/**
 * Automatic table initialization - Runs automatically to ensure all tables exist
 */
export async function initDatabaseSchema(force = false) {
  if (isSchemaSuccessfullyCreated && !force) return;
  if (schemaInitPromise && !force) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      const initSql = `
        -- 1. Create categories table
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          icon VARCHAR(255),
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert/update exact categories requested by user
        INSERT INTO categories (name, slug, icon) VALUES
        ('App Premium', 'app-premium', 'smartphone'),
        ('Asset Design', 'asset-design', 'palette'),
        ('Bot', 'bot', 'bot'),
        ('Ebook', 'ebook', 'book-open'),
        ('Script', 'script', 'terminal'),
        ('Source Code', 'source-code', 'code'),
        ('Lainnya', 'lainnya', 'package')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

        -- 2. Create products table
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(64) PRIMARY KEY,
          shop_id VARCHAR(128) NOT NULL,
          category_id INT REFERENCES categories(id) ON DELETE RESTRICT,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          short_description TEXT,
          description TEXT,
          price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          discount_price NUMERIC(12, 2),
          stock_type VARCHAR(30) NOT NULL DEFAULT 'REUSABLE',
          stock_count INT NOT NULL DEFAULT 0,
          demo_url TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          attributes JSONB DEFAULT '{}'::jsonb,
          sales_count INT NOT NULL DEFAULT 0,
          views_count INT NOT NULL DEFAULT 0,
          rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
          rating_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
        CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

        -- 3. Create product_images table
        CREATE TABLE IF NOT EXISTS product_images (
          id BIGSERIAL PRIMARY KEY,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          is_primary BOOLEAN NOT NULL DEFAULT FALSE,
          sort_order INT NOT NULL DEFAULT 0
        );

        -- 4. Create product_files table
        CREATE TABLE IF NOT EXISTS product_files (
          id BIGSERIAL PRIMARY KEY,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          file_name VARCHAR(255) NOT NULL,
          file_url TEXT NOT NULL,
          file_size BIGINT NOT NULL DEFAULT 0,
          version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Create product_license_keys table
        CREATE TABLE IF NOT EXISTS product_license_keys (
          id BIGSERIAL PRIMARY KEY,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          license_key TEXT NOT NULL,
          is_used BOOLEAN NOT NULL DEFAULT FALSE,
          used_at TIMESTAMPTZ,
          order_id VARCHAR(128),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- 6. Create shop_subscriptions table
        CREATE TABLE IF NOT EXISTS shop_subscriptions (
          shop_id VARCHAR(128) PRIMARY KEY,
          plan_id VARCHAR(30) NOT NULL DEFAULT 'free',
          plan_name VARCHAR(50) NOT NULL DEFAULT 'Gratis',
          billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
          max_products INT NOT NULL DEFAULT 10,
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMPTZ
        );

        -- 7. Create platform_settings table
        CREATE TABLE IF NOT EXISTS platform_settings (
          key_name VARCHAR(100) PRIMARY KEY,
          setting_value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert default commission and integration settings
        INSERT INTO platform_settings (key_name, setting_value, description) VALUES
        ('commission_free', '5.0', 'Persentase komisi toko paket Free (%)'),
        ('commission_plus', '3.0', 'Persentase komisi toko paket Plus (%)'),
        ('commission_pro', '1.5', 'Persentase komisi toko paket Pro (%)'),
        ('commission_prime', '0.0', 'Persentase komisi toko paket Prime (%)'),
        ('xendit_mode', 'sandbox', 'Mode Xendit: sandbox atau production'),
        ('xendit_secret_key', '', 'Xendit Secret API Key'),
        ('xendit_webhook_token', '', 'Xendit Webhook Verification Token'),
        ('digiflazz_mode', 'development', 'Mode DigiFlazz: development atau production'),
        ('digiflazz_username', '', 'DigiFlazz Username'),
        ('digiflazz_api_key', '', 'DigiFlazz Production/Development API Key'),
        ('digiflazz_webhook_secret', '', 'DigiFlazz Webhook Secret')
        ON CONFLICT (key_name) DO NOTHING;

        -- 8. Create mail_accounts table
        CREATE TABLE IF NOT EXISTS mail_accounts (
          email VARCHAR(255) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          role VARCHAR(100) NOT NULL DEFAULT 'Customer Support',
          usage VARCHAR(50) NOT NULL DEFAULT '0.0 GB',
          quota VARCHAR(50) NOT NULL DEFAULT '5 GB',
          status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- 9. Create mail_messages table
        CREATE TABLE IF NOT EXISTS mail_messages (
          id VARCHAR(64) PRIMARY KEY,
          from_email VARCHAR(255) NOT NULL,
          to_email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          preview TEXT,
          content TEXT NOT NULL,
          folder VARCHAR(30) NOT NULL DEFAULT 'inbox',
          previous_folder VARCHAR(30),
          is_unread BOOLEAN NOT NULL DEFAULT TRUE,
          attachment_name VARCHAR(255),
          attachment_size VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- 10. Create mail_delivery_logs table
        CREATE TABLE IF NOT EXISTS mail_delivery_logs (
          id VARCHAR(64) PRIMARY KEY,
          order_id VARCHAR(100) NOT NULL,
          product_title VARCHAR(255) NOT NULL,
          recipient VARCHAR(255) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'DELIVERED',
          serial_key TEXT NOT NULL,
          product_id VARCHAR(64),
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Add column product_id if table already exists without it
        ALTER TABLE mail_delivery_logs ADD COLUMN IF NOT EXISTS product_id VARCHAR(64);

        -- Seed default system accounts including delivery@marketpoint.id
        INSERT INTO mail_accounts (email, name, role, usage, quota, status) VALUES
        ('delivery@marketpoint.id', 'MarketPoint Delivery Service', 'Automated Fulfillment', '0.0 GB', '10 GB', 'ACTIVE'),
        ('support@marketpoint.id', 'Customer Support', 'Bantuan & Tiket Pelanggan', '0.0 GB', '5 GB', 'ACTIVE'),
        ('admin@marketpoint.id', 'MarketPoint Administrator', 'Sistem & Operasional', '0.0 GB', '5 GB', 'ACTIVE')
        ON CONFLICT (email) DO NOTHING;

        -- 11. Create transactions table
        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(64) PRIMARY KEY,
          invoice_number VARCHAR(64) UNIQUE NOT NULL,
          user_id VARCHAR(128) NOT NULL,
          shop_id VARCHAR(128),
          product_id VARCHAR(64),
          product_title VARCHAR(255) NOT NULL,
          product_image TEXT,
          variant VARCHAR(100),
          unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          quantity INT NOT NULL DEFAULT 1,
          items_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          payment_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          voucher_code VARCHAR(50),
          total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          payment_method VARCHAR(50) NOT NULL DEFAULT 'qris',
          payment_method_name VARCHAR(100) NOT NULL DEFAULT 'QRIS',
          payment_category VARCHAR(50) NOT NULL DEFAULT 'QRIS',
          channel_code VARCHAR(50) NOT NULL DEFAULT 'QRIS',
          payment_code TEXT,
          qr_string TEXT,
          pr_id VARCHAR(128),
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          buyer_name VARCHAR(150),
          buyer_email VARCHAR(255),
          buyer_phone VARCHAR(50),
          notes TEXT,
          payment_info JSONB DEFAULT '{}'::jsonb,
          delivered_by VARCHAR(255),
          delivered_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_shop ON transactions(shop_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_pr ON transactions(pr_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);
      `;

      await query(initSql);
      isSchemaSuccessfullyCreated = true;
      console.log("✅ PostgreSQL schema initialized successfully.");
    } catch (err: any) {
      schemaInitPromise = null;
      if (err?.code === "23505") {
        isSchemaSuccessfullyCreated = true;
        console.log("✅ PostgreSQL schema initialized.");
        return;
      }
      console.warn("⚠️ Failed to auto-initialize DB schema (check DATABASE_URL):", err?.message);
      throw err;
    }
  })();

  return schemaInitPromise;
}
