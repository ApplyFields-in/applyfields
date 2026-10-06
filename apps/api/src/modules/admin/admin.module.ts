import { Module } from '@nestjs/common';
import { StorageService } from '../../common/storage.service.js';
import { AdminController } from './admin.controller.js';
import { ReviewService } from './review.service.js';

@Module({ controllers: [AdminController], providers: [ReviewService, StorageService] })
export class AdminModule {}
