import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Support',
  description: 'Pusat bantuan resmi MarketPointID Care. Dapatkan solusi kendala transaksi, panduan aktivasi lisensi, bantuan pengembalian dana, dan hubungi tim support kami.',
  alternates: {
    canonical: '/support',
  },
  openGraph: {
    title: 'MarketPointID Care | Pusat Bantuan & Dukungan Pelanggan',
    description: 'Solusi cepat untuk kendala transaksi digital, aktivasi lisensi, dan panduan toko di MarketPointID.',
    url: '/support',
    type: 'website',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
