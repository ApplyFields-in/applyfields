import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import type {
  CourseDetail,
  CourseSummary,
  InstitutionDetail,
  InstitutionSummary,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  courseListQuerySchema,
  institutionListQuerySchema,
  InstitutionsService,
  type CourseListQuery,
  type InstitutionListQuery,
} from './institutions.service.js';

@Controller('career')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  // Courses
  @Get('courses')
  async listCourses(
    @Query(new ZodPipe(courseListQuerySchema)) query: CourseListQuery,
  ): Promise<CourseSummary[]> {
    return this.institutionsService.listCourses(query);
  }

  @Get('courses/:slug')
  async getCourseBySlug(@Param('slug') slug: string): Promise<CourseDetail> {
    return this.institutionsService.getCourseBySlug(slug);
  }

  // Colleges
  @Get('colleges')
  async listInstitutions(
    @Query(new ZodPipe(institutionListQuerySchema)) query: InstitutionListQuery,
  ): Promise<InstitutionSummary[]> {
    return this.institutionsService.listInstitutions(query);
  }

  @Get('colleges/compare')
  async compareInstitutions(
    @Query('slugs') slugs?: string,
    @Query('ids') ids?: string,
  ): Promise<InstitutionDetail[]> {
    const raw = slugs || ids || '';
    const targets = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return this.institutionsService.compareInstitutions(targets);
  }

  @Get('colleges/:slug')
  async getInstitutionBySlug(
    @Param('slug') slug: string,
  ): Promise<InstitutionDetail> {
    return this.institutionsService.getInstitutionBySlug(slug);
  }
}
