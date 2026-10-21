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
  BookingDetail,
  BookingListResponse,
  BookingReview,
  CreateBookingInput,
  CreateReviewInput,
  UpdateBookingStatusInput,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  AuthGuard,
  OptionalAuthGuard,
  type AuthenticatedRequest,
  type MaybeUserRequest,
} from '../auth/auth.guard.js';
import {
  BookingsService,
  createBookingSchema,
  createReviewSchema,
  updateBookingStatusSchema,
} from './bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // =========================================================================
  // CITIZEN ENDPOINTS
  // =========================================================================

  @Post()
  @UseGuards(OptionalAuthGuard)
  async createBooking(
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(createBookingSchema)) body: CreateBookingInput,
  ): Promise<BookingDetail> {
    const userId = req.user?.userId ?? null;
    return this.bookingsService.createBooking(userId, body);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async listMyBookings(@Req() req: AuthenticatedRequest): Promise<BookingListResponse> {
    return this.bookingsService.listUserBookings(req.user.userId);
  }

  // Partner inbox routes (must precede :id to prevent param collision)
  @Get('partner/inbox')
  @UseGuards(AuthGuard)
  async listPartnerInbox(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<BookingListResponse> {
    return this.bookingsService.listPartnerBookings(req.user.userId, status);
  }

  @Patch('partner/:id')
  @UseGuards(AuthGuard)
  async updatePartnerBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(updateBookingStatusSchema)) body: UpdateBookingStatusInput,
  ): Promise<BookingDetail> {
    return this.bookingsService.updatePartnerBooking(req.user.userId, bookingId, body);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getBooking(
    @Req() req: MaybeUserRequest,
    @Param('id') bookingId: string,
  ): Promise<BookingDetail> {
    const userId = req.user?.userId ?? null;
    return this.bookingsService.getUserBooking(userId, bookingId);
  }

  @Post(':id/cancel')
  async cancelBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body('reason') reason?: string,
  ): Promise<BookingDetail> {
    return this.bookingsService.cancelUserBooking(req.user.userId, bookingId, reason);
  }

  @Post(':id/review')
  async reviewBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(createReviewSchema)) body: CreateReviewInput,
  ): Promise<BookingReview> {
    return this.bookingsService.reviewBooking(req.user.userId, bookingId, body);
  }
}
