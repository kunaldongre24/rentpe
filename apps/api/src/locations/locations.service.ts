import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  LocationCreate,
  LocationUpdate,
  Pagination,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

function normalizedName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

@Injectable()
export class LocationsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async list(pagination: Pagination) {
    return this.database.client
      .selectFrom('locations')
      .selectAll()
      .orderBy('name asc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .execute();
  }

  async get(id: string) {
    const location = await this.database.client
      .selectFrom('locations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async create(input: LocationCreate) {
    return this.database.client
      .insertInto('locations')
      .values({
        name: input.name,
        country: input.country,
        state: input.state,
        city: input.city,
        locality: input.name,
        normalized_name: normalizedName(input.name),
        aliases: JSON.stringify(input.aliases),
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, input: LocationUpdate) {
    const values = {
      ...(input.name
        ? {
            name: input.name,
            locality: input.name,
            normalized_name: normalizedName(input.name),
          }
        : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.aliases !== undefined
        ? { aliases: JSON.stringify(input.aliases) }
        : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      updated_at: new Date().toISOString(),
    };
    const location = await this.database.client
      .updateTable('locations')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async remove(id: string): Promise<void> {
    const result = await this.database.client
      .deleteFrom('locations')
      .where('id', '=', id)
      .executeTakeFirst();
    if (Number(result.numDeletedRows) === 0)
      throw new NotFoundException('Location not found');
  }
}
