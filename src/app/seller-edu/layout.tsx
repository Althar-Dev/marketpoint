import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pusat Edukasi Seller',
  description: 'Panduan lengkap dan akademi resmi penjual MarketPoint. Pelajari cara membuka toko, upload produk digital, otomasi lisensi, strategi penjualan, dan manajemen payout.',
  alternates: {
    canonical: '/seller-edu',
  },
  openGraph: {
    title: 'Pusat Edukasi Seller | MarketPoint',
    description: 'Tingkatkan omset toko produk digital Anda dengan panduan dan strategi resmi dari MarketPoint.',
    url: '/seller-edu',
    type: 'website',
  },
};

export default function SellerEduLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
