import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminBroadcastInput,
  AdminBroadcastResult,
  AdminNotificationOverview,
  DeliveryStatus,
  ManualAlertInput,
  ManualAlertResult,
} from '@applyfields/types';
import { ActorId } from '../../common/actor.js';
import { Roles } from '../../common/roles.decorator.js';
import { StaffGuard } from '../../common/staff.guard.js';
import { ZodPipe } from '../../common/zod.pipe.js';
import { adminBroadcastSchema, manualAlertSchema } from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';

const STATUSES: DeliveryStatus[] = ['pending', 'sent', 'delivered', 'failed'];

/** Internal Portal → Notifications: email queue (sent / pending / failed) and manual alerts. */
@Controller('admin')
@UseGuards(StaffGuard)
@Roles('reviewer')
export class NotificationsAdminController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /admin/notifications?status= */
  @Get('notifications')
  overview(@Query('status') status?: string): Promise<AdminNotificationOverview> {
    if (status && !STATUSES.includes(status as DeliveryStatus)) {
      throw new BadRequestException(`status must be one of: ${STATUSES.join(', ')}`);
    }
    return this.notifications.overview((status as DeliveryStatus) || undefined);
  }

  /** POST /admin/notifications/broadcast — multi-channel broadcast to All, Subscribers, or Savers */
  @Post('notifications/broadcast')
  @Roles('admin')
  @HttpCode(200)
  broadcast(
    @Body(new ZodPipe(adminBroadcastSchema)) input: AdminBroadcastInput,
    @ActorId() actor: string | null,
  ): Promise<AdminBroadcastResult> {
    return this.notifications.broadcast(input, actor);
  }

  /** POST /admin/notifications/alert — to everyone who saved a job, or to one user */
  @Post('notifications/alert')
  @Roles('admin')
  @HttpCode(200)
  alert(
    @Body(new ZodPipe(manualAlertSchema)) input: ManualAlertInput,
    @ActorId() actor: string | null,
  ): Promise<ManualAlertResult> {
    return this.notifications.alert(input, actor);
  }

  /** POST /admin/notifications/:id/retry — a failed email goes back in the queue */
  @Post('notifications/:id/retry')
  @Roles('admin')
  @HttpCode(200)
  async retry(@Param('id', ParseUUIDPipe) id: string): Promise<{ retried: true }> {
    await this.notifications.retry(id);
    return { retried: true };
  }
}
