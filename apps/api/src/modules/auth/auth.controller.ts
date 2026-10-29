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
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
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

const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_BASE = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
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
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

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

    return { user: result.user, accessToken: result.accessToken };
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

    return { user: result.user, accessToken: result.accessToken };
  }

  @Post(['social/login', 'social-login'])
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

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
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

    return { user: result.user, accessToken: result.accessToken };
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

    return { success: true, accessToken: tokens.accessToken };
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
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    // Also revoke session if authorization header or cookie is present
    const authHeader = req.headers.authorization;
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
      req.cookies?.[ACCESS_COOKIE_NAME] ||
      req.cookies?.access_token;
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: jwtAccessSecret(),
        });
        if (payload?.sub) {
          await this.authService.logoutAllForUser(payload.sub);
        }
      } catch {}
    }

    const clearOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: COOKIE_BASE.sameSite,
      path: '/',
    };
    res.clearCookie(REFRESH_COOKIE_NAME, clearOpts);
    res.clearCookie(ACCESS_COOKIE_NAME, clearOpts);
    res.clearCookie('access_token', clearOpts);

    return { success: true };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
