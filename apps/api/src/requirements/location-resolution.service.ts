import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import type { LocationResolve } from '@property-assistant/types';
import { DatabaseService } from '../database/database.service.js';

export interface LocationCandidate {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  matchedBy: 'canonical' | 'alias';
  confidence: number;
}

export interface LocationRow {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  matched_by: 'canonical' | 'alias';
}

export function classifyLocationRows(rows: LocationRow[]) {
  const candidates: LocationCandidate[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    matchedBy: row.matched_by,
    confidence: row.matched_by === 'canonical' ? 0.99 : 0.96,
  }));
  if (candidates.length === 0)
    return { status: 'UNKNOWN' as const, confidence: 0, candidates: [] };
  if (candidates.length > 1)
    return {
      status: 'AMBIGUOUS' as const,
      confidence: Math.max(...candidates.map((item) => item.confidence)) - 0.2,
      candidates,
    };
  return {
    status: 'KNOWN' as const,
    confidence: candidates[0]!.confidence,
    location: candidates[0],
    candidates,
  };
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

@Injectable()
export class LocationResolutionService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async resolve(input: LocationResolve) {
    const query = normalize(input.query);
    const context = input.cityContext?.trim();
    const result = await sql<LocationRow>`
      select id, name, city::text, state::text, country::text, latitude::text, longitude::text,
        case when lower(regexp_replace(name, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
          or lower(regexp_replace(locality::text, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
          or lower(regexp_replace(normalized_name::text, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
        then 'canonical' else 'alias' end matched_by
      from locations
      where (
        lower(regexp_replace(name, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
        or lower(regexp_replace(locality::text, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
        or lower(regexp_replace(normalized_name::text, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
        or exists (
          select 1 from jsonb_array_elements_text(aliases) alias
          where lower(regexp_replace(alias, '[^a-zA-Z0-9]+', ' ', 'g')) = ${query}
        )
      )
      and (${context ?? null}::text is null or city = ${context ?? null})
      order by name, city
      limit 10
    `.execute(this.database.client);
    return classifyLocationRows(result.rows);
  }
}
