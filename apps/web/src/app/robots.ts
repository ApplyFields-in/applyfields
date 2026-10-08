import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://applyfields.in';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/jobs', '/exams', '/scholarships', '/admissions', '/services', '/help'],
      disallow: ['/account', '/profile', '/notifications', '/saved', '/applications', '/documents'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
