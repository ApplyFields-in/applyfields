import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { TypesenseService } from './typesense.service.js';

@Module({
  controllers: [SearchController],
  providers: [SearchService, TypesenseService],
  exports: [SearchService, TypesenseService],
})
export class SearchModule {}
