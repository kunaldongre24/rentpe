import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { LocationResolutionService } from './location-resolution.service.js';
import { RequirementsController } from './requirements.controller.js';
import { RequirementsService } from './requirements.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RequirementsController],
  providers: [RequirementsService, LocationResolutionService],
})
export class RequirementsModule {}
