import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { CacheService } from '../common/cache.service.js';

/** Global: every module can inject PrismaService and CacheService without importing this module. */
@Global()
@Module({
  providers: [PrismaService, CacheService],
  exports: [PrismaService, CacheService],
})
export class PrismaModule {}

