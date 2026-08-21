import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';

function chain(result: unknown) {
  const query = {
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    offset: vi.fn(() => query),
    selectAll: vi.fn(() => query),
    select: vi.fn(() => query),
    returningAll: vi.fn(() => query),
    returning: vi.fn(() => query),
    set: vi.fn(() => query),
    execute: vi.fn().mockResolvedValue(result),
    executeTakeFirst: vi.fn().mockResolvedValue(result),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(result),
  };
  return query;
}

describe('PropertiesService', () => {
  it('excludes deleted properties from collection reads', async () => {
    const query = chain([]);
    const database = {
      client: {
        selectFrom: vi.fn(() => query),
      },
    };
    await new PropertiesService(database as never).list({
      limit: 10,
      offset: 0,
    });
    expect(query.where).toHaveBeenCalledWith('status', '!=', 'DELETED');
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
  });

  it('soft deletes a property and reports missing records', async () => {
    const query = chain(undefined);
    const database = {
      client: {
        updateTable: vi.fn(() => query),
      },
    };
    await expect(
      new PropertiesService(database as never).remove(
        '00000000-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(query.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DELETED' }),
    );
  });
});
