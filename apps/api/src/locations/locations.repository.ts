import { Inject, Injectable } from '@nestjs/common';
import type {
  LocationCreate,
  LocationUpdate,
  Pagination,
} from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
@Injectable()
export class LocationsRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(p: Pagination) {
    return this.database.client
      .selectFrom('locations')
      .selectAll()
      .orderBy('name asc')
      .limit(p.limit)
      .offset(p.offset)
      .execute();
  }
  findById(id: string) {
    return this.database.client
      .selectFrom('locations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  create(i: LocationCreate) {
    return this.database.client
      .insertInto('locations')
      .values({
        name: i.name,
        country: i.country,
        state: i.state,
        city: i.city,
        locality: i.name,
        normalized_name: normalize(i.name),
        aliases: JSON.stringify(i.aliases),
        latitude: i.latitude,
        longitude: i.longitude,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
  update(id: string, i: LocationUpdate) {
    return this.database.client
      .updateTable('locations')
      .set({
        ...(i.name
          ? {
              name: i.name,
              locality: i.name,
              normalized_name: normalize(i.name),
            }
          : {}),
        ...(i.country !== undefined ? { country: i.country } : {}),
        ...(i.state !== undefined ? { state: i.state } : {}),
        ...(i.city !== undefined ? { city: i.city } : {}),
        ...(i.aliases !== undefined
          ? { aliases: JSON.stringify(i.aliases) }
          : {}),
        ...(i.latitude !== undefined ? { latitude: i.latitude } : {}),
        ...(i.longitude !== undefined ? { longitude: i.longitude } : {}),
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }
  async remove(id: string) {
    const r = await this.database.client
      .deleteFrom('locations')
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(r.numDeletedRows) > 0;
  }
}
