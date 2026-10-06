import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AgeRelaxation,
  Fee,
  FieldStatus,
  RequiredDocument,
  ReviewDetail,
  ReviewList,
  ReviewListItem,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { StorageService } from '../../common/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Below this confidence a draft is flagged "check carefully" (job-format §4.8). */
export const CAREFUL_REVIEW_BELOW = 0.6;
const SIGNED_URL_SECONDS = 600;

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const num = (d: Prisma.Decimal | null) => (d === null ? null : Number(d));
const needsCare = (confidence: number | null) => confidence === null || confidence < CAREFUL_REVIEW_BELOW;

/** The fields the publish check needs (job-format §5). */
type PublishCheckRow = {
  title: string;
  notification_pdf_url: string | null;
  official_page_url: string | null;
  source_url: string | null;
  application_end: Date | null;
  field_status: Prisma.JsonValue;
};

/**
 * What still blocks publishing (job-format §5). Empty = ready.
 * type, category and organisation (+ level) are NOT NULL in the database, so they are always present.
 * The Publish API (POST /admin/opportunities/:id/publish) must use this same check.
 */
export function publishBlockers(row: PublishCheckRow): string[] {
  const status = (row.field_status ?? {}) as Record<string, FieldStatus>;
  const datesNotInSource = status['dates'] === 'not_in_source' || status['application_end'] === 'not_in_source';
  const missing: string[] = [];
  if (!row.title.trim()) missing.push('Title');
  if (!row.notification_pdf_url && !row.official_page_url) missing.push('Official link (notification PDF or official page)');
  if (!row.source_url) missing.push('Source URL');
  if (!row.application_end && !datesNotInSource) missing.push('Last date (or mark dates "not in source")');
  return missing;
}

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Drafts waiting for review, newest find first. */
  async list(filter: { source?: string; careful?: boolean }): Promise<ReviewList> {
    const drafts: Prisma.opportunitiesWhereInput = { status: 'draft' };
    const careful: Prisma.opportunitiesWhereInput = {
      OR: [{ confidence: null }, { confidence: { lt: CAREFUL_REVIEW_BELOW } }],
    };
    const where: Prisma.opportunitiesWhereInput = {
      AND: [drafts, ...(filter.source ? [{ source_key: filter.source }] : []), ...(filter.careful ? [careful] : [])],
    };

    const [rows, total, needsCareCount, waitingExtraction, sources] = await Promise.all([
      this.prisma.opportunities.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          source_key: true,
          source_url: true,
          confidence: true,
          source_fetched_at: true,
          created_at: true,
          notification_pdf_url: true,
          official_page_url: true,
          application_end: true,
          field_status: true,
          organizations: { select: { name: true, short_name: true } },
        },
        orderBy: [{ source_fetched_at: { sort: 'desc', nulls: 'last' } }, { created_at: 'desc' }],
        take: 200,
      }),
      this.prisma.opportunities.count({ where: drafts }),
      this.prisma.opportunities.count({ where: { AND: [drafts, careful] } }),
      this.prisma.scraped_documents.count({ where: { status: 'new', opportunity_id: null } }),
      this.prisma.opportunities.findMany({
        where: { ...drafts, source_key: { not: null } },
        distinct: ['source_key'],
        select: { source_key: true },
        orderBy: { source_key: 'asc' },
      }),
    ]);

    const items: ReviewListItem[] = rows.map((r) => {
      const confidence = num(r.confidence);
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        organization: r.organizations.short_name ?? r.organizations.name,
        source_key: r.source_key,
        source_url: r.source_url,
        confidence,
        found_at: (r.source_fetched_at ?? r.created_at).toISOString(),
        needs_care: needsCare(confidence),
        missing: publishBlockers(r),
      };
    });

    return {
      total,
      needs_care: needsCareCount,
      waiting_extraction: waitingExtraction,
      sources: sources.map((s) => s.source_key).filter((k): k is string => k !== null),
      items,
    };
  }

  /** One draft with its posts, eligibility, dates and a link to its PDF. */
  async detail(id: string): Promise<ReviewDetail> {
    const o = await this.prisma.opportunities.findUnique({
      where: { id },
      include: {
        organizations: { select: { id: true, name: true, short_name: true, level: true } },
        opportunity_posts: { orderBy: { sort_order: 'asc' } },
        opportunity_eligibility: { orderBy: { created_at: 'asc' } },
        opportunity_dates: { orderBy: { date: 'asc' } },
        scraped_documents: {
          where: { storage_path: { not: null } },
          select: { storage_path: true },
          orderBy: { fetched_at: 'desc' },
          take: 1,
        },
      },
    });
    if (!o) throw new NotFoundException(`No opportunity with id ${id}`);

    const confidence = num(o.confidence);
    const pdf = await this.pdfFor(o.scraped_documents[0]?.storage_path ?? null, o.notification_pdf_url);

    return {
      id: o.id,
      slug: o.slug,
      status: o.status,
      version: o.version,
      type: o.type,
      category: o.category,
      title: o.title,
      notification_number: o.notification_number,
      summary: o.summary,
      organization: o.organizations,
      state_codes: o.state_codes,
      districts: o.districts,
      vacancies_total: o.vacancies_total,
      fees: (o.fees ?? []) as unknown as Fee[],
      fee_text: o.fee_text,
      payment_modes: o.payment_modes,
      selection_process: o.selection_process,
      required_documents: (o.required_documents ?? []) as unknown as RequiredDocument[],
      benefits_text: o.benefits_text,
      application_start: isoDate(o.application_start),
      application_end: isoDate(o.application_end),
      links: {
        notification_pdf_url: o.notification_pdf_url,
        official_page_url: o.official_page_url,
        apply_url: o.apply_url,
        official_website: o.official_website,
      },
      field_status: (o.field_status ?? {}) as Record<string, FieldStatus>,
      source: {
        key: o.source_key,
        url: o.source_url,
        fetched_at: o.source_fetched_at?.toISOString() ?? null,
        content_hash: o.source_content_hash,
        extractor_version: o.extractor_version,
        ai_model: o.ai_model,
        confidence,
      },
      posts: o.opportunity_posts.map((p) => ({
        id: p.id,
        name: p.name,
        vacancies_total: p.vacancies_total,
        vacancies_by_category: p.vacancies_by_category as Record<string, number> | null,
        pay_level: p.pay_level,
        salary_min: p.salary_min,
        salary_max: p.salary_max,
        salary_text: p.salary_text,
      })),
      eligibility: o.opportunity_eligibility.map((e) => ({
        id: e.id,
        post_id: e.post_id,
        age_min: e.age_min,
        age_max: e.age_max,
        age_as_on_date: isoDate(e.age_as_on_date),
        age_relaxations: (e.age_relaxations ?? []) as unknown as AgeRelaxation[],
        qualification_level: e.qualification_level,
        qualification_streams: e.qualification_streams,
        min_percentage: num(e.min_percentage),
        final_year_allowed: e.final_year_allowed,
        gender: e.gender,
        domicile_states: e.domicile_states,
        categories_allowed: e.categories_allowed,
        income_max: e.income_max,
        other_conditions: e.other_conditions,
        official_text: e.official_text,
      })),
      dates: o.opportunity_dates.map((d) => ({
        id: d.id,
        kind: d.kind,
        date: isoDate(d.date) ?? '',
        end_date: isoDate(d.end_date),
        is_tentative: d.is_tentative,
        note: d.note,
      })),
      pdf,
      missing: publishBlockers(o),
      needs_care: needsCare(confidence),
      created_at: o.created_at.toISOString(),
      updated_at: o.updated_at.toISOString(),
    };
  }

  /** Prefer our stored copy (signed, expires); else the official PDF URL; else nothing. */
  private async pdfFor(storagePath: string | null, officialPdf: string | null): Promise<ReviewDetail['pdf']> {
    if (storagePath) {
      const url = await this.storage.signedUrl(this.storage.notificationsBucket, storagePath, SIGNED_URL_SECONDS);
      if (url) {
        return { url, kind: 'signed', expires_at: new Date(Date.now() + SIGNED_URL_SECONDS * 1000).toISOString() };
      }
    }
    if (officialPdf) return { url: officialPdf, kind: 'official', expires_at: null };
    return { url: null, kind: 'none', expires_at: null };
  }
}
