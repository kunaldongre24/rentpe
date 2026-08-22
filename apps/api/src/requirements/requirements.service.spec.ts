import { describe, expect, it, vi } from 'vitest';
import { RequirementsService } from './requirements.service.js';

function query(first: unknown, rows: unknown[] = []) {
  const value = {
    select: vi.fn(() => value),
    selectAll: vi.fn(() => value),
    where: vi.fn(() => value),
    orderBy: vi.fn(() => value),
    insertInto: vi.fn(() => value),
    values: vi.fn(() => value),
    onConflict: vi.fn((callback: (builder: typeof value) => unknown) => {
      callback(value);
      return value;
    }),
    columns: vi.fn(() => value),
    doUpdateSet: vi.fn(() => value),
    updateTable: vi.fn(() => value),
    set: vi.fn(() => value),
    returningAll: vi.fn(() => value),
    execute: vi.fn().mockResolvedValue(rows),
    executeTakeFirst: vi.fn().mockResolvedValue(first),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(first),
  };
  return value;
}

describe('RequirementsService', () => {
  it('reports required fields as missing before collection', async () => {
    const search = { id: 'search-1', city: null };
    const database = {
      client: {
        selectFrom: vi
          .fn()
          .mockReturnValueOnce(query(search))
          .mockReturnValueOnce(query(undefined, [])),
      },
    };
    const result = await new RequirementsService(database as never).getState(
      'search-1',
    );
    expect(result.missing).toEqual([
      'city',
      'locality',
      'bhk',
      'max_rent',
      'property_type',
      'availability',
    ]);
    expect(result.ready).toBe(false);
  });

  it('classifies medium-confidence requirements for confirmation', async () => {
    const search = { id: 'search-1', city: 'Bengaluru' };
    const database = {
      client: {
        selectFrom: vi
          .fn()
          .mockReturnValueOnce(query(search))
          .mockReturnValueOnce(
            query(undefined, [
              {
                requirement_key: 'city',
                value_text: 'Bengaluru',
                value_number: null,
                value_boolean: null,
                value_json: null,
                confidence: '0.7',
                source: 'inferred',
                preference_type: 'required',
                updated_at: new Date(),
              },
            ]),
          ),
      },
    };
    const result = await new RequirementsService(database as never).getState(
      'search-1',
    );
    expect(result.needsConfirmation).toEqual(['city']);
    expect(result.needsClarification).toEqual([]);
    expect(result.missing).toContain('city');
  });
});
