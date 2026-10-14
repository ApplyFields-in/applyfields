import { Module } from '@nestjs/common';
import { StorageService } from '../../common/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, StorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
