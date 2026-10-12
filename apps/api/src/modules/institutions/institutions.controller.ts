import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CourseDetail,
  CourseSummary,
  CreateInstitutionEnquiryInput,
  InstitutionDetail,
  InstitutionEnquiry,
  InstitutionEnquiryListResponse,
  InstitutionPartnerProfile,
  InstitutionSummary,
  RespondInstitutionEnquiryInput,
  UpdateInstitutionProfileInput,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  AuthGuard,
  OptionalAuthGuard,
  type AuthenticatedRequest,
  type MaybeUserRequest,
} from '../auth/auth.guard.js';
import {
  courseListQuerySchema,
  createInstitutionEnquirySchema,
  institutionListQuerySchema,
  InstitutionsService,
  respondInstitutionEnquirySchema,
  type CourseListQuery,
  type InstitutionListQuery,
  updateInstitutionProfileSchema,
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

  // Student Inquiries (Citizen self-service)
  @Get('colleges/my-enquiries')
  @UseGuards(AuthGuard)
  async listMyEnquiries(
    @Req() req: AuthenticatedRequest,
  ): Promise<InstitutionEnquiryListResponse> {
    return this.institutionsService.listUserEnquiries(req.user.userId);
  }

  // Partner College Desk
  @Get('colleges/partner/desk')
  @UseGuards(AuthGuard)
  async getPartnerDesk(
    @Req() req: AuthenticatedRequest,
  ): Promise<InstitutionPartnerProfile> {
    return this.institutionsService.getPartnerInstitutionDesk(req.user.userId);
  }

  @Patch('colleges/partner/desk')
  @UseGuards(AuthGuard)
  async updatePartnerDesk(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(updateInstitutionProfileSchema)) body: UpdateInstitutionProfileInput,
  ): Promise<InstitutionPartnerProfile> {
    return this.institutionsService.updatePartnerInstitutionDesk(req.user.userId, body);
  }

  @Get('colleges/partner/enquiries')
  @UseGuards(AuthGuard)
  async listPartnerEnquiries(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<InstitutionEnquiryListResponse> {
    return this.institutionsService.listPartnerEnquiries(req.user.userId, status);
  }

  @Patch('colleges/partner/enquiries/:id')
  @UseGuards(AuthGuard)
  async respondToPartnerEnquiry(
    @Req() req: AuthenticatedRequest,
    @Param('id') enquiryId: string,
    @Body(new ZodPipe(respondInstitutionEnquirySchema)) body: RespondInstitutionEnquiryInput,
  ): Promise<InstitutionEnquiry> {
    return this.institutionsService.respondToPartnerEnquiry(req.user.userId, enquiryId, body);
  }

  // College detail by slug
  @Get('colleges/:slug')
  async getInstitutionBySlug(
    @Param('slug') slug: string,
  ): Promise<InstitutionDetail> {
    return this.institutionsService.getInstitutionBySlug(slug);
  }

  // Submit Admission Enquiry to College Desk
  @Post('colleges/:slug/enquiries')
  @UseGuards(OptionalAuthGuard)
  async createEnquiry(
    @Param('slug') slug: string,
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(createInstitutionEnquirySchema)) body: CreateInstitutionEnquiryInput,
  ): Promise<InstitutionEnquiry> {
    const userId = req.user?.userId ?? null;
    return this.institutionsService.createEnquiry(slug, userId, body);
  }
}
