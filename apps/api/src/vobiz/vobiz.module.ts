import { Module } from '@nestjs/common';
import { VobizWebhookController } from './vobiz-webhook.controller.js';

@Module({
  controllers: [VobizWebhookController],
})
export class VobizModule {}
