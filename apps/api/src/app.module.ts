import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, HomeModule, OpportunitiesModule, AdminModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
