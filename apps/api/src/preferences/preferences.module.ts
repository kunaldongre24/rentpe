import { Module } from '@nestjs/common';
import { PreferenceController } from './preference.controller.js';
import { PreferenceRepository } from './preference.repository.js';
import { PreferenceService } from './preference.service.js';

@Module({
  controllers: [PreferenceController],
  providers: [PreferenceRepository, PreferenceService],
  exports: [PreferenceRepository, PreferenceService],
})
export class PreferencesModule {}
