import type { Metadata } from 'next';
import { TopUpClientWrapper } from './topup-client-wrapper';

export const metadata: Metadata = {
  title: 'Top Up & Tagihan',
  description: 'Layanan top up game murah, pulsa all operator, token listrik PLN, e-wallet, dan pembayaran tagihan digital instan di MarketPointID.',
  alternates: {
    canonical: '/topup',
  },
  openGraph: {
    title: 'Top Up & Tagihan | MarketPointID',
    description: 'Top up game, pulsa, dan tagihan digital termurah dengan proses otomatis 24 jam.',
    url: '/topup',
    type: 'website',
  },
};

export default function TopUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TopUpClientWrapper>{children}</TopUpClientWrapper>;
}
