import type { Metadata } from 'next';
import { SELLER_MODULES } from '../modules-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = SELLER_MODULES.find((m) => m.slug === slug);

  if (!mod) {
    return {
      title: 'Modul Edukasi Seller',
      description: 'Panduan lengkap dan kurikulum resmi penjual produk digital di MarketPoint.',
    };
  }

  return {
    title: `${mod.title} - Pusat Edukasi Seller`,
    description: mod.summary,
    alternates: {
      canonical: `/seller-edu/${mod.slug}`,
    },
    openGraph: {
      title: `${mod.title} | MarketPoint Seller Academy`,
      description: mod.summary,
      url: `/seller-edu/${mod.slug}`,
      type: 'article',
    },
  };
}

export default function ModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
