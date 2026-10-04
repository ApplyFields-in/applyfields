import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller.js';

@Module({ controllers: [OpportunitiesController] })
export class OpportunitiesModule {}
