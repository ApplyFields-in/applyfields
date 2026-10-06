import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Protects every /admin endpoint.
 *
 * TEMPORARY: staff login isn't built yet, so this only allows requests in local development and
 * blocks everything when NODE_ENV=production (staging / prod), so unreviewed drafts never leak.
 *
 * TODO (Karthik — staff login): replace with the real check: a valid access token AND a
 * user_roles row with role super_admin, admin or reviewer. Return 401 when not logged in, 403 when not staff.
 */
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('The Internal Portal API is disabled until staff login is built.');
    }
    return true;
  }
}
