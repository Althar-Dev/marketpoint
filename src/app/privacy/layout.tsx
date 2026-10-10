import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Kebijakan Privasi (Privacy Policy) dan Perlindungan Data Pribadi MarketPoint. Pelajari bagaimana kami mengumpulkan, mengamankan, dan memproses data Anda sesuai UU PDP.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Kebijakan Privasi | MarketPoint Indonesia',
    description: 'Komitmen perlindungan data pribadi pengguna, pembeli, dan mitra merchant di ekosistem MarketPoint.',
    url: '/privacy',
    type: 'website',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
