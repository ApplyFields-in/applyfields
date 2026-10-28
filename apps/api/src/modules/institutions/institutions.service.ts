import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CourseDetail,
  CourseSummary,
  CreateInstitutionEnquiryInput,
  InstitutionDetail,
  InstitutionEnquiry,
  InstitutionEnquiryListResponse,
  InstitutionEnquiryStatus,
  InstitutionListResponse,
  InstitutionPartnerProfile,
  InstitutionSummary,
  RespondInstitutionEnquiryInput,
  UpdateInstitutionProfileInput,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { enquiry_status } from '../../generated/prisma/enums.js';

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
  stream: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type InstitutionListQuery = z.infer<typeof institutionListQuerySchema>;

export const adminInstitutionQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  state: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminInstitutionQuery = z.infer<typeof adminInstitutionQuerySchema>;

export const adminCreateInstitutionSchema = z.object({
  name: z.string().trim().min(2).max(250),
  short_name: z.string().trim().max(50).optional().nullable(),
  slug: z.string().trim().max(100).optional().nullable(),
  type: z.enum(['college', 'university', 'institute', 'school', 'training_centre']).default('college'),
  ownership: z.enum(['government', 'private', 'deemed', 'autonomous', 'aided']).default('private'),
  state_code: z.string().trim().regex(/^[A-Z]{2}$/, 'Must be 2-letter uppercase state code').optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be 6-digit postal code').optional().nullable(),
  website: z.string().trim().optional().nullable(),
  ranking_text: z.string().trim().max(200).optional().nullable(),
  fees_text: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(3000).optional().nullable(),
  established_year: z.coerce.number().int().min(1800).max(2030).optional().nullable(),
  accreditation: z.record(z.string(), z.any()).optional().default({}),
  placement_stats: z.object({
    highest_package: z.string().optional(),
    avg_package: z.string().optional(),
    top_recruiters: z.array(z.string()).optional(),
  }).optional().default({ highest_package: 'Data not given', avg_package: 'Data not given', top_recruiters: [] }),
  campus_facilities: z.array(z.string()).optional().default([]),
  contact_email: z.string().trim().email().optional().or(z.literal('')).nullable(),
  contact_phone: z.string().trim().optional().or(z.literal('')).nullable(),
  status: z.enum(['draft', 'published', 'closed', 'archived']).default('published'),
});
export type AdminCreateInstitutionInput = z.infer<typeof adminCreateInstitutionSchema>;

export const adminUpdateInstitutionSchema = adminCreateInstitutionSchema.partial();
export type AdminUpdateInstitutionInput = z.infer<typeof adminUpdateInstitutionSchema>;

export const createInstitutionEnquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  course_id: z.string().uuid().optional().or(z.literal('')),
  message: z.string().trim().min(5).max(1000),
});

export const respondInstitutionEnquirySchema = z.object({
  status: z.enum(['new', 'responded', 'closed']),
  response: z.string().trim().min(2).max(1000),
});

export const updateInstitutionProfileSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  short_name: z.string().trim().max(50).optional().or(z.literal('')),
  website: z.string().trim().url().optional().or(z.literal('')),
  contact_email: z.string().trim().email().optional().or(z.literal('')),
  contact_phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/).optional().or(z.literal('')),
  fees_text: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

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

  /** List colleges/universities with filters & pagination (default 20 per page) */
  async listInstitutions(query: InstitutionListQuery): Promise<InstitutionListResponse> {
    const q = query.q?.trim().toLowerCase();
    const type = query.type?.trim();
    const state = query.state?.trim().toUpperCase();
    const stream = (query.stream || query.category)?.trim().toLowerCase();
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    let streamSql = Prisma.empty;
    if (stream === 'top-50-engg' || stream === 'top-50' || stream === 'top-50-engineering') {
      streamSql = Prisma.sql`and (i.accreditation->>'nirf_rank') is not null and coalesce(i.accreditation->>'nirf_category', 'Engineering') = 'Engineering'`;
    } else if (stream === 'management' || stream === 'mba' || stream === 'business') {
      streamSql = Prisma.sql`and (i.name ilike '%management%' or i.name ilike '%business%' or i.name ilike '%mba%')`;
    } else if (stream === 'polytechnic' || stream === 'diploma') {
      streamSql = Prisma.sql`and (i.name ilike '%polytechnic%' or i.name ilike '%diploma%')`;
    } else if (stream === 'architecture' || stream === 'planning' || stream === 'town-planning') {
      streamSql = Prisma.sql`and (i.name ilike '%architecture%' or i.name ilike '%planning%' or i.name ilike '%design%')`;
    } else if (stream === 'pharmacy') {
      streamSql = Prisma.sql`and (i.name ilike '%pharmacy%' or i.name ilike '%pharm%')`;
    } else if (stream === 'medical' || stream === 'top-50-medical' || stream === 'top-50-med') {
      streamSql = Prisma.sql`and ((i.accreditation->>'nirf_category') = 'Medical' or i.name ilike '%medical%' or i.name ilike '%dental%' or i.name ilike '%nursing%' or i.name ilike '%health%')`;
    }

    const countRows = await this.prisma.$queryRaw<Array<{ total: number }>>`
      select count(*)::int as total
      from institutions i
      where i.status = 'published'
        ${type ? Prisma.sql`and i.type = ${type}::institution_type` : Prisma.empty}
        ${state ? Prisma.sql`and i.state_code = ${state}` : Prisma.empty}
        ${streamSql}
        ${
          q
            ? Prisma.sql`and (
                i.name ilike ${'%' + q + '%'} or
                coalesce(i.short_name, '') ilike ${'%' + q + '%'} or
                coalesce(i.city, '') ilike ${'%' + q + '%'} or
                coalesce(i.district, '') ilike ${'%' + q + '%'} or
                coalesce(i.ranking_text, '') ilike ${'%' + q + '%'}
              )`
            : Prisma.empty
        }
    `;
    const total = countRows[0]?.total ?? 0;

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
        description: string | null;
        established_year: number | null;
        accreditation: any;
        placement_stats: any;
        courses_count: number;
      }>
    >`
      select i.id::text, i.slug, i.name, i.short_name,
             i.type::text as type, i.ownership::text as ownership,
             i.state_code, i.city, i.district, i.website,
             i.ranking_text, i.fees_text,
             i.description, i.established_year,
             i.accreditation, i.placement_stats,
             count(distinct ic.course_id)::int as courses_count
      from institutions i
      left join institution_courses ic on ic.institution_id = i.id
      where i.status = 'published'
        ${type ? Prisma.sql`and i.type = ${type}::institution_type` : Prisma.empty}
        ${state ? Prisma.sql`and i.state_code = ${state}` : Prisma.empty}
        ${streamSql}
        ${
          q
            ? Prisma.sql`and (
                i.name ilike ${'%' + q + '%'} or
                coalesce(i.short_name, '') ilike ${'%' + q + '%'} or
                coalesce(i.city, '') ilike ${'%' + q + '%'} or
                coalesce(i.district, '') ilike ${'%' + q + '%'} or
                coalesce(i.ranking_text, '') ilike ${'%' + q + '%'}
              )`
            : Prisma.empty
        }
      group by i.id, i.slug, i.name, i.short_name, i.type, i.ownership, i.state_code, i.city, i.district, i.website, i.ranking_text, i.fees_text, i.description, i.established_year, i.accreditation, i.placement_stats
      order by
        case
          when coalesce((i.accreditation->>'nirf_rank')::int, 9999) < 9999 then 1
          when i.ranking_text like 'NIRF%' then 2
          when i.ranking_text like 'NBA%' then 3
          else 4
        end asc,
        coalesce((i.accreditation->>'nirf_rank')::int, 9999) asc,
        i.created_at asc
      limit ${limit}
      offset ${offset}
    `;

    return {
      items: rows as InstitutionSummary[],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
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
    const results = await Promise.all(
      slugsOrIds.map(async (item) => {
        try {
          return await this.getInstitutionBySlug(item);
        } catch {
          // try ID lookup
          const row = await this.prisma.$queryRaw<Array<{ slug: string }>>`
            select slug from institutions where id = ${item}::uuid limit 1
          `;
          if (row && row.length > 0) {
            return await this.getInstitutionBySlug(row[0].slug);
          }
          return null;
        }
      }),
    );
    return results.filter((d): d is InstitutionDetail => d !== null);
  }

  // =========================================================================
  // MODULE 3: STUDENT ADMISSION INQUIRIES & PARTNER COLLEGE DESK
  // =========================================================================

  /** Helper: resolve partner's linked institution ID */
  private async getLinkedInstitutionId(userId: string): Promise<string> {
    const pRows = await this.prisma.$queryRaw<
      Array<{ partner_id: string; institution_id: string | null }>
    >`
      select id::text as partner_id, institution_id::text
      from partners
      where user_id = ${userId}::uuid and type = 'college'
      limit 1
    `;

    if (!pRows || pRows.length === 0 || !pRows[0].institution_id) {
      throw new ForbiddenException(
        'You are not registered as a verified college institution partner desk',
      );
    }
    return pRows[0].institution_id;
  }

  /** Helper: get institution profile with metrics */
  private async getInstitutionPartnerProfileById(
    institutionId: string,
  ): Promise<InstitutionPartnerProfile> {
    const iRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        name: string;
        short_name: string | null;
        type: string;
        ownership: string | null;
        website: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        fees_text: string | null;
        description: string | null;
        established_year: number | null;
      }>
    >`
      select id::text, slug, name, short_name, type::text as type,
             ownership::text as ownership, website, contact_email, contact_phone,
             fees_text, description, established_year
      from institutions
      where id = ${institutionId}::uuid
      limit 1
    `;

    if (!iRows || iRows.length === 0) {
      throw new NotFoundException('Institution profile not found');
    }
    const inst = iRows[0];

    const countEnquiries = await this.prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as count
      from institution_enquiries
      where institution_id = ${institutionId}::uuid
    `;
    const countCourses = await this.prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as count
      from institution_courses
      where institution_id = ${institutionId}::uuid
    `;

    return {
      id: inst.id,
      slug: inst.slug,
      name: inst.name,
      short_name: inst.short_name,
      type: inst.type,
      ownership: inst.ownership,
      website: inst.website,
      contact_email: inst.contact_email,
      contact_phone: inst.contact_phone,
      fees_text: inst.fees_text,
      description: inst.description,
      established_year: inst.established_year,
      enquiries_count: countEnquiries[0]?.count ?? 0,
      courses_count: countCourses[0]?.count ?? 0,
    };
  }

  /** Submit student admission inquiry to a college */
  async createEnquiry(
    slug: string,
    userId: string | null,
    rawInput: unknown,
  ): Promise<InstitutionEnquiry> {
    const input = createInstitutionEnquirySchema.parse(rawInput);

    const instRows = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; slug: string }>
    >`
      select id::text, name, slug
      from institutions
      where slug = ${slug} and status = 'published'
      limit 1
    `;

    if (!instRows || instRows.length === 0) {
      throw new NotFoundException(`Institution '${slug}' not found`);
    }
    const inst = instRows[0];

    let courseName: string | null = null;
    const courseId = input.course_id && input.course_id.length > 0 ? input.course_id : null;
    if (courseId) {
      const cRows = await this.prisma.$queryRaw<Array<{ id: string; name: string }>>`
        select id::text, name from courses where id = ${courseId}::uuid limit 1
      `;
      if (!cRows || cRows.length === 0) {
        throw new NotFoundException('Selected course not found');
      }
      courseName = cRows[0].name;
    }

    const email = input.email && input.email.length > 0 ? input.email : null;

    const inserted = await this.prisma.$queryRaw<
      Array<{
        id: string;
        institution_id: string;
        user_id: string | null;
        course_id: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        message: string;
        status: string;
        response: string | null;
        responded_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      insert into institution_enquiries (
        institution_id,
        user_id,
        course_id,
        name,
        phone,
        email,
        message,
        status
      ) values (
        ${inst.id}::uuid,
        ${userId ? Prisma.sql`${userId}::uuid` : Prisma.sql`null`},
        ${courseId ? Prisma.sql`${courseId}::uuid` : Prisma.sql`null`},
        ${input.name},
        ${input.phone},
        ${email},
        ${input.message},
        'new'
      )
      returning id::text, institution_id::text, user_id::text, course_id::text,
                name, phone, email, message, status::text, response,
                responded_at, created_at, updated_at
    `;

    const row = inserted[0];
    return {
      id: row.id,
      institution_id: row.institution_id,
      institution_name: inst.name,
      institution_slug: inst.slug,
      user_id: row.user_id,
      course_id: row.course_id,
      course_name: courseName,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      status: row.status as InstitutionEnquiryStatus,
      response: row.response,
      responded_at: row.responded_at ? new Date(row.responded_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  /** List citizen's inquiries */
  async listUserEnquiries(userId: string): Promise<InstitutionEnquiryListResponse> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        institution_id: string;
        institution_name: string;
        institution_slug: string;
        user_id: string | null;
        course_id: string | null;
        course_name: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        message: string;
        status: string;
        response: string | null;
        responded_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select e.id::text, e.institution_id::text, i.name as institution_name, i.slug as institution_slug,
             e.user_id::text, e.course_id::text, c.name as course_name,
             e.name, e.phone, e.email, e.message, e.status::text as status,
             e.response, e.responded_at, e.created_at, e.updated_at
      from institution_enquiries e
      join institutions i on i.id = e.institution_id
      left join courses c on c.id = e.course_id
      where e.user_id = ${userId}::uuid
      order by e.created_at desc
    `;

    return {
      total: rows.length,
      items: rows.map((r) => ({
        id: r.id,
        institution_id: r.institution_id,
        institution_name: r.institution_name,
        institution_slug: r.institution_slug,
        user_id: r.user_id,
        course_id: r.course_id,
        course_name: r.course_name,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message,
        status: r.status as InstitutionEnquiryStatus,
        response: r.response,
        responded_at: r.responded_at ? new Date(r.responded_at).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      })),
    };
  }

  /** Partner institution desk profile */
  async getPartnerInstitutionDesk(userId: string): Promise<InstitutionPartnerProfile> {
    const institutionId = await this.getLinkedInstitutionId(userId);
    return this.getInstitutionPartnerProfileById(institutionId);
  }

  /** Partner institution desk profile update */
  async updatePartnerInstitutionDesk(
    userId: string,
    rawInput: unknown,
  ): Promise<InstitutionPartnerProfile> {
    const input = updateInstitutionProfileSchema.parse(rawInput);
    const institutionId = await this.getLinkedInstitutionId(userId);

    await this.prisma.$executeRaw`
      update institutions
      set name = coalesce(${input.name ?? null}, name),
          short_name = coalesce(${input.short_name || null}, short_name),
          website = coalesce(${input.website || null}, website),
          contact_email = coalesce(${input.contact_email || null}, contact_email),
          contact_phone = coalesce(${input.contact_phone || null}, contact_phone),
          fees_text = coalesce(${input.fees_text || null}, fees_text),
          description = coalesce(${input.description || null}, description),
          updated_at = now()
      where id = ${institutionId}::uuid
    `;

    return this.getInstitutionPartnerProfileById(institutionId);
  }

  /** Partner institution inquiries desk */
  async listPartnerEnquiries(
    userId: string,
    status?: string,
  ): Promise<InstitutionEnquiryListResponse> {
    const institutionId = await this.getLinkedInstitutionId(userId);

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        institution_id: string;
        institution_name: string;
        institution_slug: string;
        user_id: string | null;
        course_id: string | null;
        course_name: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        message: string;
        status: string;
        response: string | null;
        responded_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select e.id::text, e.institution_id::text, i.name as institution_name, i.slug as institution_slug,
             e.user_id::text, e.course_id::text, c.name as course_name,
             e.name, e.phone, e.email, e.message, e.status::text as status,
             e.response, e.responded_at, e.created_at, e.updated_at
      from institution_enquiries e
      join institutions i on i.id = e.institution_id
      left join courses c on c.id = e.course_id
      where e.institution_id = ${institutionId}::uuid
        ${status ? Prisma.sql`and e.status = ${status}::enquiry_status` : Prisma.empty}
      order by e.created_at desc
    `;

    return {
      total: rows.length,
      items: rows.map((r) => ({
        id: r.id,
        institution_id: r.institution_id,
        institution_name: r.institution_name,
        institution_slug: r.institution_slug,
        user_id: r.user_id,
        course_id: r.course_id,
        course_name: r.course_name,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message,
        status: r.status as InstitutionEnquiryStatus,
        response: r.response,
        responded_at: r.responded_at ? new Date(r.responded_at).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      })),
    };
  }

  /** Respond to student inquiry by partner desk */
  async respondToPartnerEnquiry(
    userId: string,
    enquiryId: string,
    rawInput: unknown,
  ): Promise<InstitutionEnquiry> {
    const input = respondInstitutionEnquirySchema.parse(rawInput);
    const institutionId = await this.getLinkedInstitutionId(userId);

    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      select id::text from institution_enquiries
      where id = ${enquiryId}::uuid and institution_id = ${institutionId}::uuid
      limit 1
    `;
    if (!existing || existing.length === 0) {
      throw new NotFoundException('Enquiry not found for your institution desk');
    }

    await this.prisma.$executeRaw`
      update institution_enquiries
      set status = ${input.status}::enquiry_status,
          response = ${input.response},
          responded_at = now(),
          updated_at = now()
      where id = ${enquiryId}::uuid
    `;

    const updatedRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        institution_id: string;
        institution_name: string;
        institution_slug: string;
        user_id: string | null;
        course_id: string | null;
        course_name: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        message: string;
        status: string;
        response: string | null;
        responded_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select e.id::text, e.institution_id::text, i.name as institution_name, i.slug as institution_slug,
             e.user_id::text, e.course_id::text, c.name as course_name,
             e.name, e.phone, e.email, e.message, e.status::text as status,
             e.response, e.responded_at, e.created_at, e.updated_at
      from institution_enquiries e
      join institutions i on i.id = e.institution_id
      left join courses c on c.id = e.course_id
      where e.id = ${enquiryId}::uuid
      limit 1
    `;

    const r = updatedRows[0];
    return {
      id: r.id,
      institution_id: r.institution_id,
      institution_name: r.institution_name,
      institution_slug: r.institution_slug,
      user_id: r.user_id,
      course_id: r.course_id,
      course_name: r.course_name,
      name: r.name,
      phone: r.phone,
      email: r.email,
      message: r.message,
      status: r.status as InstitutionEnquiryStatus,
      response: r.response,
      responded_at: r.responded_at ? new Date(r.responded_at).toISOString() : null,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString(),
    };
  }

  /** Staff oversight: list all enquiries across colleges */
  async adminListEnquiries(query: {
    institutionId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InstitutionEnquiryListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const countRows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as count
      from institution_enquiries e
      where 1=1
        ${query.institutionId ? Prisma.sql`and e.institution_id = ${query.institutionId}::uuid` : Prisma.empty}
        ${query.status ? Prisma.sql`and e.status = ${query.status}::enquiry_status` : Prisma.empty}
    `;
    const total = countRows[0]?.count ?? 0;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        institution_id: string;
        institution_name: string;
        institution_slug: string;
        user_id: string | null;
        course_id: string | null;
        course_name: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        message: string;
        status: string;
        response: string | null;
        responded_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select e.id::text, e.institution_id::text, i.name as institution_name, i.slug as institution_slug,
             e.user_id::text, e.course_id::text, c.name as course_name,
             e.name, e.phone, e.email, e.message, e.status::text as status,
             e.response, e.responded_at, e.created_at, e.updated_at
      from institution_enquiries e
      join institutions i on i.id = e.institution_id
      left join courses c on c.id = e.course_id
      where 1=1
        ${query.institutionId ? Prisma.sql`and e.institution_id = ${query.institutionId}::uuid` : Prisma.empty}
        ${query.status ? Prisma.sql`and e.status = ${query.status}::enquiry_status` : Prisma.empty}
      order by e.created_at desc
      limit ${limit} offset ${offset}
    `;

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        institution_id: r.institution_id,
        institution_name: r.institution_name,
        institution_slug: r.institution_slug,
        user_id: r.user_id,
        course_id: r.course_id,
        course_name: r.course_name,
        name: r.name,
        phone: r.phone,
        email: r.email,
        message: r.message,
        status: r.status as InstitutionEnquiryStatus,
        response: r.response,
        responded_at: r.responded_at ? new Date(r.responded_at).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      })),
    };
  }

  // =========================================================================
  // ADMIN INSTITUTION MANAGEMENT
  // =========================================================================

  /** Admin list institutions with filters, search, and pagination */
  async adminListInstitutions(query: AdminInstitutionQuery): Promise<InstitutionListResponse> {
    const q = query.q?.trim().toLowerCase();
    const type = query.type?.trim();
    const state = query.state?.trim().toUpperCase();
    const status = query.status?.trim();
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const countRows = await this.prisma.$queryRaw<Array<{ total: number }>>`
      select count(*)::int as total
      from institutions i
      where 1=1
        ${status ? Prisma.sql`and i.status = ${status}::content_status` : Prisma.empty}
        ${type ? Prisma.sql`and i.type = ${type}::institution_type` : Prisma.empty}
        ${state ? Prisma.sql`and i.state_code = ${state}` : Prisma.empty}
        ${
          q
            ? Prisma.sql`and (
                i.name ilike ${'%' + q + '%'} or
                coalesce(i.short_name, '') ilike ${'%' + q + '%'} or
                coalesce(i.city, '') ilike ${'%' + q + '%'} or
                coalesce(i.district, '') ilike ${'%' + q + '%'} or
                coalesce(i.ranking_text, '') ilike ${'%' + q + '%'}
              )`
            : Prisma.empty
        }
    `;
    const total = countRows[0]?.total ?? 0;

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
      where 1=1
        ${status ? Prisma.sql`and i.status = ${status}::content_status` : Prisma.empty}
        ${type ? Prisma.sql`and i.type = ${type}::institution_type` : Prisma.empty}
        ${state ? Prisma.sql`and i.state_code = ${state}` : Prisma.empty}
        ${
          q
            ? Prisma.sql`and (
                i.name ilike ${'%' + q + '%'} or
                coalesce(i.short_name, '') ilike ${'%' + q + '%'} or
                coalesce(i.city, '') ilike ${'%' + q + '%'} or
                coalesce(i.district, '') ilike ${'%' + q + '%'} or
                coalesce(i.ranking_text, '') ilike ${'%' + q + '%'}
              )`
            : Prisma.empty
        }
      group by i.id, i.slug, i.name, i.short_name, i.type, i.ownership, i.state_code, i.city, i.district, i.website, i.ranking_text, i.fees_text, i.accreditation, i.placement_stats
      order by i.updated_at desc, i.created_at desc
      limit ${limit}
      offset ${offset}
    `;

    return {
      items: rows as InstitutionSummary[],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  /** Get institution by ID or slug for admin editing */
  async adminGetInstitution(idOrSlug: string): Promise<InstitutionDetail> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
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
      where ${isUuid ? Prisma.sql`id = ${idOrSlug}::uuid` : Prisma.sql`slug = ${idOrSlug}`}
      limit 1
    `;

    if (!iRows || iRows.length === 0) {
      throw new NotFoundException(`Institution '${idOrSlug}' not found`);
    }

    const inst = iRows[0];
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
      where ic.institution_id = ${inst.id}::uuid
      order by c.name asc
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

  /** Admin create a new institution */
  async adminCreateInstitution(input: AdminCreateInstitutionInput): Promise<InstitutionDetail> {
    const baseSlug = input.slug?.trim() ||
      input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let slug = baseSlug || `college-${Date.now()}`;
    let counter = 1;
    while (true) {
      const exists = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text from institutions where slug = ${slug} limit 1
      `;
      if (!exists || exists.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      insert into institutions (
        slug, name, short_name, type, ownership, state_code, district, city, address,
        pincode, website, ranking_text, fees_text, description, established_year,
        accreditation, placement_stats, campus_facilities, contact_email, contact_phone,
        status, last_verified_at, created_at, updated_at
      ) values (
        ${slug},
        ${input.name.trim()},
        ${input.short_name?.trim() || null},
        ${input.type}::institution_type,
        ${input.ownership}::institution_ownership,
        ${input.state_code || null},
        ${input.district || null},
        ${input.city || null},
        ${input.address || null},
        ${input.pincode || null},
        ${input.website || null},
        ${input.ranking_text || null},
        ${input.fees_text || null},
        ${input.description || null},
        ${input.established_year || null},
        ${JSON.stringify(input.accreditation || {})}::jsonb,
        ${JSON.stringify(input.placement_stats || {})}::jsonb,
        ${input.campus_facilities || []}::text[],
        ${input.contact_email || null},
        ${input.contact_phone || null},
        ${input.status || 'published'}::content_status,
        now(),
        now(),
        now()
      )
      returning id::text
    `;

    return this.adminGetInstitution(rows[0].id);
  }

  /** Admin update/edit institution */
  async adminUpdateInstitution(id: string, input: AdminUpdateInstitutionInput): Promise<InstitutionDetail> {
    const existing = await this.adminGetInstitution(id);

    const slug = input.slug?.trim() || existing.slug;
    if (slug !== existing.slug) {
      const conflict = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text from institutions where slug = ${slug} and id != ${existing.id}::uuid limit 1
      `;
      if (conflict && conflict.length > 0) {
        throw new BadRequestException(`Slug '${slug}' already exists`);
      }
    }

    await this.prisma.$queryRaw`
      update institutions set
        slug = ${slug},
        name = ${input.name !== undefined ? input.name.trim() : existing.name},
        short_name = ${input.short_name !== undefined ? input.short_name?.trim() || null : existing.short_name},
        type = ${input.type ? Prisma.sql`${input.type}::institution_type` : Prisma.sql`type`},
        ownership = ${input.ownership ? Prisma.sql`${input.ownership}::institution_ownership` : Prisma.sql`ownership`},
        state_code = ${input.state_code !== undefined ? input.state_code || null : existing.state_code},
        district = ${input.district !== undefined ? input.district || null : existing.district},
        city = ${input.city !== undefined ? input.city || null : existing.city},
        address = ${input.address !== undefined ? input.address || null : Prisma.sql`address`},
        pincode = ${input.pincode !== undefined ? input.pincode || null : Prisma.sql`pincode`},
        website = ${input.website !== undefined ? input.website || null : existing.website},
        ranking_text = ${input.ranking_text !== undefined ? input.ranking_text || null : existing.ranking_text},
        fees_text = ${input.fees_text !== undefined ? input.fees_text || null : existing.fees_text},
        description = ${input.description !== undefined ? input.description || null : existing.description},
        established_year = ${input.established_year !== undefined ? input.established_year || null : existing.established_year},
        accreditation = ${input.accreditation !== undefined ? Prisma.sql`${JSON.stringify(input.accreditation)}::jsonb` : Prisma.sql`accreditation`},
        placement_stats = ${input.placement_stats !== undefined ? Prisma.sql`${JSON.stringify(input.placement_stats)}::jsonb` : Prisma.sql`placement_stats`},
        campus_facilities = ${input.campus_facilities !== undefined ? Prisma.sql`${input.campus_facilities}::text[]` : Prisma.sql`campus_facilities`},
        contact_email = ${input.contact_email !== undefined ? input.contact_email || null : Prisma.sql`contact_email`},
        contact_phone = ${input.contact_phone !== undefined ? input.contact_phone || null : Prisma.sql`contact_phone`},
        status = ${input.status ? Prisma.sql`${input.status}::content_status` : Prisma.sql`status`},
        last_verified_at = now(),
        updated_at = now()
      where id = ${existing.id}::uuid
    `;

    return this.adminGetInstitution(existing.id);
  }

  /** Admin delete institution */
  async adminDeleteInstitution(id: string): Promise<{ deleted: boolean; id: string }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      select id::text from institutions
      where ${isUuid ? Prisma.sql`id = ${id}::uuid` : Prisma.sql`slug = ${id}`}
      limit 1
    `;

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Institution '${id}' not found`);
    }

    const realId = existing[0].id;
    await this.prisma.$queryRaw`
      delete from institutions where id = ${realId}::uuid
    `;

    return { deleted: true, id: realId };
  }
}

