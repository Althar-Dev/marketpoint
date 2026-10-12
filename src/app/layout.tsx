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
    default: 'MarketPointID',
    template: '%s | MarketPointID',
  },
  description: 'Platform marketplace produk digital terpercaya di Indonesia. Beli software original, lisensi lifetime, source code aplikasi, hosting VPS, dan voucher digital dengan transaksi instan dan aman.',
  applicationName: 'MarketPointID',
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
    title: 'MarketPointID - Marketplace Produk Digital, Lisensi & Source Code Terpercaya',
    description: 'Beli software original, source code, hosting, dan aset digital terpercaya dengan garansi dan transaksi instan.',
    url: siteUrl,
    siteName: 'MarketPointID',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/assets/img/icon.png',
        width: 256,
        height: 256,
        type: 'image/png',
        alt: 'MarketPointID Digital Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'MarketPointID - Marketplace Produk Digital Terpercaya',
    description: 'Jual beli produk digital, lisensi resmi, source code, dan hosting aman terpercaya di Indonesia.',
    images: ['/assets/img/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
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
      '@type': 'Organization',
      name: 'MarketPointID',
      url: siteUrl,
      logo: `${siteUrl}/assets/img/logo.png`,
      image: `${siteUrl}/assets/img/icon.png`,
      description: 'Platform marketplace produk digital terpercaya di Indonesia.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MarketPointID',
      url: siteUrl,
      description: 'Marketplace produk digital, lisensi resmi, dan source code terpercaya di Indonesia.',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${siteUrl}/assets/img/icon.png`,
      },
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
          name: 'Login MarketPointID',
          url: `${siteUrl}/login`,
          description: 'Masuk ke akun MarketPointID untuk mengakses dashboard toko dan transaksi digital.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 4,
          name: 'About MarketPointID',
          url: `${siteUrl}/about`,
          description: 'Mengenal MarketPointID lebih dekat, platform produk digital terpercaya StarVale.',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 5,
          name: 'Contact Support',
          url: `${siteUrl}/support`,
          description: 'Pusat bantuan resmi MarketPointID Care dan layanan pelanggan 24/7.',
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
          description: 'Kebijakan privasi dan perlindungan data pribadi pengguna MarketPointID.',
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
