import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Transaksi',
  description: 'Pantau riwayat pembelian produk digital, status pembayaran, dan klaim lisensi pesanan Anda di MarketPoint.',
  alternates: {
    canonical: '/transactions',
  },
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
