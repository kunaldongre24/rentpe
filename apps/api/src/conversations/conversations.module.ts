import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller.js';
import { ConversationRepository } from './conversation.repository.js';
import { ConversationService } from './conversation.service.js';

@Module({
  controllers: [ConversationController],
  providers: [ConversationRepository, ConversationService],
  exports: [ConversationRepository, ConversationService],
})
export class ConversationsModule {}
