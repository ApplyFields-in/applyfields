import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Intelligent HTTP Cache-Control header interceptor:
 * - Public GET endpoints (/opportunities, /services, /career, /partners/directory, /home) get edge & browser SWR caching.
 * - Private endpoints (/me, /bookings, /admin, /auth, or with auth cookies/headers) get strict no-store headers.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (req.method !== 'GET') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          return;
        }

        const path = req.originalUrl || req.url || '';

        // Prevent caching for personal / secure / transactional data
        const isPrivate =
          path.includes('/me') ||
          path.includes('/admin') ||
          path.includes('/auth') ||
          path.includes('/bookings') ||
          path.includes('/messages') ||
          Boolean(req.headers.authorization) ||
          Boolean(req.headers.cookie?.includes('token'));

        if (isPrivate) {
          res.setHeader(
            'Cache-Control',
            'private, no-cache, no-store, must-revalidate',
          );
          return;
        }

        // Fast Edge CDN & browser SWR cache for public content
        if (
          path.includes('/opportunities') ||
          path.includes('/partners/directory') ||
          path.includes('/services') ||
          path.includes('/career') ||
          path.includes('/home')
        ) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=30, s-maxage=120, stale-while-revalidate=86400',
          );
        }
      }),
    );
  }
}
