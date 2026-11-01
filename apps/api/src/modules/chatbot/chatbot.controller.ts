import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { ChatbotQueryResponse } from '@applyfields/types';
import type { Request } from 'express';
import { ZodPipe } from '../../common/zod.pipe.js';
import { chatbotQuerySchema, type ChatbotQueryDto } from './chatbot.schemas.js';
import { QueryRouterService } from './query-router.service.js';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly routerService: QueryRouterService) {}

  /**
   * GET /api/v1/chatbot/quota
   * Returns current user daily quota (3 free queries/day, resets at 12:00 AM IST)
   */
  @Get('quota')
  async getQuota(@Req() req: Request) {
    const userId = (req as any).user?.userId || null;
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '127.0.0.1';
    return this.routerService.getQuota(userId, clientIp);
  }

  /**
   * POST /api/v1/chatbot/query
   * Hybrid Dual-Path Query Router:
   * - Within-website queries: Fast-path deterministic SQL (<80ms, 0 LLM cost)
   * - Open-ended queries: Claude LLM synthesis
   * - Free users: Enforces 3 chats/day quota
   */
  @Post('query')
  @HttpCode(200)
  async query(
    @Body(new ZodPipe(chatbotQuerySchema)) input: ChatbotQueryDto,
    @Req() req: Request,
  ): Promise<ChatbotQueryResponse> {
    const userId = (req as any).user?.userId || null;
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '127.0.0.1';
    return this.routerService.handleQuery(input, userId, clientIp);
  }
}
