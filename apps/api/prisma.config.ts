// Prisma CLI settings (Prisma 7). Used by `pnpm db:pull` / `pnpm db:generate`.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // direct (non-pooled) connection for reading the database structure
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
});
