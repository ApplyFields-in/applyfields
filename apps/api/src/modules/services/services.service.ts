import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  GovServiceCard,
  GovServiceDetail,
  GovServiceProcessStep,
  Fee,
  RequiredDocument,
  UpdateItem,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

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
  ALL: 'All India',
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List published services with optional category, state, and keyword search. */
  async list(filters?: {
    category?: string;
    state?: string;
    q?: string;
    take?: number;
  }): Promise<GovServiceCard[]> {
    const q = filters?.q?.trim();
    const category = filters?.category?.trim();
    const state = filters?.state?.trim();
    const take = filters?.take ?? 100;

    const words = (q ?? '').split(/\s+/).filter(Boolean);

    const rows = await this.prisma.gov_services.findMany({
      where: {
        status: 'published',
        ...(category && category !== 'All' && category !== 'all'
          ? { category: { equals: category, mode: 'insensitive' as const } }
          : {}),
        ...(state && state !== 'All' && state !== 'ALL' && state !== 'All India'
          ? { state_codes: { hasSome: [state.toUpperCase(), 'ALL'] } }
          : {}),
        ...(words.length > 0
          ? {
              AND: words.map((w) => ({
                OR: [
                  { name: { contains: w, mode: 'insensitive' as const } },
                  { description: { contains: w, mode: 'insensitive' as const } },
                  { authority_name: { contains: w, mode: 'insensitive' as const } },
                ],
              })),
            }
          : {}),
      },
      include: {
        organizations: {
          select: { name: true, short_name: true },
        },
      },
      orderBy: [{ name: 'asc' }],
      take,
    });

    return rows.map((r) => {
      const states = r.state_codes.filter((s) => s !== 'ALL');
      const location =
        states.length === 0
          ? 'All India'
          : states.map((s) => STATE_NAMES[s] ?? s).join(', ');

      const docs = Array.isArray(r.required_documents) ? r.required_documents : [];

      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        category: r.category,
        organization: r.organizations?.name ?? null,
        authority_name: r.authority_name,
        authority_level: r.authority_level,
        location,
        state_codes: r.state_codes,
        description: r.description,
        fee_text: r.fee_text,
        processing_time_text: r.processing_time_text,
        required_documents_count: docs.length,
        official_url: r.official_url,
        apply_url: r.apply_url,
        assistance_available: r.assistance_available,
        status: r.status,
        published_at: r.published_at?.toISOString() ?? null,
      };
    });
  }

  /** Retrieve full published service details by slug. */
  async findBySlug(slug: string): Promise<GovServiceDetail | null> {
    const row = await this.prisma.gov_services.findFirst({
      where: {
        slug,
        status: 'published',
      },
      include: {
        organizations: {
          select: { id: true, name: true, short_name: true, level: true },
        },
        updates: {
          where: { status: 'published' },
          orderBy: [{ date: 'desc' }, { published_at: 'desc' }],
          take: 5,
        },
      },
    });

    if (!row) return null;

    const docs = (row.required_documents ?? []) as unknown as RequiredDocument[];
    const fees = (row.fees ?? []) as unknown as Fee[];
    const steps = (row.process_steps ?? []) as unknown as GovServiceProcessStep[];

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
      required_documents: docs,
      fees,
      fee_text: row.fee_text,
      process_steps: steps,
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
}
