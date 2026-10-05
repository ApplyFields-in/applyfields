import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Every route starts with /api/v1 (e.g. GET /api/v1/opportunities)
  app.setGlobalPrefix('api/v1');

  // Only our own web apps may call the API from a browser
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
