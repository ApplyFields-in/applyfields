import { Injectable, Optional } from '@nestjs/common';
import type { SearchResult, SearchResultType, SearchSuggestResponse } from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { locationLabel, todayIst } from '../opportunities/opportunities.service.js';
import { TypesenseService } from './typesense.service.js';

/** How far ahead each deadline filter reaches, in days (same values as GET /opportunities). */
const DEADLINE_DAYS = { today: 0, closing_soon: 7, '7_days': 7, this_month: 30, '30_days': 30 };

/** Empty query params (`state=` from a form) count as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
  type: optional(z.enum(['govt_job', 'exam', 'scholarship', 'admission', 'service'])),
  state: optional(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'a 2-letter state code')),
  qualification: optional(z.enum(['10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd'])),
  deadline: optional(z.enum(['today', 'closing_soon', '7_days', 'this_month', '30_days'])),
  sort: z.enum(['relevance', 'deadline']).default('relevance'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const suggestQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});
export type SuggestQuery = z.infer<typeof suggestQuerySchema>;

/** 'SSC  CGL-2026!' → ['ssc', 'cgl', '2026']. Letters (with Indic vowel signs) and digits only, so each word is safe inside to_tsquery. */
export function searchWords(q: string): string[] {
  return (q.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).slice(0, 8);
}

interface Row {
  type: SearchResultType;
  title: string;
  subtitle: string | null;
  url_path: string;
  state_codes: string[];
  last_date: string | null;
  days_left: number | null;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly typesense?: TypesenseService,
  ) {}

  /**
   * Fast query suggestions and related searches.
   * Powered by search_terms with trigram and prefix indexes for < 5ms response times.
   */
  async suggest(f: SuggestQuery): Promise<SearchSuggestResponse> {
    const q = f.q.trim();
    if (!q) {
      return { query: q, suggestions: [], related: [], items: [] };
    }

    const norm = q.toLowerCase();

    // 1. Fetch matching query suggestions & related searches from search_terms
    let termRows: Array<{ display_term: string; category: string; related_terms: string[] }> = [];
    try {
      termRows = await this.prisma.$queryRaw<
        Array<{ display_term: string; category: string; related_terms: string[] }>
      >`
        select display_term, category, related_terms
        from search_terms
        where term ilike ${`${norm}%`} or similarity(term, ${norm}) > 0.2
        order by (term ilike ${`${norm}%`}) desc, search_count desc
        limit ${f.limit}
      `;
    } catch {
      termRows = [];
    }

    const suggestions = termRows.map((r) => r.display_term);

    // Extract unique related terms
    const relatedSet = new Set<string>();
    for (const r of termRows) {
      if (r.related_terms && Array.isArray(r.related_terms)) {
        for (const rel of r.related_terms) {
          if (!suggestions.some((s) => s.toLowerCase() === rel.toLowerCase()) && rel.toLowerCase() !== norm) {
            relatedSet.add(rel);
          }
        }
      }
    }

    // 2. Fetch top 3 direct matching items as preview
    const items = await this.search({
      q,
      sort: 'relevance',
      limit: 3,
    });

    return {
      query: q,
      suggestions,
      related: Array.from(relatedSet).slice(0, 6),
      items,
    };
  }

  /**
   * Fetch related search terms for a query
   */
  async getRelatedTerms(query: string): Promise<string[]> {
    const norm = query.toLowerCase().trim();
    if (!norm) return [];
    try {
      const rows = await this.prisma.$queryRaw<Array<{ related_terms: string[] }>>`
        select related_terms
        from search_terms
        where term ilike ${`${norm}%`} or similarity(term, ${norm}) > 0.25
        limit 3
      `;
      const set = new Set<string>();
      for (const r of rows) {
        if (r.related_terms && Array.isArray(r.related_terms)) {
          for (const t of r.related_terms) {
            if (t.toLowerCase() !== norm) set.add(t);
          }
        }
      }
      return Array.from(set).slice(0, 6);
    } catch {
      return [];
    }
  }

  /**
   * Open, published jobs, exams, scholarships, admissions and services.
   * If Typesense is connected and healthy, queries Typesense.
   * Otherwise falls back to PostgreSQL GIN full-text + pg_trgm fuzzy matching.
   */
  async search(f: SearchQuery): Promise<SearchResult[]> {
    if (this.typesense?.available) {
      const tsResults = await this.typesense.search(f);
      if (tsResults !== null && tsResults.length > 0) {
        // Record search query asynchronously
        if (f.q.trim().length >= 2) {
          this.prisma.$executeRaw`select record_search_term(${f.q.trim()})`.catch(() => {});
        }
        return tsResults;
      }
    }

    const words = searchWords(f.q);
    if (words.length === 0) return [];

    // Record search query asynchronously in Postgres
    if (f.q.trim().length >= 2) {
      this.prisma.$executeRaw`select record_search_term(${f.q.trim()})`.catch(() => {});
    }

    const today = todayIst().toISOString().slice(0, 10);
    const type = Prisma.sql`coalesce(o.type::text, s.item_type::text)`;
    const matches = words.map(
      (w) => Prisma.sql`(s.search_vector @@ to_tsquery('simple', ${`${w}:*`}) or ${w} <<% s.title)`,
    );
    const anyWord = words.map((w) => `${w}:*`).join(' | ');
    const relevance = Prisma.sql`ts_rank(s.search_vector, to_tsquery('simple', ${anyWord})) + word_similarity(${f.q}, s.title) desc`;

    const rows = await this.prisma.$queryRaw<Row[]>`
      select ${type} as type, s.title, s.subtitle, s.url_path, s.state_codes,
             s.deadline::text as last_date, s.deadline - ${today}::date as days_left
      from search_index s
      left join opportunities o on s.item_type = 'opportunity' and o.id = s.item_id
      where ${Prisma.join(matches, ' and ')}
        and (s.deadline is null or s.deadline >= ${today}::date)
        ${f.type ? Prisma.sql`and ${type} = ${f.type}` : Prisma.empty}
        ${f.state ? Prisma.sql`and s.state_codes && array[${f.state}, 'ALL']::text[]` : Prisma.empty}
        ${f.qualification ? Prisma.sql`and exists (select 1 from opportunity_eligibility e where e.opportunity_id = s.item_id and e.qualification_level = ${f.qualification})` : Prisma.empty}
        ${f.deadline ? Prisma.sql`and s.deadline <= ${today}::date + ${DEADLINE_DAYS[f.deadline]}::int` : Prisma.empty}
      order by ${f.sort === 'deadline' ? Prisma.sql`s.deadline asc nulls last, ${relevance}` : relevance}
      limit ${f.limit}`;

    return rows.map((r) => ({
      type: r.type,
      title: r.title,
      subtitle: r.subtitle,
      url: r.url_path,
      location: locationLabel(r.state_codes),
      last_date: r.last_date,
      days_left: r.days_left,
    }));
  }
}
