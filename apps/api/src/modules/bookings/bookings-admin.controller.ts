import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminBookingDispute,
  BookingDispute,
  BookingListResponse,
  ResolveBookingDisputeInput,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { BookingsService, resolveDisputeSchema } from './bookings.service.js';

@Controller('admin/bookings')
@UseGuards(StaffGuard)
@Roles('support')
export class BookingsAdminController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async listBookings(
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<BookingListResponse> {
    return this.bookingsService.adminListBookings({
      partnerId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /** GET /admin/bookings/disputes?status=open — citizen complaints about bookings. */
  @Get('disputes')
  async listDisputes(@Query('status') status?: string): Promise<{ total: number; items: AdminBookingDispute[] }> {
    return this.bookingsService.adminListDisputes(status);
  }

  /** PATCH /admin/bookings/disputes/:id {status, note} — the citizen is notified with the note. */
  @Patch('disputes/:id')
  async resolveDispute(
    @ActorId() actorId: string | null,
    @Param('id') id: string,
    @Body(new ZodPipe(resolveDisputeSchema)) body: ResolveBookingDisputeInput,
  ): Promise<BookingDispute> {
    return this.bookingsService.adminResolveDispute(actorId, id, body);
  }
}
