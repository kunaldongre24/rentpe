import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  callSessionCreateSchema,
  callSessionUpdateSchema,
  conversationEventCreateSchema,
  conversationListQuerySchema,
  paginationSchema,
  uuidSchema,
} from '@property-assistant/types';
import { ProductionAdminGuard } from '../auth/role.guards.js';
import { parseRequest } from '../common/request.js';
import { ConversationService } from './conversation.service.js';

@Controller()
@UseGuards(ProductionAdminGuard)
export class ConversationController {
  constructor(private readonly conversations: ConversationService) {}
  @Get('conversations/sessions') listSessions(@Query() query: unknown) {
    return this.conversations.listSessions(
      parseRequest(paginationSchema, query),
    );
  }
  @Get('conversations/sessions/:id') getSession(@Param('id') id: string) {
    return this.conversations.getSession(parseRequest(uuidSchema, id));
  }
  @Post('conversations/sessions') createSession(@Body() body: unknown) {
    return this.conversations.createSession(
      parseRequest(callSessionCreateSchema, body),
    );
  }
  @Patch('conversations/sessions/:id') updateSession(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.conversations.updateSession(
      parseRequest(uuidSchema, id),
      parseRequest(callSessionUpdateSchema, body),
    );
  }
  @Delete('conversations/sessions/:id') async removeSession(
    @Param('id') id: string,
  ): Promise<void> {
    await this.conversations.removeSession(parseRequest(uuidSchema, id));
  }
  @Get('conversations/events') listEvents(@Query() query: unknown) {
    return this.conversations.listEvents(
      parseRequest(conversationListQuerySchema, query),
    );
  }
  @Post('conversations/events') createEvent(@Body() body: unknown) {
    return this.conversations.createEvent(
      parseRequest(conversationEventCreateSchema, body),
    );
  }
}
