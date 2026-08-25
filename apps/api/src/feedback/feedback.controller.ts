import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { propertyFeedbackSchema } from '@property-assistant/types';
import { ProductionAdminGuard } from '../auth/role.guards.js';
import { parseRequest } from '../common/request.js';
import { FeedbackService } from './feedback.service.js';

@Controller('feedback')
@UseGuards(ProductionAdminGuard)
export class FeedbackController {
  constructor(
    @Inject(FeedbackService) private readonly feedback: FeedbackService,
  ) {}

  @Post('properties')
  record(@Body() body: unknown) {
    return this.feedback.record(parseRequest(propertyFeedbackSchema, body));
  }
}
