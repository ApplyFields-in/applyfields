import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  NotificationList,
  NotificationPreferences,
  NotificationPreferencesInput,
  PushPublicKeyResponse,
  PushSubscriptionInput,
} from '@applyfields/types';
import type { Response } from 'express';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { preferencesSchema, pushSubscriptionSchema } from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';

const page = (title: string, body: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f4f1e6;font-family:Arial,sans-serif;color:#0f4c5c"><div style="max-width:480px;margin:48px auto;padding:24px;background:#fdfbf3;border-radius:16px">
<p style="font-weight:700;margin:0 0 12px">ApplyFields</p>${body}</div></body></html>`;

/** The logged-in user's notification centre and preferences, plus the public unsubscribe link. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /notifications/push-public-key — returns the VAPID public key */
  @Get('push-public-key')
  getPushPublicKey(): PushPublicKeyResponse {
    return this.notifications.getPushPublicKey();
  }

  /** POST /notifications/push-subscribe — registers a browser push subscription */
  @Post('push-subscribe')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async pushSubscribe(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(pushSubscriptionSchema)) input: PushSubscriptionInput,
  ): Promise<{ subscribed: true }> {
    await this.notifications.subscribePush(req.user.userId, input);
    return { subscribed: true };
  }

  /** DELETE /notifications/push-unsubscribe — unregisters push subscription */
  @Delete('push-unsubscribe')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async pushUnsubscribe(
    @Req() req: AuthenticatedRequest,
    @Body('endpoint') endpoint?: string,
  ): Promise<{ unsubscribed: true }> {
    await this.notifications.unsubscribePush(req.user.userId, endpoint);
    return { unsubscribed: true };
  }

  /** POST /notifications/push-unsubscribe — alternative POST route */
  @Post('push-unsubscribe')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async pushUnsubscribePost(
    @Req() req: AuthenticatedRequest,
    @Body('endpoint') endpoint?: string,
  ): Promise<{ unsubscribed: true }> {
    await this.notifications.unsubscribePush(req.user.userId, endpoint);
    return { unsubscribed: true };
  }

  /** GET /notifications/stream — Server-Sent Events stream for instant in-app toasts */
  @Get('stream')
  @UseGuards(AuthGuard)
  stream(@Req() req: AuthenticatedRequest, @Res() res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    this.notifications.registerSseClient(req.user.userId, res);
  }

  /** GET /notifications — the latest 50, newest first, with the unread count */
  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: AuthenticatedRequest): Promise<NotificationList> {
    return this.notifications.list(req.user.userId);
  }

  @Post('read-all')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  readAll(@Req() req: AuthenticatedRequest): Promise<void> {
    return this.notifications.markRead(req.user.userId);
  }

  @Post(':id/read')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  read(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notifications.markRead(req.user.userId, id);
  }

  @Get('preferences')
  @UseGuards(AuthGuard)
  preferences(@Req() req: AuthenticatedRequest): Promise<NotificationPreferences> {
    return this.notifications.preferences(req.user.userId);
  }

  @Put('preferences')
  @UseGuards(AuthGuard)
  savePreferences(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodPipe(preferencesSchema)) input: NotificationPreferencesInput,
  ): Promise<NotificationPreferences> {
    return this.notifications.savePreferences(req.user.userId, input);
  }

  /** The email link opens a confirm page (so link scanners can't unsubscribe anyone)… */
  @Get('unsubscribe')
  unsubscribePage(@Res() res: Response): void {
    res
      .type('html')
      .send(
        page(
          'Unsubscribe',
          `<h1 style="font-size:20px">Stop ApplyFields emails?</h1><p>You'll still see notifications on the website.</p>
<form method="post"><button style="background:#0f4c5c;color:#fdfbf3;border:0;padding:12px 20px;border-radius:999px;font-weight:600;cursor:pointer">Unsubscribe</button></form>`,
        ),
      );
  }

  /** …and the button (or the mail app's one-click List-Unsubscribe-Post) does it. */
  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(@Query('token') token: string | undefined, @Res() res: Response): Promise<void> {
    const ok = token ? await this.notifications.unsubscribe(token) : false;
    res
      .status(ok ? 200 : 400)
      .type('html')
      .send(
        ok
          ? page('Unsubscribed', `<h1 style="font-size:20px">You're unsubscribed</h1><p>We won't email you any more. You can turn emails back on from Notifications on the website.</p>`)
          : page('Link not valid', `<h1 style="font-size:20px">This link isn't valid</h1><p>It may have expired. Turn emails off from Notifications on the website instead.</p>`),
      );
  }
}
