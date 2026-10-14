import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { DocumentsService } from './documents.service.js';

const uploadDocumentSchema = z.object({
  documentTypeCode: z.string().min(1, 'Document type code is required'),
  title: z.string().trim().max(200).optional(),
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileBase64: z.string().min(10, 'File content is required'),
  issuedOn: z.string().optional(),
  expiresOn: z.string().optional(),
  issuingAuthority: z.string().trim().max(200).optional(),
  identifierNumber: z.string().trim().max(100).optional(),
  details: z.record(z.string(), z.any()).optional(),
});

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async listDocuments(@Req() req: AuthenticatedRequest) {
    return this.documentsService.listDocuments(req.user.userId);
  }

  @Post()
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(uploadDocumentSchema)) body: z.infer<typeof uploadDocumentSchema>,
  ) {
    return this.documentsService.uploadDocument(req.user.userId, body);
  }

  @Get('readiness/:opportunitySlug')
  async checkReadiness(
    @Req() req: AuthenticatedRequest,
    @Param('opportunitySlug') opportunitySlug: string,
  ) {
    return this.documentsService.checkReadiness(req.user.userId, opportunitySlug);
  }

  @Get(':id')
  async getDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.documentsService.getDocumentById(req.user.userId, id);
  }

  @Get(':id/download')
  async downloadDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const info = await this.documentsService.getDownloadInfo(req.user.userId, id);

    // Redirect to short-lived Supabase signed URL if available
    if (info.signedUrl) {
      return res.redirect(302, info.signedUrl);
    }

    if (!info.storagePath || !existsSync(info.storagePath)) {
      throw new NotFoundException('Document file not found on disk.');
    }

    res.setHeader('Content-Type', info.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${info.fileName || 'document.pdf'}"`,
    );
    return res.sendFile(info.storagePath);
  }

  @Delete(':id')
  async deleteDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.documentsService.deleteDocument(req.user.userId, id);
  }
}
