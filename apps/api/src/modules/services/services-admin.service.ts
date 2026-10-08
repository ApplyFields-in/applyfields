import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminGovServiceList,
  AdminGovServiceListItem,
  GovServiceDetail,
  GovServiceInput,
  GovServiceProcessStep,
  Fee,
  OpportunityStatus,
  RequiredDocument,
  WriteResult,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type Tx = Prisma.TransactionClient;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'service'
  );
}

const toJson = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

@Injectable()
export class ServicesAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** List services for internal staff with status filters & search. */
  async list(filters: {
    q?: string;
    status?: OpportunityStatus;
    page: number;
    pageSize: number;
  }): Promise<AdminGovServiceList> {
    const words = (filters.q ?? '').trim().split(/\s+/).filter(Boolean);
    const search: Prisma.gov_servicesWhereInput[] = words.map((w) => ({
      OR: [
        { name: { contains: w, mode: 'insensitive' } },
        { slug: { contains: w.toLowerCase() } },
        { authority_name: { contains: w, mode: 'insensitive' } },
      ],
    }));

    const baseWhere: Prisma.gov_servicesWhereInput = search.length > 0 ? { AND: search } : {};
    const where: Prisma.gov_servicesWhereInput = filters.status
      ? { AND: [baseWhere, { status: filters.status }] }
      : baseWhere;

    const [rows, total, grouped] = await Promise.all([
      this.prisma.gov_services.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          authority_name: true,
          status: true,
          state_codes: true,
          updated_at: true,
          published_at: true,
        },
        orderBy: [{ updated_at: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.gov_services.count({ where }),
      this.prisma.gov_services.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const counts: Record<OpportunityStatus, number> = {
      draft: 0,
      published: 0,
      closed: 0,
      archived: 0,
    };
    for (const g of grouped) {
      if (g.status in counts) counts[g.status as OpportunityStatus] = g._count._all;
    }

    return {
      total,
      counts,
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        category: r.category,
        authority_name: r.authority_name,
        status: r.status,
        state_codes: r.state_codes,
        updated_at: r.updated_at.toISOString(),
        published_at: r.published_at?.toISOString() ?? null,
      })),
    };
  }

  /** Retrieve single service for edit form. */
  async get(id: string): Promise<GovServiceDetail> {
    const row = await this.prisma.gov_services.findUnique({
      where: { id },
      include: {
        organizations: {
          select: { id: true, name: true, short_name: true, level: true },
        },
        updates: {
          orderBy: [{ date: 'desc' }, { published_at: 'desc' }],
          take: 5,
        },
      },
    });

    if (!row) throw new NotFoundException(`No government service with id ${id}`);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      organization_id: row.organization_id,
      organization: row.organizations,
      description: row.description,
      who_needs_it: row.who_needs_it,
      eligibility_text: row.eligibility_text,
      required_documents: (row.required_documents ?? []) as unknown as RequiredDocument[],
      fees: (row.fees ?? []) as unknown as Fee[],
      fee_text: row.fee_text,
      process_steps: (row.process_steps ?? []) as unknown as GovServiceProcessStep[],
      processing_time_text: row.processing_time_text,
      authority_name: row.authority_name,
      authority_level: row.authority_level,
      state_codes: row.state_codes,
      official_url: row.official_url,
      apply_url: row.apply_url,
      assistance_available: row.assistance_available,
      status: row.status,
      published_at: row.published_at?.toISOString() ?? null,
      last_verified_at: row.last_verified_at?.toISOString() ?? null,
      updates: row.updates.map((u) => ({
        id: u.id,
        kind: u.kind,
        title: u.title,
        organization: row.authority_name ?? row.name,
        date: (u.date ?? u.published_at ?? new Date()).toISOString().slice(0, 10),
        opportunity_slug: null,
      })),
    };
  }

  /** Create a new draft service with audit logging. */
  async create(input: GovServiceInput, actor: string | null): Promise<WriteResult> {
    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.gov_services.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.gov_services.create({
        data: {
          slug,
          name: input.name,
          category: input.category,
          organization_id: input.organization_id || null,
          description: input.description,
          who_needs_it: input.who_needs_it,
          eligibility_text: input.eligibility_text,
          required_documents: toJson(input.required_documents),
          fees: toJson(input.fees),
          fee_text: input.fee_text,
          process_steps: toJson(input.process_steps),
          processing_time_text: input.processing_time_text,
          authority_name: input.authority_name,
          authority_level: input.authority_level || null,
          state_codes: input.state_codes.length > 0 ? input.state_codes : ['ALL'],
          official_url: input.official_url,
          apply_url: input.apply_url,
          assistance_available: input.assistance_available ?? false,
          status: 'draft',
          created_by: actor,
        },
        select: { id: true, status: true },
      });

      await tx.audit_logs.create({
        data: {
          actor_id: actor,
          action: 'service.create',
          target_type: 'service',
          target_id: row.id,
          details: toJson({ slug, name: input.name }),
        },
      });

      return { id: row.id, status: row.status };
    });
  }

  /** Update service details with audit logging. */
  async update(id: string, input: GovServiceInput, actor: string | null): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.gov_services.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`No government service with id ${id}`);

      const row = await tx.gov_services.update({
        where: { id },
        data: {
          name: input.name,
          category: input.category,
          organization_id: input.organization_id || null,
          description: input.description,
          who_needs_it: input.who_needs_it,
          eligibility_text: input.eligibility_text,
          required_documents: toJson(input.required_documents),
          fees: toJson(input.fees),
          fee_text: input.fee_text,
          process_steps: toJson(input.process_steps),
          processing_time_text: input.processing_time_text,
          authority_name: input.authority_name,
          authority_level: input.authority_level || null,
          state_codes: input.state_codes.length > 0 ? input.state_codes : ['ALL'],
          official_url: input.official_url,
          apply_url: input.apply_url,
          assistance_available: input.assistance_available ?? false,
          last_verified_at: before.status === 'published' ? new Date() : before.last_verified_at,
        },
        select: { id: true, status: true },
      });

      await tx.audit_logs.create({
        data: {
          actor_id: actor,
          action: 'service.update',
          target_type: 'service',
          target_id: id,
          details: toJson({ name: input.name }),
        },
      });

      return { id: row.id, status: row.status };
    });
  }

  /** Publish flow: validates required info and sets status to published. */
  async publish(id: string, actor: string | null): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.gov_services.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`No government service with id ${id}`);

      if (!before.name?.trim()) {
        throw new BadRequestException('Service name is required to publish');
      }
      if (!before.description?.trim()) {
        throw new BadRequestException('Description is required to publish');
      }
      if (!before.official_url?.trim() && !before.apply_url?.trim()) {
        throw new BadRequestException('Official route or application URL is required to publish');
      }

      const now = new Date();
      const row = await tx.gov_services.update({
        where: { id },
        data: {
          status: 'published',
          published_at: before.published_at ?? now,
          last_verified_at: now,
        },
        select: { id: true, status: true },
      });

      await tx.audit_logs.create({
        data: {
          actor_id: actor,
          action: 'service.publish',
          target_type: 'service',
          target_id: id,
          details: toJson({ from: before.status, to: 'published' }),
        },
      });

      return { id: row.id, status: row.status };
    });
  }

  /** Change status (draft, archived, closed) with audit log. */
  async setStatus(
    id: string,
    status: OpportunityStatus,
    reason: string | undefined,
    actor: string | null,
  ): Promise<WriteResult> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.gov_services.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`No government service with id ${id}`);

      const row = await tx.gov_services.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      });

      await tx.audit_logs.create({
        data: {
          actor_id: actor,
          action: `service.${status}`,
          target_type: 'service',
          target_id: id,
          details: toJson({ from: before.status, to: status, reason: reason ?? null }),
        },
      });

      return { id: row.id, status: row.status };
    });
  }

  /** Delete draft service with audit log. */
  async delete(id: string, actor: string | null): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.gov_services.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`No government service with id ${id}`);

      if (before.status === 'published') {
        throw new BadRequestException('Cannot delete a live published service. Unpublish to draft first.');
      }

      await tx.gov_services.delete({ where: { id } });

      await tx.audit_logs.create({
        data: {
          actor_id: actor,
          action: 'service.delete',
          target_type: 'service',
          target_id: id,
          details: toJson({ slug: before.slug, name: before.name }),
        },
      });

      return { success: true };
    });
  }
}
