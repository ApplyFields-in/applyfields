import { Module } from '@nestjs/common';
import { StorageService } from '../../common/storage.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { UsersModule } from '../users/users.module.js';
import { DigilockerAuthController } from './digilocker-auth.controller.js';
import { DigilockerController } from './digilocker.controller.js';
import { DigilockerService } from './digilocker.service.js';

@Module({
  imports: [AuthModule, DocumentsModule, UsersModule, PrismaModule],
  controllers: [DigilockerAuthController, DigilockerController],
  providers: [DigilockerService, StorageService],
  exports: [DigilockerService],
})
export class DigilockerModule {}
