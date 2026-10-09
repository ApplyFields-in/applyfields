import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminCareerList,
  CareerCategory,
  CareerDetail,
  CareerSummary,
  UserCareerProfile,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const careerListQuerySchema = z.object({
  category: z.string().trim().optional(),
  stream: z.string().trim().optional(),
  q: z.string().trim().optional(),
});
export type CareerListQuery = z.infer<typeof careerListQuerySchema>;

export const userCareerProfileSchema = z.object({
  education_stage: z.string().trim().min(1),
  current_qualification: z.string().trim().optional().nullable(),
  subjects: z.array(z.string().trim()).default([]),
  interests: z.array(z.string().trim()).default([]),
  skills: z.array(z.string().trim()).default([]),
  career_interests: z.array(z.string().trim()).default([]),
  goals: z.string().trim().optional().nullable(),
  preferred_direction: z.string().trim().optional().nullable(),
});
export type UserCareerProfileDto = z.infer<typeof userCareerProfileSchema>;

export const adminCareerDtoSchema = z.object({
  category_id: z.string().uuid(),
  slug: z.string().trim().min(2),
  title: z.string().trim().min(2),
  summary: z.string().trim().min(5),
  what_it_involves: z.string().trim().optional().nullable(),
  education_required: z.string().trim().min(2),
  salary_text: z.string().trim().optional().nullable(),
  outlook_text: z.string().trim().optional().nullable(),
  learning_areas: z.array(z.string().trim()).default([]),
  skills: z.array(z.string().trim()).default([]),
  pros: z.array(z.string().trim()).default([]),
  cons: z.array(z.string().trim()).default([]),
  pathway_steps: z.array(z.any()).default([]),
  learning_resources: z.array(z.any()).default([]),
  linked_opportunities: z.array(z.any()).default([]),
  status: z.enum(['draft', 'under_review', 'published', 'archived']).default('published'),
});
export type AdminCareerDto = z.infer<typeof adminCareerDtoSchema>;

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  /** List published categories with count of careers in each */
  async getCategories(): Promise<CareerCategory[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        icon: string;
        sort_order: number;
        careers_count: number;
      }>
    >`
      select c.id::text, c.slug, c.name, c.description, c.icon, c.sort_order,
             count(cr.id)::int as careers_count
      from career_categories c
      left join careers cr on cr.category_id = c.id and cr.status = 'published'
      group by c.id, c.slug, c.name, c.description, c.icon, c.sort_order
      order by c.sort_order asc, c.name asc
    `;

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      icon: r.icon,
      sort_order: r.sort_order,
      careers_count: r.careers_count,
    }));
  }

  /** Explore published careers with optional category, stream, or search filter */
  async listCareers(f: CareerListQuery): Promise<CareerSummary[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        category_id: string;
        category_slug: string;
        category_name: string;
        category_icon: string;
        education_required: string;
        salary_text: string | null;
        outlook_text: string | null;
        skills: string[];
        resources_count: number;
      }>
    >`
      select c.id::text, c.slug, c.title, c.summary,
             cat.id::text as category_id, cat.slug as category_slug, cat.name as category_name, cat.icon as category_icon,
             c.education_required, c.salary_text, c.outlook_text, c.skills,
             jsonb_array_length(c.learning_resources)::int as resources_count
      from careers c
      join career_categories cat on cat.id = c.category_id
      where c.status = 'published'
        ${f.category ? Prisma.sql`and cat.slug = ${f.category}` : Prisma.empty}
        ${f.q ? Prisma.sql`and (c.title ilike ${`%${f.q}%`} or c.summary ilike ${`%${f.q}%`})` : Prisma.empty}
      order by c.views_count desc, c.title asc
    `;

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      category_id: r.category_id,
      category_slug: r.category_slug,
      category_name: r.category_name,
      category_icon: r.category_icon,
      education_required: r.education_required,
      salary_text: r.salary_text,
      outlook_text: r.outlook_text,
      skills: r.skills || [],
      resources_count: r.resources_count || 0,
    }));
  }

  /** Full career details by slug */
  async getCareerBySlug(slug: string): Promise<CareerDetail> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        what_it_involves: string | null;
        category_id: string;
        category_slug: string;
        category_name: string;
        category_icon: string;
        education_required: string;
        salary_text: string | null;
        outlook_text: string | null;
        learning_areas: string[];
        skills: string[];
        pros: string[];
        cons: string[];
        pathway_steps: any;
        learning_resources: any;
        linked_opportunities: any;
        views_count: number;
      }>
    >`
      select c.id::text, c.slug, c.title, c.summary, c.what_it_involves,
             cat.id::text as category_id, cat.slug as category_slug, cat.name as category_name, cat.icon as category_icon,
             c.education_required, c.salary_text, c.outlook_text, c.learning_areas, c.skills, c.pros, c.cons,
             c.pathway_steps, c.learning_resources, c.linked_opportunities, c.views_count
      from careers c
      join career_categories cat on cat.id = c.category_id
      where c.slug = ${slug} and c.status = 'published'
      limit 1
    `;

    if (rows.length === 0) {
      throw new NotFoundException(`Career "${slug}" not found`);
    }

    const r = rows[0];

    // Asynchronously increment view count
    this.prisma.$executeRaw`update careers set views_count = views_count + 1 where slug = ${slug}`.catch(() => {});

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      what_it_involves: r.what_it_involves,
      category_id: r.category_id,
      category_slug: r.category_slug,
      category_name: r.category_name,
      category_icon: r.category_icon,
      education_required: r.education_required,
      salary_text: r.salary_text,
      outlook_text: r.outlook_text,
      learning_areas: r.learning_areas || [],
      skills: r.skills || [],
      pros: r.pros || [],
      cons: r.cons || [],
      pathway_steps: r.pathway_steps || [],
      learning_resources: r.learning_resources || [],
      linked_opportunities: r.linked_opportunities || [],
      views_count: r.views_count,
      resources_count: Array.isArray(r.learning_resources) ? r.learning_resources.length : 0,
    };
  }

  /** Get user's career profile */
  async getUserCareerProfile(userId: string): Promise<UserCareerProfile | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        user_id: string;
        education_stage: string;
        current_qualification: string | null;
        subjects: string[];
        interests: string[];
        skills: string[];
        career_interests: string[];
        goals: string | null;
        preferred_direction: string | null;
      }>
    >`
      select user_id::text, education_stage, current_qualification, subjects,
             interests, skills, career_interests, goals, preferred_direction
      from career_profiles
      where user_id = ${userId}::uuid
      limit 1
    `;

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      user_id: r.user_id,
      education_stage: r.education_stage,
      current_qualification: r.current_qualification,
      subjects: r.subjects || [],
      interests: r.interests || [],
      skills: r.skills || [],
      career_interests: r.career_interests || [],
      goals: r.goals,
      preferred_direction: r.preferred_direction,
    };
  }

  /** Upsert user's career profile */
  async saveUserCareerProfile(userId: string, dto: UserCareerProfileDto): Promise<UserCareerProfile> {
    await this.prisma.$executeRaw`
      insert into career_profiles (
        user_id, education_stage, current_qualification, subjects,
        interests, skills, career_interests, goals, preferred_direction, updated_at
      )
      values (
        ${userId}::uuid,
        ${dto.education_stage},
        ${dto.current_qualification || null},
        ${dto.subjects}::text[],
        ${dto.interests}::text[],
        ${dto.skills}::text[],
        ${dto.career_interests}::text[],
        ${dto.goals || null},
        ${dto.preferred_direction || null},
        now()
      )
      on conflict (user_id) do update set
        education_stage = excluded.education_stage,
        current_qualification = excluded.current_qualification,
        subjects = excluded.subjects,
        interests = excluded.interests,
        skills = excluded.skills,
        career_interests = excluded.career_interests,
        goals = excluded.goals,
        preferred_direction = excluded.preferred_direction,
        updated_at = now()
    `;

    const saved = await this.getUserCareerProfile(userId);
    return saved!;
  }

  /** Recommendations based on student profile */
  async getRecommendedCareers(userId?: string): Promise<CareerSummary[]> {
    if (!userId) {
      return this.listCareers({});
    }

    const profile = await this.getUserCareerProfile(userId);
    if (!profile) {
      return this.listCareers({});
    }

    const all = await this.listCareers({});
    // Rank by matching interests or skills
    return all.sort((a, b) => {
      const aMatches = profile.interests.filter((i) =>
        a.title.toLowerCase().includes(i.toLowerCase()) || a.category_name.toLowerCase().includes(i.toLowerCase()),
      ).length;
      const bMatches = profile.interests.filter((i) =>
        b.title.toLowerCase().includes(i.toLowerCase()) || b.category_name.toLowerCase().includes(i.toLowerCase()),
      ).length;
      return bMatches - aMatches;
    });
  }

  /** Admin: List all careers (including drafts) */
  async adminListCareers(filters?: { q?: string; status?: string }): Promise<AdminCareerList> {
    const q = filters?.q?.trim().toLowerCase();
    const status = filters?.status?.trim();

    const allRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        category_name: string;
        status: string;
        views_count: number;
        resources_count: number;
        updated_at: string;
      }>
    >`
      select c.id::text, c.slug, c.title, coalesce(cat.name, 'General') as category_name,
             c.status::text as status, coalesce(c.views_count, 0)::int as views_count, c.updated_at::text,
             coalesce(jsonb_array_length(c.learning_resources), 0)::int as resources_count
      from careers c
      left join career_categories cat on cat.id = c.category_id
      order by c.updated_at desc
    `;

    const counts = {
      all: allRows.length,
      published: allRows.filter((r) => r.status === 'published').length,
      draft: allRows.filter((r) => r.status === 'draft').length,
      archived: allRows.filter((r) => r.status === 'archived').length,
    };

    let items = allRows;
    if (status) {
      items = items.filter((r) => r.status === status);
    }
    if (q) {
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.category_name.toLowerCase().includes(q),
      );
    }

    return {
      total: allRows.length,
      counts,
      items,
    };
  }

  /** Admin: Create career */
  async adminCreateCareer(dto: AdminCareerDto) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      insert into careers (
        category_id, slug, title, summary, what_it_involves, education_required,
        salary_text, outlook_text, learning_areas, skills, pros, cons,
        pathway_steps, learning_resources, linked_opportunities, status
      )
      values (
        ${dto.category_id}::uuid,
        ${dto.slug},
        ${dto.title},
        ${dto.summary},
        ${dto.what_it_involves || null},
        ${dto.education_required},
        ${dto.salary_text || null},
        ${dto.outlook_text || null},
        ${dto.learning_areas}::text[],
        ${dto.skills}::text[],
        ${dto.pros}::text[],
        ${dto.cons}::text[],
        ${JSON.stringify(dto.pathway_steps)}::jsonb,
        ${JSON.stringify(dto.learning_resources)}::jsonb,
        ${JSON.stringify(dto.linked_opportunities)}::jsonb,
        ${dto.status}::content_status
      )
      returning id::text
    `;
    return rows[0];
  }

  /** Admin: Update career */
  async adminUpdateCareer(id: string, dto: Partial<AdminCareerDto>) {
    await this.prisma.$executeRaw`
      update careers set
        title = coalesce(${dto.title}, title),
        summary = coalesce(${dto.summary}, summary),
        what_it_involves = coalesce(${dto.what_it_involves}, what_it_involves),
        education_required = coalesce(${dto.education_required}, education_required),
        salary_text = coalesce(${dto.salary_text}, salary_text),
        outlook_text = coalesce(${dto.outlook_text}, outlook_text),
        pathway_steps = coalesce(${dto.pathway_steps ? JSON.stringify(dto.pathway_steps) : null}::jsonb, pathway_steps),
        learning_resources = coalesce(${dto.learning_resources ? JSON.stringify(dto.learning_resources) : null}::jsonb, learning_resources),
        status = coalesce(${dto.status}::content_status, status),
        updated_at = now()
      where id = ${id}::uuid
    `;
    return { updated: true };
  }
}
