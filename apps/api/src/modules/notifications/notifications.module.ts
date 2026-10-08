import { Module } from '@nestjs/common';
import { StaffGuard } from '../../common/staff.guard.js';
import { NotificationsAdminController } from './notifications-admin.controller.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsScheduler } from './notifications.scheduler.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, NotificationsScheduler, StaffGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
