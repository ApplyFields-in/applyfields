import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  ApplicationTrackerItem,
  ApplicationTrackerListResponse,
  ApplicationTrackerStatus,
  CreateApplicationTrackerInput,
  UpdateApplicationTrackerInput,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { application_status } from '../../generated/prisma/enums.js';

export const TRACKER_TO_DB_STATUS: Record<ApplicationTrackerStatus, application_status> = {
  saved: 'planning',
  planning: 'planning',
  applied: 'applied',
  exam_interview: 'exam_attended',
  selected: 'selected',
  rejected: 'not_selected',
  completed: 'completed',
};

export const DB_TO_TRACKER_STATUS: Record<string, ApplicationTrackerStatus> = {
  planning: 'planning',
  applied: 'applied',
  admit_card_received: 'exam_interview',
  exam_attended: 'exam_interview',
  result_awaited: 'exam_interview',
  selected: 'selected',
  not_selected: 'rejected',
  completed: 'completed',
  withdrawn: 'rejected',
};

interface StoredNotesPayload {
  text?: string;
  roll_number?: string;
  exam_date?: string;
  exam_center?: string;
}

export function serializeTrackerNotes(
  notes?: string | null,
  rollNumber?: string | null,
  examDate?: string | null,
  examCenter?: string | null,
): string {
  const payload: StoredNotesPayload = {
    text: notes || undefined,
    roll_number: rollNumber || undefined,
    exam_date: examDate || undefined,
    exam_center: examCenter || undefined,
  };
  return JSON.stringify(payload);
}

export function parseTrackerNotes(raw?: string | null): StoredNotesPayload {
  if (!raw) return {};
  try {
    if (raw.startsWith('{') && raw.endsWith('}')) {
      return JSON.parse(raw) as StoredNotesPayload;
    }
  } catch {
    // raw was plain text
  }
  return { text: raw };
}

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  // In-memory fallback map for unit tests and local dev
  private inMemoryApps = new Map<string, ApplicationTrackerItem>();

  constructor(private readonly prisma: PrismaService) {}

  private isPrismaUsable(): boolean {
    return Boolean(this.prisma && process.env.NODE_ENV !== 'test');
  }

  async listApplications(
    userId: string,
    statusFilter?: string,
  ): Promise<ApplicationTrackerListResponse> {
    if (this.isPrismaUsable()) {
      try {
        const rows = await this.prisma.applications.findMany({
          where: { user_id: userId },
          include: {
            opportunities: {
              select: {
                id: true,
                slug: true,
                title: true,
                organization_id: true,
                type: true,
                application_end: true,
                organizations: { select: { name: true } },
              },
            },
            gov_services: {
              select: {
                id: true,
                slug: true,
                name: true,
                authority_name: true,
              },
            },
          },
          orderBy: { updated_at: 'desc' },
        });

        const items: ApplicationTrackerItem[] = rows.map((r) => {
          const parsed = parseTrackerNotes(r.notes);
          const trackerStatus = DB_TO_TRACKER_STATUS[r.status] || 'planning';
          const opp = r.opportunities;
          const srv = r.gov_services;

          const title = opp?.title || srv?.name || 'Recruitment Application';
          const organization =
            opp?.organizations?.name || srv?.authority_name || 'Commission';
          const slug = opp?.slug || srv?.slug || 'application';
          const type = opp?.type || (srv ? 'service' : 'govt_job');
          const deadline = opp?.application_end
            ? (opp.application_end instanceof Date
                ? opp.application_end.toISOString().split('T')[0]
                : String(opp.application_end).split('T')[0])
            : null;

          return {
            id: r.id,
            user_id: r.user_id,
            opportunity_id: r.opportunity_id,
            service_id: r.service_id,
            title,
            organization,
            type,
            slug,
            mode: (r.mode as any) || 'official',
            status: trackerStatus,
            application_number: r.application_number,
            roll_number: parsed.roll_number || null,
            exam_date: parsed.exam_date || null,
            exam_center: parsed.exam_center || null,
            applied_on: r.applied_on ? r.applied_on.toISOString().split('T')[0] : null,
            deadline,
            notes: parsed.text || null,
            documents_ready: true,
            created_at: r.created_at.toISOString(),
            updated_at: r.updated_at.toISOString(),
          };
        });

        const filtered = statusFilter && statusFilter !== 'all'
          ? items.filter((i) => i.status === statusFilter)
          : items;

        return { total: filtered.length, items: filtered };
      } catch (err) {
        this.logger.warn(`Failed to list applications from DB: ${(err as Error).message}`);
      }
    }

    const items = Array.from(this.inMemoryApps.values()).filter(
      (a) => a.user_id === userId,
    );
    const filtered = statusFilter && statusFilter !== 'all'
      ? items.filter((i) => i.status === statusFilter)
      : items;

    return { total: filtered.length, items: filtered };
  }

  async createApplication(
    userId: string,
    input: CreateApplicationTrackerInput,
  ): Promise<ApplicationTrackerItem> {
    const trackerStatus = input.status || 'planning';
    const dbStatus = TRACKER_TO_DB_STATUS[trackerStatus] || 'planning';

    let opportunityId: string | null = null;
    let serviceId: string | null = null;
    let title = 'Recruitment Application';
    let organization = 'Staff Selection Commission';
    let slug = 'application';
    let type = 'govt_job';
    let deadline: string | null = null;

    if (this.isPrismaUsable()) {
      if (input.opportunity_slug) {
        const opp = await this.prisma.opportunities.findFirst({
          where: { slug: input.opportunity_slug },
          include: { organizations: { select: { name: true } } },
        });
        if (opp) {
          opportunityId = opp.id;
          title = opp.title;
          organization = opp.organizations?.name || 'Recruitment Commission';
          slug = opp.slug;
          type = opp.type;
          deadline = opp.application_end
            ? (opp.application_end instanceof Date
                ? opp.application_end.toISOString().split('T')[0]
                : String(opp.application_end).split('T')[0])
            : null;
        }
      } else if (input.service_slug) {
        const srv = await this.prisma.gov_services.findFirst({
          where: { slug: input.service_slug },
        });
        if (srv) {
          serviceId = srv.id;
          title = srv.name;
          organization = srv.authority_name || 'Government Department';
          slug = srv.slug;
          type = 'service';
        }
      }
    }

    const notesStr = serializeTrackerNotes(
      input.notes,
      input.roll_number,
      input.exam_date,
      input.exam_center,
    );

    const appId = randomUUID();
    const now = new Date().toISOString();

    if (this.isPrismaUsable() && (opportunityId || serviceId)) {
      try {
        const row = await this.prisma.applications.upsert({
          where: opportunityId
            ? { user_id_opportunity_id: { user_id: userId, opportunity_id: opportunityId } }
            : { user_id_service_id: { user_id: userId, service_id: serviceId! } },
          create: {
            id: appId,
            user_id: userId,
            opportunity_id: opportunityId,
            service_id: serviceId,
            status: dbStatus,
            application_number: input.application_number || null,
            applied_on: input.applied_on ? new Date(input.applied_on) : null,
            notes: notesStr,
          },
          update: {
            status: dbStatus,
            application_number: input.application_number !== undefined ? input.application_number : undefined,
            applied_on: input.applied_on ? new Date(input.applied_on) : undefined,
            notes: notesStr,
            updated_at: new Date(),
          },
        });

        return {
          id: row.id,
          user_id: row.user_id,
          opportunity_id: row.opportunity_id,
          service_id: row.service_id,
          title,
          organization,
          type,
          slug,
          mode: 'official',
          status: trackerStatus,
          application_number: row.application_number,
          roll_number: input.roll_number || null,
          exam_date: input.exam_date || null,
          exam_center: input.exam_center || null,
          applied_on: row.applied_on ? row.applied_on.toISOString().split('T')[0] : null,
          deadline,
          notes: input.notes || null,
          documents_ready: true,
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString(),
        };
      } catch (err) {
        this.logger.warn(`Failed to upsert application in DB: ${(err as Error).message}`);
      }
    }

    // In-memory fallback
    const memItem: ApplicationTrackerItem = {
      id: appId,
      user_id: userId,
      opportunity_id: opportunityId,
      service_id: serviceId,
      title: input.opportunity_slug || title,
      organization,
      type,
      slug: input.opportunity_slug || slug,
      mode: 'official',
      status: trackerStatus,
      application_number: input.application_number || null,
      roll_number: input.roll_number || null,
      exam_date: input.exam_date || null,
      exam_center: input.exam_center || null,
      applied_on: input.applied_on || null,
      deadline,
      notes: input.notes || null,
      documents_ready: true,
      created_at: now,
      updated_at: now,
    };
    this.inMemoryApps.set(appId, memItem);
    return memItem;
  }

  async updateApplication(
    userId: string,
    id: string,
    input: UpdateApplicationTrackerInput,
  ): Promise<ApplicationTrackerItem> {
    if (this.isPrismaUsable()) {
      try {
        const existing = await this.prisma.applications.findFirst({
          where: { id, user_id: userId },
          include: {
            opportunities: {
              select: {
                title: true,
                slug: true,
                type: true,
                application_end: true,
                organizations: { select: { name: true } },
              },
            },
            gov_services: {
              select: { name: true, slug: true, authority_name: true },
            },
          },
        });

        if (existing) {
          const currentParsed = parseTrackerNotes(existing.notes);
          const mergedNotes = serializeTrackerNotes(
            input.notes !== undefined ? input.notes : currentParsed.text,
            input.roll_number !== undefined ? input.roll_number : currentParsed.roll_number,
            input.exam_date !== undefined ? input.exam_date : currentParsed.exam_date,
            input.exam_center !== undefined ? input.exam_center : currentParsed.exam_center,
          );

          const dbStatus = input.status
            ? TRACKER_TO_DB_STATUS[input.status]
            : existing.status;

          const updated = await this.prisma.applications.update({
            where: { id },
            data: {
              status: dbStatus,
              application_number:
                input.application_number !== undefined
                  ? input.application_number
                  : existing.application_number,
              applied_on: input.applied_on !== undefined
                ? input.applied_on ? new Date(input.applied_on) : null
                : existing.applied_on,
              notes: mergedNotes,
              updated_at: new Date(),
            },
          });

          const opp = existing.opportunities;
          const srv = existing.gov_services;
          const parsed = parseTrackerNotes(updated.notes);

          return {
            id: updated.id,
            user_id: updated.user_id,
            opportunity_id: updated.opportunity_id,
            service_id: updated.service_id,
            title: opp?.title || srv?.name || 'Recruitment Application',
            organization: opp?.organizations?.name || srv?.authority_name || 'Commission',
            type: opp?.type || (srv ? 'service' : 'govt_job'),
            slug: opp?.slug || srv?.slug || 'application',
            mode: (updated.mode as any) || 'official',
            status: input.status || DB_TO_TRACKER_STATUS[updated.status] || 'planning',
            application_number: updated.application_number,
            roll_number: parsed.roll_number || null,
            exam_date: parsed.exam_date || null,
            exam_center: parsed.exam_center || null,
            applied_on: updated.applied_on ? updated.applied_on.toISOString().split('T')[0] : null,
            deadline: opp?.application_end
              ? (opp.application_end instanceof Date
                  ? opp.application_end.toISOString().split('T')[0]
                  : String(opp.application_end).split('T')[0])
              : null,
            notes: parsed.text || null,
            documents_ready: true,
            created_at: updated.created_at.toISOString(),
            updated_at: updated.updated_at.toISOString(),
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to update application in DB: ${(err as Error).message}`);
      }
    }

    const app = this.inMemoryApps.get(id);
    if (!app || app.user_id !== userId) {
      throw new NotFoundException('Application not found');
    }

    const updatedApp: ApplicationTrackerItem = {
      ...app,
      status: input.status || app.status,
      application_number:
        input.application_number !== undefined
          ? input.application_number
          : app.application_number,
      roll_number:
        input.roll_number !== undefined ? input.roll_number : app.roll_number,
      exam_date:
        input.exam_date !== undefined ? input.exam_date : app.exam_date,
      exam_center:
        input.exam_center !== undefined ? input.exam_center : app.exam_center,
      applied_on:
        input.applied_on !== undefined ? input.applied_on : app.applied_on,
      notes: input.notes !== undefined ? input.notes : app.notes,
      updated_at: new Date().toISOString(),
    };

    this.inMemoryApps.set(id, updatedApp);
    return updatedApp;
  }

  async deleteApplication(
    userId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    if (this.isPrismaUsable()) {
      try {
        const res = await this.prisma.applications.deleteMany({
          where: { id, user_id: userId },
        });
        if (res.count > 0) return { success: true };
      } catch (err) {
        this.logger.warn(`Failed to delete application from DB: ${(err as Error).message}`);
      }
    }

    const app = this.inMemoryApps.get(id);
    if (!app || app.user_id !== userId) {
      throw new NotFoundException('Application not found');
    }
    this.inMemoryApps.delete(id);
    return { success: true };
  }
}
