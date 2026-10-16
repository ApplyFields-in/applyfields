import {
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DigilockerService } from './digilocker.service.js';

@Controller('auth/digilocker')
export class DigilockerAuthController {
  constructor(private readonly digilockerService: DigilockerService) {}

  /**
   * Generates DigiLocker OAuth 2.0 PKCE authorization URL
   * GET /auth/digilocker/authorize
   */
  @Get('authorize')
  async authorize(
    @Query('redirect') redirect: string,
    @Query('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authData = await this.digilockerService.generateAuthorizationUrl(userId);

    // If query ?redirect=true or direct browser navigation, redirect directly
    if (redirect === 'true' || req.accepts('html')) {
      return res.redirect(302, authData.authorizationUrl);
    }

    return res.json(authData);
  }

  /**
   * DigiLocker Sandbox API Setu OAuth callback
   * GET /auth/digilocker/callback
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendBase =
      process.env.DIGILOCKER_FRONTEND_URL || 'http://localhost:3000/account';

    if (error || !code) {
      const errorMsg = error || 'Authorization was cancelled by user';
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
