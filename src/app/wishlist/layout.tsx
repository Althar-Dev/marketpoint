import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wishlist Saya',
  description: 'Daftar produk digital impian yang Anda simpan di MarketPointID. Akses cepat dan beli kapan saja dengan harga terbaik.',
  robots: {
    index: false, // Halaman privat pengguna tidak diindeks bot publik
    follow: false,
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
