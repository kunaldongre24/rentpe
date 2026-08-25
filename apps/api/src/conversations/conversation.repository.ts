import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import type {
  CallSessionCreate,
  CallSessionUpdate,
  ConversationEventCreate,
  ConversationListQuery,
  Pagination,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class ConversationRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  listSessions(pagination: Pagination) {
    return this.database.client
      .selectFrom('call_sessions')
      .selectAll()
      .orderBy('started_at', 'desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }
  findSession(id: string) {
    return this.database.client
      .selectFrom('call_sessions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  createSession(input: CallSessionCreate) {
    return this.database.client
      .insertInto('call_sessions')
      .values({
        user_id: input.userId,
        provider: input.provider,
        provider_call_id: input.providerCallId,
        started_at: input.startedAt,
        status: input.status,
        metadata: JSON.stringify(input.metadata),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  updateSession(id: string, input: CallSessionUpdate) {
    return this.database.client
      .updateTable('call_sessions')
      .set({
        ...(input.endedAt !== undefined ? { ended_at: input.endedAt } : {}),
        ...(input.durationSeconds !== undefined
          ? { duration_seconds: input.durationSeconds }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.transcriptReference !== undefined
          ? { transcript_reference: input.transcriptReference }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: JSON.stringify(input.metadata) }
          : {}),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async removeSession(id: string) {
    const result = await this.database.client
      .deleteFrom('call_sessions')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
  listEvents(query: ConversationListQuery) {
    let statement = this.database.client
      .selectFrom('conversation_events')
      .selectAll();
    if (query.userId) statement = statement.where('user_id', '=', query.userId);
    if (query.callSessionId)
      statement = statement.where('call_session_id', '=', query.callSessionId);
    if (query.searchId)
      statement = statement.where('search_id', '=', query.searchId);
    return statement
      .orderBy('occurred_at', 'asc')
      .limit(query.limit)
      .offset(query.offset)
      .execute();
  }
  createEvent(input: ConversationEventCreate) {
    return this.database.client
      .insertInto('conversation_events')
      .values({
        call_session_id: input.callSessionId ?? null,
        user_id: input.userId,
        search_id: input.searchId ?? null,
        event_type: input.eventType,
        speaker: input.speaker,
        transcript: input.transcript,
        structured_data: JSON.stringify(input.structuredData),
        role: input.speaker,
        content: input.transcript,
        metadata: JSON.stringify(input.structuredData),
        ...(input.occurredAt
          ? { occurred_at: sql`cast(${input.occurredAt} as timestamptz)` }
          : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
