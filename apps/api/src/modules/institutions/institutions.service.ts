import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CourseDetail,
  CourseSummary,
  InstitutionDetail,
  InstitutionSummary,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const courseListQuerySchema = z.object({
  q: z.string().trim().optional(),
  level: z.string().trim().optional(),
  stream: z.string().trim().optional(),
});
export type CourseListQuery = z.infer<typeof courseListQuerySchema>;

export const institutionListQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  state: z.string().trim().optional(),
});
export type InstitutionListQuery = z.infer<typeof institutionListQuerySchema>;

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // COURSES EXPLORER
  // =========================================================================

  /** List courses with search and filters */
  async listCourses(query: CourseListQuery): Promise<CourseSummary[]> {
    const q = query.q?.trim().toLowerCase();
    const level = query.level?.trim();
    const stream = query.stream?.trim();

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        level: string;
        stream: string | null;
        duration_months: number | null;
        min_qualification: string | null;
        skills_developed: string[];
        careers_count: number;
        colleges_count: number;
      }>
    >`
      select c.id::text, c.slug, c.name, c.short_name,
             c.level::text as level, c.stream, c.duration_months,
             c.min_qualification, c.skills_developed,
             count(distinct cc.career_id)::int as careers_count,
             count(distinct ic.institution_id)::int as colleges_count
      from courses c
      left join career_courses cc on cc.course_id = c.id
      left join institution_courses ic on ic.course_id = c.id
      where c.status = 'published'
        ${level ? Prisma.sql`and c.level = ${level}::course_level` : Prisma.empty}
        ${stream ? Prisma.sql`and c.stream ilike ${'%' + stream + '%'}` : Prisma.empty}
      group by c.id, c.slug, c.name, c.short_name, c.level, c.stream, c.duration_months, c.min_qualification, c.skills_developed
      order by c.created_at asc
    `;

    if (!q) {
      return rows as CourseSummary[];
    }

    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.short_name && c.short_name.toLowerCase().includes(q)) ||
        (c.stream && c.stream.toLowerCase().includes(q)) ||
        c.skills_developed.some((s) => s.toLowerCase().includes(q)),
    ) as CourseSummary[];
  }

  /** Get course details by slug with linked careers, exams, and offering institutions */
  async getCourseBySlug(slug: string): Promise<CourseDetail> {
    const cRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        level: string;
        stream: string | null;
        description: string | null;
        eligibility_text: string | null;
        min_qualification: string | null;
        duration_months: number | null;
        skills_developed: string[];
        career_outcomes: string | null;
      }>
    >`
      select id::text, slug, name, short_name, level::text as level, stream,
             description, eligibility_text, min_qualification, duration_months,
             skills_developed, career_outcomes
      from courses
      where slug = ${slug} and status = 'published'
      limit 1
    `;

    if (!cRows || cRows.length === 0) {
      throw new NotFoundException(`Course '${slug}' not found`);
    }

    const course = cRows[0];

    // Linked Careers
    const careers = await this.prisma.$queryRaw<
      Array<{ id: string; slug: string; title: string }>
    >`
      select cr.id::text, cr.slug, cr.title
      from careers cr
      join career_courses cc on cc.career_id = cr.id
      where cc.course_id = ${course.id}::uuid
    `;

    // Linked Entrance Exams
    const exams = await this.prisma.$queryRaw<
      Array<{ id: string; slug: string; title: string }>
    >`
      select e.id::text, e.slug, e.name as title
      from exams e
      join course_exams ce on ce.exam_id = e.id
      where ce.course_id = ${course.id}::uuid
    `;

    // Offering Colleges / Institutions
    const institutions = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        city: string | null;
        state_code: string | null;
        seats: number | null;
        fee_per_year: number | null;
        fees_text: string | null;
        admission_process: string | null;
      }>
    >`
      select i.id::text, i.slug, i.name, i.short_name, i.city, i.state_code,
             ic.seats, ic.fee_per_year, ic.fees_text, ic.admission_process
      from institutions i
      join institution_courses ic on ic.institution_id = i.id
      where ic.course_id = ${course.id}::uuid and i.status = 'published'
      order by i.created_at asc
    `;

    return {
      id: course.id,
      slug: course.slug,
      name: course.name,
      short_name: course.short_name,
      level: course.level as any,
      stream: course.stream,
      duration_months: course.duration_months,
      min_qualification: course.min_qualification,
      skills_developed: course.skills_developed || [],
      description: course.description,
      eligibility_text: course.eligibility_text,
      career_outcomes: course.career_outcomes,
      careers,
      exams,
      institutions,
      careers_count: careers.length,
      colleges_count: institutions.length,
    };
  }

  // =========================================================================
  // COLLEGES & UNIVERSITIES
  // =========================================================================

  /** List colleges/universities with filters */
  async listInstitutions(query: InstitutionListQuery): Promise<InstitutionSummary[]> {
    const q = query.q?.trim().toLowerCase();
    const type = query.type?.trim();
    const state = query.state?.trim().toUpperCase();

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        type: string;
        ownership: string | null;
        state_code: string | null;
        city: string | null;
        district: string | null;
        website: string | null;
        ranking_text: string | null;
        fees_text: string | null;
        accreditation: any;
        placement_stats: any;
        courses_count: number;
      }>
    >`
      select i.id::text, i.slug, i.name, i.short_name,
             i.type::text as type, i.ownership::text as ownership,
             i.state_code, i.city, i.district, i.website,
             i.ranking_text, i.fees_text,
             i.accreditation, i.placement_stats,
             count(distinct ic.course_id)::int as courses_count
      from institutions i
      left join institution_courses ic on ic.institution_id = i.id
      where i.status = 'published'
        ${type ? Prisma.sql`and i.type = ${type}::institution_type` : Prisma.empty}
        ${state ? Prisma.sql`and i.state_code = ${state}` : Prisma.empty}
      group by i.id, i.slug, i.name, i.short_name, i.type, i.ownership, i.state_code, i.city, i.district, i.website, i.ranking_text, i.fees_text, i.accreditation, i.placement_stats
      order by i.created_at asc
    `;

    if (!q) {
      return rows as InstitutionSummary[];
    }

    return rows.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.short_name && i.short_name.toLowerCase().includes(q)) ||
        (i.city && i.city.toLowerCase().includes(q)) ||
        (i.ranking_text && i.ranking_text.toLowerCase().includes(q)),
    ) as InstitutionSummary[];
  }

  /** Get institution details by slug */
  async getInstitutionBySlug(slug: string): Promise<InstitutionDetail> {
    const iRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        type: string;
        ownership: string | null;
        state_code: string | null;
        city: string | null;
        district: string | null;
        website: string | null;
        ranking_text: string | null;
        fees_text: string | null;
        accreditation: any;
        placement_stats: any;
        description: string | null;
        established_year: number | null;
        campus_facilities: string[];
      }>
    >`
      select id::text, slug, name, short_name, type::text as type, ownership::text as ownership,
             state_code, city, district, website, ranking_text, fees_text,
             accreditation, placement_stats, description, established_year,
             campus_facilities
      from institutions
      where slug = ${slug} and status = 'published'
      limit 1
    `;

    if (!iRows || iRows.length === 0) {
      throw new NotFoundException(`Institution '${slug}' not found`);
    }

    const inst = iRows[0];

    // Programs offered
    const courses = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        level: string;
        seats: number | null;
        fee_per_year: number | null;
        fees_text: string | null;
        admission_process: string | null;
      }>
    >`
      select c.id::text, c.slug, c.name, c.short_name, c.level::text as level,
             ic.seats, ic.fee_per_year, ic.fees_text, ic.admission_process
      from courses c
      join institution_courses ic on ic.course_id = c.id
      where ic.institution_id = ${inst.id}::uuid and c.status = 'published'
      order by c.created_at asc
    `;

    return {
      id: inst.id,
      slug: inst.slug,
      name: inst.name,
      short_name: inst.short_name,
      type: inst.type,
      ownership: inst.ownership,
      state_code: inst.state_code,
      city: inst.city,
      district: inst.district,
      website: inst.website,
      ranking_text: inst.ranking_text,
      fees_text: inst.fees_text,
      accreditation: inst.accreditation || {},
      placement_stats: inst.placement_stats || {},
      description: inst.description,
      established_year: inst.established_year,
      campus_facilities: inst.campus_facilities || [],
      courses,
      courses_count: courses.length,
    };
  }

  /** Side-by-Side Comparison of 2-4 institutions */
  async compareInstitutions(slugsOrIds: string[]): Promise<InstitutionDetail[]> {
    const list: InstitutionDetail[] = [];
    for (const item of slugsOrIds) {
      try {
        const detail = await this.getInstitutionBySlug(item);
        list.push(detail);
      } catch {
        // try ID lookup
        const row = await this.prisma.$queryRaw<Array<{ slug: string }>>`
          select slug from institutions where id = ${item}::uuid limit 1
        `;
        if (row && row.length > 0) {
          const detail = await this.getInstitutionBySlug(row[0].slug);
          list.push(detail);
        }
      }
    }
    return list;
  }
}
