import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { AuthService, SESSION_DAYS } from './auth.service.js';
import { PasskeysService } from './passkeys.service.js';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  LoginDto,
  LoginOtpDto,
  LoginVerifyDto,
  SocialLoginDto,
  PasskeyVerifyDto,
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

/** "Remember me": cookies outlive the browser and the session slides for SESSION_DAYS. Off: gone when the browser closes. */
function cookieOpts(rememberMe?: boolean) {
  if (rememberMe) {
    return {
      access: { ...COOKIE_BASE, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 },
      refresh: { ...COOKIE_BASE, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 },
    };
  }
  return { access: { ...COOKIE_BASE }, refresh: { ...COOKIE_BASE } };
}

/**
 * The Expo apps send `x-client: app`. They keep the refresh token in SecureStore (cookie stores
 * on Android aren't reliable across restarts), so for them it is also returned in the body.
 * Browsers never get it in the body: it stays in the httpOnly cookie, out of reach of page scripts.
 */
const forApp = (req: Request, refreshToken: string) =>
  req.headers['x-client'] === 'app' ? { refreshToken } : {};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly passkeys: PasskeysService,
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
    // Never-verified account: a code was sent; the client finishes with POST /auth/login/verify.
    if ('verificationRequired' in result) return result;

    const opts = cookieOpts(dto.rememberMe);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user, accessToken: result.accessToken, ...forApp(req, result.refreshToken) };
  }

  /** Password + code, step 1: checks the password and sends a code to the same email/phone. */
  @Post('login/start')
  @HttpCode(HttpStatus.OK)
  async startPasswordLogin(@Body() dto: LoginDto) {
    return this.authService.startPasswordLogin(dto);
  }

  /** Password + code, step 2: issues an `mfa` session (required for /admin). */
  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordLogin(
    @Body() dto: LoginVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.authService.verifyPasswordLogin(dto, meta);

    const opts = cookieOpts(dto.rememberMe);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);

    return { user: result.user, accessToken: result.accessToken, ...forApp(req, result.refreshToken) };
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

    return { user: result.user, accessToken: result.accessToken, ...forApp(req, result.refreshToken) };
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

    return { user: result.user, accessToken: result.accessToken, ...forApp(req, result.refreshToken) };
  }

  // ---------- Passkeys (WebAuthn) ----------

  @Post('passkey/login/options')
  @HttpCode(HttpStatus.OK)
  passkeyLoginOptions() {
    return this.passkeys.loginOptions();
  }

  @Post('passkey/login/verify')
  @HttpCode(HttpStatus.OK)
  async passkeyLogin(
    @Body() dto: PasskeyVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip || req.socket.remoteAddress };
    const result = await this.passkeys.verifyLogin(
      { response: dto.response as unknown as AuthenticationResponseJSON, challengeToken: dto.challengeToken },
      meta,
    );
    const opts = cookieOpts(dto.rememberMe ?? true);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, opts.refresh);
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, opts.access);
    return { user: result.user, accessToken: result.accessToken, ...forApp(req, result.refreshToken) };
  }

  @Post('passkey/register/options')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  passkeyRegisterOptions(@Req() req: AuthenticatedRequest) {
    return this.passkeys.registerOptions(req.user.userId);
  }

  @Post('passkey/register/verify')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  passkeyRegister(@Body() dto: PasskeyVerifyDto, @Req() req: AuthenticatedRequest) {
    return this.passkeys.verifyRegistration(req.user.userId, {
      response: dto.response as unknown as RegistrationResponseJSON,
      challengeToken: dto.challengeToken,
      name: dto.name,
    });
  }

  @Get('passkeys')
  @UseGuards(AuthGuard)
  listPasskeys(@Req() req: AuthenticatedRequest) {
    return this.passkeys.list(req.user.userId);
  }

  @Delete('passkeys/:id')
  @UseGuards(AuthGuard)
  removePasskey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.passkeys.remove(req.user.userId, id);
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

    return { success: true, accessToken: tokens.accessToken, ...forApp(req, tokens.newRefreshToken) };
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
