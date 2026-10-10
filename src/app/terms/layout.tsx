import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms Of Service',
  description: 'Pedoman lengkap Ketentuan Layanan (Terms of Service), aturan transaksi produk digital, dan kebijakan perlindungan pengguna di MarketPoint.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Syarat & Ketentuan Layanan | MarketPoint',
    description: 'Panduan transparansi transaksi, aturan merchant, dan FAQ platform MarketPoint.',
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
