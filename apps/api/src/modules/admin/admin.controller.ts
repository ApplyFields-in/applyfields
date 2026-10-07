import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminMeResponse,
  AdminSummary,
  AdminUserItem,
  AdminUserList,
  ReviewDetail,
  ReviewList,
  StaffRole,
} from '@applyfields/types';
import { StaffGuard } from '../../common/staff.guard.js';
import { Roles } from '../../common/roles.decorator.js';
import { ActorId, StaffMember, type StaffUser } from '../../common/actor.js';
import { ReviewService } from './review.service.js';
import { UsersAdminService } from './users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const HOUR_MS = 3_600_000;

@Controller('admin')
@UseGuards(StaffGuard)
export class AdminController {
  constructor(
    private readonly review: ReviewService,
    private readonly usersService: UsersAdminService,
    private readonly prisma: PrismaService,
  ) {}

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
  @Roles('reviewer')
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
  @Roles('reviewer')
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
}
