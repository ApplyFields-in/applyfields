import { Module } from '@nestjs/common';
import { CacheService } from '../../common/cache.service.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ServicesAdminController } from './services-admin.controller.js';
import { ServicesAdminService } from './services-admin.service.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  controllers: [ServicesController, ServicesAdminController],
  providers: [
    ServicesService,
    ServicesAdminService,
    CacheService,
    StaffGuard,
  ],
  exports: [ServicesService, ServicesAdminService],
})
export class ServicesModule {}
