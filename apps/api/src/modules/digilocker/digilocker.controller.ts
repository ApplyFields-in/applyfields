import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { DigilockerService } from './digilocker.service.js';

@Controller('digilocker')
@UseGuards(AuthGuard)
export class DigilockerController {
  constructor(private readonly digilockerService: DigilockerService) {}

  /**
   * Returns current DigiLocker connection status for the candidate
   * GET /digilocker/status
   */
  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    return this.digilockerService.getStatus(req.user.userId);
  }

  /**
   * Queries candidate's issued certificates (Aadhaar, 10th CBSE/State marksheet, Caste certificate)
   * GET /digilocker/issued-documents
   */
  @Get('issued-documents')
  async getIssuedDocuments(@Req() req: AuthenticatedRequest) {
    return this.digilockerService.getIssuedDocuments(req.user.userId);
  }

  /**
   * Imports a verified document from DigiLocker directly into user_documents
   * POST /digilocker/import/:uri
   */
  @Post('import/:uri')
  @HttpCode(HttpStatus.OK)
  async importDocumentByParam(
    @Req() req: AuthenticatedRequest,
    @Param('uri') uri: string,
  ) {
    return this.digilockerService.importDocument(req.user.userId, decodeURIComponent(uri));
  }

  /**
   * Imports a verified document from DigiLocker via JSON body { uri: string }
   * POST /digilocker/import
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  async importDocumentByBody(
    @Req() req: AuthenticatedRequest,
    @Body('uri') uri: string,
  ) {
    return this.digilockerService.importDocument(req.user.userId, uri);
  }

  /**
   * Connect candidate to DigiLocker in Sandbox mode
   * POST /digilocker/connect-sandbox
   */
  @Post('connect-sandbox')
  @HttpCode(HttpStatus.OK)
  async connectSandbox(
    @Req() req: AuthenticatedRequest,
    @Body('digilockerId') digilockerId?: string,
  ) {
    return this.digilockerService.connectSandbox(req.user.userId, digilockerId);
  }

  /**
   * Unlinks candidate's DigiLocker connection
   * POST /digilocker/disconnect
   */
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@Req() req: AuthenticatedRequest) {
    return this.digilockerService.disconnect(req.user.userId);
  }
}
