import { describe, expect, it } from 'vitest';
import { voiceAgentEnvironmentSchema } from './index.js';

describe('production environment hardening', () => {
  it('rejects the development token in production', () => {
    expect(() =>
      voiceAgentEnvironmentSchema.parse({
        NODE_ENV: 'production',
        INTERNAL_API_TOKEN: 'replace-with-a-long-random-development-token',
      }),
    ).toThrow();
  });

  it('accepts a sufficiently long production token', () => {
    expect(
      voiceAgentEnvironmentSchema.parse({
        NODE_ENV: 'production',
        INTERNAL_API_TOKEN: 'a'.repeat(32),
      }).INTERNAL_API_TOKEN,
    ).toHaveLength(32);
  });
});
