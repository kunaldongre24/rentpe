import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { LocationsController } from './locations.controller.js';
import { LocationsRepository } from './locations.repository.js';
import { LocationsService } from './locations.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [LocationsController],
  providers: [LocationsRepository, LocationsService],
})
export class LocationsModule {}
