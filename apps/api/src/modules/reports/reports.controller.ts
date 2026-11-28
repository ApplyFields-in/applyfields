import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodPipe } from '../../common/zod.pipe.js';
import { clientIp } from '../../common/client-ip.js';
import { OptionalAuthGuard, type MaybeUserRequest } from '../auth/auth.guard.js';
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
  reporter_email: z.string().trim().email().max(200).optional(), // lets staff reply to anonymous reporters
});

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(OptionalAuthGuard) // signed in → admin sees who reported; anonymous still allowed
  async submitReport(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(reportSchema)) body: z.infer<typeof reportSchema>,
  ) {
    const reporterId = req.user?.userId || null;
    // clientIp, not @Ip(): on Render req.ip is a rotating Cloudflare address, so the anonymous limit never bit.
    return this.reportsService.submitReport(reporterId, body, clientIp(req) ?? '');
  }
}

const supportSchema = z.object({
  name: z.string().trim().max(100).optional(), // the Help form marks it optional
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
  @UseGuards(OptionalAuthGuard) // links the message to the account when signed in
  async contactSupport(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(supportSchema)) body: z.infer<typeof supportSchema>,
  ) {
    return this.reportsService.submitSupportTicket(body, clientIp(req) ?? '', req.user?.userId ?? null);
  }
}
