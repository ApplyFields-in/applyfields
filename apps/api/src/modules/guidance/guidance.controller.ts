import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  AskGuidanceDto,
  AskGuidanceResponse,
  GuidanceConversation,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  askGuidanceDtoSchema,
  GuidanceService,
} from './guidance.service.js';

@Controller('career/guidance')
export class GuidanceController {
  constructor(private readonly guidanceService: GuidanceService) {}

  /** Ask the AI Career Guide a question */
  @Post('ask')
  async askGuidance(
    @Body(new ZodPipe(askGuidanceDtoSchema)) body: AskGuidanceDto,
    @Req() req: any,
  ): Promise<AskGuidanceResponse> {
    const userId = req.user?.userId;
    return this.guidanceService.askGuidance(body, userId);
  }

  /** Get user's guidance conversations history */
  @Get('history')
  @UseGuards(AuthGuard)
  async getHistory(
    @Req() req: AuthenticatedRequest,
  ): Promise<GuidanceConversation[]> {
    return this.guidanceService.getHistory(req.user.userId);
  }
}
