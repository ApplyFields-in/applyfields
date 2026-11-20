import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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
@Roles('support')
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

  @Get(':id')
  async getPartner(@Param('id') partnerId: string): Promise<PartnerDetail> {
    return this.partnersService.adminGetPartner(partnerId);
  }

  @Get('documents/:id/file')
  async streamDocumentFile(
    @Param('id') documentId: string,
    @Res() res: Response,
  ) {
    const file = await this.partnersService.getPartnerDocumentFile(documentId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(file.buffer);
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

  @Patch(':id/verify')
  async verifyPartner(
    @Param('id') partnerId: string,
    @ActorId() reviewerId: string,
    @Body(new ZodPipe(partnerVerifySchema)) body: AdminPartnerVerifyInput,
  ): Promise<PartnerDetail> {
    return this.partnersService.adminVerifyPartner(partnerId, reviewerId, body);
  }
}
