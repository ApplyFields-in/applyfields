import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AgeRelaxation,
  EducationLevel,
  EligibilityResponse,
  OpportunityCard,
  ProfileGapField,
  SocialCategory,
  UserGender,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { todayIst } from '../opportunities/opportunities.service.js';
import { checkEligibility, type EligibilityProfile, type RuleSet } from './check-eligibility.js';

const iso = (d: Date) => d.toISOString().slice(0, 10);

const SOCIAL: SocialCategory[] = ['GEN', 'OBC', 'SC', 'ST', 'EWS'];
const GENDERS: UserGender[] = ['male', 'female', 'transgender', 'prefer_not_to_say'];
const EDU: EducationLevel[] = ['10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd'];

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
    return cards.map((c) => {
      const result = checkEligibility(profile, sets.get(c.slug) ?? [], today);
      return {
        ...c,
        eligibility: result.status,
        match_score: result.match_score ?? undefined,
      };
    });
  }

  /**
   * A profile from criteria typed into the Eligibility Check form (works for guests too), so the
   * same rules that badge a logged-in user's cards check what the visitor entered.
   * null = no criteria given. Bad values → 400, never a silent "eligible".
   */
  static fromCriteria(c: {
    dob?: string;
    social?: string;
    gender?: string;
    edu?: string;
    domicile?: string;
  }): EligibilityProfile | null {
    if (!c.dob && !c.social && !c.gender && !c.edu && !c.domicile) return null;
    if (c.dob && (!/^\d{4}-\d{2}-\d{2}$/.test(c.dob) || Number.isNaN(Date.parse(c.dob)))) {
      throw new BadRequestException('dob must be YYYY-MM-DD');
    }
    if (c.social && !SOCIAL.includes(c.social as SocialCategory)) {
      throw new BadRequestException(`social must be one of: ${SOCIAL.join(', ')}`);
    }
    if (c.gender && !GENDERS.includes(c.gender as UserGender)) {
      throw new BadRequestException(`gender must be one of: ${GENDERS.join(', ')}`);
    }
    if (c.edu && !EDU.includes(c.edu as EducationLevel)) {
      throw new BadRequestException(`edu must be one of: ${EDU.join(', ')}`);
    }
    if (c.domicile && !/^[A-Z]{2}$/.test(c.domicile)) {
      throw new BadRequestException('domicile must be a 2-letter state code');
    }
    return {
      ...EMPTY,
      date_of_birth: c.dob ?? null,
      category: (c.social as SocialCategory | undefined) ?? null,
      gender: (c.gender as UserGender | undefined) ?? null,
      domicile_state_code: c.domicile ?? null,
      education: c.edu
        ? [{ level: c.edu as EducationLevel, degree: null, stream: null, status: 'completed', score: null, score_type: null }]
        : [],
    };
  }

  /** True once there's enough in the profile for recommendations to mean something. */
  static ready(p: EligibilityProfile): boolean {
    return Boolean(p.date_of_birth) && p.education.length > 0;
  }

  /** Empty fields that age, qualification, gender, reservation and domicile rules read. */
  static missing(p: EligibilityProfile): ProfileGapField[] {
    const gaps: ProfileGapField[] = [];
    if (!p.date_of_birth) gaps.push('date_of_birth');
    if (p.education.length === 0) gaps.push('education');
    if (!p.gender) gaps.push('gender');
    if (!p.category) gaps.push('category');
    if (!p.domicile_state_code) gaps.push('domicile_state_code');
    return gaps;
  }
}
