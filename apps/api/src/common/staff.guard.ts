import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { StaffRole } from '@applyfields/types';
import { PrismaService } from '../prisma/prisma.service.js';
import { ROLES_KEY, hasStaffPermission } from './roles.decorator.js';
import type { StaffUser } from './actor.js';

export interface StaffRequest extends Request {
  staff?: StaffUser;
}

/**
 * Protects every /admin endpoint.
 *
 * 1. Reads access token from Bearer header or cookie (accessToken). 401 if missing/invalid.
 * 2. Loads user's user_roles from database. 403 if user has no staff roles.
 * 3. Enforces @Roles(...) decorator hierarchy:
 *    - 'reviewer' -> reviewer and above (reviewer, admin, super_admin)
 *    - 'admin'    -> admin and above (admin, super_admin)
 *    - 'super_admin' -> super_admin only
 * 4. Attaches req.staff = { id, email, name, roles }.
 */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<StaffRequest>();

    // 1. Read access token
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    // 2. Verify token
    let payload: { sub?: string; userId?: string; email?: string } | undefined;
    try {
      const secret =
        process.env.JWT_ACCESS_SECRET ??
        'applyfields_dev_jwt_access_secret_32bytes_min_key';
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    const userId = payload?.sub ?? payload?.userId;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 3. Load user & user_roles
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true,
      },
    });

    if (!user || user.status === 'suspended') {
      throw new UnauthorizedException('Account not found or suspended');
    }

    const roleRows = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
    });

    if (!roleRows || roleRows.length === 0) {
      throw new ForbiddenException("You don't have staff access");
    }

    const roles = roleRows.map((r) => r.role as StaffRole);

    // 4. Check @Roles(...) hierarchy
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasStaffPermission(roles, requiredRoles)) {
        throw new ForbiddenException(
          'Insufficient staff permissions for this action',
        );
      }
    }

    // 5. Attach req.staff
    req.staff = {
      id: user.id,
      email: user.email,
      name: user.user_profiles?.full_name ?? user.email ?? 'Staff',
      roles,
    };

    return true;
  }
}
