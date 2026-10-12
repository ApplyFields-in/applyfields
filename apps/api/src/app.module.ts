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

import { CareerModule } from './modules/career/career.module.js';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module.js';
import { InstitutionsModule } from './modules/institutions/institutions.module.js';
import { GuidanceModule } from './modules/guidance/guidance.module.js';
import { PartnersModule } from './modules/partners/partners.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';

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
    RoadmapsModule,
    InstitutionsModule,
    GuidanceModule,
    CareerModule,
    PartnersModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
