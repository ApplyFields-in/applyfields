import {
  Body,
  Controller,
  Ip,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodPipe } from '../../common/zod.pipe.js';
import { ReportsService } from './reports.service.js';

const reportSchema = z.object({
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
  item_id: z.string().min(1, 'Item ID or reference is required'),
  item_slug: z.string().optional(),
  reason: z.enum([
    'incorrect_info',
    'broken_link',
    'fake_or_scam',
    'partner_issue',
    'service_complaint',
    'other',
  ]),
  details: z.string().trim().max(1000).optional(),
});

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async submitReport(
    @Req() req: Request,
    @Ip() ip: string,
    @Body(new ZodPipe(reportSchema)) body: z.infer<typeof reportSchema>,
  ) {
    // Optional authenticated user id if citizen is logged in
    const user = (req as any).user;
    const reporterId = user?.userId || null;
    return this.reportsService.submitReport(reporterId, body, ip);
  }
}

const supportSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  category: z
    .enum(['account', 'application', 'eligibility', 'documents', 'bug', 'other'])
    .optional(),
  message: z.string().trim().min(10, 'Message is required').max(2000),
});

@Controller('support')
export class SupportController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('contact')
  async contactSupport(
    @Ip() ip: string,
    @Body(new ZodPipe(supportSchema)) body: z.infer<typeof supportSchema>,
  ) {
    return this.reportsService.submitSupportTicket(body, ip);
  }
}
