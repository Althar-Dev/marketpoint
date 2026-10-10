import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promo & Voucher',
  description: 'Pusat promo hemat, kupon diskon, voucher pengguna baru, dan penawaran spesial produk digital di MarketPoint.',
  alternates: {
    canonical: '/promo',
  },
  openGraph: {
    title: 'Promo | MarketPoint',
    description: 'Temukan kode voucher diskon dan penawaran hemat produk digital di MarketPoint.',
    url: '/promo',
    type: 'website',
  },
};

export default function PromoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
