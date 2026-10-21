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
import { ScrapersAdminController } from './scrapers-admin.controller.js';
import { ScrapersAdminService } from './scrapers-admin.service.js';
import { ScraperSchedulerService } from './scraper-scheduler.service.js';
import { LinkHealthService } from './link-health.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [
    AdminController,
    OpportunitiesAdminController,
    UpdatesAdminController,
    ScrapersAdminController,
  ],
  providers: [
    ReviewService,
    StorageService,
    OpportunitiesAdminService,
    UpdatesAdminService,
    ExpiryService,
    UsersAdminService,
    ScrapersAdminService,
    ScraperSchedulerService,
    LinkHealthService,
    StaffGuard,
  ],
})
export class AdminModule {}

