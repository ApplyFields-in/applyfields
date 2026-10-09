import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GuidanceController } from './guidance.controller.js';
import { GuidanceService } from './guidance.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GuidanceController],
  providers: [GuidanceService],
  exports: [GuidanceService],
})
export class GuidanceModule {}
