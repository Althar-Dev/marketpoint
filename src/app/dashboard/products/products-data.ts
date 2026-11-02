import {
  Package,
  Code2,
  Bot,
  Terminal,
  Smartphone,
  Palette,
  BookOpen,
  type LucideIcon
} from "lucide-react";

export interface SellerInfo {
  id: string;
  name: string;
  badge: "OFFICIAL" | "VERIFIED" | "STAR_SELLER";
  price: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  deliverySpeed: string;
  guarantee: string;
}

export interface MarketProduct {
  id: string;
  code: string; // Kode / SKU produk yang diatur sendiri oleh user
  title: string;
  slug: string;
  category: "Source Code" | "Bot" | "Script" | "App Premium" | "Asset Design" | "Ebook";
  categorySlug: string;
  imageUrl: string;
  shortDesc: string;
  salesCount: number;
  ratingAvg: number;
  status: "ACTIVE" | "MAINTENANCE" | "EMPTY";
  selectedSellerId: string;
  sellers: SellerInfo[];
}

export interface CategoryItem {
  name: string;
  slug: string;
  icon: LucideIcon;
}

// Master Available Marketplace Catalog for "Tambah Produk"
export const MASTER_AVAILABLE_PRODUCTS: MarketProduct[] = [
  // 1. App Premium
  {
    id: "prod-capcut-pro",
    code: "CAPCUT-1M",
    title: "CapCut Pro 1 Bulan (Akun Private / Sharing)",
    slug: "capcut-pro-1-bulan",
    category: "App Premium",
    categorySlug: "app-premium",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-capcut-icon-download-in-svg-png-gif-file-formats--editing-apps-pack-logos-icons-9005953.png",
    shortDesc: "Bebas watermark, unlock seluruh efek pro & font, export 4K 60FPS.",
    salesCount: 840,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-duck-capcut",
    sellers: [
      {
        id: "seller-duck-capcut",
        name: "DuckShop Official",
        badge: "OFFICIAL",
        price: 15000,
        stock: 450,
        rating: 4.9,
        reviewsCount: 1240,
        deliverySpeed: "Otomatis Instan (~10 dtk)",
        guarantee: "Garansi Full 30 Hari Anti-Back"
      },
      {
        id: "seller-starvale-capcut",
        name: "StarVale Digital",
        badge: "VERIFIED",
        price: 14500,
        stock: 310,
        rating: 5.0,
        reviewsCount: 890,
        deliverySpeed: "Instan (~5 dtk)",
        guarantee: "Replace Instan 1x24 Jam"
      },
      {
        id: "seller-proflash-capcut",
        name: "ProFlash Store",
        badge: "STAR_SELLER",
        price: 16000,
        stock: 120,
        rating: 4.8,
        reviewsCount: 420,
        deliverySpeed: "1 - 3 Menit",
        guarantee: "Full Support PC & Android/iOS"
      }
    ]
  },
  {
    id: "prod-canva-pro",
    code: "CANVA-PRO-1Y",
    title: "Canva Pro Invite Member Edu & Brand Kit (1 Tahun)",
    slug: "canva-pro-1-tahun",
    category: "App Premium",
    categorySlug: "app-premium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg",
    shortDesc: "Template pro tak terbatas, background remover, magic resize, dan brand kit.",
    salesCount: 620,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-starvale-canva",
    sellers: [
      {
        id: "seller-starvale-canva",
        name: "StarVale Digital",
        badge: "OFFICIAL",
        price: 18000,
        stock: 280,
        rating: 4.9,
        reviewsCount: 710,
        deliverySpeed: "Otomatis Instan",
        guarantee: "Invite Otomatis ke Email Anda"
      },
      {
        id: "seller-designhub-canva",
        name: "DesignHub ID",
        badge: "VERIFIED",
        price: 19500,
        stock: 150,
        rating: 4.8,
        reviewsCount: 340,
        deliverySpeed: "1 - 5 Menit",
        guarantee: "Garansi 1 Tahun Full"
      }
    ]
  },
  {
    id: "prod-netflix-prem",
    code: "NETFLIX-4K-1M",
    title: "Netflix Premium Ultra HD 4K (1 Bulan / 1 Profil)",
    slug: "netflix-premium-4k-1-bulan",
    category: "App Premium",
    categorySlug: "app-premium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg",
    shortDesc: "Akun private profile, pin pribadi, kualitas 4K HDR, anti screen limit.",
    salesCount: 510,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-cinema-netflix",
    sellers: [
      {
        id: "seller-cinema-netflix",
        name: "CinemaBox ID",
        badge: "OFFICIAL",
        price: 28000,
        stock: 210,
        rating: 4.9,
        reviewsCount: 1120,
        deliverySpeed: "Otomatis Instan",
        guarantee: "Garansi Full 30 Hari"
      },
      {
        id: "seller-streamhub-netflix",
        name: "StreamHub Global",
        badge: "VERIFIED",
        price: 26500,
        stock: 90,
        rating: 4.7,
        reviewsCount: 450,
        deliverySpeed: "3 - 5 Menit",
        guarantee: "Replace Cepat"
      }
    ]
  },
  {
    id: "prod-spotify-prem",
    code: "SPOTIFY-IND-1M",
    title: "Spotify Premium Individual (1 Bulan Akun Pribadi)",
    slug: "spotify-premium-individual",
    category: "App Premium",
    categorySlug: "app-premium",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    shortDesc: "Bisa perpanjang akun lama, tanpa VPN, audio lossless aktif.",
    salesCount: 410,
    ratingAvg: 5.0,
    status: "ACTIVE",
    selectedSellerId: "seller-tune-spotify",
    sellers: [
      {
        id: "seller-tune-spotify",
        name: "TuneStream Official",
        badge: "OFFICIAL",
        price: 16000,
        stock: 540,
        rating: 5.0,
        reviewsCount: 980,
        deliverySpeed: "Otomatis Instan",
        guarantee: "Akun Pribadi Resmi"
      }
    ]
  },

  // 2. Bot
  {
    id: "prod-bot-wa-store",
    code: "BOT-WA-STORE",
    title: "Source Bot WhatsApp Toko Otomatis Multi-Device (Node.js & Baileys)",
    slug: "bot-whatsapp-toko-otomatis",
    category: "Bot",
    categorySlug: "bot",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-whatsapp-icon-download-in-svg-png-gif-file-formats--chat-logo-messaging-social-media-pack-logos-icons-4886675.png",
    shortDesc: "Bot WA untuk cek invoice, notifikasi QRIS, order otomatis, dan integrasi API.",
    salesCount: 310,
    ratingAvg: 5.0,
    status: "ACTIVE",
    selectedSellerId: "seller-botmaker-wa",
    sellers: [
      {
        id: "seller-botmaker-wa",
        name: "BotMaster Indonesia",
        badge: "OFFICIAL",
        price: 95000,
        stock: 999,
        rating: 5.0,
        reviewsCount: 290,
        deliverySpeed: "Download Instan",
        guarantee: "Termasuk Panduan & Free Update 6 Bulan"
      },
      {
        id: "seller-devcraft-wa",
        name: "DevCraft Solusindo",
        badge: "VERIFIED",
        price: 89000,
        stock: 999,
        rating: 4.8,
        reviewsCount: 140,
        deliverySpeed: "Download Instan",
        guarantee: "Full Source Code Unobfuscated"
      }
    ]
  },
  {
    id: "prod-bot-tele-payment",
    code: "BOT-TELE-PAY",
    title: "Telegram Payment Notification & Order Gateway Bot (Python / Telebot)",
    slug: "bot-telegram-payment-gateway",
    category: "Bot",
    categorySlug: "bot",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
    shortDesc: "Kirim pesan mutasi rekening, QRIS berhasil, dan tiket bantuan pelanggan via Telegram.",
    salesCount: 185,
    ratingAvg: 4.8,
    status: "ACTIVE",
    selectedSellerId: "seller-scriptlab-tele",
    sellers: [
      {
        id: "seller-scriptlab-tele",
        name: "ScriptLab Official",
        badge: "VERIFIED",
        price: 75000,
        stock: 999,
        rating: 4.8,
        reviewsCount: 120,
        deliverySpeed: "Download Instan",
        guarantee: "Webhook Ready & Dukungan Docker"
      }
    ]
  },
  {
    id: "prod-bot-discord-verify",
    code: "BOT-DC-VERIFY",
    title: "Discord Community Verification & Role Sync Bot (Discord.js v14)",
    slug: "discord-verification-role-bot",
    category: "Bot",
    categorySlug: "bot",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-discord-logo-icon-download-in-svg-png-gif-file-formats--chat-messaging-social-media-pack-logos-icons-4886673.png",
    shortDesc: "Otomatisasi pemberian role pembeli, sistem tiket, dan proteksi raid server Discord.",
    salesCount: 130,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-botmaker-wa",
    sellers: [
      {
        id: "seller-botmaker-wa",
        name: "BotMaster Indonesia",
        badge: "OFFICIAL",
        price: 60000,
        stock: 999,
        rating: 4.9,
        reviewsCount: 85,
        deliverySpeed: "Download Instan",
        guarantee: "Full Source Code & Database SQLite"
      }
    ]
  },

  // 3. Source Code
  {
    id: "prod-sc-marketplace",
    code: "SC-MARKET-NEXT",
    title: "Full Source Code Digital Marketplace & H2H Reseller (Next.js 14 & PostgreSQL)",
    slug: "source-code-digital-marketplace-nextjs",
    category: "Source Code",
    categorySlug: "source-code",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-next-js-logo-icon-download-in-svg-png-gif-file-formats--brand-social-media-pack-logos-icons-8378031.png",
    shortDesc: "Sistem deposit saldo, gateway Xendit/Midtrans, multi-tenant toko, dan admin dashboard.",
    salesCount: 145,
    ratingAvg: 5.0,
    status: "ACTIVE",
    selectedSellerId: "seller-alt-code",
    sellers: [
      {
        id: "seller-alt-code",
        name: "StarVale Studio",
        badge: "OFFICIAL",
        price: 350000,
        stock: 999,
        rating: 5.0,
        reviewsCount: 98,
        deliverySpeed: "Akses GitHub Repo Langsung",
        guarantee: "Lisensi Komersial & Bantuan Instalasi"
      },
      {
        id: "seller-codedev-sc",
        name: "CodeMasters ID",
        badge: "STAR_SELLER",
        price: 320000,
        stock: 999,
        rating: 4.8,
        reviewsCount: 45,
        deliverySpeed: "Download File ZIP",
        guarantee: "Dokumentasi Lengkap PDF + Video"
      }
    ]
  },
  {
    id: "prod-sc-topup-game",
    code: "SC-TOPUP-LARAVEL",
    title: "Source Code Web Top Up Game & PPOB Terotomasi (Laravel & Tailwind)",
    slug: "source-code-web-topup-game-laravel",
    category: "Source Code",
    categorySlug: "source-code",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Laravel.svg",
    shortDesc: "Sistem top up game instan terintegrasi Digiflazz API, mutasi bank otomatis, dan WhatsApp notif.",
    salesCount: 230,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-devcraft-sc",
    sellers: [
      {
        id: "seller-devcraft-sc",
        name: "DevCraft Solusindo",
        badge: "OFFICIAL",
        price: 240000,
        stock: 999,
        rating: 4.9,
        reviewsCount: 165,
        deliverySpeed: "Download Instan",
        guarantee: "Gratis Update Versi Selanjutnya"
      }
    ]
  },

  // 4. Script
  {
    id: "prod-script-qris-checker",
    code: "SCRIPT-QRIS-RT",
    title: "Script Mutasi Bank & QRIS Notifikasi Real-Time (Node.js Microservice)",
    slug: "script-mutasi-bank-qris-realtime",
    category: "Script",
    categorySlug: "script",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-node-js-logo-icon-download-in-svg-png-gif-file-formats--brand-social-media-pack-logos-icons-8378032.png",
    shortDesc: "Pengecekan mutasi BCA, Mandiri, BRI, BNI dan QRIS tanpa biaya bulanan mahal.",
    salesCount: 175,
    ratingAvg: 4.8,
    status: "ACTIVE",
    selectedSellerId: "seller-scriptlab-qris",
    sellers: [
      {
        id: "seller-scriptlab-qris",
        name: "ScriptLab Official",
        badge: "OFFICIAL",
        price: 85000,
        stock: 999,
        rating: 4.8,
        reviewsCount: 88,
        deliverySpeed: "Download Instan",
        guarantee: "Termasuk Modul Enkripsi Data"
      }
    ]
  },
  {
    id: "prod-script-scraper-marketplace",
    code: "SCRIPT-SCRAPER-PY",
    title: "Python Scraper Katalog Produk & Harga Pasar E-Commerce (Playwright)",
    slug: "python-scraper-katalog-produk",
    category: "Script",
    categorySlug: "script",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
    shortDesc: "Monitoring harga pesaing, scrape katalog otomatis dan ekspor data ke Excel/JSON.",
    salesCount: 95,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-alt-scraper",
    sellers: [
      {
        id: "seller-alt-scraper",
        name: "StarVale Studio",
        badge: "VERIFIED",
        price: 65000,
        stock: 999,
        rating: 4.9,
        reviewsCount: 42,
        deliverySpeed: "Download Instan",
        guarantee: "Bypass Cloudflare & Anti-Bot Ready"
      }
    ]
  },

  // 5. Asset Design
  {
    id: "prod-ui-kit-dashboard",
    code: "UI-SAAS-FIGMA",
    title: "Modern SaaS Dashboard UI Kit (120+ Screens & Design System Figma)",
    slug: "modern-saas-dashboard-ui-kit",
    category: "Asset Design",
    categorySlug: "asset-design",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    shortDesc: "Desain UI modern, clean layout, dark/light mode, auto-layout 5.0, variabel warna.",
    salesCount: 120,
    ratingAvg: 5.0,
    status: "ACTIVE",
    selectedSellerId: "seller-pixel-ui",
    sellers: [
      {
        id: "seller-pixel-ui",
        name: "PixelCraft Creative",
        badge: "OFFICIAL",
        price: 49000,
        stock: 999,
        rating: 5.0,
        reviewsCount: 78,
        deliverySpeed: "Akses Figma File Langsung",
        guarantee: "Lisensi Komersial Bebas Pakai"
      }
    ]
  },

  // 6. Ebook
  {
    id: "prod-ebook-reseller-guide",
    code: "EBOOK-RESELLER-BP",
    title: "Ebook Blueprint Bisnis Produk Digital & H2H Reseller Skala Jutaan (PDF)",
    slug: "ebook-blueprint-bisnis-produk-digital",
    category: "Ebook",
    categorySlug: "ebook",
    imageUrl: "https://cdn.iconscout.com/icon/free/png-256/free-pdf-file-icon-download-in-svg-png-gif-file-formats--document-format-extension-files-pack-user-interface-icons-4688755.png",
    shortDesc: "Panduan membangun toko digital, mencari supplier langsung, dan strategi closing.",
    salesCount: 260,
    ratingAvg: 4.9,
    status: "ACTIVE",
    selectedSellerId: "seller-duck-ebook",
    sellers: [
      {
        id: "seller-duck-ebook",
        name: "DuckShop Official",
        badge: "OFFICIAL",
        price: 35000,
        stock: 999,
        rating: 4.9,
        reviewsCount: 195,
        deliverySpeed: "Download PDF Instan",
        guarantee: "Bonus Template Konten Promosi"
      }
    ]
  }
];

export const CATEGORIES: CategoryItem[] = [
  { name: "Semua Kategori", slug: "all", icon: Package },
  { name: "Source Code", slug: "source-code", icon: Code2 },
  { name: "Bot", slug: "bot", icon: Bot },
  { name: "Script", slug: "script", icon: Terminal },
  { name: "App Premium", slug: "app-premium", icon: Smartphone },
  { name: "Asset Design", slug: "asset-design", icon: Palette },
  { name: "Ebook", slug: "ebook", icon: BookOpen },
];
