import { Injectable } from '@nestjs/common';
import type {
  AgeRelaxation,
  Fee,
  OpportunityCard,
  OpportunityCategory,
  OpportunityDetail,
  OpportunityType,
  RequiredDocument,
  UpdateItem,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** Today's date in India, as a UTC-midnight Date (matches Postgres DATE columns). */
export function todayIst(): Date {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()),
  );
}

export const addDays = (d: Date, days: number) =>
  new Date(d.getTime() + days * DAY_MS);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const STATE_NAMES: Record<string, string> = {
  AP: 'Andhra Pradesh',
  TS: 'Telangana',
  KA: 'Karnataka',
  TN: 'Tamil Nadu',
  MH: 'Maharashtra',
  KL: 'Kerala',
  DL: 'Delhi',
  UP: 'Uttar Pradesh',
  WB: 'West Bengal',
  GJ: 'Gujarat',
  RJ: 'Rajasthan',
};

const QUALIFICATION: Record<string, string> = {
  '10th': '10th pass',
  '12th': '12th pass',
  iti: 'ITI',
  diploma: 'Diploma',
  graduate: 'Graduate',
  post_graduate: 'Post-graduate',
  phd: 'PhD',
};

const CATEGORY: Record<string, string> = {
  central_govt: 'Central Govt',
  state_govt: 'State Govt',
  district: 'District',
  panchayat: 'Panchayat',
  municipal: 'Municipal',
  psu: 'PSU',
  railways: 'Railways',
  banking: 'Banking',
  defence: 'Defence',
  police: 'Police',
  entrance: 'Entrance',
  competitive: 'Competitive',
  recruitment: 'Recruitment',
  central: 'Central',
  state: 'State',
  college: 'College',
  university: 'University',
  course: 'Course',
  other: 'Other',
};

/** Only what a card needs — keeps queries small. */
export const CARD_SELECT = {
  slug: true,
  type: true,
  category: true,
  title: true,
  state_codes: true,
  vacancies_total: true,
  application_end: true,
  organizations: { select: { name: true, short_name: true } },
  opportunity_eligibility: {
    where: { post_id: null },
    select: { qualification_level: true },
    take: 1,
  },
} satisfies Prisma.opportunitiesSelect;

type CardRow = Prisma.opportunitiesGetPayload<{ select: typeof CARD_SELECT }>;

/** Published and still open (no last date yet, or last date today or later). */
export function openWhere(today: Date): Prisma.opportunitiesWhereInput {
  return {
    status: 'published',
    OR: [{ application_end: null }, { application_end: { gte: today } }],
  };
}

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  toCard(row: CardRow, today: Date): OpportunityCard {
    const states = row.state_codes.filter((s) => s !== 'ALL');
    const level = row.opportunity_eligibility[0]?.qualification_level;
    const org = row.organizations;
    return {
      slug: row.slug,
      type: row.type,
      title: row.title,
      organization:
        org.short_name && !org.name.includes(org.short_name)
          ? `${org.name} (${org.short_name})`
          : org.name,
      location:
        states.length === 0
          ? 'All India'
          : states.map((s) => STATE_NAMES[s] ?? s).join(', '),
      qualification: (level && QUALIFICATION[level]) || 'See notification',
      vacancies: row.vacancies_total,
      last_date: row.application_end ? isoDate(row.application_end) : null,
      days_left: row.application_end
        ? Math.round((row.application_end.getTime() - today.getTime()) / DAY_MS)
        : null,
      tags: [org.short_name, CATEGORY[row.category]].filter((t): t is string =>
        Boolean(t),
      ),
    };
  }

  /** Open, published opportunities with flexible filtering. Closing soonest first. */
  async list(filters?: {
    type?: OpportunityType;
    category?: string;
    state?: string;
    qualification?: string;
    deadline?: string;
    q?: string;
    take?: number;
  }): Promise<OpportunityCard[]> {
    const today = todayIst();
    const type = filters?.type;
    const q = filters?.q;
    const category = filters?.category?.trim();
    const state = filters?.state?.trim();
    const qualification = filters?.qualification?.trim();
    const deadline = filters?.deadline?.trim();
    const take = filters?.take ?? 100;

    const words = (q ?? '').trim().split(/\s+/).filter(Boolean);

    // Build category conditions
    const categoryConditions: Prisma.opportunitiesWhereInput[] = [];
    if (category && category !== 'all' && category !== 'All') {
      const catLower = category.toLowerCase();
      const validCategories: OpportunityCategory[] = [
        'central_govt',
        'state_govt',
        'district',
        'panchayat',
        'municipal',
        'psu',
        'railways',
        'banking',
        'defence',
        'police',
        'entrance',
        'competitive',
        'recruitment',
        'central',
        'state',
        'college',
        'university',
        'course',
        'other',
      ];

      if (validCategories.includes(catLower as OpportunityCategory)) {
        categoryConditions.push({ category: catLower as OpportunityCategory });
      } else if (catLower === 'central' || catLower.includes('central')) {
        categoryConditions.push({
          OR: [
            { category: 'central_govt' },
            { category: 'central' },
            { title: { contains: 'central', mode: 'insensitive' } },
          ],
        });
      } else if (catLower === 'state' || catLower.includes('state')) {
        categoryConditions.push({
          OR: [
            { category: 'state_govt' },
            { category: 'state' },
            { title: { contains: 'state', mode: 'insensitive' } },
          ],
        });
      } else {
        categoryConditions.push({
          OR: [
            { title: { contains: category, mode: 'insensitive' } },
            {
              organizations: {
                name: { contains: category, mode: 'insensitive' },
              },
            },
            {
              organizations: {
                short_name: { contains: category, mode: 'insensitive' },
              },
            },
          ],
        });
      }
    }

    // Build state condition
    const stateConditions: Prisma.opportunitiesWhereInput[] = [];
    if (state && state !== 'all' && state !== 'ALL' && state !== 'All India') {
      stateConditions.push({
        state_codes: { hasSome: [state.toUpperCase(), 'ALL'] },
      });
    }

    // Build qualification condition
    const qualConditions: Prisma.opportunitiesWhereInput[] = [];
    if (qualification && qualification !== 'all' && qualification !== 'All') {
      qualConditions.push({
        opportunity_eligibility: {
          some: {
            qualification_level: {
              contains: qualification.toLowerCase(),
              mode: 'insensitive',
            },
          },
        },
      });
    }

    // Build deadline condition
    const deadlineConditions: Prisma.opportunitiesWhereInput[] = [];
    if (deadline) {
      if (deadline === 'closing_soon' || deadline === '7_days') {
        deadlineConditions.push({
          application_end: {
            gte: today,
            lte: addDays(today, 7),
          },
        });
      } else if (deadline === 'today') {
        deadlineConditions.push({
          application_end: {
            equals: today,
          },
        });
      } else if (deadline === 'this_month' || deadline === '30_days') {
        deadlineConditions.push({
          application_end: {
            gte: today,
            lte: addDays(today, 30),
          },
        });
      }
    }

    const rows = await this.prisma.opportunities.findMany({
      where: {
        AND: [
          openWhere(today),
          ...(type ? [{ type }] : []),
          ...categoryConditions,
          ...stateConditions,
          ...qualConditions,
          ...deadlineConditions,
          ...words.map((w) => ({
            OR: [
              { title: { contains: w, mode: 'insensitive' as const } },
              {
                organizations: {
                  name: { contains: w, mode: 'insensitive' as const },
                },
              },
              {
                organizations: {
                  short_name: { contains: w, mode: 'insensitive' as const },
                },
              },
            ],
          })),
        ],
      },
      select: CARD_SELECT,
      orderBy: [
        { application_end: { sort: 'asc', nulls: 'last' } },
        { published_at: 'desc' },
      ],
      take,
    });
    return rows.map((r) => this.toCard(r, today));
  }

  /** Find complete published opportunity details by slug. */
  async findBySlug(slug: string): Promise<OpportunityDetail | null> {
    const today = todayIst();
    const row = await this.prisma.opportunities.findFirst({
      where: {
        slug,
        status: 'published',
      },
      include: {
        organizations: {
          select: { id: true, name: true, short_name: true, level: true },
        },
        opportunity_posts: {
          orderBy: { sort_order: 'asc' },
        },
        opportunity_eligibility: {
          orderBy: { created_at: 'asc' },
        },
        opportunity_dates: {
          orderBy: { date: 'asc' },
        },
        updates: {
          where: { status: 'published' },
          orderBy: [{ date: 'desc' }, { published_at: 'desc' }],
          take: 10,
        },
      },
    });

    if (!row) return null;

    const daysLeft = row.application_end
      ? Math.round((row.application_end.getTime() - today.getTime()) / DAY_MS)
      : null;

    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      category: row.category,
      title: row.title,
      organization: row.organizations,
      notification_number: row.notification_number,
      summary: row.summary,
      state_codes: row.state_codes,
      districts: row.districts,
      vacancies_total: row.vacancies_total,
      fees: (row.fees ?? []) as unknown as Fee[],
      fee_text: row.fee_text,
      payment_modes: row.payment_modes,
      selection_process: row.selection_process,
      required_documents: (row.required_documents ??
        []) as unknown as RequiredDocument[],
      syllabus: row.syllabus as {
        text: string | null;
        url: string | null;
      } | null,
      previous_papers: (row.previous_papers ?? []) as unknown as {
        title: string;
        url: string;
      }[],
      benefits_text: row.benefits_text,
      application_start: row.application_start
        ? isoDate(row.application_start)
        : null,
      application_end: row.application_end
        ? isoDate(row.application_end)
        : null,
      days_left: daysLeft,
      links: {
        notification_pdf_url: row.notification_pdf_url,
        official_page_url: row.official_page_url,
        apply_url: row.apply_url,
        official_website: row.official_website,
      },
      posts: row.opportunity_posts.map((p) => ({
        id: p.id,
        name: p.name,
        vacancies_total: p.vacancies_total,
        vacancies_by_category: p.vacancies_by_category as Record<
          string,
          number
        > | null,
        pay_level: p.pay_level,
        salary_min: p.salary_min,
        salary_max: p.salary_max,
        salary_text: p.salary_text,
      })),
      eligibility: row.opportunity_eligibility.map((e) => ({
        id: e.id,
        post_id: e.post_id,
        age_min: e.age_min,
        age_max: e.age_max,
        age_as_on_date: e.age_as_on_date ? isoDate(e.age_as_on_date) : null,
        age_relaxations: (e.age_relaxations ??
          []) as unknown as AgeRelaxation[],
        qualification_level: e.qualification_level,
        qualification_streams: e.qualification_streams,
        min_percentage: e.min_percentage ? Number(e.min_percentage) : null,
        final_year_allowed: e.final_year_allowed,
        gender: e.gender,
        domicile_states: e.domicile_states,
        categories_allowed: e.categories_allowed,
        income_max: e.income_max,
        other_conditions: e.other_conditions,
        official_text: e.official_text,
      })),
      dates: row.opportunity_dates.map((d) => ({
        id: d.id,
        kind: d.kind,
        date: isoDate(d.date),
        end_date: d.end_date ? isoDate(d.end_date) : null,
        is_tentative: d.is_tentative,
        note: d.note,
      })),
      updates: row.updates.map((u) => ({
        id: u.id,
        kind: u.kind,
        title: u.title,
        organization: row.organizations.short_name ?? row.organizations.name,
        date: isoDate(u.date ?? u.published_at ?? today),
        opportunity_slug: row.slug,
      })),
      last_verified_at: row.last_verified_at?.toISOString() ?? null,
      published_at: row.published_at?.toISOString() ?? null,
      status: row.status,
    };
  }

  /** Cards for these ids, in the same order (live or closed only). */
  async cardsByIds(ids: string[]): Promise<OpportunityCard[]> {
    if (ids.length === 0) return [];
    const today = todayIst();
    const rows = await this.prisma.opportunities.findMany({
      where: { id: { in: ids }, status: { in: ['published', 'closed'] } },
      select: { ...CARD_SELECT, id: true },
    });
    const byId = new Map(rows.map((r) => [r.id, this.toCard(r, today)]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  /** Latest published updates: admit cards, results, answer keys, date changes… */
  async updates(take = 20): Promise<UpdateItem[]> {
    const rows = await this.prisma.updates.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        kind: true,
        title: true,
        date: true,
        published_at: true,
        opportunities: { select: { slug: true, title: true } },
        gov_services: { select: { name: true } },
      },
      orderBy: [
        { date: { sort: 'desc', nulls: 'last' } },
        { published_at: 'desc' },
      ],
      take,
    });
    return rows.map((u) => ({
      id: u.id,
      kind: u.kind,
      title: u.title,
      organization: u.opportunities?.title ?? u.gov_services?.name ?? '',
      date: isoDate(u.date ?? u.published_at ?? todayIst()),
      opportunity_slug: u.opportunities?.slug ?? null,
    }));
  }
}
