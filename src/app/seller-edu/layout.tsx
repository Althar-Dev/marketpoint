import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pusat Edukasi Seller',
  description: 'Panduan lengkap dan akademi resmi penjual MarketPointID. Pelajari cara membuka toko, upload produk digital, otomasi lisensi, strategi penjualan, dan manajemen payout.',
  alternates: {
    canonical: '/seller-edu',
  },
  openGraph: {
    title: 'Pusat Edukasi Seller | MarketPointID',
    description: 'Tingkatkan omset toko produk digital Anda dengan panduan dan strategi resmi dari MarketPointID.',
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
