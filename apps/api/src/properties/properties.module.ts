import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { ListingAuditRepository } from './listing-audit.repository.js';
import { PartnerPropertiesController } from './partner-properties.controller.js';
import { PropertiesController } from './properties.controller.js';
import { PropertiesRepository } from './properties.repository.js';
import { PropertiesService } from './properties.service.js';
import { PropertySearchService } from './property-search.service.js';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PropertiesController, PartnerPropertiesController],
  providers: [
    ListingAuditRepository,
    PropertiesRepository,
    PropertiesService,
    PropertySearchService,
  ],
  exports: [PropertiesService, PropertySearchService],
})
export class PropertiesModule {}
