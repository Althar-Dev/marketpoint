import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster";
import { MarketBottomNav } from "@/components/market-bottom-nav";
import { MaintenanceGuard } from "@/components/maintenance-guard";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketpoint.id';

export const viewport: Viewport = {
  themeColor: '#00AA5B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MarketPoint',
    template: '%s | MarketPoint',
  },
  description: 'Platform marketplace produk digital terpercaya di Indonesia. Beli software original, lisensi lifetime, source code aplikasi, hosting VPS, dan voucher digital dengan transaksi instan dan aman.',
  applicationName: 'MarketPoint',
  authors: [{ name: 'Alhadi Adriano (AltharDev) - StarVale Technology Solution', url: siteUrl }],
  generator: 'Next.js',
  keywords: [
    'marketplace produk digital',
    'jual software original',
    'source code aplikasi',
    'lisensi windows murah',
    'hosting vps indonesia',
    'aset desain grafis',
    'voucher game murah',
    'topup',
    'top up',
    'top up game',
    'top up game termurah',
    'promo',
    'marketpoint',
    'marketpointid',
    'mpoint',
    'starvale technology solution',
    'althardev'
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Alhadi Adriano (AltharDev)',
  publisher: 'StarVale Technology Solution',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MarketPoint - Marketplace Produk Digital, Lisensi & Source Code Terpercaya',
    description: 'Beli software original, source code, hosting, dan aset digital terpercaya dengan garansi dan transaksi instan.',
    url: siteUrl,
    siteName: 'MarketPoint',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/assets/img/favicon.png',
        width: 1200,
        height: 630,
        alt: 'MarketPoint Digital Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketPoint - Marketplace Produk Digital Terpercaya',
    description: 'Jual beli produk digital, lisensi resmi, source code, dan hosting aman terpercaya di Indonesia.',
    images: ['/assets/img/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD Schema.org Structured Data
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MarketPoint',
      url: siteUrl,
      description: 'Marketplace produk digital, lisensi resmi, dan source code terpercaya di Indonesia.',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'SiteNavigationElement',
          position: 1,
          name: 'Top Up & Tagihan',
          url: `${siteUrl}/topup`,
          description: 'Layanan top up game murah, pulsa, token PLN, dan tagihan digital instan.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 2,
          name: 'Promo & Voucher',
          url: `${siteUrl}/promo`,
          description: 'Pusat promo hemat, kupon diskon, dan voucher penawaran spesial.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 3,
          name: 'Login MarketPoint',
          url: `${siteUrl}/login`,
          description: 'Masuk ke akun MarketPoint untuk mengakses dashboard toko dan transaksi digital.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 4,
          name: 'About MarketPoint',
          url: `${siteUrl}/about`,
          description: 'Mengenal MarketPoint lebih dekat, platform produk digital terpercaya StarVale.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 5,
          name: 'Contact Support',
          url: `${siteUrl}/support`,
          description: 'Pusat bantuan resmi MarketPoint Care dan layanan pelanggan 24/7.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 6,
          name: 'Terms Of Service',
          url: `${siteUrl}/terms`,
          description: 'Syarat dan ketentuan layanan, aturan merchant, dan proteksi transaksi.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 7,
          name: 'Privacy Policy',
          url: `${siteUrl}/privacy`,
          description: 'Kebijakan privasi dan perlindungan data pribadi pengguna MarketPoint.',
        },
      ],
    },
  ];

  return (
    <html lang="id-ID" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <FirebaseClientProvider>
          <MaintenanceGuard>
            {children}
            <Toaster />
            <MarketBottomNav />
          </MaintenanceGuard>
        </FirebaseClientProvider>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
