import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module.js';
import { OpportunitiesController } from './opportunities.controller.js';
import { OpportunitiesService } from './opportunities.service.js';

/** CacheService comes from the global PrismaModule — don't provide it again here (that makes a second cache). */
@Module({
  imports: [EligibilityModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService, EligibilityModule],
})
export class OpportunitiesModule {}
