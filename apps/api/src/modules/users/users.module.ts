import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersStore } from './users.store.js';
import { StorageService } from '../../common/storage.service.js';

@Module({
  imports: [JwtModule],
  controllers: [UsersController],
  providers: [UsersService, UsersStore, StorageService],
  exports: [UsersService, UsersStore],
})
export class UsersModule {}
