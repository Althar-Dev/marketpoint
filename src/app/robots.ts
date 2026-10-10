import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketpoint.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/search',
          '/deals',
          '/topup',
          '/terms',
          '/privacy',
          '/support',
          '/blog',
          '/seller-edu',
          '/login',
          '/promo',
          '/products/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/my-shop/',
          '/checkout/',
          '/wallet/',
          '/settings/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
