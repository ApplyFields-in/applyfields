import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller.js';
import { PartnersAdminController } from './partners-admin.controller.js';
import { PartnersService } from './partners.service.js';
import { StaffGuard } from '../../common/staff.guard.js';

@Module({
  controllers: [PartnersController, PartnersAdminController],
  providers: [PartnersService, StaffGuard],
  exports: [PartnersService],
})
export class PartnersModule {}
