import { existsSync } from 'node:fs';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto.js';
import { UploadResumeDto } from './dto/resume.dto.js';
import { CreateExamScoreDto, UpdateExamScoreDto } from './dto/exam-score.dto.js';
import {
  DeleteAccountDto,
  StartChangeContactDto,
  VerifyChangeContactDto,
} from './dto/account.dto.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';

@Controller('me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.userId);
  }

  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('education')
  async getEducation(@Req() req: AuthenticatedRequest) {
    return this.usersService.getEducation(req.user.userId);
  }

  @Post('education')
  async addEducation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEducationDto,
  ) {
    return this.usersService.addEducation(req.user.userId, dto);
  }

  @Put('education/:id')
  async updateEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.usersService.updateEducation(id, req.user.userId, dto);
  }

  @Delete('education/:id')
  async deleteEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteEducation(id, req.user.userId);
  }

  // --- Resume Document & Extraction Endpoints ---
  @Post('resume')
  async uploadAndExtractResume(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UploadResumeDto,
  ) {
    return this.usersService.uploadAndExtractResume(req.user.userId, dto);
  }

  @Get('resume')
  async getResume(@Req() req: AuthenticatedRequest) {
    const resume = await this.usersService.getResume(req.user.userId);
    return { resume, success: true };
  }

  @Get('resume/download')
  async downloadResume(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    // Prefer a Supabase signed URL (staging/prod); fall back to local disk (dev)
    const signedUrl = await this.usersService.getResumeSignedUrl(req.user.userId);
    if (signedUrl) {
      return res.redirect(302, signedUrl);
    }

    const fileInfo = await this.usersService.getResumeStoragePath(req.user.userId);
    if (!fileInfo || !existsSync(fileInfo.storage_path)) {
      throw new NotFoundException('Saved resume file not found');
    }
    const safeType = ['application/pdf', 'text/plain'].includes(fileInfo.mime_type ?? '')
      ? fileInfo.mime_type!
      : 'application/octet-stream';
    res.setHeader('Content-Type', safeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileInfo.file_name || 'resume.pdf'}"`,
    );
    return res.sendFile(fileInfo.storage_path);
  }

  @Delete('resume')
  async deleteResume(@Req() req: AuthenticatedRequest) {
    return this.usersService.deleteResume(req.user.userId);
  }

  // --- Active Sessions Endpoints ---
  @Get('sessions')
  async listSessions(@Req() req: AuthenticatedRequest) {
    return this.usersService.listSessions(req.user.userId);
  }

  @Delete('sessions/:id')
  async revokeSession(@Param('id') id: string) {
    return this.usersService.revokeSession(id);
  }

  @Post('sessions/logout-others')
  async revokeOtherSessions(@Req() req: AuthenticatedRequest) {
    return this.usersService.revokeOtherSessions(req.user.userId);
  }

  // --- Competitive Exam Scores Endpoints ---
  @Get('exam-scores')
  async getExamScores(@Req() req: AuthenticatedRequest) {
    return this.usersService.getExamScores(req.user.userId);
  }

  @Post('exam-scores')
  async addExamScore(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExamScoreDto,
  ) {
    return this.usersService.addExamScore(req.user.userId, dto);
  }

  @Put('exam-scores/:id')
  async updateExamScore(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateExamScoreDto,
  ) {
    return this.usersService.updateExamScore(id, req.user.userId, dto);
  }

  @Delete('exam-scores/:id')
  async deleteExamScore(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteExamScore(id, req.user.userId);
  }

  // --- Data Portability (Export) & Account Deletion (DPDP) ---
  @Get('export')
  async exportUserData(@Req() req: AuthenticatedRequest) {
    return this.usersService.exportUserData(req.user.userId);
  }

  @Post('delete')
  async deleteUserAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteUserAccount(req.user.userId, dto);
  }

  // --- Contact Change with OTP ---
  @Post('change-contact/start')
  async startChangeContact(
    @Req() req: AuthenticatedRequest,
    @Body() dto: StartChangeContactDto,
  ) {
    return this.usersService.startChangeContact(req.user.userId, dto);
  }

  @Post('change-contact/verify')
  async verifyChangeContact(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyChangeContactDto,
  ) {
    return this.usersService.verifyChangeContact(req.user.userId, dto);
  }
}
