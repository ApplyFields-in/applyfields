import { Module } from '@nestjs/common';
import { OpportunitiesModule } from '../opportunities/opportunities.module.js';
import { SavedController } from './saved.controller.js';

@Module({
  imports: [OpportunitiesModule],
  controllers: [SavedController],
})
export class SavedModule {}
