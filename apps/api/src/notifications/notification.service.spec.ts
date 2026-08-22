import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service.js';

describe('NotificationService', () => {
  it('does not notify inactive properties', async () => {
    const query = {
      leftJoin: vi.fn(() => query),
      select: vi.fn(() => query),
      where: vi.fn(() => query),
      executeTakeFirst: vi
        .fn()
        .mockResolvedValue({ id: 'property-1', status: 'RENTED' }),
    };
    const database = { client: { selectFrom: vi.fn(() => query) } };
    const result = await new NotificationService(
      database as never,
      {} as never,
      {} as never,
    ).notifyNewProperty({ propertyId: 'property-1' });
    expect(result).toEqual({ eligible: 0, sent: 0 });
  });
});
