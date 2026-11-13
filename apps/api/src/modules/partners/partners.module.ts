import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller.js';
import { PartnersAdminController } from './partners-admin.controller.js';
import { PartnersService } from './partners.service.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { StorageService } from '../../common/storage.service.js';

@Module({
  controllers: [PartnersController, PartnersAdminController],
  providers: [PartnersService, StaffGuard, StorageService],
  exports: [PartnersService],
})
export class PartnersModule {}
