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
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('education')
  async getEducation(@Req() req: AuthenticatedRequest) {
    return this.usersService.getEducation(req.user.userId);
  }

  @Post('education')
  async addEducation(@Req() req: AuthenticatedRequest, @Body() dto: CreateEducationDto) {
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
  async deleteEducation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.deleteEducation(id, req.user.userId);
  }

  // --- Resume Document & Extraction Endpoints ---
  @Post('resume')
  async uploadAndExtractResume(@Req() req: AuthenticatedRequest, @Body() dto: UploadResumeDto) {
    return this.usersService.uploadAndExtractResume(req.user.userId, dto);
  }

  @Get('resume')
  async getResume(@Req() req: AuthenticatedRequest) {
    const resume = await this.usersService.getResume(req.user.userId);
    return { resume, success: true };
  }

  @Get('resume/download')
  async downloadResume(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const doc = await this.usersService.getResume(req.user.userId);
    if (!doc || !doc.storage_path || !existsSync(doc.storage_path)) {
      throw new NotFoundException('Saved resume file not found');
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name || 'resume.pdf'}"`);
    return res.sendFile(doc.storage_path);
  }

  @Delete('resume')
  async deleteResume(@Req() req: AuthenticatedRequest) {
    return this.usersService.deleteResume(req.user.userId);
  }
}
