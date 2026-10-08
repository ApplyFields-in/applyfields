import { Module } from '@nestjs/common';
import { StorageService } from '../../common/storage.service.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { AdminController } from './admin.controller.js';
import { ExpiryService } from './expiry.service.js';
import { OpportunitiesAdminController } from './opportunities-admin.controller.js';
import { OpportunitiesAdminService } from './opportunities-admin.service.js';
import { ReviewService } from './review.service.js';
import { UpdatesAdminController } from './updates-admin.controller.js';
import { UpdatesAdminService } from './updates-admin.service.js';
import { UsersAdminService } from './users.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [
    AdminController,
    OpportunitiesAdminController,
    UpdatesAdminController,
  ],
  providers: [
    ReviewService,
    StorageService,
    OpportunitiesAdminService,
    UpdatesAdminService,
    ExpiryService,
    UsersAdminService,
    StaffGuard,
  ],
})
export class AdminModule {}
