import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Mengenal MarketPoint lebih dekat. Platform marketplace produk digital, software original, lisensi resmi, source code developer, dan top up digital terpercaya oleh StarVale Technology Solution.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Tentang Kami | MarketPoint Indonesia',
    description: 'Pelajari visi, misi, dan ekosistem transaksi produk digital aman di MarketPoint.',
    url: '/about',
    type: 'website',
    images: [
      {
        url: '/assets/img/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tentang MarketPoint',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tentang Kami | MarketPoint Indonesia',
    description: 'Platform marketplace produk digital, lisensi resmi, dan source code terpercaya di Indonesia.',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
