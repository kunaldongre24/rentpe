import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CallSessionCreate,
  CallSessionUpdate,
  ConversationEventCreate,
  ConversationListQuery,
  Pagination,
} from '@property-assistant/types';
import { ConversationRepository } from './conversation.repository.js';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(ConversationRepository)
    private readonly repository: ConversationRepository,
  ) {}
  listSessions(pagination: Pagination) {
    return this.repository.listSessions(pagination);
  }
  async getSession(id: string) {
    const session = await this.repository.findSession(id);
    if (!session) throw new NotFoundException('Call session not found');
    return session;
  }
  createSession(input: CallSessionCreate) {
    return this.repository.createSession(input);
  }
  async updateSession(id: string, input: CallSessionUpdate) {
    const session = await this.repository.updateSession(id, input);
    if (!session) throw new NotFoundException('Call session not found');
    return session;
  }
  async removeSession(id: string) {
    if (!(await this.repository.removeSession(id)))
      throw new NotFoundException('Call session not found');
  }
  listEvents(query: ConversationListQuery) {
    return this.repository.listEvents(query);
  }
  createEvent(input: ConversationEventCreate) {
    return this.repository.createEvent(input);
  }
}
