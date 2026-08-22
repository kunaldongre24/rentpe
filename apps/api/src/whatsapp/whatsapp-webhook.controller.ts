import { Body, Controller, Post } from '@nestjs/common';
import {
  whatsappWebhookSchema,
  isShowMoreCommand,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { WhatsAppDeliveryService } from './whatsapp-delivery.service.js';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(private readonly delivery: WhatsAppDeliveryService) {}

  @Post()
  async receive(@Body() body: unknown) {
    const webhook = parseRequest(whatsappWebhookSchema, body);
    if (!isShowMoreCommand(webhook.text)) return { accepted: false };
    const result = await this.delivery.deliverNext(webhook.from);
    return { accepted: true, ...result };
  }
}
