import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminReportDetail,
  AdminReportListResponse,
  CommunityThread,
  ResolveReportInput,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  CommunityService,
  moderateThreadSchema,
  resolveReportSchema,
} from './community.service.js';

@Controller('admin/community')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class CommunityAdminController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('reports')
  async listReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminReportListResponse> {
    return this.communityService.adminListReports({
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('reports/:id')
  async resolveReport(
    @Param('id') reportId: string,
    @ActorId() reviewerId: string,
    @Body(new ZodPipe(resolveReportSchema)) body: ResolveReportInput,
  ): Promise<AdminReportDetail> {
    return this.communityService.adminResolveReport(reportId, reviewerId, body);
  }

  @Patch('threads/:id')
  async moderateThread(
    @Param('id') threadId: string,
    @Body(new ZodPipe(moderateThreadSchema)) body: { is_pinned?: boolean; is_locked?: boolean; is_hidden?: boolean },
  ): Promise<CommunityThread> {
    return this.communityService.adminModerateThread(threadId, body);
  }
}
