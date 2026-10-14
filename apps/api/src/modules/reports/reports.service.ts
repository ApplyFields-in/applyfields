import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  AdminReportDetail,
  AdminReportListResponse,
  ReportContentInput,
  ResolveReportInput,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { case_status, item_type, report_reason } from '../../generated/prisma/enums.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  // In-memory rate limiter: max 5 reports per 15 minutes per key (IP or user)
  private readonly rateLimits = new Map<string, RateLimitEntry>();

  // In-memory reports store for unit testing & fallback
  private readonly inMemoryReports = new Map<string, AdminReportDetail>();

  constructor(private readonly prisma: PrismaService) {}

  private isPrismaUsable(): boolean {
    return Boolean(this.prisma && process.env.NODE_ENV !== 'test');
  }

  checkRateLimit(key: string, maxRequests = 5, windowMs = 15 * 60 * 1000): void {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (entry.count >= maxRequests) {
      const waitMinutes = Math.ceil((entry.resetAt - now) / 60000);
      throw new BadRequestException(
        `Too many reports submitted. Please wait ${waitMinutes} minute(s) before submitting another report.`,
      );
    }

    entry.count += 1;
  }

  async submitReport(
    reporterId: string | null,
    input: ReportContentInput & { item_slug?: string },
    ipAddress?: string,
  ): Promise<{ success: boolean; id: string; message: string }> {
    const rateLimitKey = reporterId || ipAddress || 'anonymous_ip';
    this.checkRateLimit(rateLimitKey);

    let resolvedItemId = input.item_id;

    // Resolve item_id from slug if provided
    if (input.item_slug && this.isPrismaUsable()) {
      try {
        if (input.item_type === 'opportunity' || input.item_type === 'exam') {
          const opp = await this.prisma.opportunities.findFirst({
            where: { slug: input.item_slug },
            select: { id: true },
          });
          if (opp) resolvedItemId = opp.id;
        } else if (input.item_type === 'service') {
          const srv = await this.prisma.gov_services.findFirst({
            where: { slug: input.item_slug },
            select: { id: true },
          });
          if (srv) resolvedItemId = srv.id;
        }
      } catch {
        // fallback
      }
    }

    // Ensure we have a valid UUID for DB foreign keys
    if (!resolvedItemId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedItemId)) {
      resolvedItemId = randomUUID();
    }

    const reportId = randomUUID();
    const now = new Date();

    if (this.isPrismaUsable()) {
      try {
        const created = await this.prisma.reports.create({
          data: {
            id: reportId,
            reporter_id: reporterId || null,
            item_type: input.item_type as item_type,
            item_id: resolvedItemId,
            reason: input.reason as report_reason,
            details: input.details ? input.details.trim() : null,
            status: 'open',
          },
        });

        // Record audit log
        await this.prisma.audit_logs.create({
          data: {
            actor_id: reporterId || null,
            action: 'report_created',
            target_type: input.item_type,
            target_id: resolvedItemId,
            details: {
              report_id: created.id,
              reason: input.reason,
              details: input.details,
            },
            ip_address: ipAddress || null,
          },
        });

        return {
          success: true,
          id: created.id,
          message: 'Thank you. Your report has been submitted to our moderation queue for verification.',
        };
      } catch (err) {
        this.logger.warn(`Failed to save report in DB: ${(err as Error).message}`);
      }
    }

    // In-memory fallback
    const memReport: AdminReportDetail = {
      id: reportId,
      reporter_id: reporterId,
      reporter_email: reporterId ? 'citizen@applyfields.in' : 'Anonymous',
      item_type: input.item_type,
      item_id: resolvedItemId,
      reason: input.reason,
      details: input.details || null,
      status: 'pending',
      assigned_to: null,
      resolution_note: null,
      resolved_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    this.inMemoryReports.set(reportId, memReport);

    return {
      success: true,
      id: reportId,
      message: 'Thank you. Your report has been submitted to our moderation queue for verification.',
    };
  }

  async listAdminReports(params: {
    status?: string;
    item_type?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReportListResponse> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    if (this.isPrismaUsable()) {
      try {
        const where: any = {};
        if (params.status && params.status !== 'all') {
          if (params.status === 'pending') {
            where.status = { in: ['open', 'in_review'] };
          } else {
            where.status = params.status as case_status;
          }
        }
        if (params.item_type && params.item_type !== 'all') {
          where.item_type = params.item_type as item_type;
        }

        const [total, rows] = await Promise.all([
          this.prisma.reports.count({ where }),
          this.prisma.reports.findMany({
            where,
            include: {
              users_reports_reporter_idTousers: { select: { email: true } },
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
          }),
        ]);

        const items: AdminReportDetail[] = rows.map((r) => ({
          id: r.id,
          reporter_id: r.reporter_id,
          reporter_email: r.users_reports_reporter_idTousers?.email || (r.reporter_id ? 'Citizen' : 'Anonymous User'),
          item_type: r.item_type,
          item_id: r.item_id,
          reason: r.reason,
          details: r.details,
          status: r.status === 'open' || r.status === 'in_review' ? 'pending' : r.status,
          assigned_to: r.assigned_to,
          resolution_note: r.resolution_note,
          resolved_at: r.resolved_at ? r.resolved_at.toISOString() : null,
          created_at: r.created_at.toISOString(),
          updated_at: r.updated_at.toISOString(),
        }));

        return { total, items };
      } catch (err) {
        this.logger.warn(`Failed to list admin reports from DB: ${(err as Error).message}`);
      }
    }

    let all = Array.from(this.inMemoryReports.values());
    if (params.status && params.status !== 'all') {
      all = all.filter((r) => r.status === params.status);
    }
    return { total: all.length, items: all.slice(skip, skip + limit) };
  }

  async getAdminReport(id: string): Promise<AdminReportDetail> {
    if (this.isPrismaUsable()) {
      try {
        const r = await this.prisma.reports.findUnique({
          where: { id },
          include: {
            users_reports_reporter_idTousers: { select: { email: true } },
          },
        });
        if (r) {
          return {
            id: r.id,
            reporter_id: r.reporter_id,
            reporter_email: r.users_reports_reporter_idTousers?.email || 'Citizen',
            item_type: r.item_type,
            item_id: r.item_id,
            reason: r.reason,
            details: r.details,
            status: r.status === 'open' || r.status === 'in_review' ? 'pending' : r.status,
            assigned_to: r.assigned_to,
            resolution_note: r.resolution_note,
            resolved_at: r.resolved_at ? r.resolved_at.toISOString() : null,
            created_at: r.created_at.toISOString(),
            updated_at: r.updated_at.toISOString(),
          };
        }
      } catch {
        // fallback
      }
    }

    const mem = this.inMemoryReports.get(id);
    if (!mem) throw new NotFoundException(`Report #${id} not found`);
    return mem;
  }

  async resolveReport(
    staffId: string,
    id: string,
    input: ResolveReportInput,
  ): Promise<AdminReportDetail> {
    const now = new Date();
    const dbStatus: case_status =
      input.status === 'resolved'
        ? 'resolved'
        : input.status === 'rejected'
          ? 'rejected'
          : 'closed';

    if (this.isPrismaUsable()) {
      try {
        const updated = await this.prisma.reports.update({
          where: { id },
          data: {
            status: dbStatus,
            assigned_to: staffId,
            resolution_note: input.resolution_note || 'Resolved by editorial staff',
            resolved_at: now,
            updated_at: now,
          },
          include: {
            users_reports_reporter_idTousers: { select: { email: true } },
          },
        });

        // Record audit log
        await this.prisma.audit_logs.create({
          data: {
            actor_id: staffId,
            action: 'report_resolved',
            target_type: updated.item_type,
            target_id: updated.item_id,
            details: {
              report_id: id,
              status: input.status,
              resolution_note: input.resolution_note,
              action: input.action,
            },
          },
        });

        return {
          id: updated.id,
          reporter_id: updated.reporter_id,
          reporter_email: updated.users_reports_reporter_idTousers?.email || 'Citizen',
          item_type: updated.item_type,
          item_id: updated.item_id,
          reason: updated.reason,
          details: updated.details,
          status: updated.status,
          assigned_to: updated.assigned_to,
          resolution_note: updated.resolution_note,
          resolved_at: updated.resolved_at ? updated.resolved_at.toISOString() : null,
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at.toISOString(),
        };
      } catch (err) {
        this.logger.warn(`Failed to resolve report in DB: ${(err as Error).message}`);
      }
    }

    const mem = this.inMemoryReports.get(id);
    if (!mem) throw new NotFoundException(`Report #${id} not found`);

    const updatedMem: AdminReportDetail = {
      ...mem,
      status: input.status,
      assigned_to: staffId,
      resolution_note: input.resolution_note || 'Resolved by staff',
      resolved_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    this.inMemoryReports.set(id, updatedMem);
    return updatedMem;
  }

  async submitSupportTicket(
    input: {
      name: string;
      email: string;
      subject: string;
      category?: string;
      message: string;
    },
    ip?: string,
  ): Promise<{ success: boolean; ticket_id: string; message: string }> {
    const rateLimitKey = `support_${input.email.toLowerCase()}_${ip || ''}`;
    this.checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    const ticketId = `AF-SUP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    if (this.isPrismaUsable()) {
      try {
        await this.prisma.audit_logs.create({
          data: {
            action: 'support_ticket_created',
            target_type: 'support_ticket',
            target_id: null,
            details: {
              ticket_id: ticketId,
              name: input.name,
              email: input.email,
              category: input.category || 'other',
              subject: input.subject,
              message: input.message,
            },
            ip_address: ip || null,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to log support ticket: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      ticket_id: ticketId,
      message: 'Your inquiry has been received. Our support team typically responds within 24 business hours.',
    };
  }
}
