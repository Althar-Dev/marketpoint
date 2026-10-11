import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Mengenal MarketPointID lebih dekat. Platform marketplace produk digital, software original, lisensi resmi, source code developer, dan top up digital terpercaya oleh StarVale Technology Solution.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'Tentang Kami | MarketPointID Indonesia',
    description: 'Pelajari visi, misi, dan ekosistem transaksi produk digital aman di MarketPointID.',
    url: '/about',
    type: 'website',
    images: [
      {
        url: '/assets/img/icon.png',
        width: 1200,
        height: 630,
        alt: 'Tentang MarketPointID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tentang Kami | MarketPointID Indonesia',
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
