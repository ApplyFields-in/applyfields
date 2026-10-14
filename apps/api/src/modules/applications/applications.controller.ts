import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { ApplicationsService } from './applications.service.js';

const createApplicationSchema = z.object({
  opportunity_slug: z.string().optional(),
  service_slug: z.string().optional(),
  status: z
    .enum([
      'saved',
      'planning',
      'applied',
      'exam_interview',
      'selected',
      'rejected',
      'completed',
    ])
    .optional(),
  application_number: z.string().trim().max(100).optional(),
  roll_number: z.string().trim().max(100).optional(),
  exam_date: z.string().optional(),
  exam_center: z.string().trim().max(200).optional(),
  applied_on: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

const updateApplicationSchema = z.object({
  status: z
    .enum([
      'saved',
      'planning',
      'applied',
      'exam_interview',
      'selected',
      'rejected',
      'completed',
    ])
    .optional(),
  application_number: z.string().trim().max(100).nullable().optional(),
  roll_number: z.string().trim().max(100).nullable().optional(),
  exam_date: z.string().nullable().optional(),
  exam_center: z.string().trim().max(200).nullable().optional(),
  applied_on: z.string().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async listApplications(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ) {
    return this.applicationsService.listApplications(req.user.userId, status);
  }

  @Post()
  async createApplication(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(createApplicationSchema))
    body: z.infer<typeof createApplicationSchema>,
  ) {
    return this.applicationsService.createApplication(req.user.userId, body);
  }

  @Put(':id')
  async updateApplication(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodPipe(updateApplicationSchema))
    body: z.infer<typeof updateApplicationSchema>,
  ) {
    return this.applicationsService.updateApplication(req.user.userId, id, body);
  }

  @Delete(':id')
  async deleteApplication(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.applicationsService.deleteApplication(req.user.userId, id);
  }
}
