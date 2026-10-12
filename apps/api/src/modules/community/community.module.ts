import { Module } from '@nestjs/common';
import { CommunityAdminController } from './community-admin.controller.js';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';

@Module({
  controllers: [CommunityController, CommunityAdminController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
