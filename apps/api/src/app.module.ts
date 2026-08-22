import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { BrokersModule } from './brokers/brokers.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { RequirementsModule } from './requirements/requirements.module.js';
import { UsersModule } from './users/users.module.js';
import { VoiceModule } from './voice/voice.module.js';
import { WhatsAppModule } from './whatsapp/whatsapp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    VoiceModule,
    WhatsAppModule,
    LocationsModule,
    BrokersModule,
    PropertiesModule,
    NotificationsModule,
    RequirementsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
