import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { InstitutionEnquiryListResponse } from '@applyfields/types';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { InstitutionsService } from './institutions.service.js';

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
}
