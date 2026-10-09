import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RoadmapsController } from './roadmaps.controller.js';
import { RoadmapsService } from './roadmaps.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RoadmapsController],
  providers: [RoadmapsService],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
