import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Sale & Promo Produk Digital',
  description: 'Serbu penawaran flash sale produk digital terbaik dengan diskon eksklusif dan kuota terbatas dari merchant resmi MarketPoint.',
  openGraph: {
    title: 'Flash Sale & Promo Spesial | MarketPoint',
    description: 'Diskon kilat produk digital pilihan setiap hari dengan kuota terbatas.',
  },
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
