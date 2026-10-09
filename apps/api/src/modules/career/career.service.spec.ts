import { describe, expect, it } from 'vitest';
import {
  adminCareerDtoSchema,
  careerListQuerySchema,
  userCareerProfileSchema,
} from './career.service.js';

describe('careerListQuerySchema', () => {
  it('parses valid query filters', () => {
    const res = careerListQuerySchema.parse({
      category: 'tech-software',
      q: 'engineer',
    });
    expect(res).toEqual({
      category: 'tech-software',
      q: 'engineer',
    });
  });

  it('allows empty params', () => {
    const res = careerListQuerySchema.parse({});
    expect(res).toEqual({});
  });
});

describe('userCareerProfileSchema', () => {
  it('validates and applies defaults', () => {
    const res = userCareerProfileSchema.parse({
      education_stage: '12th',
      interests: ['coding', 'algorithms'],
    });
    expect(res.education_stage).toBe('12th');
    expect(res.interests).toEqual(['coding', 'algorithms']);
    expect(res.skills).toEqual([]);
    expect(res.subjects).toEqual([]);
  });

  it('rejects missing education_stage', () => {
    expect(userCareerProfileSchema.safeParse({}).success).toBe(false);
  });
});

describe('adminCareerDtoSchema', () => {
  it('validates a complete career DTO with learning resources and pathways', () => {
    const validDto = {
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'ai-engineer',
      title: 'AI Engineer',
      summary: 'Design and deploy machine learning and generative AI architectures.',
      education_required: 'B.Tech / M.Tech in CS or AI',
      learning_resources: [
        {
          type: 'platform',
          title: 'Coursera Deep Learning Specialization',
          is_free: false,
        },
        {
          type: 'book',
          title: 'Deep Learning',
          provider_or_author: 'Ian Goodfellow',
        },
      ],
      pathway_steps: [
        { step: 1, title: 'Learn Python & Math' },
      ],
    };

    const res = adminCareerDtoSchema.parse(validDto);
    expect(res.slug).toBe('ai-engineer');
    expect(res.learning_resources).toHaveLength(2);
    expect(res.status).toBe('published');
  });

  it('rejects invalid uuid for category_id', () => {
    expect(
      adminCareerDtoSchema.safeParse({
        category_id: 'not-a-uuid',
        slug: 'bad',
        title: 'Bad',
        summary: 'Short',
        education_required: 'None',
      }).success,
    ).toBe(false);
  });
});
