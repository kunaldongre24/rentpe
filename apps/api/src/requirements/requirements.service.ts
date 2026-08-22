import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import { type Transaction } from 'kysely';
import type {
  RequirementKey,
  RequirementUpdate,
  SearchCreate,
} from '@property-assistant/types';
import type { Database } from '@property-assistant/database';
import { DatabaseService } from '../database/database.service.js';

const requiredKeys: RequirementKey[] = [
  'city',
  'locality',
  'bhk',
  'max_rent',
  'property_type',
  'availability',
];
const acceptThreshold = 0.85;
const confirmationThreshold = 0.6;

function typedValue(value: RequirementUpdate['value']) {
  return {
    value: JSON.stringify(value),
    value_text: typeof value === 'string' ? value : null,
    value_number: typeof value === 'number' ? value : null,
    value_boolean: typeof value === 'boolean' ? value : null,
    value_json: typeof value === 'object' ? JSON.stringify(value) : null,
  };
}

function stringValue(value: RequirementUpdate['value']): string {
  if (typeof value !== 'string')
    throw new BadRequestException('Requirement value must be a string');
  return value;
}

function validateKeyValue(update: RequirementUpdate): void {
  const numeric = ['bhk', 'min_rent', 'max_rent', 'metro_proximity'];
  const boolean = ['parking', 'balcony', 'gym', 'pet_friendly', 'sunlight'];
  const string = [
    'city',
    'locality',
    'property_type',
    'availability',
    'furnishing',
    'floor_preference',
  ];
  if (numeric.includes(update.key) && typeof update.value !== 'number')
    throw new BadRequestException(`${update.key} must be numeric`);
  if (boolean.includes(update.key) && typeof update.value !== 'boolean')
    throw new BadRequestException(`${update.key} must be boolean`);
  if (string.includes(update.key) && typeof update.value !== 'string')
    throw new BadRequestException(`${update.key} must be a string`);
  if (update.key === 'amenities' && !Array.isArray(update.value))
    throw new BadRequestException('amenities must be an array');
  if (
    update.key === 'bhk' &&
    (Number(update.value) < 1 || Number(update.value) > 20)
  )
    throw new BadRequestException('bhk must be between 1 and 20');
  if (
    (update.key === 'min_rent' || update.key === 'max_rent') &&
    Number(update.value) < 0
  )
    throw new BadRequestException(`${update.key} must be non-negative`);
  if (update.key === 'availability') {
    const parsed = z.iso.date().safeParse(update.value);
    if (!parsed.success)
      throw new BadRequestException('availability must be an ISO date');
  }
  if (
    update.key === 'property_type' &&
    !['apartment', 'independent_house', 'villa', 'studio'].includes(
      stringValue(update.value),
    )
  )
    throw new BadRequestException('Invalid property_type');
  if (
    update.key === 'furnishing' &&
    !['unfurnished', 'semi_furnished', 'fully_furnished'].includes(
      stringValue(update.value),
    )
  )
    throw new BadRequestException('Invalid furnishing');
}

@Injectable()
export class RequirementsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async createSearch(input: SearchCreate) {
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

  async getState(searchId: string) {
    const search = await this.database.client
      .selectFrom('property_searches')
      .selectAll()
      .where('id', '=', searchId)
      .executeTakeFirst();
    if (!search) throw new NotFoundException('Search not found');
    const rows = await this.database.client
      .selectFrom('search_requirements')
      .selectAll()
      .where('search_id', '=', searchId)
      .orderBy('requirement_key')
      .execute();
    const requirements = rows.map((row) => ({
      key: row.requirement_key,
      value:
        row.value_text ??
        (row.value_number == null ? undefined : Number(row.value_number)) ??
        row.value_boolean ??
        row.value_json,
      confidence: Number(row.confidence),
      source: row.source,
      preferenceType: row.preference_type,
      updatedAt: row.updated_at,
    }));
    const accepted = new Set(
      requirements
        .filter((item) => item.confidence >= acceptThreshold)
        .map((item) => item.key),
    );
    const needsConfirmation = requirements
      .filter(
        (item) =>
          item.confidence >= confirmationThreshold &&
          item.confidence < acceptThreshold,
      )
      .map((item) => item.key);
    const needsClarification = requirements
      .filter((item) => item.confidence < confirmationThreshold)
      .map((item) => item.key);
    const missing = requiredKeys.filter((key) => !accepted.has(key));
    return {
      search,
      requirements,
      missing,
      needsConfirmation,
      needsClarification,
      ready:
        missing.length === 0 &&
        needsConfirmation.length === 0 &&
        needsClarification.length === 0,
    };
  }

  async update(searchId: string, updates: RequirementUpdate[]) {
    await this.database.client.transaction().execute(async (trx) => {
      const search = await trx
        .selectFrom('property_searches')
        .select(['id'])
        .where('id', '=', searchId)
        .executeTakeFirst();
      if (!search) throw new NotFoundException('Search not found');
      for (const update of updates) {
        validateKeyValue(update);
        const applied = await this.upsertRequirement(trx, searchId, update);
        if (applied) await this.syncHardFilter(trx, searchId, update);
      }
      await trx
        .updateTable('property_searches')
        .set({ updated_at: new Date().toISOString() })
        .where('id', '=', searchId)
        .execute();
      const budgets = await trx
        .selectFrom('property_searches')
        .select(['min_rent', 'max_rent'])
        .where('id', '=', searchId)
        .executeTakeFirstOrThrow();
      if (
        budgets.min_rent != null &&
        budgets.max_rent != null &&
        Number(budgets.min_rent) > Number(budgets.max_rent)
      )
        throw new BadRequestException('min_rent cannot exceed max_rent');
    });
    return this.getState(searchId);
  }

  private async upsertRequirement(
    trx: Transaction<Database>,
    searchId: string,
    update: RequirementUpdate,
  ): Promise<boolean> {
    const existing = await trx
      .selectFrom('search_requirements')
      .select(['source'])
      .where('search_id', '=', searchId)
      .where('requirement_key', '=', update.key)
      .executeTakeFirst();
    if (existing?.source === 'explicit' && update.source !== 'explicit')
      return false;
    const typed = typedValue(update.value);
    await trx
      .insertInto('search_requirements')
      .values({
        search_id: searchId,
        requirement_key: update.key,
        ...typed,
        confidence: update.confidence,
        source: update.source,
        preference_type: update.preferenceType,
        updated_at: new Date().toISOString(),
      })
      .onConflict((conflict) =>
        conflict.columns(['search_id', 'requirement_key']).doUpdateSet({
          ...typed,
          confidence: update.confidence,
          source: update.source,
          preference_type: update.preferenceType,
          updated_at: new Date(),
        }),
      )
      .execute();
    return true;
  }

  private async syncHardFilter(
    trx: Transaction<Database>,
    searchId: string,
    update: RequirementUpdate,
  ): Promise<void> {
    const value = update.value;
    const accepted = update.confidence >= acceptThreshold;
    const hardValue = <T>(hard: T): T | null => (accepted ? hard : null);
    const columnValues = {
      ...(update.key === 'city' ? { city: hardValue(stringValue(value)) } : {}),
      ...(update.key === 'locality'
        ? { locality: hardValue(stringValue(value)) }
        : {}),
      ...(update.key === 'bhk' ? { bhk: hardValue(Number(value)) } : {}),
      ...(update.key === 'min_rent'
        ? {
            min_rent: hardValue(Number(value)),
            min_budget: hardValue(Number(value)),
          }
        : {}),
      ...(update.key === 'max_rent'
        ? {
            max_rent: hardValue(Number(value)),
            max_budget: hardValue(Number(value)),
          }
        : {}),
      ...(update.key === 'property_type'
        ? { property_type: hardValue(stringValue(value)) }
        : {}),
      ...(update.key === 'availability'
        ? {
            available_from: hardValue(stringValue(value)),
            move_in_date: hardValue(stringValue(value)),
          }
        : {}),
      ...(update.key === 'furnishing' && accepted
        ? { furnishing: stringValue(value) }
        : {}),
    };
    if (Object.keys(columnValues).length > 0)
      await trx
        .updateTable('property_searches')
        .set(columnValues)
        .where('id', '=', searchId)
        .execute();
  }
}
