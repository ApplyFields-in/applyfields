import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OpportunitiesModule } from '../opportunities/opportunities.module.js';
import { SavedController } from './saved.controller.js';

@Module({
  imports: [OpportunitiesModule, NotificationsModule],
  controllers: [SavedController],
})
export class SavedModule {}
