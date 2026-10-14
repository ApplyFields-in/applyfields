import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminOpportunityList,
  OpportunityInput,
  OpportunityStatus,
  OpportunityType,
  OrganizationOption,
  StatusChange,
  WriteResult,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { todayIst } from '../opportunities/opportunities.service.js';
import { publishBlockers } from './review.service.js';

type Tx = Prisma.TransactionClient;

const STATUSES: OpportunityStatus[] = [
  'draft',
  'published',
  'closed',
  'archived',
];
const day = (s: string | null) => (s ? new Date(`${s}T00:00:00Z`) : null);
const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
/** Prisma JSON input from any serialisable value (Dates → ISO strings, Decimals → strings). */
const toJson = (v: unknown) =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

/** "SSC CGL 2026 — Notice!" → "ssc-cgl-2026-notice" */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'opportunity'
  );
}

/** Which status changes are allowed: from → to. Publishing has its own endpoint (it runs the checks). */
const ALLOWED: Record<StatusChange['status'], OpportunityStatus[]> = {
  draft: ['published', 'closed', 'archived'], // unpublish / reopen as draft / restore
  closed: ['published'],
  archived: ['draft', 'closed'], // reject a draft / archive an old one
};

@Injectable()
export class OpportunitiesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------ read */

  async list(f: {
    q?: string;
    status?: OpportunityStatus;
    type?: OpportunityType;
    page: number;
    pageSize: number;
  }): Promise<AdminOpportunityList> {
    const words = (f.q ?? '').trim().split(/\s+/).filter(Boolean);
    const search: Prisma.opportunitiesWhereInput[] = words.map((w) => ({
      OR: [
        { title: { contains: w, mode: 'insensitive' } },
        { slug: { contains: w.toLowerCase() } },
        { notification_number: { contains: w, mode: 'insensitive' } },
        { organizations: { name: { contains: w, mode: 'insensitive' } } },
        { organizations: { short_name: { contains: w, mode: 'insensitive' } } },
      ],
    }));
    const base: Prisma.opportunitiesWhereInput = {
      AND: [...search, ...(f.type ? [{ type: f.type }] : [])],
    };
    const where: Prisma.opportunitiesWhereInput = f.status
      ? { AND: [base, { status: f.status }] }
      : base;

    const [rows, total, grouped] = await Promise.all([
      this.prisma.opportunities.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          status: true,
          source_key: true,
          application_end: true,
          version: true,
          updated_at: true,
          published_at: true,
          organizations: { select: { name: true, short_name: true } },
        },
        orderBy: [{ updated_at: 'desc' }],
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
      }),
      this.prisma.opportunities.count({ where }),
      this.prisma.opportunities.groupBy({
        by: ['status'],
        where: base,
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
      OpportunityStatus,
      number
    >;
    for (const g of grouped) counts[g.status] = g._count._all;

    return {
      total,
      page: f.page,
      page_size: f.pageSize,
      counts,
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        type: r.type,
        status: r.status,
        organization: r.organizations.short_name ?? r.organizations.name,
        source_key: r.source_key,
        application_end: isoDay(r.application_end),
        version: r.version,
        updated_at: r.updated_at.toISOString(),
        published_at: r.published_at?.toISOString() ?? null,
      })),
    };
  }

  organizations(): Promise<OrganizationOption[]> {
    return this.prisma.organizations.findMany({
      select: { id: true, name: true, short_name: true, level: true },
      orderBy: { name: 'asc' },
    });
  }

  /* ------------------------------------------------------------------ write */

  /** Manual entry: a new draft typed in by staff from the official notification. */
  async create(
    input: OpportunityInput,
    actor: string | null,
  ): Promise<WriteResult> {
    await this.assertOrganization(input.organization_id);
    return this.prisma.$transaction(async (tx) => {
      const slug = await this.freeSlug(tx, slugify(`${input.title}`));
      const row = await tx.opportunities.create({
        data: {
          slug,
          ...this.columns(input),
          status: 'draft',
          source_key: 'manual',
          source_url:
            input.source_url ??
            input.official_page_url ??
            input.notification_pdf_url,
          source_fetched_at: new Date(),
          extractor_version: 'manual',
          confidence: 1,
        },
        select: { id: true, status: true, version: true },
      });
      await this.writeChildren(tx, row.id, input);
      await this.audit(tx, actor, 'opportunity.create', row.id, { slug });
      return row;
    });
  }

  /**
   * Save every field. A published job stays live, so it must still pass the publish check —
   * each save of a live job is recorded as a new version.
   */
  async save(
    id: string,
    input: OpportunityInput,
    actor: string | null,
  ): Promise<WriteResult> {
    await this.assertOrganization(input.organization_id);
    return this.prisma.$transaction(async (tx) => {
      const before = await this.load(tx, id);
      const sourceUrl =
        before.source_key === 'manual'
          ? (input.source_url ??
            input.official_page_url ??
            input.notification_pdf_url)
          : (input.source_url ?? before.source_url);
      const data = { ...this.columns(input), source_url: sourceUrl };

      if (before.status === 'published') {
        const missing = publishBlockers({
          ...data,
          field_status: input.field_status,
        });
        if (missing.length)
          throw new BadRequestException({
            message: 'A live job must stay complete',
            missing,
          });
      }

      const changed = changedFields(
        before as unknown as Record<string, unknown>,
        data as Record<string, unknown>,
      );
      await tx.opportunities.update({ where: { id }, data });
      await this.writeChildren(tx, id, input);

      let version = before.version;
      if (before.status === 'published') {
        version = await this.snapshot(
          tx,
          id,
          actor,
          'Edited while live',
          changed,
        );
      }
      await this.audit(tx, actor, 'opportunity.update', id, {
        changed_fields: changed,
        status: before.status,
      });
      return { id, status: before.status, version };
    });
  }

  /** Make it public. Runs the job-format §5 check and records a version. */
  async publish(id: string, actor: string | null): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const o = await this.load(tx, id);
      if (o.status === 'published')
        throw new ConflictException('Already published');
      const missing = publishBlockers(o);
      if (o.application_end && o.application_end < todayIst())
        missing.push('The last date has passed — close it instead');
      if (missing.length)
        throw new BadRequestException({
          message: 'Fix these before publishing',
          missing,
        });

      const now = new Date();
      await tx.opportunities.update({
        where: { id },
        data: {
          status: 'published',
          published_at: now,
          published_by: actor,
          reviewed_by: actor,
          closed_at: null,
          last_verified_at: now,
        },
      });
      const version = await this.snapshot(
        tx,
        id,
        actor,
        o.status === 'draft'
          ? 'Published'
          : `Published again (was ${o.status})`,
        [],
      );
      await this.audit(tx, actor, 'opportunity.publish', id, {
        from: o.status,
        version,
      });
      return { id, status: 'published', version };
    });
  }

  /** Unpublish (→ draft), close, or reject/archive (→ archived, reason required). */
  async setStatus(
    id: string,
    change: StatusChange,
    actor: string | null,
  ): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const o = await this.load(tx, id);
      if (!ALLOWED[change.status].includes(o.status)) {
        throw new ConflictException(
          `Can't move from ${o.status} to ${change.status}`,
        );
      }
      await tx.opportunities.update({
        where: { id },
        data: {
          status: change.status,
          closed_at: change.status === 'closed' ? new Date() : null,
        },
      });
      const action = {
        draft: 'opportunity.unpublish',
        closed: 'opportunity.close',
        archived:
          o.status === 'draft' ? 'opportunity.reject' : 'opportunity.archive',
      }[change.status];
      await this.audit(tx, actor, action, id, {
        from: o.status,
        reason: change.reason ?? null,
      });
      return { id, status: change.status, version: o.version };
    });
  }

  /** Close every published job whose last date has passed (India time). Safe to run any number of times. */
  async closeExpired(actor: string | null = null): Promise<{ closed: number }> {
    const expired = await this.prisma.opportunities.findMany({
      where: { status: 'published', application_end: { lt: todayIst() } },
      select: { id: true },
    });
    if (expired.length === 0) return { closed: 0 };
    const ids = expired.map((e) => e.id);
    await this.prisma.$transaction(async (tx) => {
      await tx.opportunities.updateMany({
        where: { id: { in: ids }, status: 'published' },
        data: { status: 'closed', closed_at: new Date() },
      });
      await this.audit(tx, actor, 'opportunity.auto_close', null, {
        count: ids.length,
        ids,
      });
    });
    return { closed: ids.length };
  }

  /* ------------------------------------------------------------------ helpers */

  /** The opportunity columns the editor controls. */
  private columns(i: OpportunityInput) {
    return {
      title: i.title,
      type: i.type,
      category: i.category,
      organization_id: i.organization_id,
      notification_number: i.notification_number,
      summary: i.summary,
      state_codes: i.state_codes,
      districts: i.districts,
      vacancies_total: i.vacancies_total,
      fee_text: i.fee_text,
      application_start: day(i.application_start),
      application_end: day(i.application_end),
      notification_pdf_url: i.notification_pdf_url,
      official_page_url: i.official_page_url,
      apply_url: i.apply_url,
      official_website: i.official_website,
      field_status: toJson(i.field_status),
    };
  }

  /** Main eligibility, posts and dates: the editor always sends the full list. */
  private async writeChildren(
    tx: Tx,
    id: string,
    i: OpportunityInput,
  ): Promise<void> {
    // Eligibility for the whole notification (post_id = null). Per-post rules are kept as they are.
    const main = await tx.opportunity_eligibility.findFirst({
      where: { opportunity_id: id, post_id: null },
      select: { id: true },
    });
    if (i.eligibility) {
      const e = i.eligibility;
      const data = {
        ...e,
        age_as_on_date: day(e.age_as_on_date),
        age_relaxations: toJson(e.age_relaxations),
      };
      if (main)
        await tx.opportunity_eligibility.update({
          where: { id: main.id },
          data,
        });
      else
        await tx.opportunity_eligibility.create({
          data: { ...data, opportunity_id: id },
        });
    } else if (main) {
      await tx.opportunity_eligibility.delete({ where: { id: main.id } });
    }

    // Posts: update the ones sent with an id, create the new ones, delete the rest.
    const keepPosts = i.posts.flatMap((p) => (p.id ? [p.id] : []));
    await tx.opportunity_posts.deleteMany({
      where: { opportunity_id: id, id: { notIn: keepPosts } },
    });
    for (const [n, p] of i.posts.entries()) {
      const data = {
        name: p.name,
        vacancies_total: p.vacancies_total,
        pay_level: p.pay_level,
        salary_text: p.salary_text,
        sort_order: n,
      };
      if (p.id)
        await tx.opportunity_posts.updateMany({
          where: { id: p.id, opportunity_id: id },
          data,
        });
      else
        await tx.opportunity_posts.create({
          data: { ...data, opportunity_id: id },
        });
    }

    // Dates: same pattern.
    const keepDates = i.dates.flatMap((d) => (d.id ? [d.id] : []));
    await tx.opportunity_dates.deleteMany({
      where: { opportunity_id: id, id: { notIn: keepDates } },
    });
    for (const d of i.dates) {
      const data = {
        kind: d.kind,
        date: day(d.date)!,
        end_date: day(d.end_date),
        is_tentative: d.is_tentative,
        note: d.note,
      };
      if (d.id)
        await tx.opportunity_dates.updateMany({
          where: { id: d.id, opportunity_id: id },
          data,
        });
      else
        await tx.opportunity_dates.create({
          data: { ...data, opportunity_id: id },
        });
    }
  }

  /** Save the full current state as a new approved version; returns the new version number. */
  private async snapshot(
    tx: Tx,
    id: string,
    actor: string | null,
    note: string,
    changed: string[],
  ): Promise<number> {
    const full = await tx.opportunities.findUniqueOrThrow({
      where: { id },
      include: {
        opportunity_posts: true,
        opportunity_eligibility: true,
        opportunity_dates: true,
      },
    });
    const last = await tx.opportunity_versions.aggregate({
      where: { opportunity_id: id },
      _max: { version_no: true },
    });
    const version = Math.max(full.version, last._max.version_no ?? 0) + 1;
    await tx.opportunity_versions.create({
      data: {
        opportunity_id: id,
        version_no: version,
        status: 'approved',
        snapshot: toJson(full),
        changed_fields: changed,
        change_note: note,
        created_by: actor,
        reviewed_by: actor,
        reviewed_at: new Date(),
      },
    });
    await tx.opportunities.update({ where: { id }, data: { version } });
    return version;
  }

  private audit(
    tx: Tx,
    actor: string | null,
    action: string,
    targetId: string | null,
    details: Record<string, unknown>,
  ) {
    return tx.audit_logs.create({
      data: {
        actor_id: actor,
        action,
        target_type: 'opportunity',
        target_id: targetId,
        details: toJson(details),
      },
    });
  }

  private async load(tx: Tx, id: string) {
    const o = await tx.opportunities.findUnique({ where: { id } });
    if (!o) throw new NotFoundException(`No opportunity with id ${id}`);
    return o;
  }

  private async assertOrganization(id: string): Promise<void> {
    const found = await this.prisma.organizations.count({ where: { id } });
    if (!found)
      throw new BadRequestException({
        message: 'Some fields are not valid',
        errors: ['organization_id: unknown organisation'],
      });
  }

  private async freeSlug(tx: Tx, base: string): Promise<string> {
    const taken = new Set(
      (
        await tx.opportunities.findMany({
          where: { slug: { startsWith: base } },
          select: { slug: true },
        })
      ).map((r) => r.slug),
    );
    if (!taken.has(base)) return base;
    for (let n = 2; ; n++)
      if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }

  async listVersions(opportunityId: string): Promise<any> {
    const opp = await this.prisma.opportunities.findUnique({
      where: { id: opportunityId },
      select: { version: true },
    });
    if (!opp) throw new NotFoundException(`Opportunity with id ${opportunityId} not found`);

    const rows = await this.prisma.opportunity_versions.findMany({
      where: { opportunity_id: opportunityId },
      include: {
        users_opportunity_versions_created_byTousers: { select: { email: true } },
      },
      orderBy: { version_no: 'desc' },
    });

    const versions = rows.map((r) => ({
      id: r.id,
      opportunity_id: r.opportunity_id,
      version_no: r.version_no,
      status: r.status as any,
      changed_fields: r.changed_fields,
      change_note: r.change_note,
      created_by: r.created_by,
      creator_name: r.users_opportunity_versions_created_byTousers?.email || 'Editorial Staff',
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at ? r.reviewed_at.toISOString() : null,
      created_at: r.created_at.toISOString(),
      snapshot: (r.snapshot as Record<string, any>) || {},
    }));

    return {
      opportunity_id: opportunityId,
      current_version: opp.version,
      versions,
    };
  }

  async restoreVersion(
    opportunityId: string,
    versionNo: number,
    actor: string | null,
  ): Promise<{ ok: boolean; version: number }> {
    const targetVer = await this.prisma.opportunity_versions.findUnique({
      where: {
        opportunity_id_version_no: {
          opportunity_id: opportunityId,
          version_no: versionNo,
        },
      },
    });

    if (!targetVer) {
      throw new NotFoundException(
        `Version #${versionNo} for opportunity ${opportunityId} not found`,
      );
    }

    const snapshot = targetVer.snapshot as Record<string, any>;
    if (!snapshot || !snapshot.title) {
      throw new BadRequestException('Version snapshot data is invalid or missing.');
    }

    const newVersion = await this.prisma.$transaction(async (tx) => {
      await tx.opportunities.update({
        where: { id: opportunityId },
        data: {
          title: snapshot.title,
          summary: snapshot.summary ?? null,
          notification_number: snapshot.notification_number ?? null,
          notification_pdf_url: snapshot.notification_pdf_url ?? null,
          official_page_url: snapshot.official_page_url ?? null,
          apply_url: snapshot.apply_url ?? null,
          vacancies_total: snapshot.vacancies_total ?? null,
          fee_text: snapshot.fee_text ?? null,
          application_start: snapshot.application_start ? new Date(snapshot.application_start) : null,
          application_end: snapshot.application_end ? new Date(snapshot.application_end) : null,
          updated_at: new Date(),
        },
      });

      const v = await this.snapshot(
        tx,
        opportunityId,
        actor,
        `Restored from Version #${versionNo}`,
        ['all_restored'],
      );

      await this.audit(tx, actor, 'opportunity.version_restored', opportunityId, {
        restored_from_version: versionNo,
        new_version: v,
      });

      return v;
    });

    return { ok: true, version: newVersion };
  }
}

/** Top-level columns whose value changed (for the audit log and version history). */
function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const norm = (v: unknown) =>
    JSON.stringify(
      v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? null),
    );
  return Object.keys(after).filter((k) => norm(before[k]) !== norm(after[k]));
}
