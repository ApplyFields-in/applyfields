import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  LoginDto,
  LoginOtpDto,
  SocialLoginDto,
  PasskeyLoginDto,
  PasskeyRegisterDto,
} from './dto/login.dto.js';
import { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_NAME = 'accessToken';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function cookieOpts(rememberMe?: boolean) {
  if (rememberMe) {
    return {
      access: { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 },
      refresh: { ...COOKIE_BASE, maxAge: 30 * 24 * 60 * 60 * 1000 },
    };
  }
  return { access: { ...COOKIE_BASE }, refresh: { ...COOKIE_BASE } };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.register(dto, ip);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.authService.login(dto, meta);

    const opts = cookieOpts(dto.rememberMe);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user };
  }

  @Post('login/otp')
  @HttpCode(HttpStatus.OK)
  async loginWithOtp(
    @Body() dto: LoginOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.authService.loginWithOtp(dto, meta);

    const opts = cookieOpts(dto.rememberMe);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user };
  }

  @Post('social/login')
  @HttpCode(HttpStatus.OK)
  async socialLogin(
    @Body() dto: SocialLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.authService.socialLogin(dto, meta);

    const opts = cookieOpts(true);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user };
  }

  @Post('passkey/login')
  @HttpCode(HttpStatus.OK)
  async passkeyLogin(
    @Body() dto: PasskeyLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.authService.passkeyLogin(dto, meta);

    const opts = cookieOpts(true);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user };
  }

  @Post('passkey/register')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async registerPasskey(
    @Body() dto: PasskeyRegisterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.registerPasskey(req.user.userId, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const rawRefreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || body?.refreshToken;
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };

    const tokens = await this.authService.refreshTokens(rawRefreshToken, meta);

    // Refresh inherits the cookie style of the original login — if the
    // existing refresh cookie has a maxAge it was a "remember me" session.
    const remembered = req.cookies?.[REFRESH_COOKIE_NAME] !== undefined;
    const opts = cookieOpts(remembered);
    res.cookie(REFRESH_COOKIE_NAME, tokens.newRefreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, opts.access);

    return { success: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const rawRefreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] || body?.refreshToken;
    await this.authService.logout(rawRefreshToken);

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie(ACCESS_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
