import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  Pagination,
  UserCreate,
  UserUpdate,
} from '@property-assistant/types';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async list(pagination: Pagination) {
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
      .orderBy('created_at desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }

  async get(id: string) {
    const user = await this.database.client
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(input: UserCreate) {
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

  async update(id: string, input: UserUpdate) {
    const values = {
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
    };
    const user = await this.database.client
      .updateTable('users')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.database.client
      .deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst();
    if (Number(result.numDeletedRows) === 0)
      throw new NotFoundException('User not found');
  }
}
