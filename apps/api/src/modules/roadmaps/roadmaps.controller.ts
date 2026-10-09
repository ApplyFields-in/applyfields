import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RoadmapDetail, RoadmapSummary } from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  roadmapListQuerySchema,
  RoadmapsService,
  toggleStepDtoSchema,
  type RoadmapListQuery,
  type ToggleStepDto,
} from './roadmaps.service.js';

@Controller('career/roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  /** List all published roadmaps */
  @Get()
  async listRoadmaps(
    @Query(new ZodPipe(roadmapListQuerySchema)) query: RoadmapListQuery,
  ): Promise<RoadmapSummary[]> {
    return this.roadmapsService.listRoadmaps(query);
  }

  /** Get individual roadmap by slug with steps and progress */
  @Get(':slug')
  async getRoadmapBySlug(
    @Param('slug') slug: string,
    @Req() req: any,
  ): Promise<RoadmapDetail> {
    const userId = req.user?.userId;
    return this.roadmapsService.getRoadmapBySlug(slug, userId);
  }

  /** Save roadmap to student account */
  @Post(':slug/save')
  @UseGuards(AuthGuard)
  async saveRoadmap(
    @Param('slug') slug: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roadmapsService.saveUserRoadmap(slug, req.user.userId);
  }

  /** Toggle step progress for student (checkbox click) */
  @Post(':slug/steps/:stepId/toggle')
  @UseGuards(AuthGuard)
  async toggleStep(
    @Param('slug') slug: string,
    @Param('stepId') stepId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(toggleStepDtoSchema)) body?: ToggleStepDto,
  ) {
    return this.roadmapsService.toggleStepProgress(
      slug,
      stepId,
      req.user.userId,
      body,
    );
  }
}
