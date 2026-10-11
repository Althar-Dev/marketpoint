import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke akun MarketPointID Anda untuk mengakses dashboard toko, mengelola lisensi produk, dan transaksi digital dengan aman.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Login MarketPointID | Akses Akun & Toko Digital',
    description: 'Masuk ke akun MarketPointID Anda untuk mengelola transaksi, pesanan, dan toko digital.',
    url: '/login',
    type: 'website',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
