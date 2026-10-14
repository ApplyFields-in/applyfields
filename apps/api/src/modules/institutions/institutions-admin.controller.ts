import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  InstitutionDetail,
  InstitutionEnquiryListResponse,
  InstitutionListResponse,
} from '@applyfields/types';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  adminCreateInstitutionSchema,
  adminInstitutionQuerySchema,
  adminUpdateInstitutionSchema,
  InstitutionsService,
  type AdminCreateInstitutionInput,
  type AdminInstitutionQuery,
  type AdminUpdateInstitutionInput,
} from './institutions.service.js';

@Controller('admin/institutions')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class InstitutionsAdminController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('enquiries')
  async listEnquiries(
    @Query('institutionId') institutionId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<InstitutionEnquiryListResponse> {
    return this.institutionsService.adminListEnquiries({
      institutionId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get()
  async listInstitutions(
    @Query(new ZodPipe(adminInstitutionQuerySchema)) query: AdminInstitutionQuery,
  ): Promise<InstitutionListResponse> {
    return this.institutionsService.adminListInstitutions(query);
  }

  @Post()
  async createInstitution(
    @Body(new ZodPipe(adminCreateInstitutionSchema)) body: AdminCreateInstitutionInput,
  ): Promise<InstitutionDetail> {
    return this.institutionsService.adminCreateInstitution(body);
  }

  @Get(':id')
  async getInstitution(@Param('id') id: string): Promise<InstitutionDetail> {
    return this.institutionsService.adminGetInstitution(id);
  }

  @Patch(':id')
  async updateInstitution(
    @Param('id') id: string,
    @Body(new ZodPipe(adminUpdateInstitutionSchema)) body: AdminUpdateInstitutionInput,
  ): Promise<InstitutionDetail> {
    return this.institutionsService.adminUpdateInstitution(id, body);
  }

  @Delete(':id')
  async deleteInstitution(
    @Param('id') id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.institutionsService.adminDeleteInstitution(id);
  }
}
