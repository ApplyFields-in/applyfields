import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminPartnerItem,
  AdminPartnerListResponse,
  AdminPartnerVerifyInput,
  PartnerDetail,
  PartnerDirectoryQuery,
  PartnerDirectoryResponse,
  PartnerDocumentSummary,
  PartnerRegistrationInput,
  PartnerServiceDetail,
  PartnerServiceInput,
  PartnerSummary,
  PartnerType,
  PartnerUpdateInput,
  PartnerVerificationStatus,
} from '@applyfields/types';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { partner_type, verification_status } from '../../generated/prisma/enums.js';

export const partnerDirectoryQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  service: z.string().trim().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const partnerRegisterSchema = z.object({
  business_name: z.string().trim().min(2).max(150),
  type: z.enum([
    'meeseva',
    'csc',
    'xerox_printing',
    'browsing_centre',
    'typing_centre',
    'passport_studio',
    'application_assistance',
    'consultant',
    'college',
    'training_institution',
    'other',
  ]),
  owner_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().min(3).max(300),
  state_code: z.string().trim().length(2).toUpperCase(),
  district: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  service_areas: z.array(z.string().trim()).optional().default([]),
  working_hours: z.record(z.string(), z.array(z.string())).optional().default({}),
  description: z.string().trim().max(1000).optional(),
});

export const partnerUpdateSchema = z.object({
  business_name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  owner_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/).optional(),
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().min(3).max(300).optional(),
  state_code: z.string().trim().length(2).toUpperCase().optional(),
  district: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  working_hours: z.record(z.string(), z.array(z.string())).optional(),
  is_available: z.boolean().optional(),
});

export const partnerServiceInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  charge_paise: z.number().int().min(0).optional(),
  charge_text: z.string().trim().max(100).optional(),
  estimated_time_text: z.string().trim().max(100).optional(),
  is_active: z.boolean().optional().default(true),
  service_id: z.string().uuid().optional(),
});

export const partnerVerifySchema = z.object({
  verification_status: z.enum(['pending', 'verified', 'rejected']),
  is_listed: z.boolean(),
  reviewer_note: z.string().trim().max(500).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // PUBLIC DIRECTORY & SEARCH
  // =========================================================================

  async listDirectory(query: PartnerDirectoryQuery): Promise<PartnerDirectoryResponse> {
    const where: any = {
      is_listed: true,
      verification_status: 'verified',
    };

    if (query.type) {
      where.type = query.type as partner_type;
    }
    if (query.state) {
      where.state_code = query.state.toUpperCase();
    }
    if (query.district) {
      where.district = { contains: query.district, mode: 'insensitive' };
    }
    if (query.pincode) {
      where.pincode = query.pincode.trim();
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { business_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { pincode: { contains: q } },
        {
          partner_services: {
            some: {
              name: { contains: q, mode: 'insensitive' },
              is_active: true,
            },
          },
        },
      ];
    }
    if (query.service) {
      where.partner_services = {
        some: {
          name: { contains: query.service.trim(), mode: 'insensitive' },
          is_active: true,
        },
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.partners.count({ where }),
      this.prisma.partners.findMany({
        where,
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
        orderBy: [{ rating_avg: 'desc' }, { created_at: 'desc' }],
        include: {
          partner_services: {
            where: { is_active: true },
            take: 6,
          },
        },
      }),
    ]);

    const items: PartnerSummary[] = rows.map((p) => this.mapToSummary(p));

    return { total, items };
  }

  async getBySlug(slug: string): Promise<PartnerDetail> {
    const partner = await this.prisma.partners.findUnique({
      where: { slug },
      include: {
        partner_services: {
          where: { is_active: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!partner || !partner.is_listed || partner.verification_status !== 'verified') {
      throw new NotFoundException(`Partner center "${slug}" not found or not active`);
    }

    return this.mapToDetail(partner);
  }

  // =========================================================================
  // ONBOARDING & PARTNER SELF-SERVICE
  // =========================================================================

  async register(
    userId: string | null,
    input: PartnerRegistrationInput,
  ): Promise<PartnerDetail> {
    const baseSlug = slugify(input.business_name) || 'partner';
    let slug = baseSlug;
    let counter = 1;

    // Check slug collision
    while (await this.prisma.partners.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${input.pincode ? input.pincode.slice(-4) : counter}`;
      counter++;
    }

    const partner = await this.prisma.$transaction(async (tx) => {
      const created = await tx.partners.create({
        data: {
          slug,
          type: input.type as partner_type,
          business_name: input.business_name,
          owner_name: input.owner_name,
          phone: input.phone,
          whatsapp: input.whatsapp || input.phone,
          email: input.email,
          address: input.address,
          state_code: input.state_code.toUpperCase(),
          district: input.district,
          city: input.city,
          pincode: input.pincode,
          latitude: input.latitude !== undefined && input.latitude !== null ? input.latitude : null,
          longitude: input.longitude !== undefined && input.longitude !== null ? input.longitude : null,
          service_areas: input.service_areas ?? [],
          working_hours: input.working_hours ?? {},
          description: input.description,
          verification_status: 'pending',
          is_listed: false,
          is_available: true,
        },
      });

      if (userId) {
        await tx.partner_members.create({
          data: {
            partner_id: created.id,
            user_id: userId,
            role: 'owner',
          },
        });
      }

      return created;
    });

    return this.mapToDetail({ ...partner, partner_services: [] });
  }

  async getPartnerForUser(userId: string): Promise<PartnerDetail> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
      include: {
        partners: {
          include: {
            partner_services: {
              orderBy: { created_at: 'desc' },
            },
            partner_documents: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    });

    if (!membership || !membership.partners) {
      throw new NotFoundException('No partner center profile found linked to this account.');
    }

    return this.mapToDetail(membership.partners);
  }

  async updateProfile(userId: string, input: PartnerUpdateInput): Promise<PartnerDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const updated = await this.prisma.partners.update({
      where: { id: membership.partner_id },
      data: {
        ...(input.business_name && { business_name: input.business_name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.owner_name && { owner_name: input.owner_name }),
        ...(input.phone && { phone: input.phone }),
        ...(input.whatsapp && { whatsapp: input.whatsapp }),
        ...(input.address && { address: input.address }),
        ...(input.state_code && { state_code: input.state_code.toUpperCase() }),
        ...(input.district && { district: input.district }),
        ...(input.city && { city: input.city }),
        ...(input.pincode && { pincode: input.pincode }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.working_hours && { working_hours: input.working_hours }),
        ...(input.is_available !== undefined && { is_available: input.is_available }),
      },
      include: {
        partner_services: true,
        partner_documents: true,
      },
    });

    return this.mapToDetail(updated);
  }

  async listServices(userId: string): Promise<PartnerServiceDetail[]> {
    const membership = await this.requirePartnerOwner(userId);

    const services = await this.prisma.partner_services.findMany({
      where: { partner_id: membership.partner_id },
      orderBy: { created_at: 'desc' },
    });

    return services.map((s) => ({
      id: s.id,
      partner_id: s.partner_id,
      service_id: s.service_id,
      name: s.name,
      description: s.description,
      charge_paise: s.charge_paise,
      charge_text: s.charge_text,
      estimated_time_text: s.estimated_time_text,
      is_active: s.is_active,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    }));
  }

  async addService(userId: string, input: PartnerServiceInput): Promise<PartnerServiceDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const created = await this.prisma.partner_services.create({
      data: {
        partner_id: membership.partner_id,
        name: input.name,
        description: input.description,
        charge_paise: input.charge_paise,
        charge_text: input.charge_text,
        estimated_time_text: input.estimated_time_text,
        is_active: input.is_active ?? true,
        service_id: input.service_id,
      },
    });

    return {
      id: created.id,
      partner_id: created.partner_id,
      service_id: created.service_id,
      name: created.name,
      description: created.description,
      charge_paise: created.charge_paise,
      charge_text: created.charge_text,
      estimated_time_text: created.estimated_time_text,
      is_active: created.is_active,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    };
  }

  async updateService(
    userId: string,
    serviceId: string,
    input: Partial<PartnerServiceInput>,
  ): Promise<PartnerServiceDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const existing = await this.prisma.partner_services.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.partner_id !== membership.partner_id) {
      throw new NotFoundException('Service not found or unauthorized');
    }

    const updated = await this.prisma.partner_services.update({
      where: { id: serviceId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.charge_paise !== undefined && { charge_paise: input.charge_paise }),
        ...(input.charge_text !== undefined && { charge_text: input.charge_text }),
        ...(input.estimated_time_text !== undefined && {
          estimated_time_text: input.estimated_time_text,
        }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
    });

    return {
      id: updated.id,
      partner_id: updated.partner_id,
      service_id: updated.service_id,
      name: updated.name,
      description: updated.description,
      charge_paise: updated.charge_paise,
      charge_text: updated.charge_text,
      estimated_time_text: updated.estimated_time_text,
      is_active: updated.is_active,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  async deleteService(userId: string, serviceId: string): Promise<{ success: boolean }> {
    const membership = await this.requirePartnerOwner(userId);

    const existing = await this.prisma.partner_services.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.partner_id !== membership.partner_id) {
      throw new NotFoundException('Service not found or unauthorized');
    }

    await this.prisma.partner_services.delete({
      where: { id: serviceId },
    });

    return { success: true };
  }

  async uploadDocument(
    userId: string,
    doc: { document_kind: string; storage_path: string },
  ): Promise<PartnerDocumentSummary> {
    const membership = await this.requirePartnerOwner(userId);

    const created = await this.prisma.partner_documents.create({
      data: {
        partner_id: membership.partner_id,
        document_kind: doc.document_kind,
        storage_path: doc.storage_path,
        status: 'pending',
      },
    });

    return {
      id: created.id,
      partner_id: created.partner_id,
      document_kind: created.document_kind,
      storage_path: created.storage_path,
      status: created.status as PartnerVerificationStatus,
      reviewer_note: created.reviewer_note,
      reviewed_at: created.reviewed_at ? created.reviewed_at.toISOString() : null,
      created_at: created.created_at.toISOString(),
    };
  }

  // =========================================================================
  // ADMIN WORKFLOWS & VERIFICATION (StaffGuard)
  // =========================================================================

  async adminListPartners(query: {
    status?: string;
    type?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminPartnerListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.verification_status = query.status as verification_status;
    }
    if (query.type) {
      where.type = query.type as partner_type;
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { business_name: { contains: q, mode: 'insensitive' } },
        { owner_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.partners.count({ where }),
      this.prisma.partners.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          partner_members: {
            take: 1,
            include: {
              users: { select: { id: true, email: true } },
            },
          },
          partner_services: { where: { is_active: true } },
          _count: {
            select: { partner_documents: true },
          },
        },
      }),
    ]);

    const items: AdminPartnerItem[] = rows.map((p) => {
      const summary = this.mapToSummary(p);
      const ownerMember = p.partner_members?.[0];
      return {
        ...summary,
        owner_user_id: ownerMember?.users?.id ?? null,
        owner_user_email: ownerMember?.users?.email ?? null,
        documents_count: p._count?.partner_documents ?? 0,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
      };
    });

    return { total, items };
  }

  async adminVerifyPartner(
    partnerId: string,
    reviewerId: string,
    input: AdminPartnerVerifyInput,
  ): Promise<PartnerDetail> {
    const existing = await this.prisma.partners.findUnique({
      where: { id: partnerId },
    });
    if (!existing) {
      throw new NotFoundException(`Partner with ID "${partnerId}" not found`);
    }

    const updated = await this.prisma.partners.update({
      where: { id: partnerId },
      data: {
        verification_status: input.verification_status as verification_status,
        is_listed: input.is_listed,
        verified_by: reviewerId,
        verified_at: new Date(),
      },
      include: {
        partner_services: true,
        partner_documents: true,
      },
    });

    return this.mapToDetail(updated);
  }

  async adminVerifyDocument(
    docId: string,
    reviewerId: string,
    status: 'verified' | 'rejected',
    reviewer_note?: string,
  ): Promise<PartnerDocumentSummary> {
    const existing = await this.prisma.partner_documents.findUnique({
      where: { id: docId },
    });
    if (!existing) {
      throw new NotFoundException(`Document with ID "${docId}" not found`);
    }

    const updated = await this.prisma.partner_documents.update({
      where: { id: docId },
      data: {
        status: status as verification_status,
        reviewer_note: reviewer_note ?? null,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
    });

    return {
      id: updated.id,
      partner_id: updated.partner_id,
      document_kind: updated.document_kind,
      storage_path: updated.storage_path,
      status: updated.status as PartnerVerificationStatus,
      reviewer_note: updated.reviewer_note,
      reviewed_at: updated.reviewed_at ? updated.reviewed_at.toISOString() : null,
      created_at: updated.created_at.toISOString(),
    };
  }

  // =========================================================================
  // HELPERS & MAPPERS
  // =========================================================================

  private async requirePartnerOwner(userId: string) {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have a partner account registered.');
    }
    return membership;
  }

  private mapToSummary(p: any): PartnerSummary {
    return {
      id: p.id,
      slug: p.slug,
      type: p.type as PartnerType,
      business_name: p.business_name,
      description: p.description,
      logo_url: p.logo_url,
      owner_name: p.owner_name,
      phone: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      address: p.address,
      state_code: p.state_code,
      district: p.district,
      city: p.city,
      pincode: p.pincode,
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      service_areas: p.service_areas || [],
      working_hours: (p.working_hours as Record<string, string[]>) || {},
      is_available: p.is_available,
      verification_status: p.verification_status as PartnerVerificationStatus,
      is_listed: p.is_listed,
      rating_avg: p.rating_avg ? Number(p.rating_avg) : 0,
      rating_count: p.rating_count || 0,
      services: (p.partner_services || []).map((s: any) => ({
        id: s.id,
        partner_id: s.partner_id,
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        charge_paise: s.charge_paise,
        charge_text: s.charge_text,
        estimated_time_text: s.estimated_time_text,
        is_active: s.is_active,
      })),
    };
  }

  private mapToDetail(p: any): PartnerDetail {
    const summary = this.mapToSummary(p);
    return {
      ...summary,
      institution_id: p.institution_id || null,
      verified_at: p.verified_at ? p.verified_at.toISOString() : null,
      created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
      updated_at: p.updated_at ? p.updated_at.toISOString() : new Date().toISOString(),
      services: (p.partner_services || []).map((s: any) => ({
        id: s.id,
        partner_id: s.partner_id,
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        charge_paise: s.charge_paise,
        charge_text: s.charge_text,
        estimated_time_text: s.estimated_time_text,
        is_active: s.is_active,
        created_at: s.created_at ? s.created_at.toISOString() : new Date().toISOString(),
        updated_at: s.updated_at ? s.updated_at.toISOString() : new Date().toISOString(),
      })),
      documents: (p.partner_documents || []).map((d: any) => ({
        id: d.id,
        partner_id: d.partner_id,
        document_kind: d.document_kind,
        storage_path: d.storage_path,
        status: d.status as PartnerVerificationStatus,
        reviewer_note: d.reviewer_note,
        reviewed_at: d.reviewed_at ? d.reviewed_at.toISOString() : null,
        created_at: d.created_at ? d.created_at.toISOString() : new Date().toISOString(),
      })),
    };
  }
}
