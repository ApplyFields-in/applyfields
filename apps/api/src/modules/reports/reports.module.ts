import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ReportsAdminController } from './reports-admin.controller.js';
import { ReportsController, SupportController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  controllers: [ReportsController, SupportController, ReportsAdminController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
