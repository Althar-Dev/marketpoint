import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan Privasi dan Perlindungan Data Pribadi MarketPointID. Pelajari bagaimana kami mengumpulkan, mengamankan, dan memproses data Anda sesuai UU PDP.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Kebijakan Privasi | MarketPointID',
    description: 'Komitmen perlindungan data pribadi pengguna, pembeli, dan mitra merchant di ekosistem MarketPointID.',
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
