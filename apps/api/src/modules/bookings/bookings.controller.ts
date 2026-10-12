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
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import {
  BookingsService,
  createBookingSchema,
  createReviewSchema,
  updateBookingStatusSchema,
} from './bookings.service.js';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // =========================================================================
  // CITIZEN ENDPOINTS
  // =========================================================================

  @Post()
  async createBooking(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(createBookingSchema)) body: CreateBookingInput,
  ): Promise<BookingDetail> {
    return this.bookingsService.createBooking(req.user.userId, body);
  }

  @Get('my')
  async listMyBookings(@Req() req: AuthenticatedRequest): Promise<BookingListResponse> {
    return this.bookingsService.listUserBookings(req.user.userId);
  }

  // Partner inbox routes (must precede :id to prevent param collision)
  @Get('partner/inbox')
  async listPartnerInbox(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<BookingListResponse> {
    return this.bookingsService.listPartnerBookings(req.user.userId, status);
  }

  @Patch('partner/:id')
  async updatePartnerBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(updateBookingStatusSchema)) body: UpdateBookingStatusInput,
  ): Promise<BookingDetail> {
    return this.bookingsService.updatePartnerBooking(req.user.userId, bookingId, body);
  }

  @Get(':id')
  async getBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
  ): Promise<BookingDetail> {
    return this.bookingsService.getUserBooking(req.user.userId, bookingId);
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
