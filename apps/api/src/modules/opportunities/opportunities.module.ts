import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller.js';
import { OpportunitiesService } from './opportunities.service.js';
import { CacheService } from '../../common/cache.service.js';

@Module({
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, CacheService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
