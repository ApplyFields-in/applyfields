import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChatbotController } from './chatbot.controller.js';
import { QueryRouterService } from './query-router.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ChatbotController],
  providers: [QueryRouterService],
  exports: [QueryRouterService],
})
export class ChatbotModule {}

