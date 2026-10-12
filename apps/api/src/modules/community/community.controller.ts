import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CommunityComment,
  CommunityThread,
  CommunityThreadListResponse,
  CreateCommentInput,
  CreateThreadInput,
  ReportContentInput,
  ToggleUpvoteInput,
  ToggleUpvoteResponse,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  AuthGuard,
  OptionalAuthGuard,
  type AuthenticatedRequest,
  type MaybeUserRequest,
} from '../auth/auth.guard.js';
import {
  CommunityService,
  createCommentSchema,
  createThreadSchema,
  reportContentSchema,
  toggleUpvoteSchema,
} from './community.service.js';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('threads')
  @UseGuards(OptionalAuthGuard)
  async listThreads(
    @Req() req: MaybeUserRequest,
    @Query('opportunityId') opportunityId?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CommunityThreadListResponse> {
    const userId = req.user?.userId;
    return this.communityService.listThreads(
      {
        opportunityId,
        category,
        q,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
      userId,
    );
  }

  @Get('threads/:id')
  @UseGuards(OptionalAuthGuard)
  async getThread(
    @Param('id') threadId: string,
    @Req() req: MaybeUserRequest,
  ): Promise<CommunityThread> {
    const userId = req.user?.userId;
    return this.communityService.getThread(threadId, userId);
  }

  @Post('threads')
  @UseGuards(OptionalAuthGuard)
  async createThread(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(createThreadSchema)) body: CreateThreadInput,
  ): Promise<CommunityThread> {
    const userId = req.user?.userId ?? null;
    return this.communityService.createThread(userId, body);
  }

  @Post('threads/:id/comments')
  @UseGuards(OptionalAuthGuard)
  async addComment(
    @Param('id') threadId: string,
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(createCommentSchema)) body: CreateCommentInput,
  ): Promise<CommunityComment> {
    const userId = req.user?.userId ?? null;
    return this.communityService.addComment(userId, threadId, body);
  }

  @Post('upvote')
  @UseGuards(AuthGuard)
  async toggleUpvote(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(toggleUpvoteSchema)) body: ToggleUpvoteInput,
  ): Promise<ToggleUpvoteResponse> {
    return this.communityService.toggleUpvote(req.user.userId, body);
  }

  @Post('report')
  @UseGuards(OptionalAuthGuard)
  async reportContent(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(reportContentSchema)) body: ReportContentInput,
  ): Promise<{ report_id: string; message: string }> {
    const userId = req.user?.userId ?? null;
    return this.communityService.reportContent(userId, body);
  }
}
