import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { BookingListResponse } from '@applyfields/types';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { BookingsService } from './bookings.service.js';

@Controller('admin/bookings')
@UseGuards(StaffGuard)
@Roles('reviewer')
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
}
