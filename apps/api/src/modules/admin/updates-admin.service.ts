import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminUpdateDetail,
  AdminUpdateList,
  AdminUpdateListItem,
  OpportunityStatus,
  StatusChange,
  UpdateInput,
  WriteResult,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type Tx = Prisma.TransactionClient;

const STATUSES: OpportunityStatus[] = [
  'draft',
  'published',
  'closed',
  'archived',
];
const day = (s: string | null) => (s ? new Date(`${s}T00:00:00Z`) : null);
const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const SELECT = {
  id: true,
  kind: true,
  title: true,
  date: true,
  status: true,
  url: true,
  summary: true,
  source_url: true,
  published_at: true,
  created_at: true,
  updated_at: true,
  opportunities: { select: { id: true, title: true, status: true } },
  gov_services: { select: { id: true, name: true } },
} satisfies Prisma.updatesSelect;

type Row = Prisma.updatesGetPayload<{ select: typeof SELECT }>;

/** What blocks publishing an update (job-format §6). Empty = ready. */
export function updateBlockers(u: {
  title: string;
  url: string | null;
  source_url: string | null;
  parent: AdminUpdateListItem['parent'];
}): string[] {
  const missing: string[] = [];
  if (!u.title.trim()) missing.push('Title');
  if (!u.parent) missing.push('The job or exam it belongs to');
  else if (
    u.parent.kind === 'opportunity' &&
    u.parent.status !== 'published' &&
    u.parent.status !== 'closed'
  ) {
    missing.push('Publish the job it belongs to first');
  }
  if (!u.url && !u.source_url) missing.push('Official link');
  return missing;
}

@Injectable()
export class UpdatesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(f: {
    q?: string;
    status?: OpportunityStatus;
  }): Promise<AdminUpdateList> {
    const words = (f.q ?? '').trim().split(/\s+/).filter(Boolean);
    const base: Prisma.updatesWhereInput = {
      AND: words.map((w) => ({
        OR: [
          { title: { contains: w, mode: 'insensitive' } },
          { opportunities: { title: { contains: w, mode: 'insensitive' } } },
        ],
      })),
    };
    const where: Prisma.updatesWhereInput = f.status
      ? { AND: [base, { status: f.status }] }
      : base;
    const [rows, total, grouped] = await Promise.all([
      this.prisma.updates.findMany({
        where,
        select: SELECT,
        orderBy: [{ created_at: 'desc' }],
        take: 200,
      }),
      this.prisma.updates.count({ where }),
      this.prisma.updates.groupBy({
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
    return { total, counts, items: rows.map((r) => this.toItem(r)) };
  }

  async detail(id: string): Promise<AdminUpdateDetail> {
    const r = await this.prisma.updates.findUnique({
      where: { id },
      select: SELECT,
    });
    if (!r) throw new NotFoundException(`No update with id ${id}`);
    const item = this.toItem(r);
    return {
      ...item,
      url: r.url,
      summary: r.summary,
      published_at: r.published_at?.toISOString() ?? null,
      updated_at: r.updated_at.toISOString(),
      missing: updateBlockers({
        title: r.title,
        url: r.url,
        source_url: r.source_url,
        parent: item.parent,
      }),
    };
  }

  async create(input: UpdateInput, actor: string | null): Promise<WriteResult> {
    await this.assertOpportunity(input.opportunity_id);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.updates.create({
        data: { ...this.columns(input), status: 'draft' },
        select: { id: true, status: true },
      });
      await this.audit(tx, actor, 'update.create', row.id, {});
      return row;
    });
  }

  async save(
    id: string,
    input: UpdateInput,
    actor: string | null,
  ): Promise<WriteResult> {
    await this.assertOpportunity(input.opportunity_id);
    return this.prisma.$transaction(async (tx) => {
      const before = await this.load(tx, id);
      if (
        before.status === 'published' &&
        !input.opportunity_id &&
        !before.service_id
      ) {
        throw new BadRequestException({
          message: 'A live update must stay linked',
          missing: ['The job or exam it belongs to'],
        });
      }
      await tx.updates.update({ where: { id }, data: this.columns(input) });
      await this.audit(tx, actor, 'update.update', id, {
        status: before.status,
      });
      return { id, status: before.status };
    });
  }

  /** Make it public. The controller then notifies everyone who saved the job (NotificationsService). */
  async publish(id: string, actor: string | null): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.updates.findUnique({ where: { id }, select: SELECT });
      if (!r) throw new NotFoundException(`No update with id ${id}`);
      if (r.status === 'published')
        throw new ConflictException('Already published');
      const missing = updateBlockers({
        title: r.title,
        url: r.url,
        source_url: r.source_url,
        parent: this.toItem(r).parent,
      });
      if (missing.length)
        throw new BadRequestException({
          message: 'Fix these before publishing',
          missing,
        });
      await tx.updates.update({
        where: { id },
        data: {
          status: 'published',
          published_at: new Date(),
          published_by: actor,
          date: r.date ?? new Date(),
        },
      });
      await this.audit(tx, actor, 'update.publish', id, { from: r.status });
      return { id, status: 'published' };
    });
  }

  /** Unpublish (→ draft) or reject/archive (→ archived, reason required). Updates don't "close". */
  async setStatus(
    id: string,
    change: StatusChange,
    actor: string | null,
  ): Promise<WriteResult> {
    if (change.status === 'closed')
      throw new BadRequestException(
        'Updates can be unpublished or archived, not closed',
      );
    return this.prisma.$transaction(async (tx) => {
      const before = await this.load(tx, id);
      if (before.status === change.status)
        throw new ConflictException(`Already ${change.status}`);
      await tx.updates.update({
        where: { id },
        data: { status: change.status },
      });
      const action =
        change.status === 'draft'
          ? 'update.unpublish'
          : before.status === 'draft'
            ? 'update.reject'
            : 'update.archive';
      await this.audit(tx, actor, action, id, {
        from: before.status,
        reason: change.reason ?? null,
      });
      return { id, status: change.status };
    });
  }

  private toItem(r: Row): AdminUpdateListItem {
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      date: isoDay(r.date),
      status: r.status,
      parent: r.opportunities
        ? {
            kind: 'opportunity',
            id: r.opportunities.id,
            title: r.opportunities.title,
            status: r.opportunities.status,
          }
        : r.gov_services
          ? {
              kind: 'service',
              id: r.gov_services.id,
              title: r.gov_services.name,
              status: null,
            }
          : null,
      source_url: r.source_url,
      created_at: r.created_at.toISOString(),
    };
  }

  private columns(i: UpdateInput) {
    return {
      kind: i.kind,
      title: i.title,
      date: day(i.date),
      url: i.url,
      summary: i.summary,
      opportunity_id: i.opportunity_id,
      source_url: i.source_url ?? i.url,
    };
  }

  private async load(tx: Tx, id: string) {
    const u = await tx.updates.findUnique({ where: { id } });
    if (!u) throw new NotFoundException(`No update with id ${id}`);
    return u;
  }

  private async assertOpportunity(id: string | null): Promise<void> {
    if (!id) return;
    if (!(await this.prisma.opportunities.count({ where: { id } }))) {
      throw new BadRequestException({
        message: 'Some fields are not valid',
        errors: ['opportunity_id: unknown job'],
      });
    }
  }

  private audit(
    tx: Tx,
    actor: string | null,
    action: string,
    targetId: string,
    details: Record<string, unknown>,
  ) {
    return tx.audit_logs.create({
      data: {
        actor_id: actor,
        action,
        target_type: 'update',
        target_id: targetId,
        details: JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue,
      },
    });
  }
}
