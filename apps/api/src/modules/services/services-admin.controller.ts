import {
  Body,
  Controller,
  Delete,
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
  AdminGovServiceList,
  GovServiceDetail,
  GovServiceInput,
  OpportunityStatus,
  StatusChange,
  WriteResult,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ServicesAdminService } from './services-admin.service.js';

@Controller('admin/services')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class ServicesAdminController {
  constructor(private readonly servicesAdmin: ServicesAdminService) {}

  /** GET /api/v1/admin/services — list all services across statuses */
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AdminGovServiceList> {
    return this.servicesAdmin.list({
      q,
      status: status as OpportunityStatus | undefined,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
    });
  }

  /** GET /api/v1/admin/services/:id — single service for editing */
  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<GovServiceDetail> {
    return this.servicesAdmin.get(id);
  }

  /** POST /api/v1/admin/services — create a draft service */
  @Post()
  @Roles('admin')
  async create(
    @Body() body: GovServiceInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.servicesAdmin.create(body, actor);
  }

  /** PUT /api/v1/admin/services/:id — update service details */
  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: GovServiceInput,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.servicesAdmin.update(id, body, actor);
  }

  /** POST /api/v1/admin/services/:id/publish — publish service */
  @Post(':id/publish')
  @Roles('admin')
  @HttpCode(200)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.servicesAdmin.publish(id, actor);
  }

  /** POST /api/v1/admin/services/:id/status — change status (unpublish / close / archive) */
  @Post(':id/status')
  @Roles('admin')
  @HttpCode(200)
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: StatusChange,
    @ActorId() actor: string | null,
  ): Promise<WriteResult> {
    return this.servicesAdmin.setStatus(id, body.status, body.reason, actor);
  }

  /** DELETE /api/v1/admin/services/:id — delete draft service */
  @Delete(':id')
  @Roles('admin')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<{ success: boolean }> {
    return this.servicesAdmin.delete(id, actor);
  }
}
