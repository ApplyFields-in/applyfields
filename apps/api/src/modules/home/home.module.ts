import { Module } from '@nestjs/common';
import { OpportunitiesModule } from '../opportunities/opportunities.module.js';
import { HomeController } from './home.controller.js';

@Module({ imports: [OpportunitiesModule], controllers: [HomeController] })
export class HomeModule {}
