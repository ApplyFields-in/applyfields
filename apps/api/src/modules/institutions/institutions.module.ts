import { Module } from '@nestjs/common';
import { InstitutionsAdminController } from './institutions-admin.controller.js';
import { InstitutionsController } from './institutions.controller.js';
import { InstitutionsService } from './institutions.service.js';

@Module({
  controllers: [InstitutionsController, InstitutionsAdminController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
  imports: [],
})
export class InstitutionsModule {}
