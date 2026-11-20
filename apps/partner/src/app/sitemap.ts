import type { MetadataRoute } from 'next';

const baseUrl = 'https://partners.applyfields.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/onboard`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/institution/onboard`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
