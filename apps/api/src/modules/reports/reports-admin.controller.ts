import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { ReportsService } from './reports.service.js';

const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'rejected', 'closed']),
  resolution_note: z.string().trim().max(1000).optional().default('Resolved by staff'),
  action: z.enum(['dismiss', 'hide', 'lock']).optional(),
});

@Controller('admin/reports')
@UseGuards(StaffGuard)
@Roles('reviewer', 'support')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async listReports(
    @Query('status') status?: string,
    @Query('item_type') itemType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.listAdminReports({
      status,
      item_type: itemType,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.getAdminReport(id);
  }

  @Patch(':id')
  async patchResolveReport(
    @Param('id') id: string,
    @ActorId() staffId: string,
    @Body(new ZodPipe(resolveReportSchema)) body: z.infer<typeof resolveReportSchema>,
  ) {
    return this.reportsService.resolveReport(staffId, id, body);
  }

  @Put(':id/resolve')
  async putResolveReport(
    @Param('id') id: string,
    @ActorId() staffId: string,
    @Body(new ZodPipe(resolveReportSchema)) body: z.infer<typeof resolveReportSchema>,
  ) {
    return this.reportsService.resolveReport(staffId, id, body);
  }
}

const supportUpdateSchema = z.object({
  status: z.enum(['in_review', 'resolved', 'closed']),
  note: z.string().trim().max(2000).optional(),
});

/** Help-page "Contact support" messages (support_tickets, not disputes). */
@Controller('admin/support')
@UseGuards(StaffGuard)
@Roles('support')
export class SupportAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async list(@Query('status') status?: string) {
    return this.reportsService.listSupportTickets(status);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @ActorId() staffId: string | null,
    @Body(new ZodPipe(supportUpdateSchema)) body: z.infer<typeof supportUpdateSchema>,
  ) {
    return this.reportsService.updateSupportTicket(staffId, id, body);
  }
}
