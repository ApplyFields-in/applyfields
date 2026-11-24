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
  ScheduledBroadcastItem,
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

  /** GET /admin/notifications/scheduled — upcoming and recent scheduled broadcasts */
  @Get('notifications/scheduled')
  scheduled(): Promise<ScheduledBroadcastItem[]> {
    return this.notifications.listScheduled();
  }

  /** POST /admin/notifications/scheduled/:id/cancel */
  @Post('notifications/scheduled/:id/cancel')
  @Roles('admin')
  @HttpCode(200)
  async cancelScheduled(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actor: string | null,
  ): Promise<{ cancelled: true }> {
    await this.notifications.cancelScheduled(id, actor);
    return { cancelled: true };
  }

  /** POST /admin/notifications/broadcast — send now, or later when send_at is set */
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

  /** POST /admin/notifications/cadence/:slot — trigger daily 3-slot cadence (morning/afternoon/evening) */
  @Post('notifications/cadence/:slot')
  @Roles('admin')
  @HttpCode(200)
  async triggerCadence(
    @Param('slot') slot: 'morning' | 'afternoon' | 'evening',
  ): Promise<{ dispatched: number; slot: string }> {
    const dispatched = await this.notifications.runDailyCadence(slot);
    return { dispatched, slot };
  }
}
