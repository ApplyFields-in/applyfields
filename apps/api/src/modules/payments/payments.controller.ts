import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodPipe } from '../../common/zod.pipe.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { PaymentsService, verifySchema, type VerifyInput } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Public: is Razorpay on, the Key ID for Checkout (never the secret), Plus price, convenience fee. */
  @Get('config')
  config() {
    return this.payments.config();
  }

  @Get('plus')
  @UseGuards(AuthGuard)
  myPlus(@Req() req: AuthenticatedRequest) {
    return this.payments.myPlus(req.user.userId);
  }

  @Post('plus/subscribe')
  @UseGuards(AuthGuard)
  subscribe(@Req() req: AuthenticatedRequest) {
    return this.payments.subscribePlus(req.user.userId);
  }

  @Post('plus/cancel')
  @UseGuards(AuthGuard)
  cancel(@Req() req: AuthenticatedRequest) {
    return this.payments.cancelPlus(req.user.userId);
  }

  @Get('bookings/:id')
  @UseGuards(AuthGuard)
  bookingPayment(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.bookingPayment(req.user.userId, id);
  }

  @Post('bookings/:id/order')
  @UseGuards(AuthGuard)
  bookingOrder(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.bookingOrder(req.user.userId, id);
  }

  /** Razorpay Checkout success handler posts here. */
  @Post('verify')
  @UseGuards(AuthGuard)
  verify(@Req() req: AuthenticatedRequest, @Body(new ZodPipe(verifySchema)) body: VerifyInput) {
    return this.payments.verify(req.user.userId, body);
  }

  /** Razorpay webhook (set in the Razorpay dashboard: https://<api>/api/v1/payments/webhook). */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature?: string) {
    if (!(await this.payments.webhook(req.rawBody, signature))) throw new BadRequestException('Bad signature');
    return { ok: true };
  }
}
