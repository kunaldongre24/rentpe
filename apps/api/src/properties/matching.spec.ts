import { describe, expect, it } from 'vitest';
import { propertySearchWeights } from '@property-assistant/config';
import { rankProperties } from './matching.js';

const search = {
  city: 'Bengaluru',
  locality: 'HSR Layout',
  min_rent: null,
  max_rent: 35000,
  bhk: 2,
  available_from: '2030-01-01',
  furnishing: null,
};

const property = {
  id: 'property-1',
  city: 'Bengaluru',
  locality: 'HSR Layout',
  rent: 30000,
  bhk: 2,
  available_from: '2030-01-01',
  furnishing: 'semi_furnished',
  quality_score: 90,
  freshness_score: 90,
};

describe('rankProperties', () => {
  it('ranks stronger soft matches first and explains the score', () => {
    const result = rankProperties(
      search,
      [
        property,
        {
          ...property,
          id: 'property-2',
          rent: 35000,
          quality_score: 0,
          freshness_score: 0,
        },
      ],
      propertySearchWeights,
    );
    expect(result[0]?.property.id).toBe('property-1');
    expect(result[0]?.score).toBeGreaterThan(result[1]?.score ?? 0);
    expect(result[0]?.explanation).toContain('Matches requested location');
  });

  it('does not make a hard-filter mismatch eligible', () => {
    const result = rankProperties(
      search,
      [{ ...property, id: 'wrong-bhk', bhk: 1 }],
      propertySearchWeights,
    );
    expect(result).toHaveLength(0);
  });
});
