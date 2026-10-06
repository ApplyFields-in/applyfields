import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

const { Pool } = pg;

export * from '../generated/prisma/client.js';

/** One shared database client for the whole API (Prisma 7 + the pg driver with SSL tolerance). */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private pool: pg.Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end().catch(() => {});
  }
}
