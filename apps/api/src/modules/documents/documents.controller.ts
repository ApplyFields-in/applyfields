import { contentDisposition } from '../../common/content-disposition.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
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

const updateDocumentDetailsSchema = z.object({
  details: z.record(z.string(), z.any()),
  identifierNumber: z.string().trim().max(100).optional(),
  title: z.string().trim().max(200).optional(),
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

  /** Stream decrypted document file inline for the owner (Cache-Control: no-store) */
  @Get(':id/file')
  async getDocumentFile(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.getDecryptedFile(req.user.userId, id);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition('inline', file.fileName || 'document.pdf'));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(file.buffer);
  }

  @Get(':id/download')
  async downloadDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.getDecryptedFile(req.user.userId, id);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition('attachment', file.fileName || 'document.pdf'));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(file.buffer);
  }

  @Get(':id/preview')
  async previewDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.getDecryptedFile(req.user.userId, id);
    res.setHeader('Content-Type', file.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition('inline', file.fileName || 'document.pdf'));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(file.buffer);
  }

  @Patch(':id/details')
  async updateDocumentDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodPipe(updateDocumentDetailsSchema)) body: z.infer<typeof updateDocumentDetailsSchema>,
  ) {
    return this.documentsService.updateDocumentDetails(req.user.userId, id, body);
  }

  @Delete(':id')
  async deleteDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.documentsService.deleteDocument(req.user.userId, id);
  }
}
