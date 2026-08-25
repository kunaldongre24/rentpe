import { Inject, Injectable } from '@nestjs/common';
import type {
  Pagination,
  UserCreate,
  UserUpdate,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(pagination: Pagination) {
    return this.database.client
      .selectFrom('users')
      .select([
        'id',
        'phone',
        'normalized_phone',
        'name',
        'whatsapp_number',
        'created_at',
        'updated_at',
      ])
      .orderBy('created_at', 'desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }
  findById(id: string) {
    return this.database.client
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  create(input: UserCreate) {
    return this.database.client
      .insertInto('users')
      .values({
        phone: input.phone,
        normalized_phone: input.phone.toLowerCase(),
        phone_number: input.phone,
        name: input.name ?? null,
        whatsapp_number: input.whatsappNumber ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  update(id: string, input: UserUpdate) {
    return this.database.client
      .updateTable('users')
      .set({
        ...(input.phone
          ? {
              phone: input.phone,
              normalized_phone: input.phone.toLowerCase(),
              phone_number: input.phone,
            }
          : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.whatsappNumber !== undefined
          ? { whatsapp_number: input.whatsappNumber }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async remove(id: string) {
    const result = await this.database.client
      .deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
