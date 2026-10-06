// Load apps/api/.env before anything reads process.env (DATABASE_URL, CORS_ORIGINS, PORT…)
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
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

  app.useBodyParser('json', { limit: '25mb' });
  app.useBodyParser('urlencoded', { limit: '25mb', extended: true });
  app.use(cookieParser());
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
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

  // Only our own web apps may call the API from a browser
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
