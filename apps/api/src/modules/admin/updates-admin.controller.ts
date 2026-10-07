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
  AdminUpdateDetail,
  AdminUpdateList,
  OpportunityStatus,
  StatusChange,
  UpdateInput,
  WriteResult,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { Roles } from '../../common/roles.decorator.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { statusChangeSchema, updateInputSchema } from './admin.schemas.js';
import { UpdatesAdminService } from './updates-admin.service.js';

const STATUSES: OpportunityStatus[] = [
  'draft',
  'published',
  'closed',
  'archived',
];

import { CacheService } from '../../common/cache.service.js';

/** Internal Portal → Results & updates: admit cards, results, answer keys… Reviewer and above. */
@Controller('admin')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class UpdatesAdminController {
  constructor(
    private readonly updates: UpdatesAdminService,
    private readonly cache: CacheService,
  ) {}

  /** GET /admin/updates?q=&status= */
  @Get('updates')
  list(
    @Query('q') q?: string,
    @Query('status') status?: string,
  ): Promise<AdminUpdateList> {
    if (status && !STATUSES.includes(status as OpportunityStatus)) {
      throw new BadRequestException(
        `status must be one of: ${STATUSES.join(', ')}`,
      );
    }
    return this.updates.list({
      q,
      status: (status as OpportunityStatus) || undefined,
    });
  }

  @Get('updates/:id')
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUpdateDetail> {
    return this.updates.detail(id);
  }

  /** POST /admin/updates — manual entry (starts as a draft) */
  @Post('updates')
  async create(
    @Body(new ZodPipe(updateInputSchema)) input: UpdateInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.updates.create(input, actor);
    this.cache.deletePrefix('updates');
    this.cache.delete('home:summary');
    return res;
  }

  @Put('updates/:id')
  async save(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(updateInputSchema)) input: UpdateInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.updates.save(id, input, actor);
    this.cache.deletePrefix('updates');
    this.cache.delete('home:summary');
    return res;
  }

  @Post('updates/:id/publish')
  @HttpCode(200)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.updates.publish(id, actor);
    this.cache.deletePrefix('updates');
    this.cache.delete('home:summary');
    return res;
  }

  /** POST /admin/updates/:id/status with status draft or archived (+ reason) */
  @Post('updates/:id/status')
  @HttpCode(200)
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(statusChangeSchema)) change: StatusChange,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    const res = await this.updates.setStatus(id, change, actor);
    this.cache.deletePrefix('updates');
    this.cache.delete('home:summary');
    return res;
  }
}

