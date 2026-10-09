import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type {
  AskGuidanceResponse,
  CourseDetail,
  CourseSummary,
  InstitutionDetail,
  InstitutionSummary,
  RoadmapDetail,
  RoadmapSummary,
} from '@applyfields/types';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Session 12 API E2E (Roadmaps, Courses, Colleges, AI Guidance)', { timeout: 60_000 }, () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  // 1. Roadmaps
  it('GET /career/roadmaps lists roadmaps with steps and milestones count', async () => {
    const res = await request(app.getHttpServer()).get('/career/roadmaps').expect(200);
    const roadmaps = res.body as RoadmapSummary[];
    expect(roadmaps.length).toBeGreaterThanOrEqual(1);

    const seRoadmap = roadmaps.find((r) => r.slug === 'software-engineer-roadmap');
    expect(seRoadmap).toBeDefined();
    expect(seRoadmap?.steps_count).toBeGreaterThanOrEqual(8);
    expect(seRoadmap?.milestones_count).toBeGreaterThanOrEqual(4);
  });

  it('GET /career/roadmaps/:slug returns detailed roadmap with timeline steps and resources', async () => {
    const res = await request(app.getHttpServer())
      .get('/career/roadmaps/software-engineer-roadmap')
      .expect(200);

    const detail = res.body as RoadmapDetail;
    expect(detail.slug).toBe('software-engineer-roadmap');
    expect(detail.title).toContain('Software Engineer');
    expect(detail.steps.length).toBeGreaterThanOrEqual(8);

    // Check step properties
    const firstStep = detail.steps[0];
    expect(firstStep.stage).toBeDefined();
    expect(firstStep.kind).toBeDefined();
    expect(firstStep.title).toBeDefined();
    expect(Array.isArray(firstStep.resources)).toBe(true);

    // Progress default state for guest
    expect(detail.user_progress).toBeDefined();
    expect(detail.user_progress?.completion_percentage).toBe(0);
  });

  // 2. Courses Explorer
  it('GET /career/courses returns course list', async () => {
    const res = await request(app.getHttpServer()).get('/career/courses').expect(200);
    const courses = res.body as CourseSummary[];
    expect(courses.length).toBeGreaterThanOrEqual(4);

    expect(courses.some((c) => c.slug === 'btech-cse')).toBe(true);
    expect(courses.some((c) => c.slug === 'mbbs')).toBe(true);
  });

  it('GET /career/courses/:slug returns course with offering institutions and exit careers', async () => {
    const res = await request(app.getHttpServer())
      .get('/career/courses/btech-cse')
      .expect(200);

    const detail = res.body as CourseDetail;
    expect(detail.slug).toBe('btech-cse');
    expect(detail.name).toContain('Computer Science');
    expect(detail.skills_developed.length).toBeGreaterThan(0);

    // Offering institutions (IIT Madras, BITS Pilani)
    expect(detail.institutions.length).toBeGreaterThanOrEqual(2);
    expect(detail.institutions.some((i) => i.slug === 'iit-madras')).toBe(true);
    expect(detail.institutions.some((i) => i.slug === 'bits-pilani')).toBe(true);

    // Linked careers
    expect(detail.careers.length).toBeGreaterThanOrEqual(1);
    expect(detail.careers.some((c) => c.slug === 'software-engineer')).toBe(true);
  });

  // 3. Colleges & Compare
  it('GET /career/colleges lists premier institutions', async () => {
    const res = await request(app.getHttpServer()).get('/career/colleges').expect(200);
    const colleges = res.body as InstitutionSummary[];
    expect(colleges.length).toBeGreaterThanOrEqual(4);

    expect(colleges.some((c) => c.slug === 'iit-madras')).toBe(true);
    expect(colleges.some((c) => c.slug === 'aiims-new-delhi')).toBe(true);
  });

  it('GET /career/colleges/:slug returns institution details and placement stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/career/colleges/iit-madras')
      .expect(200);

    const detail = res.body as InstitutionDetail;
    expect(detail.slug).toBe('iit-madras');
    expect(detail.ranking_text).toContain('NIRF');
    expect(detail.placement_stats).toBeDefined();
    expect(detail.placement_stats.avg_package).toBeDefined();
    expect(detail.courses.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /career/colleges/compare returns side-by-side comparative matrix', async () => {
    const res = await request(app.getHttpServer())
      .get('/career/colleges/compare?slugs=iit-madras,bits-pilani')
      .expect(200);

    const list = res.body as InstitutionDetail[];
    expect(list.length).toBe(2);
    expect(list[0].slug).toBe('iit-madras');
    expect(list[1].slug).toBe('bits-pilani');
  });

  // 4. Grounded AI Guidance
  it('POST /career/guidance/ask returns grounded career advice with internal sources', async () => {
    const res = await request(app.getHttpServer())
      .post('/career/guidance/ask')
      .send({
        question: 'I completed 12th PCB without NEET, what biotechnology courses or careers can I pursue?',
      })
      .expect(201);

    const response = res.body as AskGuidanceResponse;
    expect(response.answer).toBeDefined();
    expect(response.answer.length).toBeGreaterThan(50);
    expect(Array.isArray(response.sources)).toBe(true);
    expect(response.sources.length).toBeGreaterThan(0);
  });
});
