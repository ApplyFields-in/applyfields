import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { CareerCategory, CareerDetail, CareerSummary } from '@applyfields/types';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Career Mode API (e2e)', { timeout: 60_000 }, () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /career/categories returns published career categories', async () => {
    const res = await request(app.getHttpServer()).get('/career/categories').expect(200);
    const categories = res.body as CareerCategory[];
    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(categories.some((c) => c.slug === 'tech-software')).toBe(true);
    expect(categories.some((c) => c.slug === 'civil-services')).toBe(true);
  });

  it('GET /career lists careers and filters by category', async () => {
    const res = await request(app.getHttpServer()).get('/career').expect(200);
    const careers = res.body as CareerSummary[];
    expect(careers.length).toBeGreaterThanOrEqual(4);

    const techRes = await request(app.getHttpServer()).get('/career?category=tech-software').expect(200);
    const techCareers = techRes.body as CareerSummary[];
    expect(techCareers.every((c) => c.category_slug === 'tech-software')).toBe(true);
  });

  it('GET /career/:slug returns full career detail including learning resources (platforms, books, videos)', async () => {
    const res = await request(app.getHttpServer()).get('/career/software-engineer').expect(200);
    const detail = res.body as CareerDetail;

    expect(detail.slug).toBe('software-engineer');
    expect(detail.title).toBe('Software Engineer');
    expect(detail.pathway_steps.length).toBeGreaterThan(0);

    // Verify user-requested learning resources
    expect(detail.learning_resources.length).toBeGreaterThanOrEqual(4);
    const platforms = detail.learning_resources.filter((r) => r.type === 'platform');
    const books = detail.learning_resources.filter((r) => r.type === 'book');
    const videos = detail.learning_resources.filter((r) => r.type === 'video');

    expect(platforms.length).toBeGreaterThan(0);
    expect(books.length).toBeGreaterThan(0);
    expect(videos.length).toBeGreaterThan(0);
  });

  it('Universal search indexes and finds careers', async () => {
    const res = await request(app.getHttpServer()).get('/search?q=Software').expect(200);
    expect(res.body.items.some((i: any) => i.url === '/career/software-engineer')).toBe(true);
  });

  it('Autocomplete suggests career titles', async () => {
    const res = await request(app.getHttpServer()).get('/search/suggest?q=Soft').expect(200);
    expect(res.body.suggestions).toContain('Software Engineer');
  });
});
