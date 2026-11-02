import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChatbotController } from './chatbot.controller.js';
import { NotificationDigestService } from './notification-digest.service.js';
import { QueryRouterService } from './query-router.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [QueryRouterService, NotificationDigestService],
  exports: [QueryRouterService, NotificationDigestService],
})
export class ChatbotModule {}
