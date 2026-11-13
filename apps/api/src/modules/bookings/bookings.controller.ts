import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import type {
  BookingDispute,
  CreateBookingDisputeInput,
  BookingDetail,
  BookingListResponse,
  BookingReview,
  CreateBookingInput,
  CreateReviewInput,
  MarkFiledInput,
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
  createDisputeSchema,

  markFiledSchema,
  shareDocumentsSchema,
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

  /** Operator: save the official application number + acknowledgment slip, complete, notify citizen. */
  @Post('partner/:id/filed')
  @UseGuards(AuthGuard)
  async markFiled(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(markFiledSchema)) body: MarkFiledInput,
  ): Promise<BookingDetail> {
    return this.bookingsService.markFiled(req.user.userId, bookingId, body);
  }

  @Get(':id/slip')
  @UseGuards(AuthGuard)
  async getSlip(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
  ): Promise<{ url: string }> {
    return this.bookingsService.slipUrl(req.user.userId, bookingId);
  }

  /** Citizen: which locker documents the centre may open for this booking (replaces the set). */
  @Put(':id/documents')
  @UseGuards(AuthGuard)
  async shareDocuments(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(shareDocumentsSchema)) body: z.infer<typeof shareDocumentsSchema>,
  ): Promise<BookingDetail> {
    return this.bookingsService.shareDocuments(req.user.userId, bookingId, body.document_ids);
  }

  /** Centre (or the citizen): 10-minute link to one shared document. */
  @Get(':id/documents/:shareId')
  @UseGuards(AuthGuard)
  async sharedDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ): Promise<{ url: string }> {
    return this.bookingsService.sharedDocumentUrl(req.user.userId, bookingId, shareId);
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
  @UseGuards(AuthGuard) // was missing: req.user was undefined → 500 for everyone
  async cancelBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body('reason') reason?: string,
  ): Promise<BookingDetail> {
    return this.bookingsService.cancelUserBooking(req.user.userId, bookingId, reason);
  }

  /** Citizen complaint about their booking → admin Disputes desk. */
  @Post(':id/dispute')
  @UseGuards(AuthGuard)
  async createDispute(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(createDisputeSchema)) body: CreateBookingDisputeInput,
  ): Promise<BookingDispute> {
    return this.bookingsService.createDispute(req.user.userId, bookingId, body);
  }

  @Post(':id/review')
  @UseGuards(AuthGuard) // was missing (same 500 as cancel)
  async reviewBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Body(new ZodPipe(createReviewSchema)) body: CreateReviewInput,
  ): Promise<BookingReview> {
    return this.bookingsService.reviewBooking(req.user.userId, bookingId, body);
  }
}
