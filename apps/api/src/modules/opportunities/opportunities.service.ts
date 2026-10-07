import { Injectable } from '@nestjs/common';
import type {
  OpportunityCard,
  OpportunityType,
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

  /** Open, published opportunities — optionally one type and/or a text search. Closing soonest first. */
  async list(
    type?: OpportunityType,
    q?: string,
    take = 100,
  ): Promise<OpportunityCard[]> {
    const today = todayIst();
    const words = (q ?? '').trim().split(/\s+/).filter(Boolean);
    const rows = await this.prisma.opportunities.findMany({
      where: {
        AND: [
          openWhere(today),
          ...(type ? [{ type }] : []),
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
