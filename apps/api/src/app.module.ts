import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module.js';

@Module({
  imports: [HomeModule, OpportunitiesModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
