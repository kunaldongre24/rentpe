import { describe, expect, it } from 'vitest';
import { applySemanticBoost } from './semantic-ranking.js';

describe('semantic ranking boundary', () => {
  it('applies semantic scores only as a bounded post-filter boost', () => {
    const results = applySemanticBoost(
      [
        { property: { id: 'a' }, score: 80, explanation: [] },
        { property: { id: 'b' }, score: 85, explanation: [] },
      ],
      [1, 0],
      5,
    );
    expect(results[0]?.property.id).toBe('a');
    expect(results[0]?.explanation).toContain('Strong semantic match');
  });
});
