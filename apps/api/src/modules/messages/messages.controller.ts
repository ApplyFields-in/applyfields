import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  ChatMessageItem,
  ConversationListResponse,
  SendChatMessageInput,
} from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  AuthGuard,
  OptionalAuthGuard,
  type AuthenticatedRequest,
  type MaybeUserRequest,
} from '../auth/auth.guard.js';
import {
  MessagesService,
  markReadSchema,
  sendChatMessageSchema,
} from './messages.service.js';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // =========================================================================
  // BOOKING CHAT THREAD (CITIZEN & PARTNER)
  // =========================================================================

  @Get('bookings/:id/messages')
  @UseGuards(OptionalAuthGuard)
  async getMessages(@Param('id') bookingId: string): Promise<ChatMessageItem[]> {
    return this.messagesService.getMessages(bookingId);
  }

  @Post('bookings/:id/messages')
  @UseGuards(OptionalAuthGuard)
  async sendMessage(
    @Param('id') bookingId: string,
    @Req() req: MaybeUserRequest,
    @Body(new ZodPipe(sendChatMessageSchema)) body: SendChatMessageInput,
  ): Promise<ChatMessageItem> {
    const senderUserId = req.user?.userId ?? null;
    return this.messagesService.sendMessage(bookingId, senderUserId, body);
  }

  @Patch('bookings/:id/messages/read')
  @UseGuards(OptionalAuthGuard)
  async markRead(
    @Param('id') bookingId: string,
    @Body(new ZodPipe(markReadSchema)) body: { reader_type: 'citizen' | 'partner' },
  ): Promise<{ count: number }> {
    return this.messagesService.markAsRead(bookingId, body.reader_type);
  }

  // =========================================================================
  // PARTNER OPERATOR INBOX THREADS
  // =========================================================================

  @Get('partners/me/conversations')
  @UseGuards(AuthGuard)
  async getPartnerConversations(
    @Req() req: AuthenticatedRequest,
  ): Promise<ConversationListResponse> {
    return this.messagesService.getPartnerConversations(req.user.userId);
  }
}
