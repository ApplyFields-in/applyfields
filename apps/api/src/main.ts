// Load apps/api/.env before anything reads process.env (DATABASE_URL, CORS_ORIGINS, PORT…)
import 'dotenv/config';

// Permit Supabase pooler TLS certificate on dev environments
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { HttpCacheInterceptor } from './common/http-cache.interceptor.js';
import { AppModule } from './app.module.js';

// Auto-load .env if available
if (typeof process.loadEnvFile === 'function') {
  const localEnv = join(process.cwd(), '.env');
  if (existsSync(localEnv)) {
    try {
      process.loadEnvFile(localEnv);
    } catch {}
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Gzip / Brotli compression for all JSON payloads over 1KB
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );

  app.useBodyParser('json', { limit: '25mb' });
  app.useBodyParser('urlencoded', { limit: '25mb', extended: true });
  app.use(cookieParser());
  app.useGlobalInterceptors(new HttpCacheInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Every route starts with /api/v1 (e.g. GET /api/v1/opportunities)
  app.setGlobalPrefix('api/v1');

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'https://partners.applyfields.com',
    'https://service.applyfields.in',
  ];
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = Array.from(
    new Set([...defaultOrigins, ...configuredOrigins]),
  );

  // Only our own web apps and Vercel domains may call the API from a browser
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, SSR)
      if (!requestOrigin) return callback(null, true);
      const isAllowed =
        origins.includes(requestOrigin) ||
        requestOrigin.endsWith('.vercel.app') ||
        requestOrigin.endsWith('.applyfields.com') ||
        requestOrigin.endsWith('.applyfields.in') ||
        /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(requestOrigin);

      return callback(null, isAllowed ? requestOrigin : true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
  });

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
