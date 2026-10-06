import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

const { Pool } = pg;

export * from '../generated/prisma/client.js';

/** One shared database client for the whole API (Prisma 7 + the pg driver with SSL tolerance). */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: pg.Pool;

  constructor() {
    const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const connectionString = rawUrl ? rawUrl.replace(/[?&]sslmode=[^&]+/g, '') : undefined;
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 120000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    try {
      // Warm up connection pool immediately on startup so first user requests are instant
      await this.$queryRaw`SELECT 1`;
    } catch (err: any) {
      console.warn('[PrismaService] Warm-up ping failed:', err?.message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end().catch(() => {});
  }
}
