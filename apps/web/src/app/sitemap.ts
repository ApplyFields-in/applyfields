import type { MetadataRoute } from 'next';
import type {
  CareerSummary,
  CourseSummary,
  GovServiceList,
  OpportunityList,
  RoadmapSummary,
} from '@applyfields/types';
import { apiGet } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://applyfields.com';

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
    ...['/career', '/career/courses', '/career/colleges', '/career/roadmaps', '/career/skills'].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [opps, services, careers, courses, roadmaps, colleges] = await Promise.all([
      apiGet<OpportunityList>('/opportunities'),
      apiGet<GovServiceList>('/services'),
      apiGet<CareerSummary[]>('/career'),
      apiGet<CourseSummary[]>('/career/courses'),
      apiGet<RoadmapSummary[]>('/career/roadmaps'),
      apiGet<string[]>('/career/colleges/slugs'),
    ]);

    const careerRoute = (path: string, slug: string): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}/career/${path}${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
    const careerRoutes: MetadataRoute.Sitemap = [
      ...(careers ?? []).map((c) => careerRoute('', c.slug)),
      ...(courses ?? []).map((c) => careerRoute('courses/', c.slug)),
      ...(roadmaps ?? []).map((r) => careerRoute('roadmaps/', r.slug)),
      ...(colleges ?? []).map((slug) => careerRoute('colleges/', slug)),
    ];

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

    return [...staticRoutes, ...oppRoutes, ...srvRoutes, ...careerRoutes];
  } catch {
    return staticRoutes;
  }
}

