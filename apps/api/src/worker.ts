// Background worker: the API without HTTP. Runs the push queue consumer (and any scheduler left on).
// Render background worker → start command `node dist/worker.js` (from apps/api), same env as the API
// plus SCHEDULERS=off for a push-only worker; set PUSH_WORKER=off on the API so it only enqueues.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  console.log('[ApplyFields worker] running');
}

void bootstrap();
