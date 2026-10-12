import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller.js';
import { BookingsAdminController } from './bookings-admin.controller.js';
import { BookingsService } from './bookings.service.js';
import { StaffGuard } from '../../common/staff.guard.js';

@Module({
  controllers: [BookingsController, BookingsAdminController],
  providers: [BookingsService, StaffGuard],
  exports: [BookingsService],
})
export class BookingsModule {}
