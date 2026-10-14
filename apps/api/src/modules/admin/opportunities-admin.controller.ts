import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { Roles } from '../../common/roles.decorator.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { opportunityInputSchema, statusChangeSchema } from './admin.schemas.js';
import { OpportunitiesAdminService } from './opportunities-admin.service.js';
import { ReviewService } from './review.service.js';

import { CacheService } from '../../common/cache.service.js';

const STATUSES: OpportunityStatus[] = [
  'draft',
  'published',
  'closed',
  'archived',
];
const TYPES: OpportunityType[] = [
  'govt_job',
  'exam',
  'scholarship',
  'admission',
];

function oneOf<T extends string>(
  value: string | undefined,
  allowed: T[],
  name: string,
): T | undefined {
  if (!value) return undefined;
  if (!allowed.includes(value as T))
    throw new BadRequestException(
      `${name} must be one of: ${allowed.join(', ')}`,
    );
  return value as T;
}

/** Internal Portal → Opportunities: every job in any status. Reviewer and above. */
@Controller('admin')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class OpportunitiesAdminController {
  constructor(
    private readonly opportunities: OpportunitiesAdminService,
    private readonly review: ReviewService,
    private readonly cache: CacheService,
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
  @Roles('admin')
  @HttpCode(200)
  async closeExpired(@ActorId() actor: string | null): Promise<{ closed: number }> {
    const res = await this.opportunities.closeExpired(actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }

  /** GET /admin/opportunities/:id — same shape as the review screen */
  @Get('opportunities/:id')
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewDetail> {
    return this.review.detail(id);
  }

  /** POST /admin/opportunities — manual entry from an official notification (starts as a draft) */
  @Post('opportunities')
  async create(
    @Body(new ZodPipe(opportunityInputSchema)) input: OpportunityInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.opportunities.create(input, actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }

  /** PUT /admin/opportunities/:id — save every field (a live job must stay complete) */
  @Put('opportunities/:id')
  async save(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(opportunityInputSchema)) input: OpportunityInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.opportunities.save(id, input, actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }

  /** POST /admin/opportunities/:id/publish — runs the publish check, records a version */
  @Post('opportunities/:id/publish')
  @Roles('admin')
  @HttpCode(200)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.opportunities.publish(id, actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }

  /** POST /admin/opportunities/:id/status with status draft, closed or archived (+ reason) — unpublish, close, reject */
  @Post('opportunities/:id/status')
  @Roles('admin')
  @HttpCode(200)
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(statusChangeSchema)) change: StatusChange,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.opportunities.setStatus(id, change, actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }

  /** GET /admin/opportunities/:id/versions — view version history drawer */
  @Get('opportunities/:id/versions')
  @Roles('reviewer')
  async listVersions(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.opportunities.listVersions(id);
  }

  /** POST /admin/opportunities/:id/versions/:versionNo/restore — restore an earlier snapshot */
  @Post('opportunities/:id/versions/:versionNo/restore')
  @Roles('admin')
  @HttpCode(200)
  async restoreVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionNo') versionNo: string,
    @ActorId() actor: string | null,
  ) {
    const vNo = parseInt(versionNo, 10);
    if (isNaN(vNo) || vNo < 1) throw new BadRequestException('Invalid version number');
    const res = await this.opportunities.restoreVersion(id, vNo, actor);
    this.cache.deletePrefix('opportunities');
    this.cache.delete('home:summary');
    return res;
  }
}
