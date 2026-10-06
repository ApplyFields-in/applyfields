import { Controller, Get, Optional } from '@nestjs/common';
import type { AdminSummary, AdminUserList } from '@applyfields/types';
import { PrismaService } from '../prisma/prisma.service.js';

const HOUR_MS = 3_600_000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR_MS).toISOString();

@Controller('admin')
export class AdminController {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  /** GET /api/v1/admin/summary — Internal Portal dashboard with live user count from Supabase */
  @Get('summary')
  async summary(): Promise<AdminSummary> {
    const userCount = this.prisma ? await this.prisma.users.count() : 0;

    return {
      stats: [
        { key: 'pending_reviews', label: 'Waiting for review', value: 23, hint: '5 need careful review' },
        { key: 'published_week', label: 'Published this week', value: 41, hint: '+12 vs last week' },
        { key: 'reports_open', label: 'Open reports', value: 7, hint: '2 broken links' },
        {
          key: 'users',
          label: 'Registered users',
          value: userCount,
          hint: `${userCount} active in Supabase`,
        },
      ],
      review_queue: [
        { id: 'r1', title: 'SSC CGL 2026 — notification', source: 'ssc', confidence: 0.91, found_at: hoursAgo(2), kind: 'new' },
        { id: 'r2', title: 'APPSC Group II — last date changed', source: 'appsc', confidence: 0.84, found_at: hoursAgo(5), kind: 'change' },
        { id: 'r3', title: 'RRB NTPC — admit card released', source: 'rrb', confidence: 0.77, found_at: hoursAgo(9), kind: 'update' },
        { id: 'r4', title: 'TSPSC Group IV — notification', source: 'tspsc', confidence: 0.52, found_at: hoursAgo(20), kind: 'new' },
        { id: 'r5', title: 'UPSC CSE 2027 — notice', source: 'upsc', confidence: 0.68, found_at: hoursAgo(26), kind: 'new' },
      ],
      scrapers: [
        { key: 'ssc', name: 'Staff Selection Commission', last_success_at: hoursAgo(1), consecutive_failures: 0 },
        { key: 'upsc', name: 'Union Public Service Commission', last_success_at: hoursAgo(3), consecutive_failures: 0 },
        { key: 'appsc', name: 'APPSC', last_success_at: hoursAgo(2), consecutive_failures: 0 },
        { key: 'tspsc', name: 'TSPSC', last_success_at: hoursAgo(30), consecutive_failures: 4 },
        { key: 'rrb', name: 'Railway Recruitment Boards', last_success_at: hoursAgo(4), consecutive_failures: 0 },
      ],
      sample: !this.prisma,
    };
  }

  /** GET /api/v1/admin/users — Internal Portal user list from Supabase */
  @Get('users')
  async getUsers(): Promise<AdminUserList> {
    if (!this.prisma) {
      return { users: [], total: 0 };
    }

    const list = await this.prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user_profiles: true,
      },
    });

    return {
      users: list.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        status: u.status,
        full_name: u.user_profiles?.full_name ?? null,
        gender: u.user_profiles?.gender ?? null,
        category: u.user_profiles?.category ?? null,
        state_code: u.user_profiles?.state_code ?? null,
        avatar_url: u.user_profiles?.avatar_url ?? null,
        email_verified: Boolean(u.email_verified_at),
        phone_verified: Boolean(u.phone_verified_at),
        created_at: u.created_at.toISOString(),
      })),
      total: list.length,
    };
  }
}
