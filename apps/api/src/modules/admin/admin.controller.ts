import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminMeResponse,
  AdminSummary,
  AdminUserItem,
  AdminUserList,
  AdminUserStats,
  ReviewDetail,
  ReviewList,
  StaffRole,
} from '@applyfields/types';
import { StaffGuard } from '../../common/staff.guard.js';
import { listJobs } from '../../common/job-runs.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { z } from 'zod';
import { Roles } from '../../common/roles.decorator.js';
import { ActorId, StaffMember, type StaffUser } from '../../common/actor.js';
import { ReviewService } from './review.service.js';
import { UsersAdminService } from './users.service.js';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QueryRouterService } from '../chatbot/query-router.service.js';

const HOUR_MS = 3_600_000;

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const payoutCreateSchema = z.object({
  partner_id: z.string().uuid(),
  period_start: isoDay,
  period_end: isoDay,
  commission_percent: z.number().min(0).max(100),
});

const payoutUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid', 'failed']),
  reference: z.string().trim().max(120).optional(),
});

@Controller('admin')
@UseGuards(StaffGuard)
export class AdminController {
  constructor(
    private readonly review: ReviewService,
    private readonly usersService: UsersAdminService,
    private readonly prisma: PrismaService,
    private readonly accounts: UsersService,
    private readonly routerService?: QueryRouterService,
  ) {}

  /**
   * GET /api/v1/admin/payments — the money that actually exists today:
   * online payments (empty until Razorpay is connected), counter-paid completed bookings, partner payouts.
   */
  @Get('payments')
  @Roles('admin')
  async payments() {
    const [online, onlineTotals, counter, payouts] = await Promise.all([
      this.prisma.payments.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        select: {
          id: true, purpose: true, amount_paise: true, status: true, refunded_amount_paise: true,
          razorpay_payment_id: true, paid_at: true, created_at: true,
          partners: { select: { business_name: true } },
        },
      }),
      this.prisma.payments.groupBy({ by: ['status'], _sum: { amount_paise: true }, _count: true }),
      this.prisma.service_requests.aggregate({
        where: { status: 'completed' },
        _sum: { final_paise: true },
        _count: true,
      }),
      this.prisma.partner_payouts.findMany({
        orderBy: { created_at: 'desc' },
        take: 100,
        include: { partners: { select: { business_name: true } } },
      }),
    ]);
    return {
      online: {
        items: online.map((p) => ({ ...p, partner_name: p.partners?.business_name ?? null, partners: undefined })),
        by_status: onlineTotals.map((t) => ({ status: t.status, count: t._count, amount_paise: t._sum.amount_paise ?? 0 })),
      },
      counter: { completed_bookings: counter._count, amount_paise: counter._sum.final_paise ?? 0 },
      payouts: payouts.map((p) => ({
        id: p.id,
        partner_name: p.partners.business_name,
        period_start: p.period_start.toISOString().slice(0, 10),
        period_end: p.period_end.toISOString().slice(0, 10),
        gross_paise: p.gross_paise,
        commission_paise: p.commission_paise,
        net_paise: p.net_paise,
        status: p.status,
        paid_at: p.paid_at?.toISOString() ?? null,
        reference: p.reference,
      })),
    };
  }

  /**
   * POST /api/v1/admin/payments/payouts — open a settlement period for one centre. Gross is the sum of the
   * centre's completed bookings in the period (never typed in); commission % is the admin's call per payout.
   */
  @Post('payments/payouts')
  @Roles('admin')
  async createPayout(
    @ActorId() actorId: string | null,
    @Body(new ZodPipe(payoutCreateSchema)) body: z.infer<typeof payoutCreateSchema>,
  ) {
    const start = new Date(`${body.period_start}T00:00:00+05:30`);
    const endExclusive = new Date(new Date(`${body.period_end}T00:00:00+05:30`).getTime() + 86_400_000);
    if (endExclusive <= start) throw new BadRequestException('The period must end on or after its start.');

    const overlap = await this.prisma.partner_payouts.findFirst({
      where: {
        partner_id: body.partner_id,
        status: { not: 'failed' },
        period_start: { lte: new Date(body.period_end) },
        period_end: { gte: new Date(body.period_start) },
      },
      select: { id: true },
    });
    if (overlap) throw new BadRequestException('This centre already has a payout covering part of that period.');

    const sum = await this.prisma.service_requests.aggregate({
      where: { partner_id: body.partner_id, status: 'completed', completed_at: { gte: start, lt: endExclusive } },
      _sum: { final_paise: true },
      _count: true,
    });
    const gross = sum._sum.final_paise ?? 0;
    if (gross === 0) throw new BadRequestException('No priced completed bookings for this centre in that period.');
    const commission = Math.round((gross * body.commission_percent) / 100);

    const row = await this.prisma.partner_payouts.create({
      data: {
        partner_id: body.partner_id,
        period_start: new Date(body.period_start),
        period_end: new Date(body.period_end),
        gross_paise: gross,
        commission_paise: commission,
        net_paise: gross - commission,
      },
    });
    await this.prisma.audit_logs
      .create({
        data: {
          actor_id: actorId,
          action: 'payout_created',
          target_type: 'partner_payout',
          target_id: row.id,
          details: { ...body, gross_paise: gross, bookings: sum._count },
        },
      })
      .catch(() => null);
    return { id: row.id, gross_paise: gross, commission_paise: commission, net_paise: row.net_paise, bookings: sum._count };
  }

  /** PATCH /api/v1/admin/payments/payouts/:id {status, reference} — record a bank transfer done outside the app. */
  @Patch('payments/payouts/:id')
  @Roles('admin')
  async updatePayout(
    @ActorId() actorId: string | null,
    @Param('id') id: string,
    @Body(new ZodPipe(payoutUpdateSchema)) body: z.infer<typeof payoutUpdateSchema>,
  ) {
    const row = await this.prisma.partner_payouts.update({
      where: { id },
      data: {
        status: body.status,
        reference: body.reference ?? undefined,
        paid_at: body.status === 'paid' ? new Date() : null,
        updated_at: new Date(),
      },
    });
    await this.prisma.audit_logs
      .create({
        data: {
          actor_id: actorId,
          action: 'payout_status_changed',
          target_type: 'partner_payout',
          target_id: id,
          details: { status: body.status, reference: body.reference ?? null },
        },
      })
      .catch(() => null);
    return { id: row.id, status: row.status, paid_at: row.paid_at?.toISOString() ?? null, reference: row.reference };
  }

  /** GET /api/v1/admin/scheduled-tasks — the API's background jobs and their recent runs. */
  @Get('scheduled-tasks')
  @Roles('reviewer')
  scheduledTasks() {
    return { items: listJobs() };
  }

  /** GET /api/v1/admin/analytics/chatbot — returns chatbot observability metrics */
  @Get('analytics/chatbot')
  @Roles('reviewer')
  async getChatbotAnalytics() {
    if (!this.routerService) {
      return {
        total_queries: 0,
        fast_path_count: 0,
        llm_count: 0,
        cache_hits: 0,
        fast_path_percentage: 0,
        avg_latency_ms: 0,
        estimated_cost_saved_usd: 0,
        satisfaction_rate: 0,
        ratings_count: 0,
        helpful_count: 0,
        unhelpful_count: 0,
        top_unanswered_questions: [],
        recent_queries: [],
      };
    }
    return this.routerService.getAnalyticsService().getObservabilityMetrics();
  }

  /** GET /api/v1/admin/me — returns current staff user info { id, email, name, roles } */
  @Get('me')
  getMe(@StaffMember() staff: StaffUser): AdminMeResponse {
    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      roles: staff.roles,
    };
  }

  /** GET /api/v1/admin/review?source=ssc&careful=1 — drafts waiting for review, reviewer and above */
  @Get('review')
  @Roles('reviewer', 'content_editor')
  reviewQueue(
    @Query('source') source?: string,
    @Query('careful') careful?: string,
  ): Promise<ReviewList> {
    return this.review.list({
      source: source || undefined,
      careful: careful === '1' || careful === 'true',
    });
  }

  /** GET /api/v1/admin/review/:id — one draft with posts, eligibility, dates and a signed PDF link */
  @Get('review/:id')
  @Roles('reviewer', 'content_editor')
  reviewDetail(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewDetail> {
    return this.review.detail(id);
  }

  /** GET /api/v1/admin/summary — Internal Portal dashboard, all counts from real DB */
  @Get('summary')
  async summary(): Promise<AdminSummary> {
    const weekAgo = new Date(Date.now() - 7 * 24 * HOUR_MS);

    const [
      userCount,
      pendingReviews,
      publishedWeek,
      deadlinesWeek,
      reviewQueue,
      scrapers,
    ] = await Promise.all([
      // total registered users
      this.prisma.users.count(),
      // drafts waiting for review
      this.prisma.opportunities.count({ where: { status: 'draft' } }),
      // published this calendar week
      this.prisma.opportunities.count({
        where: { status: 'published', published_at: { gte: weekAgo } },
      }),
      // application_end within the next 7 days
      this.prisma.opportunities.count({
        where: {
          status: 'published',
          application_end: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * HOUR_MS),
          },
        },
      }),
      // 10 most recent drafts for the review queue widget
      this.prisma.opportunities.findMany({
        where: { status: 'draft' },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          source_key: true,
          confidence: true,
          created_at: true,
          source_fetched_at: true,
        },
      }),
      // scraper sources
      this.prisma.scrape_sources.findMany({
        where: { is_active: true },
        orderBy: { key: 'asc' },
        select: {
          key: true,
          name: true,
          last_success_at: true,
          consecutive_failures: true,
        },
      }),
    ]);

    return {
      stats: [
        {
          key: 'pending_reviews',
          label: 'Waiting for review',
          value: pendingReviews,
          hint: pendingReviews === 0 ? 'All clear' : `${pendingReviews} draft${pendingReviews === 1 ? '' : 's'}`,
        },
        {
          key: 'published_week',
          label: 'Published this week',
          value: publishedWeek,
          hint: publishedWeek === 0 ? 'Nothing yet' : `${publishedWeek} since ${weekAgo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        },
        {
          key: 'deadlines_week',
          label: 'Deadlines this week',
          value: deadlinesWeek,
          hint: deadlinesWeek === 0 ? 'None closing soon' : `${deadlinesWeek} closing within 7 days`,
        },
        {
          key: 'users',
          label: 'Registered users',
          value: userCount,
          hint: `${userCount} in the database`,
        },
      ],
      review_queue: reviewQueue.map((r) => ({
        id: r.id,
        title: r.title,
        source: r.source_key ?? 'manual',
        confidence: r.confidence !== null ? Number(r.confidence) : 0,
        found_at: (r.source_fetched_at ?? r.created_at).toISOString(),
        kind: 'new' as const,
      })),
      scrapers: scrapers.map((s) => ({
        key: s.key,
        name: s.name,
        last_success_at: s.last_success_at?.toISOString() ?? null,
        consecutive_failures: s.consecutive_failures,
      })),
      sample: false,
    };
  }

  /** GET /api/v1/admin/users — users list with search & pagination, scoped by staff role */
  @Get('users')
  @Roles('support')
  getUsers(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: 'all' | 'staff' | 'citizens',
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserList> {
    return this.usersService.list({ q, page, limit, status, type }, staff);
  }

  /** GET /api/v1/admin/users/stats — citizen signups, activity, verification, breakdowns */
  @Get('users/stats')
  @Roles('support')
  getUserStats(): Promise<AdminUserStats> {
    return this.usersService.stats();
  }

  /** DELETE /api/v1/admin/users/:id — permanently erase a citizen account on request (super_admin only) */
  @Delete('users/:id')
  @Roles('super_admin')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<{ success: true }> {
    await this.usersService.assertDeletable(id, actor);
    await this.accounts.eraseAccount(id, actor);
    return { success: true };
  }

  /** GET /api/v1/admin/users/:id — single user detail (masked PII, scoped by role) */
  @Get('users/:id')
  @Roles('support')
  getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserItem> {
    return this.usersService.detail(id, staff);
  }

  /** POST /api/v1/admin/users/:id/block — suspend a user account (admin and above) */
  @Post('users/:id/block')
  @Roles('admin')
  blockUser(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserItem> {
    return this.usersService.setStatus(id, 'suspended', actor, staff);
  }

  /** POST /api/v1/admin/users/:id/unblock — reactivate a suspended account (admin and above) */
  @Post('users/:id/unblock')
  @Roles('admin')
  unblockUser(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserItem> {
    return this.usersService.setStatus(id, 'active', actor, staff);
  }

  /** POST /api/v1/admin/users/:id/roles — grant a staff role { role: "reviewer" } (super_admin only) */
  @Post('users/:id/roles')
  @Roles('super_admin')
  grantRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { role: string },
    @ActorId() actor: string | null,
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserItem> {
    if (!body?.role) throw new BadRequestException('role is required');
    return this.usersService.grantRole(id, body.role as StaffRole, actor, staff);
  }

  /** DELETE /api/v1/admin/users/:id/roles/:role — revoke a staff role (super_admin only) */
  @Delete('users/:id/roles/:role')
  @Roles('super_admin')
  revokeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('role') role: string,
    @ActorId() actor: string | null,
    @StaffMember() staff?: StaffUser,
  ): Promise<AdminUserItem> {
    return this.usersService.revokeRole(id, role as StaffRole, actor, staff);
  }

  /** GET /api/v1/admin/audit — team view of recent staff actions, edits, status updates */
  @Get('audit')
  @Roles('reviewer', 'content_editor', 'support')
  async listAuditLogs(
    @Query('action') action?: string,
    @Query('target_type') targetType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10));
    const lim = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    const skip = (p - 1) * lim;

    const where: any = {};
    if (action && action !== 'all') where.action = action;
    if (targetType && targetType !== 'all') where.target_type = targetType;

    const [total, rows] = await Promise.all([
      this.prisma.audit_logs.count({ where }),
      this.prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: lim,
      }),
    ]);

    const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[];
    const staffUsers = actorIds.length > 0
      ? await this.prisma.users.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, email: true, user_profiles: { select: { full_name: true } } },
        })
      : [];
    const staffMap = new Map(staffUsers.map((u) => [u.id, u]));

    const items = rows.map((r) => {
      const u = r.actor_id ? staffMap.get(r.actor_id) : undefined;
      return {
        id: r.id,
        actor_id: r.actor_id,
        actor_email: u?.email || (r.actor_id ? 'Staff User' : 'System / Automated'),
        actor_name: u?.user_profiles?.full_name || null,
        action: r.action,
        target_type: r.target_type,
        target_id: r.target_id,
        details: (r.details as Record<string, any>) || {},
        ip_address: r.ip_address,
        created_at: r.created_at.toISOString(),
      };
    });

    return { total, items };
  }
}
