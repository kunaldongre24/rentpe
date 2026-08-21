import { describe, expect, it } from 'vitest';
import { parseApiEnvironment } from './index.js';

describe('parseApiEnvironment', () => {
  it('provides local development defaults', () => {
    expect(
      parseApiEnvironment({ DATABASE_URL: 'postgresql://localhost/test' }),
    ).toMatchObject({
      API_PORT: 3001,
      NODE_ENV: 'development',
    });
  });
});
