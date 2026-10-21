import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  PartnerDetail,
  PartnerDirectoryQuery,
  PartnerDirectoryResponse,
  PartnerDocumentSummary,
  PartnerRegistrationInput,
  PartnerServiceDetail,
  PartnerServiceInput,
  PartnerUpdateInput,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  AuthGuard,
  OptionalAuthGuard,
  type AuthenticatedRequest,
  type MaybeUserRequest,
} from '../auth/auth.guard.js';
import { CacheService } from '../../common/cache.service.js';
import {
  partnerDirectoryQuerySchema,
  partnerRegisterSchema,
  partnerServiceInputSchema,
  PartnersService,
  partnerUpdateSchema,
} from './partners.service.js';

@Controller('partners')
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly cache: CacheService,
  ) {}

  // =========================================================================
  // PUBLIC DIRECTORY & SEARCH
  // =========================================================================

  @Get('directory')
  async listDirectory(
    @Query(new ZodPipe(partnerDirectoryQuerySchema)) query: PartnerDirectoryQuery,
  ): Promise<PartnerDirectoryResponse> {
    const key = `partners:dir:${JSON.stringify(query)}`;
    return this.cache.wrap(key, 30, async () => {
      return this.partnersService.listDirectory(query);
    });
  }

  // =========================================================================
  // PARTNER SELF-SERVICE (PROTECTED)
  // =========================================================================

  @Post('register')
  @UseGuards(OptionalAuthGuard)
  async register(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(partnerRegisterSchema)) body: PartnerRegistrationInput,
  ): Promise<PartnerDetail> {
    const userId = req.user?.userId ?? null;
    return this.partnersService.register(userId, body);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyPartner(@Req() req: AuthenticatedRequest): Promise<PartnerDetail> {
    return this.partnersService.getPartnerForUser(req.user.userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMyPartner(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(partnerUpdateSchema)) body: PartnerUpdateInput,
  ): Promise<PartnerDetail> {
    return this.partnersService.updateProfile(req.user.userId, body);
  }

  @Get('me/services')
  @UseGuards(AuthGuard)
  async listMyServices(@Req() req: AuthenticatedRequest): Promise<PartnerServiceDetail[]> {
    return this.partnersService.listServices(req.user.userId);
  }

  @Post('me/services')
  @UseGuards(AuthGuard)
  async addMyService(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(partnerServiceInputSchema)) body: PartnerServiceInput,
  ): Promise<PartnerServiceDetail> {
    return this.partnersService.addService(req.user.userId, body);
  }

  @Patch('me/services/:id')
  @UseGuards(AuthGuard)
  async updateMyService(
    @Req() req: AuthenticatedRequest,
    @Param('id') serviceId: string,
    @Body(new ZodPipe(partnerServiceInputSchema.partial())) body: Partial<PartnerServiceInput>,
  ): Promise<PartnerServiceDetail> {
    return this.partnersService.updateService(req.user.userId, serviceId, body);
  }

  @Delete('me/services/:id')
  @UseGuards(AuthGuard)
  async deleteMyService(
    @Req() req: AuthenticatedRequest,
    @Param('id') serviceId: string,
  ): Promise<{ success: boolean }> {
    return this.partnersService.deleteService(req.user.userId, serviceId);
  }

  @Post('me/documents')
  @UseGuards(AuthGuard)
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Body() body: { document_kind: string; storage_path: string },
  ): Promise<PartnerDocumentSummary> {
    return this.partnersService.uploadDocument(req.user.userId, body);
  }

  // =========================================================================
  // PUBLIC PROFILE BY SLUG (Must be after specific routes like /directory, /me)
  // =========================================================================

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<PartnerDetail> {
    const key = `partners:slug:${slug}`;
    return this.cache.wrap(key, 60, async () => {
      return this.partnersService.getBySlug(slug);
    });
  }
}
