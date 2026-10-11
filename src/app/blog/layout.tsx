import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artikel, panduan jualan produk digital, update teknologi, dan tips seputar software serta lisensi resmi di MarketPointID.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog | MarketPointID',
    description: 'Wawasan terkini seputar produk digital, teknologi developer, dan panduan seller.',
    url: '/blog',
    type: 'website',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
