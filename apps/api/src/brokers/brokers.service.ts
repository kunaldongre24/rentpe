import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  BrokerCreate,
  BrokerUpdate,
  Pagination,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class BrokersService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async list(pagination: Pagination) {
    return this.database.client
      .selectFrom('brokers')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }

  async get(id: string) {
    const broker = await this.database.client
      .selectFrom('brokers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!broker) throw new NotFoundException('Broker not found');
    return broker;
  }

  async create(input: BrokerCreate) {
    return this.database.client
      .insertInto('brokers')
      .values({
        name: input.name,
        company: input.company ?? null,
        phone: input.phone,
        normalized_phone: input.phone.toLowerCase(),
        phone_number: input.phone,
        verification_status: input.verificationStatus,
        active: input.active,
        response_score: input.responseScore,
        response_rate: input.responseRate,
        response_time_minutes: input.responseTimeMinutes ?? null,
        quality_score: input.qualityScore,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, input: BrokerUpdate) {
    const values = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.company !== undefined ? { company: input.company } : {}),
      ...(input.phone
        ? {
            phone: input.phone,
            normalized_phone: input.phone.toLowerCase(),
            phone_number: input.phone,
          }
        : {}),
      ...(input.verificationStatus !== undefined
        ? { verification_status: input.verificationStatus }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.responseScore !== undefined
        ? { response_score: input.responseScore }
        : {}),
      ...(input.responseRate !== undefined
        ? { response_rate: input.responseRate }
        : {}),
      ...(input.responseTimeMinutes !== undefined
        ? { response_time_minutes: input.responseTimeMinutes }
        : {}),
      ...(input.qualityScore !== undefined
        ? { quality_score: input.qualityScore }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const broker = await this.database.client
      .updateTable('brokers')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!broker) throw new NotFoundException('Broker not found');
    return broker;
  }

  async remove(id: string): Promise<void> {
    const result = await this.database.client
      .deleteFrom('brokers')
      .where('id', '=', id)
      .executeTakeFirst();
    if (Number(result.numDeletedRows) === 0)
      throw new NotFoundException('Broker not found');
  }
}
