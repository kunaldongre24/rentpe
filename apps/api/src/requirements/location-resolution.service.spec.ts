import { describe, expect, it } from 'vitest';
import {
  classifyLocationRows,
  type LocationRow,
} from './location-resolution.service.js';

const row: LocationRow = {
  id: 'location-1',
  name: 'HSR Layout',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  latitude: '12.911600',
  longitude: '77.638900',
  matched_by: 'alias',
};

describe('classifyLocationRows', () => {
  it('returns UNKNOWN for no candidates', () => {
    expect(classifyLocationRows([])).toEqual({
      status: 'UNKNOWN',
      confidence: 0,
      candidates: [],
    });
  });

  it('returns KNOWN for one candidate', () => {
    const result = classifyLocationRows([row]);
    expect(result.status).toBe('KNOWN');
    expect(result.location?.name).toBe('HSR Layout');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('returns AMBIGUOUS for multiple candidates', () => {
    const result = classifyLocationRows([
      row,
      { ...row, id: 'location-2', city: 'Mumbai' },
    ]);
    expect(result.status).toBe('AMBIGUOUS');
    expect(result.candidates).toHaveLength(2);
  });
});
