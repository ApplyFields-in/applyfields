import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminPartnerListResponse,
  AdminPartnerVerifyInput,
  PartnerDetail,
  PartnerDocumentSummary,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  partnerVerifySchema,
  PartnersService,
} from './partners.service.js';

@Controller('admin/partners')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class PartnersAdminController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  async listPartners(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminPartnerListResponse> {
    return this.partnersService.adminListPartners({
      status,
      type,
      q,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id/verify')
  async verifyPartner(
    @Param('id') partnerId: string,
    @ActorId() reviewerId: string,
    @Body(new ZodPipe(partnerVerifySchema)) body: AdminPartnerVerifyInput,
  ): Promise<PartnerDetail> {
    return this.partnersService.adminVerifyPartner(partnerId, reviewerId, body);
  }

  @Patch('documents/:id/verify')
  async verifyDocument(
    @Param('id') documentId: string,
    @ActorId() reviewerId: string,
    @Body() body: { status: 'verified' | 'rejected'; reviewer_note?: string },
  ): Promise<PartnerDocumentSummary> {
    return this.partnersService.adminVerifyDocument(
      documentId,
      reviewerId,
      body.status,
      body.reviewer_note,
    );
  }
}
