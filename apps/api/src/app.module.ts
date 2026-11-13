import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { CommunityModule } from './modules/community/community.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { ApplicationsModule } from './modules/applications/applications.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { DigilockerModule } from './modules/digilocker/digilocker.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { ChatbotModule } from './modules/chatbot/chatbot.module.js';

@Module({
  imports: [
    // Per client IP (main.ts trusts Render's proxy, so req.ip is the real client). Generous enough
    // for a CSC centre or college sharing one IP; sign-in routes are tighter (AUTH_THROTTLE).
    // ponytail: in-memory per API instance; add a Redis storage when Render runs >1 instance.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      skipIf: () => process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT === 'off',
    }),
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
    CommunityModule,
    DocumentsModule,
    ApplicationsModule,
    ReportsModule,
    DigilockerModule,
    AnalyticsModule,
    MessagesModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
