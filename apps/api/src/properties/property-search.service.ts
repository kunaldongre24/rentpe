import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import { propertySearchWeights } from '@property-assistant/config';
import type { PropertySearchQuery } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';
import { rankProperties } from './matching.js';

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

    const behavioralRows = await this.database.client
      .selectFrom('behavioral_preferences')
      .select(['preference_key', 'value'])
      .where('user_id', '=', search.user_id)
      .where('search_id', '=', searchId)
      .execute();
    const behavioralPreferences = behavioralRows.map((row) => ({
      key: row.preference_key,
      value: row.value,
    }));

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
        sql<boolean>`ST_DWithin(properties.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${query.radiusMeters})`,
        '=',
        true,
      );
    }

    const rows = await properties
      .orderBy('created_at', 'desc')
      .limit(1000)
      .execute();
    const ranked = rankProperties(
      search,
      rows,
      propertySearchWeights,
      behavioralPreferences,
    );
    return {
      search,
      total: ranked.length,
      properties: ranked
        .slice(query.offset, query.offset + query.limit)
        .map(({ property, ...match }) => ({ ...property, ...match })),
    };
  }
}
