import { Inject, Injectable } from '@nestjs/common';
import type {
  BrokerCreate,
  BrokerUpdate,
  Pagination,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class BrokersRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(p: Pagination) {
    return this.database.client
      .selectFrom('brokers')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(p.limit)
      .offset(p.offset)
      .execute();
  }
  findById(id: string) {
    return this.database.client
      .selectFrom('brokers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  create(i: BrokerCreate) {
    return this.database.client
      .insertInto('brokers')
      .values({
        name: i.name,
        company: i.company ?? null,
        phone: i.phone,
        normalized_phone: i.phone.toLowerCase(),
        phone_number: i.phone,
        verification_status: i.verificationStatus,
        active: i.active,
        response_score: i.responseScore,
        response_rate: i.responseRate,
        response_time_minutes: i.responseTimeMinutes ?? null,
        quality_score: i.qualityScore,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  update(id: string, i: BrokerUpdate) {
    return this.database.client
      .updateTable('brokers')
      .set({
        ...(i.name !== undefined ? { name: i.name } : {}),
        ...(i.company !== undefined ? { company: i.company } : {}),
        ...(i.phone
          ? {
              phone: i.phone,
              normalized_phone: i.phone.toLowerCase(),
              phone_number: i.phone,
            }
          : {}),
        ...(i.verificationStatus !== undefined
          ? { verification_status: i.verificationStatus }
          : {}),
        ...(i.active !== undefined ? { active: i.active } : {}),
        ...(i.responseScore !== undefined
          ? { response_score: i.responseScore }
          : {}),
        ...(i.responseRate !== undefined
          ? { response_rate: i.responseRate }
          : {}),
        ...(i.responseTimeMinutes !== undefined
          ? { response_time_minutes: i.responseTimeMinutes }
          : {}),
        ...(i.qualityScore !== undefined
          ? { quality_score: i.qualityScore }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async remove(id: string) {
    const r = await this.database.client
      .deleteFrom('brokers')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(r.numDeletedRows) > 0;
  }
}
