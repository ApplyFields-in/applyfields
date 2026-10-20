import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OptionalAuthGuard, type MaybeUserRequest } from '../auth/auth.guard.js';
import { DigilockerService } from './digilocker.service.js';

@Controller('auth/digilocker')
export class DigilockerAuthController {
  constructor(private readonly digilockerService: DigilockerService) {}

  /**
   * Generates DigiLocker OAuth 2.0 PKCE authorization URL and redirects to the official portal
   * GET /auth/digilocker/authorize
   */
  @Get('authorize')
  @UseGuards(OptionalAuthGuard)
  async authorize(
    @Query('redirect') redirect: string,
    @Query('userId') userId: string,
    @Req() req: MaybeUserRequest,
    @Res() res: Response,
  ) {
    const effectiveUserId = req.user?.userId || userId;
    const authData = await this.digilockerService.generateAuthorizationUrl(effectiveUserId);

    // If query ?redirect=true or direct browser navigation, redirect directly to official DigiLocker portal
    if (redirect === 'true' || req.accepts('html')) {
      return res.redirect(302, authData.authorizationUrl);
    }

    return res.json(authData);
  }

  /**
   * DigiLocker API Setu OAuth callback
   * GET /auth/digilocker/callback
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: MaybeUserRequest,
    @Res() res: Response,
  ) {
    const frontendBase = this.digilockerService.getFrontendCallbackUrl();

    if (error || !code) {
      const errorMsg =
        errorDescription || error || 'Authorization was cancelled by user';
      return res.redirect(
        302,
        `${frontendBase}?digilocker_error=${encodeURIComponent(errorMsg)}`,
      );
    }

    try {
      const result = await this.digilockerService.handleCallback(code, state);

      if (req.accepts('json') && !req.accepts('html')) {
        return res.json(result);
      }

      return res.redirect(
        302,
        `${frontendBase}?digilocker=connected&digilocker_id=${encodeURIComponent(
          result.digilockerId,
        )}`,
      );
    } catch (err: any) {
      return res.redirect(
        302,
        `${frontendBase}?digilocker_error=${encodeURIComponent(
          err?.message || 'Failed to exchange DigiLocker authorization code',
        )}`,
      );
    }
  }
}
