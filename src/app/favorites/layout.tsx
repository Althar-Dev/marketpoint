import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Toko Favorit',
  description: 'Daftar toko dan merchant terpercaya yang Anda ikuti di MarketPoint. Dapatkan kabar rilis produk dan penawaran terbaru mereka.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
