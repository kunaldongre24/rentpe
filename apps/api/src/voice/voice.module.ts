import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import { RequirementsModule } from '../requirements/requirements.module.js';
import { UsersModule } from '../users/users.module.js';
import { VoiceToolsController } from './voice-tools.controller.js';
import { VoiceToolsService } from './voice-tools.service.js';

@Module({
  imports: [DatabaseModule, UsersModule, RequirementsModule, PropertiesModule],
  controllers: [VoiceToolsController],
  providers: [VoiceToolsService],
})
export class VoiceModule {}
