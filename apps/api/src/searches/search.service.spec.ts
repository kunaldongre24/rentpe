import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { SearchService } from './search.service.js';

describe('SearchService', () => {
  it('delegates list and create to the repository', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'search-1' }),
    };
    const service = new SearchService(repository as never);
    await expect(service.list({ limit: 10, offset: 0 })).resolves.toEqual([]);
    await expect(
      service.create({
        userId: '00000000-0000-4000-8000-000000000001',
        expiresAt: null,
      }),
    ).resolves.toEqual({ id: 'search-1' });
    expect(repository.list).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it('maps missing searches to NotFoundException', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(undefined) };
    await expect(
      new SearchService(repository as never).get('search-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
