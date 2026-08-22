import { describe, expect, it } from 'vitest';
import {
  locationResolveSchema,
  requirementBatchUpdateSchema,
  searchCreateSchema,
} from './requirements.js';

describe('requirement contracts', () => {
  it('accepts a typed batch of hard and soft requirements', () => {
    const result = requirementBatchUpdateSchema.parse({
      requirements: [
        {
          key: 'bhk',
          value: 2,
          confidence: 0.99,
          source: 'explicit',
          preferenceType: 'required',
        },
        {
          key: 'parking',
          value: true,
          confidence: 0.9,
          source: 'explicit',
          preferenceType: 'preferred',
        },
      ],
    });
    expect(result.requirements).toHaveLength(2);
  });

  it('requires a user for a search and a query for location resolution', () => {
    expect(() => searchCreateSchema.parse({})).toThrow();
    expect(locationResolveSchema.parse({ query: 'HSR' })).toEqual({
      query: 'HSR',
    });
  });
});
