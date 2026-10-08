import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { jwtAccessSecret } from '../../common/jwt-secret.js';

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  phone: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

function tokenFrom(request: Request): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
  return request.cookies?.accessToken ?? request.cookies?.access_token;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = tokenFrom(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtAccessSecret(),
      });
      request.user = {
        userId: payload.sub,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

/** No token → anonymous (req.user unset). A bad token still gets 401, so the web app refreshes it. */
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return tokenFrom(request) ? super.canActivate(context) : true;
  }
}

export type MaybeUserRequest = Request & { user?: AuthenticatedUser };
