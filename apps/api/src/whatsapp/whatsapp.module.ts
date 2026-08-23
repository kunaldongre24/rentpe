import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PropertiesModule } from '../properties/properties.module.js';
import {
  WhatsAppDeliveryService,
  WHATSAPP_PROVIDER,
} from './whatsapp-delivery.service.js';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller.js';
import { createWhatsAppProvider } from './whatsapp.provider.js';

@Module({
  imports: [DatabaseModule, PropertiesModule],
  controllers: [WhatsAppWebhookController],
  providers: [
    WhatsAppDeliveryService,
    {
      provide: WHATSAPP_PROVIDER,
      useFactory: createWhatsAppProvider,
    },
  ],
  exports: [WhatsAppDeliveryService, WHATSAPP_PROVIDER],
})
export class WhatsAppModule {}
