import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createHmac } from 'node:crypto';
import {
  whatsappWebhookSchema,
  isShowMoreCommand,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import type { WebhookRequest } from '../main.js';
import { WhatsAppDeliveryService } from './whatsapp-delivery.service.js';

@Controller('webhooks/whatsapp')
@Throttle({ default: { limit: 10, ttl: 10_000 } })
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly delivery: WhatsAppDeliveryService) {}

  @Post()
  async receive(@Req() req: WebhookRequest, @Body() body: unknown) {
    if (!this.verifySignature(req)) {
      this.logger.warn('WhatsApp webhook signature verification failed');
      return { accepted: false };
    }
    const webhook = parseRequest(whatsappWebhookSchema, body);
    if (!isShowMoreCommand(webhook.text)) return { accepted: false };
    const result = await this.delivery.deliverNext(webhook.from);
    return { accepted: true, ...result };
  }

  private verifySignature(req: WebhookRequest): boolean {
    const apiKey = process.env.GUPSHUP_API_KEY;
    if (!apiKey) return true;
    const signature = req.headers['x-gupshup-signature'] as string | undefined;
    if (!signature) return false;
    const rawBody = req.rawBody;
    if (!rawBody) return false;
    const expected = createHmac('sha256', apiKey)
      .update(rawBody)
      .digest('base64');
    return signature === expected;
  }
}
