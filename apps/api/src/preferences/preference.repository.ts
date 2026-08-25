import { Inject, Injectable } from '@nestjs/common';
import type {
  PreferenceCreate,
  PreferenceListQuery,
  PreferenceUpdate,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PreferenceRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(query: PreferenceListQuery) {
    let statement = this.database.client
      .selectFrom('behavioral_preferences')
      .selectAll();
    if (query.userId) statement = statement.where('user_id', '=', query.userId);
    if (query.searchId)
      statement = statement.where('search_id', '=', query.searchId);
    return statement
      .orderBy('updated_at', 'desc')
      .limit(query.limit)
      .offset(query.offset)
      .execute();
  }
  findById(id: string) {
    return this.database.client
      .selectFrom('behavioral_preferences')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  create(input: PreferenceCreate) {
    return this.database.client
      .insertInto('behavioral_preferences')
      .values({
        user_id: input.userId,
        search_id: input.searchId ?? null,
        preference_key: input.key,
        value: JSON.stringify(input.value),
        confidence: input.confidence,
        evidence_count: input.evidenceCount,
        source: input.source,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  update(id: string, input: PreferenceUpdate) {
    return this.database.client
      .updateTable('behavioral_preferences')
      .set({
        ...(input.value !== undefined
          ? { value: JSON.stringify(input.value) }
          : {}),
        ...(input.confidence !== undefined
          ? { confidence: input.confidence }
          : {}),
        ...(input.evidenceCount !== undefined
          ? { evidence_count: input.evidenceCount }
          : {}),
        ...(input.source !== undefined ? { source: input.source } : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async remove(id: string) {
    const result = await this.database.client
      .deleteFrom('behavioral_preferences')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
