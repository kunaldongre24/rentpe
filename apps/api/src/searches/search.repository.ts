import { Inject, Injectable } from '@nestjs/common';
import type {
  SearchCreate,
  SearchListQuery,
  SearchUpdate,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class SearchRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  list(query: SearchListQuery) {
    let statement = this.database.client
      .selectFrom('property_searches')
      .selectAll();
    if (query.userId) statement = statement.where('user_id', '=', query.userId);
    if (query.status) statement = statement.where('status', '=', query.status);
    return statement
      .orderBy('created_at', 'desc')
      .limit(query.limit)
      .offset(query.offset)
      .execute();
  }

  findById(id: string) {
    return this.database.client
      .selectFrom('property_searches')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  create(input: SearchCreate) {
    return this.database.client
      .insertInto('property_searches')
      .values({
        user_id: input.userId,
        intent: 'rent',
        status: 'ACTIVE',
        city: null,
        expires_at: input.expiresAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  update(id: string, input: SearchUpdate) {
    return this.database.client
      .updateTable('property_searches')
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.expiresAt !== undefined
          ? { expires_at: input.expiresAt }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.database.client
      .deleteFrom('property_searches')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
