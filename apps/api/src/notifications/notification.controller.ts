import { Controller, Inject, Param, Post } from '@nestjs/common';
import {
  propertyNotificationTriggerSchema,
  uuidSchema,
} from '@property-assistant/types';
import { parseRequest } from '../common/request.js';
import { NotificationService } from './notification.service.js';

@Controller('internal/notifications')
export class NotificationController {
  constructor(
    @Inject(NotificationService)
    private readonly notifications: NotificationService,
  ) {}

  @Post('properties/:propertyId')
  notifyProperty(@Param('propertyId') propertyId: string) {
    return this.notifications.notifyNewProperty(
      parseRequest(propertyNotificationTriggerSchema, {
        propertyId: parseRequest(uuidSchema, propertyId),
      }),
    );
  }
}
