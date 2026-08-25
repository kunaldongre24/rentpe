import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';

describe('PropertiesService', () => {
  it('delegates collection reads to the repository', async () => {
    const repository = { list: vi.fn().mockResolvedValue([]) };
    await expect(
      new PropertiesService(repository as never).list({ limit: 10, offset: 0 }),
    ).resolves.toEqual([]);
    expect(repository.list).toHaveBeenCalledWith({ limit: 10, offset: 0 });
  });

  it('soft deletes a property and reports missing records', async () => {
    const repository = { softDelete: vi.fn().mockResolvedValue(undefined) };
    await expect(
      new PropertiesService(repository as never).remove('property-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
