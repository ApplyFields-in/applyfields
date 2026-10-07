import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  phone: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret =
        process.env.JWT_ACCESS_SECRET ??
        'applyfields_dev_jwt_access_secret_32bytes_min_key';
      const payload = await this.jwtService.verifyAsync(token, { secret });
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
