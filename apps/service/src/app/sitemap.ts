import type { MetadataRoute } from 'next';
import { listDirectoryPartners } from '@/lib/api';

const baseUrl = 'https://service.applyfields.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
  ];

  // ponytail: one page of 100 (API max); page through `total` once there are more centres
  const { data } = await listDirectoryPartners({ limit: '100' });
  const centres: MetadataRoute.Sitemap = (data?.items ?? []).map((p) => ({
    url: `${baseUrl}/partner/${p.slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...centres];
}
