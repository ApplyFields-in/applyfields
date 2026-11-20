import type { MetadataRoute } from 'next';

// Only the public sign-up pages are crawlable; the operator desk stays private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/$', '/onboard', '/institution/onboard'],
      disallow: '/',
    },
    sitemap: 'https://partners.applyfields.com/sitemap.xml',
  };
}
