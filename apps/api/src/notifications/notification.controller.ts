import {
  Controller,
  Headers,
  Inject,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
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
  notifyProperty(
    @Param('propertyId') propertyId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const expected = process.env.INTERNAL_API_TOKEN;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    if (!expected || token !== expected)
      throw new UnauthorizedException('Invalid internal tool token');
    return this.notifications.notifyNewProperty(
      parseRequest(propertyNotificationTriggerSchema, {
        propertyId: parseRequest(uuidSchema, propertyId),
      }),
    );
  }
}
