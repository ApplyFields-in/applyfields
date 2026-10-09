import { Module } from '@nestjs/common';
import { AdminCareerController, CareerController } from './career.controller.js';
import { CareerService } from './career.service.js';

@Module({
  controllers: [CareerController, AdminCareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
