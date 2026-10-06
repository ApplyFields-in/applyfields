import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  AdminOpportunityList,
  OpportunityInput,
  OpportunityStatus,
  OpportunityType,
  OrganizationOption,
  ReviewDetail,
  StatusChange,
  WriteResult,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { opportunityInputSchema, statusChangeSchema } from './admin.schemas.js';
import { OpportunitiesAdminService } from './opportunities-admin.service.js';
import { ReviewService } from './review.service.js';

const STATUSES: OpportunityStatus[] = ['draft', 'published', 'closed', 'archived'];
const TYPES: OpportunityType[] = ['govt_job', 'exam', 'scholarship', 'admission'];

function oneOf<T extends string>(value: string | undefined, allowed: T[], name: string): T | undefined {
  if (!value) return undefined;
  if (!allowed.includes(value as T)) throw new BadRequestException(`${name} must be one of: ${allowed.join(', ')}`);
  return value as T;
}

/** Internal Portal → Opportunities: every job in any status. Staff only. */
@Controller('admin')
@UseGuards(StaffGuard)
export class OpportunitiesAdminController {
  constructor(
    private readonly opportunities: OpportunitiesAdminService,
    private readonly review: ReviewService,
  ) {}

  /** GET /admin/opportunities?q=&status=&type=&page= — most recently changed first, 50 per page */
  @Get('opportunities')
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
  ): Promise<AdminOpportunityList> {
    return this.opportunities.list({
      q,
      status: oneOf(status, STATUSES, 'status'),
      type: oneOf(type, TYPES, 'type'),
      page: Math.max(1, Number.parseInt(page ?? '1', 10) || 1),
      pageSize: 50,
    });
  }

  /** GET /admin/organizations — for the organisation picker */
  @Get('organizations')
  organizations(): Promise<OrganizationOption[]> {
    return this.opportunities.organizations();
  }

  /** POST /admin/opportunities/close-expired — run the auto-close now (it also runs every hour) */
  @Post('opportunities/close-expired')
  @HttpCode(200)
  closeExpired(@ActorId() actor: string | null): Promise<{ closed: number }> {
    return this.opportunities.closeExpired(actor);
  }

  /** GET /admin/opportunities/:id — same shape as the review screen */
  @Get('opportunities/:id')
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewDetail> {
    return this.review.detail(id);
  }

  /** POST /admin/opportunities — manual entry from an official notification (starts as a draft) */
  @Post('opportunities')
  create(@Body(new ZodPipe(opportunityInputSchema)) input: OpportunityInput, @ActorId() actor: string | null): Promise<WriteResult> {
    return this.opportunities.create(input, actor);
  }

  /** PUT /admin/opportunities/:id — save every field (a live job must stay complete) */
  @Put('opportunities/:id')
  save(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(opportunityInputSchema)) input: OpportunityInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.opportunities.save(id, input, actor);
  }

  /** POST /admin/opportunities/:id/publish — runs the publish check, records a version */
  @Post('opportunities/:id/publish')
  @HttpCode(200)
  publish(@Param('id', ParseUUIDPipe) id: string, @ActorId() actor: string | null): Promise<WriteResult> {
    return this.opportunities.publish(id, actor);
  }

  /** POST /admin/opportunities/:id/status with status draft, closed or archived (+ reason) — unpublish, close, reject */
  @Post('opportunities/:id/status')
  @HttpCode(200)
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(statusChangeSchema)) change: StatusChange,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.opportunities.setStatus(id, change, actor);
  }
}
