import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PropertiesController } from './properties.controller.js';
import { PropertySearchService } from './property-search.service.js';
import { PropertiesService } from './properties.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertySearchService],
})
export class PropertiesModule {}
