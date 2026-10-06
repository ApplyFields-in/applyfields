import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import type { AdminSummary, ReviewDetail, ReviewList } from '@applyfields/types';
import { StaffGuard } from '../../common/staff.guard.js';
import { ReviewService } from './review.service.js';

const HOUR_MS = 3_600_000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR_MS).toISOString();

@Controller('admin')
@UseGuards(StaffGuard)
export class AdminController {
  constructor(private readonly review: ReviewService) {}

  /** GET /api/v1/admin/review?source=ssc&careful=1 — drafts waiting for review, newest first */
  @Get('review')
  reviewQueue(@Query('source') source?: string, @Query('careful') careful?: string): Promise<ReviewList> {
    return this.review.list({ source: source || undefined, careful: careful === '1' || careful === 'true' });
  }

  /** GET /api/v1/admin/review/:id — one draft with posts, eligibility, dates and a signed PDF link */
  @Get('review/:id')
  reviewDetail(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewDetail> {
    return this.review.detail(id);
  }

  /** GET /api/v1/admin/summary — Internal Portal dashboard (sample data; admin login arrives later) */
  @Get('summary')
  summary(): AdminSummary {
    return {
      stats: [
        { key: 'pending_reviews', label: 'Waiting for review', value: 23, hint: '5 need careful review' },
        { key: 'published_week', label: 'Published this week', value: 41, hint: '+12 vs last week' },
        { key: 'reports_open', label: 'Open reports', value: 7, hint: '2 broken links' },
        { key: 'users', label: 'Registered users', value: 0, hint: 'Sign-up arrives in Week 1' },
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
      sample: true,
    };
  }
}
