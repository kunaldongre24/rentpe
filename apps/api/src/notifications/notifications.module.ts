import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [DatabaseModule, PropertiesModule, WhatsAppModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationsModule {}
