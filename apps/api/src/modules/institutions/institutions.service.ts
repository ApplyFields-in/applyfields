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
});
export type InstitutionListQuery = z.infer<typeof institutionListQuerySchema>;

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
}

