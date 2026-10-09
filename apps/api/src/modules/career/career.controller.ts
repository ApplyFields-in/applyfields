import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CareerCategory, CareerDetail, CareerSummary, UserCareerProfile } from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  adminCareerDtoSchema,
  careerListQuerySchema,
  CareerService,
  userCareerProfileSchema,
  type AdminCareerDto,
  type CareerListQuery,
  type UserCareerProfileDto,
} from './career.service.js';

@Controller('career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  /** List all published career categories */
  @Get('categories')
  async getCategories(): Promise<CareerCategory[]> {
    return this.careerService.getCategories();
  }

  /** List / Explore careers with category, search and stream filters */
  @Get()
  async listCareers(@Query(new ZodPipe(careerListQuerySchema)) query: CareerListQuery): Promise<CareerSummary[]> {
    return this.careerService.listCareers(query);
  }

  /** Recommendations based on student profile */
  @Get('recommendations')
  async getRecommendations(@Req() req: any): Promise<CareerSummary[]> {
    const userId = req.user?.userId;
    return this.careerService.getRecommendedCareers(userId);
  }

  /** Get current user's career profile */
  @Get('profile/me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserCareerProfile | null> {
    return this.careerService.getUserCareerProfile(req.user.userId);
  }

  /** Save current user's career profile */
  @Post('profile/me')
  @UseGuards(AuthGuard)
  async saveProfile(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(userCareerProfileSchema)) body: UserCareerProfileDto,
  ): Promise<UserCareerProfile> {
    return this.careerService.saveUserCareerProfile(req.user.userId, body);
  }

  /** Get individual career details by slug */
  @Get(':slug')
  async getCareerBySlug(@Param('slug') slug: string): Promise<CareerDetail> {
    return this.careerService.getCareerBySlug(slug);
  }
}

@Controller('admin/careers')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class AdminCareerController {
  constructor(private readonly careerService: CareerService) {}

  @Get()
  async listAll(@Query('q') q?: string, @Query('status') status?: string) {
    return this.careerService.adminListCareers({ q, status });
  }

  @Post()
  async createCareer(@Body(new ZodPipe(adminCareerDtoSchema)) body: AdminCareerDto) {
    return this.careerService.adminCreateCareer(body);
  }

  @Put(':id')
  async updateCareer(@Param('id') id: string, @Body() body: Partial<AdminCareerDto>) {
    return this.careerService.adminUpdateCareer(id, body);
  }
}
