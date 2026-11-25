import { contentDisposition } from '../../common/content-disposition.js';
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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import type {
  ChatMessageItem,
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
  attachToChatSchema,
  shareDocumentsSchema,
  updateBookingStatusSchema,
  walkInSchema,
  type WalkInInput,
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

  /** Centre counter: register a walk-in citizen as an in-progress, already-paid booking. */
  @Post('partner/walk-in')
  @UseGuards(AuthGuard)
  async createWalkIn(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(walkInSchema)) body: WalkInInput,
  ): Promise<BookingDetail> {
    return this.bookingsService.createWalkIn(req.user.userId, body);
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

  @Get(':id/slip/file')
  @UseGuards(AuthGuard)
  async getSlipFile(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Res() res: Response,
  ) {
    const slip = await this.bookingsService.getSlipFile(req.user.userId, bookingId);
    res.setHeader('Content-Type', slip.mimeType);
    res.setHeader('Content-Disposition', contentDisposition('inline', slip.fileName));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(slip.buffer);
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

  /** Citizen: attach a locker document in the booking chat (shares it with the centre, posts a message). */
  @Post(':id/chat/attachments')
  @UseGuards(AuthGuard)
  async attachToChat(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) bookingId: string,
    @Body(new ZodPipe(attachToChatSchema)) body: z.infer<typeof attachToChatSchema>,
  ): Promise<ChatMessageItem> {
    return this.bookingsService.attachToChat(req.user.userId, bookingId, body.document_id);
  }

  /** Centre (or the citizen): link to stream one shared document. */
  @Get(':id/documents/:shareId')
  @UseGuards(AuthGuard)
  async sharedDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ): Promise<{ url: string }> {
    return this.bookingsService.sharedDocumentUrl(req.user.userId, bookingId, shareId);
  }

  /** Centre (or citizen): stream decrypted shared document in memory (Cache-Control: no-store). */
  @Get(':id/documents/:shareId/file')
  @UseGuards(AuthGuard)
  async streamSharedDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id') bookingId: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Res() res: Response,
  ) {
    const doc = await this.bookingsService.getDecryptedSharedDocument(
      req.user.userId,
      bookingId,
      shareId,
    );
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', contentDisposition('inline', doc.fileName));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(doc.buffer);
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
