import type { MetadataRoute } from 'next';
import type { GovServiceList, OpportunityList } from '@applyfields/types';
import { apiGet } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://applyfields.in';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scholarships`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [opps, services] = await Promise.all([
      apiGet<OpportunityList>('/opportunities'),
      apiGet<GovServiceList>('/services'),
    ]);

    const oppRoutes: MetadataRoute.Sitemap = (opps?.items ?? []).map((item) => {
      let path = 'jobs';
      if (item.type === 'exam') path = 'exams';
      else if (item.type === 'scholarship') path = 'scholarships';
      else if (item.type === 'admission') path = 'admissions';

      return {
        url: `${baseUrl}/${path}/${item.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      };
    });

    const srvRoutes: MetadataRoute.Sitemap = (services?.items ?? []).map((srv) => ({
      url: `${baseUrl}/services/${srv.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...oppRoutes, ...srvRoutes];
  } catch {
    return staticRoutes;
  }
}
