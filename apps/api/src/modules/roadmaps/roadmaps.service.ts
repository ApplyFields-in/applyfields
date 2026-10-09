import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ProgressStatus,
  RoadmapDetail,
  RoadmapStepItem,
  RoadmapSummary,
} from '@applyfields/types';
import { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const roadmapListQuerySchema = z.object({
  q: z.string().trim().optional(),
  career: z.string().trim().optional(),
});
export type RoadmapListQuery = z.infer<typeof roadmapListQuerySchema>;

export const toggleStepDtoSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'skipped']).optional(),
  note: z.string().trim().optional(),
});
export type ToggleStepDto = z.infer<typeof toggleStepDtoSchema>;

@Injectable()
export class RoadmapsService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all published roadmaps */
  async listRoadmaps(query: RoadmapListQuery): Promise<RoadmapSummary[]> {
    const q = query.q?.trim().toLowerCase();
    const career = query.career?.trim();

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        career_id: string | null;
        career_slug: string | null;
        career_title: string | null;
        title: string;
        description: string | null;
        for_stage: string | null;
        estimated_duration_text: string | null;
        steps_count: number;
        milestones_count: number;
      }>
    >`
      select r.id::text, r.slug, r.career_id::text,
             c.slug as career_slug, c.title as career_title,
             r.title, r.description, r.for_stage, r.estimated_duration_text,
             count(s.id)::int as steps_count,
             count(case when s.is_milestone = true then 1 end)::int as milestones_count
      from roadmaps r
      left join careers c on c.id = r.career_id
      left join roadmap_steps s on s.roadmap_id = r.id
      where r.status = 'published'
        ${career ? Prisma.sql`and c.slug = ${career}` : Prisma.empty}
      group by r.id, r.slug, r.career_id, c.slug, c.title, r.title, r.description, r.for_stage, r.estimated_duration_text
      order by r.created_at asc
    `;

    if (!q) {
      return rows;
    }

    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.career_title && r.career_title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }

  /** Get individual roadmap by slug with ordered steps and student progress */
  async getRoadmapBySlug(slug: string, userId?: string): Promise<RoadmapDetail> {
    const rRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        career_id: string | null;
        career_slug: string | null;
        career_title: string | null;
        title: string;
        description: string | null;
        for_stage: string | null;
        estimated_duration_text: string | null;
      }>
    >`
      select r.id::text, r.slug, r.career_id::text,
             c.slug as career_slug, c.title as career_title,
             r.title, r.description, r.for_stage, r.estimated_duration_text
      from roadmaps r
      left join careers c on c.id = r.career_id
      where r.slug = ${slug} and r.status = 'published'
      limit 1
    `;

    if (!rRows || rRows.length === 0) {
      throw new NotFoundException(`Roadmap '${slug}' not found`);
    }

    const roadmap = rRows[0];

    // Fetch ordered roadmap steps
    const stepRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        stage: string;
        sort_order: number;
        kind: string;
        title: string;
        description: string | null;
        course_id: string | null;
        course_slug: string | null;
        exam_id: string | null;
        resources: any;
        estimated_duration_text: string | null;
        is_milestone: boolean;
      }>
    >`
      select s.id::text, s.stage, s.sort_order, s.kind::text, s.title, s.description,
             s.course_id::text, cr.slug as course_slug,
             s.exam_id::text, s.resources, s.estimated_duration_text, s.is_milestone
      from roadmap_steps s
      left join courses cr on cr.id = s.course_id
      where s.roadmap_id = ${roadmap.id}::uuid
      order by s.sort_order asc, s.created_at asc
    `;

    let userProgressMap: Record<string, ProgressStatus> = {};
    let isSaved = false;

    if (userId) {
      const urRows = await this.prisma.$queryRaw<
        Array<{ id: string }>
      >`
        select id::text from user_roadmaps
        where user_id = ${userId}::uuid and roadmap_id = ${roadmap.id}::uuid
        limit 1
      `;

      if (urRows && urRows.length > 0) {
        isSaved = true;
        const userRoadmapId = urRows[0].id;
        const progressRows = await this.prisma.$queryRaw<
          Array<{ step_id: string; status: string }>
        >`
          select step_id::text, status::text
          from user_roadmap_progress
          where user_roadmap_id = ${userRoadmapId}::uuid
        `;

        for (const pr of progressRows) {
          userProgressMap[pr.step_id] = pr.status as ProgressStatus;
        }
      }
    }

    const steps: RoadmapStepItem[] = stepRows.map((s) => ({
      id: s.id,
      stage: s.stage,
      sort_order: s.sort_order,
      kind: s.kind as any,
      title: s.title,
      description: s.description,
      course_id: s.course_id,
      course_slug: s.course_slug,
      exam_id: s.exam_id,
      resources: Array.isArray(s.resources) ? s.resources : [],
      estimated_duration_text: s.estimated_duration_text,
      is_milestone: s.is_milestone,
      user_status: userProgressMap[s.id] || 'todo',
    }));

    const totalSteps = steps.length;
    const completedSteps = steps.filter((st) => st.user_status === 'done').length;
    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      id: roadmap.id,
      slug: roadmap.slug,
      career_id: roadmap.career_id,
      career_slug: roadmap.career_slug,
      career_title: roadmap.career_title,
      title: roadmap.title,
      description: roadmap.description,
      for_stage: roadmap.for_stage,
      estimated_duration_text: roadmap.estimated_duration_text,
      steps_count: totalSteps,
      milestones_count: steps.filter((s) => s.is_milestone).length,
      steps,
      user_progress: {
        is_saved: isSaved,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        completion_percentage: completionPercentage,
      },
    };
  }

  /** Save roadmap to user account */
  async saveUserRoadmap(slug: string, userId: string): Promise<{ saved: boolean }> {
    const roadmap = await this.getRoadmapBySlug(slug);

    // Upsert user_roadmaps
    const urRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      insert into user_roadmaps (user_id, roadmap_id, status)
      values (${userId}::uuid, ${roadmap.id}::uuid, 'active')
      on conflict (user_id, roadmap_id) do update set
        status = 'active',
        updated_at = now()
      returning id::text
    `;
    const userRoadmapId = urRows[0].id;

    // Initialize roadmap progress steps
    for (const step of roadmap.steps) {
      await this.prisma.$executeRaw`
        insert into user_roadmap_progress (user_roadmap_id, step_id, status)
        values (${userRoadmapId}::uuid, ${step.id}::uuid, 'todo')
        on conflict (user_roadmap_id, step_id) do nothing
      `;
    }

    return { saved: true };
  }

  /** Toggle step progress for student (checkbox click) */
  async toggleStepProgress(
    slug: string,
    stepId: string,
    userId: string,
    dto?: ToggleStepDto,
  ) {
    const roadmap = await this.getRoadmapBySlug(slug);

    // Ensure user_roadmaps exists
    const urRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      insert into user_roadmaps (user_id, roadmap_id, status)
      values (${userId}::uuid, ${roadmap.id}::uuid, 'active')
      on conflict (user_id, roadmap_id) do update set
        status = 'active',
        updated_at = now()
      returning id::text
    `;
    const userRoadmapId = urRows[0].id;

    // Check current status
    const currentProgress = await this.prisma.$queryRaw<
      Array<{ status: string }>
    >`
      select status::text from user_roadmap_progress
      where user_roadmap_id = ${userRoadmapId}::uuid and step_id = ${stepId}::uuid
      limit 1
    `;

    let nextStatus: ProgressStatus = 'done';
    if (dto?.status) {
      nextStatus = dto.status;
    } else if (currentProgress.length > 0 && currentProgress[0].status === 'done') {
      nextStatus = 'todo';
    }

    await this.prisma.$executeRaw`
      insert into user_roadmap_progress (user_roadmap_id, step_id, status, completed_at, note, updated_at)
      values (
        ${userRoadmapId}::uuid,
        ${stepId}::uuid,
        ${nextStatus}::progress_status,
        ${nextStatus === 'done' ? Prisma.sql`now()` : Prisma.sql`null`},
        ${dto?.note || null},
        now()
      )
      on conflict (user_roadmap_id, step_id) do update set
        status = ${nextStatus}::progress_status,
        completed_at = ${nextStatus === 'done' ? Prisma.sql`now()` : Prisma.sql`null`},
        note = coalesce(${dto?.note || null}, user_roadmap_progress.note),
        updated_at = now()
    `;

    // Recalculate stats
    const stats = await this.prisma.$queryRaw<
      Array<{ completed: number; total: number }>
    >`
      select
        count(case when p.status = 'done' then 1 end)::int as completed,
        count(s.id)::int as total
      from roadmap_steps s
      left join user_roadmap_progress p on p.step_id = s.id and p.user_roadmap_id = ${userRoadmapId}::uuid
      where s.roadmap_id = ${roadmap.id}::uuid
    `;

    const completed = stats[0]?.completed || 0;
    const total = stats[0]?.total || 1;
    const percentage = Math.round((completed / total) * 100);

    return {
      step_id: stepId,
      status: nextStatus,
      completed_steps: completed,
      total_steps: total,
      completion_percentage: percentage,
    };
  }
}
