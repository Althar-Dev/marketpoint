import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms Of Service',
  description: 'Pedoman lengkap Ketentuan Layanan (Terms of Service), aturan transaksi produk digital, dan kebijakan perlindungan pengguna di MarketPointID.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Syarat & Ketentuan Layanan | MarketPointID',
    description: 'Panduan transparansi transaksi, aturan merchant, dan FAQ platform MarketPointID.',
    url: '/terms',
    type: 'website',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
