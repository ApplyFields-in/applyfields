import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminReportDetail,
  AdminReportListResponse,
  CommunityComment,
  CommunityThread,
  CommunityThreadCategory,
  CommunityThreadListResponse,
  CreateCommentInput,
  CreateThreadInput,
  ReportContentInput,
  ResolveReportInput,
  ToggleUpvoteInput,
  ToggleUpvoteResponse,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const threadCategoryEnum = z.enum([
  'general',
  'admit_card',
  'exam_prep',
  'syllabus',
  'result',
  'counselling',
]);

export const createThreadSchema = z.object({
  opportunity_id: z.string().uuid().optional().or(z.literal('')),
  category: threadCategoryEnum.default('general'),
  author_name: z.string().trim().min(2).max(100).optional().or(z.literal('')),
  title: z.string().trim().min(5).max(200),
  content: z.string().trim().min(10).max(5000),
});

export const createCommentSchema = z.object({
  author_name: z.string().trim().min(2).max(100).optional().or(z.literal('')),
  parent_comment_id: z.string().uuid().optional().or(z.literal('')),
  content: z.string().trim().min(2).max(2000),
});

export const toggleUpvoteSchema = z
  .object({
    thread_id: z.string().uuid().optional(),
    comment_id: z.string().uuid().optional(),
  })
  .refine((data) => (data.thread_id && !data.comment_id) || (!data.thread_id && data.comment_id), {
    message: 'Either thread_id or comment_id must be provided, but not both.',
  });

export const reportContentSchema = z.object({
  item_type: z.enum([
    'opportunity',
    'exam',
    'service',
    'institution',
    'course',
    'career',
    'roadmap',
    'partner',
    'update',
  ]),
  item_id: z.string().uuid(),
  reason: z.enum([
    'incorrect_info',
    'broken_link',
    'fake_or_scam',
    'partner_issue',
    'service_complaint',
    'other',
  ]),
  details: z.string().trim().min(5).max(1000).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'rejected', 'closed']),
  resolution_note: z.string().trim().min(2).max(1000),
  action: z.enum(['hide', 'lock', 'dismiss']).optional(),
});

export const moderateThreadSchema = z.object({
  is_pinned: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve candidate's display author name */
  private async resolveAuthorName(userId: string | null, customName?: string): Promise<string> {
    if (customName && customName.trim().length >= 2) {
      return customName.trim();
    }
    if (!userId) {
      return 'Candidate';
    }
    const profile = await this.prisma.$queryRaw<Array<{ full_name: string | null }>>`
      select full_name from profiles where user_id = ${userId}::uuid limit 1
    `;
    return profile[0]?.full_name?.trim() || 'Candidate';
  }

  // =========================================================================
  // PUBLIC / CANDIDATE FORUM & Q&A
  // =========================================================================

  /** List community discussion threads with optional filters */
  async listThreads(
    query: {
      opportunityId?: string;
      category?: string;
      q?: string;
      page?: number;
      limit?: number;
    },
    currentUserId?: string,
  ): Promise<CommunityThreadListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;
    const q = query.q?.trim().toLowerCase();

    const countRows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as count
      from community_threads t
      where t.is_hidden = false
        ${query.opportunityId ? Prisma.sql`and t.opportunity_id = ${query.opportunityId}::uuid` : Prisma.empty}
        ${query.category ? Prisma.sql`and t.category = ${query.category}` : Prisma.empty}
        ${q ? Prisma.sql`and (lower(t.title) like ${`%${q}%`} or lower(t.content) like ${`%${q}%`})` : Prisma.empty}
    `;
    const total = countRows[0]?.count ?? 0;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        opportunity_id: string | null;
        opportunity_title: string | null;
        opportunity_slug: string | null;
        category: string;
        user_id: string | null;
        author_name: string;
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
        is_hidden: boolean;
        view_count: number;
        upvotes_count: number;
        replies_count: number;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select t.id::text, t.opportunity_id::text,
             o.title as opportunity_title, o.slug as opportunity_slug,
             t.category, t.user_id::text, t.author_name, t.title, t.content,
             t.is_pinned, t.is_locked, t.is_hidden,
             t.view_count, t.upvotes_count, t.replies_count,
             t.created_at, t.updated_at
      from community_threads t
      left join opportunities o on o.id = t.opportunity_id
      where t.is_hidden = false
        ${query.opportunityId ? Prisma.sql`and t.opportunity_id = ${query.opportunityId}::uuid` : Prisma.empty}
        ${query.category ? Prisma.sql`and t.category = ${query.category}` : Prisma.empty}
        ${q ? Prisma.sql`and (lower(t.title) like ${`%${q}%`} or lower(t.content) like ${`%${q}%`})` : Prisma.empty}
      order by t.is_pinned desc, t.created_at desc
      limit ${limit} offset ${offset}
    `;

    // Check upvotes if user is signed in
    let upvotedThreadIds = new Set<string>();
    if (currentUserId && rows.length > 0) {
      const threadIds = rows.map((r) => r.id);
      const upvotes = await this.prisma.$queryRaw<Array<{ thread_id: string }>>`
        select thread_id::text
        from community_upvotes
        where user_id = ${currentUserId}::uuid
          and thread_id = any(${threadIds}::uuid[])
      `;
      upvotedThreadIds = new Set(upvotes.map((u) => u.thread_id));
    }

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        opportunity_id: r.opportunity_id,
        opportunity_title: r.opportunity_title,
        opportunity_slug: r.opportunity_slug,
        category: r.category as CommunityThreadCategory,
        user_id: r.user_id,
        author_name: r.author_name,
        title: r.title,
        content: r.content,
        is_pinned: r.is_pinned,
        is_locked: r.is_locked,
        is_hidden: r.is_hidden,
        view_count: r.view_count,
        upvotes_count: r.upvotes_count,
        replies_count: r.replies_count,
        user_has_upvoted: upvotedThreadIds.has(r.id),
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      })),
    };
  }

  /** Get single thread with comments and view increment */
  async getThread(threadId: string, currentUserId?: string): Promise<CommunityThread> {
    const threadRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        opportunity_id: string | null;
        opportunity_title: string | null;
        opportunity_slug: string | null;
        category: string;
        user_id: string | null;
        author_name: string;
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
        is_hidden: boolean;
        view_count: number;
        upvotes_count: number;
        replies_count: number;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select t.id::text, t.opportunity_id::text,
             o.title as opportunity_title, o.slug as opportunity_slug,
             t.category, t.user_id::text, t.author_name, t.title, t.content,
             t.is_pinned, t.is_locked, t.is_hidden,
             t.view_count, t.upvotes_count, t.replies_count,
             t.created_at, t.updated_at
      from community_threads t
      left join opportunities o on o.id = t.opportunity_id
      where t.id = ${threadId}::uuid and t.is_hidden = false
      limit 1
    `;

    if (!threadRows || threadRows.length === 0) {
      throw new NotFoundException('Discussion thread not found');
    }
    const thread = threadRows[0];

    // Increment view count asynchronously
    await this.prisma.$executeRaw`
      update community_threads
      set view_count = view_count + 1
      where id = ${threadId}::uuid
    `.catch(() => {});

    // Fetch comments
    const commentRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        thread_id: string;
        user_id: string | null;
        author_name: string;
        parent_comment_id: string | null;
        content: string;
        upvotes_count: number;
        is_official_answer: boolean;
        is_hidden: boolean;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select c.id::text, c.thread_id::text, c.user_id::text, c.author_name,
             c.parent_comment_id::text, c.content, c.upvotes_count,
             c.is_official_answer, c.is_hidden,
             c.created_at, c.updated_at
      from community_comments c
      where c.thread_id = ${threadId}::uuid and c.is_hidden = false
      order by c.is_official_answer desc, c.created_at asc
    `;

    // Upvote check for current user
    let threadUpvoted = false;
    let upvotedCommentIds = new Set<string>();
    if (currentUserId) {
      const tUpvote = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text from community_upvotes
        where user_id = ${currentUserId}::uuid and thread_id = ${threadId}::uuid
        limit 1
      `;
      threadUpvoted = tUpvote.length > 0;

      if (commentRows.length > 0) {
        const commentIds = commentRows.map((c) => c.id);
        const cUpvotes = await this.prisma.$queryRaw<Array<{ comment_id: string }>>`
          select comment_id::text
          from community_upvotes
          where user_id = ${currentUserId}::uuid
            and comment_id = any(${commentIds}::uuid[])
        `;
        upvotedCommentIds = new Set(cUpvotes.map((u) => u.comment_id));
      }
    }

    const comments: CommunityComment[] = commentRows.map((c) => ({
      id: c.id,
      thread_id: c.thread_id,
      user_id: c.user_id,
      author_name: c.author_name,
      parent_comment_id: c.parent_comment_id,
      content: c.content,
      upvotes_count: c.upvotes_count,
      is_official_answer: c.is_official_answer,
      is_hidden: c.is_hidden,
      user_has_upvoted: upvotedCommentIds.has(c.id),
      created_at: new Date(c.created_at).toISOString(),
      updated_at: new Date(c.updated_at).toISOString(),
    }));

    return {
      id: thread.id,
      opportunity_id: thread.opportunity_id,
      opportunity_title: thread.opportunity_title,
      opportunity_slug: thread.opportunity_slug,
      category: thread.category as CommunityThreadCategory,
      user_id: thread.user_id,
      author_name: thread.author_name,
      title: thread.title,
      content: thread.content,
      is_pinned: thread.is_pinned,
      is_locked: thread.is_locked,
      is_hidden: thread.is_hidden,
      view_count: thread.view_count + 1,
      upvotes_count: thread.upvotes_count,
      replies_count: thread.replies_count,
      user_has_upvoted: threadUpvoted,
      comments,
      created_at: new Date(thread.created_at).toISOString(),
      updated_at: new Date(thread.updated_at).toISOString(),
    };
  }

  /** Create a new discussion thread */
  async createThread(userId: string | null, rawInput: unknown): Promise<CommunityThread> {
    const input = createThreadSchema.parse(rawInput);
    const authorName = await this.resolveAuthorName(userId, input.author_name);
    const oppId = input.opportunity_id && input.opportunity_id.length > 0 ? input.opportunity_id : null;

    let oppTitle: string | null = null;
    let oppSlug: string | null = null;
    if (oppId) {
      const opp = await this.prisma.$queryRaw<Array<{ title: string; slug: string }>>`
        select title, slug from opportunities where id = ${oppId}::uuid limit 1
      `;
      if (opp && opp.length > 0) {
        oppTitle = opp[0].title;
        oppSlug = opp[0].slug;
      }
    }

    const inserted = await this.prisma.$queryRaw<
      Array<{
        id: string;
        opportunity_id: string | null;
        category: string;
        user_id: string | null;
        author_name: string;
        title: string;
        content: string;
        is_pinned: boolean;
        is_locked: boolean;
        is_hidden: boolean;
        view_count: number;
        upvotes_count: number;
        replies_count: number;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      insert into community_threads (
        opportunity_id,
        category,
        user_id,
        author_name,
        title,
        content
      ) values (
        ${oppId ? Prisma.sql`${oppId}::uuid` : Prisma.sql`null`},
        ${input.category},
        ${userId ? Prisma.sql`${userId}::uuid` : Prisma.sql`null`},
        ${authorName},
        ${input.title},
        ${input.content}
      )
      returning id::text, opportunity_id::text, category, user_id::text,
                author_name, title, content, is_pinned, is_locked, is_hidden,
                view_count, upvotes_count, replies_count, created_at, updated_at
    `;

    const row = inserted[0];
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: oppTitle,
      opportunity_slug: oppSlug,
      category: row.category as CommunityThreadCategory,
      user_id: row.user_id,
      author_name: row.author_name,
      title: row.title,
      content: row.content,
      is_pinned: row.is_pinned,
      is_locked: row.is_locked,
      is_hidden: row.is_hidden,
      view_count: row.view_count,
      upvotes_count: row.upvotes_count,
      replies_count: row.replies_count,
      user_has_upvoted: false,
      comments: [],
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  /** Add reply comment to a thread */
  async addComment(
    userId: string | null,
    threadId: string,
    rawInput: unknown,
  ): Promise<CommunityComment> {
    const input = createCommentSchema.parse(rawInput);

    const threadRows = await this.prisma.$queryRaw<Array<{ is_locked: boolean; is_hidden: boolean }>>`
      select is_locked, is_hidden from community_threads where id = ${threadId}::uuid limit 1
    `;
    if (!threadRows || threadRows.length === 0 || threadRows[0].is_hidden) {
      throw new NotFoundException('Discussion thread not found');
    }
    if (threadRows[0].is_locked) {
      throw new ForbiddenException('This thread is locked for new replies by moderators');
    }

    const parentId =
      input.parent_comment_id && input.parent_comment_id.length > 0 ? input.parent_comment_id : null;
    const authorName = await this.resolveAuthorName(userId, input.author_name);

    const inserted = await this.prisma.$queryRaw<
      Array<{
        id: string;
        thread_id: string;
        user_id: string | null;
        author_name: string;
        parent_comment_id: string | null;
        content: string;
        upvotes_count: number;
        is_official_answer: boolean;
        is_hidden: boolean;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      insert into community_comments (
        thread_id,
        user_id,
        author_name,
        parent_comment_id,
        content
      ) values (
        ${threadId}::uuid,
        ${userId ? Prisma.sql`${userId}::uuid` : Prisma.sql`null`},
        ${authorName},
        ${parentId ? Prisma.sql`${parentId}::uuid` : Prisma.sql`null`},
        ${input.content}
      )
      returning id::text, thread_id::text, user_id::text, author_name,
                parent_comment_id::text, content, upvotes_count,
                is_official_answer, is_hidden, created_at, updated_at
    `;

    const row = inserted[0];
    return {
      id: row.id,
      thread_id: row.thread_id,
      user_id: row.user_id,
      author_name: row.author_name,
      parent_comment_id: row.parent_comment_id,
      content: row.content,
      upvotes_count: row.upvotes_count,
      is_official_answer: row.is_official_answer,
      is_hidden: row.is_hidden,
      user_has_upvoted: false,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  /** Toggle upvote on thread or comment */
  async toggleUpvote(userId: string, rawInput: unknown): Promise<ToggleUpvoteResponse> {
    const input = toggleUpvoteSchema.parse(rawInput);

    if (input.thread_id) {
      const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text from community_upvotes
        where user_id = ${userId}::uuid and thread_id = ${input.thread_id}::uuid
        limit 1
      `;

      if (existing.length > 0) {
        await this.prisma.$executeRaw`
          delete from community_upvotes
          where user_id = ${userId}::uuid and thread_id = ${input.thread_id}::uuid
        `;
        const updated = await this.prisma.$queryRaw<Array<{ upvotes_count: number }>>`
          update community_threads
          set upvotes_count = greatest(0, upvotes_count - 1)
          where id = ${input.thread_id}::uuid
          returning upvotes_count
        `;
        return { upvoted: false, upvotes_count: updated[0]?.upvotes_count ?? 0 };
      } else {
        await this.prisma.$executeRaw`
          insert into community_upvotes (user_id, thread_id)
          values (${userId}::uuid, ${input.thread_id}::uuid)
        `;
        const updated = await this.prisma.$queryRaw<Array<{ upvotes_count: number }>>`
          update community_threads
          set upvotes_count = upvotes_count + 1
          where id = ${input.thread_id}::uuid
          returning upvotes_count
        `;
        return { upvoted: true, upvotes_count: updated[0]?.upvotes_count ?? 1 };
      }
    }

    if (input.comment_id) {
      const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
        select id::text from community_upvotes
        where user_id = ${userId}::uuid and comment_id = ${input.comment_id}::uuid
        limit 1
      `;

      if (existing.length > 0) {
        await this.prisma.$executeRaw`
          delete from community_upvotes
          where user_id = ${userId}::uuid and comment_id = ${input.comment_id}::uuid
        `;
        const updated = await this.prisma.$queryRaw<Array<{ upvotes_count: number }>>`
          update community_comments
          set upvotes_count = greatest(0, upvotes_count - 1)
          where id = ${input.comment_id}::uuid
          returning upvotes_count
        `;
        return { upvoted: false, upvotes_count: updated[0]?.upvotes_count ?? 0 };
      } else {
        await this.prisma.$executeRaw`
          insert into community_upvotes (user_id, comment_id)
          values (${userId}::uuid, ${input.comment_id}::uuid)
        `;
        const updated = await this.prisma.$queryRaw<Array<{ upvotes_count: number }>>`
          update community_comments
          set upvotes_count = upvotes_count + 1
          where id = ${input.comment_id}::uuid
          returning upvotes_count
        `;
        return { upvoted: true, upvotes_count: updated[0]?.upvotes_count ?? 1 };
      }
    }

    throw new BadRequestException('Target ID is required');
  }

  // =========================================================================
  // USER REPORTING & STAFF MODERATION
  // =========================================================================

  /** Report content / fake info / scam / broken link */
  async reportContent(reporterId: string | null, rawInput: unknown): Promise<{ report_id: string; message: string }> {
    const input = reportContentSchema.parse(rawInput);

    const inserted = await this.prisma.$queryRaw<Array<{ id: string }>>`
      insert into reports (
        reporter_id,
        item_type,
        item_id,
        reason,
        details,
        status
      ) values (
        ${reporterId ? Prisma.sql`${reporterId}::uuid` : Prisma.sql`null`},
        ${input.item_type}::item_type,
        ${input.item_id}::uuid,
        ${input.reason}::report_reason,
        ${input.details || null},
        'open'::case_status
      )
      returning id::text
    `;

    return {
      report_id: inserted[0].id,
      message: 'Report submitted successfully. Our staff review team has been notified.',
    };
  }

  /** Staff admin: list moderation reports */
  async adminListReports(query: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReportListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const countRows = await this.prisma.$queryRaw<Array<{ count: number }>>`
      select count(*)::int as count
      from reports r
      where 1=1
        ${query.status ? Prisma.sql`and r.status = ${query.status}::case_status` : Prisma.empty}
    `;
    const total = countRows[0]?.count ?? 0;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        reporter_id: string | null;
        reporter_email: string | null;
        item_type: string;
        item_id: string;
        reason: string;
        details: string | null;
        status: string;
        assigned_to: string | null;
        resolution_note: string | null;
        resolved_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select r.id::text, r.reporter_id::text, u.email as reporter_email,
             r.item_type::text as item_type, r.item_id::text,
             r.reason::text as reason, r.details, r.status::text as status,
             r.assigned_to::text, r.resolution_note,
             r.resolved_at, r.created_at, r.updated_at
      from reports r
      left join users u on u.id = r.reporter_id
      where 1=1
        ${query.status ? Prisma.sql`and r.status = ${query.status}::case_status` : Prisma.empty}
      order by r.created_at desc
      limit ${limit} offset ${offset}
    `;

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        reporter_id: r.reporter_id,
        reporter_email: r.reporter_email,
        item_type: r.item_type,
        item_id: r.item_id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        assigned_to: r.assigned_to,
        resolution_note: r.resolution_note,
        resolved_at: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      })),
    };
  }

  /** Staff admin: resolve report with action */
  async adminResolveReport(
    reportId: string,
    reviewerId: string,
    rawInput: unknown,
  ): Promise<AdminReportDetail> {
    const input = resolveReportSchema.parse(rawInput);

    // Apply action if specified
    if (input.action === 'hide') {
      const rep = await this.prisma.$queryRaw<Array<{ item_id: string }>>`
        select item_id::text from reports where id = ${reportId}::uuid limit 1
      `;
      if (rep && rep.length > 0) {
        await this.prisma.$executeRaw`
          update community_threads set is_hidden = true where id = ${rep[0].item_id}::uuid
        `.catch(() => {});
        await this.prisma.$executeRaw`
          update community_comments set is_hidden = true where id = ${rep[0].item_id}::uuid
        `.catch(() => {});
      }
    } else if (input.action === 'lock') {
      const rep = await this.prisma.$queryRaw<Array<{ item_id: string }>>`
        select item_id::text from reports where id = ${reportId}::uuid limit 1
      `;
      if (rep && rep.length > 0) {
        await this.prisma.$executeRaw`
          update community_threads set is_locked = true where id = ${rep[0].item_id}::uuid
        `.catch(() => {});
      }
    }

    await this.prisma.$executeRaw`
      update reports
      set status = ${input.status}::case_status,
          assigned_to = ${reviewerId}::uuid,
          resolution_note = ${input.resolution_note},
          resolved_at = now(),
          updated_at = now()
      where id = ${reportId}::uuid
    `;

    const updated = await this.prisma.$queryRaw<
      Array<{
        id: string;
        reporter_id: string | null;
        reporter_email: string | null;
        item_type: string;
        item_id: string;
        reason: string;
        details: string | null;
        status: string;
        assigned_to: string | null;
        resolution_note: string | null;
        resolved_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>
    >`
      select r.id::text, r.reporter_id::text, u.email as reporter_email,
             r.item_type::text as item_type, r.item_id::text,
             r.reason::text as reason, r.details, r.status::text as status,
             r.assigned_to::text, r.resolution_note,
             r.resolved_at, r.created_at, r.updated_at
      from reports r
      left join users u on u.id = r.reporter_id
      where r.id = ${reportId}::uuid
      limit 1
    `;

    const r = updated[0];
    return {
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_email: r.reporter_email,
      item_type: r.item_type,
      item_id: r.item_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      assigned_to: r.assigned_to,
      resolution_note: r.resolution_note,
      resolved_at: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString(),
    };
  }

  /** Staff admin: moderate thread directly */
  async adminModerateThread(threadId: string, rawInput: unknown): Promise<CommunityThread> {
    const input = moderateThreadSchema.parse(rawInput);

    await this.prisma.$executeRaw`
      update community_threads
      set is_pinned = coalesce(${input.is_pinned ?? null}, is_pinned),
          is_locked = coalesce(${input.is_locked ?? null}, is_locked),
          is_hidden = coalesce(${input.is_hidden ?? null}, is_hidden),
          updated_at = now()
      where id = ${threadId}::uuid
    `;

    return this.getThread(threadId);
  }
}
