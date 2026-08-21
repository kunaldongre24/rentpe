import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('reports the API and database as healthy', async () => {
    const result = await new HealthController({
      check: vi.fn().mockResolvedValue(undefined),
    } as never).getHealth();
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        api: 'healthy',
        database: 'healthy',
      }),
    );
  });

  it('throws a 503 response when the database is unavailable', async () => {
    try {
      await new HealthController({
        check: vi.fn().mockRejectedValue(new Error('offline')),
      } as never).getHealth();
      throw new Error('Expected getHealth to throw');
    } catch (error: unknown) {
      expect(error).toMatchObject({ status: 503 });
      expect((error as { getResponse(): unknown }).getResponse()).toMatchObject(
        {
          status: 'degraded',
          api: 'healthy',
          database: 'unavailable',
        },
      );
    }
  });
});
