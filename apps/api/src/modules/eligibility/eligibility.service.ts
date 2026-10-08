import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AgeRelaxation,
  EducationLevel,
  EligibilityResponse,
  OpportunityCard,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { todayIst } from '../opportunities/opportunities.service.js';
import { checkEligibility, type EligibilityProfile, type RuleSet } from './check-eligibility.js';

const iso = (d: Date) => d.toISOString().slice(0, 10);

const EMPTY: EligibilityProfile = {
  date_of_birth: null,
  gender: null,
  category: null,
  is_pwbd: false,
  is_ex_serviceman: false,
  domicile_state_code: null,
  annual_family_income: null,
  education: [],
};

/** Loads profiles and rules from the DB, then hands them to the pure checkEligibility(). */
@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string): Promise<EligibilityProfile> {
    const [p, education] = await Promise.all([
      this.prisma.user_profiles.findUnique({ where: { user_id: userId } }),
      this.prisma.user_education.findMany({
        where: { user_id: userId },
        select: { level: true, degree: true, stream: true, status: true, score: true, score_type: true },
      }),
    ]);
    return {
      ...EMPTY,
      ...(p && {
        date_of_birth: p.date_of_birth ? iso(p.date_of_birth) : null,
        gender: p.gender,
        category: p.category,
        is_pwbd: p.is_pwbd,
        is_ex_serviceman: p.is_ex_serviceman,
        domicile_state_code: p.domicile_state_code,
        annual_family_income: p.annual_family_income,
      }),
      education: education.map((e) => ({
        ...e,
        level: e.level as EducationLevel,
        score: e.score === null ? null : Number(e.score),
      })),
    };
  }

  /** Rule sets per opportunity slug: the whole-notification rules plus any post with its own rules. */
  async ruleSets(slugs: string[]): Promise<Map<string, RuleSet[]>> {
    const rows = await this.prisma.opportunity_eligibility.findMany({
      where: { opportunities: { slug: { in: slugs } } },
      include: {
        opportunities: { select: { slug: true } },
        opportunity_posts: { select: { name: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    const map = new Map<string, RuleSet[]>();
    for (const e of rows) {
      const sets = map.get(e.opportunities.slug) ?? [];
      sets.push({
        post: e.opportunity_posts?.name ?? null,
        rules: {
          age_min: e.age_min,
          age_max: e.age_max,
          age_as_on_date: e.age_as_on_date ? iso(e.age_as_on_date) : null,
          age_relaxations: (e.age_relaxations ?? []) as unknown as AgeRelaxation[],
          qualification_level: e.qualification_level,
          qualification_streams: e.qualification_streams,
          min_percentage: e.min_percentage === null ? null : Number(e.min_percentage),
          final_year_allowed: e.final_year_allowed,
          gender: e.gender,
          domicile_states: e.domicile_states,
          categories_allowed: e.categories_allowed,
          income_max: e.income_max,
          other_conditions: e.other_conditions,
        },
      });
      map.set(e.opportunities.slug, sets);
    }
    return map;
  }

  async check(userId: string, slug: string): Promise<EligibilityResponse> {
    const exists = await this.prisma.opportunities.count({
      where: { slug, status: { in: ['published', 'closed'] } },
    });
    if (!exists) throw new NotFoundException('Opportunity not found');
    const [profile, sets] = await Promise.all([this.profile(userId), this.ruleSets([slug])]);
    return { slug, ...checkEligibility(profile, sets.get(slug) ?? [], iso(todayIst())) };
  }

  /** Adds an eligibility badge to each card. */
  async annotate(profile: EligibilityProfile, cards: OpportunityCard[]): Promise<OpportunityCard[]> {
    if (cards.length === 0) return cards;
    const sets = await this.ruleSets(cards.map((c) => c.slug));
    const today = iso(todayIst());
    return cards.map((c) => ({
      ...c,
      eligibility: checkEligibility(profile, sets.get(c.slug) ?? [], today).status,
    }));
  }

  /** True once there's enough in the profile for recommendations to mean something. */
  static ready(p: EligibilityProfile): boolean {
    return Boolean(p.date_of_birth) && p.education.length > 0;
  }
}
