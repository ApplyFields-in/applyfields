import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ServicesModule } from './modules/services/services.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SavedModule } from './modules/saved/saved.module.js';
import { SearchModule } from './modules/search/search.module.js';

@Module({
  imports: [
    PrismaModule,
    HomeModule,
    OpportunitiesModule,
    ServicesModule,
    AdminModule,
    AuthModule,
    UsersModule,
    SavedModule,
    SearchModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
