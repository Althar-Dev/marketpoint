import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Sale & Promo',
  description: 'Serbu penawaran flash sale produk digital terbaik dengan diskon eksklusif dan kuota terbatas dari merchant resmi MarketPointID.',
  openGraph: {
    title: 'Flash Sale & Promo Spesial | MarketPointID',
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
