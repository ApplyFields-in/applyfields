import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChatbotController } from './chatbot.controller.js';
import { NotificationDigestService } from './notification-digest.service.js';
import { QueryRouterService } from './query-router.service.js';
import { SemanticCacheService } from './semantic-cache.service.js';
import { ChatbotAnalyticsService } from './chatbot-analytics.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [
    QueryRouterService,
    NotificationDigestService,
    SemanticCacheService,
    ChatbotAnalyticsService,
  ],
  exports: [
    QueryRouterService,
    NotificationDigestService,
    SemanticCacheService,
    ChatbotAnalyticsService,
  ],
})
export class ChatbotModule {}
