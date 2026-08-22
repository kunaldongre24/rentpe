import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import type { PropertySearchQuery } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PropertySearchService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async search(searchId: string, query: PropertySearchQuery) {
    const search = await this.database.client
      .selectFrom('property_searches')
      .selectAll()
      .where('id', '=', searchId)
      .executeTakeFirst();
    if (!search) throw new NotFoundException('Search not found');

    let properties = this.database.client
      .selectFrom('properties')
      .selectAll()
      .where('status', '=', 'ACTIVE');
    if (search.city != null)
      properties = properties.where('city', '=', search.city);
    if (search.locality != null)
      properties = properties.where('locality', '=', search.locality);
    if (search.property_type != null)
      properties = properties.where('property_type', '=', search.property_type);
    if (search.bhk != null)
      properties = properties.where('bhk', '=', search.bhk);
    if (search.min_rent != null)
      properties = properties.where('rent', '>=', search.min_rent);
    if (search.max_rent != null)
      properties = properties.where('rent', '<=', search.max_rent);
    if (search.min_area != null)
      properties = properties.where('area', '>=', search.min_area);
    if (search.max_area != null)
      properties = properties.where('area', '<=', search.max_area);
    if (search.furnishing != null)
      properties = properties.where('furnishing', '=', search.furnishing);
    if (search.available_from != null)
      properties = properties.where(
        'available_from',
        '>=',
        search.available_from,
      );

    const latitude =
      query.latitude ??
      (search.latitude == null ? undefined : Number(search.latitude));
    const longitude =
      query.longitude ??
      (search.longitude == null ? undefined : Number(search.longitude));
    if (latitude != null && longitude != null) {
      properties = properties.where(
        sql<boolean>`ST_DWithin(
          properties.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${query.radiusMeters}
        )`,
        '=',
        true,
      );
    }

    const rows = await properties
      .orderBy('created_at', 'desc')
      .limit(query.limit)
      .offset(query.offset)
      .execute();
    return { search, properties: rows };
  }
}
