import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/partner/'],
      disallow: ['/bookings', '/checkout', '/desk', '/login', '/my-bookings'],
    },
    sitemap: 'https://service.applyfields.com/sitemap.xml',
  };
}
